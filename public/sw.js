// Inert until push is wired up: nothing calls registration.pushManager.subscribe(),
// so no push subscription exists and this handler never fires. In-app alerts use
// the Notification API directly from src/utils/notifications.js.
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'URME', {
      body: data.body || '',
      icon: '/favicon.ico',
    })
  );
});
