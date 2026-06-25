import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Shield, Key, LogOut, Save, Trash2, Users, Camera, Activity, Building2, Calendar, ChevronRight, Edit, Bell, BellOff, Settings, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import InteractionTimeline from '@/components/business/InteractionTimeline';
import StageBadge from '@/components/shared/StageBadge';
import TeamMemberEditDialog from '@/components/team/TeamMemberEditDialog';
import RichTextDisplay from '@/components/shared/RichTextDisplay';
import { format, isPast } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { requestNotificationPermission } from '@/utils/notifications';
import { hasActiveAccess, isExpiringSoon, getDaysRemaining } from '@/utils/subscription';
import { CreditCard, Calendar as CalendarIcon } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', bio: '', phone: '', job_title: '', ai_provider: 'none', ai_api_key: '', profile_photo: '' });
  const [saving, setSaving] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(localStorage.getItem('urme_notifications_enabled') === 'true');
  const [autoTasksEnabled, setAutoTasksEnabled] = useState(localStorage.getItem('urme_auto_tasks') !== 'false');

  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: myInteractions = [] } = useQuery({
    queryKey: ['my-interactions', user?.id],
    queryFn: () => base44.entities.Interaction.filter({ logged_by_id: user.id }, '-interaction_date'),
    enabled: !!user?.id,
  });
  const { data: allBusinesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: allEvents = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list('-date') });

  const myBusinesses = allBusinesses.filter(b => b.assigned_to === user?.id);
  const myBusinessIds = new Set(myBusinesses.map(b => b.id));
  const myEvents = allEvents.filter(e => e.attendee_business_ids?.some(bid => myBusinessIds.has(bid)));

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        bio: user.bio || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
        ai_provider: user.ai_provider || 'none',
        ai_api_key: user.ai_api_key || '',
        profile_photo: user.profile_photo || '',
      });
    }
  }, [user]);

  const handleNotifToggle = async (enabled) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        localStorage.setItem('urme_notifications_enabled', 'true');
        setNotifEnabled(true);
        toast.success('Notifications enabled');
      } else {
        toast.error('Notifications blocked. Enable in browser settings.');
      }
    } else {
      localStorage.setItem('urme_notifications_enabled', 'false');
      setNotifEnabled(false);
    }
  };

  const handleAutoTasksToggle = (enabled) => {
    localStorage.setItem('urme_auto_tasks', enabled ? 'true' : 'false');
    setAutoTasksEnabled(enabled);
    toast.success(enabled ? 'Auto-tasks enabled' : 'Auto-tasks disabled');
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, profile_photo: file_url }));
    await base44.entities.User.update(user.id, { profile_photo: file_url });
    toast.success('Photo updated!');
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.User.update(user.id, form);
    qc.invalidateQueries({ queryKey: ['users'] });
    toast.success('Profile updated!');
    setSaving(false);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    await base44.entities.User.delete(userId);
    qc.invalidateQueries({ queryKey: ['users'] });
    toast.success('User removed');
  };

  const isAdmin = user?.role === 'admin';

  const daysRemaining = getDaysRemaining(user);
  const expiringSoon = isExpiringSoon(user);
  const hasAccess = hasActiveAccess(user);
  const subStatus = user?.subscription_status || 'none';
  const isExpired = !hasAccess && subStatus !== 'none' || (subStatus === 'expired');
  const subBadge = hasAccess && !expiringSoon
    ? { label: `Active${user?.paid_through_date ? ` — paid through ${format(new Date(user.paid_through_date), 'MMM d, yyyy')}` : ''}`, color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' }
    : expiringSoon
    ? { label: `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`, color: 'bg-amber-500/15 text-amber-400', dot: 'bg-amber-400' }
    : { label: 'Expired', color: 'bg-destructive/15 text-destructive', dot: 'bg-destructive' };

  return (
    <div className="animate-slide-up">
      <PageHeader title="Profile" subtitle={user?.email} />

      <Tabs defaultValue="profile">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="businesses">My Businesses ({myBusinesses.length})</TabsTrigger>
          <TabsTrigger value="activity">Activity ({myInteractions.length})</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          {isAdmin && <TabsTrigger value="team">Team</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-card border border-border rounded-xl p-5 max-w-lg">
            <div className="flex items-center gap-4 mb-6">
              <div className="relative group">
                {(form.profile_photo || user?.profile_photo) ? (
                  <img src={form.profile_photo || user?.profile_photo} alt="Profile" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-5 h-5 text-white" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold">{user?.display_name || user?.full_name || 'Set your name'}</h2>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-semibold uppercase">{user?.role}</span>
                </div>
                {user?.job_title && <p className="text-xs text-muted-foreground mt-1">{user.job_title}</p>}
                {user?.department && <p className="text-xs text-muted-foreground">{user.department}</p>}
                {user?.location && <p className="text-xs text-muted-foreground">{user.location}</p>}
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
                <Edit className="w-3.5 h-3.5 mr-1" /> Edit
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Full Name</Label>
                <Input value={form.full_name} onChange={e => setForm(p => ({...p, full_name: e.target.value}))} placeholder="Your full name" className="bg-secondary/50 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Job Title</Label>
                <Input value={form.job_title} onChange={e => setForm(p => ({...p, job_title: e.target.value}))} className="bg-secondary/50 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Phone</Label>
                <Input value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} className="bg-secondary/50 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Bio</Label>
                <Textarea value={form.bio} onChange={e => setForm(p => ({...p, bio: e.target.value}))} className="bg-secondary/50 mt-1 h-24 resize-none" />
              </div>
              {user?.linkedin && (
                <div>
                  <Label className="text-xs">LinkedIn</Label>
                  <p className="text-xs text-primary truncate">{user.linkedin}</p>
                </div>
              )}
              {user?.skills?.length > 0 && (
                <div>
                  <Label className="text-xs">Skills</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.skills.map(s => <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>)}
                  </div>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Profile'}</Button>
                <Button variant="outline" onClick={() => base44.auth.logout()} className="text-destructive"><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
              </div>
            </div>
            <Link to="/team" className="flex items-center justify-between mt-4 pt-4 border-t border-border text-sm text-primary hover:underline">
              View Full Team <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <TeamMemberEditDialog
            member={user}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            canEdit={true}
            onSaved={() => qc.invalidateQueries({ queryKey: ['users'] })}
          />
        </TabsContent>

        <TabsContent value="subscription">
          <div className="bg-card border border-border rounded-xl p-5 max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Subscription</h3>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${subBadge.dot}`} />
              <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${subBadge.color}`}>
                {subBadge.label}
              </span>
            </div>
            {user?.paid_through_date && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <CalendarIcon className="w-4 h-4 text-primary" />
                Paid through: <span className="text-foreground font-medium">{format(new Date(user.paid_through_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {(isExpired || subStatus === 'none') && (
              <a
                href="https://buy.stripe.com/00wfZi6ID2uHeqw2JK3Je00"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold text-sm rounded-xl px-6 py-3 min-h-[44px] hover:bg-primary/90 transition-colors"
              >
                <CreditCard className="w-4 h-4" /> Reactivate — $25/month
              </a>
            )}
            {isAdmin && (
              <div className="mt-4 bg-primary/10 border border-primary/20 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Admin: Manage subscriptions from the Team page</p>
                <Link to="/team" className="text-xs text-primary font-medium hover:underline mt-1 block">Go to Team →</Link>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="businesses">
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Managed Businesses</h3>
              </div>
              {myBusinesses.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No businesses assigned yet</p>
              ) : (
                <div className="space-y-2">
                  {myBusinesses.map(b => (
                    <button key={b.id} onClick={() => navigate(`/businesses/${b.id}`)}
                      className="w-full flex items-center gap-3 bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 text-left transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{b.name}</p>
                        <p className="text-[10px] text-muted-foreground">{b.industry}</p>
                      </div>
                      <StageBadge stage={b.stage} />
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Related Events</h3>
              </div>
              {myEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No events linked to your businesses yet</p>
              ) : (
                <div className="space-y-2">
                  {myEvents.map(ev => {
                    const past = ev.date && isPast(new Date(ev.date));
                    const linkedBizNames = (ev.attendee_business_ids || [])
                      .filter(bid => myBusinessIds.has(bid))
                      .map(bid => allBusinesses.find(b => b.id === bid)?.name)
                      .filter(Boolean);
                    return (
                      <div key={ev.id} className="flex items-start gap-3 bg-secondary/40 rounded-lg p-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{ev.name}</p>
                            <span className={`text-[10px] ${past ? 'text-muted-foreground' : 'text-emerald-400'}`}>{past ? 'Past' : 'Upcoming'}</span>
                          </div>
                          {ev.date && <p className="text-[10px] text-muted-foreground">{format(new Date(ev.date), 'MMM d, yyyy')}{ev.location ? ` · ${ev.location}` : ''}</p>}
                          {linkedBizNames.length > 0 && (
                            <p className="text-[10px] text-primary mt-0.5">via {linkedBizNames.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">My Logged Interactions</h3>
            </div>
            {myInteractions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No interactions logged yet</p>
            ) : (
              <InteractionTimeline interactions={myInteractions} />
            )}
          </div>
        </TabsContent>

        <TabsContent value="ai">
          <div className="bg-card border border-border rounded-xl p-5 max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">AI Configuration</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Connect your own API key to enable AI-powered features like business matching, idea improvement, and industry insights.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">AI Provider</Label>
                <Select value={form.ai_provider} onValueChange={v => setForm(p => ({...p, ai_provider: v}))}>
                  <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="grok">Grok</SelectItem>
                    <SelectItem value="claude">Claude</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.ai_provider !== 'none' && (
                <div>
                  <Label className="text-xs">API Key</Label>
                  <Input type="password" value={form.ai_api_key} onChange={e => setForm(p => ({...p, ai_api_key: e.target.value}))} placeholder="sk-..." className="bg-secondary/50 mt-1" />
                </div>
              )}
              <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Settings'}</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="bg-card border border-border rounded-xl p-5 max-w-lg space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Settings</h3>
            </div>
            <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-3">
              <div className="flex items-center gap-3">
                {notifEnabled ? <Bell className="w-4 h-4 text-primary" /> : <BellOff className="w-4 h-4 text-muted-foreground" />}
                <div>
                  <p className="text-sm font-medium">Push Notifications</p>
                  <p className="text-[10px] text-muted-foreground">Get alerts for overdue tasks and stale contacts</p>
                </div>
              </div>
              <Switch checked={notifEnabled} onCheckedChange={handleNotifToggle} />
            </div>
            <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <Zap className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-sm font-medium">Auto-create tasks on stage change</p>
                  <p className="text-[10px] text-muted-foreground">Automatically create follow-up tasks when businesses move stages</p>
                </div>
              </div>
              <Switch checked={autoTasksEnabled} onCheckedChange={handleAutoTasksToggle} />
            </div>
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="team">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Team Members</h3>
              </div>
              <div className="space-y-2">
                {allUsers.filter(u => !u.email?.toLowerCase().includes('polistats')).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{u.email} • {u.role} {u.job_title ? `• ${u.job_title}` : ''}</p>
                      </div>
                    </div>
                    {u.id !== user?.id && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteUser(u.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}