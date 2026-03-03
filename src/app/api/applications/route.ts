import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, createApplicationSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input with Zod schema
    const validation = validateInput(createApplicationSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const {
      email,
      phone,
      assessment_data,
      completed_steps,
      progress_percentage,
      consent_data_processing,
      consent_marketing,
      consent_medical_sharing,
      consent_terms,
      payment_reference,
      payment_screenshot_url,
      payment_screenshot_path,
    } = validation.data;

    // Use admin client for public access
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
        { error: "An account with this email already exists. Please login." },
        { status: 400 }
      );
    }

    // Create new application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: insertError } = await (adminClient as any)
      .from("client_applications")
      .insert({
        email,
        phone: phone || null,
        assessment_data: assessment_data || {},
        completed_steps: completed_steps || [],
        progress_percentage: progress_percentage || 0,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        consent_data_processing: consent_data_processing || false,
        consent_marketing: consent_marketing || false,
        consent_medical_sharing: consent_medical_sharing || false,
        consent_terms: consent_terms || false,
        consent_timestamp: new Date().toISOString(),
        payment_reference: payment_reference || null,
        payment_screenshot_url: payment_screenshot_url || null,
        payment_screenshot_path: payment_screenshot_path || null,
      })
      .select("id, email, status, created_at")
      .single();

    if (insertError) {
      console.error("Error creating application:", insertError);
      return NextResponse.json(
        { error: "Failed to create application" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      application,
    });
  } catch (error) {
    console.error("Error in applications API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const email = searchParams.get("email");

    // Use admin client
    const adminClient = createAdminClient();

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminClient as any)
      .from("client_applications")
      .select(`
        *,
        plan:subscription_plans(id, name, price, duration_days),
        reviewer:coaches!reviewed_by(
          id,
          users!inner(first_name, last_name)
        )
      `)
      .order("created_at", { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq("status", status);
    }
    if (email) {
      query = query.eq("email", email);
    }

    const { data: applications, error } = await query;

    if (error) {
      console.error("Error fetching applications:", error);
      return NextResponse.json(
        { error: "Failed to fetch applications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      applications,
    });
  } catch (error) {
    console.error("Error in applications GET API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
