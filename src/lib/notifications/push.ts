/**
 * Push Notification Utilities for Strenx Fitness
 *
 * Handles VAPID-based web push notifications including:
 * - Service worker registration
 * - Push subscription management
 * - Notification sending via Supabase
 */

import { createClient } from "@/lib/supabase/client";

// Notification types for the application
export type NotificationType =
  | "new_message"
  | "checkin_reminder"
  | "plan_updated"
  | "subscription_expiring"
  | "coach_feedback"
  | "risk_flag"
  | "weekly_summary";

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  type: NotificationType;
  notificationId?: string;
  tag?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  renotify?: boolean;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isPushSupported()) {
    return "unsupported";
  }
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported in this browser");
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    console.warn("Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    // Wait for the service worker to be ready with a timeout
    const readyPromise = navigator.serviceWorker.ready;
    const timeoutPromise = new Promise<ServiceWorkerRegistration>((_, reject) => {
      setTimeout(() => reject(new Error("Service worker ready timeout")), 10000);
    });

    try {
      await Promise.race([readyPromise, timeoutPromise]);
    } catch (timeoutError) {
      console.warn("Service worker ready timeout, continuing anyway");
    }

    console.log("Service Worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Get the current service worker registration
 */
export async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    return registration || null;
  } catch (error) {
    console.error("Failed to get service worker registration:", error);
    return null;
  }
}

/**
 * Convert VAPID public key to Uint8Array for subscription
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  vapidPublicKey: string
): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) {
    throw new Error("Push notifications are not supported");
  }

  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    throw new Error("Notification permission denied");
  }

  let registration = await getServiceWorkerRegistration();
  if (!registration) {
    registration = await registerServiceWorker();
  }

  if (!registration) {
    throw new Error("Service worker registration failed");
  }

  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // If no subscription exists, create one
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // Extract subscription data
    const subscriptionJSON = subscription.toJSON();

    if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
      throw new Error("Invalid subscription data");
    }

    return {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        p256dh: subscriptionJSON.keys.p256dh || "",
        auth: subscriptionJSON.keys.auth || "",
      },
    };
  } catch (error) {
    console.error("Failed to subscribe to push:", error);
    throw error;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return true; // No registration means no subscription
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
    return true;
  } catch (error) {
    console.error("Failed to unsubscribe from push:", error);
    return false;
  }
}

/**
 * Check if user is subscribed to push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  try {
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error("Failed to check push subscription:", error);
    return false;
  }
}

/**
 * Save push subscription to database
 */
export async function savePushSubscription(
  subscriptionData: PushSubscriptionData
): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      console.error("Push subscription: User not authenticated");
      throw new Error("User not authenticated");
    }

    console.log("Saving push subscription for user:", user.user.id);

    // First, try to delete any existing subscription for this user/endpoint
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.user.id)
      .eq("endpoint", subscriptionData.endpoint);

    // Then insert the new subscription
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("push_subscriptions")
      .insert({
        user_id: user.user.id,
        endpoint: subscriptionData.endpoint,
        p256dh_key: subscriptionData.keys.p256dh,
        auth_key: subscriptionData.keys.auth,
      });

    if (error) {
      console.error("Failed to save push subscription:", error);
      return false;
    }

    console.log("Push subscription saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving push subscription:", error);
    return false;
  }
}

/**
 * Remove push subscription from database
 */
export async function removePushSubscription(): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      return false;
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
      return true;
    }

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      return true;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.user.id)
      .eq("endpoint", subscription.endpoint);

    if (error) {
      console.error("Failed to remove push subscription:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error removing push subscription:", error);
    return false;
  }
}

/**
 * Show a local notification (for testing or immediate feedback)
 */
export async function showLocalNotification(
  payload: PushNotificationPayload
): Promise<boolean> {
  const registration = await getServiceWorkerRegistration();
  if (!registration) {
    return false;
  }

  try {
    // Extended notification options (some properties may not be in TypeScript types)
    const options: NotificationOptions & Record<string, unknown> = {
      body: payload.body,
      icon: payload.icon || "/icons/icon-192x192.png",
      badge: payload.badge || "/icons/badge-72x72.png",
      tag: payload.tag || "strenx-local",
      data: {
        url: payload.url || "/",
        type: payload.type,
        notificationId: payload.notificationId,
      },
    };

    // Add extended properties if provided
    if (payload.actions) options.actions = payload.actions;
    if (payload.requireInteraction !== undefined) options.requireInteraction = payload.requireInteraction;
    if (payload.renotify !== undefined) options.renotify = payload.renotify;

    await registration.showNotification(payload.title, options);
    return true;
  } catch (error) {
    console.error("Failed to show notification:", error);
    return false;
  }
}

/**
 * Get notification templates for different types
 */
export function getNotificationTemplate(
  type: NotificationType,
  data: Record<string, string>
): PushNotificationPayload {
  const templates: Record<NotificationType, () => PushNotificationPayload> = {
    new_message: () => ({
      title: `New message from ${data.senderName || "your coach"}`,
      body: data.preview || "You have a new message",
      type: "new_message",
      url: `/messages`,
      tag: `message-${data.conversationId}`,
      actions: [
        { action: "reply", title: "Reply" },
        { action: "dismiss", title: "Dismiss" },
      ],
      renotify: true,
    }),
    checkin_reminder: () => ({
      title: "Daily Check-in Reminder",
      body: data.message || "Don't forget to complete your daily check-in!",
      type: "checkin_reminder",
      url: "/check-in/daily",
      tag: "checkin-reminder",
      requireInteraction: true,
    }),
    plan_updated: () => ({
      title: "Your Plan Has Been Updated",
      body: data.message || "Your coach has updated your plan. Check it out!",
      type: "plan_updated",
      url: "/plans",
      tag: "plan-update",
    }),
    subscription_expiring: () => ({
      title: "Subscription Expiring Soon",
      body: data.message || `Your subscription expires in ${data.days || "a few"} days`,
      type: "subscription_expiring",
      url: "/subscription",
      tag: "subscription-expiry",
      requireInteraction: true,
    }),
    coach_feedback: () => ({
      title: "Feedback from Your Coach",
      body: data.message || "Your coach has left feedback on your progress",
      type: "coach_feedback",
      url: data.url || "/progress",
      tag: "coach-feedback",
    }),
    risk_flag: () => ({
      title: "Action Required",
      body: data.message || "A risk flag has been raised that requires attention",
      type: "risk_flag",
      url: "/admin/risk-flags",
      tag: `risk-flag-${data.flagId}`,
      requireInteraction: true,
    }),
    weekly_summary: () => ({
      title: "Your Weekly Summary",
      body: data.message || "Check out your progress this week!",
      type: "weekly_summary",
      url: "/progress",
      tag: "weekly-summary",
    }),
  };

  return templates[type]();
}
