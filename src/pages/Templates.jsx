import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Mail, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import RichTextEditor from '@/components/shared/RichTextEditor';
import RichTextDisplay from '@/components/shared/RichTextDisplay';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { MERGE_FIELDS, fillMergeFields, getSampleData } from '@/utils/mergeFields';

const categoryColors = {
  intro: 'bg-primary/15 text-primary',
  follow_up: 'bg-blue-500/15 text-blue-400',
  event_invite: 'bg-purple-500/15 text-purple-400',
  thank_you: 'bg-emerald-500/15 text-emerald-400',
  proposal: 'bg-orange-500/15 text-orange-400',
  custom: 'bg-muted text-muted-foreground',
};

const defaultTemplates = [
  {
    title: 'Introduction',
    subject: 'Introduction — {{my_name}} at {{business_name}}',
    body: `<p>Hi {{contact_name}},</p><p>I hope this email finds you well. My name is {{my_name}} and I work with {{business_name}} in the {{industry}} space.</p><p>I came across your company and was impressed by what you do. We specialize in {{business_offers}} and are always looking for strong partners.</p><p>I would love to schedule a brief call to explore how we might collaborate. Are you available next week?</p><p>Best regards,<br/>{{my_name}}</p>`,
    category: 'intro',
  },
  {
    title: 'Follow Up',
    subject: 'Following up — {{business_name}}',
    body: `<p>Hi {{contact_name}},</p><p>I wanted to follow up on our recent conversation. I know things can get busy, but I wanted to check if you had any thoughts on the discussion points we covered.</p><p>I am happy to jump on a quick call if that would be easier — just let me know what works for you.</p><p>Looking forward to hearing from you.</p><p>Best,<br/>{{my_name}}</p>`,
    category: 'follow_up',
  },
  {
    title: 'Event Invite',
    subject: 'You are invited! {{business_name}} networking event',
    body: `<p>Hi {{contact_name}},</p><p>I wanted to personally invite you to an upcoming networking event we are hosting. It would be a great opportunity to connect with other businesses in the {{industry}} space and explore potential collaborations.</p><p>Would you be interested in attending? I would love to have you there.</p><p>Best,<br/>{{my_name}}</p>`,
    category: 'event_invite',
  },
];

export default function Templates() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', body: '', category: 'custom' });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-updated_date'),
  });

  // Auto-create default templates on first load
  useEffect(() => {
    if (!isLoading && templates.length === 0) {
      defaultTemplates.forEach(t => {
        base44.entities.EmailTemplate.create({ ...t, created_by_name: user?.full_name, use_count: 0 });
      });
      qc.invalidateQueries({ queryKey: ['emailTemplates'] });
    }
  }, [isLoading, templates.length]);

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.EmailTemplate.create({ ...data, created_by_name: user?.full_name, use_count: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emailTemplates'] }); setShowAdd(false); resetForm(); toast.success('Template created!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.EmailTemplate.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emailTemplates'] }); setEditing(null); toast.success('Template updated!'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.EmailTemplate.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['emailTemplates'] }); toast.success('Template deleted'); },
  });

  const resetForm = () => setForm({ title: '', subject: '', body: '', category: 'custom' });

  const handleSubmit = (e) => {
    e.preventDefault();
    const usedFields = MERGE_FIELDS.filter(f => form.body?.includes(`{{${f.key}}}`) || form.subject?.includes(`{{${f.key}}}`)).map(f => f.key);
    const data = { ...form, merge_fields_used: usedFields };
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const startEdit = (t) => {
    setEditing(t);
    setForm({ title: t.title, subject: t.subject || '', body: t.body || '', category: t.category || 'custom' });
    setShowAdd(true);
  };

  const insertMergeField = (field) => {
    setForm(p => ({ ...p, body: (p.body || '') + ` {{${field}}}` }));
  };

  const preview = fillMergeFields(form.body || '', getSampleData());

  return (
    <div className="animate-slide-up pb-20">
      <PageHeader
        title="Email Templates"
        subtitle={`${templates.length} templates`}
        actions={
          <Button size="sm" onClick={() => { setEditing(null); resetForm(); setShowAdd(true); }}>
            <Plus className="w-4 h-4 mr-1" /> New Template
          </Button>
        }
      />

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading templates...</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {templates.map(t => (
            <div key={t.id} className="bg-card border border-border rounded-xl p-4 flex flex-col">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-sm font-semibold truncate">{t.title}</p>
                </div>
                <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${categoryColors[t.category] || categoryColors.custom}`}>
                  {t.category?.replace(/_/g, ' ')}
                </Badge>
              </div>
              {t.subject && <p className="text-xs text-muted-foreground truncate mb-1">Subject: {t.subject}</p>}
              <div className="text-xs text-muted-foreground line-clamp-2 flex-1" dangerouslySetInnerHTML={{ __html: t.body }} />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground">Used {t.use_count || 0}x</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(t)} className="p-1 text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => { if (confirm('Delete this template?')) deleteMut.mutate(t.id); }} className="p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(open) => { setShowAdd(open); if (!open) { setEditing(null); resetForm(); } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit Template' : 'New Template'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required className="bg-secondary/50 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="intro">Intro</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="event_invite">Event Invite</SelectItem>
                  <SelectItem value="thank_you">Thank You</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Subject</Label>
              <Input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} className="bg-secondary/50 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Merge Fields — tap to insert</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {MERGE_FIELDS.map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => insertMergeField(f.key)}
                    className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full active:scale-95 transition-transform"
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-xs">Body</Label>
              <div className="mt-1">
                <RichTextEditor value={form.body} onChange={v => setForm(p => ({ ...p, body: v }))} placeholder="Write your template..." />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex-1">
                <Eye className="w-4 h-4 mr-1" /> {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
              <Button type="submit" disabled={createMut.isPending || updateMut.isPending || !form.title.trim()} className="flex-1">
                {createMut.isPending || updateMut.isPending ? 'Saving...' : (editing ? 'Update' : 'Create')}
              </Button>
            </div>
            {showPreview && (
              <div className="bg-secondary/30 rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground mb-2">Preview with sample data:</p>
                <RichTextDisplay content={preview} />
              </div>
            )}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}