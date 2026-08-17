import React from 'react';

/**
 * `subtitle` and `actions` are genuinely optional — most pages pass one or neither. Without
 * this annotation TypeScript infers all three props as required and flags every such call.
 *
 * @param {{ title: React.ReactNode, subtitle?: React.ReactNode, actions?: React.ReactNode }} props
 */
export default function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-3 mb-6 sm:mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:flex-wrap">{actions}</div>}
      </div>
    </div>
  );
}