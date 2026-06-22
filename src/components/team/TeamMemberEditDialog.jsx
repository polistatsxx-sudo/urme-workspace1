import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Lock, X } from 'lucide-react';
import { toast } from 'sonner';

const statusConfig = {
  active: { label: 'Active', color: 'bg-emerald-500/15 text-emerald-400' },
  inactive: { label: 'Inactive', color: 'bg-muted text-muted-foreground' },
  on_leave: { label: 'On Leave', color: 'bg-yellow-500/15 text-yellow-400' },
};

export default function TeamMemberEditDialog({ member, open, onOpenChange, canEdit, onSaved }) {
  const [form, setForm] = useState({});
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setForm({
        display_name: member.display_name || member.full_name || '',
        job_title: member.job_title || '',
        phone: member.phone || '',
        bio: member.bio || '',
        linkedin: member.linkedin || '',
        department: member.department || '',
        location: member.location || '',
        skills: member.skills || [],
        status: member.status || 'active',
        profile_photo: member.profile_photo || '',
      });
      setSkillInput('');
    }
  }, [member]);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !form.skills?.includes(s)) {
      set('skills', [...(form.skills || []), s]);
      setSkillInput('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await base44.entities.User.update(member.id, form);
      toast.success('Profile updated!');
      onSaved?.();
      onOpenChange(false);
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('profile_photo', file_url);
      toast.success('Photo uploaded');
    } catch {
      toast.error('Upload failed');
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
        </DialogHeader>
        {!canEdit ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <Lock className="w-8 h-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Contact admin to edit this profile</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex items-center gap-4">
              <div className="relative">
                {form.profile_photo ? (
                  <img src={form.profile_photo} alt="Profile" className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="text-xl font-bold text-primary">
                      {(form.display_name || '?')[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                  <span className="text-[10px] text-primary-foreground">+</span>
                </label>
              </div>
              <div>
                <p className="text-sm font-semibold">{member.full_name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>

            <div>
              <Label className="text-xs">Display Name</Label>
              <Input value={form.display_name} onChange={e => set('display_name', e.target.value)} className="bg-secondary/50 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Job Title</Label>
              <Input value={form.job_title} onChange={e => set('job_title', e.target.value)} className="bg-secondary/50 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="bg-secondary/50 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Bio</Label>
              <Textarea value={form.bio} onChange={e => set('bio', e.target.value)} className="bg-secondary/50 mt-1 h-20 resize-none" />
            </div>
            <div>
              <Label className="text-xs">LinkedIn URL</Label>
              <Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className="bg-secondary/50 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Department</Label>
                <Input value={form.department} onChange={e => set('department', e.target.value)} className="bg-secondary/50 mt-1" />
              </div>
              <div>
                <Label className="text-xs">Location</Label>
                <Input value={form.location} onChange={e => set('location', e.target.value)} className="bg-secondary/50 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Skills</Label>
              <div className="flex gap-2 mt-1">
                <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add skill..." className="bg-secondary/50" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                <Button type="button" variant="secondary" size="sm" onClick={addSkill}>Add</Button>
              </div>
              {form.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.skills.map(s => (
                    <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full flex items-center gap-1">
                      {s}
                      <button type="button" onClick={() => set('skills', form.skills.filter(x => x !== s))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => set('status', v)}>
                <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}