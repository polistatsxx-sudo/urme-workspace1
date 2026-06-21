import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Activity, DollarSign, Heart, ArrowRight, FileDown, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, isWithinInterval, subWeeks, startOfWeek } from 'date-fns';
import { computeHealthScore, daysSinceLastInteraction } from '@/utils/healthScore';
import { exportFinanceReportPDF } from '@/utils/pdfExport';

const interactionTypes = ['call', 'meeting', 'email', 'referral', 'follow_up', 'note', 'event', 'intro_made'];

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

      <Button variant="outline" onClick={handleExportPDF} className="w-full h-10">
        <FileDown className="w-4 h-4 mr-2" /> Export Financial PDF
      </Button>
    </div>
  );
}