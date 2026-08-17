import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Paperclip, Loader2, X, UserPlus, AlertTriangle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { findPotentialDuplicates } from '@/utils/duplicateDetection';
import RichTextEditor from '@/components/shared/RichTextEditor';
import { fillMergeFields } from '@/utils/mergeFields';

// Sentinels for the two picker options that are not a Contact row.
const NO_CONTACT = 'none';
const PRIMARY_CONTACT = 'primary';

/**
 * interaction_date is stored as the wall-clock string the datetime picker produced, so it
 * is read back textually. `new Date()` would shift it by the browser's offset and an
 * untouched edit would silently move the interaction.
 */
function toDateTimeLocal(value) {
  const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})/);
  return match ? `${match[1]}T${match[2]}` : '';
}

function buildForm(initialData) {
  return {
    type: initialData?.type || 'meeting',
    title: initialData?.title || '',
    notes: initialData?.notes || '',
    outcome: initialData?.outcome || '',
    team_member: initialData?.team_member || '',
    contact_id: initialData?.contact_id || '',
    contact_name: initialData?.contact_name || '',
    attachment_url: initialData?.attachment_url || '',
    attachment_name: initialData?.attachment_name || '',
    interaction_date: toDateTimeLocal(initialData?.interaction_date) || new Date().toISOString().slice(0, 16),
  };
}

