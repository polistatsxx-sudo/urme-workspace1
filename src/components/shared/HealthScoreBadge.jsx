import React from 'react';
import { getHealthLabel, getHealthDotColor } from '@/utils/healthScore';
import { cn } from '@/lib/utils';

export default function HealthScoreBadge({ score = 0, size = 'sm' }) {
  const { label, colorClass } = getHealthLabel(score);
  const dotColor = getHealthDotColor(score);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg font-medium',
        colorClass,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
      style={{ minHeight: size === 'sm' ? 24 : 32 }}
    >
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', dotColor)} />
      <span className="font-bold">{score}</span>
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}