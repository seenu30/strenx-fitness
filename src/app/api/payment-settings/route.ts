import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// GET: Fetch payment settings (public - for apply form)
export async function GET() {
  try {
    const adminClient = createAdminClient();

    // Get the first coach's payment settings (for single-coach setup)
    // In multi-coach setup, you might want to pass coach_id as query param
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: coach, error } = await (adminClient as any)
      .from("coaches")
      .select("id, upi_id, payment_qr_url")
      .not("upi_id", "is", null)
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching payment settings:", error);
      return NextResponse.json(
        { error: "Failed to fetch payment settings" },
        { status: 500 }
      );
    }

    // Return settings or null if not configured
    return NextResponse.json({
      success: true,
      settings: coach
        ? {
            upiId: coach.upi_id,
            qrCodeUrl: coach.payment_qr_url,
          }
        : null,
    });
  } catch (error) {
    console.error("Error in payment-settings GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT: Update payment settings (coach only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user is a coach
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
        { error: "Only coaches can update payment settings" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (coachError || !coach) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { upiId, qrCodeUrl } = body;

    // Update coach payment settings
    const { error: updateError } = await supabase
      .from("coaches")
      .update({
        upi_id: upiId || null,
        payment_qr_url: qrCodeUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coach.id);

    if (updateError) {
      console.error("Error updating payment settings:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payment settings updated successfully",
    });
  } catch (error) {
    console.error("Error in payment-settings PUT:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
