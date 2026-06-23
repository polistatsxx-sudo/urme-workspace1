import React from 'react';
import { Zap, Check, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const features = [
  'AI-powered business matchmaking',
  'Pipeline & relationship management',
  'Team collaboration tools',
  'Reports, analytics & automations',
];

export default function Subscribe() {
  const handleSubscribe = () => {
    window.open('https://buy.stripe.com/00wfZi6ID2uHeqw2JK3Je00', '_blank');
  };

  const handleLogout = () => {
    base44.auth.logout('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        {/* Branding */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg">URME</span>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-center mb-2">
            Your URME Access Has Expired
          </h1>
          <p className="text-sm text-muted-foreground text-center mb-6">
            Continue using your networking CRM for just $25/month
          </p>

          {/* Features */}
          <div className="space-y-3 mb-8">
            {features.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-primary" />
                </div>
                <span className="text-sm">{f}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            className="w-full bg-primary text-primary-foreground font-semibold text-sm rounded-xl py-3.5 min-h-[52px] flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors active:scale-95"
          >
            Subscribe — $25/month →
          </button>

          <p className="text-[11px] text-muted-foreground text-center mt-3">
            After subscribing, contact your admin to activate your account
          </p>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-6 py-2 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Log out
          </button>
        </div>
      </div>
    </div>
  );
}