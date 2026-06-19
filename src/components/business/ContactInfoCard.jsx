import React from 'react';
import { User, Briefcase, Mail, Phone, Linkedin, Globe, MapPin } from 'lucide-react';

function Row({ icon: Icon, label, value, href }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener" className="text-sm text-primary hover:underline break-all">{value}</a>
        ) : (
          <p className="text-sm break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

export default function ContactInfoCard({ biz }) {
  const hasAny = biz.contact_name || biz.contact_title || biz.contact_email || biz.contact_phone || biz.linkedin || biz.website || biz.address || biz.city || biz.state;
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-4 tracking-wider">Contact Info</h3>
      {hasAny ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <Row icon={User} label="Primary Contact" value={biz.contact_name} />
          <Row icon={Briefcase} label="Title / Role" value={biz.contact_title} />
          <Row icon={Mail} label="Email" value={biz.contact_email} href={biz.contact_email ? `mailto:${biz.contact_email}` : null} />
          <Row icon={Phone} label="Phone" value={biz.contact_phone} href={biz.contact_phone ? `tel:${biz.contact_phone}` : null} />
          <Row icon={Linkedin} label="LinkedIn" value={biz.linkedin ? 'View Profile' : null} href={biz.linkedin} />
          <Row icon={Globe} label="Website" value={biz.website ? 'Visit Site' : null} href={biz.website} />
          <Row icon={MapPin} label="Address" value={[biz.address, [biz.city, biz.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No contact info added yet.</p>
      )}
    </div>
  );
}