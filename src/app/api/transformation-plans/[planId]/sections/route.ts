import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateInput,
  validationErrorResponse,
  upsertSectionSchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/transformation-plans/[planId]/sections
 * Get all sections for a transformation plan
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
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the plan to check access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase as any)
      .from("transformation_plans")
      .select("id, client_id, status")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json(
        { error: "Transformation plan not found" },
        { status: 404 }
      );
    }

    // Check access rights
    let showHiddenSections = false;
    if (userProfile.role === "client") {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!client || plan.client_id !== client.id || plan.status !== "published") {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (userProfile.role === "coach") {
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

      const { data: clientCheck } = await supabase
        .from("clients")
        .select("id")
        .eq("id", plan.client_id)
        .eq("coach_id", coach.id)
        .single();

      if (!clientCheck) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      showHiddenSections = true;
    } else {
      // Admin
      showHiddenSections = true;
    }

    // Get sections
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("transformation_plan_sections")
      .select("*")
      .eq("plan_id", planId)
      .order("sort_order", { ascending: true });

    if (!showHiddenSections) {
      query = query.eq("is_visible", true);
    }

    const { data: sections, error: sectionsError } = await query;

    if (sectionsError) {
      console.error("Error fetching sections:", sectionsError);
      return NextResponse.json(
        { error: "Failed to fetch sections" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      sections: sections || [],
    });
  } catch (error) {
    console.error("Error in sections GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transformation-plans/[planId]/sections
 * Create or update a section (upsert by section_type)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const body = await request.json();

    // Validate input
    const validation = validateInput(upsertSectionSchema, body);
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
        { error: "Only coaches can manage sections" },
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

    // Get the plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase as any)
      .from("transformation_plans")
      .select("id, client_id")
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
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const { section_type, title, content, is_visible, sort_order } = validation.data;

    // Check if section already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingSection } = await (supabase as any)
      .from("transformation_plan_sections")
      .select("id")
      .eq("plan_id", planId)
      .eq("section_type", section_type)
      .single();

    let section;
    if (existingSection) {
      // Update existing section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: updatedSection, error: updateError } = await (supabase as any)
        .from("transformation_plan_sections")
        .update({
          title: title || null,
          content,
          is_visible: is_visible ?? true,
          sort_order: sort_order ?? 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSection.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating section:", updateError);
        return NextResponse.json(
          { error: "Failed to update section" },
          { status: 500 }
        );
      }
      section = updatedSection;
    } else {
      // Create new section
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newSection, error: insertError } = await (supabase as any)
        .from("transformation_plan_sections")
        .insert({
          plan_id: planId,
          section_type,
          title: title || null,
          content,
          is_visible: is_visible ?? true,
          sort_order: sort_order ?? 0,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating section:", insertError);
        return NextResponse.json(
          { error: "Failed to create section" },
          { status: 500 }
        );
      }
      section = newSection;
    }

    // Update plan updated_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("transformation_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);

    return NextResponse.json({
      success: true,
      section,
      created: !existingSection,
    });
  } catch (error) {
    console.error("Error in sections POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transformation-plans/[planId]/sections
 * Delete a section by section_type (query param)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ planId: string }> }
) {
  try {
    const { planId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const sectionType = searchParams.get("section_type");
    const sectionId = searchParams.get("section_id");

    if (!sectionType && !sectionId) {
      return NextResponse.json(
        { error: "section_type or section_id is required" },
        { status: 400 }
      );
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
        { error: "Only coaches can delete sections" },
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

    // Get the plan
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: plan, error: planError } = await (supabase as any)
      .from("transformation_plans")
      .select("id, client_id")
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
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    // Delete the section
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let deleteQuery = (supabase as any)
      .from("transformation_plan_sections")
      .delete()
      .eq("plan_id", planId);

    if (sectionId) {
      deleteQuery = deleteQuery.eq("id", sectionId);
    } else if (sectionType) {
      deleteQuery = deleteQuery.eq("section_type", sectionType);
    }

    const { error: deleteError } = await deleteQuery;

    if (deleteError) {
      console.error("Error deleting section:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete section" },
        { status: 500 }
      );
    }

    // Update plan updated_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("transformation_plans")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", planId);

    return NextResponse.json({
      success: true,
      message: "Section deleted successfully",
    });
  } catch (error) {
    console.error("Error in sections DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
