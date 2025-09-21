// This is a basic service worker for handling push notifications.

self.addEventListener('push', event => {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  const data = event.data.json();
  console.log('New notification', data);

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png', // Default icon
    badge: data.badge || '/badge-72x72.png', // Default badge
    data: data.data,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('On notification click: ', event.notification.tag);
  event.notification.close();

  // This looks for an open window matching the given URL and focuses it.
  const urlToOpen = event.notification.data.url || '/';
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
