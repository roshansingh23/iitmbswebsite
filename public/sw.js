// Mismatched service worker. Handles incoming Web Push messages and
// notification clicks. Registration happens client-side from the
// push-permission-prompt component.

self.addEventListener("install", (event) => {
  // Take over right away so push works on the very first visit after
  // install.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch (_) {
    data = { title: "Mismatched", body: event.data.text() };
  }
  const title = data.title || "Mismatched";
  const options = {
    body: data.body || "",
    icon: "/icon-192",
    badge: "/icon-192",
    tag: data.tag || undefined,
    renotify: !!data.tag,
    data: { url: data.url || "/random" },
    vibrate: [120, 60, 120]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/random";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      // Re-use any open Mismatched window if possible.
      for (const c of wins) {
        try {
          const u = new URL(c.url);
          if (u.origin === self.location.origin) {
            c.focus();
            if ("navigate" in c) c.navigate(targetUrl);
            return;
          }
        } catch (_) {}
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});
