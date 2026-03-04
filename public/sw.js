/**
 * Service Worker for Strenx Fitness Push Notifications
 * Handles push events and notification clicks
 */

const CACHE_NAME = "strenx-v2";

// Install event - cache essential assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache files individually to prevent one failure from blocking installation
      return Promise.allSettled([
        cache.add("/").catch(() => console.log("Failed to cache /")),
        cache.add("/offline.html").catch(() => console.log("Failed to cache /offline.html")),
      ]);
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Take control immediately
  self.clients.claim();
});

// Push event - handle incoming push notifications
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch {
    data = {
      title: "Strenx Fitness",
      body: event.data.text(),
      icon: "/icons/icon-192x192.png",
    };
  }

  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/badge-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/",
      notificationId: data.notificationId,
      type: data.type,
    },
    actions: data.actions || [],
    tag: data.tag || "strenx-notification",
    renotify: data.renotify || false,
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Strenx Fitness", options)
  );
});

// Notification click event - handle user interaction
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  // Handle action buttons
  if (event.action) {
    switch (event.action) {
      case "view":
        // Open the specific URL
        break;
      case "dismiss":
        // Just close the notification
        return;
      case "reply":
        // Open messages
        event.waitUntil(
          clients.openWindow("/messages")
        );
        return;
    }
  }

  // Focus existing window or open new one
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(urlToOpen);
          return;
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener("notificationclose", (event) => {
  // Track dismissed notifications if needed
  console.log("Notification closed:", event.notification.tag);
});

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-checkin") {
    event.waitUntil(syncCheckins());
  } else if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }
});

// Sync functions for offline support
async function syncCheckins() {
  try {
    const cache = await caches.open("strenx-offline-data");
    const pendingCheckins = await cache.match("/offline/checkins");
    if (pendingCheckins) {
      const data = await pendingCheckins.json();
      // Send to server when back online
      await fetch("/api/check-in/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await cache.delete("/offline/checkins");
    }
  } catch (error) {
    console.error("Sync checkins failed:", error);
  }
}

async function syncMessages() {
  try {
    const cache = await caches.open("strenx-offline-data");
    const pendingMessages = await cache.match("/offline/messages");
    if (pendingMessages) {
      const data = await pendingMessages.json();
      // Send to server when back online
      await fetch("/api/messages/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await cache.delete("/offline/messages");
    }
  } catch (error) {
    console.error("Sync messages failed:", error);
  }
}
