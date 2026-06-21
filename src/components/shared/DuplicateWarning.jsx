import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DuplicateWarning({ duplicates = [], onDismiss, entityType = 'business' }) {
  const navigate = useNavigate();
  if (duplicates.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 space-y-2"
    >
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-xs font-semibold text-amber-400">
          Possible duplicate {entityType}:
        </p>
      </div>
      <div className="space-y-1">
        {duplicates.map((dup, i) => (
          <div key={i} className="flex items-center justify-between bg-amber-500/5 rounded-lg px-2 py-1.5">
            <div className="min-w-0 flex-1">
              <span className="text-xs font-medium">{dup.entry.name || dup.entry.full_name}</span>
              <span className="text-[10px] text-muted-foreground ml-1">({dup.matchReason})</span>
            </div>
            <button
              onClick={() => navigate(entityType === 'business' ? `/businesses/${dup.entry.id}` : `/contacts/${dup.entry.id}`)}
              className="text-[10px] text-primary hover:underline flex items-center gap-0.5 flex-shrink-0 ml-2"
            >
              View <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="flex-1 h-9 text-xs" onClick={onDismiss}>
          Create Anyway
        </Button>
      </div>
    </motion.div>
  );
}