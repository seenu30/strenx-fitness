import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validateInput, validationErrorResponse, confirmPaymentSchema, uuidSchema } from "@/lib/validation/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    const idValidation = validateInput(uuidSchema, id);
    if (!idValidation.success) {
      return NextResponse.json(
        { error: "Invalid application ID format" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validate input with Zod schema
    const validation = validateInput(confirmPaymentSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        validationErrorResponse(validation.errors),
        { status: 400 }
      );
    }

    const { payment_reference, payment_method, custom_amount } = validation.data;

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
        { error: "Only coaches can confirm payments" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single() as { data: { id: string } | null };

    const adminClient = createAdminClient();

    // Get current application
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: application, error: fetchError } = await (adminClient as any)
      .from("client_applications")
      .select("id, status, email, selected_plan_id")
      .eq("id", id)
      .single();

    if (fetchError || !application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    // Check if application can have payment confirmed
    if (application.status !== "approved") {
      return NextResponse.json(
        { error: `Payment can only be confirmed for approved applications. Current status: ${application.status}` },
        { status: 400 }
      );
    }

    // Update application with payment info
    const updateData: Record<string, unknown> = {
      status: "payment_received",
      payment_confirmed: true,
      payment_confirmed_at: new Date().toISOString(),
      payment_confirmed_by: coach?.id || null,
      payment_reference,
      payment_method: payment_method || "manual",
      updated_at: new Date().toISOString(),
    };

    if (custom_amount !== undefined) {
      updateData.custom_amount = custom_amount;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedApp, error: updateError } = await (adminClient as any)
      .from("client_applications")
      .update(updateData)
      .eq("id", id)
      .select("id, email, status, payment_reference, payment_confirmed_at")
      .single();

    if (updateError) {
      console.error("Error updating application:", updateError);
      return NextResponse.json(
        { error: "Failed to confirm payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment confirmed",
      application: updatedApp,
    });
  } catch (error) {
    console.error("Error in payment confirmation API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
