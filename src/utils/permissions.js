/**
 * Account-management permission rule.
 *
 * This module is the client half of a rule that is enforced on the server. The Deno
 * mirror lives in `supabase/functions/_shared/permissions.ts` — Edge Functions cannot
 * import from `src/`, so the predicates are duplicated there and
 * `src/utils/permissions.test.js` asserts the two copies agree across the whole
 * caller/target matrix. Change one, change the other.
 *
 * Client-side checks here are UX only: RLS and the Edge Functions are the boundary.
 *
 * @typedef {{ id?: string, role?: string, email?: string }} Account
 */

/** Michael Alexander — super-admin. */
export const MICHAEL_ID = '24332e6e-fc06-46c4-a491-dc32e1efc58e';
/** AJ Macedonia — CEO. */
export const AJ_ID = 'bd91c741-0173-49fb-b715-8ae6c90919f0';

/**
 * Protection is keyed on the user id, never on the email or the name. The email is
 * documentation plus a drift check: this database has been rebuilt by hand before, and
 * a rebuild that reissues ids would silently point a protected id at a different person.
 * `findProtectedIdentityDrift` is how that gets noticed; it never grants or denies.
 */
export const PROTECTED_ACCOUNTS = [
  { id: MICHAEL_ID, email: 'polistatsxx@gmail.com', label: 'Michael Alexander' },
  { id: AJ_ID, email: 'macecnc@urmeinc.com', label: 'AJ Macedonia' },
];

/** Roles that may manage other accounts at all. */
export const MANAGER_ROLES = ['ceo', 'admin'];

/** Roles a profile is allowed to hold. */
export const ROLES = ['user', 'admin', 'ceo'];

/**
 * @param {Account | null | undefined} caller
 * @param {Account | null | undefined} target
 */
export function isSelf(caller, target) {
  return !!caller?.id && !!target?.id && caller.id === target.id;
}

/**
 * May `caller` administer `target`'s account — edit another member's profile, change
 * their role, unlock or delete them?
 *
 * Michael manages anyone. AJ (and any future admin) manages anyone except Michael and
 * AJ themselves. Standard members manage nobody; editing your own profile is not
 * management, see `canEditProfile`.
 *
 * @param {Account | null | undefined} caller
 * @param {Account | null | undefined} target
 */
export function canManage(caller, target) {
  if (!caller?.id || !target?.id) return false;
  if (target.id === MICHAEL_ID) return caller.id === MICHAEL_ID;
  if (target.id === AJ_ID) return caller.id === MICHAEL_ID;
  return MANAGER_ROLES.includes(caller.role);
}

/**
 * Everyone may edit their own profile; editing anyone else's is management.
 *
 * @param {Account | null | undefined} caller
 * @param {Account | null | undefined} target
 */
export function canEditProfile(caller, target) {
  if (isSelf(caller, target)) return true;
  return canManage(caller, target);
}

/**
 * @param {Account | null | undefined} caller
 * @param {Account | null | undefined} target
 */
export function canUnlockAccount(caller, target) {
  return canManage(caller, target);
}

/**
 * Deletion additionally refuses privileged targets and self-deletion: both are
 * unrecoverable from the UI. An admin or CEO account has to be demoted first, which is
 * itself a managed action.
 *
 * @param {Account | null | undefined} caller
 * @param {Account | null | undefined} target
 */
export function canDeleteAccount(caller, target) {
  if (isSelf(caller, target)) return false;
  if (!canManage(caller, target)) return false;
  return target?.role === 'user';
}

/**
 * Nobody changes their own role — that is the only way a lone admin can strand the app
 * with no privileged account left.
 *
 * @param {Account | null | undefined} caller
 * @param {Account | null | undefined} target
 */
export function canChangeRole(caller, target) {
  if (isSelf(caller, target)) return false;
  return canManage(caller, target);
}

/**
 * Add/invite has no existing target to check, so it falls back to the role gate.
 *
 * @param {string | undefined} callerRole
 */
export function canCreateAccounts(callerRole) {
  return MANAGER_ROLES.includes(callerRole);
}

/**
 * Would demoting or deleting `targetId` leave the app with no admin or CEO at all?
 * Pass `nextRole: null` for a deletion.
 *
 * @param {Account[]} allProfiles
 * @param {string} targetId
 * @param {string | null} nextRole
 */
export function wouldLeaveNoPrivilegedAccount(allProfiles, targetId, nextRole) {
  const others = (allProfiles || []).filter((p) => p?.id !== targetId);
  if (others.some((p) => MANAGER_ROLES.includes(p?.role))) return false;
  return !(nextRole && MANAGER_ROLES.includes(nextRole));
}

/**
 * Cross-check the hardcoded protected ids against the ids actually in `profiles`.
 * A mismatch means the constants above no longer protect who they claim to.
 *
 * Rows the caller cannot see are only reported when `requirePresence` is set, because a
 * standard member's RLS-filtered user list legitimately lacks them.
 *
 * @param {Account[]} allProfiles
 * @param {{ requirePresence?: boolean }} [options]
 */
export function findProtectedIdentityDrift(allProfiles, options = {}) {
  const profiles = allProfiles || [];
  return PROTECTED_ACCOUNTS.flatMap((account) => {
    const row = profiles.find((p) => p?.id === account.id);
    if (!row) {
      return options.requirePresence
        ? [{ id: account.id, label: account.label, expectedEmail: account.email, actualEmail: null, reason: 'missing' }]
        : [];
    }
    const actualEmail = String(row.email || '').trim().toLowerCase();
    if (actualEmail !== account.email) {
      return [{ id: account.id, label: account.label, expectedEmail: account.email, actualEmail, reason: 'email-mismatch' }];
    }
    return [];
  });
}

/**
 * @param {Account[]} allProfiles
 * @param {{ requirePresence?: boolean }} [options]
 */
export function warnOnProtectedIdentityDrift(allProfiles, options = {}) {
  const drift = findProtectedIdentityDrift(allProfiles, options);
  for (const entry of drift) {
    console.warn(
      `[permissions] PROTECTED IDENTITY DRIFT: ${entry.label} (${entry.id}) is ${entry.reason === 'missing' ? 'not in profiles' : `now ${entry.actualEmail}`}, expected ${entry.expectedEmail}. Account protection may no longer cover the intended person.`
    );
  }
  return drift;
}
