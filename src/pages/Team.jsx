import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Mail, Phone } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import TeamMemberEditDialog from '@/components/team/TeamMemberEditDialog';
import { format } from 'date-fns';

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

  const { data: allUsers = [], isLoading } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const isAdmin = user?.role === 'admin';

  const handleCardClick = (member) => {
    const canEdit = isAdmin || member.id === user?.id;
    setEditingMember(member);
    setEditOpen(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await base44.entities.User.delete(userId);
    qc.invalidateQueries({ queryKey: ['users'] });
    toast.success('User removed');
  };

  return (
    <div className="animate-slide-up pb-20">
      <PageHeader title="Team" subtitle={`${allUsers.length} members`} />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading team...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allUsers.map(member => {
            const canEdit = isAdmin || member.id === user?.id;
            const status = statusConfig[member.status || 'active'] || statusConfig.active;
            return (
              <button
                key={member.id}
                onClick={() => handleCardClick(member)}
                className="bg-card border border-border rounded-xl p-4 text-left active:scale-95 transition-transform"
              >
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
                    {member.role !== 'admin' && (
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
            );
          })}
        </div>
      )}

      <TeamMemberEditDialog
        member={editingMember}
        open={editOpen}
        onOpenChange={setEditOpen}
        canEdit={isAdmin || editingMember?.id === user?.id}
        onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })}
      />
    </div>
  );
}