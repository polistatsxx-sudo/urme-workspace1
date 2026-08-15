import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  authorizeAccountCreation,
  authorizeAccountDeletion,
  authorizeAccountUnlock,
  authorizeProfileUpdate,
  AJ_ID,
  MICHAEL_ID,
} from '../../supabase/functions/_shared/permissions.ts';

// The decisions below are what the Edge Functions return; the client gating in Team.jsx
// and TeamMemberEditDialog.jsx only hides the controls that would hit these denials.
const michael = { id: MICHAEL_ID, role: 'admin', email: 'polistatsxx@gmail.com' };
const aj = { id: AJ_ID, role: 'ceo', email: 'macecnc@urmeinc.com' };
const futureAdmin = { id: 'admin-2', role: 'admin', email: 'admin2@urmeinc.com' };
const member = { id: 'user-1', role: 'user', email: 'member@urmeinc.com' };
const otherMember = { id: 'user-2', role: 'user', email: 'member2@urmeinc.com' };
const everyone = [michael, aj, futureAdmin, member, otherMember];

const allowed = { ok: true };
const denied = (result) => result.ok === false && result.status === 403;

describe('create-user authorization', () => {
  it('is open to admins and CEOs', () => {
    expect(authorizeAccountCreation(michael)).toEqual(allowed);
    expect(authorizeAccountCreation(aj)).toEqual(allowed);
    expect(authorizeAccountCreation(futureAdmin)).toEqual(allowed);
  });

  it('rejects a standard member even though the invite button is hidden from them', () => {
    expect(denied(authorizeAccountCreation(member))).toBe(true);
    expect(denied(authorizeAccountCreation(null))).toBe(true);
  });
});

describe('update-user authorization', () => {
  const profileEdit = { display_name: 'New Name', job_title: 'Partner' };

  it('lets Michael edit AJ and everyone else', () => {
    expect(authorizeProfileUpdate(michael, aj, profileEdit, everyone)).toEqual(allowed);
    expect(authorizeProfileUpdate(michael, member, profileEdit, everyone)).toEqual(allowed);
  });

  it('lets AJ edit members and future admins but not Michael', () => {
    expect(authorizeProfileUpdate(aj, member, profileEdit, everyone)).toEqual(allowed);
    expect(authorizeProfileUpdate(aj, futureAdmin, profileEdit, everyone)).toEqual(allowed);
    expect(denied(authorizeProfileUpdate(aj, michael, profileEdit, everyone))).toBe(true);
  });

  it('lets a future admin edit members but neither AJ nor Michael', () => {
    expect(authorizeProfileUpdate(futureAdmin, member, profileEdit, everyone)).toEqual(allowed);
    expect(denied(authorizeProfileUpdate(futureAdmin, aj, profileEdit, everyone))).toBe(true);
    expect(denied(authorizeProfileUpdate(futureAdmin, michael, profileEdit, everyone))).toBe(true);
  });

  it('rejects a standard member editing anyone else, and allows their own profile', () => {
    expect(denied(authorizeProfileUpdate(member, otherMember, profileEdit, everyone))).toBe(true);
    expect(authorizeProfileUpdate(member, member, profileEdit, everyone)).toEqual(allowed);
  });

  it('keeps subscription fields to callers who can manage the target', () => {
    expect(authorizeProfileUpdate(aj, member, { subscription_status: 'active' }, everyone)).toEqual(allowed);
    const selfServe = authorizeProfileUpdate(member, member, { subscription_status: 'active' }, everyone);
    expect(denied(selfServe)).toBe(true);
  });

  it('rejects columns that are not part of a profile edit', () => {
    const result = authorizeProfileUpdate(michael, member, { account_locked: false }, everyone);
    expect(result).toEqual({ ok: false, status: 400, error: 'Unsupported field(s): account_locked' });
  });

  it('rejects an empty or malformed payload', () => {
    expect(authorizeProfileUpdate(michael, member, {}, everyone).ok).toBe(false);
    expect(authorizeProfileUpdate(michael, member, null, everyone).ok).toBe(false);
    expect(authorizeProfileUpdate(michael, undefined, profileEdit, everyone).ok).toBe(false);
  });

  describe('role changes', () => {
    it('lets a manager promote and demote a member', () => {
      expect(authorizeProfileUpdate(aj, member, { role: 'admin' }, everyone)).toEqual(allowed);
      expect(authorizeProfileUpdate(michael, futureAdmin, { role: 'user' }, everyone)).toEqual(allowed);
    });

    it('refuses a self-promotion or self-demotion', () => {
      expect(denied(authorizeProfileUpdate(futureAdmin, futureAdmin, { role: 'ceo' }, everyone))).toBe(true);
      expect(denied(authorizeProfileUpdate(michael, michael, { role: 'user' }, everyone))).toBe(true);
    });

    it('refuses to demote the protected accounts unless Michael asks', () => {
      expect(denied(authorizeProfileUpdate(futureAdmin, aj, { role: 'user' }, everyone))).toBe(true);
      expect(denied(authorizeProfileUpdate(aj, michael, { role: 'user' }, everyone))).toBe(true);
      expect(authorizeProfileUpdate(michael, aj, { role: 'user' }, everyone)).toEqual(allowed);
    });

    it('refuses a demotion that would leave the workspace with no admin or CEO', () => {
      // A backstop: the caller is a manager themselves and normally stays one, so this
      // only fires if the profile list ever comes back without them.
      expect(denied(authorizeProfileUpdate(michael, futureAdmin, { role: 'user' }, [futureAdmin, member]))).toBe(true);
      expect(authorizeProfileUpdate(michael, futureAdmin, { role: 'user' }, everyone)).toEqual(allowed);
    });

    it('rejects a role outside the enum', () => {
      expect(authorizeProfileUpdate(michael, member, { role: 'superuser' }, everyone))
        .toEqual({ ok: false, status: 400, error: 'role must be one of: user, admin, ceo' });
    });

    it('rejects role in the payload from a caller who cannot manage the target, no-op or not', () => {
      expect(denied(authorizeProfileUpdate(member, member, { role: 'user' }, everyone))).toBe(true);
      expect(denied(authorizeProfileUpdate(futureAdmin, aj, { role: 'ceo' }, everyone))).toBe(true);
    });

    it('accepts a no-op role from a manager', () => {
      expect(authorizeProfileUpdate(michael, member, { role: 'user' }, everyone)).toEqual(allowed);
    });
  });
});

