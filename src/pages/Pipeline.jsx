import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Link } from 'react-router-dom';
import { Building2, User, FileDown } from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import StageBadge from '@/components/shared/StageBadge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { computeHealthScore, getHealthDotColor } from '@/utils/healthScore';
import { exportPipelineReportPDF } from '@/utils/pdfExport';
import { runStageChangeAutomations } from '@/utils/automations';
import { useAuth } from '@/lib/AuthContext';

const stages = [
  { id: 'new_lead', label: 'New Lead', color: 'border-blue-500/40' },
  { id: 'contacted', label: 'Contacted', color: 'border-yellow-500/40' },
  { id: 'meeting_scheduled', label: 'Meeting Scheduled', color: 'border-orange-500/40' },
  { id: 'in_discussion', label: 'In Discussion', color: 'border-purple-500/40' },
  { id: 'collaborating', label: 'Collaborating', color: 'border-emerald-500/40' },
  { id: 'partnered', label: 'Partnered', color: 'border-primary/40' },
];

export default function Pipeline() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Business.update(id, data),
    onSuccess: async (updated) => {
      qc.invalidateQueries({ queryKey: ['businesses'] });
      toast.success('Stage updated');
      // Run stage change automations
      const oldStage = businesses.find(b => b.id === updated.id)?.stage;
      const newStage = updated.stage;
      if (oldStage && newStage && oldStage !== newStage) {
        const autoTasksEnabled = localStorage.getItem('urme_auto_tasks') !== 'false';
        if (autoTasksEnabled) {
          try {
            const promises = runStageChangeAutomations(updated, oldStage, newStage, user?.id, user?.full_name);
            await Promise.all(promises);
            qc.invalidateQueries({ queryKey: ['tasks'] });
            qc.invalidateQueries({ queryKey: ['interactions'] });
            toast.success('Stage updated + task created');
          } catch {}
        }
      }
    },
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const bizId = result.draggableId;
    const newStage = result.destination.droppableId;
    const biz = businesses.find(b => b.id === bizId);
    if (biz && biz.stage !== newStage) {
      updateMut.mutate({ id: bizId, data: { stage: newStage } });
    }
  };

  const grouped = {};
  stages.forEach(s => { grouped[s.id] = businesses.filter(b => b.stage === s.id); });

  return (
    <div className="animate-slide-up">
      <PageHeader title="Relationship Pipeline" subtitle="Drag businesses between stages" actions={
        <Button variant="outline" size="sm" onClick={() => exportPipelineReportPDF(businesses)} className="gap-1">
          <FileDown className="w-4 h-4" /><span className="hidden lg:inline">Export Report</span>
        </Button>
      } />
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
          {stages.map(stage => (
            <Droppable droppableId={stage.id} key={stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-64 md:w-60 lg:flex-1 bg-card/50 border ${stage.color} rounded-xl p-3 min-h-[400px] transition-colors ${snapshot.isDraggingOver ? 'bg-primary/5 border-primary/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage.label}</h3>
                    <span className="text-xs font-bold text-muted-foreground bg-secondary rounded-full w-6 h-6 flex items-center justify-center">{grouped[stage.id]?.length || 0}</span>
                  </div>
                  <div className="space-y-2">
                    {(grouped[stage.id] || []).map((biz, idx) => (
                      <Draggable draggableId={biz.id} index={idx} key={biz.id}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing transition-shadow ${snap.isDragging ? 'shadow-xl shadow-primary/10' : 'hover:border-primary/20'}`}
                          >
                            <Link to={`/businesses/${biz.id}/strategy`} className="block">
                              <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Building2 className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold truncate">{biz.name}</p>
                                  <p className="text-[10px] text-muted-foreground truncate">{biz.industry || 'No industry'}</p>
                                </div>
                              </div>
                              {biz.assigned_to_name && (
                                <div className="flex items-center gap-1 mt-2">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[10px] text-muted-foreground">{biz.assigned_to_name}</span>
                                </div>
                              )}
                              {biz.tags?.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {biz.tags.slice(0, 2).map(t => (
                                    <span key={t} className="text-[9px] bg-secondary px-1.5 py-0.5 rounded-full text-muted-foreground">{t}</span>
                                  ))}
                                </div>
                              )}
                              <div className={`w-1.5 h-1.5 rounded-full ${getHealthDotColor(computeHealthScore(biz))} mt-2`} />
                            </Link>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}