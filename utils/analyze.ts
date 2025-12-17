import { AnalysisResponse } from '../types';

// Safely access env variable to prevent runtime crash if environment is not set up correctly
const getN8nWebhookUrl = (): string => {
  try {
    const env = (import.meta as any).env;
    
    // Priority 1: Explicit Environment Variable
    if (env?.VITE_N8N_WEBHOOK_URL) {
      return env.VITE_N8N_WEBHOOK_URL;
    }

    // Priority 2: Development Proxy (to fix CORS)
    if (env?.DEV) {
      return '/api/analyze';
    }

    // Priority 3: Production Webhook URL
    return 'https://n8n.srv1048087.hstgr.cloud/webhook/recruit-ai';
  } catch (e) {
    console.warn('Failed to access environment variables', e);
    // Fallback if import.meta fails entirely
    return 'https://n8n.srv1048087.hstgr.cloud/webhook/recruit-ai';
  }
};

const N8N_WEBHOOK_URL = getN8nWebhookUrl();

export const analyzeJDResume = async (
  jdText: string,
  resumeText: string,
  candidateEmail?: string | null,
  signal?: AbortSignal
): Promise<AnalysisResponse> => {
  // Check for abortion before starting the request
  if (signal?.aborted) {
    throw new Error("Request cancelled");
  }

  // Validate inputs strictly to prevent server-side errors
  if (!jdText || !jdText.trim()) {
    throw new Error("Job Description text is missing or empty.");
  }
  if (!resumeText || !resumeText.trim()) {
    throw new Error("Resume text is missing or empty.");
  }

  const payload = {
    jd_text: jdText,
    resume_text: resumeText,
    email: candidateEmail || undefined,
  };

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal,
    });

    const responseText = await response.text();

    if (!response.ok) {
        // Specific handling for n8n Method errors
        if (response.status === 404 && responseText.includes("POST requests")) {
             throw new Error("Configuration Error: The n8n Webhook is rejecting POST requests. Please check your n8n workflow settings and ensure the Webhook node Method is set to 'POST'.");
        }
        
        throw new Error(`Server error: ${response.status} - ${responseText}`);
    }

    if (!responseText || !responseText.trim()) {
        throw new Error("Analysis failed: Server returned an empty response. Ensure the n8n workflow ends with a response (e.g., Respond to Webhook node).");
    }

    let json: any;
    try {
        json = JSON.parse(responseText);
    } catch (e) {
        throw new Error(`Server returned invalid JSON. Response: ${responseText.substring(0, 100)}...`);
    }

    // --- ROBUST PARSING LOGIC ---

    // 1. Unwrap Array (n8n defaults to returning an array of items)
    if (Array.isArray(json)) {
        json = json.length > 0 ? json[0] : {};
    }

    // 2. Unwrap "body" (n8n sometimes wraps output in body)
    if (json.body && typeof json.body === 'object') {
        json = json.body;
    }

    // 3. Unwrap "data" (if user wrapped it manually in their response)
    let data = json;
    if (json.data && typeof json.data === 'object') {
        // If the 'data' property contains relevant fields, use it.
        if ('score' in json.data || 'summary' in json.data || 'analysis_breakdown' in json.data) {
            data = json.data;
        }
    }

    // 4. Handle Case-Insensitive keys helper
    const getField = (obj: any, key: string) => {
        if (!obj || typeof obj !== 'object') return undefined;
        // Direct match
        if (obj[key] !== undefined) return obj[key];
        // Lowercase match
        const foundKey = Object.keys(obj).find(k => k.toLowerCase() === key.toLowerCase());
        return foundKey ? obj[foundKey] : undefined;
    };
    
    const getArray = (obj: any, key: string): string[] => {
        const val = getField(obj, key);
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') return val.split(',').map(s => s.trim());
        return [];
    };

    // Extract Score
    let score = getField(data, 'score');
    if (score === undefined) {
         // Fallback: check if the entire response is inside a property like "output" or "json" that contains the stringified JSON from LLM
         const potentialStringJson = getField(data, 'output') || getField(data, 'json') || getField(data, 'content');
         if (typeof potentialStringJson === 'string' && (potentialStringJson.trim().startsWith('{') || potentialStringJson.includes('```json'))) {
             try {
                const cleaned = potentialStringJson.replace(/```json\n?|\n?```/g, '').trim();
                const nestedJson = JSON.parse(cleaned);
                score = getField(nestedJson, 'score');
                data = nestedJson; // Switch context to nested JSON
             } catch(e) { /* ignore */ }
         }
    }

    // Normalize Score
    score = Number(score);
    if (isNaN(score)) {
        const matchVal = getField(data, 'match');
        if (matchVal === 'YES' || matchVal === true) score = 75; 
        else score = 0;
        console.warn("Could not find explicit 'score' field in response:", data);
    }

    // Extract Summary
    let summary = getField(data, 'summary');
    if (!summary) {
        summary = getField(data, 'reason') || getField(data, 'analysis') || "Analysis complete.";
    }

    // Extract Status
    let status: 'SELECTED' | 'REJECTED' = 'REJECTED';
    let matchVal = getField(data, 'match');
    let match: 'YES' | 'NO' = 'NO';

    if (matchVal !== undefined) {
        const s = String(matchVal).toLowerCase();
        if (s === 'yes' || s === 'true' || s === 'selected' || s === 'hire') {
            status = 'SELECTED';
            match = 'YES';
        }
    } else {
        if (score >= 70) {
            status = 'SELECTED';
            match = 'YES';
        }
    }

    // Extract New Fields (Robust Mapping)
    const candidate_name = getField(data, 'candidate_name') || "Candidate";
    const candidate_email = getField(data, 'candidate_email') || "";
    const recommendation = getField(data, 'recommendation') || summary;
    const reasoning = getField(data, 'reasoning') || recommendation;
    const key_skills_matched = getArray(data, 'key_skills_matched');
    const skills_missing = getArray(data, 'skills_missing');
    
    let analysis_breakdown = getField(data, 'analysis_breakdown');
    if (!analysis_breakdown || typeof analysis_breakdown !== 'object') {
        // Fallback breakdown
        analysis_breakdown = {
            technical_score: score,
            experience_score: score,
            soft_skills_score: score,
            overall_score: score
        };
    } else {
        // Ensure values exist in the object
        analysis_breakdown = {
            technical_score: Number(getField(analysis_breakdown, 'technical_score')) || 0,
            experience_score: Number(getField(analysis_breakdown, 'experience_score')) || 0,
            soft_skills_score: Number(getField(analysis_breakdown, 'soft_skills_score')) || 0,
            overall_score: Number(getField(analysis_breakdown, 'overall_score')) || score,
        };
    }

    return {
      candidate_name,
      candidate_email,
      score,
      match,
      status,
      summary: String(summary),
      recommendation: String(recommendation),
      key_skills_matched,
      skills_missing,
      analysis_breakdown,
      reasoning: String(reasoning)
    };

  } catch (error: any) {
    if (signal?.aborted || error.name === 'AbortError' || error.message === "Request cancelled") {
      throw new Error("Request cancelled");
    }
    console.error("Analysis failed. Details:", error);
    throw new Error(error.message || "Failed to analyze resume.");
  }
};