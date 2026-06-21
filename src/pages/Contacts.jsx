import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, User, Mail, Phone, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const avatarColors = ['bg-blue-500/15 text-blue-400', 'bg-purple-500/15 text-purple-400', 'bg-emerald-500/15 text-emerald-400', 'bg-orange-500/15 text-orange-400', 'bg-pink-500/15 text-pink-400'];

function getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Contacts() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [bizFilter, setBizFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ full_name: '', title: '', email: '', phone: '', business_id: '', notes: '' });

  const { data: contacts = [] } = useQuery({ queryKey: ['contacts-all'], queryFn: () => base44.entities.Contact.list() });
  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });

  const createMut = useMutation({
    mutationFn: (data) => {
      const biz = businesses.find(b => b.id === data.business_id);
      return base44.entities.Contact.create({ ...data, business_name: biz?.name || '' });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts-all'] }); setShowAdd(false); toast.success('Contact added!'); setForm({ full_name: '', title: '', email: '', phone: '', business_id: '', notes: '' }); },
  });

  const filtered = contacts.filter(c => {
    const matchSearch = c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchBiz = bizFilter === 'all' || c.business_id === bizFilter;
    return matchSearch && matchBiz;
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="animate-slide-up pb-20">
      <PageHeader
        title="Contacts"
        subtitle={`${contacts.length} contacts in your network`}
        actions={
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1" /> Add Contact</Button>
        }
      />

      {/* Search bar - sticky */}
      <div className="sticky top-14 lg:top-0 z-10 bg-background pt-2 pb-3 -mx-4 px-4 md:mx-0 md:px-0">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
        </div>
        {/* Business filter chips */}
        {businesses.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 snap-x">
            <button
              onClick={() => setBizFilter('all')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium snap-start ${bizFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}
            >
              All Businesses
            </button>
            {businesses.slice(0, 15).map(b => (
              <button
                key={b.id}
                onClick={() => setBizFilter(b.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium snap-start ${bizFilter === b.id ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contact cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm font-medium">No contacts found</p>
            <p className="text-xs mt-1">Add contacts from a business profile or the button above.</p>
          </div>
        )}
        {filtered.map((c, idx) => (
          <button
            key={c.id}
            onClick={() => navigate(`/contacts/${c.id}`)}
            className="w-full bg-card border border-border rounded-xl p-4 active:scale-[0.98] transition-transform text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${avatarColors[idx % avatarColors.length]}`}>
                {getInitials(c.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.full_name}</p>
                {c.title && <p className="text-xs text-muted-foreground truncate">{c.title}</p>}
                {c.business_name && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-primary mt-0.5">
                    <Building2 className="w-2.5 h-2.5" /> {c.business_name}
                  </span>
                )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="flex flex-wrap gap-3 mt-2 pt-2 border-t border-border/50">
              {c.email && (
                <a href={`mailto:${c.email}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
                  <Mail className="w-3 h-3" /> {c.email}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary">
                  <Phone className="w-3 h-3" /> {c.phone}
                </a>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Add contact dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
          <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
            <div>
              <Label className="text-xs">Business *</Label>
              <Select value={form.business_id} onValueChange={v => set('business_id', v)}>
                <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue placeholder="Select a business..." /></SelectTrigger>
                <SelectContent>{businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Full Name *</Label><Input value={form.full_name} onChange={e => set('full_name', e.target.value)} required className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Title / Role</Label><Input value={form.title} onChange={e => set('title', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => set('phone', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <div><Label className="text-xs">Notes</Label><Input value={form.notes} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1" /></div>
            <Button type="submit" disabled={createMut.isPending || !form.full_name.trim() || !form.business_id} className="w-full h-10">
              {createMut.isPending ? 'Saving...' : 'Add Contact'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}