"""
AIVOA Pharma QMS - Customer Complaint AI Copilot
FastAPI Backend with LangGraph StateGraph Workflow

This module implements the backend server for the AI-powered customer complaint
management system for the pharmaceutical manufacturing industry.

Tech Stack:
- FastAPI for the REST API server
- LangGraph StateGraph for the AI workflow orchestration
- LangChain + Groq API (model: gemma2-9b-it) for AI analysis
- SQLite for local complaint storage

Usage:
    uvicorn main:app --reload --port 8000

Environment Variables:
    GROQ_API_KEY: Your Groq API key (required for AI analysis)
"""

import json
import sqlite3
import os
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage
from typing_extensions import TypedDict

# ============================================================================
# Configuration
# ============================================================================

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = "gemma2-9b-it"
DB_PATH = "complaints.db"

# ============================================================================
# FastAPI App Setup
# ============================================================================

app = FastAPI(
    title="AIVOA Pharma QMS - Customer Complaint AI Copilot",
    description="AI-Powered Customer Complaint Management System for Pharmaceutical Manufacturing",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Data Models
# ============================================================================

class ComplaintInput(BaseModel):
    product_name: str
    batch_number: str
    manufacturing_site: str
    complaint_source: str
    severity_level: str
    description: str


class ComplaintRecord(ComplaintInput):
    id: int
    risk_level: Optional[str] = None
    completeness_score: Optional[int] = None
    complaint_summary: Optional[str] = None
    root_cause: Optional[str] = None
    capa_recommendation: Optional[str] = None
    audit_notes: Optional[str] = None
    created_at: str


class AnalysisResult(BaseModel):
    risk_level: str  # "Critical", "Major", or "Minor"
    completeness_score: int  # 0-100
    complaint_summary: str
    root_cause: str
    capa_recommendation: str
    audit_notes: str


# ============================================================================
# LangGraph State Definition
# ============================================================================

class State(TypedDict):
    input_text: str
    analysis_result: Optional[Dict[str, Any]]


# ============================================================================
# LangGraph Node: Analyze & Categorize
# ============================================================================

SYSTEM_PROMPT = """You are an expert Pharmaceutical QMS (Quality Management System) AI Copilot specializing in customer complaint analysis for pharmaceutical manufacturing (both API and Finished Dosage Forms).

Analyze the customer complaint and return a structured JSON assessment following ICH Q9 (Quality Risk Management), ICH Q10 (Pharmaceutical Quality System), and 21 CFR Part 211 (cGMP) guidelines.

Your response MUST be a valid JSON object with these exact fields:
{
  "risk_level": "Critical" | "Major" | "Minor",
  "completeness_score": <number 0-100>,
  "complaint_summary": "<concise 2-3 sentence summary>",
  "root_cause": "<probable root cause analysis based on pharma QMS standards, 2-4 sentences>",
  "capa_recommendation": "<recommended corrective and preventive actions, detailed>",
  "audit_notes": "<audit trail notes including classification rationale and regulatory references>"
}

Risk Classification Criteria:
- Critical: Patient safety risk, potential recall, sterility failure, cross-contamination, incorrect active ingredient, or GMP violation requiring immediate regulatory notification
- Major: Significant quality concern requiring investigation, OOS results, packaging integrity issues affecting stability, or process deviation with patient impact potential
- Minor: Cosmetic defects, minor documentation issues, or non-safety-related concerns with low patient impact

Completeness Score (0-100): Evaluate based on presence and quality of product identification, batch/lot, site, source, severity, detailed description, timeline, and quantity information.

Return ONLY the JSON object, no markdown formatting, no code fences, no additional text."""


def analyze_and_categorize(state: State) -> State:
    """LangGraph Node 1: Analyze the complaint text using Groq LLM and categorize risk."""

    try:
        llm = ChatGroq(
            groq_api_key=GROQ_API_KEY,
            model_name=GROQ_MODEL,
            temperature=0.3,
            max_tokens=2000,
        )

        messages = [
            SystemMessage(content=SYSTEM_PROMPT),
            HumanMessage(content=state["input_text"]),
        ]

        response = llm.invoke(messages)
        raw_text = response.content

        # Parse JSON with fallback error handling
        try:
            cleaned = raw_text.strip()
            # Strip markdown code fences if present
            if cleaned.startswith("```"):
                cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            result = json.loads(cleaned)

            # Validate and sanitize
            valid_levels = ["Critical", "Major", "Minor"]
            risk_level = result.get("risk_level", "Major")
            if risk_level not in valid_levels:
                risk_level = "Major"

            completeness = result.get("completeness_score", 50)
            if not isinstance(completeness, (int, float)):
                completeness = 50
            completeness = max(0, min(100, int(completeness)))

            analysis_result = {
                "risk_level": risk_level,
                "completeness_score": completeness,
                "complaint_summary": str(result.get("complaint_summary", "Summary unavailable.")),
                "root_cause": str(result.get("root_cause", "Root cause analysis unavailable.")),
                "capa_recommendation": str(result.get("capa_recommendation", "CAPA recommendation unavailable.")),
                "audit_notes": str(result.get("audit_notes", "Audit notes unavailable.")),
            }

        except (json.JSONDecodeError, KeyError, TypeError) as parse_err:
            # Fallback error handling - return a structured error response
            analysis_result = {
                "risk_level": "Major",
                "completeness_score": 50,
                "complaint_summary": "Unable to parse AI response. Manual review required.",
                "root_cause": f"AI response parsing failed: {str(parse_err)}. Manual root cause analysis required.",
                "capa_recommendation": "Initiate manual complaint investigation per 21 CFR 211.192. Review AI system configuration and retry analysis.",
                "audit_notes": f"AI analysis fallback triggered due to parsing error. Timestamp: {datetime.utcnow().isoformat()}.",
            }

    except Exception as e:
        # Fallback for API errors
        analysis_result = {
            "risk_level": "Major",
            "completeness_score": 50,
            "complaint_summary": "AI analysis unavailable. Manual review required.",
            "root_cause": f"AI service error: {str(e)}. Manual root cause analysis required.",
            "capa_recommendation": "Initiate manual complaint investigation per 21 CFR 211.192.",
            "audit_notes": f"AI service error fallback. Timestamp: {datetime.utcnow().isoformat()}.",
        }

    return {"analysis_result": analysis_result}


# ============================================================================
# LangGraph Workflow Construction
# ============================================================================

def build_workflow():
    """Build and compile the LangGraph StateGraph workflow."""
    workflow = StateGraph(State)

    # Add nodes
    workflow.add_node("analyze_and_categorize", analyze_and_categorize)

    # Set entry point
    workflow.set_entry_point("analyze_and_categorize")

    # Add edges
    workflow.add_edge("analyze_and_categorize", END)

    return workflow.compile()


complaint_workflow = build_workflow()


# ============================================================================
# SQLite Database Helpers
# ============================================================================

def init_db():
    """Initialize the SQLite database with the complaints table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS complaints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_name TEXT NOT NULL,
            batch_number TEXT NOT NULL,
            manufacturing_site TEXT NOT NULL,
            complaint_source TEXT NOT NULL,
            severity_level TEXT NOT NULL,
            description TEXT NOT NULL,
            risk_level TEXT,
            completeness_score INTEGER,
            complaint_summary TEXT,
            root_cause TEXT,
            capa_recommendation TEXT,
            audit_notes TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        )
    """)
    conn.commit()
    conn.close()


