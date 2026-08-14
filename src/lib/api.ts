import type { Complaint, ComplaintFormInput, CopilotAssessment } from "@/types";
import { supabase } from "@/lib/supabase";

interface AnalyzeParams extends ComplaintFormInput {
  groqApiKey?: string;
}

export async function analyzeComplaint(params: AnalyzeParams): Promise<CopilotAssessment> {
  // Get API key from params, localStorage, or environment variables
  const apiKey =
    params.groqApiKey ||
    localStorage.getItem("groq_api_key") ||
    import.meta.env.VITE_GROQ_API_KEY;

  // 1. Direct Call to Groq API (gemma2-9b-it)
  if (apiKey) {
    try {
      const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gemma2-9b-it",
          messages: [
            {
              role: "system",
              content:
                "You are an expert Pharmaceutical Quality Management System (QMS) AI Auditor. Analyze customer complaints and return ONLY raw JSON matching the requested fields.",
            },
            {
              role: "user",
              content: `Analyze this pharmaceutical customer complaint and return a valid JSON object.

Product: ${params.product_name}
Batch Number: ${params.batch_number}
Manufacturing Site: ${params.manufacturing_site || "N/A"}
Complaint Source: ${params.complaint_source || "N/A"}
Severity Level: ${params.severity_level || "N/A"}
Description: ${params.description}

Return ONLY a JSON object with these exact keys:
{
  "risk_level": "Critical",
  "completeness_score": 88,
  "complaint_summary": "Concise summary of the quality issue",
  "root_cause": "Probable technical root cause during manufacturing or logistics",
  "capa_recommendation": "Detailed Corrective Action and Preventive Action steps",
  "audit_notes": "QMS compliance and regulatory audit observations"
}`,
            },
          ],
          temperature: 0.2,
          response_format: { type: "json_object" },
        }),
      });

      if (groqResponse.ok) {
        const groqData = await groqResponse.json();
        const content = groqData.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          return {
            risk_level: parsed.risk_level || "Major",
            completeness_score: Number(parsed.completeness_score) || 85,
            complaint_summary: parsed.complaint_summary || "Complaint analyzed successfully.",
            root_cause: parsed.root_cause || "Unspecified root cause.",
            capa_recommendation: parsed.capa_recommendation || "Initiate standard CAPA process.",
            audit_notes: parsed.audit_notes || "Documented in QMS system.",
          };
        }
      }
    } catch (e) {
      console.warn("Direct Groq API call failed, falling back to rule engine", e);
    }
  }

  // 2. Fallback to Supabase / Rule engine if Groq call fails
  const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-complaint`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
  };

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      product_name: params.product_name,
      batch_number: params.batch_number,
      manufacturing_site: params.manufacturing_site,
      complaint_source: params.complaint_source,
      severity_level: params.severity_level,
      description: params.description,
      groq_api_key: apiKey || undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Analysis failed (${response.status})`);
  }

  const data = await response.json();
  if (data.error) throw new Error(data.error);

  return data as CopilotAssessment;
}

export async function checkGroqConnection(
  apiKey: string
): Promise<{ connected: boolean; message: string }> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      return { connected: true, message: "Connected" };
    }
    return { connected: false, message: `Error ${response.status}` };
  } catch {
    return { connected: false, message: "Connection failed" };
  }
}

export async function fetchComplaints(): Promise<Complaint[]> {
  const { data, error } = await supabase
    .from("complaints")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []) as Complaint[];
}

export async function saveComplaint(
  complaint: ComplaintFormInput,
  assessment: CopilotAssessment
): Promise<Complaint> {
  const { data, error } = await supabase
    .from("complaints")
    .insert({
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Complaint;
}