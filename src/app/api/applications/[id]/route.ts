import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, updateApplicationSchema, uuidSchema } from "@/lib/validation/schemas";

export async function GET(
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

    const adminClient = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error } = await (adminClient as any)
      .from("client_applications")
      .select(`
        *,
        plan:subscription_plans(id, name, price_amount, duration_days),
        reviewer:coaches!reviewed_by(
          id,
          users!inner(first_name, last_name)
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error fetching application:", error);
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error in application GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const validation = validateInput(updateApplicationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const validatedData = validation.data;

    // Build update data from validated input
    const updateData: Record<string, unknown> = {};
    if (validatedData.assessment_data !== undefined) {
      updateData.assessment_data = validatedData.assessment_data;
    }
    if (validatedData.current_step !== undefined) {
      updateData.current_step = validatedData.current_step;
    }
    if (validatedData.completed_steps !== undefined) {
      updateData.completed_steps = validatedData.completed_steps;
    }
    if (validatedData.progress_percentage !== undefined) {
      updateData.progress_percentage = validatedData.progress_percentage;
    }
    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }

    updateData.updated_at = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error } = await (adminClient as any)
      .from("client_applications")
      .update(updateData)
      .eq("id", id)
      .eq("status", "draft") // Only allow updating draft applications
      .select("id, email, status, updated_at")
      .single();

    if (error) {
      console.error("Error updating application:", error);
      return NextResponse.json(
        { error: "Failed to update application" },
        { status: 500 }
      );
    }

    if (!application) {
      return NextResponse.json(
        { error: "Application not found or cannot be updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error in application PATCH API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
