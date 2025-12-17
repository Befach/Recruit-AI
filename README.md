# Recruit AI

A React-based single page application that compares a Job Description against a Resume using AI.

## Features

- **Drag & Drop**: Accepts PDF, DOCX, and TXT files.
- **Client-Side Processing**: Files are parsed in the browser; only extracted text is sent to the server.
- **AI Analysis**: Connects to an n8n webhook to process text and generate a match score.
- **Visual Feedback**: Real-time progress, visual match score, and selection status.
- **Automated Email**: Triggered via n8n based on the match score.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory and add your n8n webhook URL.
   ```bash
   VITE_N8N_WEBHOOK_URL=your_n8n_production_webhook_url_here
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## n8n Workflow Configuration

To make this app work, you need an n8n workflow listening for POST requests.

**Workflow Logic:**
1. **Webhook (POST)**: Receives JSON `{ "jd_text": "...", "resume_text": "...", "email": "..." }`.
2. **AI Agent**: Prompts an LLM to compare the texts and return a JSON.
3. **Response**: Must return JSON in this format:
   ```json
   {
     "success": true,
     "data": {
       "score": 85,
       "summary": "Candidate is a great match because...",
       "match": "YES" // or "NO"
     }
   }
   ```

## Tech Stack

- React 18 + TypeScript
- Tailwind CSS
- Axios (replaced by native fetch)
- pdfjs-dist / mammoth / react-dropzone
