import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Calendar, MapPin, Users, Clock, Edit, Trash2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const statusColors = {
  planning: 'bg-blue-500/15 text-blue-400', confirmed: 'bg-emerald-500/15 text-emerald-400',
  in_progress: 'bg-primary/15 text-primary', completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function Events() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', date: '', time: '', location: '', status: 'planning', event_type: 'mixer', objectives: '', target_industries: [] });
  const [isEnhancing, setIsEnhancing] = useState(false);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleEnhance = async () => {
    if (!form.name.trim() && !form.description.trim()) { toast.error('Add a name or description first'); return; }
    setIsEnhancing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You're a B2B event strategist. Improve this event for a business matchmaking company:\nName: "${form.name}"\nDescription: "${form.description || ''}"\nObjectives: "${form.objectives || ''}"\nType: ${form.event_type}\n\nReturn improved, compelling versions of the name, description, and objectives. Be specific and professional.`,
        response_json_schema: { type: 'object', properties: { name: { type: 'string' }, description: { type: 'string' }, objectives: { type: 'string' } } }
      });
      setForm(p => ({ ...p, name: res.name || p.name, description: res.description || p.description, objectives: res.objectives || p.objectives }));
      toast.success('Event improved with AI!', { icon: '✨' });
    } catch { toast.error('Failed to enhance'); } finally { setIsEnhancing(false); }
  };

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list('-date') });

  const upcoming = events.filter(e => e.date && !isPast(new Date(e.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const past = events.filter(e => e.date && isPast(new Date(e.date)));

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Event.create({ ...d, organizer_name: user?.full_name, attendee_business_ids: [] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setShowAdd(false); resetForm(); toast.success('Event created!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setEditEvent(null); resetForm(); toast.success('Updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Deleted'); },
  });

  const resetForm = () => setForm({ name: '', description: '', date: '', time: '', location: '', status: 'planning', event_type: 'mixer', objectives: '', target_industries: [] });

  const openEdit = (ev) => {
    setForm({ ...ev, target_industries: ev.target_industries || [] });
    setEditEvent(ev);
  };

  const EventForm = ({ isEdit }) => (
    <form onSubmit={e => { e.preventDefault(); isEdit ? updateMut.mutate({ id: editEvent.id, data: form }) : createMut.mutate(form); }} className="space-y-3">
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
      {isEdit && (
        <div><Label className="text-xs">Post-Event Notes</Label><Textarea value={form.post_event_notes || ''} onChange={e => set('post_event_notes', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" /></div>
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleEnhance} disabled={isEnhancing} className="flex-1 border-accent/50 text-accent hover:bg-accent/10">
          <Sparkles className="w-4 h-4 mr-1" />{isEnhancing ? 'Improving...' : 'Improve with AI'}
        </Button>
        <Button type="submit" disabled={createMut.isPending || updateMut.isPending || !form.name.trim()} className="flex-1">
          {isEdit ? 'Update Event' : 'Create Event'}
        </Button>
      </div>
    </form>
  );

  const EventCard = ({ ev }) => (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">{ev.name}</p>
            <Badge variant="outline" className={`text-[10px] ${statusColors[ev.status]}`}>{ev.status?.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{ev.description}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
            {ev.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(ev.date), 'MMM d, yyyy')}</span>}
            {ev.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.time}</span>}
            {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
            {ev.event_type && <span className="capitalize">{ev.event_type}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(ev)}><Edit className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(ev.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      {ev.objectives && <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2"><span className="font-semibold text-foreground/70">Objectives:</span> {ev.objectives}</p>}
      {ev.post_event_notes && <p className="text-xs text-primary mt-1"><span className="font-semibold">Post-Event:</span> {ev.post_event_notes}</p>}
    </div>
  );

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Event Orchestrator"
        subtitle={`${upcoming.length} upcoming • ${past.length} past`}
        actions={
          <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Event</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
              <EventForm isEdit={false} />
            </DialogContent>
          </Dialog>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Archived ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <div className="space-y-3">
            {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
            {upcoming.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No upcoming events</p>}
          </div>
        </TabsContent>
        <TabsContent value="past">
          <div className="space-y-3">
            {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
            {past.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No archived events</p>}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!editEvent} onOpenChange={v => { if (!v) { setEditEvent(null); resetForm(); } }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          <EventForm isEdit={true} />
        </DialogContent>
      </Dialog>
    </div>
  );
}