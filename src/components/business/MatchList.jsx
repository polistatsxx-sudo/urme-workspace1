import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const statusColors = {
  suggested: 'bg-blue-500/15 text-blue-400', intro_proposed: 'bg-yellow-500/15 text-yellow-400',
  introduced: 'bg-purple-500/15 text-purple-400', collaborating: 'bg-emerald-500/15 text-emerald-400',
  dismissed: 'bg-muted text-muted-foreground',
};

export default function MatchList({ matches, currentBizId }) {
  const qc = useQueryClient();

  const updateStatus = async (matchId, status) => {
    await base44.entities.Match.update(matchId, { status });
    qc.invalidateQueries({ queryKey: ['matches'] });
    toast.success('Match status updated');
  };

  if (!matches.length) return <p className="text-sm text-muted-foreground text-center py-8">No matches found for this business</p>;

  return (
    <div className="space-y-2">
      {matches.map(m => {
        const otherName = m.business_a_id === currentBizId ? m.business_b_name : m.business_a_name;
        const otherId = m.business_a_id === currentBizId ? m.business_b_id : m.business_a_id;
        return (
          <div key={m.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-primary flex-shrink-0" />
                  <Link to={`/businesses/${otherId}`} className="text-sm font-semibold hover:text-primary transition-colors">{otherName}</Link>
                  <Badge variant="outline" className={`text-[10px] ${statusColors[m.status]}`}>{m.status?.replace(/_/g, ' ')}</Badge>
                </div>
                {m.reason && <p className="text-xs text-muted-foreground mt-1">{m.reason}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-lg font-bold text-primary">{m.synergy_score}%</span>
              </div>
            </div>
            {m.status === 'suggested' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" className="text-xs" onClick={() => updateStatus(m.id, 'intro_proposed')}>Propose Intro</Button>
                <Button size="sm" variant="ghost" className="text-xs text-muted-foreground" onClick={() => updateStatus(m.id, 'dismissed')}>Dismiss</Button>
              </div>
            )}
            {m.status === 'intro_proposed' && (
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="text-xs" onClick={() => updateStatus(m.id, 'introduced')}>Mark Introduced</Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}