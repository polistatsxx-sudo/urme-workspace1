import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, CheckCircle2, Circle, Clock, AlertTriangle, Trophy, Flame, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import PageHeader from '@/components/shared/PageHeader';
import { toast } from 'sonner';
import { format, isPast, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import confetti from 'canvas-confetti';

export default function Tasks() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', due_date: '', status: 'todo' });
  const [tab, setTab] = useState('todo');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showAILink, setShowAILink] = useState(false);

  const handleEnhance = async () => {
    if (!form.title.trim() && !form.description.trim()) {
      toast.error('Add a title or description first');
      return;
    }
    setIsEnhancing(true);
    setShowAILink(false);
    try {
      const res = await base44.functions.invoke('aiEnhanceTask', { title: form.title, description: form.description });
      setForm(p => ({ ...p, title: res.data.improvedTitle, description: res.data.improvedDescription }));
      setShowAILink(true);
      toast.success('Task improved with AI!', { icon: '✨' });
    } catch (err) {
      toast.error('Failed to enhance task');
    } finally {
      setIsEnhancing(false);
    }
  };

  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list('-created_date') });

  const createMut = useMutation({
    mutationFn: (d) => base44.entities.Task.create({ ...d, assigned_to: user?.id, assigned_to_name: user?.full_name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); setShowAdd(false); setForm({ title: '', description: '', priority: 'medium', due_date: '', status: 'todo' }); toast.success('Task created!'); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Task.update(id, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks'] });
      if (vars.data.status === 'done') {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
        toast.success('Task completed! +10 XP', { icon: '🎉' });
      }
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.Task.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); toast.success('Deleted'); },
  });

  const filtered = tasks.filter(t => {
    if (tab === 'todo') return t.status === 'todo';
    if (tab === 'in_progress') return t.status === 'in_progress';
    if (tab === 'done') return t.status === 'done';
    if (tab === 'overdue') return t.status !== 'done' && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date));
    return true;
  });

  const overdue = tasks.filter(t => t.status !== 'done' && t.due_date && isPast(new Date(t.due_date)) && !isToday(new Date(t.due_date)));
  const done = tasks.filter(t => t.status === 'done');

  const priorityColors = { urgent: 'bg-destructive', high: 'bg-orange-500', medium: 'bg-yellow-500', low: 'bg-blue-500' };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Accountability Engine"
        subtitle={`${done.length} completed • ${overdue.length} overdue`}
        actions={
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> New Task</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>New Task</DialogTitle></DialogHeader>
              <form onSubmit={e => { e.preventDefault(); createMut.mutate(form); }} className="space-y-3">
                <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} required className="bg-secondary/50 mt-1" /></div>
                <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="bg-secondary/50 mt-1 h-16 resize-none" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-xs">Priority</Label>
                    <Select value={form.priority} onValueChange={v => setForm(p => ({...p, priority: v}))}>
                      <SelectTrigger className="bg-secondary/50 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="urgent">Urgent</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs">Due Date</Label><Input type="date" value={form.due_date} onChange={e => setForm(p => ({...p, due_date: e.target.value}))} className="bg-secondary/50 mt-1" /></div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleEnhance} disabled={isEnhancing} className="flex-1 border-accent/50 text-accent hover:bg-accent/10">
                    <Sparkles className="w-4 h-4 mr-1" />{isEnhancing ? 'Improving...' : 'Improve with AI'}
                  </Button>
                  <Button type="submit" disabled={createMut.isPending || !form.title.trim()} className="flex-1">{createMut.isPending ? 'Creating...' : 'Create Task'}</Button>
                </div>
                {showAILink && (
                  <a
                    href={`/task-ai-chat?title=${encodeURIComponent(form.title)}&description=${encodeURIComponent(form.description)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Chat with AI about how to make this task successful →
                  </a>
                )}
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {/* XP Bar */}
      <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center gap-3">
        <Trophy className="w-5 h-5 text-chart-3" />
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-medium">Team XP</span>
            <span className="text-chart-3 font-bold">{done.length * 10} XP</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div className="bg-chart-3 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (done.length * 10) / 5)}%` }} />
          </div>
        </div>
        <Flame className="w-5 h-5 text-destructive" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-card border border-border mb-4">
          <TabsTrigger value="todo">To Do ({tasks.filter(t => t.status === 'todo').length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({tasks.filter(t => t.status === 'in_progress').length})</TabsTrigger>
          <TabsTrigger value="done">Done ({done.length})</TabsTrigger>
          {overdue.length > 0 && <TabsTrigger value="overdue" className="text-destructive">Overdue ({overdue.length})</TabsTrigger>}
        </TabsList>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filtered.map(task => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-card border border-border rounded-xl p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => {
                      const nextStatus = task.status === 'todo' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'todo';
                      updateMut.mutate({ id: task.id, data: { status: nextStatus } });
                    }}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {task.status === 'done' ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : task.status === 'in_progress' ? (
                      <Clock className="w-5 h-5 text-accent" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${priorityColors[task.priority]}`} />
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</p>
                    </div>
                    {task.description && <p className="text-xs text-muted-foreground mt-0.5 ml-3.5">{task.description}</p>}
                    <div className="flex items-center gap-3 mt-1 ml-3.5 text-[10px] text-muted-foreground">
                      {task.due_date && (
                        <span className={isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date)) && task.status !== 'done' ? 'text-destructive font-semibold' : ''}>
                          {format(new Date(task.due_date), 'MMM d')}
                        </span>
                      )}
                      {task.business_name && <span>• {task.business_name}</span>}
                      {task.assigned_to_name && <span>• {task.assigned_to_name}</span>}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => { if (confirm('Delete?')) deleteMut.mutate(task.id); }}>×</Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">No tasks here</p>}
        </div>
      </Tabs>
    </div>
  );
}