import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Linkedin, Edit, Trash2, Building2, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import InteractionTimeline from '@/components/business/InteractionTimeline';
import { toast } from 'sonner';

export default function ContactProfile() {
  const contactId = window.location.pathname.split('/contacts/')[1];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState(null);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: contact } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: async () => {
      const list = await base44.entities.Contact.filter({ id: contactId });
      return list[0] || null;
    },
    enabled: !!contactId,
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-by-contact', contactId],
    queryFn: () => base44.entities.Interaction.filter({ contact_id: contactId }, '-interaction_date'),
    enabled: !!contactId,
  });

  const updateMut = useMutation({
    mutationFn: (data) => base44.entities.Contact.update(contactId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contact', contactId] }); setEditOpen(false); toast.success('Contact updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: () => base44.entities.Contact.delete(contactId),
    onSuccess: () => { navigate('/businesses'); toast.success('Contact deleted'); },
  });

  const openEdit = () => {
    setForm({ ...contact });
    setEditOpen(true);
  };

  const generateBrief = async () => {
    if (!contact) return;
    setAiLoading(true);
    try {
      const recentInteractions = interactions
        .slice(0, 5)
        .map(i => `- ${i.type} on ${i.interaction_date ? new Date(i.interaction_date).toLocaleDateString() : 'unknown date'}: ${i.notes || i.title || i.outcome || 'No details'}`)
        .join('\n');

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a relationship strategist for a B2B networking platform.

Create a concise contact brief that helps the user prepare for the next interaction.

Contact: ${contact.full_name}
Role: ${contact.title || 'Not specified'}
Business: ${contact.business_name || 'Not specified'}
Email: ${contact.email || 'Not specified'}
Phone: ${contact.phone || 'Not specified'}
LinkedIn: ${contact.linkedin || 'Not specified'}
Notes: ${contact.notes || 'None'}
Recent interactions:
${recentInteractions || 'No interactions logged yet.'}

Return only useful, actionable output.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            best_next_step: { type: 'string' },
            outreach_draft: { type: 'string' },
            talking_points: { type: 'array', items: { type: 'string' } },
            watchouts: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      setAiBrief(result);
    } finally {
      setAiLoading(false);
    }
  };

  if (!contact) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      {/* Back */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4" /></Button>
        <span className="text-sm text-muted-foreground">Back</span>
      </div>

      {/* Header card */}
      <div className="bg-card border border-border rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display">{contact.full_name}</h1>
              {contact.title && <p className="text-sm text-muted-foreground">{contact.title}</p>}
              {contact.business_name && (
                <button
                  onClick={() => navigate(`/businesses/${contact.business_id}`)}
                  className="flex items-center gap-1 text-xs text-primary hover:underline mt-1"
                >
                  <Building2 className="w-3 h-3" /> {contact.business_name}
                </button>
              )}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="flex items-center gap-1 hover:text-primary">
                    <Mail className="w-3 h-3" /> {contact.email}
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-primary">
                    <Phone className="w-3 h-3" /> {contact.phone}
                  </a>
                )}
                {contact.linkedin && (
                  <a href={contact.linkedin} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary">
                    <Linkedin className="w-3 h-3" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={openEdit}><Edit className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={() => { if (confirm('Delete this contact?')) deleteMut.mutate(); }}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
        {contact.notes && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground font-semibold uppercase mb-1">Notes</p>
            <p className="text-sm">{contact.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">AI Contact Brief</h3>
            <p className="text-sm text-foreground/80 mt-1">Use AI to prep the next outreach or meeting.</p>
          </div>
          <Button variant="outline" size="sm" onClick={generateBrief} disabled={aiLoading || !contact} className="gap-1.5">
            {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {aiBrief ? 'Regenerate' : 'Generate'}
          </Button>
        </div>

        {aiBrief ? (
          <>
            {aiBrief.summary && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aiBrief.summary}</p>}

            <div className="grid md:grid-cols-2 gap-3">
              {aiBrief.best_next_step && (
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Best Next Step</p>
                  <p className="text-sm">{aiBrief.best_next_step}</p>
                </div>
              )}
              {aiBrief.outreach_draft && (
                <div className="bg-card border border-border rounded-lg p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Outreach Draft</p>
                  <p className="text-sm whitespace-pre-wrap">{aiBrief.outreach_draft}</p>
                </div>
              )}
            </div>

            {aiBrief.talking_points?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Talking Points</p>
                <ul className="space-y-2">
                  {aiBrief.talking_points.map((point, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {aiBrief.watchouts?.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Watchouts</p>
                <ul className="space-y-2">
                  {aiBrief.watchouts.map((watchout, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                      <span>{watchout}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-foreground/60">Generate a brief to get a next-step recommendation, outreach draft, and talking points.</p>
        )}
      </div>

      {/* Interactions */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
          Interaction History ({interactions.length})
        </h3>
        <InteractionTimeline interactions={interactions} />
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Edit Contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name || ''} onChange={e => set('full_name', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Title / Role</Label><Input value={form.title || ''} onChange={e => set('title', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input value={form.email || ''} onChange={e => set('email', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">LinkedIn URL</Label><Input value={form.linkedin || ''} onChange={e => set('linkedin', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1 h-20 resize-none" /></div>
            <Button className="w-full" disabled={updateMut.isPending || !form.full_name?.trim()} onClick={() => updateMut.mutate(form)}>
              {updateMut.isPending ? 'Saving...' : 'Save Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}