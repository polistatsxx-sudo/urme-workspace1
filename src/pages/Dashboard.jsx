import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, CheckSquare, Calendar, Handshake, AlertTriangle, TrendingUp, ArrowRight, Clock, CreditCard, PenLine, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StageBadge from '@/components/shared/StageBadge';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';
import { Button } from '@/components/ui/button';
import { format, isPast, isToday, addDays, differenceInDays } from 'date-fns';
import BulkLogInteractionModal from '@/components/business/BulkLogInteractionModal';
import { computeHealthScore, isBusinessStale, daysSinceLastInteraction } from '@/utils/healthScore';

const stageLabels = {
  new_lead: 'New Lead', contacted: 'Contacted', meeting_scheduled: 'Meeting',
  in_discussion: 'Discussion', collaborating: 'Collaborating', partnered: 'Partnered', archived: 'Archived'
};

const CEO_EMAIL = 'macecnc@urmeinc.com';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [bulkLogOpen, setBulkLogOpen] = useState(false);
  useEffect(() => { base44.auth.me().then(setCurrentUser).catch(() => {}); }, []);
  const isCEO = currentUser?.email === CEO_EMAIL;

  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list() });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list() });
  const { data: matches = [] } = useQuery({ queryKey: ['matches'], queryFn: () => base44.entities.Match.list() });

  const activeBiz = businesses.filter(b => b.stage !== 'archived');
  const openTasks = tasks.filter(t => t.status !== 'done');
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
  const upcomingEvents = events.filter(e => e.date && !isPast(new Date(e.date))).sort((a, b) => new Date(a.date) - new Date(b.date));
  const topMatches = matches.filter(m => m.status === 'suggested').sort((a, b) => (b.synergy_score || 0) - (a.synergy_score || 0)).slice(0, 4);

  const pipelineCounts = {};
  activeBiz.forEach(b => { pipelineCounts[b.stage] = (pipelineCounts[b.stage] || 0) + 1; });

  const pipelineChartData = Object.entries(stageLabels)
    .filter(([k]) => k !== 'archived')
    .map(([stage, label]) => ({ stage: label.replace(' ', '\n'), count: pipelineCounts[stage] || 0 }))
    .filter(d => d.count > 0);

  const urgentTasks = tasks.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high' || (t.due_date && (isPast(new Date(t.due_date)) || isToday(new Date(t.due_date)) || new Date(t.due_date) <= addDays(new Date(), 3))))).slice(0, 5);

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Dashboard"
        subtitle={`Today is ${format(new Date(), 'EEEE, MMMM d, yyyy')} · Your URME command center`}
        actions={
          <Button size="sm" onClick={() => setBulkLogOpen(true)} className="gap-2">
            <PenLine className="w-4 h-4" /> Log Interaction
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Businesses" value={activeBiz.length} icon={Building2} />
        <StatCard label="Open Tasks" value={openTasks.length} icon={CheckSquare} trend={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined} />
        <StatCard label="Upcoming Events" value={upcomingEvents.length} icon={Calendar} />
        <StatCard label="Potential Matches" value={matches.filter(m => m.status === 'suggested').length} icon={Handshake} />
      </div>

      {/* Needs Attention - Stale Contacts */}
      {(() => {
        const staleBiz = activeBiz.filter(isBusinessStale).sort((a, b) => {
          const da = a.last_interaction_date ? differenceInDays(new Date(), new Date(a.last_interaction_date)) : 9999;
          const db = b.last_interaction_date ? differenceInDays(new Date(), new Date(b.last_interaction_date)) : 9999;
          return db - da;
        });
        return (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-400" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Needs Attention {staleBiz.length > 0 && `(${staleBiz.length})`}
              </h2>
            </div>
            {staleBiz.length === 0 ? (
              <div className="bg-emerald-500/10 text-emerald-400 rounded-xl p-3 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4" /> All relationships on track
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0">
                {staleBiz.map(b => {
                  const days = daysSinceLastInteraction(b);
                  return (
                    <Link key={b.id} to={`/businesses/${b.id}`}
                      className="flex-shrink-0 w-40 rounded-xl border border-orange-500/30 bg-card p-3 active:scale-95 transition-transform snap-start">
                      <p className="text-sm font-semibold truncate">{b.name}</p>
                      <div className="mt-1"><StageBadge stage={b.stage} /></div>
                      <p className="text-[10px] text-orange-400 mt-2">
                        {days !== null ? `${days} days ago` : 'Never contacted'}
                      </p>
                      <div className="flex justify-end mt-1">
                        <ChevronRight className="w-3 h-3 text-orange-400" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* At-Risk Relationships */}
      {(() => {
        const atRisk = activeBiz.map(b => ({ ...b, score: computeHealthScore(b) })).filter(b => b.score < 40).sort((a, b) => a.score - b.score).slice(0, 5);
        if (atRisk.length === 0) return null;
        return (
          <div className="bg-card border border-border rounded-xl p-5 mb-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">At-Risk Relationships</h2>
            <div className="space-y-2">
              {atRisk.map(b => {
                const days = daysSinceLastInteraction(b);
                return (
                  <Link key={b.id} to={`/businesses/${b.id}`}
                    className="flex items-center justify-between bg-secondary/40 hover:bg-secondary/70 rounded-lg p-3 transition-colors">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{b.name}</p>
                      <p className="text-[10px] text-muted-foreground">{days !== null ? `Last: ${days} days ago` : 'Never contacted'}</p>
                    </div>
                    <HealthScoreBadge score={b.score} />
                    <ChevronRight className="w-4 h-4 text-muted-foreground ml-2 flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Health</h2>
            <Link to="/pipeline"><Button variant="ghost" size="sm" className="text-xs">View Pipeline <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="stage" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
                itemStyle={{ color: 'hsl(var(--primary))' }}
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              />
              <Bar dataKey="count" name="Businesses" radius={[4, 4, 0, 0]}>
                {pipelineChartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--primary) / ${0.4 + (i / pipelineChartData.length) * 0.6})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk & Opportunity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Risks & Opportunities</h2>
          <div className="space-y-3">
            {overdueTasks.length > 0 && (
              <div className="flex items-start gap-2 bg-destructive/10 rounded-lg p-3">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-destructive">{overdueTasks.length} overdue tasks</p>
                  <p className="text-[10px] text-muted-foreground">Follow-ups may be slipping</p>
                </div>
              </div>
            )}
            {topMatches.length > 0 && (
              <div className="flex items-start gap-2 bg-primary/10 rounded-lg p-3">
                <TrendingUp className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-primary">{topMatches.length} high-potential matches</p>
                  <p className="text-[10px] text-muted-foreground">Ready for introductions</p>
                </div>
              </div>
            )}
            {businesses.filter(b => b.stage === 'in_discussion').length > 0 && (
              <div className="flex items-start gap-2 bg-accent/10 rounded-lg p-3">
                <Handshake className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-accent">{businesses.filter(b => b.stage === 'in_discussion').length} in active discussion</p>
                  <p className="text-[10px] text-muted-foreground">Close to collaboration</p>
                </div>
              </div>
            )}
            {overdueTasks.length === 0 && topMatches.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">All clear — no alerts</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Upcoming Tasks */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Urgent & Due Soon</h2>
            <Link to="/tasks"><Button variant="ghost" size="sm" className="text-xs">All Tasks <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
          </div>
          <div className="space-y-2">
            {urgentTasks.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No urgent tasks</p>}
            {urgentTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between bg-secondary/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.priority === 'urgent' ? 'bg-destructive' : t.priority === 'high' ? 'bg-orange-400' : 'bg-yellow-400'}`} />
                  <span className="text-xs font-medium truncate">{t.title}</span>
                </div>
                {t.due_date && (
                  <span className={`text-[10px] flex-shrink-0 ml-2 ${isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)) ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {format(new Date(t.due_date), 'MMM d')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Top Matches */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Top Matches</h2>
            <Link to="/businesses"><Button variant="ghost" size="sm" className="text-xs">Network <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
          </div>
          <div className="space-y-2">
            {topMatches.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No matches yet — run Synergy Scanner</p>}
            {topMatches.map(m => (
              <div key={m.id} className="bg-secondary/50 rounded-lg px-3 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium">
                    <span className="text-primary">{m.business_a_name}</span>
                    <span className="text-muted-foreground mx-1">×</span>
                    <span className="text-accent">{m.business_b_name}</span>
                  </div>
                  <span className="text-xs font-bold text-primary">{m.synergy_score}%</span>
                </div>
                {m.reason && <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{m.reason}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BulkLogInteractionModal open={bulkLogOpen} onOpenChange={setBulkLogOpen} businesses={businesses} user={currentUser} />

      {isCEO && (
        <div className="mt-6 flex justify-end">
          <a
            href="https://buy.stripe.com/00wfZi6ID2uHeqw2JK3Je00"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors border border-border rounded-lg px-3 py-2 hover:border-primary/40"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Manage Workspace Hosting · $25/mo
          </a>
        </div>
      )}
    </div>
  );
}