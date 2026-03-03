import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, reviewApplicationSchema, uuidSchema } from "@/lib/validation/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validation = validateInput(reviewApplicationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const { action, selected_plan_id, custom_amount, review_notes, rejection_reason } = validation.data;

    // Verify coach authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a coach
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (!userProfile || (userProfile.role !== "coach" && userProfile.role !== "super_admin")) {
      return NextResponse.json(
        { error: "Only coaches can review applications" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single() as { data: { id: string } | null };

    if (!coach && userProfile.role === "coach") {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();

    // Get current application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (adminClient as any)
      .from("client_applications")
      .select("id, status, email")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application can be reviewed
    if (application.status !== "submitted") {
      return NextResponse.json(
        { error: `Application cannot be reviewed. Current status: ${application.status}` },
        { status: 400 }
      );
    }

    // Update application based on action
    const updateData: Record<string, unknown> = {
      reviewed_by: coach?.id || null,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes || null,
      updated_at: new Date().toISOString(),
    };

    if (action === "approve") {
      // Zod schema ensures selected_plan_id is present for approval
      updateData.status = "approved";
      updateData.selected_plan_id = selected_plan_id;
      if (custom_amount !== undefined) {
        updateData.custom_amount = custom_amount;
      }
    } else {
      // Zod schema ensures rejection_reason is present for rejection
      updateData.status = "rejected";
      updateData.rejection_reason = rejection_reason;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedApp, error: updateError } = await (adminClient as any)
      .from("client_applications")
      .update(updateData)
      .eq("id", id)
      .select("id, email, status, selected_plan_id, reviewed_at")
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: action === "approve" ? "Application approved" : "Application rejected",
      application: updatedApp,
    });
  } catch (error) {
    console.error("Error in application review API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
