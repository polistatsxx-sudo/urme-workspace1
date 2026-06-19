import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, Calculator, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import FinanceEntryForm from '@/components/finance/FinanceEntryForm';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval } from 'date-fns';

const categoryLabels = {
  event_revenue: 'Event Revenue', matchmaking_fee: 'Matchmaking Fee', sponsorship: 'Sponsorship',
  consulting: 'Consulting', other_revenue: 'Other Revenue',
  venue_cost: 'Venue Cost', marketing: 'Marketing', operations: 'Operations',
  software: 'Software', travel: 'Travel', payroll: 'Payroll', other_expense: 'Other Expense',
};

export default function Finance() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [addType, setAddType] = useState('revenue');

  const { data: entries = [] } = useQuery({ queryKey: ['finance'], queryFn: () => base44.entities.FinanceEntry.list('-date') });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list() });
  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.FinanceEntry.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setShowAdd(false); toast.success('Entry logged!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.FinanceEntry.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.FinanceEntry.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Deleted'); },
  });

  const now = new Date();
  const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };
  const quarterRange = { start: startOfQuarter(now), end: endOfQuarter(now) };

  const inRange = (e, range) => e.date && isWithinInterval(new Date(e.date), range);

  const monthRevenue = entries.filter(e => e.type === 'revenue' && inRange(e, monthRange)).reduce((s, e) => s + (e.amount || 0), 0);
  const monthExpenses = entries.filter(e => e.type === 'expense' && inRange(e, monthRange)).reduce((s, e) => s + (e.amount || 0), 0);

  const qRevenue = entries.filter(e => e.type === 'revenue' && inRange(e, quarterRange)).reduce((s, e) => s + (e.amount || 0), 0);
  const qExpenses = entries.filter(e => e.type === 'expense' && inRange(e, quarterRange)).reduce((s, e) => s + (e.amount || 0), 0);
  const qProfit = qRevenue - qExpenses;

  const receivables = entries.filter(e => e.type === 'revenue' && e.payment_status !== 'paid');
  const totalReceivables = receivables.reduce((s, e) => s + (e.amount || 0), 0);

  const estimatedTax = Math.max(0, qProfit * 0.25);

  const fmt = (n) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Finance Hub"
        subtitle="Revenue, expenses & tax tracking"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { setAddType('expense'); setShowAdd(true); }}>
              <TrendingDown className="w-4 h-4 mr-1" /> Log Expense
            </Button>
            <Button size="sm" onClick={() => { setAddType('revenue'); setShowAdd(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Log Revenue
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Monthly Revenue" value={fmt(monthRevenue)} icon={TrendingUp} />
        <StatCard label="Monthly Expenses" value={fmt(monthExpenses)} icon={TrendingDown} />
        <StatCard label="Monthly Profit" value={fmt(monthRevenue - monthExpenses)} icon={DollarSign}
          trend={monthRevenue - monthExpenses >= 0 ? 'Positive' : 'Negative'} />
        <StatCard label="Receivables" value={fmt(totalReceivables)} icon={Receipt}
          trend={receivables.length > 0 ? `${receivables.length} pending` : undefined} />
      </div>

      <Tabs defaultValue="entries">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="entries">All Entries</TabsTrigger>
          <TabsTrigger value="receivables">Receivables ({receivables.length})</TabsTrigger>
          <TabsTrigger value="tax">Tax Estimate</TabsTrigger>
        </TabsList>

        <TabsContent value="entries">
          <div className="space-y-2">
            {entries.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No entries yet — log your first revenue or expense</p>}
            {entries.map(e => (
              <div key={e.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${e.type === 'revenue' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
                    {e.type === 'revenue' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.description || categoryLabels[e.category] || e.type}</p>
                    <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground">
                      <span>{e.date ? format(new Date(e.date), 'MMM d, yyyy') : ''}</span>
                      <Badge variant="outline" className="text-[9px]">{categoryLabels[e.category] || e.category}</Badge>
                      {e.linked_event_name && <span>• {e.linked_event_name}</span>}
                      {e.linked_business_name && <span>• {e.linked_business_name}</span>}
                      {e.payment_status === 'pending' && <Badge className="bg-yellow-500/15 text-yellow-400 text-[9px]">Pending</Badge>}
                      {e.payment_status === 'overdue' && <Badge className="bg-destructive/15 text-destructive text-[9px]">Overdue</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${e.type === 'revenue' ? 'text-emerald-400' : 'text-destructive'}`}>
                    {e.type === 'revenue' ? '+' : '-'}{fmt(e.amount || 0)}
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm('Delete this entry?')) deleteMut.mutate(e.id); }}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="receivables">
          <div className="space-y-2">
            {receivables.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No outstanding receivables</p>}
            {receivables.map(e => (
              <div key={e.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{e.description || categoryLabels[e.category]}</p>
                  <div className="flex items-center gap-2 flex-wrap text-[10px] text-muted-foreground mt-1">
                    <span>{e.date ? format(new Date(e.date), 'MMM d, yyyy') : ''}</span>
                    {e.linked_business_name && <span>• From: {e.linked_business_name}</span>}
                    <Badge className={`text-[9px] ${e.payment_status === 'overdue' ? 'bg-destructive/15 text-destructive' : 'bg-yellow-500/15 text-yellow-400'}`}>
                      {e.payment_status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-emerald-400">{fmt(e.amount || 0)}</span>
                  <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => updateMut.mutate({ id: e.id, data: { payment_status: 'paid' } })}>
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="tax">
          <div className="bg-card border border-border rounded-xl p-6 max-w-lg">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Quarterly Tax Estimation</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Current quarter: {format(quarterRange.start, 'MMM d')} – {format(quarterRange.end, 'MMM d, yyyy')}</p>
            <div className="space-y-3">
              <div className="flex justify-between bg-secondary/50 rounded-lg p-3">
                <span className="text-sm text-muted-foreground">Quarterly Revenue</span>
                <span className="text-sm font-semibold text-emerald-400">{fmt(qRevenue)}</span>
              </div>
              <div className="flex justify-between bg-secondary/50 rounded-lg p-3">
                <span className="text-sm text-muted-foreground">Quarterly Expenses</span>
                <span className="text-sm font-semibold text-destructive">{fmt(qExpenses)}</span>
              </div>
              <div className="flex justify-between bg-secondary/50 rounded-lg p-3 border border-border">
                <span className="text-sm font-medium">Net Profit</span>
                <span className={`text-sm font-bold ${qProfit >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>{fmt(qProfit)}</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="flex justify-between bg-primary/10 rounded-lg p-3">
                  <span className="text-sm font-medium">Est. Tax Reserve (25%)</span>
                  <span className="text-sm font-bold text-primary">{fmt(estimatedTax)}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">* Estimated at 25% of net profit. Consult your accountant for actual tax obligations.</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Log {addType === 'revenue' ? 'Revenue' : 'Expense'}</DialogTitle></DialogHeader>
          <FinanceEntryForm
            type={addType}
            events={events}
            businesses={businesses}
            onSubmit={d => createMut.mutate(d)}
            saving={createMut.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}