describe('unlock-account authorization', () => {
  it('follows canManage, so Michael can rescue AJ but not the other way round', () => {
    expect(authorizeAccountUnlock(michael, aj)).toEqual(allowed);
    expect(denied(authorizeAccountUnlock(aj, michael))).toBe(true);
    expect(authorizeAccountUnlock(aj, member)).toEqual(allowed);
    expect(denied(authorizeAccountUnlock(futureAdmin, aj))).toBe(true);
    expect(denied(authorizeAccountUnlock(member, otherMember))).toBe(true);
  });
});

describe('delete-user authorization', () => {
  it('deletes standard member accounts for any manager', () => {
    expect(authorizeAccountDeletion(michael, member, everyone)).toEqual(allowed);
    expect(authorizeAccountDeletion(futureAdmin, member, everyone)).toEqual(allowed);
  });

  it('refuses privileged targets, self-deletion and unprivileged callers', () => {
    expect(denied(authorizeAccountDeletion(michael, aj, everyone))).toBe(true);
    expect(denied(authorizeAccountDeletion(aj, michael, everyone))).toBe(true);
    expect(denied(authorizeAccountDeletion(michael, michael, everyone))).toBe(true);
    expect(denied(authorizeAccountDeletion(member, otherMember, everyone))).toBe(true);
  });

  it('refuses a deletion that would leave the workspace with no admin or CEO', () => {
    expect(denied(authorizeAccountDeletion(futureAdmin, member, [member]))).toBe(true);
    expect(authorizeAccountDeletion(futureAdmin, member, everyone)).toEqual(allowed);
  });
});

describe('the Edge Functions actually call the shared rule', () => {
  const functionsDir = join(process.cwd(), 'supabase', 'functions');
  const expectedGuards = {
    'create-user': 'authorizeAccountCreation',
    'update-user': 'authorizeProfileUpdate',
    'delete-user': 'authorizeAccountDeletion',
    'unlock-account': 'authorizeAccountUnlock',
  };

  for (const [functionName, guard] of Object.entries(expectedGuards)) {
    it(`${functionName} imports ${guard} from the shared module`, () => {
      const source = readFileSync(join(functionsDir, functionName, 'index.ts'), 'utf8');
      expect(source).toContain("from '../_shared/permissions.ts'");
      expect(source).toContain(guard);
      expect(source).toContain('warnOnProtectedIdentityDrift');
    });
  }
});
