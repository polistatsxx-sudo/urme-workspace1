export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function sendNotification(title, body, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        ...options,
      });
      return true;
    } catch {
      // fall back to toast
      return false;
    }
  }
  return false;
}

export function checkAndNotify(tasks, businesses) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const notifications = [];

  // Overdue/due-today tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const taskAlerts = tasks
    .filter(t => t.status !== 'done')
    .filter(t => {
      if (!t.due_date) return false;
      const due = new Date(t.due_date);
      due.setHours(0, 0, 0, 0);
      return due <= today;
    })
    .map(t => ({
      title: '⏰ Task Due',
      body: t.title,
    }));
  notifications.push(...taskAlerts);

  // Stale businesses needing follow-up
  const now = new Date();
  const staleAlerts = businesses
    .filter(b => b.stage !== 'archived' && b.last_interaction_date)
    .map(b => {
      const days = Math.floor((now - new Date(b.last_interaction_date)) / (1000 * 60 * 60 * 24));
      return { biz: b, days };
    })
    .filter(({ days }) => days >= 14)
    .map(({ biz, days }) => ({
      title: '📞 Follow up',
      body: `${biz.name} — ${days} days since last contact`,
    }));
  notifications.push(...staleAlerts);

  // Limit to 3
  notifications.slice(0, 3).forEach(n => sendNotification(n.title, n.body));
}