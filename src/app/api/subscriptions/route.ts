import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const createSubscriptionSchema = z.object({
  clientId: z.string().uuid("Invalid client ID"),
  planId: z.string().uuid("Invalid plan ID"),
  customAmount: z.number().positive().optional(),
  isPaid: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    const validation = createSubscriptionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { clientId, planId, customAmount, isPaid } = validation.data;

    // Get authenticated user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user role and coach ID
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "coach") {
      return NextResponse.json(
        { error: "Only coaches can create subscriptions" },
        { status: 403 }
      );
    }

    // Get coach ID
    const { data: coachData } = await supabase
      .from("coaches")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!coachData) {
      return NextResponse.json(
        { error: "Coach profile not found" },
        { status: 404 }
      );
    }

    // Verify the client belongs to this coach
    const { data: clientData } = await supabase
      .from("clients")
      .select("id, coach_id")
      .eq("id", clientId)
      .single();

    if (!clientData) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    if (clientData.coach_id !== coachData.id) {
      return NextResponse.json(
        { error: "You can only create subscriptions for your own clients" },
        { status: 403 }
      );
    }

    // Get plan details
    const { data: planData } = await supabase
      .from("subscription_plans")
      .select("id, name, price_amount, duration_days")
      .eq("id", planId)
      .eq("is_active", true)
      .single();

    if (!planData) {
      return NextResponse.json(
        { error: "Plan not found or inactive" },
        { status: 404 }
      );
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + planData.duration_days);

    // Create subscription
    const amount = customAmount || planData.price_amount;
    const status = isPaid ? "active" : "unpaid";

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        client_id: clientId,
        plan_id: planId,
        status,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        amount_paid: amount,
      })
      .select()
      .single();

    if (subError) {
      console.error("Error creating subscription:", subError);
      return NextResponse.json(
        { error: "Failed to create subscription" },
        { status: 500 }
      );
    }

    // If paid, create payment record
    if (isPaid) {
      await supabase.from("payments").insert({
        client_id: clientId,
        subscription_id: subscription.id,
        amount,
        status: "completed",
        payment_method: "manual",
        payment_date: new Date().toISOString(),
        notes: "Payment recorded at subscription creation",
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        startDate: subscription.start_date,
        endDate: subscription.end_date,
        amount,
      },
    });
  } catch (error) {
    console.error("Error in create subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
