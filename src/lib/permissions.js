const ROLE_RANK = {
  user: 1,
  admin: 2,
  ceo: 3,
};

export function roleRank(role) {
  return ROLE_RANK[role] || 0;
}

export function canCreateAccounts(actorRole) {
  return actorRole === 'admin' || actorRole === 'ceo';
}

export function canManageTarget(actor, target) {
  if (!actor || !target) return false;
  if (target.role === 'ceo') return false;
  if (target.role === 'admin') return false;
  return roleRank(actor.role) > roleRank(target.role);
}

export function canEditTarget(actor, target) {
  if (!actor || !target) return false;
  if (actor.id === target.id) return true;
  return canManageTarget(actor, target);
}

export function canDeleteTarget(actor, target) {
  if (!actor || !target) return false;
  if (target.role !== 'user') return false;
  return canManageTarget(actor, target);
}

export function canUnlockTarget(actor, target) {
  if (!actor || !target) return false;
  if (target.role !== 'user') return false;
  return canManageTarget(actor, target);
}

export function isSelf(actor, target) {
  return !!actor?.id && !!target?.id && actor.id === target.id;
}
