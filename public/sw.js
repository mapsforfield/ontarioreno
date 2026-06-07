// OntarioReno Portal — Service Worker for Web Push notifications

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'OntarioReno Portal', {
      body: data.body ?? '',
      icon: '/logo.png',
      badge: '/logo.png',
      tag: data.tag ?? 'ontarioreno',
      renotify: true,
      data: { url: data.url ?? '/portal/appointments' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url ?? '/portal/appointments';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow ? clients.openWindow(url) : undefined;
    })
  );
});
