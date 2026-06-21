import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Plus, Phone, Mail, Globe, MapPin, Building2, Sparkles, Loader2, FileDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/shared/PageHeader';
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
import { format } from 'date-fns';

export default function BusinessDetail() {
  const bizId = window.location.pathname.split('/businesses/')[1]?.split('/')[0];
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [insight, setInsight] = useState('');

  const { data: businesses = [], isLoading: bizLoading } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: interactions = [] } = useQuery({ queryKey: ['interactions', bizId], queryFn: () => base44.entities.Interaction.filter({ business_id: bizId }, '-interaction_date') });
  const { data: matches = [] } = useQuery({ queryKey: ['matches'], queryFn: () => base44.entities.Match.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list(), retry: false });

  const biz = businesses.find(b => b.id === bizId);
  const bizMatches = matches.filter(m => m.business_a_id === bizId || m.business_b_id === bizId);

  const updateMut = useMutation({
    mutationFn: (data) => base44.entities.Business.update(bizId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['businesses'] }); setEditOpen(false); toast.success('Updated'); },
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
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Give a brief strategic insight for this business in a B2B networking context. Business: ${biz.name}, Industry: ${biz.industry}, Needs: ${biz.needs}, Offers: ${biz.offers}. Give 3-4 actionable networking suggestions in 2-3 sentences each.`,
    });
    setInsight(res);
    setAiLoading(false);
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

      {insight && (
        <div className="bg-accent/10 border border-accent/20 rounded-xl p-4 mb-4">
          <h3 className="text-xs font-semibold text-accent mb-2">AI Insight</h3>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{insight}</p>
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
          <p className="text-sm">{biz.notes || 'No notes'}</p>
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