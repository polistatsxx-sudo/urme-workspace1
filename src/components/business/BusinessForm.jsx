import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import DuplicateWarning from '@/components/shared/DuplicateWarning';
import { findPotentialDuplicates } from '@/utils/duplicateDetection';

const industries = ['Technology', 'Marketing', 'Real Estate', 'Construction', 'Legal', 'Finance', 'Food & Beverage', 'Healthcare', 'Entertainment', 'Retail', 'Education', 'Media', 'Event Management', 'Transportation', 'Other'];

export default function BusinessForm({ initialData, users = [], businesses = [], onSubmit, saving }) {
  const [form, setForm] = useState(initialData || {
    name: '', industry: '', description: '', needs: '', offers: '',
    contact_name: '', contact_title: '', contact_email: '', contact_phone: '',
    linkedin: '', website: '', address: '',
    stage: 'new_lead', assigned_to: '', assigned_to_name: '', city: '', state: '',
    tags: [], notes: ''
  });
  const [tagInput, setTagInput] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [ignoreDuplicates, setIgnoreDuplicates] = useState(false);

  useEffect(() => {
    if (ignoreDuplicates || !form.name || form.name.length < 3) { setDuplicates([]); return; }
    const t = setTimeout(() => {
      const found = findPotentialDuplicates(form.name, form.contact_email, businesses, 'business');
      setDuplicates(found);
    }, 300);
    return () => clearTimeout(t);
  }, [form.name, form.contact_email, businesses, ignoreDuplicates]);

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleEnhance = async () => {
    if (!form.name.trim()) { toast.error('Add a company name first'); return; }
    setIsEnhancing(true);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You're a B2B business strategist. Improve this business profile for a matchmaking platform:\nName: "${form.name}"\nIndustry: "${form.industry || ''}"\nDescription: "${form.description || ''}"\nNeeds: "${form.needs || ''}"\nOffers: "${form.offers || ''}"\n\nReturn polished, compelling versions of description, needs, and offers that would attract the right partners. Be specific and concise.`,
        response_json_schema: { type: 'object', properties: { description: { type: 'string' }, needs: { type: 'string' }, offers: { type: 'string' } } }
      });
      setForm(prev => ({ ...prev, description: res.description || prev.description, needs: res.needs || prev.needs, offers: res.offers || prev.offers }));
      toast.success('Business profile improved with AI!', { icon: '✨' });
    } catch { toast.error('Failed to enhance'); } finally { setIsEnhancing(false); }
  };

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

  const handleDismissDuplicate = () => {
    setIgnoreDuplicates(true);
    setDuplicates([]);
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
          <Label className="text-xs">Title / Role</Label>
          <Input value={form.contact_title} onChange={e => set('contact_title', e.target.value)} placeholder="e.g. CEO" className="bg-secondary/50 mt-1" />
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
          <Label className="text-xs">LinkedIn</Label>
          <Input value={form.linkedin} onChange={e => set('linkedin', e.target.value)} placeholder="LinkedIn URL" className="bg-secondary/50 mt-1" />
        </div>
        <div>
          <Label className="text-xs">Website</Label>
          <Input value={form.website} onChange={e => set('website', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
        <div className="col-span-2">
          <Label className="text-xs">Address</Label>
          <Input value={form.address} onChange={e => set('address', e.target.value)} className="bg-secondary/50 mt-1" />
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
          <Label className="text-xs">Account Manager</Label>
          <Select value={form.assigned_to} onValueChange={handleAssign}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue placeholder="Assign a relationship manager..." /></SelectTrigger>
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
      {duplicates.length > 0 && (
        <DuplicateWarning duplicates={duplicates} onDismiss={handleDismissDuplicate} entityType="business" />
      )}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={handleEnhance} disabled={isEnhancing} className="flex-1 border-accent/50 text-accent hover:bg-accent/10">
          <Sparkles className="w-4 h-4 mr-1" />{isEnhancing ? 'Improving...' : 'Improve with AI'}
        </Button>
        <Button type="submit" disabled={saving || !form.name.trim()} className="flex-1">
          {saving ? 'Saving...' : (initialData ? 'Update Business' : 'Add Business')}
        </Button>
      </div>
    </form>
  );
}