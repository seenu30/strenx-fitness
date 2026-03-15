import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { TransformationPlanSnapshot } from "@/types/transformation-plan";

/**
 * POST /api/transformation-plans/[planId]/publish
 * Publish a transformation plan to the client
 * Creates a version snapshot and updates status to published
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const body = await request.json().catch(() => ({}));
    const { change_notes } = body as { change_notes?: string };

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
        { error: "Only coaches can publish transformation plans" },
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

    // Get the plan with sections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase as any)
      .from("transformation_plans")
      .select(`
        *,
        sections:transformation_plan_sections(
          section_type,
          title,
          content,
          is_visible,
          sort_order
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

    // Verify this client belongs to this coach (unless admin)
    if (userProfile.role !== "admin") {
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

    // Get current version number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentVersion } = await (supabase as any)
      .from("transformation_plan_versions")
      .select("version_number")
      .eq("plan_id", planId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single();

    const nextVersionNumber = (currentVersion?.version_number || 0) + 1;

    // Create plan snapshot
    const snapshot: TransformationPlanSnapshot = {
      plan: {
        client_id: plan.client_id,
        created_by: plan.created_by,
        plan_name: plan.plan_name,
        phase: plan.phase,
        duration_weeks: plan.duration_weeks,
        nutrition_plan_version_id: plan.nutrition_plan_version_id,
        training_plan_version_id: plan.training_plan_version_id,
        assessment_id: plan.assessment_id,
        status: "published",
        published_at: new Date().toISOString(),
      },
      sections: (plan.sections || []).map((section: {
        section_type: string;
        title: string | null;
        content: Record<string, unknown>;
        is_visible: boolean;
        sort_order: number;
      }) => ({
        section_type: section.section_type,
        title: section.title,
        content: section.content,
        is_visible: section.is_visible,
        sort_order: section.sort_order,
      })),
    };

    // Mark previous versions as not current
    if (nextVersionNumber > 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("transformation_plan_versions")
        .update({ is_current: false })
        .eq("plan_id", planId);
    }

    // Create new version
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: versionError } = await (supabase as any)
      .from("transformation_plan_versions")
      .insert({
        plan_id: planId,
        version_number: nextVersionNumber,
        change_notes: change_notes || null,
        created_by: coach.id,
        plan_snapshot: snapshot,
        is_current: true,
      });

    if (versionError) {
      console.error("Error creating version:", versionError);
      return NextResponse.json(
        { error: "Failed to create plan version" },
        { status: 500 }
      );
    }

    // Update plan status to published
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedPlan, error: updateError } = await (supabase as any)
      .from("transformation_plans")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", planId)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating plan status:", updateError);
      return NextResponse.json(
        { error: "Failed to publish plan" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      plan: updatedPlan,
      version_number: nextVersionNumber,
      message: "Transformation plan published successfully",
    });
  } catch (error) {
    console.error("Error in publish transformation plan API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
