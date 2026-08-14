import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  product_name: string;
  batch_number: string;
  manufacturing_site: string;
  complaint_source: string;
  severity_level: string;
  description: string;
  groq_api_key?: string;
}

interface AnalysisResult {
  risk_level: "Critical" | "Major" | "Minor";
  completeness_score: number;
  complaint_summary: string;
  root_cause: string;
  capa_recommendation: string;
  audit_notes: string;
}

const SYSTEM_PROMPT = `You are an expert Pharmaceutical QMS (Quality Management System) AI Copilot specializing in customer complaint analysis for pharmaceutical manufacturing (both API and Finished Dosage Forms).

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

Completeness Score (0-100): Evaluate based on presence and quality of:
- Product identification (10 pts)
- Batch/lot number (10 pts)
- Manufacturing site (10 pts)
- Complaint source (10 pts)
- Severity assessment (15 pts)
- Detailed description with specifics (25 pts)
- Timeline/temporal information (10 pts)
- Quantity/extent of issue (10 pts)

Return ONLY the JSON object, no markdown formatting, no code fences, no additional text.`;

function buildUserPrompt(complaint: AnalysisRequest): string {
  return `Please analyze the following pharmaceutical customer complaint:

Product/API Name: ${complaint.product_name}
Batch/Lot Number: ${complaint.batch_number}
Manufacturing Site: ${complaint.manufacturing_site}
Complaint Source: ${complaint.complaint_source}
Severity Level (as reported): ${complaint.severity_level}

Detailed Complaint Description:
${complaint.description}

Provide the structured JSON assessment as specified.`;
}

function parseJsonResponse(text: string): AnalysisResult {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const parsed = JSON.parse(cleaned);

  const validLevels = ["Critical", "Major", "Minor"];
  const risk_level = validLevels.includes(parsed.risk_level)
    ? parsed.risk_level
    : "Major";

  const completeness_score =
    typeof parsed.completeness_score === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.completeness_score)))
      : 50;

  return {
    risk_level: risk_level as "Critical" | "Major" | "Minor",
    completeness_score,
    complaint_summary: String(parsed.complaint_summary || "Unable to generate summary."),
    root_cause: String(parsed.root_cause || "Root cause analysis unavailable."),
    capa_recommendation: String(parsed.capa_recommendation || "CAPA recommendation unavailable."),
    audit_notes: String(parsed.audit_notes || "Audit notes unavailable."),
  };
}

function fallbackAnalysis(complaint: AnalysisRequest): AnalysisResult {
  const desc = complaint.description.toLowerCase();
  const severity = complaint.severity_level.toLowerCase();

  let risk_level: "Critical" | "Major" | "Minor" = "Minor";
  if (severity.includes("critical") || desc.includes("recall") || desc.includes("patient harm") || desc.includes("adverse") || desc.includes("death") || desc.includes("contamination") || desc.includes("sterility")) {
    risk_level = "Critical";
  } else if (severity.includes("major") || desc.includes("impurity") || desc.includes("out of specification") || desc.includes("oos") || desc.includes("deviation") || desc.includes("seal failure") || desc.includes("stability")) {
    risk_level = "Major";
  }

  let score = 0;
  if (complaint.product_name) score += 10;
  if (complaint.batch_number) score += 10;
  if (complaint.manufacturing_site) score += 10;
  if (complaint.complaint_source) score += 10;
  if (complaint.severity_level) score += 15;
  if (complaint.description && complaint.description.length > 50) score += 25;
  else if (complaint.description) score += 10;
  if (desc.match(/\b\d{4}|\bjan|\bfeb|\bmar|\bapr|\bmay|\bjun|\bjul|\baug|\bsep|\boct|\bnov|\bdec|yesterday|last week|last month/)) score += 10;
  if (desc.match(/\b\d+\s*(tablets|capsules|vials|units|bottles|boxes|batches|lots)\b/)) score += 10;

  return {
    risk_level,
    completeness_score: score,
    complaint_summary: `Complaint received regarding ${complaint.product_name} (Batch ${complaint.batch_number}) from ${complaint.manufacturing_site}. The complaint was reported via ${complaint.complaint_source} with a reported severity of ${complaint.severity_level}.`,
    root_cause: `Preliminary root cause assessment indicates a potential issue related to the reported complaint for ${complaint.product_name}. Based on the available information, this may involve manufacturing process deviation, equipment malfunction, or raw material variability at ${complaint.manufacturing_site}. A formal investigation following ICH Q9 guidelines is recommended to determine the exact root cause.`,
    capa_recommendation: `1. Initiate a formal complaint investigation (CAPA) per 21 CFR 211.192 and ICH Q10.\n2. Place the affected batch ${complaint.batch_number} on quality hold pending investigation.\n3. Review batch manufacturing records and in-process controls.\n4. Conduct risk assessment using FMEA methodology.\n5. Implement containment actions to prevent distribution of potentially affected product.\n6. Trend analysis of similar complaints for the same product/site.\n7. Update SOPs and retrain personnel if a process gap is identified.`,
    audit_notes: `Complaint classified as ${risk_level} based on initial severity assessment and complaint content. Investigation required per cGMP regulations (21 CFR Part 211). Regulatory notification may be required if patient safety impact is confirmed. This assessment was generated as a fallback due to AI service unavailability and should be reviewed by a qualified QMS reviewer.`,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const complaint: AnalysisRequest = await req.json();

    // Get API key from request body or environment
    const apiKey = complaint.groq_api_key || Deno.env.get("GROQ_API_KEY");

    if (!apiKey) {
      const result = fallbackAnalysis(complaint);
      return new Response(
        JSON.stringify({ ...result, _fallback: true, _message: "No Groq API key configured. Using rule-based fallback analysis." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userPrompt = buildUserPrompt(complaint);

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gemma2-9b-it",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error("Groq API error:", groqResponse.status, errorText);
      const result = fallbackAnalysis(complaint);
      return new Response(
        JSON.stringify({ ...result, _fallback: true, _message: `Groq API error (${groqResponse.status}). Using rule-based fallback analysis.` }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const groqData = await groqResponse.json();
    const aiText = groqData.choices?.[0]?.message?.content || "";

    let result: AnalysisResult;
    try {
      result = parseJsonResponse(aiText);
    } catch {
      console.error("Failed to parse AI response as JSON:", aiText);
      result = fallbackAnalysis(complaint);
      return new Response(
        JSON.stringify({ ...result, _fallback: true, _message: "AI response parsing failed. Using rule-based fallback analysis." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
