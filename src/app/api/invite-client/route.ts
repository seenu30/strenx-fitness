import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, inviteClientSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validation = validateInput(inviteClientSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const { firstName, lastName, email, phone, planId } = validation.data;

    // Get the current authenticated user (coach)
    const supabase = await createClient();
    const { data: { user: coachUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !coachUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get coach info
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", coachUser.id)
      .single() as { data: { id: string } | null; error: unknown };

    if (coachError || !coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
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
        role: "client",
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

    // Explicitly create user record (don't rely on trigger for admin-created users)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userError } = await (adminClient as any)
      .from("users")
      .insert({
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        role: "client",
        phone: phone || null,
      });

    if (userError) {
      console.error("Error creating user record:", userError);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Create client record (notes column doesn't exist, skip it)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientData, error: clientError } = await (adminClient as any)
      .from("clients")
      .insert({
        user_id: authData.user.id,
        coach_id: coach.id,
        status: "pending",
        onboarding_completed: false,
      })
      .select("id")
      .single();

    if (clientError) {
      console.error("Error creating client:", clientError);
      // Clean up the user if client creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create client profile" },
        { status: 500 }
      );
    }

    // Create subscription if plan is provided
    if (planId && clientData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: plan } = await (adminClient as any)
        .from("subscription_plans")
        .select("id, duration_days, price")
        .eq("id", planId)
        .single() as { data: { id: string; duration_days: number; price: number } | null };

      if (plan) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + (plan.duration_days || 30));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (adminClient as any).from("subscriptions").insert({
          client_id: clientData.id,
          plan_id: plan.id,
          status: "pending",
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          amount: plan.price,
        });
      }
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
      message: "Client invited successfully",
      clientId: clientData?.id,
    });

  } catch (error) {
    console.error("Error in invite-client API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
