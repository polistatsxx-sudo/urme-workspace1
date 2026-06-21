import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Search, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkLogInteractionModal({ open, onOpenChange, businesses = [], user }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'meeting',
    title: '',
    notes: '',
    outcome: '',
    interaction_date: new Date().toISOString().slice(0, 16),
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const filtered = businesses.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.industry || '').toLowerCase().includes(search.toLowerCase())
  );

  const toggleBiz = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (selected.length === filtered.length) {
      setSelected([]);
    } else {
      setSelected(filtered.map(b => b.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selected.length === 0) { toast.error('Select at least one business'); return; }
    setSaving(true);
    try {
      await Promise.all(
        selected.map(bizId => {
          const biz = businesses.find(b => b.id === bizId);
          return base44.entities.Interaction.create({
            ...form,
            business_id: bizId,
            business_name: biz?.name,
            logged_by_id: user?.id,
            logged_by_name: user?.full_name,
          });
        })
      );
      qc.invalidateQueries({ queryKey: ['interactions'] });
      toast.success(`Logged interaction for ${selected.length} business${selected.length > 1 ? 'es' : ''}`);
      onOpenChange(false);
      setSelected([]);
      setForm({ type: 'meeting', title: '', notes: '', outcome: '', interaction_date: new Date().toISOString().slice(0, 16) });
      setSearch('');
    } catch {
      toast.error('Failed to log some interactions');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Log Interaction — Multiple Businesses</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Business Selector */}
          <div>
            <Label className="text-xs mb-1 block">Select Businesses <span className="text-muted-foreground">({selected.length} selected)</span></Label>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                placeholder="Search businesses..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-8 text-sm bg-secondary/50"
              />
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={toggleAll}
                className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/30 hover:bg-secondary/60 text-xs font-medium text-muted-foreground border-b border-border transition-colors"
              >
                {selected.length === filtered.length && filtered.length > 0
                  ? <CheckSquare className="w-3.5 h-3.5 text-primary" />
                  : <Square className="w-3.5 h-3.5" />}
                {selected.length === filtered.length && filtered.length > 0 ? 'Deselect All' : 'Select All'}
              </button>
              <div className="max-h-44 overflow-y-auto">
                {filtered.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No businesses found</p>
                )}
                {filtered.map(biz => (
                  <label
                    key={biz.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/40 cursor-pointer border-b border-border/50 last:border-0 transition-colors"
                  >
                    <Checkbox
                      checked={selected.includes(biz.id)}
                      onCheckedChange={() => toggleBiz(biz.id)}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{biz.name}</p>
                      {biz.industry && <p className="text-[10px] text-muted-foreground">{biz.industry}</p>}
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Interaction Details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Type</Label>
              <Select value={form.type} onValueChange={v => set('type', v)}>
                <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="call">Phone Call</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="event">Event</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="intro_made">Introduction</SelectItem>
                  <SelectItem value="note">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date & Time</Label>
              <Input type="datetime-local" value={form.interaction_date} onChange={e => set('interaction_date', e.target.value)} className="bg-secondary/50 mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} className="bg-secondary/50 mt-1" placeholder="e.g. Monthly check-in" />
          </div>

          <div>
            <Label className="text-xs">Notes / Details</Label>
            <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1 h-20 resize-none" />
          </div>

          <div>
            <Label className="text-xs">Outcome / Next Steps</Label>
            <Input value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="What happened next?" className="bg-secondary/50 mt-1" />
          </div>

          <Button type="submit" disabled={saving || selected.length === 0} className="w-full">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Logging...</> : `Log for ${selected.length || 0} Business${selected.length !== 1 ? 'es' : ''}`}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}