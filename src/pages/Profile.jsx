import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Shield, Key, LogOut, Save, Trash2, Users, Camera, Activity } from 'lucide-react';
import InteractionTimeline from '@/components/business/InteractionTimeline';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [form, setForm] = useState({ bio: '', phone: '', job_title: '', ai_provider: 'none', ai_api_key: '', profile_photo: '' });
  const [saving, setSaving] = useState(false);

  const { data: allUsers = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });
  const { data: myInteractions = [] } = useQuery({
    queryKey: ['my-interactions', user?.id],
    queryFn: () => base44.entities.Interaction.filter({ logged_by_id: user.id }, '-interaction_date'),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || '',
        phone: user.phone || '',
        job_title: user.job_title || '',
        ai_provider: user.ai_provider || 'none',
        ai_api_key: user.ai_api_key || '',
        profile_photo: user.profile_photo || '',
      });
    }
  }, [user]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, profile_photo: file_url }));
    await base44.auth.updateMe({ profile_photo: file_url });
    toast.success('Photo updated!');
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe(form);
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

  return (
    <div className="animate-slide-up">
      <PageHeader title="Profile" subtitle={user?.email} />

      <Tabs defaultValue="profile">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="profile">My Profile</TabsTrigger>
          <TabsTrigger value="activity">Activity ({myInteractions.length})</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
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
              <div>
                <h2 className="text-lg font-bold">AJ Macedonia</h2>
                <p className="text-xs text-muted-foreground">macecnc@urmeinc.com</p>
                <div className="flex items-center gap-1 mt-1">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-[10px] text-primary font-semibold uppercase">{user?.role}</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
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
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving}><Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : 'Save Profile'}</Button>
                <Button variant="outline" onClick={() => base44.auth.logout()} className="text-destructive"><LogOut className="w-4 h-4 mr-1" /> Logout</Button>
              </div>
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
              <div>
                {myInteractions.map(ix => (
                  <div key={ix.id} className="mb-2 last:mb-0">
                    <div className="text-[10px] text-muted-foreground mb-1">{ix.business_name}</div>
                    <InteractionTimeline interactions={[ix]} />
                  </div>
                ))}
              </div>
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

        {isAdmin && (
          <TabsContent value="team">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Team Members</h3>
              </div>
              <div className="space-y-2">
                {allUsers.map(u => (
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