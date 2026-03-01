"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  isSubscribedToPush,
  savePushSubscription,
  removePushSubscription,
  registerServiceWorker,
} from "@/lib/notifications/push";

export interface UsePushNotificationsReturn {
  // State
  isSupported: boolean;
  permission: NotificationPermission | "unsupported";
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

/**
 * Hook for managing push notification subscriptions
 *
 * Usage:
 * const { isSubscribed, subscribe, unsubscribe } = usePushNotifications();
 */
export function usePushNotifications(): UsePushNotificationsReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("unsupported");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check support and current status on mount
  useEffect(() => {
    const checkStatus = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const supported = isPushSupported();
        setIsSupported(supported);

        if (!supported) {
          setPermission("unsupported");
          setIsSubscribed(false);
          return;
        }

        // Get current permission
        const currentPermission = getNotificationPermission();
        setPermission(currentPermission);

        // Check if already subscribed
        if (currentPermission === "granted") {
          const subscribed = await isSubscribedToPush();
          setIsSubscribed(subscribed);
        } else {
          setIsSubscribed(false);
        }

        // Register service worker in background
        registerServiceWorker().catch(console.error);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check notification status");
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      throw new Error("Push notifications not supported");
    }

    setError(null);

    try {
      const newPermission = await requestNotificationPermission();
      setPermission(newPermission);
      return newPermission;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to request permission";
      setError(message);
      throw err;
    }
  }, [isSupported]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("Push notifications not supported");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Get VAPID public key from environment
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        throw new Error("VAPID public key not configured");
      }

      // Subscribe to push
      const subscriptionData = await subscribeToPush(vapidPublicKey);
      if (!subscriptionData) {
        throw new Error("Failed to create subscription");
      }

      // Save subscription to database
      const saved = await savePushSubscription(subscriptionData);
      if (!saved) {
        throw new Error("Failed to save subscription");
      }

      setIsSubscribed(true);
      setPermission("granted");
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to subscribe";
      setError(message);
      setIsSubscribed(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Remove from database first
      await removePushSubscription();

      // Unsubscribe from push manager
      const unsubscribed = await unsubscribeFromPush();
      if (!unsubscribed) {
        throw new Error("Failed to unsubscribe");
      }

      setIsSubscribed(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to unsubscribe";
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

/**
 * Simple hook to check if notifications are enabled
 */
export function useNotificationStatus(): {
  enabled: boolean;
  permission: NotificationPermission | "unsupported";
} {
  const [status, setStatus] = useState<{
    enabled: boolean;
    permission: NotificationPermission | "unsupported";
  }>({
    enabled: false,
    permission: "unsupported",
  });

  useEffect(() => {
    const check = async () => {
      if (!isPushSupported()) {
        setStatus({ enabled: false, permission: "unsupported" });
        return;
      }

      const permission = getNotificationPermission();
      const subscribed = permission === "granted" ? await isSubscribedToPush() : false;

      setStatus({
        enabled: subscribed,
        permission,
      });
    };

    check();
  }, []);

  return status;
}
