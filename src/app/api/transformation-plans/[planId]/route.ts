import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateInput,
  validationErrorResponse,
  updateTransformationPlanSchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/transformation-plans/[planId]
 * Get a transformation plan with all sections
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile
    const { data: userProfile } = await supabase
      .from("users")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the plan with sections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase as any)
      .from("transformation_plans")
      .select(`
        *,
        sections:transformation_plan_sections(
          id,
          section_type,
          title,
          content,
          is_visible,
          sort_order,
          created_at,
          updated_at
        ),
        client:clients(
          id,
          user_id,
          status,
          users!inner(first_name, last_name, email)
        ),
        coach:coaches!created_by(
          id,
          user_id,
          bio,
          certifications,
          users!inner(first_name, last_name)
        )
      `)
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Transformation plan not found" },
        { status: 404 }
      );
    }

    // Check access rights
    if (userProfile.role === "client") {
      // Clients can only see their own published plans
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client || plan.client_id !== client.id || plan.status !== "published") {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }

      // Filter out hidden sections for client view
      plan.sections = (plan.sections || []).filter(
        (section: { is_visible: boolean }) => section.is_visible
      );
    } else if (userProfile.role === "coach") {
      // Coaches can only see plans for their clients
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) {
        return NextResponse.json(
          { error: "Coach profile not found" },
          { status: 404 }
        );
      }

      // Verify this client belongs to this coach
      const { data: clientCheck } = await supabase
        .from("clients")
        .select("id")
        .eq("id", plan.client_id)
        .eq("coach_id", coach.id)
        .single();

      if (!clientCheck) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }
    // Admin can see all

    // Sort sections by sort_order
    if (plan.sections) {
      plan.sections.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Error in transformation plan GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/transformation-plans/[planId]
 * Update a transformation plan (coach/admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const body = await request.json();

    // Validate input
    const validation = validateInput(updateTransformationPlanSchema, body);
    if (!validation.success) {
      return NextResponse.json(validationErrorResponse(validation.errors), {
        status: 400,
      });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a coach or admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !userProfile ||
      (userProfile.role !== "coach" && userProfile.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only coaches can update transformation plans" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Get existing plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPlan, error: fetchError } = await (supabase as any)
      .from("transformation_plans")
      .select("id, client_id, status")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: "Transformation plan not found" },
        { status: 404 }
      );
    }

    // Verify this client belongs to this coach (unless admin)
    if (userProfile.role !== "admin") {
      const { data: clientCheck } = await supabase
        .from("clients")
        .select("id")
        .eq("id", existingPlan.client_id)
        .eq("coach_id", coach.id)
        .single();

      if (!clientCheck) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    const { plan_name, phase, duration_weeks, nutrition_plan_version_id, training_plan_version_id, assessment_id } =
      validation.data;

    if (plan_name !== undefined) updateData.plan_name = plan_name;
    if (phase !== undefined) updateData.phase = phase;
    if (duration_weeks !== undefined) updateData.duration_weeks = duration_weeks;
    if (nutrition_plan_version_id !== undefined) updateData.nutrition_plan_version_id = nutrition_plan_version_id;
    if (training_plan_version_id !== undefined) updateData.training_plan_version_id = training_plan_version_id;
    if (assessment_id !== undefined) updateData.assessment_id = assessment_id;

    // Update the plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedPlan, error: updateError } = await (supabase as any)
      .from("transformation_plans")
      .update(updateData)
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating transformation plan:", updateError);
      return NextResponse.json(
        { error: "Failed to update transformation plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
    });
  } catch (error) {
    console.error("Error in transformation plan PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transformation-plans/[planId]
 * Archive a transformation plan (coach/admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a coach or admin
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !userProfile ||
      (userProfile.role !== "coach" && userProfile.role !== "admin")
    ) {
      return NextResponse.json(
        { error: "Only coaches can delete transformation plans" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Get existing plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPlan, error: fetchError } = await (supabase as any)
      .from("transformation_plans")
      .select("id, client_id")
      .eq("id", planId)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: "Transformation plan not found" },
        { status: 404 }
      );
    }

    // Verify this client belongs to this coach (unless admin)
    if (userProfile.role !== "admin") {
      const { data: clientCheck } = await supabase
        .from("clients")
        .select("id")
        .eq("id", existingPlan.client_id)
        .eq("coach_id", coach.id)
        .single();

      if (!clientCheck) {
        return NextResponse.json(
          { error: "Access denied" },
          { status: 403 }
        );
      }
    }

    // Archive the plan (soft delete)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: archiveError } = await (supabase as any)
      .from("transformation_plans")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId);

    if (archiveError) {
      console.error("Error archiving transformation plan:", archiveError);
      return NextResponse.json(
        { error: "Failed to delete transformation plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Transformation plan archived successfully",
    });
  } catch (error) {
    console.error("Error in transformation plan DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
