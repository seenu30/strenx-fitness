import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Default marker values structure
interface BloodValues {
  hemoglobin?: number;
  tsh?: number;
  t3?: number;
  t4?: number;
  totalCholesterol?: number;
  ldl?: number;
  hdl?: number;
  triglycerides?: number;
  fastingGlucose?: number;
  hba1c?: number;
  vitaminD?: number;
  vitaminB12?: number;
  iron?: number;
  creatinine?: number;
}

interface BloodReport {
  id: string;
  date: string;
  labName: string;
  values: BloodValues;
  hasAbnormalValues: boolean;
  abnormalMarkers: string[];
}

export async function GET() {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: "Database connection failed" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get client ID
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: client } = await (supabase as any)
      .from("clients")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!client) {
      return NextResponse.json({ reports: [] });
    }

    // Get blood report logs
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reports, error } = await (supabase as any)
      .from("blood_report_logs")
      .select("id, report_date, lab_name, has_abnormal_values, abnormal_markers, values_encrypted")
      .eq("client_id", client.id)
      .order("report_date", { ascending: false });

    if (error) {
      console.error("Error fetching blood reports:", error);
      return NextResponse.json({ error: "Failed to fetch blood reports" }, { status: 500 });
    }

    // Transform the data
    // Note: Decryption would happen here if encryption keys are configured
    // For now, we'll return the metadata without decrypted values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedReports: BloodReport[] = (reports || []).map((report: any) => {
      // If values_encrypted exists, try to decrypt (requires MEDICAL_ENCRYPTION_KEY env var)
      const values: BloodValues = {};

      // For now, we'll show empty values since encryption requires setup
      // In production, you'd decrypt: decryptField(report.values_encrypted, "medical")

      return {
        id: report.id,
        date: report.report_date,
        labName: report.lab_name || "Unknown Lab",
        values,
        hasAbnormalValues: report.has_abnormal_values || false,
        abnormalMarkers: report.abnormal_markers || [],
      };
    });

    return NextResponse.json({ reports: formattedReports });
  } catch (error) {
    console.error("Blood reports API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
