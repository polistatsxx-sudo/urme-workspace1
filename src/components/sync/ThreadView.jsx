import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Pin, Building2, Calendar, Send, Archive, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';

const catColors = {
  general: 'bg-muted text-muted-foreground',
  business: 'bg-primary/15 text-primary',
  event: 'bg-purple-500/15 text-purple-400',
  idea: 'bg-yellow-500/15 text-yellow-400',
  announcement: 'bg-destructive/15 text-destructive',
};

function Avatar({ name, size = 'md' }) {
  const initials = (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['bg-primary/20 text-primary', 'bg-purple-500/20 text-purple-400', 'bg-yellow-500/20 text-yellow-500', 'bg-emerald-500/20 text-emerald-400'];
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length];
  const sz = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-xs';
  return <div className={`${sz} ${color} rounded-full flex items-center justify-center font-bold flex-shrink-0`}>{initials}</div>;
}

export default function ThreadView({ disc, user, onBack, onAddReply, onPin, onArchive, isAdmin, saving }) {
  const [replyText, setReplyText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [disc.replies?.length]);

  const handleSend = () => {
    const text = replyText.trim();
    if (!text) return;
    onAddReply(disc.id, text);
    setReplyText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4 pb-4 border-b border-border">
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 mt-0.5" onClick={onBack}>
          <ArrowLeft className="w-4 h-4" />
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {disc.pinned && <Pin className="w-3.5 h-3.5 text-primary" />}
            <h2 className="text-base font-bold leading-tight">{disc.title}</h2>
            <Badge variant="outline" className={`text-[10px] px-1.5 ${catColors[disc.category] || catColors.general}`}>
              {disc.category}
            </Badge>
          </div>

          {/* Linked context */}
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span>Started by <span className="font-medium text-foreground/70">{disc.author_name}</span></span>
            {disc.linked_business_name && (
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {disc.linked_business_name}
              </span>
            )}
            {disc.linked_event_name && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {disc.linked_event_name}
              </span>
            )}
          </div>
        </div>

        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPin(disc)}>
                <Pin className="w-3.5 h-3.5 mr-2" /> {disc.pinned ? 'Unpin Thread' : 'Pin Thread'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchive(disc)} className="text-destructive">
                <Archive className="w-3.5 h-3.5 mr-2" /> Archive Thread
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {/* Opening post */}
        <div className="flex gap-3">
          <Avatar name={disc.author_name} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-sm font-semibold">{disc.author_name}</span>
              <span className="text-[11px] text-muted-foreground">{format(new Date(disc.created_date), 'MMM d, h:mm a')}</span>
              <Badge variant="outline" className="text-[9px] px-1">OP</Badge>
            </div>
            <div className="bg-secondary/40 rounded-xl rounded-tl-sm px-3 py-2.5 text-sm whitespace-pre-wrap">
              {disc.content}
            </div>
          </div>
        </div>

        {/* Replies */}
        {(disc.replies || []).map((r, i) => {
          const isMe = r.author === user?.id;
          return (
            <div key={i} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
              <Avatar name={r.author_name} size="sm" />
              <div className={`flex-1 min-w-0 ${isMe ? 'flex flex-col items-end' : ''}`}>
                <div className={`flex items-baseline gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-xs font-semibold">{isMe ? 'You' : r.author_name}</span>
                  <span className="text-[11px] text-muted-foreground">{format(new Date(r.date), 'MMM d, h:mm a')}</span>
                </div>
                <div className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-secondary/40 rounded-tl-sm'}`}>
                  {r.text}
                </div>
              </div>
            </div>
          );
        })}

        {disc.replies?.length === 0 && (
          <p className="text-center text-xs text-muted-foreground py-4">No replies yet — be the first to respond.</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex gap-2 items-end">
          <Avatar name={user?.full_name} size="sm" />
          <div className="flex-1">
            <Textarea
              placeholder="Reply to thread... (Ctrl+Enter to send)"
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              onKeyDown={handleKey}
              className="bg-secondary/50 resize-none text-sm min-h-[60px] max-h-[120px]"
            />
          </div>
          <Button size="icon" onClick={handleSend} disabled={!replyText.trim() || saving} className="h-9 w-9 flex-shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 ml-10">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}