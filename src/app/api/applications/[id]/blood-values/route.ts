import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

// Blood values validation schema
const bloodValuesSchema = z.object({
  // CBC
  hemoglobin: z.number().min(0).max(30).optional(),
  rbc: z.number().min(0).max(10).optional(),
  wbc: z.number().min(0).max(100).optional(),
  platelets: z.number().min(0).max(1000).optional(),
  // Thyroid
  tsh: z.number().min(0).max(100).optional(),
  t3: z.number().min(0).max(500).optional(),
  t4: z.number().min(0).max(30).optional(),
  // Lipid Profile
  totalCholesterol: z.number().min(0).max(500).optional(),
  ldl: z.number().min(0).max(300).optional(),
  hdl: z.number().min(0).max(150).optional(),
  triglycerides: z.number().min(0).max(1000).optional(),
  // Diabetes
  fastingGlucose: z.number().min(0).max(500).optional(),
  hba1c: z.number().min(0).max(20).optional(),
  // Vitamins
  vitaminD: z.number().min(0).max(200).optional(),
  vitaminB12: z.number().min(0).max(2000).optional(),
  iron: z.number().min(0).max(300).optional(),
  ferritin: z.number().min(0).max(1000).optional(),
  // Liver
  sgot: z.number().min(0).max(500).optional(),
  sgpt: z.number().min(0).max(500).optional(),
  // Kidney
  creatinine: z.number().min(0).max(20).optional(),
  uricAcid: z.number().min(0).max(20).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate blood values
    const validation = bloodValuesSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid blood values", details: validation.error.issues },
        { status: 400 }
      );
    }

    // Verify coach authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a coach or admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (!userProfile || !["coach", "admin"].includes(userProfile.role)) {
      return NextResponse.json(
        { error: "Only coaches can enter blood values" },
        { status: 403 }
      );
    }

    // Use admin client to update application
    const adminClient = createAdminClient();

    // Get current application to check status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (adminClient as any)
      .from("client_applications")
      .select("id, status, blood_report_values")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Don't allow editing if application is rejected
    if (application.status === "rejected") {
      return NextResponse.json(
        { error: "Cannot edit blood values for rejected applications" },
        { status: 400 }
      );
    }

    // Prepare blood values with metadata
    const bloodValues = {
      ...validation.data,
      enteredBy: user.id,
      enteredAt: new Date().toISOString(),
    };

    // Update application with blood values
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (adminClient as any)
      .from("client_applications")
      .update({
        blood_report_values: bloodValues,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating blood values:", updateError);
      return NextResponse.json(
        { error: "Failed to save blood values" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Blood values saved successfully",
      blood_report_values: bloodValues,
    });

  } catch (error) {
    console.error("Error in blood-values API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve blood values
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    // Verify coach authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a coach or admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (!userProfile || !["coach", "admin"].includes(userProfile.role)) {
      return NextResponse.json(
        { error: "Only coaches can view blood values" },
        { status: 403 }
      );
    }

    // Use admin client to fetch application
    const adminClient = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (adminClient as any)
      .from("client_applications")
      .select("id, blood_report_values, assessment_data")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      blood_report_values: application.blood_report_values || {},
      uploaded_reports: application.assessment_data?.bloodReports?.uploadedReports || [],
    });

  } catch (error) {
    console.error("Error in blood-values API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
