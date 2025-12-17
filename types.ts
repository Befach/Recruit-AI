export interface FileData {
  file: File;
  text: string;
  parsed: boolean;
  error?: string;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}

export interface AnalysisResponse {
  candidate_name: string;
  candidate_email: string;
  score: number;
  match: 'YES' | 'NO';
  status: 'SELECTED' | 'REJECTED'; // Derived from match
  summary: string;
  recommendation: string;
  key_skills_matched: string[];
  skills_missing: string[];
  analysis_breakdown: {
    technical_score: number;
    experience_score: number;
    soft_skills_score: number;
    overall_score: number;
  };
  reasoning: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
  duration?: number; // Duration in milliseconds (default: 5000)
}