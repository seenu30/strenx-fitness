import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/plans
 * List training and nutrition plans for the authenticated coach
 * Query params:
 *   - type: "training" | "nutrition" | "all" (default: "all")
 */
export async function GET(request: NextRequest) {
  try {
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
        { error: "Only coaches can access plans" },
        { status: 403 }
      );
    }

    // Get coach ID for this user
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

    const coachId = coach.id;

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type") || "all";

    const result: {
      trainingPlans?: Array<{
        id: string;
        name: string;
        description: string | null;
        days_per_week: number;
        plan_type: string;
        goal: string | null;
        is_active: boolean;
      }>;
      nutritionPlans?: Array<{
        id: string;
        name: string;
        description: string | null;
        target_calories: number | null;
        target_protein_g: number | null;
        target_carbs_g: number | null;
        target_fat_g: number | null;
        diet_type: string | null;
        meal_count: number;
        is_active: boolean;
      }>;
    } = {};

    // Fetch training plans
    if (type === "all" || type === "training") {
      const { data: trainingPlans, error: trainingError } = await supabase
        .from("training_plans")
        .select("id, name, description, days_per_week, plan_type, goal, is_active")
        .eq("created_by", coachId)
        .eq("is_active", true)
        .order("name");

      if (trainingError) {
        console.error("Error fetching training plans:", trainingError);
        return NextResponse.json(
          { error: "Failed to fetch training plans" },
          { status: 500 }
        );
      }

      // Map with defaults for nullable fields
      result.trainingPlans = (trainingPlans || []).map(plan => ({
        ...plan,
        days_per_week: plan.days_per_week ?? 3,
        plan_type: plan.plan_type ?? "custom",
        is_active: plan.is_active ?? true,
      }));
    }

    // Fetch nutrition plans
    if (type === "all" || type === "nutrition") {
      const { data: nutritionPlans, error: nutritionError } = await supabase
        .from("nutrition_plans")
        .select("id, name, description, target_calories, target_protein_g, target_carbs_g, target_fat_g, diet_type, meal_count, is_active")
        .eq("created_by", coachId)
        .eq("is_active", true)
        .order("name");

      if (nutritionError) {
        console.error("Error fetching nutrition plans:", nutritionError);
        return NextResponse.json(
          { error: "Failed to fetch nutrition plans" },
          { status: 500 }
        );
      }

      // Map with defaults for nullable fields
      result.nutritionPlans = (nutritionPlans || []).map(plan => ({
        ...plan,
        meal_count: plan.meal_count ?? 3,
        is_active: plan.is_active ?? true,
      }));
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("Error in plans API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
