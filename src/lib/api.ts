import type { Complaint, ComplaintFormInput, CopilotAssessment } from "@/types";

// Get the API URL from environment or default to localhost
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Analyze a complaint using the FastAPI backend.
 * The backend uses LangGraph + Groq to analyze the complaint.
 */
export async function analyzeComplaint(
  params: ComplaintFormInput
): Promise<CopilotAssessment> {
  console.log("📤 Sending complaint to backend:", API_URL);

  const response = await fetch(`${API_URL}/api/analyze-complaint`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_name: params.product_name,
      batch_number: params.batch_number,
      manufacturing_site: params.manufacturing_site || "",
      complaint_source: params.complaint_source || "",
      severity_level: params.severity_level || "",
      description: params.description,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Backend error:", response.status, errorText);
    throw new Error(
      `Analysis failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log("✅ Backend response received:", data);

  return {
    risk_level: data.risk_level || "Major",
    completeness_score: data.completeness_score || 50,
    complaint_summary: data.complaint_summary || "",
    root_cause: data.root_cause || "",
    capa_recommendation: data.capa_recommendation || "",
    audit_notes: data.audit_notes || "",
  } as CopilotAssessment;
}

/**
 * Check if the backend is running and healthy.
 */
export async function checkBackendConnection(): Promise<{
  connected: boolean;
  message: string;
}> {
  try {
    console.log("🔍 Checking backend connection...");
    const response = await fetch(`${API_URL}/api/health`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Backend connected:", data);
      return {
        connected: true,
        message: "Backend connected",
      };
    }

    console.error("❌ Backend error:", response.status);
    return {
      connected: false,
      message: `Error ${response.status}`,
    };
  } catch (error) {
    console.error("❌ Backend connection failed:", error);
    return {
      connected: false,
      message: "Connection failed",
    };
  }
}

/**
 * Fetch all complaints from the FastAPI backend (SQLite database).
 */
export async function fetchComplaints(): Promise<Complaint[]> {
  console.log("📥 Fetching complaints from backend...");

  try {
    const response = await fetch(`${API_URL}/api/complaints`);

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✅ Complaints fetched: ${data.length} records`);
    return (data || []) as Complaint[];
  } catch (error) {
    console.warn("⚠️ Could not fetch complaints from backend:", error);
    // Return empty array instead of crashing — backend might not be running
    return [];
  }
}

/**
 * Save a complaint and its AI analysis to the FastAPI backend (SQLite database).
 */
export async function saveComplaint(
  complaint: ComplaintFormInput,
  assessment: CopilotAssessment
): Promise<Complaint> {
  console.log("💾 Saving complaint to backend...");

  const response = await fetch(`${API_URL}/api/complaints`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_name: complaint.product_name,
      batch_number: complaint.batch_number,
      manufacturing_site: complaint.manufacturing_site,
      complaint_source: complaint.complaint_source,
      severity_level: complaint.severity_level,
      description: complaint.description,
      risk_level: assessment.risk_level,
      completeness_score: assessment.completeness_score,
      complaint_summary: assessment.complaint_summary,
      root_cause: assessment.root_cause,
      capa_recommendation: assessment.capa_recommendation,
      audit_notes: assessment.audit_notes,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Save error:", response.status, errorText);
    throw new Error(`Save failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log("✅ Complaint saved:", data);
  return data as Complaint;
}