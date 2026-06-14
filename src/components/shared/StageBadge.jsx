import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const stageConfig = {
  new_lead: { label: 'New Lead', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  contacted: { label: 'Contacted', cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  meeting_scheduled: { label: 'Meeting', cls: 'bg-orange-500/15 text-orange-400 border-orange-500/20' },
  in_discussion: { label: 'Discussion', cls: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  collaborating: { label: 'Collaborating', cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
  partnered: { label: 'Partnered', cls: 'bg-primary/15 text-primary border-primary/20' },
  archived: { label: 'Archived', cls: 'bg-muted text-muted-foreground border-border' },
};

export default function StageBadge({ stage }) {
  const config = stageConfig[stage] || stageConfig.new_lead;
  return (
    <Badge variant="outline" className={cn("text-[10px] font-semibold border", config.cls)}>
      {config.label}
    </Badge>
  );
}