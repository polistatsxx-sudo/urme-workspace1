import React from 'react';
import { Phone, Mail, Users, ArrowRightLeft, Clock, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const typeIcons = {
  call: Phone, meeting: Users, email: Mail, intro_made: ArrowRightLeft,
  follow_up: Clock, note: FileText, event: Calendar,
};
const typeColors = {
  call: 'bg-blue-500/15 text-blue-400', meeting: 'bg-purple-500/15 text-purple-400',
  email: 'bg-yellow-500/15 text-yellow-400', intro_made: 'bg-primary/15 text-primary',
  follow_up: 'bg-orange-500/15 text-orange-400', note: 'bg-muted text-muted-foreground',
  event: 'bg-emerald-500/15 text-emerald-400',
};

export default function InteractionTimeline({ interactions }) {
  if (!interactions.length) return <p className="text-sm text-muted-foreground text-center py-8">No interactions logged yet</p>;

  return (
    <div className="space-y-3">
      {interactions.map(ix => {
        const Icon = typeIcons[ix.type] || FileText;
        return (
          <div key={ix.id} className="flex gap-3 bg-card border border-border rounded-xl p-4">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[ix.type] || typeColors.note}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{ix.title || ix.type.replace(/_/g, ' ')}</p>
                <span className="text-[10px] text-muted-foreground">
                  {ix.interaction_date ? format(new Date(ix.interaction_date), 'MMM d, yyyy') : format(new Date(ix.created_date), 'MMM d, yyyy')}
                </span>
              </div>
              {ix.notes && <p className="text-xs text-muted-foreground mt-1">{ix.notes}</p>}
              {ix.outcome && <p className="text-xs text-primary mt-1">Outcome: {ix.outcome}</p>}
              {ix.logged_by_name && <p className="text-[10px] text-muted-foreground mt-1">by {ix.logged_by_name}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}