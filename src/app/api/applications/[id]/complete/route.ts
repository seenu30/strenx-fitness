import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();

    // Get application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (adminClient as any)
      .from("client_applications")
      .select("id, status, converted_client_id")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application is in invited status
    if (application.status !== "invited") {
      return NextResponse.json(
        { error: `Cannot complete application. Current status: ${application.status}` },
        { status: 400 }
      );
    }

    // Update application to completed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (adminClient as any)
      .from("client_applications")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to complete application" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application marked as completed",
    });
  } catch (error) {
    console.error("Error in application complete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