def save_complaint_to_db(complaint: ComplaintInput, analysis: AnalysisResult) -> ComplaintRecord:
    """Save a complaint with its AI analysis to the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO complaints (
            product_name, batch_number, manufacturing_site, complaint_source,
            severity_level, description, risk_level, completeness_score,
            complaint_summary, root_cause, capa_recommendation, audit_notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        complaint.product_name, complaint.batch_number, complaint.manufacturing_site,
        complaint.complaint_source, complaint.severity_level, complaint.description,
        analysis.risk_level, analysis.completeness_score,
        analysis.complaint_summary, analysis.root_cause,
        analysis.capa_recommendation, analysis.audit_notes,
    ))
    conn.commit()
    complaint_id = cursor.lastrowid
    conn.close()

    return ComplaintRecord(
        id=complaint_id,
        **complaint.dict(),
        risk_level=analysis.risk_level,
        completeness_score=analysis.completeness_score,
        complaint_summary=analysis.complaint_summary,
        root_cause=analysis.root_cause,
        capa_recommendation=analysis.capa_recommendation,
        audit_notes=analysis.audit_notes,
        created_at=datetime.now().isoformat(),
    )


def get_all_complaints() -> List[ComplaintRecord]:
    """Retrieve all complaints from the database."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM complaints ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()

    complaints = []
    for row in rows:
        complaints.append(ComplaintRecord(
            id=row[0],
            product_name=row[1],
            batch_number=row[2],
            manufacturing_site=row[3],
            complaint_source=row[4],
            severity_level=row[5],
            description=row[6],
            risk_level=row[7],
            completeness_score=row[8],
            complaint_summary=row[9],
            root_cause=row[10],
            capa_recommendation=row[11],
            audit_notes=row[12],
            created_at=row[13],
        ))
    return complaints


