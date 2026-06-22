import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Activity, DollarSign, Heart, ArrowRight, FileDown, Users, Sparkles, Copy, Loader2, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';
import StageBadge from '@/components/shared/StageBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, startOfMonth, endOfMonth, isWithinInterval, subWeeks, startOfWeek } from 'date-fns';
import { computeHealthScore, daysSinceLastInteraction } from '@/utils/healthScore';
import { exportFinanceReportPDF } from '@/utils/pdfExport';
import { toast } from 'sonner';

const interactionTypes = ['call', 'meeting', 'email', 'referral', 'follow_up', 'note', 'event', 'intro_made'];

const pieColors = ['#3b82f6', '#a855f7', '#eab308', '#ec4899', '#f97316', '#6b7280', '#10b981', '#06b6d4'];

export default function Reports() {
  const navigate = useNavigate();
  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: interactions = [] } = useQuery({ queryKey: ['interactions'], queryFn: () => base44.entities.Interaction.list('-interaction_date') });
  const { data: finance = [] } = useQuery({ queryKey: ['finance'], queryFn: () => base44.entities.FinanceEntry.list('-date') });

  const now = new Date();
  const monthRange = { start: startOfMonth(now), end: endOfMonth(now) };

  const activeBiz = businesses.filter(b => b.stage !== 'archived');
  const avgHealth = useMemo(() => {
    if (activeBiz.length === 0) return 0;
    return Math.round(activeBiz.reduce((s, b) => s + computeHealthScore(b), 0) / activeBiz.length);
  }, [activeBiz]);

  const monthInteractions = interactions.filter(i => i.interaction_date && isWithinInterval(new Date(i.interaction_date), monthRange));
  const monthRevenue = finance.filter(e => e.type === 'revenue' && e.date && isWithinInterval(new Date(e.date), monthRange)).reduce((s, e) => s + (e.amount || 0), 0);

  // Activity by week (last 8 weeks)
  const weeklyActivity = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => {
      const weekStart = startOfWeek(subWeeks(now, 7 - i));
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const weekInteractions = interactions.filter(int => {
        if (!int.interaction_date) return false;
        return isWithinInterval(new Date(int.interaction_date), { start: weekStart, end: weekEnd });
      });
      const data = { week: format(weekStart, 'MMM d') };
      interactionTypes.forEach(t => { data[t] = weekInteractions.filter(i => i.type === t).length; });
      return data;
    });
  }, [interactions, now]);

  // Team activity
  const teamActivity = useMemo(() => {
    const map = {};
    interactions.forEach(i => {
      const name = i.logged_by_name || 'Unknown';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [interactions]);

  // At-risk businesses
  const atRisk = useMemo(() => {
    return activeBiz
      .map(b => ({ ...b, score: computeHealthScore(b), days: daysSinceLastInteraction(b) }))
      .filter(b => b.score < 40)
      .sort((a, b) => a.score - b.score);
  }, [activeBiz]);

  const handleExportPDF = () => {
    exportFinanceReportPDF(finance.filter(e => e.date && isWithinInterval(new Date(e.date), monthRange)), monthRange);
  };

  // Interaction breakdown by type (pie chart data)
  const interactionBreakdown = useMemo(() => {
    const counts = {};
    monthInteractions.forEach(i => {
      counts[i.type] = (counts[i.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({ name: type.replace(/_/g, ' '), value: count }));
  }, [monthInteractions]);

  // Pipeline movement this month (recently modified businesses)
  const pipelineMovement = useMemo(() => {
    return businesses
      .filter(b => b.updated_date && isWithinInterval(new Date(b.updated_date), monthRange) && b.stage !== 'archived')
      .sort((a, b) => new Date(b.updated_date) - new Date(a.updated_date))
      .slice(0, 10)
      .map(b => ({ ...b, score: computeHealthScore(b) }));
  }, [businesses, monthRange]);

  // Revenue vs goal
  const [revenueGoal, setRevenueGoal] = useState(() => {
    const stored = localStorage.getItem('urme_revenue_goal');
    return stored ? parseFloat(stored) : 10000;
  });
  const revenueProgress = revenueGoal > 0 ? Math.min(100, (monthRevenue / revenueGoal) * 100) : 0;

  const handleGoalChange = (val) => {
    const num = parseFloat(val) || 0;
    setRevenueGoal(num);
    localStorage.setItem('urme_revenue_goal', num.toString());
  };

  // AI Weekly Summary
  const [aiSummary, setAiSummary] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const generateWeeklySummary = async () => {
    setAiLoading(true);
    try {
      const weekAgo = subWeeks(now, 1);
      const weekInteractions = interactions.filter(i => i.interaction_date && new Date(i.interaction_date) >= weekAgo);
      const weekBusinesses = businesses.filter(b => b.created_date && new Date(b.created_date) >= weekAgo);
      const movedBusinesses = businesses.filter(b => b.updated_date && new Date(b.updated_date) >= weekAgo && b.stage !== 'archived');
      const staleBusinesses = activeBiz.filter(b => {
        if (!b.last_interaction_date) return true;
        return daysSinceLastInteraction(b) >= 14;
      }).slice(0, 5);

      const topInteractions = weekInteractions
        .sort((a, b) => new Date(b.interaction_date) - new Date(a.interaction_date))
        .slice(0, 3)
        .map(i => `- ${i.title || i.type} with ${i.business_name || 'unknown'} (${i.outcome || 'no outcome noted'})`)
        .join('\n');

      const staleList = staleBusinesses.map(b => `- ${b.name} (${daysSinceLastInteraction(b) ?? 0} days since last contact)`).join('\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `Summarize this week's networking activity:
- ${weekInteractions.length} new interactions logged
- ${movedBusinesses.length} businesses moved in pipeline
- ${weekBusinesses.length} new leads added
- Top interactions:
${topInteractions || '- None logged'}
- Relationships needing attention:
${staleList || '- None'}

Give a brief 3-4 sentence executive summary and 2-3 priorities for next week.`,
      });
      setAiSummary(res);
    } catch {
      toast.error('Failed to generate summary');
    } finally {
      setAiLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(aiSummary);
    toast.success('Summary copied to clipboard');
  };

  return (
    <div className="animate-slide-up pb-20">
      <PageHeader title="Reports & Analytics" subtitle="Your network performance at a glance" />

      {/* Top stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Businesses" value={businesses.length} icon={Building2} />
        <StatCard label="Avg Health Score" value={avgHealth} icon={Heart} />
        <StatCard label="Interactions (Month)" value={monthInteractions.length} icon={Activity} />
        <StatCard label="Revenue (Month)" value={`$${monthRevenue.toLocaleString()}`} icon={DollarSign} />
      </div>

      {/* Activity chart */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Activity — Last 8 Weeks
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyActivity} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
            />
            <Legend wrapperStyle={{ fontSize: 9 }} />
            <Bar dataKey="meeting" stackId="a" fill="hsl(174 62% 47%)" />
            <Bar dataKey="call" stackId="a" fill="hsl(265 60% 58%)" />
            <Bar dataKey="email" stackId="a" fill="hsl(36 95% 60%)" />
            <Bar dataKey="follow_up" stackId="a" fill="hsl(142 60% 50%)" />
            <Bar dataKey="note" stackId="a" fill="hsl(0 72% 51%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Team activity */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" /> Team Activity
        </h2>
        {teamActivity.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No team activity yet</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={teamActivity} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              />
              <Bar dataKey="count" name="Interactions" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* At-risk relationships */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">At-Risk Relationships</h2>
        {atRisk.length === 0 ? (
          <p className="text-xs text-emerald-400 text-center py-6">All relationships are healthy</p>
        ) : (
          <div className="space-y-2">
            {atRisk.map(b => (
              <button key={b.id} onClick={() => navigate(`/businesses/${b.id}`)}
                className="w-full flex items-center justify-between bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 text-left transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {b.days !== null ? `${b.days} days ago` : 'Never contacted'}
                  </p>
                </div>
                <HealthScoreBadge score={b.score} />
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Interaction Breakdown by Type */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> Interaction Breakdown — This Month
        </h2>
        {interactionBreakdown.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No interactions this month</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={interactionBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                {interactionBreakdown.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Pipeline Movement This Month */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Pipeline Movement — This Month</h2>
        {pipelineMovement.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No movement this month</p>
        ) : (
          <div className="space-y-2">
            {pipelineMovement.map(b => (
              <button key={b.id} onClick={() => navigate(`/businesses/${b.id}`)}
                className="w-full flex items-center justify-between bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 text-left transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{b.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StageBadge stage={b.stage} />
                  </div>
                </div>
                <HealthScoreBadge score={b.score} />
                <ArrowRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Revenue vs Goal */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Revenue vs Goal — This Month
          </h2>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">$</span>
            <Input
              type="number"
              value={revenueGoal}
              onChange={e => handleGoalChange(e.target.value)}
              className="w-24 h-7 text-xs bg-secondary/50"
            />
          </div>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">${monthRevenue.toLocaleString()} earned</span>
            <span className="text-muted-foreground">${revenueGoal.toLocaleString()} goal</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${revenueProgress}%` }} />
          </div>
          <p className="text-xs text-right text-primary font-medium">{revenueProgress.toFixed(0)}% of goal</p>
        </div>
      </div>

      {/* AI Weekly Summary */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" /> AI Weekly Summary
        </h2>
        <Button onClick={generateWeeklySummary} disabled={aiLoading} className="w-full h-10 mb-3">
          {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          {aiLoading ? 'Generating...' : 'Generate Weekly Summary'}
        </Button>
        {aiSummary && (
          <div className="bg-secondary/30 border border-border rounded-lg p-3 relative">
            <button onClick={copySummary} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-primary">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <p className="text-sm text-foreground/80 whitespace-pre-wrap pr-6">{aiSummary}</p>
          </div>
        )}
      </div>

      <Button variant="outline" onClick={handleExportPDF} className="w-full h-10">
        <FileDown className="w-4 h-4 mr-2" /> Export Financial PDF
      </Button>
    </div>
  );
}