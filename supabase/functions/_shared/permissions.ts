/**
 * Account-management permission rule — server copy.
 *
 * Mirror of `src/utils/permissions.js`. Edge Functions run on Deno and cannot import
 * from the Vite `src/` tree, so the predicates are duplicated here;
 * `src/utils/permissions.test.js` imports both files and asserts they agree across the
 * whole caller/target matrix. Change one, change the other.
 *
 * The `authorize*` helpers below are server-only: they turn a predicate into the HTTP
 * answer each Edge Function returns, including the guards that stop an admin from
 * locking the app out of its own administration.
 */

export type Account = {
  id?: string | null;
  role?: string | null;
  email?: string | null;
};

export type AuthorizationResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** Michael Alexander — super-admin. */
export const MICHAEL_ID = '24332e6e-fc06-46c4-a491-dc32e1efc58e';
/** AJ Macedonia — CEO. */
export const AJ_ID = 'bd91c741-0173-49fb-b715-8ae6c90919f0';

/**
 * Protection is keyed on the user id, never on the email or the name. The email is
 * documentation plus a drift check: this database has been rebuilt by hand before, and
 * a rebuild that reissues ids would silently point a protected id at a different person.
 */
export const PROTECTED_ACCOUNTS = [
  { id: MICHAEL_ID, email: 'polistatsxx@gmail.com', label: 'Michael Alexander' },
  { id: AJ_ID, email: 'macecnc@urmeinc.com', label: 'AJ Macedonia' },
];

/** Roles that may manage other accounts at all. */
export const MANAGER_ROLES = ['ceo', 'admin'];

/** Roles a profile is allowed to hold. */
export const ROLES = ['user', 'admin', 'ceo'];

/** Profile columns anyone may write on a profile they are allowed to edit. */
export const PROFILE_FIELDS = [
  'display_name',
  'full_name',
  'job_title',
  'phone',
  'bio',
  'linkedin',
  'department',
  'location',
  'skills',
  'status',
  'profile_photo',
];

/** Profile columns that require management rights over the target, not just edit rights. */
export const MANAGEMENT_FIELDS = ['subscription_status', 'paid_through_date', 'role'];

export function isSelf(caller?: Account | null, target?: Account | null): boolean {
  return !!caller?.id && !!target?.id && caller.id === target.id;
}

/**
 * May `caller` administer `target`'s account — edit another member's profile, change
 * their role, unlock or delete them?
 *
 * Michael manages anyone. AJ (and any future admin) manages anyone except Michael and
 * AJ themselves. Standard members manage nobody; editing your own profile is not
 * management, see `canEditProfile`.
 */
export function canManage(caller?: Account | null, target?: Account | null): boolean {
  if (!caller?.id || !target?.id) return false;
  if (target.id === MICHAEL_ID) return caller.id === MICHAEL_ID;
  if (target.id === AJ_ID) return caller.id === MICHAEL_ID;
  return MANAGER_ROLES.includes(caller.role ?? '');
}

/** Everyone may edit their own profile; editing anyone else's is management. */
export function canEditProfile(caller?: Account | null, target?: Account | null): boolean {
  if (isSelf(caller, target)) return true;
  return canManage(caller, target);
}

export function canUnlockAccount(caller?: Account | null, target?: Account | null): boolean {
  return canManage(caller, target);
}

/**
 * Deletion additionally refuses privileged targets and self-deletion: both are
 * unrecoverable from the UI. An admin or CEO account has to be demoted first, which is
 * itself a managed action.
 */
export function canDeleteAccount(caller?: Account | null, target?: Account | null): boolean {
  if (isSelf(caller, target)) return false;
  if (!canManage(caller, target)) return false;
  return target?.role === 'user';
}

/**
 * Nobody changes their own role — that is the only way a lone admin can strand the app
 * with no privileged account left.
 */
export function canChangeRole(caller?: Account | null, target?: Account | null): boolean {
  if (isSelf(caller, target)) return false;
  return canManage(caller, target);
}

/** Add/invite has no existing target to check, so it falls back to the role gate. */
export function canCreateAccounts(callerRole?: string | null): boolean {
  return MANAGER_ROLES.includes(callerRole ?? '');
}

/**
 * Would demoting or deleting `targetId` leave the app with no admin or CEO at all?
 * Pass `nextRole: null` for a deletion.
 */
export function wouldLeaveNoPrivilegedAccount(
  allProfiles: Account[],
  targetId: string,
  nextRole: string | null,
): boolean {
  const others = (allProfiles || []).filter((p) => p?.id !== targetId);
  if (others.some((p) => MANAGER_ROLES.includes(p?.role ?? ''))) return false;
  return !(nextRole && MANAGER_ROLES.includes(nextRole));
}