export default function LogInteractionForm({ onSubmit, saving, users = [], bizId, bizName, bizContactName, bizContactTitle, initialData }) {
  const qc = useQueryClient();
  const isEdit = !!initialData;
  const [form, setForm] = useState(() => buildForm(initialData));
  // The picker cannot be driven by form.contact_id alone: the business's own
  // primary contact is not a Contact row, so it has no id to select on. An interaction
  // logged against the primary contact has a name but no id, which is that same case.
  const [contactChoice, setContactChoice] = useState(
    () => initialData?.contact_id || (initialData?.contact_name ? PRIMARY_CONTACT : '')
  );
  const [uploading, setUploading] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newContact, setNewContact] = useState({ full_name: '', title: '', email: '', phone: '' });
  const [creatingContact, setCreatingContact] = useState(false);
  const [contactDuplicates, setContactDuplicates] = useState([]);
  const [contactNameTimer, setContactNameTimer] = useState(null);
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);

  const { data: templates = [] } = useQuery({
    queryKey: ['emailTemplates'],
    queryFn: () => base44.entities.EmailTemplate.list('-updated_date'),
    enabled: !!bizId,
  });

  const checkContactDuplicate = (name) => {
    if (!name || name.length < 3) { setContactDuplicates([]); return; }
    if (contactNameTimer) clearTimeout(contactNameTimer);
    const timer = setTimeout(() => {
      const found = findPotentialDuplicates(name, newContact.email, contacts, 'contact');
      setContactDuplicates(found);
    }, 300);
    setContactNameTimer(timer);
  };

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', bizId],
    queryFn: () => base44.entities.Contact.filter({ business_id: bizId }),
    enabled: !!bizId,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  // businesses.contact_name / contact_title hold the primary contact directly on
  // the business record. It is the contact the user sees on the page, so it has
  // to be selectable here even when the contacts table has no row for it.
  const primaryContactName = (bizContactName || '').trim();
  const primaryContactHasRecord = contacts.some(
    c => (c.full_name || '').trim().toLowerCase() === primaryContactName.toLowerCase()
  );
  const showPrimaryContact = !!primaryContactName && !primaryContactHasRecord;

  const handleContactChange = (value) => {
    setContactChoice(value);
    if (value === PRIMARY_CONTACT) {
      // No contact_id: the primary contact has no Contact row, and inventing a
      // uuid would point at nothing. The adapter turns '' into null on write.
      setForm(p => ({ ...p, contact_id: '', contact_name: primaryContactName }));
      return;
    }
    const contact = contacts.find(c => c.id === value);
    setForm(p => ({ ...p, contact_id: contact?.id || '', contact_name: contact?.full_name || '' }));
  };

  const selectContact = (contact) => {
    setContactChoice(contact.id);
    setForm(p => ({ ...p, contact_id: contact.id, contact_name: contact.full_name }));
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      set('attachment_url', file_url);
      set('attachment_name', file.name);
      toast.success('File attached');
    } catch { toast.error('Upload failed'); } finally { setUploading(false); }
  };

  const handleCreateContact = async () => {
    if (!newContact.full_name.trim()) return;
    setCreatingContact(true);
    try {
      const created = await base44.entities.Contact.create({
        ...newContact,
        business_id: bizId,
        business_name: bizName,
      });
      qc.invalidateQueries({ queryKey: ['contacts', bizId] });
      selectContact(created);
      setShowNewContact(false);
      setNewContact({ full_name: '', title: '', email: '', phone: '' });
      toast.success('Contact created & linked');
    } catch { toast.error('Failed to create contact'); } finally { setCreatingContact(false); }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  // Applying a template to the notes is the only place a template is actually used, so
  // it is the only place the "Used Nx" count on the Templates page may grow. Opening the
  // list or previewing does not count. The count is a nicety: if the write fails the
  // applied template still stands.
  const applyTemplate = async (template) => {
    const filled = fillMergeFields(template.body || '', { business_name: bizName, contact_name: form.contact_name });
    set('notes', filled);
    setShowTemplateSheet(false);
    toast.success('Template applied');
    try {
      await base44.entities.EmailTemplate.update(template.id, { use_count: (template.use_count || 0) + 1 });
      qc.invalidateQueries({ queryKey: ['emailTemplates'] });
    } catch {
      // Leave the count alone rather than interrupt the interaction being logged.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs">Type</Label>
          <Select value={form.type} onValueChange={v => set('type', v)}>
            <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="call">Phone Call</SelectItem>
              <SelectItem value="referral">Referral</SelectItem>
              <SelectItem value="event">Event</SelectItem>
              <SelectItem value="follow_up">Follow-up</SelectItem>
              <SelectItem value="intro_made">Introduction</SelectItem>
              <SelectItem value="note">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Date & Time</Label>
          <Input type="datetime-local" value={form.interaction_date} onChange={e => set('interaction_date', e.target.value)} className="bg-secondary/50 mt-1" />
        </div>
      </div>

      {/* Contact picker */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Contact Person</Label>
          <button type="button" onClick={() => setShowNewContact(v => !v)} className="text-[10px] text-primary flex items-center gap-1 hover:underline">
            <UserPlus className="w-3 h-3" /> Add new contact
          </button>
        </div>
        <Select value={contactChoice} onValueChange={handleContactChange}>
          <SelectTrigger className="bg-secondary/50"><SelectValue placeholder="Select a contact…" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_CONTACT}>No contact</SelectItem>
            {showPrimaryContact && (
              <SelectItem value={PRIMARY_CONTACT}>
                {primaryContactName}{bizContactTitle ? ` · ${bizContactTitle}` : ''} (primary contact)
              </SelectItem>
            )}
            {contacts.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.full_name}{c.title ? ` · ${c.title}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showNewContact && (
          <div className="mt-2 p-3 bg-secondary/30 rounded-lg border border-border space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase">New Contact</p>
            <Input placeholder="Full name *" value={newContact.full_name} onChange={e => { setNewContact(p => ({ ...p, full_name: e.target.value })); checkContactDuplicate(e.target.value); }} className="bg-secondary/50 h-8 text-sm" />
            {contactDuplicates.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 space-y-1">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-400 flex-shrink-0" />
                  <p className="text-[10px] text-amber-400 font-semibold">Possible duplicate contact</p>
                </div>
                {contactDuplicates.map((dup, i) => (
                  <button key={i} type="button" onClick={() => { selectContact(dup.entry); setShowNewContact(false); setNewContact({ full_name: '', title: '', email: '', phone: '' }); setContactDuplicates([]); }}
                    className="w-full text-left text-xs bg-amber-500/5 rounded px-2 py-1.5 hover:bg-amber-500/10 transition-colors">
                    <span className="font-medium">{dup.entry.full_name}</span>
                    <span className="text-[10px] text-muted-foreground ml-1">({dup.matchReason}) — Tap to use existing</span>
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Title / Role" value={newContact.title} onChange={e => setNewContact(p => ({ ...p, title: e.target.value }))} className="bg-secondary/50 h-8 text-sm" />
              <Input placeholder="Email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} className="bg-secondary/50 h-8 text-sm" />
            </div>
            <Input placeholder="Phone" value={newContact.phone} onChange={e => setNewContact(p => ({ ...p, phone: e.target.value }))} className="bg-secondary/50 h-8 text-sm" />
            <Button type="button" size="sm" className="w-full h-7 text-xs" onClick={handleCreateContact} disabled={creatingContact || !newContact.full_name.trim()}>
              {creatingContact ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create & Link Contact'}
            </Button>
          </div>
        )}
      </div>

      <div>
        <Label className="text-xs">Title</Label>
        <Input value={form.title} onChange={e => set('title', e.target.value)} className="bg-secondary/50 mt-1" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label className="text-xs">Notes / Details</Label>
          <button type="button" onClick={() => setShowTemplateSheet(true)} className="text-[10px] text-primary flex items-center gap-1 hover:underline">
            <FileText className="w-3 h-3" /> Use Template
          </button>
        </div>
        <RichTextEditor value={form.notes} onChange={v => set('notes', v)} placeholder="Meeting notes, key points, outcomes..." minHeight={100} />
      </div>
      {showTemplateSheet && (
        <div className="bg-secondary/30 border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Select Template</p>
            <button type="button" onClick={() => setShowTemplateSheet(false)} className="text-xs text-muted-foreground">Close</button>
          </div>
          {templates.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-2">No templates yet</p>
          ) : (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="w-full text-left text-xs bg-card border border-border rounded-md px-2 py-1.5 hover:border-primary/30 active:scale-95 transition-all"
                >
                  <span className="font-medium">{t.title}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{t.category?.replace(/_/g, ' ')}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div>
        <Label className="text-xs">Linked Team Member</Label>
        <Select value={form.team_member} onValueChange={v => set('team_member', v)}>
          <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue placeholder="Select team member..." /></SelectTrigger>
          <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.full_name}>{u.full_name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label className="text-xs">Outcome / Next Steps</Label>
        <Input value={form.outcome} onChange={e => set('outcome', e.target.value)} placeholder="What happened next?" className="bg-secondary/50 mt-1" />
      </div>
      <div>
        <Label className="text-xs">Attachment (optional)</Label>
        {form.attachment_url ? (
          <div className="flex items-center gap-2 mt-1 text-xs bg-secondary/50 rounded-md px-3 py-2">
            <Paperclip className="w-3 h-3 text-primary" />
            <span className="truncate flex-1">{form.attachment_name}</span>
            <button type="button" onClick={() => { set('attachment_url', ''); set('attachment_name', ''); }}><X className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
          </div>
        ) : (
          <label className="flex items-center gap-2 mt-1 text-xs bg-secondary/50 rounded-md px-3 py-2 cursor-pointer hover:bg-secondary">
            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Paperclip className="w-3 h-3" />}
            <span className="text-muted-foreground">{uploading ? 'Uploading...' : 'Attach a file'}</span>
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>
      <Button type="submit" disabled={saving || uploading} className="w-full">
        {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Log Interaction'}
      </Button>
    </form>
  );
}