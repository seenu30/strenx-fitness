import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/applications/[id]/progress
 * Update progress for a draft application (saves without submitting)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      assessment_data,
      completed_steps,
      progress_percentage,
      phone,
    } = body;

    const adminClient = createAdminClient();

    // Verify the application exists and is in draft status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingApp } = await (adminClient as any)
      .from("client_applications")
      .select("id, status")
      .eq("id", id)
      .single();

    if (!existingApp) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (existingApp.status !== "draft") {
      return NextResponse.json(
        { error: "Can only update draft applications" },
        { status: 400 }
      );
    }

    // Update the draft application progress
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: updateError } = await (adminClient as any)
      .from("client_applications")
      .update({
        assessment_data: assessment_data || {},
        completed_steps: completed_steps || [],
        progress_percentage: progress_percentage || 0,
        phone: phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, email, status, progress_percentage, completed_steps")
      .single();

    if (updateError) {
      console.error("Error updating application progress:", updateError);
      return NextResponse.json(
        { error: "Failed to save progress" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error in progress API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
