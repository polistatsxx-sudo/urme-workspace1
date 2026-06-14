import React from 'react';
import { cn } from '@/lib/utils';

export default function StatCard({ label, value, icon: Icon, trend, className }) {
  return (
    <div className={cn("bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors", className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold mt-1 font-display">{value}</p>
          {trend && <p className="text-xs text-primary mt-1">{trend}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}