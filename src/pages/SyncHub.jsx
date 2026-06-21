import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MessageSquare, Pin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import ThreadCard from '@/components/sync/ThreadCard';
import ThreadView from '@/components/sync/ThreadView';
import NewThreadDialog from '@/components/sync/NewThreadDialog';

export default function SyncHub() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [activeThread, setActiveThread] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: discussions = [] } = useQuery({
    queryKey: ['discussions'],
    queryFn: () => base44.entities.Discussion.list('-created_date'),
  });
  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list() });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Discussion.create({
      ...d, author_name: user?.full_name, replies: [], pinned: false,
    }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['discussions'] });
      setShowAdd(false);
      toast.success('Thread posted!');
      setActiveThread(created);
    },
  });

  const replyMut = useMutation({
    mutationFn: ({ discId, text }) => {
      const disc = discussions.find(d => d.id === discId);
      return base44.entities.Discussion.update(discId, {
        replies: [...(disc?.replies || []), {
          author: user?.id,
          author_name: user?.full_name,
          text,
          date: new Date().toISOString(),
        }],
      });
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['discussions'] });
      // keep thread view in sync with fresh data
      setActiveThread(updated);
    },
  });

  const pinMut = useMutation({
    mutationFn: (disc) => base44.entities.Discussion.update(disc.id, { pinned: !disc.pinned }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['discussions'] }); toast.success('Updated'); },
  });

  const archiveMut = useMutation({
    mutationFn: (disc) => base44.entities.Discussion.update(disc.id, { category: 'archived' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussions'] });
      setActiveThread(null);
      toast.success('Thread archived');
    },
  });

  const isAdmin = user?.role === 'admin';

  const categories = ['all', 'general', 'business', 'event', 'idea', 'announcement'];

  const filtered = discussions
    .filter(d => d.category !== 'archived')
    .filter(d => categoryFilter === 'all' || d.category === categoryFilter)
    .filter(d => !search || d.title.toLowerCase().includes(search.toLowerCase()) || d.content?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  const archived = discussions.filter(d => d.category === 'archived');

  // Sync activeThread with fresh data from server
  const liveThread = activeThread ? discussions.find(d => d.id === activeThread.id) || activeThread : null;

  return (
    <div className="animate-slide-up">
      {liveThread ? (
        // ── Thread View ──────────────────────────────────────────
        <div>
          <ThreadView
            disc={liveThread}
            user={user}
            onBack={() => setActiveThread(null)}
            onAddReply={(discId, text) => replyMut.mutate({ discId, text })}
            onPin={pinMut.mutate}
            onArchive={(disc) => { archiveMut.mutate(disc); }}
            isAdmin={isAdmin}
            saving={replyMut.isPending}
          />
        </div>
      ) : (
        // ── Thread List View ─────────────────────────────────────
        <>
          <PageHeader
            title="Sync Hub"
            subtitle="Team threads and coordination"
            actions={
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus className="w-4 h-4 mr-1" /> New Thread
              </Button>
            }
          />

          {/* Search + filter */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <Input
              placeholder="Search threads..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-secondary/50 sm:max-w-xs"
            />
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${
                    categoryFilter === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Threads */}
          <div className="space-y-2">
            {filtered.map(disc => (
              <ThreadCard
                key={disc.id}
                disc={disc}
                onOpen={setActiveThread}
                onPin={pinMut.mutate}
                onArchive={archiveMut.mutate}
                isAdmin={isAdmin}
              />
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground font-medium">No threads yet</p>
                <p className="text-xs text-muted-foreground mt-1">Start a conversation for your team</p>
                <Button size="sm" className="mt-4" onClick={() => setShowAdd(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> New Thread
                </Button>
              </div>
            )}
          </div>

          {/* Archived section */}
          {isAdmin && archived.length > 0 && (
            <details className="mt-8">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none">
                {archived.length} archived thread{archived.length !== 1 ? 's' : ''}
              </summary>
              <div className="space-y-2 mt-2 opacity-60">
                {archived.map(disc => (
                  <ThreadCard key={disc.id} disc={{ ...disc, category: 'general' }} onOpen={setActiveThread} onPin={pinMut.mutate} onArchive={archiveMut.mutate} isAdmin={isAdmin} />
                ))}
              </div>
            </details>
          )}
        </>
      )}

      <NewThreadDialog
        open={showAdd}
        onOpenChange={setShowAdd}
        onSubmit={createMut.mutate}
        saving={createMut.isPending}
        businesses={businesses}
        events={events}
      />
    </div>
  );
}