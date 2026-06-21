import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Building2 } from 'lucide-react';

const revenueCategories = [
  { value: 'event_revenue', label: 'Event Revenue' },
  { value: 'matchmaking_fee', label: 'Matchmaking Fee' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'other_revenue', label: 'Other Revenue' },
];

const expenseCategories = [
  { value: 'venue_cost', label: 'Venue Cost' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'operations', label: 'Operations' },
  { value: 'software', label: 'Software/Tools' },
  { value: 'travel', label: 'Travel' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'other_expense', label: 'Other Expense' },
];

export default function FinanceEntryForm({ type, events = [], businesses = [], onSubmit, saving }) {
  const categories = type === 'revenue' ? revenueCategories : expenseCategories;
  const [form, setForm] = useState({
    type,
    category: categories[0].value,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    linked_event_id: '',
    linked_event_name: '',
    linked_business_id: '',
    linked_business_name: '',
    payment_status: 'paid',
    notes: '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleEventLink = (eventId) => {
    if (eventId === 'none') {
      setForm(p => ({ ...p, linked_event_id: '', linked_event_name: '' }));
      return;
    }
    const ev = events.find(e => e.id === eventId);
    setForm(p => ({ ...p, linked_event_id: eventId, linked_event_name: ev?.name || '' }));
  };

  const handleBusinessLink = (bizId) => {
    if (bizId === 'none') {
      setForm(p => ({ ...p, linked_business_id: '', linked_business_name: '' }));
      return;
    }
    const biz = businesses.find(b => b.id === bizId);
    setForm(p => ({ ...p, linked_business_id: bizId, linked_business_name: biz?.name || '' }));
  };

  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, amount: parseFloat(form.amount) || 0 }); }} className="space-y-4">
      <div>
        <Label className="text-xs">Category</Label>
        <Select value={form.category} onValueChange={v => set('category', v)}>
          <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Amount ($) *</Label>
          <Input type="number" step="0.01" min="0" value={form.amount} onChange={e => set('amount', e.target.value)} required className="bg-secondary/50 mt-1" placeholder="0.00" />
        </div>
        <div>
          <Label className="text-xs">Date *</Label>
          <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} required className="bg-secondary/50 mt-1" />
        </div>
      </div>

      <div>
        <Label className="text-xs">Description</Label>
        <Input value={form.description} onChange={e => set('description', e.target.value)} placeholder="What is this for?" className="bg-secondary/50 mt-1" />
      </div>

      {type === 'revenue' && (
        <div>
          <Label className="text-xs">Payment Status</Label>
          <Select value={form.payment_status} onValueChange={v => set('payment_status', v)}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Link Section — prominent */}
      <div className="border-2 border-primary/30 rounded-xl p-4 space-y-4 bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-primary" />
          </div>
          <p className="text-xs font-bold text-primary uppercase tracking-wide">Link to Event or Business</p>
        </div>
        <p className="text-[11px] text-muted-foreground -mt-2">Linking helps track profit per event and revenue per partner.</p>

        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-1.5">
            <Calendar className="w-4 h-4 text-primary" /> Event
          </Label>
          <Select value={form.linked_event_id || 'none'} onValueChange={handleEventLink}>
            <SelectTrigger className="bg-card border-border h-10">
              <SelectValue placeholder="Select an event..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No Event —</SelectItem>
              {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.linked_event_name && (
            <p className="text-[11px] text-primary mt-1.5 flex items-center gap-1 font-medium">
              <Calendar className="w-3 h-3" /> {form.linked_event_name}
            </p>
          )}
        </div>

        <div>
          <Label className="text-sm font-semibold flex items-center gap-1.5 mb-1.5">
            <Building2 className="w-4 h-4 text-accent" /> Business / Client
          </Label>
          <Select value={form.linked_business_id || 'none'} onValueChange={handleBusinessLink}>
            <SelectTrigger className="bg-card border-border h-10">
              <SelectValue placeholder="Select a business..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No Business —</SelectItem>
              {businesses.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {form.linked_business_name && (
            <p className="text-[11px] text-accent mt-1.5 flex items-center gap-1 font-medium">
              <Building2 className="w-3 h-3" /> {form.linked_business_name}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label className="text-xs">Notes</Label>
        <Textarea value={form.notes} onChange={e => set('notes', e.target.value)} className="bg-secondary/50 mt-1 h-16 resize-none" />
      </div>

      <Button type="submit" disabled={saving || !form.amount} className="w-full">
        {saving ? 'Saving...' : `Log ${type === 'revenue' ? 'Revenue' : 'Expense'}`}
      </Button>
    </form>
  );
}