import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, CheckSquare, Calendar, Handshake, AlertTriangle, TrendingUp, ArrowRight, Clock } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StatCard from '@/components/shared/StatCard';
import StageBadge from '@/components/shared/StageBadge';
import { Button } from '@/components/ui/button';
import { format, isPast, isToday, addDays } from 'date-fns';

const stageLabels = {
  new_lead: 'New Lead', contacted: 'Contacted', meeting_scheduled: 'Meeting',
  in_discussion: 'Discussion', collaborating: 'Collaborating', partnered: 'Partnered', archived: 'Archived'
};

export default function Dashboard() {
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

  const urgentTasks = tasks.filter(t => t.status !== 'done' && (t.priority === 'urgent' || t.priority === 'high' || (t.due_date && (isPast(new Date(t.due_date)) || isToday(new Date(t.due_date)) || new Date(t.due_date) <= addDays(new Date(), 3))))).slice(0, 5);

  return (
    <div className="animate-slide-up">
      <PageHeader title="Dashboard" subtitle="Your URME command center" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label="Active Businesses" value={activeBiz.length} icon={Building2} />
        <StatCard label="Open Tasks" value={openTasks.length} icon={CheckSquare} trend={overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : undefined} />
        <StatCard label="Upcoming Events" value={upcomingEvents.length} icon={Calendar} />
        <StatCard label="Potential Matches" value={matches.filter(m => m.status === 'suggested').length} icon={Handshake} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {/* Pipeline Overview */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Pipeline Health</h2>
            <Link to="/pipeline"><Button variant="ghost" size="sm" className="text-xs">View Pipeline <ArrowRight className="w-3 h-3 ml-1" /></Button></Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(stageLabels).filter(([k]) => k !== 'archived').map(([stage, label]) => (
              <div key={stage} className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold font-display">{pipelineCounts[stage] || 0}</p>
              </div>
            ))}
          </div>
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
    </div>
  );
}