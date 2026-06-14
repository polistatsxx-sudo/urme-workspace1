import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ThumbsUp, MessageSquare, Sparkles, Loader2, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';

const categoryColors = {
  strategy: 'bg-blue-500/15 text-blue-400', partnership: 'bg-primary/15 text-primary',
  event_concept: 'bg-purple-500/15 text-purple-400', marketing: 'bg-orange-500/15 text-orange-400',
  product: 'bg-emerald-500/15 text-emerald-400', other: 'bg-muted text-muted-foreground',
};

export default function Ideas() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'other' });
  const [commentText, setCommentText] = useState({});
  const [expandedIdea, setExpandedIdea] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const { data: ideas = [] } = useQuery({ queryKey: ['ideas'], queryFn: () => base44.entities.Idea.list('-votes') });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Idea.create({ ...d, author_name: user?.full_name, votes: 0, voted_by: [], comments: [], status: 'new' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ideas'] }); setShowAdd(false); setForm({ title: '', description: '', category: 'other' }); toast.success('Idea posted!'); },
  });

  const vote = async (idea) => {
    const alreadyVoted = idea.voted_by?.includes(user?.id);
    await base44.entities.Idea.update(idea.id, {
      votes: alreadyVoted ? Math.max(0, (idea.votes || 0) - 1) : (idea.votes || 0) + 1,
      voted_by: alreadyVoted ? (idea.voted_by || []).filter(id => id !== user?.id) : [...(idea.voted_by || []), user?.id],
    });
    qc.invalidateQueries({ queryKey: ['ideas'] });
  };

  const addComment = async (ideaId) => {
    const text = commentText[ideaId]?.trim();
    if (!text) return;
    const idea = ideas.find(i => i.id === ideaId);
    await base44.entities.Idea.update(ideaId, {
      comments: [...(idea.comments || []), { author: user?.id, author_name: user?.full_name, text, date: new Date().toISOString() }]
    });
    setCommentText(p => ({ ...p, [ideaId]: '' }));
    qc.invalidateQueries({ queryKey: ['ideas'] });
  };

  const aiImprove = async (idea) => {
    setAiLoading(true);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `You're a B2B networking strategist. This idea was proposed: "${idea.title}" — ${idea.description || 'no details'}. Category: ${idea.category}. Suggest 2-3 concrete improvements or ways to strengthen this idea for a business matchmaking company. Be specific and actionable, keep it brief.`,
    });
    await base44.entities.Idea.update(idea.id, {
      comments: [...(idea.comments || []), { author: 'ai', author_name: 'AI Assistant', text: res, date: new Date().toISOString() }]
    });
    qc.invalidateQueries({ queryKey: ['ideas'] });
    setAiLoading(false);
    toast.success('AI suggestions added');
  };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Idea Incubator"
        subtitle={`${ideas.length} ideas shared`}
        actions={
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Idea</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Share an Idea</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
                <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required className="bg-secondary/50 mt-1" /></div>
                <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="bg-secondary/50 mt-1 h-24 resize-none" /></div>
                <div><Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
                    <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strategy">Strategy</SelectItem><SelectItem value="partnership">Partnership</SelectItem>
                      <SelectItem value="event_concept">Event Concept</SelectItem><SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="product">Product</SelectItem><SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createMut.isPending || !form.title.trim()} className="w-full">{createMut.isPending ? 'Posting...' : 'Post Idea'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {ideas.map(idea => (
          <div key={idea.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-start gap-3">
              <button onClick={() => vote(idea)} className="flex flex-col items-center gap-0.5 mt-0.5">
                <ThumbsUp className={`w-4 h-4 ${idea.voted_by?.includes(user?.id) ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
                <span className="text-xs font-bold">{idea.votes || 0}</span>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold">{idea.title}</p>
                    {idea.description && <p className="text-xs text-muted-foreground mt-1">{idea.description}</p>}
                  </div>
                  <Badge variant="outline" className={`text-[10px] flex-shrink-0 ${categoryColors[idea.category] || categoryColors.other}`}>
                    {idea.category?.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>{idea.author_name}</span>
                  <span>{format(new Date(idea.created_date), 'MMM d')}</span>
                  <button onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)} className="flex items-center gap-1 hover:text-foreground">
                    <MessageSquare className="w-3 h-3" /> {idea.comments?.length || 0}
                  </button>
                  <button onClick={() => aiImprove(idea)} disabled={aiLoading} className="flex items-center gap-1 hover:text-primary">
                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Improve
                  </button>
                </div>
                {expandedIdea === idea.id && (
                  <div className="mt-3 border-t border-border/50 pt-3 space-y-2">
                    {(idea.comments || []).map((c, i) => (
                      <div key={i} className={`text-xs p-2 rounded-lg ${c.author === 'ai' ? 'bg-accent/10 border border-accent/20' : 'bg-secondary/50'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{c.author_name}</span>
                          <span className="text-muted-foreground">{format(new Date(c.date), 'MMM d')}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{c.text}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a comment..."
                        value={commentText[idea.id] || ''}
                        onChange={e => setCommentText(p => ({ ...p, [idea.id]: e.target.value }))}
                        className="bg-secondary/50 text-xs h-8"
                        onKeyDown={e => e.key === 'Enter' && addComment(idea.id)}
                      />
                      <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={() => addComment(idea.id)}>Send</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {ideas.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No ideas yet — be the first!</p>}
      </div>
    </div>
  );
}