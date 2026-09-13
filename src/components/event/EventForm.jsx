import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const emptyEvent = {
  name: '', description: '', date: '', time: '', location: '',
  status: 'planning', event_type: 'mixer', objectives: '',
  target_industries: [], attendee_business_ids: [],
};

// An event row arrives with nulls for anything the user left blank, which would flip the
// controlled inputs to uncontrolled. base44Client turns '' back into null on the way out.
function toFormState(initialData) {
  if (!initialData) return { ...emptyEvent };
  const form = { ...emptyEvent, ...initialData };
  for (const key of Object.keys(emptyEvent)) {
    if (form[key] === null || form[key] === undefined) form[key] = emptyEvent[key];
  }
  return form;
}

/**
 * @param {{
 *   initialData?: any,
 *   businesses?: any[],
 *   isEdit?: boolean,
 *   onSubmit: (data: any) => void,
 *   saving?: boolean,
 * }} props
 */
export default function EventForm({ initialData, businesses = [], isEdit = false, onSubmit, saving = false }) {
  const [form, setForm] = useState(() => toFormState(initialData));
  const [isEnhancing, setIsEnhancing] = useState(false);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const attendeeIds = form.attendee_business_ids || [];
  const attendeeOptions = [...businesses].sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const toggleAttendee = (bizId) => setForm(prev => {
    const current = prev.attendee_business_ids || [];
    return {
      ...prev,
      attendee_business_ids: current.includes(bizId)
        ? current.filter(id => id !== bizId)
        : [...current, bizId],
    };
  });

  const handleEnhance = async () => {
    if (!form.name.trim() && !form.description.trim()) { toast.error('Add a name or description first'); return; }
    setIsEnhancing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You're a B2B event strategist. Improve this event for a business matchmaking company:\nName: "${form.name}"\nDescription: "${form.description || ''}"\nObjectives: "${form.objectives || ''}"\nType: ${form.event_type}\n\nReturn improved, compelling versions of the name, description, and objectives. Be specific and professional.`,
        response_json_schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, objectives: { type: 'string' } } }
      });
      setForm(prev => ({ ...prev, name: res.name || prev.name, description: res.description || prev.description, objectives: res.objectives || prev.objectives }));
      toast.success('Event improved with AI!', { icon: '✨' });
    } catch { toast.error('Failed to enhance'); } finally { setIsEnhancing(false); }
  };

  // attendee_count is what the CSV export calls "Attendees" and what linking a business
  // from its own page increments, so it is derived from the tick-list at submit time
  // rather than tracked alongside it, where the two could drift apart.
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form, attendee_business_ids: attendeeIds, attendee_count: attendeeIds.length });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><Label className="text-xs">Event Name *</Label><Input value={form.name} onChange={e => set('name', e.target.value)} required className="bg-secondary/50 mt-1" /></div>
      <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => set('description', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="bg-secondary/50 mt-1" /></div>
        <div><Label className="text-xs">Time</Label><Input value={form.time} onChange={e => set('time', e.target.value)} placeholder="6:00 PM" className="bg-secondary/50 mt-1" /></div>
      </div>
      <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => set('location', e.target.value)} className="bg-secondary/50 mt-1" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label className="text-xs">Type</Label>
          <Select value={form.event_type} onValueChange={v => set('event_type', v)}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="mixer">Mixer</SelectItem><SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="conference">Conference</SelectItem><SelectItem value="dinner">Dinner</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem><SelectItem value="showcase">Showcase</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div><Label className="text-xs">Status</Label>
          <Select value={form.status} onValueChange={v => set('status', v)}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="planning">Planning</SelectItem><SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem><SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div><Label className="text-xs">Objectives</Label><Textarea value={form.objectives} onChange={e => set('objectives', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" /></div>
      <div>
        <div className="flex items-center justify-between">
          <Label className="text-xs">Attending Businesses</Label>
          <span className="text-[10px] text-muted-foreground">{attendeeIds.length} selected</span>
        </div>
        {attendeeOptions.length === 0 ? (
          <p className="text-xs text-muted-foreground mt-1">No businesses in your network yet.</p>
        ) : (
          <div className="mt-1 max-h-36 overflow-y-auto rounded-md border border-border bg-secondary/50 divide-y divide-border/50">
            {attendeeOptions.map(b => (
              <label key={b.id} className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-secondary">
                <Checkbox
                  checked={attendeeIds.includes(b.id)}
                  onCheckedChange={() => toggleAttendee(b.id)}
                  aria-label={b.name}
                />
                <span className="text-xs truncate">{b.name}</span>
              </label>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">Optional. A business can also be linked from its own page.</p>
      </div>
      {isEdit && (
        <div><Label className="text-xs">Post-Event Notes</Label><Textarea value={form.post_event_notes || ''} onChange={e => set('post_event_notes', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" /></div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleEnhance} disabled={isEnhancing} className="flex-1 border-accent/50 text-accent hover:bg-accent/10">
          <Sparkles className="w-4 h-4 mr-1" />{isEnhancing ? 'Improving...' : 'Improve with AI'}
        </Button>
        <Button type="submit" disabled={saving || !form.name.trim()} className="flex-1">
          {isEdit ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );
}
