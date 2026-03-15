import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateInput,
  validationErrorResponse,
  createTransformationPlanSchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/transformation-plans
 * List transformation plans
 * - Coach: sees plans for their clients
 * - Client: sees their own published plans
 * - Admin: sees all plans
 *
 * Query params:
 *   - client_id: filter by client (coach/admin only)
 *   - status: filter by status (draft, published, archived)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile and role
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const clientIdFilter = searchParams.get("client_id");
    const statusFilter = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("transformation_plans")
      .select(`
        id,
        client_id,
        created_by,
        plan_name,
        phase,
        duration_weeks,
        status,
        published_at,
        created_at,
        updated_at,
        nutrition_plan_version_id,
        training_plan_version_id,
        assessment_id,
        sections:transformation_plan_sections(
          id,
          section_type,
          title,
          is_visible,
          sort_order
        )
      `)
      .order("updated_at", { ascending: false });

    // Apply role-based filtering
    if (userProfile.role === "client") {
      // Clients can only see their own published plans
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client) {
        return NextResponse.json({ error: "Client profile not found" }, { status: 404 });
      }

      query = query.eq("client_id", client.id).eq("status", "published");
    } else if (userProfile.role === "coach") {
      // Coaches see plans for their clients
      const { data: coach } = await supabase
        .from("coaches")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!coach) {
        return NextResponse.json({ error: "Coach profile not found" }, { status: 404 });
      }

      // Get client IDs for this coach
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .eq("coach_id", coach.id);

      const clientIds = clients?.map((c) => c.id) || [];

      if (clientIds.length > 0) {
        query = query.in("client_id", clientIds);
      } else {
        // No clients, return empty
        return NextResponse.json({ success: true, plans: [] });
      }
    }
    // Admin sees all (no additional filter)

    // Apply optional filters
    if (clientIdFilter && userProfile.role !== "client") {
      query = query.eq("client_id", clientIdFilter);
    }

    if (statusFilter && userProfile.role !== "client") {
      query = query.eq("status", statusFilter);
    }

    const { data: plans, error } = await query;

    if (error) {
      console.error("Error fetching transformation plans:", error);
      return NextResponse.json(
        { error: "Failed to fetch transformation plans" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plans: plans || [],
    });
  } catch (error) {
    console.error("Error in transformation plans GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transformation-plans
 * Create a new transformation plan (coach/admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateInput(createTransformationPlanSchema, body);
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
        { error: "Only coaches can create transformation plans" },
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

    const { client_id, plan_name, phase, duration_weeks, nutrition_plan_version_id, training_plan_version_id, assessment_id } =
      validation.data;

    // Verify the client belongs to this coach
    const { data: client } = await supabase
      .from("clients")
      .select("id, coach_id")
      .eq("id", client_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (client.coach_id !== coach.id && userProfile.role !== "admin") {
      return NextResponse.json(
        { error: "You can only create plans for your own clients" },
        { status: 403 }
      );
    }

    // Create the transformation plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: insertError } = await (supabase as any)
      .from("transformation_plans")
      .insert({
        client_id,
        created_by: coach.id,
        plan_name: plan_name || "Transformation Plan",
        phase: phase || null,
        duration_weeks: duration_weeks || 4,
        nutrition_plan_version_id: nutrition_plan_version_id || null,
        training_plan_version_id: training_plan_version_id || null,
        assessment_id: assessment_id || null,
        status: "draft",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating transformation plan:", insertError);
      return NextResponse.json(
        { error: "Failed to create transformation plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan,
    });
  } catch (error) {
    console.error("Error in transformation plans POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
