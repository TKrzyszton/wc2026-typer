self.addEventListener('push', event => {
  let data = {};
  try { data = event.data?.json() || {}; } catch (e) {}
  event.waitUntil(
    fetch('/api/sw-ping', { method: 'POST' }).catch(() => {}).then(() =>
      self.registration.showNotification(data.title || '⚽ MŚ 2026 Typer', {
        body: data.body || 'Masz nieobstawiony mecz!',
        icon: '/pwa-192.png',
        badge: '/pwa-192.png',
        data: { url: data.url || '/' },
      })
    )
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const url = event.notification.data?.url || '/';
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
