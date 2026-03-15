import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  validateInput,
  validationErrorResponse,
  drinkRecipeLibrarySchema,
} from "@/lib/validation/schemas";

/**
 * GET /api/drink-recipes
 * List drink recipes from the library
 *
 * Query params:
 *   - drink_type: filter by type (morning, bedtime, pre_workout, post_workout, other)
 *   - active_only: boolean, only return active recipes (default: true)
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
        { error: "Only coaches can access drink recipes library" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const drinkType = searchParams.get("drink_type");
    const activeOnly = searchParams.get("active_only") !== "false";
    const search = searchParams.get("search");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from("drink_recipes_library")
      .select("*")
      .order("name");

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    if (drinkType) {
      query = query.eq("drink_type", drinkType);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data: recipes, error } = await query;

    if (error) {
      console.error("Error fetching drink recipes:", error);
      return NextResponse.json(
        { error: "Failed to fetch drink recipes" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipes: recipes || [],
    });
  } catch (error) {
    console.error("Error in drink-recipes GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/drink-recipes
 * Add a new drink recipe to the library (coach/admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = validateInput(drinkRecipeLibrarySchema, body);
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
        { error: "Only coaches can add drink recipes" },
        { status: 403 }
      );
    }

    const { name, drink_type, ingredients, preparation, benefits } = validation.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recipe, error: insertError } = await (supabase as any)
      .from("drink_recipes_library")
      .insert({
        name,
        drink_type: drink_type || null,
        ingredients: ingredients || [],
        preparation: preparation || null,
        benefits: benefits || null,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating drink recipe:", insertError);
      return NextResponse.json(
        { error: "Failed to create drink recipe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Error in drink-recipes POST API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/drink-recipes
 * Update an existing drink recipe (requires id in body)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
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
        { error: "Only coaches can update drink recipes" },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: recipe, error: updateError } = await (supabase as any)
      .from("drink_recipes_library")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating drink recipe:", updateError);
      return NextResponse.json(
        { error: "Failed to update drink recipe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recipe,
    });
  } catch (error) {
    console.error("Error in drink-recipes PUT API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/drink-recipes
 * Soft delete a drink recipe (set is_active = false)
 */
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Recipe ID is required" },
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
        { error: "Only coaches can delete drink recipes" },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from("drink_recipes_library")
      .update({ is_active: false })
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting drink recipe:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete drink recipe" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Drink recipe deleted successfully",
    });
  } catch (error) {
    console.error("Error in drink-recipes DELETE API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
