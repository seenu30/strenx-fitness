import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, createInvitationSchema } from "@/lib/validation/schemas";

/**
 * POST /api/applications/invite
 * Create a draft application when coach sends an invitation
 * Returns the application ID for generating unique link
 */
export async function POST(request: NextRequest) {
  try {
    // Verify coach is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Verify user is a coach
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userProfile || (userProfile.role !== "coach" && userProfile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches can send invitations" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const validation = validateInput(createInvitationSchema, {
      ...body,
      invited_by: user.id,
    });

    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const { email, name, invited_by } = validation.data;

    // Use admin client for creating application
    const adminClient = createAdminClient();

    // Check if email already exists with an active application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingApp } = await (adminClient as any)
      .from("client_applications")
      .select("id, status")
      .eq("email", email)
      .not("status", "in", '("rejected","completed")')
      .single();

    if (existingApp) {
      // If there's an existing draft that was invited, return its ID
      if (existingApp.status === "draft") {
        return NextResponse.json({
          success: true,
          application: { id: existingApp.id },
          existing: true,
          message: "An invitation for this email already exists",
        });
      }
      return NextResponse.json(
        {
          error: "An application with this email already exists",
          status: existingApp.status,
        },
        { status: 400 }
      );
    }

    // Check if user already exists in the system
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (adminClient as any)
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    // Create draft application with invitation info
    // Store name in assessment_data for pre-filling
    const assessmentData: Record<string, unknown> = {};
    if (name) {
      const nameParts = name.trim().split(/\s+/);
      assessmentData.firstName = nameParts[0] || "";
      assessmentData.lastName = nameParts.slice(1).join(" ") || "";
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: insertError } = await (adminClient as any)
      .from("client_applications")
      .insert({
        email,
        assessment_data: assessmentData,
        completed_steps: [],
        progress_percentage: 0,
        status: "draft",
        invited_by,
        invited_at: new Date().toISOString(),
      })
      .select("id, email, status, created_at, invited_at")
      .single();

    if (insertError) {
      console.error("Error creating invitation:", insertError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error in invitation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
