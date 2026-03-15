import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateInput,
  validationErrorResponse,
  supplementLibrarySchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/supplements
 * List supplements from the library
 *
 * Query params:
 *   - category: filter by category (vitamin, mineral, protein, performance, health)
 *   - active_only: boolean, only return active supplements (default: true)
 *   - search: search by name
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
        { error: "Only coaches can access supplement library" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active_only") !== "false";
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("supplement_library")
      .select("*")
      .order("name");

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: supplements, error } = await query;

    if (error) {
      console.error("Error fetching supplements:", error);
      return NextResponse.json(
        { error: "Failed to fetch supplements" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supplements: supplements || [],
    });
  } catch (error) {
    console.error("Error in supplements GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/supplements
 * Add a new supplement to the library (coach/admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateInput(supplementLibrarySchema, body);
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
        { error: "Only coaches can add supplements" },
        { status: 403 }
      );
    }

    const { name, category, brand, default_dosage, default_timing, benefits, target_deficiencies } =
      validation.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: supplement, error: insertError } = await (supabase as any)
      .from("supplement_library")
      .insert({
        name,
        category: category || null,
        brand: brand || null,
        default_dosage: default_dosage || null,
        default_timing: default_timing || null,
        benefits: benefits || null,
        target_deficiencies: target_deficiencies || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating supplement:", insertError);
      return NextResponse.json(
        { error: "Failed to create supplement" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supplement,
    });
  } catch (error) {
    console.error("Error in supplements POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/supplements
 * Update an existing supplement (requires id in body)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Supplement ID is required" },
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
        { error: "Only coaches can update supplements" },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: supplement, error: updateError } = await (supabase as any)
      .from("supplement_library")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating supplement:", updateError);
      return NextResponse.json(
        { error: "Failed to update supplement" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      supplement,
    });
  } catch (error) {
    console.error("Error in supplements PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/supplements
 * Soft delete a supplement (set is_active = false)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Supplement ID is required" },
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
        { error: "Only coaches can delete supplements" },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("supplement_library")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting supplement:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete supplement" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Supplement deleted successfully",
    });
  } catch (error) {
    console.error("Error in supplements DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
