import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pin, MessageSquare, Send } from 'lucide-react';
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

const catColors = {
  general: 'bg-muted text-muted-foreground', business: 'bg-primary/15 text-primary',
  event: 'bg-purple-500/15 text-purple-400', idea: 'bg-chart-3/15 text-chart-3',
  announcement: 'bg-destructive/15 text-destructive',
};

export default function SyncHub() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'general' });
  const [replyText, setReplyText] = useState({});
  const [expanded, setExpanded] = useState(null);

  const { data: discussions = [] } = useQuery({ queryKey: ['discussions'], queryFn: () => base44.entities.Discussion.list('-created_date') });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Discussion.create({ ...d, author_name: user?.full_name, replies: [], pinned: false }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discussions'] }); setShowAdd(false); setForm({ title: '', content: '', category: 'general' }); toast.success('Thread posted!'); },
  });

  const addReply = async (discId) => {
    const text = replyText[discId]?.trim();
    if (!text) return;
    const disc = discussions.find(d => d.id === discId);
    await base44.entities.Discussion.update(discId, {
      replies: [...(disc.replies || []), { author: user?.id, author_name: user?.full_name, text, date: new Date().toISOString() }]
    });
    setReplyText(p => ({ ...p, [discId]: '' }));
    qc.invalidateQueries({ queryKey: ['discussions'] });
  };

  const togglePin = async (disc) => {
    await base44.entities.Discussion.update(disc.id, { pinned: !disc.pinned });
    qc.invalidateQueries({ queryKey: ['discussions'] });
  };

  const sorted = [...discussions].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Sync Hub"
        subtitle="Team communication center"
        actions={
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Thread</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Discussion</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
                <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required className="bg-secondary/50 mt-1" /></div>
                <div><Label className="text-xs">Content *</Label><Textarea value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} required className="bg-secondary/50 mt-1 h-24 resize-none" /></div>
                <div><Label className="text-xs">Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({...p, category: v}))}>
                    <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem><SelectItem value="business">Business</SelectItem>
                      <SelectItem value="event">Event</SelectItem><SelectItem value="idea">Idea</SelectItem>
                      <SelectItem value="announcement">Announcement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={createMut.isPending} className="w-full">{createMut.isPending ? 'Posting...' : 'Post Thread'}</Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="space-y-3">
        {sorted.map(disc => (
          <div key={disc.id} className={`bg-card border rounded-xl p-4 transition-colors ${disc.pinned ? 'border-primary/30' : 'border-border hover:border-primary/20'}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  {disc.pinned && <Pin className="w-3 h-3 text-primary" />}
                  <p className="text-sm font-semibold">{disc.title}</p>
                  <Badge variant="outline" className={`text-[10px] ${catColors[disc.category]}`}>{disc.category}</Badge>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{disc.content}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                  <span>{disc.author_name}</span>
                  <span>{format(new Date(disc.created_date), 'MMM d')}</span>
                  <button onClick={() => setExpanded(expanded === disc.id ? null : disc.id)} className="flex items-center gap-1 hover:text-foreground">
                    <MessageSquare className="w-3 h-3" /> {disc.replies?.length || 0} replies
                  </button>
                  {user?.role === 'admin' && (
                    <button onClick={() => togglePin(disc)} className="hover:text-primary">
                      {disc.pinned ? 'Unpin' : 'Pin'}
                    </button>
                  )}
                </div>

                {expanded === disc.id && (
                  <div className="mt-3 border-t border-border/50 pt-3 space-y-2">
                    {(disc.replies || []).map((r, i) => (
                      <div key={i} className="bg-secondary/50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{r.author_name}</span>
                          <span className="text-muted-foreground">{format(new Date(r.date), 'MMM d, h:mm a')}</span>
                        </div>
                        <p className="whitespace-pre-wrap">{r.text}</p>
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Reply..."
                        value={replyText[disc.id] || ''}
                        onChange={e => setReplyText(p => ({ ...p, [disc.id]: e.target.value }))}
                        className="bg-secondary/50 text-xs h-8"
                        onKeyDown={e => e.key === 'Enter' && addReply(disc.id)}
                      />
                      <Button size="icon" variant="secondary" className="h-8 w-8" onClick={() => addReply(disc.id)}>
                        <Send className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {discussions.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">Start the conversation</p>}
      </div>
    </div>
  );
}