# ============================================================================
# API Endpoints
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Initialize the database on startup."""
    init_db()


@app.get("/api/health")
async def health_check():
    """Server health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/api/analyze-complaint", response_model=AnalysisResult)
async def analyze_complaint(complaint: ComplaintInput) -> AnalysisResult:
    """
    Trigger the LangGraph workflow to analyze a customer complaint.

    This endpoint runs the complaint through the AI workflow:
    1. Node: Analyze & Categorize - Uses Groq (gemma2-9b-it) to analyze
       the complaint text and return structured risk assessment.

    Returns the AI assessment with risk level, completeness score,
    summary, root cause, CAPA, and audit notes.
    """
    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY environment variable is not configured. Set it to enable AI analysis."
        )

    # Build the input text for the LLM
    input_text = f"""Please analyze the following pharmaceutical customer complaint:

Product/API Name: {complaint.product_name}
Batch/Lot Number: {complaint.batch_number}
Manufacturing Site: {complaint.manufacturing_site}
Complaint Source: {complaint.complaint_source}
Severity Level (as reported): {complaint.severity_level}

Detailed Complaint Description:
{complaint.description}

Provide the structured JSON assessment as specified."""

    # Run the LangGraph workflow
    result = complaint_workflow.invoke({"input_text": input_text})

    analysis_data = result.get("analysis_result", {})

    return AnalysisResult(
        risk_level=analysis_data.get("risk_level", "Major"),
        completeness_score=analysis_data.get("completeness_score", 50),
        complaint_summary=analysis_data.get("complaint_summary", ""),
        root_cause=analysis_data.get("root_cause", ""),
        capa_recommendation=analysis_data.get("capa_recommendation", ""),
        audit_notes=analysis_data.get("audit_notes", ""),
    )


@app.post("/api/complaints", response_model=ComplaintRecord)
async def save_complaint(payload: Dict[str, Any]) -> ComplaintRecord:
    """
    Save a new complaint with its AI analysis to the database.
    Accepts a JSON payload containing both complaint data and analysis results.
    """
    # Extract complaint data
    complaint = ComplaintInput(
        product_name=payload.get("product_name"),
        batch_number=payload.get("batch_number"),
        manufacturing_site=payload.get("manufacturing_site"),
        complaint_source=payload.get("complaint_source"),
        severity_level=payload.get("severity_level"),
        description=payload.get("description"),
    )
    
    # Extract analysis data
    analysis = AnalysisResult(
        risk_level=payload.get("risk_level", "Major"),
        completeness_score=payload.get("completeness_score", 50),
        complaint_summary=payload.get("complaint_summary", ""),
        root_cause=payload.get("root_cause", ""),
        capa_recommendation=payload.get("capa_recommendation", ""),
        audit_notes=payload.get("audit_notes", ""),
    )
    
    return save_complaint_to_db(complaint, analysis)


@app.get("/api/complaints", response_model=List[ComplaintRecord])
async def get_complaints() -> List[ComplaintRecord]:
    """Returns all logged complaints stored in the database."""
    return get_all_complaints()


# ============================================================================
# Main Entry Point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
