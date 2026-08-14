export type RiskLevel = "Critical" | "Major" | "Minor" | "Pending";

export type ComplaintSource = "Email" | "PDF Report" | "Customer Call" | "Field Report" | "Regulatory Authority" | "Distributor";

export interface ComplaintFormInput {
  product_name: string;
  batch_number: string;
  manufacturing_site: string;
  complaint_source: string;
  severity_level: string;
  description: string;
}

export interface CopilotAssessment {
  risk_level: RiskLevel;
  completeness_score: number;
  complaint_summary: string;
  root_cause: string;
  capa_recommendation: string;
  audit_notes: string;
  _fallback?: boolean;
  _message?: string;
}

export interface Complaint extends ComplaintFormInput {
  id: string;
  risk_level: string | null;
  completeness_score: number | null;
  complaint_summary: string | null;
  root_cause: string | null;
  capa_recommendation: string | null;
  audit_notes: string | null;
  created_at: string;
}

export interface GroqStatus {
  connected: boolean;
  checking: boolean;
  message: string;
}

export interface ServerHealth {
  healthy: boolean;
  checking: boolean;
  message: string;
}
