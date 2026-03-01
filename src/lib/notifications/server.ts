/**
 * Server-side Push Notification Utilities
 *
 * Handles sending push notifications from the server using web-push
 * This file should only be imported in server components or API routes
 */

import webpush from "web-push";
import type { PushNotificationPayload } from "./push";

// Type for push subscription from database
interface StoredSubscription {
  user_id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

/**
 * Initialize web-push with VAPID keys
 * Call this once at server startup or in API routes
 */
export function initializeWebPush(): void {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
  const vapidEmail = process.env.VAPID_EMAIL || "mailto:admin@strenx.com";

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.warn("VAPID keys not configured - push notifications disabled");
    return;
  }

  webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
}

/**
 * Convert stored subscription to web-push format
 */
function toWebPushSubscription(sub: StoredSubscription): webpush.PushSubscription {
  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: sub.p256dh_key,
      auth: sub.auth_key,
    },
  };
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(
  subscription: StoredSubscription,
  payload: PushNotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const webPushSub = toWebPushSubscription(subscription);

    await webpush.sendNotification(webPushSub, JSON.stringify(payload), {
      TTL: 60 * 60 * 24, // 24 hours
      urgency: payload.requireInteraction ? "high" : "normal",
    });

    return { success: true };
  } catch (error) {
    const err = error as { statusCode?: number; message?: string };

    // Handle expired/invalid subscriptions
    if (err.statusCode === 410 || err.statusCode === 404) {
      return {
        success: false,
        error: "subscription_expired",
      };
    }

    return {
      success: false,
      error: err.message || "Failed to send notification",
    };
  }
}

/**
 * Send push notification to multiple subscriptions
 */
export async function sendPushNotificationBatch(
  subscriptions: StoredSubscription[],
  payload: PushNotificationPayload
): Promise<{
  sent: number;
  failed: number;
  expired: string[];
}> {
  const results = await Promise.allSettled(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  const expired: string[] = [];
  let sent = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      if (result.value.success) {
        sent++;
      } else if (result.value.error === "subscription_expired") {
        expired.push(subscriptions[index].endpoint);
        failed++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  });

  return { sent, failed, expired };
}

/**
 * Generate VAPID keys (run once during setup)
 * Save these in environment variables
 */
export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  const keys = webpush.generateVAPIDKeys();
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}
