import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Mail, Phone, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import TeamMemberEditDialog from '@/components/team/TeamMemberEditDialog';
import { format } from 'date-fns';
import { canCreateAccounts, canDeleteTarget, canEditTarget, canUnlockTarget } from '@/lib/permissions';

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground', dot: 'bg-gray-400' },
  on_leave: { label: 'On Leave', color: 'bg-yellow-500/15 text-yellow-400', dot: 'bg-yellow-400' },
};

const subStatusConfig = {
  active: { label: 'Sub: Active', color: 'bg-emerald-500/15 text-emerald-400' },
  expired: { label: 'Sub: Expired', color: 'bg-destructive/15 text-destructive' },
  none: { label: 'Sub: None', color: 'bg-muted text-muted-foreground' },
};

export default function Team() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editingMember, setEditingMember] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviteForm, setInviteForm] = useState({ full_name: '', email: '', password: '', role: 'user' });

  const { data: allUsers = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const canInvite = canCreateAccounts(user?.role);

  const subtitle = useMemo(() => {
    const lockedCount = allUsers.filter((u) => u.account_locked).length;
    return `${allUsers.length} members${lockedCount ? ` • ${lockedCount} locked` : ''}`;
  }, [allUsers]);

  const handleCardClick = (member) => {
    const canEdit = canEditTarget(user, member);
    setEditingMember(member);
    setEditOpen(true);
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!canInvite) return;
    setCreating(true);
    try {
      await base44.functions.invoke('create-user', inviteForm);
      toast.success('Team member invited successfully');
      setInviteOpen(false);
      setInviteForm({ full_name: '', email: '', password: '', role: 'user' });
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleUnlock = async (member) => {
    if (!canUnlockTarget(user, member)) return;
    try {
      await base44.functions.invoke('unlock-account', { targetUserId: member.id });
      toast.success('Account unlocked');
      qc.invalidateQueries({ queryKey: ['users'] });
    } catch (error) {
      toast.error(error.message || 'Failed to unlock account');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await base44.functions.invoke('delete-user', { targetUserId: userId });
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User removed');
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  return (
    <div className="animate-slide-up pb-20">
      <PageHeader
        title="Team"
        subtitle={subtitle}
        actions={
          canInvite ? (
            <Button className="h-10 hidden sm:inline-flex" onClick={() => setInviteOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Team Member
            </Button>
          ) : null
        }
      />

      {canInvite && (
        <div className="sm:hidden mb-3">
          <Button className="w-full h-10" onClick={() => setInviteOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Team Member
          </Button>
        </div>
      )}

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-3">
            <div>
              <Label className="text-xs">Full Name</Label>
              <Input
                required
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm((p) => ({ ...p, full_name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Email</Label>
              <Input
                required
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((p) => ({ ...p, email: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Temporary Password</Label>
              <Input
                required
                type="password"
                minLength={8}
                value={inviteForm.password}
                onChange={(e) => setInviteForm((p) => ({ ...p, password: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Role</Label>
              <Input value="user" disabled className="mt-1" />
              <p className="text-[10px] text-muted-foreground mt-1">Only standard team members can be created from this form.</p>
            </div>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? 'Creating...' : 'Create Account'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading team...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allUsers.map(member => {
            const canEdit = canEditTarget(user, member);
            const canDelete = canDeleteTarget(user, member);
            const canUnlock = member.account_locked && canUnlockTarget(user, member);
            const status = statusConfig[member.status || 'active'] || statusConfig.active;
            return (
              <div
                key={member.id}
                className="bg-card border border-border rounded-xl p-4 text-left"
              >
                <button onClick={() => handleCardClick(member)} className="w-full text-left">
                  <div className="flex items-start gap-3">
                    {member.profile_photo ? (
                      <img src={member.profile_photo} alt="Profile" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary">
                          {(member.display_name || member.full_name || '?')[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold truncate">{member.display_name || member.full_name}</p>
                        {member.role === 'admin' && (
                          <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">ADMIN</span>
                        )}
                        {member.role === 'ceo' && (
                          <span className="text-[9px] bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-full">CEO</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{member.job_title || 'No title'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Mail className="w-3 h-3 text-muted-foreground" />
                        <p className="text-[10px] text-muted-foreground truncate">{member.email}</p>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-muted-foreground" />
                          <p className="text-[10px] text-muted-foreground truncate">{member.phone}</p>
                        </div>
                      )}
                    </div>
                    {!canEdit && <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${status.color}`}>{status.label}</span>
                      {member.account_locked && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">Locked</span>
                      )}
                      {member.mfa_enabled && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">2FA Enabled</span>
                      )}
                      {member.role === 'user' && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${(subStatusConfig[member.subscription_status] || subStatusConfig.none).color}`}>
                          {(subStatusConfig[member.subscription_status] || subStatusConfig.none).label}
                        </span>
                      )}
                    </div>
                    {member.updated_date && (
                      <span className="text-[9px] text-muted-foreground">Updated {format(new Date(member.updated_date), 'MMM d')}</span>
                    )}
                  </div>
                </button>

                <div className="flex items-center gap-2 mt-3">
                  {canUnlock && (
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleUnlock(member)}>
                      <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Unlock
                    </Button>
                  )}
                  {canDelete && (
                    <Button variant="outline" size="sm" className="h-8 text-xs text-destructive" onClick={() => handleDeleteUser(member.id)}>
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TeamMemberEditDialog
        member={editingMember}
        open={editOpen}
        onOpenChange={setEditOpen}
        canEdit={canEditTarget(user, editingMember)}
        onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })}
      />
    </div>
  );
}