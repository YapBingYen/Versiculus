self.addEventListener('push', function(event) {
  const defaultData = { title: 'Versiculus', body: 'A new daily verse is waiting for you!' };
  
  event.waitUntil((async () => {
    let data = defaultData;
    if (event.data) {
      try {
        data = event.data.json();
      } catch {
        try {
          const text = event.data.text();
          if (text) data = { title: defaultData.title, body: text };
        } catch {}
      }
    }

    const options = {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '1'
      }
    };

    await self.registration.showNotification(data.title || defaultData.title, options);
  })());
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(`${self.location.origin}/play`)
  );
});
