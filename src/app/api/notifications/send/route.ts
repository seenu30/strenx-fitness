import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { initializeWebPush, sendPushNotificationBatch } from "@/lib/notifications/server";
import type { PushNotificationPayload } from "@/lib/notifications/push";

// Initialize web push on module load
initializeWebPush();

interface SendNotificationRequest {
  userId?: string;
  userIds?: string[];
  type: string;
  title: string;
  body: string;
  url?: string;
  data?: Record<string, string>;
}

/**
 * POST /api/notifications/send
 * Send push notification to user(s)
 * Requires admin/coach role
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Server error" },
        { status: 500 }
      );
    }

    // Verify user is authenticated and has appropriate role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has coach or admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: userData } = await (supabase as any)
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || !["coach", "admin"].includes(userData.role)) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    const body: SendNotificationRequest = await request.json();
    const { userId, userIds, type, title, body: notificationBody, url, data } = body;

    if (!title || !notificationBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // Use admin client to fetch subscriptions
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Build query for subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (adminClient as any).from("push_subscriptions").select("*");

    if (userId) {
      query = query.eq("user_id", userId);
    } else if (userIds && userIds.length > 0) {
      query = query.in("user_id", userIds);
    } else {
      return NextResponse.json(
        { error: "userId or userIds required" },
        { status: 400 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error: fetchError } = await query as { data: any[]; error: any };

    if (fetchError) {
      console.error("Failed to fetch subscriptions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "No subscriptions found for specified users",
      });
    }

    // Prepare notification payload
    const payload: PushNotificationPayload = {
      title,
      body: notificationBody,
      type: type as PushNotificationPayload["type"],
      url: url || "/",
      notificationId: crypto.randomUUID(),
      ...data,
    };

    // Send notifications
    const result = await sendPushNotificationBatch(
      subscriptions.map((sub) => ({
        user_id: sub.user_id,
        endpoint: sub.endpoint,
        p256dh_key: sub.p256dh_key,
        auth_key: sub.auth_key,
      })),
      payload
    );

    // Clean up expired subscriptions
    if (result.expired.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (adminClient as any)
        .from("push_subscriptions")
        .delete()
        .in("endpoint", result.expired);
    }

    return NextResponse.json({
      success: true,
      sent: result.sent,
      failed: result.failed,
      expired: result.expired.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
