import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { initializeWebPush, sendPushNotificationBatch } from "@/lib/notifications/server";
import type { PushNotificationPayload } from "@/lib/notifications/push";

// Initialize web push on module load
initializeWebPush();

interface NotifyRequest {
  conversationId: string;
  messageContent: string;
  recipientId: string;
}

/**
 * POST /api/messages/notify
 * Send push notification when a new message is sent
 * Can be called by any authenticated user (client or coach)
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

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: NotifyRequest = await request.json();
    const { conversationId, messageContent, recipientId } = body;

    if (!conversationId || !recipientId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get sender's name for notification
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: senderData } = await (supabase as any)
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    const senderName = senderData
      ? `${senderData.first_name || ""} ${senderData.last_name || ""}`.trim() || "Someone"
      : "Someone";

    // Use admin client to fetch recipient's push subscriptions
    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Get recipient's push subscriptions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: subscriptions, error: fetchError } = await (adminClient as any)
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", recipientId);

    if (fetchError) {
      console.error("Failed to fetch subscriptions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch subscriptions" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      // No subscriptions - user hasn't enabled notifications
      return NextResponse.json({
        success: true,
        sent: 0,
        message: "Recipient has not enabled push notifications",
      });
    }

    // Truncate message for preview
    const preview = messageContent.length > 100
      ? messageContent.substring(0, 100) + "..."
      : messageContent;

    // Prepare notification payload
    const payload: PushNotificationPayload = {
      title: `New message from ${senderName}`,
      body: preview,
      type: "new_message",
      url: "/messages",
      tag: `message-${conversationId}`,
      notificationId: crypto.randomUUID(),
      actions: [
        { action: "reply", title: "Reply" },
        { action: "dismiss", title: "Dismiss" },
      ],
      renotify: true,
    };

    // Send notifications
    const result = await sendPushNotificationBatch(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      subscriptions.map((sub: any) => ({
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
    console.error("Message notify error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
