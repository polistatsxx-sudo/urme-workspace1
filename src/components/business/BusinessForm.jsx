import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const industries = ['Technology', 'Marketing', 'Real Estate', 'Construction', 'Legal', 'Finance', 'Food & Beverage', 'Healthcare', 'Entertainment', 'Retail', 'Education', 'Media', 'Event Management', 'Transportation', 'Other'];

export default function BusinessForm({ initialData, users = [], onSubmit, saving }) {
  const [form, setForm] = useState(initialData || {
    name: '', industry: '', description: '', needs: '', offers: '',
    contact_name: '', contact_email: '', contact_phone: '', website: '',
    stage: 'new_lead', assigned_to: '', assigned_to_name: '', city: '', state: '',
    tags: [], notes: ''
  });
  const [tagInput, setTagInput] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleAssign = (userId) => {
    const user = users.find(u => u.id === userId);
    set('assigned_to', userId);
    set('assigned_to_name', user?.full_name || '');
  };

  const addTag = () => {
    if (tagInput.trim() && !form.tags?.includes(tagInput.trim())) {
      set('tags', [...(form.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label className="text-xs">Company Name *</Label>
          <Input value={form.name} onChange={e => set('name', e.target.value)} required className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Industry</Label>
          <Select value={form.industry} onValueChange={v => set('industry', v)}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Stage</Label>
          <Select value={form.stage} onValueChange={v => set('stage', v)}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="new_lead">New Lead</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
              <SelectItem value="in_discussion">In Discussion</SelectItem>
              <SelectItem value="collaborating">Collaborating</SelectItem>
              <SelectItem value="partnered">Partnered</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Description</Label>
          <Textarea value={form.description} onChange={e => set('description', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Needs</Label>
          <Textarea value={form.needs} onChange={e => set('needs', e.target.value)} placeholder="What does this business need?" className="bg-secondary/50 mt-1 h-16 resize-none" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Offers</Label>
          <Textarea value={form.offers} onChange={e => set('offers', e.target.value)} placeholder="What does this business offer?" className="bg-secondary/50 mt-1 h-16 resize-none" />
        </div>
        <div>
          <Label className="text-xs">Contact Name</Label>
          <Input value={form.contact_name} onChange={e => set('contact_name', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Contact Email</Label>
          <Input value={form.contact_email} onChange={e => set('contact_email', e.target.value)} type="email" className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Phone</Label>
          <Input value={form.contact_phone} onChange={e => set('contact_phone', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Website</Label>
          <Input value={form.website} onChange={e => set('website', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">City</Label>
          <Input value={form.city} onChange={e => set('city', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">State</Label>
          <Input value={form.state} onChange={e => set('state', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Relationship Manager</Label>
          <Select value={form.assigned_to} onValueChange={handleAssign}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue placeholder="Assign..." /></SelectTrigger>
            <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Tags</Label>
          <div className="flex gap-2 mt-1">
            <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." className="bg-secondary/50" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
            <Button type="button" variant="secondary" size="sm" onClick={addTag}>Add</Button>
          </div>
          {form.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {form.tags.map(t => (
                <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full cursor-pointer hover:bg-destructive/10 hover:text-destructive" onClick={() => set('tags', form.tags.filter(x => x !== t))}>
                  {t} ×
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Notes</Label>
          <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" />
        </div>
      </div>
      <Button type="submit" disabled={saving || !form.name.trim()} className="w-full">
        {saving ? 'Saving...' : (initialData ? 'Update Business' : 'Add Business')}
      </Button>
    </form>
  );
}