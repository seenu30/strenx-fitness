import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * PATCH /api/applications/[id]/plans
 * Update the selected training and nutrition plans for an application
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { training_plan_id, nutrition_plan_id } = body;

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
      .single();

    if (!userProfile || (userProfile.role !== "coach" && userProfile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches can update application plans" },
        { status: 403 }
      );
    }

    // Get coach ID for validation
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    const coachId = coach?.id;
    const adminClient = createAdminClient();

    // Get the application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: appError } = await (supabase as any)
      .from("client_applications")
      .select("id, status")
      .eq("id", id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Don't allow changes after invite is sent
    if (application.status === "invited" || application.status === "completed") {
      return NextResponse.json(
        { error: "Cannot modify plans after invite has been sent" },
        { status: 400 }
      );
    }

    // Validate training plan if provided
    if (training_plan_id) {
      const { data: trainingPlan, error: tpError } = await supabase
        .from("training_plans")
        .select("id, created_by, is_active")
        .eq("id", training_plan_id)
        .single();

      if (tpError || !trainingPlan) {
        return NextResponse.json(
          { error: "Training plan not found" },
          { status: 404 }
        );
      }

      if (trainingPlan.created_by !== coachId && userProfile.role !== "admin") {
        return NextResponse.json(
          { error: "You can only select plans you created" },
          { status: 403 }
        );
      }

      if (!trainingPlan.is_active) {
        return NextResponse.json(
          { error: "Training plan is not active" },
          { status: 400 }
        );
      }
    }

    // Validate nutrition plan if provided
    if (nutrition_plan_id) {
      const { data: nutritionPlan, error: npError } = await supabase
        .from("nutrition_plans")
        .select("id, created_by, is_active")
        .eq("id", nutrition_plan_id)
        .single();

      if (npError || !nutritionPlan) {
        return NextResponse.json(
          { error: "Nutrition plan not found" },
          { status: 404 }
        );
      }

      if (nutritionPlan.created_by !== coachId && userProfile.role !== "admin") {
        return NextResponse.json(
          { error: "You can only select plans you created" },
          { status: 403 }
        );
      }

      if (!nutritionPlan.is_active) {
        return NextResponse.json(
          { error: "Nutrition plan is not active" },
          { status: 400 }
        );
      }
    }

    // Update the application using admin client to bypass RLS
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedApp, error: updateError } = await (adminClient as any)
      .from("client_applications")
      .update({
        training_plan_id: training_plan_id || null,
        nutrition_plan_id: nutrition_plan_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id, training_plan_id, nutrition_plan_id")
      .single();

    if (updateError) {
      console.error("Error updating application plans:", updateError);
      return NextResponse.json(
        { error: "Failed to update application plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application: updatedApp,
    });
  } catch (error) {
    console.error("Error in application plans API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/applications/[id]/plans
 * Get the selected plans for an application
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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
      .single();

    if (!userProfile || (userProfile.role !== "coach" && userProfile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches can view application plans" },
        { status: 403 }
      );
    }

    // Get the application with plan details
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: appError } = await (supabase as any)
      .from("client_applications")
      .select(`
        id,
        training_plan_id,
        nutrition_plan_id,
        training_plan:training_plans(id, name, description, days_per_week, plan_type, goal),
        nutrition_plan:nutrition_plans(id, name, description, target_calories, target_protein_g, target_carbs_g, target_fat_g, diet_type, meal_count)
      `)
      .eq("id", id)
      .single();

    if (appError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      training_plan_id: application.training_plan_id,
      nutrition_plan_id: application.nutrition_plan_id,
      training_plan: application.training_plan,
      nutrition_plan: application.nutrition_plan,
    });
  } catch (error) {
    console.error("Error in application plans API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
