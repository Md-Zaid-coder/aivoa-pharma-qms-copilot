import type { ComplaintFormInput } from "@/types";

export const SAMPLE_COMPLAINTS: { label: string; data: ComplaintFormInput }[] = [
  {
    label: "Batch #B-992 Amoxicillin Impurity Excursion",
    data: {
      product_name: "Amoxicillin Trihydrate API",
      batch_number: "B-992",
      manufacturing_site: "Plant A - API Manufacturing Facility",
      complaint_source: "PDF Report",
      severity_level: "Major",
      description:
        "During routine stability testing of Batch B-992, the QC laboratory identified an impurity level of 0.45% for an unspecified related substance, exceeding the registered specification limit of 0.30%. The impurity was detected at the 12-month stability timepoint. The OOS result was confirmed through re-testing on 2024-01-15. Approximately 50,000 units of finished product manufactured from this API batch have been distributed to 3 markets. The deviation was identified during the annual product review cycle. No adverse events have been reported to date.",
    },
  },
  {
    label: "Line 4 Blister Packaging Seal Failure",
    data: {
      product_name: "Metformin HCl 500mg Tablets (FDF)",
      batch_number: "M-2024-0876",
      manufacturing_site: "Facility B - Packaging Line 4",
      complaint_source: "Customer Call",
      severity_level: "Critical",
      description:
        "A distributor reported that 3 out of 10 cartons of Metformin 500mg tablets from batch M-2024-0876 showed visible blister pack seal failures upon receipt. The blisters exhibited separation at the sealing edge, exposing tablets to ambient air. The complaint was received on 2024-02-20. The affected batch consists of 120,000 blister packs. Initial investigation suggests possible heat sealing temperature deviation on Line 4 during the night shift. This is a critical packaging integrity issue that may compromise product stability and patient safety. The product requires protection from moisture and air per the approved stability data.",
    },
  },
];
