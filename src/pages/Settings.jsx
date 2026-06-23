import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Settings as SettingsIcon, CreditCard, Save, Building2, Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import PageHeader from '@/components/shared/PageHeader';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    payment_link_url: '',
    payment_button_label: '',
    payment_description: '',
    company_name: '',
  });
  const [saving, setSaving] = useState(false);

  const { data: settings = [] } = useQuery({
    queryKey: ['app-settings'],
    queryFn: () => base44.entities.AppSettings.list(),
  });

  useEffect(() => {
    const getVal = (key) => settings.find((s) => s.key === key)?.value || '';
    setForm({
      payment_link_url: getVal('payment_link_url'),
      payment_button_label: getVal('payment_button_label'),
      payment_description: getVal('payment_description'),
      company_name: getVal('company_name'),
    });
  }, [settings]);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const entries = [
        { key: 'payment_link_url', value: form.payment_link_url, label: 'Payment Link URL' },
        { key: 'payment_button_label', value: form.payment_button_label || 'Make Payment', label: 'Payment Button Label' },
        { key: 'payment_description', value: form.payment_description, label: 'Payment Description' },
        { key: 'company_name', value: form.company_name, label: 'Business Name' },
      ];

      for (const entry of entries) {
        const existing = settings.find((s) => s.key === entry.key);
        if (existing) {
          await base44.entities.AppSettings.update(existing.id, {
            ...entry,
            updated_by_name: user?.full_name,
          });
        } else {
          await base44.entities.AppSettings.create({
            ...entry,
            updated_by_name: user?.full_name,
          });
        }
      }

      qc.invalidateQueries({ queryKey: ['app-settings'] });
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="animate-slide-up flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-14 h-14 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Lock className="w-7 h-7 text-destructive" />
        </div>
        <p className="text-sm font-semibold">Access Denied</p>
        <p className="text-xs text-muted-foreground">Admin only</p>
        <Button variant="outline" size="sm" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <PageHeader title="Settings" subtitle="Configure payment collection and branding" />

      <div className="max-w-2xl space-y-6">
        {/* Payment Collection */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Payment Collection</h3>
          </div>

          <div>
            <Label className="text-xs">Payment Link URL</Label>
            <Input
              value={form.payment_link_url}
              onChange={(e) => set('payment_link_url', e.target.value)}
              placeholder="https://buy.stripe.com/... or any payment URL"
              className="bg-secondary/50 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Button Label</Label>
            <Input
              value={form.payment_button_label}
              onChange={(e) => set('payment_button_label', e.target.value)}
              placeholder="Make Payment"
              className="bg-secondary/50 mt-1"
            />
          </div>

          <div>
            <Label className="text-xs">Payment Description</Label>
            <Textarea
              value={form.payment_description}
              onChange={(e) => set('payment_description', e.target.value)}
              placeholder="Describe what this payment is for"
              className="bg-secondary/50 mt-1 h-20 resize-none"
            />
          </div>

          {/* Preview */}
          {form.payment_link_url && (
            <div>
              <Label className="text-xs mb-2 block">Preview</Label>
              <div className="w-full bg-secondary/40 border border-primary/30 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{form.payment_button_label || 'Make Payment'}</p>
                  {form.payment_description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{form.payment_description}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Business Branding */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Business Branding</h3>
          </div>

          <div>
            <Label className="text-xs">Business Name</Label>
            <Input
              value={form.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="Your company name"
              className="bg-secondary/50 mt-1"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Shown in the app for branding purposes</p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full min-h-[44px]">
          <Save className="w-4 h-4 mr-1.5" /> {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}