self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : { title: 'Versiculus', body: 'A new daily verse is waiting for you!' };
  
  const options = {
    body: data.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');
  event.notification.close();
  event.waitUntil(
    clients.openWindow('http://localhost:3000')
  );
});