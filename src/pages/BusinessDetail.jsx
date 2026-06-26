import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Phone, Mail, Globe, MapPin, Building2, Sparkles, Loader2, FileDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import StageBadge from '@/components/shared/StageBadge';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';
import BusinessForm from '@/components/business/BusinessForm';
import InteractionTimeline from '@/components/business/InteractionTimeline';
import LogInteractionForm from '@/components/business/LogInteractionForm';
import MatchList from '@/components/business/MatchList';
import ContactInfoCard from '@/components/business/ContactInfoCard';
import AccountManagerCard from '@/components/business/AccountManagerCard';
import EventEngagements from '@/components/business/EventEngagements';
import ContactsCard from '@/components/business/ContactsCard';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { computeHealthScore, computeNextFollowUp } from '@/utils/healthScore';
import { exportBusinessPDF } from '@/utils/pdfExport';
import RichTextDisplay from '@/components/shared/RichTextDisplay';
import { runStageChangeAutomations } from '@/utils/automations';
import { format } from 'date-fns';

export default function BusinessDetail() {
  const bizId = window.location.pathname.split('/businesses/')[1]?.split('/')[0];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState(null);

  const { data: businesses = [], isLoading: bizLoading } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: interactions = [] } = useQuery({ queryKey: ['interactions', bizId], queryFn: () => base44.entities.Interaction.filter({ business_id: bizId }, '-interaction_date') });
  const { data: matches = [] } = useQuery({ queryKey: ['matches'], queryFn: () => base44.entities.Match.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), retry: false });

  const biz = businesses.find(b => b.id === bizId);
  const bizMatches = matches.filter(m => m.business_a_id === bizId || m.business_b_id === bizId);

  const updateMut = useMutation({
    mutationFn: (data) => base44.entities.Business.update(bizId, data),
    onSuccess: async (updated) => {
      qc.invalidateQueries({ queryKey: ['businesses'] });
      setEditOpen(false);
      toast.success('Updated');
      // Run stage change automations if stage changed
      const oldStage = biz?.stage;
      const newStage = updated?.stage;
      if (oldStage && newStage && oldStage !== newStage) {
        const autoTasksEnabled = localStorage.getItem('urme_auto_tasks') !== 'false';
        if (autoTasksEnabled) {
          try {
            const promises = runStageChangeAutomations(updated, oldStage, newStage, user?.id, user?.full_name);
            await Promise.all(promises);
            qc.invalidateQueries({ queryKey: ['tasks'] });
            qc.invalidateQueries({ queryKey: ['interactions', bizId] });
            toast.success('Stage updated + task created');
          } catch {}
        }
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => base44.entities.Business.delete(bizId),
    onSuccess: () => { navigate('/businesses'); toast.success('Deleted'); },
  });

  const logMut = useMutation({
    mutationFn: (data) => base44.entities.Interaction.create({ ...data, business_id: bizId, business_name: biz?.name, logged_by_id: user?.id, logged_by_name: user?.full_name }),
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['interactions', bizId] });
      setLogOpen(false);
      toast.success('Interaction logged');
      // Update business health score
      try {
        const allInteractions = await base44.entities.Interaction.filter({ business_id: bizId });
        const count = allInteractions.length;
        const lastDate = format(new Date(), 'yyyy-MM-dd');
        const newScore = computeHealthScore(biz, count, lastDate);
        const nextFU = computeNextFollowUp(biz.stage);
        await base44.entities.Business.update(bizId, {
          health_score: newScore,
          last_interaction_date: lastDate,
          interaction_count: count,
          next_follow_up: nextFU,
        });
        qc.invalidateQueries({ queryKey: ['businesses'] });
      } catch {}
    },
  });

  const getInsight = async () => {
    if (!biz) return;
    setAiLoading(true);
    try {
      const recentInteractionSummaries = interactions
        .slice(0, 5)
        .map(i => `- ${i.type} on ${i.interaction_date ? new Date(i.interaction_date).toLocaleDateString() : 'unknown date'}: ${i.notes || i.title || i.outcome || 'No details'}`)
        .join('\n');

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a senior account strategist for a B2B networking platform.

Analyze this business and return a concise relationship brief that helps the user decide what to do next.

Business: ${biz.name}
Industry: ${biz.industry || 'Unknown'}
Stage: ${biz.stage || 'Unknown'}
Needs: ${biz.needs || 'Not specified'}
Offers: ${biz.offers || 'Not specified'}
Description: ${biz.description || 'Not specified'}
Contact: ${biz.contact_name || 'Not specified'} (${biz.contact_email || 'No email'})
Location: ${[biz.city, biz.state].filter(Boolean).join(', ') || 'Not specified'}
Tags: ${biz.tags?.join(', ') || 'None'}
Recent interactions:
${recentInteractionSummaries || 'No interactions logged yet.'}

Return only useful, actionable output.`,
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            best_next_step: { type: 'string' },
            outreach_draft: { type: 'string' },
            talking_points: { type: 'array', items: { type: 'string' } },
            risks: { type: 'array', items: { type: 'string' } },
          },
        },
      });
      setAiBrief(res);
    } finally {
      setAiLoading(false);
    }
  };

  if (bizLoading) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  if (!biz) return <div className="text-center py-12 text-muted-foreground">Business not found.</div>;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/businesses')}><ArrowLeft className="w-4 h-4" /></Button>
        <span className="text-sm text-muted-foreground">Back to Network</span>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 md:p-6 mb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-display">{biz.name}</h1>
                <StageBadge stage={biz.stage} />
                <HealthScoreBadge score={biz.health_score || 0} size="md" />
              </div>
              <p className="text-sm text-muted-foreground">{biz.industry}</p>
              {biz.description && <p className="text-sm text-muted-foreground mt-1">{biz.description}</p>}
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                {biz.contact_email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {biz.contact_email}</span>}
                {biz.contact_phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {biz.contact_phone}</span>}
                {biz.website && <a href={biz.website} target="_blank" rel="noopener" className="flex items-center gap-1 text-primary"><Globe className="w-3 h-3" /> Website</a>}
                {(biz.city || biz.state) && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {[biz.city, biz.state].filter(Boolean).join(', ')}</span>}
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={getInsight} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><MoreVertical className="w-4 h-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportBusinessPDF(biz, interactions, bizMatches)}>
                  <FileDown className="w-3.5 h-3.5 mr-2" /> Export PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <Edit className="w-3.5 h-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive" onClick={() => { if (confirm('Delete this business?')) deleteMut.mutate(); }}>
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {biz.tags?.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {biz.tags.map(t => <span key={t} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>)}
          </div>
        )}
      </div>

      {aiBrief && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-semibold text-accent uppercase tracking-wider">AI Relationship Brief</h3>
              <p className="text-sm text-foreground/80 mt-1">A focused read on what to do next with this account.</p>
            </div>
            <Button variant="outline" size="sm" onClick={getInsight} disabled={aiLoading} className="gap-1.5">
              {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Regenerate
            </Button>
          </div>

          {aiBrief.summary && <p className="text-sm text-foreground/80 whitespace-pre-wrap">{aiBrief.summary}</p>}

          <div className="grid md:grid-cols-2 gap-3">
            {aiBrief.best_next_step && (
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Best Next Step</p>
                <p className="text-sm">{aiBrief.best_next_step}</p>
              </div>
            )}
            {aiBrief.outreach_draft && (
              <div className="bg-card border border-border rounded-lg p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Outreach Draft</p>
                <p className="text-sm whitespace-pre-wrap">{aiBrief.outreach_draft}</p>
              </div>
            )}
          </div>

          {aiBrief.talking_points?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Talking Points</p>
              <ul className="space-y-2">
                {aiBrief.talking_points.map((point, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 flex-shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiBrief.risks?.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Watchouts</p>
              <ul className="space-y-2">
                {aiBrief.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-foreground/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-2 flex-shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2"><ContactInfoCard biz={biz} /></div>
        <AccountManagerCard name={biz.assigned_to_name} />
      </div>

      <div className="mb-4">
        <EventEngagements bizId={bizId} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Needs</h3>
          <p className="text-sm">{biz.needs || 'Not specified'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Offers</h3>
          <p className="text-sm">{biz.offers || 'Not specified'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Notes</h3>
          {biz.notes ? <RichTextDisplay content={biz.notes} /> : <p className="text-sm text-muted-foreground">No notes</p>}
        </div>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="activity">Activity ({interactions.length})</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="matches">Matches ({bizMatches.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <div className="mb-3">
            <Button size="sm" onClick={() => setLogOpen(true)}><Plus className="w-4 h-4 mr-1" /> Log Interaction</Button>
          </div>
          <InteractionTimeline interactions={interactions} />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsCard bizId={bizId} bizName={biz?.name} />
        </TabsContent>
        <TabsContent value="matches">
          <MatchList matches={bizMatches} currentBizId={bizId} />
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Business</DialogTitle></DialogHeader>
          <BusinessForm initialData={biz} businesses={businesses} users={users} onSubmit={data => updateMut.mutate(data)} saving={updateMut.isPending} />
        </DialogContent>
      </Dialog>

      <Dialog open={logOpen} onOpenChange={setLogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Log Interaction</DialogTitle></DialogHeader>
          <LogInteractionForm users={users} bizId={bizId} bizName={biz?.name} onSubmit={data => logMut.mutate(data)} saving={logMut.isPending} />
        </DialogContent>
      </Dialog>
    </div>
  );
}