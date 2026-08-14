/*
# Create complaints table for AIVOA Pharma QMS

1. New Tables
- `complaints`
  - `id` (uuid, primary key)
  - `product_name` (text, not null) - Product/API Name
  - `batch_number` (text, not null) - Batch/Lot Number
  - `manufacturing_site` (text, not null) - Manufacturing site
  - `complaint_source` (text, not null) - Email, PDF Report, Customer Call
  - `severity_level` (text, not null) - Severity level input
  - `description` (text, not null) - Detailed complaint description
  - `risk_level` (text) - AI-assessed risk level (Critical, Major, Minor)
  - `completeness_score` (integer) - AI completeness score 0-100
  - `complaint_summary` (text) - AI-generated summary
  - `root_cause` (text) - AI root cause analysis
  - `capa_recommendation` (text) - AI CAPA recommendation
  - `audit_notes` (text) - AI audit notes
  - `created_at` (timestamptz, default now)

2. Security
- Enable RLS on `complaints`.
- Single-tenant app (no sign-in): allow anon + authenticated full CRUD.
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  batch_number text NOT NULL,
  manufacturing_site text NOT NULL,
  complaint_source text NOT NULL,
  severity_level text NOT NULL,
  description text NOT NULL,
  risk_level text,
  completeness_score integer,
  complaint_summary text,
  root_cause text,
  capa_recommendation text,
  audit_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
CREATE POLICY "anon_select_complaints" ON complaints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "anon_insert_complaints" ON complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
CREATE POLICY "anon_update_complaints" ON complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_complaints" ON complaints;
CREATE POLICY "anon_delete_complaints" ON complaints FOR DELETE
  TO anon, authenticated USING (true);
