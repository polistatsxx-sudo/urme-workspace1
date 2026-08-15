import { describe, expect, it, vi } from 'vitest';
import * as client from '@/utils/permissions';
import * as server from '../../supabase/functions/_shared/permissions.ts';

const michael = { id: client.MICHAEL_ID, role: 'admin', email: 'polistatsxx@gmail.com' };
const aj = { id: client.AJ_ID, role: 'ceo', email: 'macecnc@urmeinc.com' };
const futureAdmin = { id: 'admin-2', role: 'admin', email: 'admin2@urmeinc.com' };
const futureCeo = { id: 'ceo-2', role: 'ceo', email: 'ceo2@urmeinc.com' };
const member = { id: 'user-1', role: 'user', email: 'member@urmeinc.com' };
const otherMember = { id: 'user-2', role: 'user', email: 'member2@urmeinc.com' };

describe('canManage', () => {
  it('lets Michael manage anyone, including AJ', () => {
    expect(client.canManage(michael, aj)).toBe(true);
    expect(client.canManage(michael, futureAdmin)).toBe(true);
    expect(client.canManage(michael, member)).toBe(true);
    expect(client.canManage(michael, michael)).toBe(true);
  });

  it('lets AJ manage everyone except Michael', () => {
    expect(client.canManage(aj, michael)).toBe(false);
    expect(client.canManage(aj, futureAdmin)).toBe(true);
    expect(client.canManage(aj, member)).toBe(true);
  });

  it('lets a future admin manage regular members but neither Michael nor AJ', () => {
    expect(client.canManage(futureAdmin, michael)).toBe(false);
    expect(client.canManage(futureAdmin, aj)).toBe(false);
    expect(client.canManage(futureAdmin, member)).toBe(true);
    expect(client.canManage(futureAdmin, futureCeo)).toBe(true);
  });

  it('lets a future CEO manage regular members but neither Michael nor AJ', () => {
    expect(client.canManage(futureCeo, michael)).toBe(false);
    expect(client.canManage(futureCeo, aj)).toBe(false);
    expect(client.canManage(futureCeo, member)).toBe(true);
  });

  it('lets a standard member manage nobody, including themselves', () => {
    expect(client.canManage(member, otherMember)).toBe(false);
    expect(client.canManage(member, futureAdmin)).toBe(false);
    expect(client.canManage(member, member)).toBe(false);
  });

  it('denies when either side is missing', () => {
    expect(client.canManage(null, member)).toBe(false);
    expect(client.canManage(michael, null)).toBe(false);
    expect(client.canManage({ role: 'admin' }, member)).toBe(false);
  });

  it('ignores the role a protected account happens to hold', () => {
    // Protection is keyed on the id, so a rebuild that demoted Michael to 'user'
    // must not open him up to the other admins.
    expect(client.canManage(aj, { ...michael, role: 'user' })).toBe(false);
    expect(client.canManage({ ...michael, role: 'user' }, aj)).toBe(true);
  });
});

describe('canEditProfile', () => {
  it('always allows editing your own profile', () => {
    expect(client.canEditProfile(member, member)).toBe(true);
    expect(client.canEditProfile(aj, aj)).toBe(true);
    expect(client.canEditProfile(futureAdmin, futureAdmin)).toBe(true);
  });

  it('falls back to canManage for anyone else', () => {
    expect(client.canEditProfile(member, otherMember)).toBe(false);
    expect(client.canEditProfile(futureAdmin, aj)).toBe(false);
    expect(client.canEditProfile(michael, aj)).toBe(true);
  });
});

describe('canDeleteAccount', () => {
  it('only ever deletes standard member accounts', () => {
    expect(client.canDeleteAccount(michael, member)).toBe(true);
    expect(client.canDeleteAccount(aj, member)).toBe(true);
    expect(client.canDeleteAccount(futureAdmin, member)).toBe(true);
    expect(client.canDeleteAccount(michael, aj)).toBe(false);
    expect(client.canDeleteAccount(michael, futureAdmin)).toBe(false);
  });

  it('refuses self-deletion and unprivileged callers', () => {
    expect(client.canDeleteAccount(member, member)).toBe(false);
    expect(client.canDeleteAccount(member, otherMember)).toBe(false);
  });
});

describe('canChangeRole and the last-privileged-account guard', () => {
  it('never lets anyone change their own role', () => {
    expect(client.canChangeRole(michael, michael)).toBe(false);
    expect(client.canChangeRole(futureAdmin, futureAdmin)).toBe(false);
  });

  it('follows canManage for everyone else', () => {
    expect(client.canChangeRole(michael, aj)).toBe(true);
    expect(client.canChangeRole(aj, michael)).toBe(false);
    expect(client.canChangeRole(futureAdmin, member)).toBe(true);
  });

  it('flags a demotion or deletion that would leave no admin or CEO', () => {
    const onlyAdminLeft = [futureAdmin, member];
    expect(client.wouldLeaveNoPrivilegedAccount(onlyAdminLeft, futureAdmin.id, 'user')).toBe(true);
    expect(client.wouldLeaveNoPrivilegedAccount(onlyAdminLeft, futureAdmin.id, null)).toBe(true);
    expect(client.wouldLeaveNoPrivilegedAccount(onlyAdminLeft, futureAdmin.id, 'ceo')).toBe(false);
    expect(client.wouldLeaveNoPrivilegedAccount([michael, futureAdmin, member], futureAdmin.id, 'user')).toBe(false);
    expect(client.wouldLeaveNoPrivilegedAccount([michael, member], member.id, null)).toBe(false);
  });
});

