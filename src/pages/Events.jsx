import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { useAuth } from '@/lib/AuthContext';
import { classifyEvent, compareEventsByStart, formatEventDate } from '@/utils/calendar';
import { exportToCSV } from '@/utils/csvExport';
import EventCard from '@/components/event/EventCard';
import EventForm from '@/components/event/EventForm';

export default function Events() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [editEvent, setEditEvent] = useState(/** @type {any} */ (null));

  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list('-date') });
  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  // An event is upcoming until the end of the day it names — see classifyEvent. Events with
  // no readable date are their own group inside the Upcoming tab rather than being dropped
  // from both tabs.
  const upcoming = events.filter(e => classifyEvent(e) === 'upcoming').sort(compareEventsByStart);
  const past = events.filter(e => classifyEvent(e) === 'past');
  const undated = events.filter(e => classifyEvent(e) === 'undated');

  const createMut = useMutation({
    /** @param {any} d */
    mutationFn: (d) => base44.entities.Event.create({ ...d, organizer_name: user?.full_name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setShowAdd(false); toast.success('Event created!'); },
  });

  const updateMut = useMutation({
    /** @param {{ id: string, data: any }} variables */
    mutationFn: ({ id, data }) => base44.entities.Event.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); setEditEvent(null); toast.success('Updated'); },
  });

  const deleteMut = useMutation({
    /** @param {string} id */
    mutationFn: (id) => base44.entities.Event.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['events'] }); toast.success('Deleted'); },
  });

  const confirmDelete = (id) => { if (confirm('Delete?')) deleteMut.mutate(id); };

  const renderCards = (list, emptyText) => (
    <div className="space-y-3">
      {list.map(ev => (
        <EventCard key={ev.id} ev={ev} businesses={businesses} users={users} onEdit={setEditEvent} onDelete={confirmDelete} />
      ))}
      {list.length === 0 && emptyText && <p className="text-center text-muted-foreground text-sm py-12">{emptyText}</p>}
    </div>
  );

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Event Orchestrator"
        subtitle={`${upcoming.length + undated.length} upcoming • ${past.length} past`}
        actions={
          <>
          <Button variant="outline" size="sm" onClick={() => exportToCSV(events.map(e => ({ ...e, date: formatEventDate(e, 'yyyy-MM-dd') })), 'events_export.csv', [
            { key: 'name', header: 'Name' },
            { key: 'date', header: 'Date' },
            { key: 'location', header: 'Location' },
            { key: 'status', header: 'Status' },
            { key: 'event_type', header: 'Type' },
            { key: 'attendee_count', header: 'Attendees' },
          ])} className="gap-1"><Download className="w-4 h-4" /><span className="hidden lg:inline">Export CSV</span></Button>
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Event</Button></DialogTrigger>
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
              <EventForm
                businesses={businesses}
                onSubmit={data => createMut.mutate(data)}
                saving={createMut.isPending}
              />
            </DialogContent>
          </Dialog>
          </>
        }
      />

      <Tabs defaultValue="upcoming">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length + undated.length})</TabsTrigger>
          <TabsTrigger value="past">Archived ({past.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          {undated.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Date TBD ({undated.length})</p>
              {renderCards(undated, null)}
            </div>
          )}
          {renderCards(upcoming, undated.length > 0 ? null : 'No upcoming events')}
        </TabsContent>
        <TabsContent value="past">{renderCards(past, 'No archived events')}</TabsContent>
      </Tabs>

      <Dialog open={!!editEvent} onOpenChange={v => { if (!v) setEditEvent(null); }}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit Event</DialogTitle></DialogHeader>
          {editEvent && (
            <EventForm
              initialData={editEvent}
              businesses={businesses}
              isEdit
              onSubmit={data => updateMut.mutate({ id: editEvent.id, data })}
              saving={updateMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
