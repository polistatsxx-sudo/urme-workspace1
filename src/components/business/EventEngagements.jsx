import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, MapPin, Plus, Link2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusColors = {
  planning: 'text-yellow-400', confirmed: 'text-primary', in_progress: 'text-blue-400',
  completed: 'text-emerald-400', cancelled: 'text-muted-foreground',
};

export default function EventEngagements({ bizId }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState('');
  const [note, setNote] = useState('');
  const [link, setLink] = useState('');

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list() });

  const engaged = events.filter(e => e.attendee_business_ids?.includes(bizId));
  const available = events.filter(e => !e.attendee_business_ids?.includes(bizId));

  const linkMut = useMutation({
    mutationFn: async () => {
      const ev = events.find(e => e.id === eventId);
      if (!ev) return;
      const notes = [ev.post_event_notes, note && `[Business note] ${note}`, link && `[Link] ${link}`].filter(Boolean).join('\n');
      return base44.entities.Event.update(eventId, {
        attendee_business_ids: [...(ev.attendee_business_ids || []), bizId],
        attendee_count: (ev.attendee_count || 0) + 1,
        post_event_notes: notes,
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setOpen(false); setEventId(''); setNote(''); setLink(''); toast.success('Linked to event'); },
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Events & Engagements</h3>
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Link Event</Button>
      </div>

      {engaged.length === 0 ? (
        <p className="text-sm text-muted-foreground">Not participating in any events yet.</p>
      ) : (
        <div className="space-y-2">
          {engaged.map(ev => (
            <div key={ev.id} className="flex items-start gap-3 bg-secondary/40 rounded-lg p-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{ev.name}</p>
                  <span className={`text-[10px] capitalize ${statusColors[ev.status] || ''}`}>{ev.status?.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                  {ev.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(ev.date), 'MMM d, yyyy')}</span>}
                  {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Link to Event</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Event</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue placeholder="Select an event..." /></SelectTrigger>
                <SelectContent>
                  {available.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No more events available</div>
                  ) : available.map(e => <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Note (optional)</Label>
              <Textarea value={note} onChange={e => setNote(e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" />
            </div>
            <div>
              <Label className="text-xs flex items-center gap-1"><Link2 className="w-3 h-3" /> Link (optional)</Label>
              <Input value={link} onChange={e => setLink(e.target.value)} placeholder="https://..." className="bg-secondary/50 mt-1" />
            </div>
            <Button className="w-full" disabled={!eventId || linkMut.isPending} onClick={() => linkMut.mutate()}>
              {linkMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Link Event'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}