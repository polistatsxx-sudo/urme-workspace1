import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Clock, Edit, Trash2, ExternalLink, Building2, User, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { getGoogleCalendarUrl } from '@/utils/calendar';
import PaymentButton from '@/components/shared/PaymentButton';

const statusColors = {
  planning: 'bg-blue-500/15 text-blue-400', confirmed: 'bg-emerald-500/15 text-emerald-400',
  in_progress: 'bg-primary/15 text-primary', completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};

/**
 * @param {{
 *   ev: any,
 *   businesses?: any[],
 *   users?: any[],
 *   onEdit: (ev: any) => void,
 *   onDelete: (id: string) => void,
 * }} props
 */
export default function EventCard({ ev, businesses = [], users = [], onEdit, onDelete }) {
  const navigate = useNavigate();
  const [showBiz, setShowBiz] = useState(false);
  const attendingBiz = businesses.filter(b => ev.attendee_business_ids?.includes(b.id));

  return (
    <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-semibold">{ev.name}</p>
            <Badge variant="outline" className={`text-[10px] ${statusColors[ev.status]}`}>{ev.status?.replace(/_/g, ' ')}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">{ev.description}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-muted-foreground">
            {ev.date && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(ev.date), 'MMM d, yyyy')}</span>}
            {ev.time && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.time}</span>}
            {ev.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>}
            {ev.event_type && <span className="capitalize">{ev.event_type}</span>}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={`Edit ${ev.name}`} onClick={() => onEdit(ev)}><Edit className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={`Delete ${ev.name}`} onClick={() => onDelete(ev.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      </div>
      {ev.objectives && <p className="text-xs text-muted-foreground mt-2 border-t border-border/50 pt-2"><span className="font-semibold text-foreground/70">Objectives:</span> {ev.objectives}</p>}
      {ev.post_event_notes && <p className="text-xs text-primary mt-1"><span className="font-semibold">Post-Event:</span> {ev.post_event_notes}</p>}

      {/* Collect Event Fee */}
      {attendingBiz.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <PaymentButton label="Collect Event Fee" />
        </div>
      )}

      {/* Participating Businesses */}
      {attendingBiz.length > 0 && (
        <div className="mt-3 border-t border-border/50 pt-3">
          <button onClick={() => setShowBiz(v => !v)} className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
            <Building2 className="w-3 h-3" />
            <span>{attendingBiz.length} participating {attendingBiz.length === 1 ? 'business' : 'businesses'}</span>
            {showBiz ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          {showBiz && (
            <div className="mt-2 space-y-1.5">
              {attendingBiz.map(b => {
                const manager = b.assigned_to ? users.find(u => u.id === b.assigned_to) : null;
                return (
                  <button key={b.id} onClick={() => navigate(`/businesses/${b.id}`)}
                    className="w-full flex items-center gap-2 bg-secondary/40 hover:bg-secondary/70 rounded-lg px-2.5 py-1.5 text-left transition-colors group">
                    <Building2 className="w-3 h-3 text-primary flex-shrink-0" />
                    <span className="text-xs font-medium flex-1 truncate">{b.name}</span>
                    {manager && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground flex-shrink-0">
                        <User className="w-2.5 h-2.5" /> {manager.full_name}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      <a href={getGoogleCalendarUrl(ev)} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
        <ExternalLink className="w-3 h-3" /> Add to Google Calendar
      </a>
    </div>
  );
}
