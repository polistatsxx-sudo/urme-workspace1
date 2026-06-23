import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CreditCard, ExternalLink } from 'lucide-react';

export default function PaymentButton({ label }) {
  const { data: settings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  const getUrl = (key) => settings.find((s) => s.key === key)?.value;
  const paymentUrl = getUrl('payment_link_url');
  const buttonLabel = getUrl('payment_button_label') || 'Make Payment';
  const description = getUrl('payment_description');

  if (!paymentUrl) return null;

  return (
    <button
      onClick={() => window.open(paymentUrl, '_blank')}
      className="w-full bg-card border border-primary/30 rounded-xl p-4 flex items-center gap-3 hover:border-primary/50 transition-colors active:scale-[0.98] text-left min-h-[44px]"
    >
      <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
        <CreditCard className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold flex items-center gap-1.5">
          {label || buttonLabel} <ExternalLink className="w-3 h-3 text-muted-foreground" />
        </p>
        {description && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        )}
      </div>
    </button>
  );
}