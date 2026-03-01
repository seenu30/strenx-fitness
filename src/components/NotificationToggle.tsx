"use client";

import { useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface NotificationToggleProps {
  compact?: boolean;
}

export function NotificationToggle({ compact = false }: NotificationToggleProps) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();
  const [localLoading, setLocalLoading] = useState(false);

  const handleToggle = async () => {
    setLocalLoading(true);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (err) {
      console.error("Notification toggle error:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  const loading = isLoading || localLoading;

  // Not supported
  if (!isSupported) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <BellOff className="w-4 h-4" />
        <span>Notifications not supported</span>
      </div>
    );
  }

  // Permission denied
  if (permission === "denied") {
    if (compact) {
      return (
        <button
          disabled
          className="p-2 text-muted-foreground rounded-lg cursor-not-allowed"
          title="Notifications blocked in browser settings"
        >
          <BellOff className="w-5 h-5" />
        </button>
      );
    }
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <BellOff className="w-4 h-4" />
        <span>Notifications blocked in browser</span>
      </div>
    );
  }

  // Compact version for header
  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`p-2 rounded-lg transition-colors ${
          isSubscribed
            ? "text-primary bg-primary/10 hover:bg-primary/20"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        }`}
        title={isSubscribed ? "Notifications enabled" : "Enable notifications"}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSubscribed ? (
          <Bell className="w-5 h-5" />
        ) : (
          <BellOff className="w-5 h-5" />
        )}
      </button>
    );
  }

  // Full version
  return (
    <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
      <div className="flex items-center gap-3">
        {isSubscribed ? (
          <Bell className="w-5 h-5 text-primary" />
        ) : (
          <BellOff className="w-5 h-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-sm font-medium text-foreground">
            Push Notifications
          </p>
          <p className="text-xs text-muted-foreground">
            {isSubscribed
              ? "You'll receive notifications for new messages"
              : "Enable to get notified of new messages"}
          </p>
        </div>
      </div>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
          isSubscribed
            ? "bg-secondary text-foreground hover:bg-secondary/80"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        } disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isSubscribed ? (
          "Disable"
        ) : (
          "Enable"
        )}
      </button>
      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
