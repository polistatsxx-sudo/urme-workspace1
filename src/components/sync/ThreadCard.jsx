import React from 'react';
import { MessageSquare, Pin, Building2, Calendar, Lightbulb, Archive } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, formatDistanceToNow } from 'date-fns';

const catColors = {
  general: 'bg-muted text-muted-foreground',
  business: 'bg-primary/15 text-primary',
  event: 'bg-purple-500/15 text-purple-400',
  idea: 'bg-yellow-500/15 text-yellow-400',
  announcement: 'bg-destructive/15 text-destructive',
};

const contextIcon = { business: Building2, event: Calendar, idea: Lightbulb };

export default function ThreadCard({ disc, onOpen, onPin, onArchive, isAdmin }) {
  const lastReply = disc.replies?.length ? disc.replies[disc.replies.length - 1] : null;
  const lastActivity = lastReply ? new Date(lastReply.date) : new Date(disc.created_date);
  const preview = lastReply ? lastReply.text : disc.content;
  const CtxIcon = disc.category && contextIcon[disc.category];
  const contextName = disc.linked_business_id ? disc.linked_event_id ? null : null : null;

  // Determine linked context label
  let contextLabel = null;
  if (disc.linked_business_name) contextLabel = { icon: Building2, label: disc.linked_business_name };
  else if (disc.linked_event_name) contextLabel = { icon: Calendar, label: disc.linked_event_name };

  return (
    <div
      className={`bg-card border rounded-xl p-4 hover:border-primary/30 transition-all cursor-pointer group ${disc.pinned ? 'border-primary/40' : 'border-border'}`}
      onClick={() => onOpen(disc)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title row */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {disc.pinned && <Pin className="w-3 h-3 text-primary flex-shrink-0" />}
            <p className="text-sm font-semibold leading-snug">{disc.title}</p>
            <Badge variant="outline" className={`text-[10px] px-1.5 flex-shrink-0 ${catColors[disc.category] || catColors.general}`}>
              {disc.category}
            </Badge>
          </div>

          {/* Linked context */}
          {contextLabel && (
            <div className="flex items-center gap-1 mb-1.5 text-[11px] text-muted-foreground">
              <contextLabel.icon className="w-3 h-3" />
              <span>{contextLabel.label}</span>
            </div>
          )}

          {/* Preview */}
          <p className="text-xs text-muted-foreground truncate max-w-prose">
            {lastReply ? <><span className="text-foreground/70 font-medium">{lastReply.author_name}:</span> </> : ''}
            {preview}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground/60">{disc.author_name}</span>
            <span>·</span>
            <span>{formatDistanceToNow(lastActivity, { addSuffix: true })}</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {disc.replies?.length || 0}
            </span>
          </div>
        </div>

        {/* Admin actions */}
        {isAdmin && (
          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-primary" title={disc.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(disc)}>
              <Pin className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" title="Archive" onClick={() => onArchive(disc)}>
              <Archive className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}