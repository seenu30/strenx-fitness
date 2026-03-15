import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, inviteCoachSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validation = validateInput(inviteCoachSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const { firstName, lastName, email, specializations, experienceYears } = validation.data;

    // Get the current authenticated user (admin)
    const supabase = await createClient();
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !adminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a admin
    const { data: adminProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", adminUser.id)
      .single() as { data: { role: string } | null };

    if (!adminProfile || adminProfile.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can invite coaches" },
        { status: 403 }
      );
    }

    // Use admin client for user creation
    const adminClient = createAdminClient();

    // Check if user already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (adminClient as any)
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 400 }
      );
    }

    // Generate a secure invite token
    const inviteToken = crypto.randomUUID();

    // Create auth user with invite
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "coach",
        invite_token: inviteToken,
      },
    });

    if (createUserError) {
      console.error("Error creating user:", createUserError);
      return NextResponse.json(
        { error: "Failed to create user account" },
        { status: 500 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 500 }
      );
    }

    // Parse specializations (comma-separated string)
    const specializationsArray = specializations
      ? specializations.split(",").map((s: string) => s.trim()).filter(Boolean)
      : [];

    // Explicitly create user record (don't rely on trigger for admin-created users)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userError } = await (adminClient as any)
      .from("users")
      .insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: "coach",
      });

    if (userError) {
      console.error("Error creating user record:", userError);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Create coach record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: coachData, error: coachError } = await (adminClient as any)
      .from("coaches")
      .insert({
        user_id: authData.user.id,
        specializations: specializationsArray,
        experience_years: typeof experienceYears === 'number' ? experienceYears : parseInt(String(experienceYears || '0')) || 0,
      })
      .select("id")
      .single();

    if (coachError) {
      console.error("Error creating coach:", coachError);
      // Clean up the user if coach creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create coach profile" },
        { status: 500 }
      );
    }

    // Send invite email using Supabase's built-in invite
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/accept-invite`,
    });

    if (inviteError) {
      console.error("Error sending invite email:", inviteError);
      // Don't fail the request, just log it - user is created
    }

    return NextResponse.json({
      success: true,
      message: "Coach invited successfully",
      coachId: coachData?.id,
    });

  } catch (error) {
    console.error("Error in invite-coach API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
