import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Calendar, Lightbulb } from 'lucide-react';
import RichTextEditor from '@/components/shared/RichTextEditor';

export default function NewThreadDialog({ open, onOpenChange, onSubmit, saving, businesses = [], events = [], ideas = [] }) {
  const [form, setForm] = useState({
    title: '', content: '', category: 'general',
    linked_business_id: '', linked_business_name: '',
    linked_event_id: '', linked_event_name: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleBusiness = (id) => {
    if (id === 'none') { set('linked_business_id', ''); set('linked_business_name', ''); return; }
    const b = businesses.find(x => x.id === id);
    setForm(p => ({ ...p, linked_business_id: id, linked_business_name: b?.name || '' }));
  };
  const handleEvent = (id) => {
    if (id === 'none') { set('linked_event_id', ''); set('linked_event_name', ''); return; }
    const e = events.find(x => x.id === id);
    setForm(p => ({ ...p, linked_event_id: id, linked_event_name: e?.name || '' }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
    setForm({ title: '', content: '', category: 'general', linked_business_id: '', linked_business_name: '', linked_event_id: '', linked_event_name: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>New Thread</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={e => set('title', e.target.value)} required placeholder="What's this thread about?" className="bg-secondary/50 mt-1" />
          </div>

          <div>
            <Label className="text-xs">Opening Message *</Label>
            <div className="mt-1">
              <RichTextEditor value={form.content} onChange={v => set('content', v)} placeholder="Share context, a question, or an update..." minHeight={100} />
            </div>
          </div>

          <div>
            <Label className="text-xs">Category</Label>
            <Select value={form.category} onValueChange={v => set('category', v)}>
              <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="idea">Idea</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional context linking */}
          <div className="border border-border rounded-xl p-3 space-y-3 bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Link to Context (optional)</p>

            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-1"><Building2 className="w-3 h-3 text-primary" /> Business</Label>
              <Select value={form.linked_business_id || 'none'} onValueChange={handleBusiness}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="No business" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs flex items-center gap-1.5 mb-1"><Calendar className="w-3 h-3 text-purple-400" /> Event</Label>
              <Select value={form.linked_event_id || 'none'} onValueChange={handleEvent}>
                <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="No event" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving ? 'Posting...' : 'Post Thread'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}