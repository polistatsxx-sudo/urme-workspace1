import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { User, Plus, Mail, Phone, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function ContactsCard({ bizId, bizName }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', title: '', email: '', phone: '', linkedin: '', notes: '' });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', bizId],
    queryFn: () => base44.entities.Contact.filter({ business_id: bizId }),
    enabled: !!bizId,
  });

  const createMut = useMutation({
    mutationFn: () => base44.entities.Contact.create({ ...form, business_id: bizId, business_name: bizName }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts', bizId] });
      setOpen(false);
      setForm({ full_name: '', title: '', email: '', phone: '', linkedin: '', notes: '' });
      toast.success('Contact added');
    },
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacts</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add Contact
        </Button>
      </div>

      {contacts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No contacts added yet.</p>
      ) : (
        <div className="space-y-2">
          {contacts.map(c => (
            <button
              key={c.id}
              onClick={() => navigate(`/contacts/${c.id}`)}
              className="w-full flex items-center gap-3 bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 text-left transition-colors group"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{c.full_name}</p>
                {c.title && <p className="text-[10px] text-muted-foreground">{c.title}</p>}
                <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  {c.email && <span className="flex items-center gap-0.5"><Mail className="w-2.5 h-2.5" /> {c.email}</span>}
                  {c.phone && <span className="flex items-center gap-0.5"><Phone className="w-2.5 h-2.5" /> {c.phone}</span>}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </button>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => set('full_name', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Title / Role</Label><Input value={form.title} onChange={e => set('title', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input value={form.email} onChange={e => set('email', e.target.value)} className="bg-secondary/50 mt-1" /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            </div>
            <div><Label className="text-xs">LinkedIn URL</Label><Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="https://linkedin.com/in/..." className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" /></div>
            <Button className="w-full" disabled={createMut.isPending || !form.full_name.trim()} onClick={() => createMut.mutate()}>
              {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Contact'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}