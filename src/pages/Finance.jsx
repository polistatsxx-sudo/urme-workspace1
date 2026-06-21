import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt, Calculator, Trash2, CheckCircle2, BarChart3, Calendar, Building2, AlertCircle, PieChart, Download, FileDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import FinanceEntryForm from '@/components/finance/FinanceEntryForm';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, isWithinInterval, differenceInDays } from 'date-fns';
import { exportToCSV } from '@/utils/csvExport';
import { exportFinanceReportPDF } from '@/utils/pdfExport';

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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); toast.success('Marked as paid'); },
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
  const monthProfit = monthRevenue - monthExpenses;

  const qRevenue = entries.filter(e => e.type === 'revenue' && inRange(e, quarterRange)).reduce((s, e) => s + (e.amount || 0), 0);
  const qExpenses = entries.filter(e => e.type === 'expense' && inRange(e, quarterRange)).reduce((s, e) => s + (e.amount || 0), 0);
  const qProfit = qRevenue - qExpenses;

  const receivables = entries.filter(e => e.type === 'revenue' && e.payment_status !== 'paid');
  const totalReceivables = receivables.reduce((s, e) => s + (e.amount || 0), 0);
  const estimatedTax = Math.max(0, qProfit * 0.25);

  // Revenue by category for tax tab
  const revenueByCategory = {};
  entries.filter(e => e.type === 'revenue' && inRange(e, quarterRange)).forEach(e => {
    revenueByCategory[e.category] = (revenueByCategory[e.category] || 0) + (e.amount || 0);
  });
  const expenseByCategory = {};
  entries.filter(e => e.type === 'expense' && inRange(e, quarterRange)).forEach(e => {
    expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + (e.amount || 0);
  });

  // Last 4 months bar chart
  const monthlyChart = Array.from({ length: 4 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
    const range = { start: startOfMonth(d), end: endOfMonth(d) };
    const rev = entries.filter(e => e.type === 'revenue' && inRange(e, range)).reduce((s, e) => s + (e.amount || 0), 0);
    const exp = entries.filter(e => e.type === 'expense' && inRange(e, range)).reduce((s, e) => s + (e.amount || 0), 0);
    return { month: format(d, 'MMM'), revenue: rev, expenses: exp };
  });

  // Profit by event aggregation
  const eventProfitMap = {};
  entries.forEach(e => {
    if (!e.linked_event_id) return;
    if (!eventProfitMap[e.linked_event_id]) {
      eventProfitMap[e.linked_event_id] = { name: e.linked_event_name, revenue: 0, expenses: 0 };
    }
    if (e.type === 'revenue') eventProfitMap[e.linked_event_id].revenue += (e.amount || 0);
    else eventProfitMap[e.linked_event_id].expenses += (e.amount || 0);
  });
  const eventProfits = Object.entries(eventProfitMap)
    .map(([id, d]) => ({ id, ...d, profit: d.revenue - d.expenses }))
    .sort((a, b) => b.profit - a.profit);

  const fmt = (n) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Finance Hub"
        subtitle="Revenue, expenses & financial tracking"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => exportToCSV(entries, 'finance_export.csv', [
              { key: 'date', header: 'Date' },
              { key: 'type', header: 'Type' },
              { key: 'category', header: 'Category' },
              { key: 'amount', header: 'Amount' },
              { key: 'description', header: 'Description' },
              { key: 'payment_status', header: 'Status' },
              { key: 'linked_business_name', header: 'Business' },
            ])} className="gap-1"><Download className="w-4 h-4" /><span className="hidden lg:inline">Export CSV</span></Button>
            <Button size="sm" variant="outline" onClick={() => exportFinanceReportPDF(entries, monthRange)} className="gap-1"><FileDown className="w-4 h-4" /><span className="hidden lg:inline">Export PDF</span></Button>
            <Button size="sm" variant="outline" onClick={() => { setAddType('expense'); setShowAdd(true); }}>
              <TrendingDown className="w-4 h-4 mr-1" /> Log Expense
            </Button>
            <Button size="sm" onClick={() => { setAddType('revenue'); setShowAdd(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Log Revenue
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Monthly Revenue</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(monthRevenue)}</p>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> This month</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Monthly Expenses</p>
          <p className="text-2xl font-bold text-destructive">{fmt(monthExpenses)}</p>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><TrendingDown className="w-3 h-3" /> This month</p>
        </div>
        <div className={`bg-card border rounded-xl p-4 ${monthProfit < 0 ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
          <p className="text-xs text-muted-foreground mb-1">Monthly Profit</p>
          <p className={`text-2xl font-bold ${monthProfit >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {monthProfit < 0 ? '-' : ''}{fmt(monthProfit)}
          </p>
          <p className={`text-[10px] mt-1 flex items-center gap-1 ${monthProfit < 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {monthProfit < 0 ? <AlertCircle className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
            {monthProfit < 0 ? 'Running at a loss' : 'Net positive'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Receivables</p>
          <p className="text-2xl font-bold text-yellow-400">{fmt(totalReceivables)}</p>
          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
            <Receipt className="w-3 h-3" /> {receivables.length} pending
          </p>
        </div>
      </div>

      {/* Monthly Revenue vs Expenses Chart */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Revenue vs Expenses — Last 4 Months</p>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyChart} margin={{ top: 0, right: 8, left: -20, bottom: 0 }} barGap={4}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              formatter={(val, name) => [`$${val.toLocaleString()}`, name]}
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="revenue" name="Revenue" fill="hsl(142 60% 50%)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill="hsl(0 72% 51% / 0.7)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <Tabs defaultValue="entries">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="entries">All Entries</TabsTrigger>
          <TabsTrigger value="receivables">
            Receivables
            {receivables.length > 0 && (
              <span className="ml-1.5 bg-yellow-500/20 text-yellow-400 rounded-full px-1.5 py-0.5 text-[9px] font-bold">{receivables.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="events">By Event</TabsTrigger>
          <TabsTrigger value="tax">Tax Estimate</TabsTrigger>
        </TabsList>

        {/* All Entries */}
        <TabsContent value="entries">
          <div className="space-y-2">
            {entries.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <DollarSign className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No entries yet</p>
                <p className="text-xs mt-1">Log your first revenue or expense to get started</p>
              </div>
            )}
            {entries.map(e => (
              <div key={e.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${e.type === 'revenue' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-destructive/15 text-destructive'}`}>
                    {e.type === 'revenue' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.description || categoryLabels[e.category] || e.type}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span className="text-[11px] text-muted-foreground">{e.date ? format(new Date(e.date), 'MMM d, yyyy') : ''}</span>
                      <Badge variant="outline" className="text-[9px] px-1.5">{categoryLabels[e.category] || e.category}</Badge>
                      {e.linked_event_name && (
                        <span className="text-[10px] bg-primary/10 text-primary rounded-md px-1.5 py-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" /> {e.linked_event_name}
                        </span>
                      )}
                      {e.linked_business_name && (
                        <span className="text-[10px] bg-accent/10 text-accent rounded-md px-1.5 py-0.5 flex items-center gap-1">
                          <Building2 className="w-2.5 h-2.5" /> {e.linked_business_name}
                        </span>
                      )}
                      {e.payment_status === 'pending' && <Badge className="bg-yellow-500/15 text-yellow-400 text-[9px]">Pending</Badge>}
                      {e.payment_status === 'overdue' && <Badge className="bg-destructive/15 text-destructive text-[9px]">Overdue</Badge>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className={`text-base font-bold tabular-nums ${e.type === 'revenue' ? 'text-emerald-400' : 'text-destructive'}`}>
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

        {/* Receivables */}
        <TabsContent value="receivables">
          {receivables.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-20 text-emerald-400" />
              <p className="text-sm font-medium">All caught up!</p>
              <p className="text-xs mt-1">No outstanding receivables</p>
            </div>
          ) : (
            <div className="space-y-2">
              {receivables.map(e => {
                const days = e.date ? differenceInDays(now, new Date(e.date)) : 0;
                const isOverdue = e.payment_status === 'overdue' || days > 30;
                return (
                  <div key={e.id} className={`bg-card border rounded-xl p-4 flex items-center justify-between transition-colors ${isOverdue ? 'border-destructive/40 bg-destructive/5' : 'border-border'}`}>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="text-sm font-semibold">{e.description || categoryLabels[e.category]}</p>
                        <Badge className={`text-[9px] ${isOverdue ? 'bg-destructive/15 text-destructive' : 'bg-yellow-500/15 text-yellow-400'}`}>
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
                        {e.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(e.date), 'MMM d, yyyy')}</span>}
                        {e.linked_business_name && (
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" /> From: <span className="text-foreground font-medium ml-0.5">{e.linked_business_name}</span>
                          </span>
                        )}
                        {e.linked_event_name && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Event: <span className="text-foreground font-medium ml-0.5">{e.linked_event_name}</span>
                          </span>
                        )}
                        {days > 0 && (
                          <span className={isOverdue ? 'text-destructive font-semibold' : ''}>
                            {days} day{days !== 1 ? 's' : ''} ago
                          </span>
                        )}
                        <span>{categoryLabels[e.category] || e.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      <span className="text-base font-bold text-emerald-400 tabular-nums">{fmt(e.amount || 0)}</span>
                      <Button size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => updateMut.mutate({ id: e.id, data: { payment_status: 'paid' } })}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Mark Paid
                      </Button>
                    </div>
                  </div>
                );
              })}
              <div className="mt-2 bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">Total Outstanding</span>
                <span className="text-lg font-bold text-yellow-400">{fmt(totalReceivables)}</span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Profit by Event */}
        <TabsContent value="events">
          {eventProfits.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No event P&L data yet</p>
              <p className="text-xs mt-1">Link entries to events when logging to see profit breakdowns here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {eventProfits.map(ev => {
                const total = ev.revenue + ev.expenses;
                const revenueShare = total > 0 ? Math.round((ev.revenue / total) * 100) : 0;
                return (
                  <div key={ev.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Calendar className="w-4 h-4 text-primary" />
                        </div>
                        <p className="text-sm font-semibold">{ev.name || 'Unnamed Event'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Net Profit</p>
                        <p className={`text-base font-bold tabular-nums ${ev.profit >= 0 ? 'text-emerald-400' : 'text-destructive'}`}>
                          {ev.profit < 0 ? '-' : '+'}{fmt(ev.profit)}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="bg-emerald-500/10 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Revenue</p>
                        <p className="text-sm font-bold text-emerald-400">{fmt(ev.revenue)}</p>
                      </div>
                      <div className="bg-destructive/10 rounded-lg p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground">Expenses</p>
                        <p className="text-sm font-bold text-destructive">{fmt(ev.expenses)}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${ev.profit >= 0 ? 'bg-emerald-400' : 'bg-destructive'}`}
                        style={{ width: `${revenueShare}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Revenue share of total</span>
                      <span>{revenueShare}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Tax Estimate */}
        <TabsContent value="tax">
          <div className="max-w-2xl space-y-4">
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center gap-2 mb-1">
                <Calculator className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Current Quarter Breakdown</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {format(quarterRange.start, 'MMMM d')} – {format(quarterRange.end, 'MMMM d, yyyy')}
              </p>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center bg-emerald-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">{fmt(qRevenue)}</span>
                </div>
                <div className="flex justify-between items-center bg-destructive/10 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-muted-foreground">Total Expenses</span>
                  </div>
                  <span className="text-sm font-bold text-destructive">- {fmt(qExpenses)}</span>
                </div>
                <div className="flex justify-between items-center bg-secondary/50 rounded-lg p-3 border border-border">
                  <span className="text-sm font-semibold">Net Profit</span>
                  <span className={`text-sm font-bold ${qProfit >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {qProfit < 0 ? '-' : ''}{fmt(qProfit)}
                  </span>
                </div>
              </div>

              {/* Revenue by category */}
              {Object.keys(revenueByCategory).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Revenue Sources</p>
                  <div className="space-y-1.5">
                    {Object.entries(revenueByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{categoryLabels[cat] || cat}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${qRevenue > 0 ? Math.round((amt/qRevenue)*100) : 0}%` }} />
                          </div>
                          <span className="font-semibold text-emerald-400 w-16 text-right">{fmt(amt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expenses by category */}
              {Object.keys(expenseByCategory).length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Expense Breakdown</p>
                  <div className="space-y-1.5">
                    {Object.entries(expenseByCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{categoryLabels[cat] || cat}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-destructive/60 rounded-full" style={{ width: `${qExpenses > 0 ? Math.round((amt/qExpenses)*100) : 0}%` }} />
                          </div>
                          <span className="font-semibold text-destructive w-16 text-right">{fmt(amt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Estimated Tax Reserve</p>
                  <p className="text-xs text-muted-foreground mt-0.5">~25% of net profit (rough self-employment estimate)</p>
                </div>
                <p className="text-2xl font-bold text-primary">{fmt(estimatedTax)}</p>
              </div>
              {qProfit > 0 && (
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-card/60 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">Federal (~21%)</p>
                    <p className="text-sm font-bold">{fmt(qProfit * 0.21)}</p>
                  </div>
                  <div className="bg-card/60 rounded-lg p-3 text-center">
                    <p className="text-[10px] text-muted-foreground">SE Tax (~15.3%)</p>
                    <p className="text-sm font-bold">{fmt(qProfit * 0.153)}</p>
                  </div>
                </div>
              )}
              {qProfit <= 0 && (
                <p className="text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2 mt-3">
                  No reserve needed this quarter — net profit is zero or negative.
                </p>
              )}
            </div>

            <p className="text-[10px] text-muted-foreground px-1 leading-relaxed">
              * Estimate only. Does not account for deductions, credits, or state obligations. Consult your accountant for actual tax guidance.
            </p>
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