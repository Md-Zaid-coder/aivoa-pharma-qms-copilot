# AIVOA Pharma QMS - Customer Complaint AI Copilot

## Backend (Python FastAPI + LangGraph)

The `backend/` directory contains the Python FastAPI server with LangGraph StateGraph workflow that powers the AI complaint analysis.

### Setup

```bash
cd backend
pip install -r requirements.txt
export GROQ_API_KEY="your-groq-api-key-here"
uvicorn main:app --reload --port 8000
```

### Architecture

- **FastAPI** server with full CORS (`allow_origins=["*"]`)
- **LangGraph StateGraph** workflow with:
  - `State`: `input_text`, `analysis_result`
  - `Node 1 (Analyze & Categorize)`: Uses `langchain_groq` ChatGroq with model `gemma2-9b-it`
  - Structured JSON output parsing with fallback error handling

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/analyze-complaint` | Triggers the LangGraph workflow and returns AI assessment |
| `POST` | `/api/complaints` | Saves a new complaint |
| `GET` | `/api/complaints` | Returns all logged complaints |
| `GET` | `/api/health` | Server health check |

### AI Response Structure

```json
{
  "risk_level": "Critical | Major | Minor",
  "completeness_score": 0-100,
  "complaint_summary": "string",
  "root_cause": "string",
  "capa_recommendation": "string",
  "audit_notes": "string"
}
```

## Frontend (React + Redux Toolkit)

The frontend runs on Vite and connects to the FastAPI backend. In the deployed version, AI analysis is handled by a Supabase Edge Function that proxies Groq API calls.

### Tech Stack
- React + TypeScript
- Redux Toolkit (complaintsSlice, copilotSlice)
- Tailwind CSS with Inter font
- Lucide React icons
- Supabase for data persistence
