export function hasActiveAccess(user) {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.subscription_status === 'active') return true;
  if (user.paid_through_date) {
    const paidThrough = new Date(user.paid_through_date);
    paidThrough.setHours(23, 59, 59);
    if (paidThrough >= new Date()) return true;
  }
  return false;
}

export function getDaysRemaining(user) {
  if (!user?.paid_through_date) return null;
  const paidThrough = new Date(user.paid_through_date);
  const today = new Date();
  const diff = Math.ceil((paidThrough - today) / (1000 * 60 * 60 * 24));
  return diff;
}

export function isExpiringSoon(user) {
  const days = getDaysRemaining(user);
  return days !== null && days > 0 && days <= 14;
}