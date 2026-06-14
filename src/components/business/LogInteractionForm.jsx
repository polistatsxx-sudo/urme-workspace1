import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function LogInteractionForm({ onSubmit, saving }) {
  const [form, setForm] = useState({ type: 'note', title: '', notes: '', outcome: '', interaction_date: new Date().toISOString().split('T')[0] });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="space-y-3">
      <div>
        <Label className="text-xs">Type</Label>
        <Select value={form.type} onValueChange={v => set('type', v)}>
          <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="call">Phone Call</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="intro_made">Introduction Made</SelectItem>
            <SelectItem value="follow_up">Follow-up</SelectItem>
            <SelectItem value="note">Note</SelectItem>
            <SelectItem value="event">Event</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Title</Label>
        <Input value={form.title} onChange={e => set('title', e.target.value)} className="bg-secondary/50 mt-1" />
      </div>
      <div>
        <Label className="text-xs">Date</Label>
        <Input type="date" value={form.interaction_date} onChange={e => set('interaction_date', e.target.value)} className="bg-secondary/50 mt-1" />
      </div>
      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1 h-20 resize-none" />
      </div>
      <div>
        <Label className="text-xs">Outcome</Label>
        <Input value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="What happened?" className="bg-secondary/50 mt-1" />
      </div>
      <Button type="submit" disabled={saving} className="w-full">{saving ? 'Saving...' : 'Log Interaction'}</Button>
    </form>
  );
}