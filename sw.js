
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {
    title: 'Assistant DOULIA',
    body: 'Nouvelle mise à jour de votre audit de croissance.',
    icon: '/favicon.ico'
  };

  const options = {
    body: data.body,
    icon: 'https://i.postimg.cc/sDy9NcXs/Gemini_Generated_Image_sac0g0sac0g0sac0_removebg_preview.png',
    badge: 'https://i.postimg.cc/sDy9NcXs/Gemini_Generated_Image_sac0g0sac0g0sac0_removebg_preview.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'explore', title: 'Voir l\'Audit', icon: '' },
      { action: 'close', title: 'Fermer', icon: '' },
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) return client.focus();
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
    );
  }
});
