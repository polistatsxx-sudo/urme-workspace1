import React, { useState } from 'react';
import { Phone, Mail, Users, ArrowRightLeft, Clock, FileText, Calendar, UserPlus, Paperclip, User } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const typeIcons = {
  call: Phone, meeting: Users, email: Mail, referral: UserPlus, intro_made: ArrowRightLeft,
  follow_up: Clock, note: FileText, event: Calendar,
};
const typeColors = {
  call: 'bg-blue-500/15 text-blue-400', meeting: 'bg-purple-500/15 text-purple-400',
  email: 'bg-yellow-500/15 text-yellow-400', referral: 'bg-pink-500/15 text-pink-400',
  intro_made: 'bg-primary/15 text-primary', follow_up: 'bg-orange-500/15 text-orange-400',
  note: 'bg-muted text-muted-foreground', event: 'bg-emerald-500/15 text-emerald-400',
};
const typeLabels = {
  call: 'Phone Call', meeting: 'Meeting', email: 'Email', referral: 'Referral',
  intro_made: 'Introduction', follow_up: 'Follow-up', note: 'Other', event: 'Event',
};

export default function InteractionTimeline({ interactions }) {
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? interactions : interactions.filter(ix => ix.type === filter);
  const types = [...new Set(interactions.map(ix => ix.type))];

  return (
    <div>
      {interactions.length > 0 && (
        <div className="flex items-center gap-2 mb-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40 h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {types.map(t => <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No interactions logged yet</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(ix => {
            const Icon = typeIcons[ix.type] || FileText;
            return (
              <div key={ix.id} className="flex gap-3 bg-card border border-border rounded-xl p-4">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeColors[ix.type] || typeColors.note}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{ix.title || typeLabels[ix.type] || ix.type.replace(/_/g, ' ')}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {ix.interaction_date ? format(new Date(ix.interaction_date), 'MMM d, yyyy · h:mm a') : format(new Date(ix.created_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  {ix.notes && <p className="text-xs text-muted-foreground mt-1">{ix.notes}</p>}
                  {ix.outcome && <p className="text-xs text-primary mt-1">Next: {ix.outcome}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {ix.team_member && <span className="text-[10px] text-muted-foreground flex items-center gap-1"><User className="w-3 h-3" /> {ix.team_member}</span>}
                    {ix.attachment_url && (
                      <a href={ix.attachment_url} target="_blank" rel="noopener" className="text-[10px] text-primary flex items-center gap-1 hover:underline">
                        <Paperclip className="w-3 h-3" /> {ix.attachment_name || 'Attachment'}
                      </a>
                    )}
                    {ix.logged_by_name && <span className="text-[10px] text-muted-foreground">logged by {ix.logged_by_name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}