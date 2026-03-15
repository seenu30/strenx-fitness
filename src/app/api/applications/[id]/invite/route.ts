import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify coach authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is a coach
    const { data: userProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single() as { data: { role: string } | null };

    if (!userProfile || (userProfile.role !== "coach" && userProfile.role !== "admin")) {
      return NextResponse.json(
        { error: "Only coaches can send invites" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single() as { data: { id: string } | null };

    if (!coach && userProfile.role === "coach") {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    const adminClient = createAdminClient();

    // Get application with all data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (adminClient as any)
      .from("client_applications")
      .select(`
        *,
        plan:subscription_plans(id, duration_days, price_amount)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application is ready for invite
    if (application.status !== "payment_received") {
      return NextResponse.json(
        { error: `Invite can only be sent after payment is received. Current status: ${application.status}` },
        { status: 400 }
      );
    }

    // Extract personal info from assessment data
    const personalInfo = application.assessment_data?.personalInfo || {};
    const firstName = personalInfo.firstName || "";
    const lastName = personalInfo.lastName || "";

    // Create auth user
    const { data: authData, error: createUserError } = await adminClient.auth.admin.createUser({
      email: application.email,
      email_confirm: false,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: "client",
        application_id: application.id,
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

    // Create user record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: userError } = await (adminClient as any)
      .from("users")
      .insert({
        id: authData.user.id,
        email: application.email,
        first_name: firstName,
        last_name: lastName,
        role: "client",
        phone: application.phone || null,
      });

    if (userError) {
      console.error("Error creating user record:", userError);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create user profile" },
        { status: 500 }
      );
    }

    // Create client record with onboarding already completed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: clientData, error: clientError } = await (adminClient as any)
      .from("clients")
      .insert({
        user_id: authData.user.id,
        coach_id: coach?.id || application.reviewed_by,
        status: "active",
        onboarding_completed: true, // Already completed via application
        onboarding_completed_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (clientError) {
      console.error("Error creating client:", clientError);
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: "Failed to create client profile" },
        { status: 500 }
      );
    }

    // Create client_assessment record and migrate assessment data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: assessmentData, error: assessmentError } = await (adminClient as any)
      .from("client_assessments")
      .insert({
        client_id: clientData.id,
        version: 1,
        is_current: true,
      })
      .select("id")
      .single();

    if (assessmentError) {
      console.error("Error creating assessment:", assessmentError);
      // Continue anyway - client is created
    }

    // Migrate assessment data to individual tables
    if (assessmentData && application.assessment_data) {
      const assessData = application.assessment_data;

      // Helper to safely insert assessment section
      const insertSection = async (table: string, data: Record<string, unknown>) => {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (adminClient as any).from(table).insert({
            assessment_id: assessmentData.id,
            ...data,
          });
        } catch (e) {
          console.error(`Error inserting ${table}:`, e);
        }
      };

      if (assessData.personalInfo) await insertSection("assess_personal", assessData.personalInfo);
      if (assessData.goals) await insertSection("assess_goals", assessData.goals);
      if (assessData.trainingBackground) await insertSection("assess_training", assessData.trainingBackground);
      if (assessData.medicalHistory) await insertSection("assess_medical", assessData.medicalHistory);
      if (assessData.bloodReports) await insertSection("assess_blood_reports", assessData.bloodReports);
      if (assessData.lifestyle) await insertSection("assess_lifestyle", assessData.lifestyle);
      if (assessData.diet) await insertSection("assess_diet", assessData.diet);
      if (assessData.foodPreferences) await insertSection("assess_food_preferences", assessData.foodPreferences);
      if (assessData.supplements) await insertSection("assess_supplements", assessData.supplements);
      if (assessData.skinHair) await insertSection("assess_skin_hair", assessData.skinHair);
      if (assessData.expectations) await insertSection("assess_expectations", assessData.expectations);
    }

    // Create subscription if plan was selected
    if (application.selected_plan_id && application.plan) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (application.plan.duration_days || 30));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any).from("subscriptions").insert({
        client_id: clientData.id,
        plan_id: application.selected_plan_id,
        status: "active",
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        amount_paid: application.custom_amount || application.plan.price_amount,
      });
    }

    // Create plan assignments if training/nutrition plans were selected
    if (application.training_plan_id || application.nutrition_plan_id) {
      let trainingPlanVersionId = null;
      let nutritionPlanVersionId = null;

      // Get current training plan version
      if (application.training_plan_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: trainingVersion } = await (adminClient as any)
          .from("training_plan_versions")
          .select("id")
          .eq("plan_id", application.training_plan_id)
          .eq("is_current", true)
          .single();

        if (trainingVersion) {
          trainingPlanVersionId = trainingVersion.id;
        }
      }

      // Get current nutrition plan version
      if (application.nutrition_plan_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: nutritionVersion } = await (adminClient as any)
          .from("nutrition_plan_versions")
          .select("id")
          .eq("plan_id", application.nutrition_plan_id)
          .eq("is_current", true)
          .single();

        if (nutritionVersion) {
          nutritionPlanVersionId = nutritionVersion.id;
        }
      }

      // Create the plan assignment if we have at least one version
      if (trainingPlanVersionId || nutritionPlanVersionId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: assignmentError } = await (adminClient as any)
          .from("client_plan_assignments")
          .insert({
            client_id: clientData.id,
            assigned_by: coach?.id || application.reviewed_by,
            training_plan_version_id: trainingPlanVersionId,
            nutrition_plan_version_id: nutritionPlanVersionId,
            start_date: new Date().toISOString().split("T")[0],
            is_active: true,
            assignment_notes: "Assigned during application invite",
          });

        if (assignmentError) {
          console.error("Error creating plan assignment:", assignmentError);
          // Don't fail the invite - plans can be assigned later
        }
      }
    }

    // Update application status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminClient as any)
      .from("client_applications")
      .update({
        status: "invited",
        converted_client_id: clientData.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Send invite email
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      application.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/accept-invite`,
      }
    );

    if (inviteError) {
      console.error("Error sending invite email:", inviteError);
      // Don't fail - user is created, they can use password reset
    }

    return NextResponse.json({
      success: true,
      message: "Invite sent successfully",
      clientId: clientData.id,
    });
  } catch (error) {
    console.error("Error in invite API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