export type IdentityDrift = {
  id: string;
  label: string;
  expectedEmail: string;
  actualEmail: string | null;
  reason: 'missing' | 'email-mismatch';
};

/**
 * Cross-check the hardcoded protected ids against the ids actually in `profiles`.
 * A mismatch means the constants above no longer protect who they claim to.
 */
export function findProtectedIdentityDrift(
  allProfiles: Account[],
  options: { requirePresence?: boolean } = {},
): IdentityDrift[] {
  const profiles = allProfiles || [];
  return PROTECTED_ACCOUNTS.flatMap((account): IdentityDrift[] => {
    const row = profiles.find((p) => p?.id === account.id);
    if (!row) {
      return options.requirePresence
        ? [{
          id: account.id,
          label: account.label,
          expectedEmail: account.email,
          actualEmail: null,
          reason: 'missing',
        }]
        : [];
    }
    const actualEmail = String(row.email || '').trim().toLowerCase();
    if (actualEmail !== account.email) {
      return [{
        id: account.id,
        label: account.label,
        expectedEmail: account.email,
        actualEmail,
        reason: 'email-mismatch',
      }];
    }
    return [];
  });
}

export function warnOnProtectedIdentityDrift(
  allProfiles: Account[],
  options: { requirePresence?: boolean } = {},
): IdentityDrift[] {
  const drift = findProtectedIdentityDrift(allProfiles, options);
  for (const entry of drift) {
    console.warn(
      `[permissions] PROTECTED IDENTITY DRIFT: ${entry.label} (${entry.id}) is ${
        entry.reason === 'missing' ? 'not in profiles' : `now ${entry.actualEmail}`
      }, expected ${entry.expectedEmail}. Account protection may no longer cover the intended person.`,
    );
  }
  return drift;
}

const forbidden = (error: string): AuthorizationResult => ({ ok: false, status: 403, error });
const badRequest = (error: string): AuthorizationResult => ({ ok: false, status: 400, error });

/** create-user: no target exists yet, so only the caller's role decides. */
export function authorizeAccountCreation(caller?: Account | null): AuthorizationResult {
  if (!canCreateAccounts(caller?.role)) return forbidden('Forbidden');
  return { ok: true };
}

export function authorizeAccountUnlock(caller?: Account | null, target?: Account | null): AuthorizationResult {
  if (!target?.id) return badRequest('Target account not found.');
  if (!canUnlockAccount(caller, target)) return forbidden('You do not have permission to unlock this account.');
  return { ok: true };
}

export function authorizeAccountDeletion(
  caller?: Account | null,
  target?: Account | null,
  allProfiles: Account[] = [],
): AuthorizationResult {
  if (!target?.id) return badRequest('Target account not found.');
  if (isSelf(caller, target)) return forbidden('You cannot delete your own account.');
  if (!canManage(caller, target)) return forbidden('You do not have permission to delete this account.');
  if (target.role !== 'user') {
    return forbidden('Only standard team member accounts can be deleted. Change the role first.');
  }
  if (wouldLeaveNoPrivilegedAccount(allProfiles, target.id, null)) {
    return forbidden('This would leave the workspace with no admin or CEO account.');
  }
  return { ok: true };
}

/**
 * update-user: profile edits of somebody else's account, plus the two field groups that
 * need more than edit rights (subscription state and role).
 */
export function authorizeProfileUpdate(
  caller: Account | null | undefined,
  target: Account | null | undefined,
  updates: Record<string, unknown>,
  allProfiles: Account[] = [],
): AuthorizationResult {
  if (!target?.id) return badRequest('Target account not found.');
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return badRequest('updates must be an object.');
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) return badRequest('updates must contain at least one field.');

  const unknown = keys.filter((key) => !PROFILE_FIELDS.includes(key) && !MANAGEMENT_FIELDS.includes(key));
  if (unknown.length > 0) return badRequest(`Unsupported field(s): ${unknown.join(', ')}`);

  if (!canEditProfile(caller, target)) return forbidden('You do not have permission to edit this profile.');

  const managementKeys = keys.filter((key) => MANAGEMENT_FIELDS.includes(key));
  if (managementKeys.length > 0 && !canManage(caller, target)) {
    return forbidden(`You do not have permission to change: ${managementKeys.join(', ')}`);
  }

  if (keys.includes('role')) {
    const nextRole = updates.role;
    if (nextRole !== target.role) {
      if (typeof nextRole !== 'string' || !ROLES.includes(nextRole)) {
        return badRequest(`role must be one of: ${ROLES.join(', ')}`);
      }
      if (!canChangeRole(caller, target)) {
        return forbidden('You do not have permission to change this account\'s role.');
      }
      if (wouldLeaveNoPrivilegedAccount(allProfiles, target.id, nextRole)) {
        return forbidden('This would leave the workspace with no admin or CEO account.');
      }
    }
  }

  return { ok: true };
}
