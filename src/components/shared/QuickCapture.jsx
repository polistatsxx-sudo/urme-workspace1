import React, { useState } from 'react';
import { Zap, X, CheckSquare, Lightbulb, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuickCapture() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('task');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const qc = useQueryClient();

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    if (mode === 'task') {
      await base44.entities.Task.create({ title, description: detail, status: 'todo', priority: 'medium' });
      qc.invalidateQueries({ queryKey: ['tasks'] });
    } else if (mode === 'idea') {
      await base44.entities.Idea.create({ title, description: detail, status: 'new', category: 'other', votes: 0, voted_by: [], comments: [] });
      qc.invalidateQueries({ queryKey: ['ideas'] });
    } else {
      await base44.entities.Business.create({ name: title, description: detail, stage: 'new_lead', tags: [] });
      qc.invalidateQueries({ queryKey: ['businesses'] });
    }
    toast.success(`${mode === 'task' ? 'Task' : mode === 'idea' ? 'Idea' : 'Business'} captured!`);
    setTitle(''); setDetail(''); setOpen(false); setSaving(false);
  };

  const modes = [
    { key: 'task', icon: CheckSquare, label: 'Task', color: 'text-primary' },
    { key: 'idea', icon: Lightbulb, label: 'Idea', color: 'text-accent' },
    { key: 'business', icon: Building2, label: 'Lead', color: 'text-chart-3' },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-4 md:right-8 z-50 w-[calc(100%-2rem)] max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Quick Capture</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-1 mb-3">
              {modes.map(m => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    mode === m.key ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  <m.icon className="w-3.5 h-3.5" /> {m.label}
                </button>
              ))}
            </div>
            <Input
              placeholder={mode === 'task' ? 'What needs to be done?' : mode === 'idea' ? 'What\'s your idea?' : 'Business name'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="mb-2 bg-secondary/50"
              autoFocus
            />
            <Textarea
              placeholder="Add details (optional)..."
              value={detail}
              onChange={e => setDetail(e.target.value)}
              className="mb-3 bg-secondary/50 h-20 resize-none"
            />
            <Button onClick={handleSave} disabled={!title.trim() || saving} className="w-full" size="sm">
              {saving ? 'Saving...' : 'Capture'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-4 md:right-8 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform animate-pulse-glow"
      >
        {open ? <X className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
      </button>
    </>
  );
}