describe('canCreateAccounts', () => {
  it('is open to admins and CEOs and closed to standard members', () => {
    expect(client.canCreateAccounts('admin')).toBe(true);
    expect(client.canCreateAccounts('ceo')).toBe(true);
    expect(client.canCreateAccounts('user')).toBe(false);
    expect(client.canCreateAccounts(undefined)).toBe(false);
  });
});

describe('protected identity drift check', () => {
  it('pins the ids to the people they are documented to protect', () => {
    expect(client.MICHAEL_ID).toBe('24332e6e-fc06-46c4-a491-dc32e1efc58e');
    expect(client.AJ_ID).toBe('bd91c741-0173-49fb-b715-8ae6c90919f0');
    expect(client.PROTECTED_ACCOUNTS).toEqual([
      { id: client.MICHAEL_ID, email: 'polistatsxx@gmail.com', label: 'Michael Alexander' },
      { id: client.AJ_ID, email: 'macecnc@urmeinc.com', label: 'AJ Macedonia' },
    ]);
  });

  it('reports nothing when both ids still resolve to their expected email', () => {
    expect(client.findProtectedIdentityDrift([michael, aj, member], { requirePresence: true })).toEqual([]);
    expect(client.findProtectedIdentityDrift([
      { ...michael, email: 'PoliStatsXX@Gmail.com ' },
      aj,
    ])).toEqual([]);
  });

  it('reports an id that now belongs to somebody else', () => {
    const drift = client.findProtectedIdentityDrift([{ ...aj, email: 'someone.else@urmeinc.com' }]);
    expect(drift).toEqual([
      {
        id: client.AJ_ID,
        label: 'AJ Macedonia',
        expectedEmail: 'macecnc@urmeinc.com',
        actualEmail: 'someone.else@urmeinc.com',
        reason: 'email-mismatch',
      },
    ]);
  });

  it('only reports a missing id when the caller is meant to see every profile', () => {
    expect(client.findProtectedIdentityDrift([member])).toEqual([]);
    expect(client.findProtectedIdentityDrift([member], { requirePresence: true })).toHaveLength(2);
  });

  it('warns loudly rather than silently changing who is protected', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      client.warnOnProtectedIdentityDrift([{ ...michael, email: 'someone.else@urmeinc.com' }, aj]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0][0]).toContain('PROTECTED IDENTITY DRIFT');
      // Still protected: the warning is a signal to a human, not a permission change.
      expect(client.canManage(aj, michael)).toBe(false);
    } finally {
      warn.mockRestore();
    }
  });
});

describe('the client rule and the Edge Function rule stay in step', () => {
  const accounts = [michael, aj, futureAdmin, futureCeo, member, otherMember];
  const predicates = ['canManage', 'canEditProfile', 'canUnlockAccount', 'canDeleteAccount', 'canChangeRole', 'isSelf'];

  it('exposes the same constants on both sides', () => {
    expect(server.MICHAEL_ID).toBe(client.MICHAEL_ID);
    expect(server.AJ_ID).toBe(client.AJ_ID);
    expect(server.PROTECTED_ACCOUNTS).toEqual(client.PROTECTED_ACCOUNTS);
    expect(server.MANAGER_ROLES).toEqual(client.MANAGER_ROLES);
    expect(server.ROLES).toEqual(client.ROLES);
  });

  it('answers every caller/target pair identically', () => {
    for (const predicate of predicates) {
      for (const caller of accounts) {
        for (const target of accounts) {
          expect(
            { predicate, caller: caller.id, target: target.id, allowed: server[predicate](caller, target) },
          ).toEqual(
            { predicate, caller: caller.id, target: target.id, allowed: client[predicate](caller, target) },
          );
        }
      }
    }
  });

  it('agrees on account creation and the last-privileged-account guard', () => {
    for (const role of ['user', 'admin', 'ceo', undefined]) {
      expect(server.canCreateAccounts(role)).toBe(client.canCreateAccounts(role));
    }
    for (const nextRole of ['user', 'admin', null]) {
      expect(server.wouldLeaveNoPrivilegedAccount([futureAdmin, member], futureAdmin.id, nextRole))
        .toBe(client.wouldLeaveNoPrivilegedAccount([futureAdmin, member], futureAdmin.id, nextRole));
    }
  });
});
