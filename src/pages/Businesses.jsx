import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Filter, Sparkles, Loader2, Download, Upload, List, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PageHeader from '@/components/shared/PageHeader';
import StageBadge from '@/components/shared/StageBadge';
import HealthScoreBadge from '@/components/shared/HealthScoreBadge';
import BusinessForm from '@/components/business/BusinessForm';
import CSVImportDialog from '@/components/import/CSVImportDialog';
import { toast } from 'sonner';
import { exportToCSV } from '@/utils/csvExport';
import { needsFollowUp } from '@/utils/healthScore';
import BusinessMap from '@/components/business/BusinessMap';
import { geocodeAddress } from '@/utils/geocode';

export default function Businesses() {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [managerFilter, setManagerFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [followUpFilter, setFollowUpFilter] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [geocoding, setGeocoding] = useState(false);
  const qc = useQueryClient();

  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list() });
  const { data: users = [] } = useQuery({ queryKey: ['users'], queryFn: () => base44.entities.User.list() });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.Business.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['businesses'] }); setShowAdd(false); toast.success('Business added!'); },
  });

  const runSynergyScanner = async () => {
    if (businesses.length < 2) { toast.error('Need at least 2 businesses'); return; }
    setScanning(true);
    const bizSummaries = businesses.slice(0, 20).map(b => `${b.name} (${b.industry || 'unknown'}): Needs: ${b.needs || 'n/a'}, Offers: ${b.offers || 'n/a'}`).join('\n');
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a B2B matchmaking expert. Analyze these businesses and find the top 5 most synergistic potential partnerships. For each pair, explain WHY they'd work well together and give a synergy score (0-100).\n\nBusinesses:\n${bizSummaries}\n\nReturn JSON with matches array.`,
      response_json_schema: {
        type: "object",
        properties: {
          matches: {
            type: "array",
            items: {
              type: "object",
              properties: {
                business_a: { type: "string" },
                business_b: { type: "string" },
                synergy_score: { type: "number" },
                reason: { type: "string" }
              }
            }
          }
        }
      }
    });
    if (result.matches) {
      for (const m of result.matches) {
        const a = businesses.find(b => b.name.toLowerCase().includes(m.business_a.toLowerCase()));
        const b_biz = businesses.find(b => b.name.toLowerCase().includes(m.business_b.toLowerCase()));
        if (a && b_biz) {
          await base44.entities.Match.create({
            business_a_id: a.id, business_a_name: a.name,
            business_b_id: b_biz.id, business_b_name: b_biz.name,
            synergy_score: m.synergy_score, reason: m.reason, status: 'suggested'
          });
        }
      }
      qc.invalidateQueries({ queryKey: ['matches'] });
      toast.success(`Found ${result.matches.length} potential matches!`);
    }
    setScanning(false);
  };

  const managers = [...new Set(businesses.map(b => b.assigned_to_name).filter(Boolean))].sort();
  const industries = [...new Set(businesses.map(b => b.industry).filter(Boolean))].sort();
  const cities = [...new Set(businesses.map(b => b.city).filter(Boolean))].sort();
  const states = [...new Set(businesses.map(b => b.state).filter(Boolean))].sort();

  const filtered = businesses.filter(b => {
    const matchSearch = b.name?.toLowerCase().includes(search.toLowerCase()) || b.industry?.toLowerCase().includes(search.toLowerCase());
    const matchStage = stageFilter === 'all' || b.stage === stageFilter;
    const matchManager = managerFilter === 'all' || b.assigned_to_name === managerFilter;
    const matchIndustry = industryFilter === 'all' || b.industry === industryFilter;
    const matchCity = cityFilter === 'all' || b.city === cityFilter;
    const matchState = stateFilter === 'all' || b.state === stateFilter;
    const matchFollowUp = !followUpFilter || needsFollowUp(b);
    return matchSearch && matchStage && matchManager && matchIndustry && matchCity && matchState && matchFollowUp;
  });

  const activeFilters = [stageFilter, managerFilter, industryFilter, cityFilter, stateFilter].filter(f => f !== 'all').length;
  const clearFilters = () => { setStageFilter('all'); setManagerFilter('all'); setIndustryFilter('all'); setCityFilter('all'); setStateFilter('all'); };

  return (
    <div className="animate-slide-up">
      <PageHeader
        title="Business Network"
        subtitle={`${businesses.length} businesses in your network`}
        actions={
          <div className="flex flex-col gap-2 w-full sm:flex-row sm:flex-wrap sm:justify-end sm:w-auto">
            <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered, 'businesses_export.csv', [
              { key: 'name', header: 'Name' },
              { key: 'industry', header: 'Industry' },
              { key: 'stage', header: 'Stage' },
              { key: 'contact_name', header: 'Contact' },
              { key: 'contact_email', header: 'Email' },
              { key: 'contact_phone', header: 'Phone' },
              { key: 'city', header: 'City' },
              { key: 'state', header: 'State' },
              { key: 'needs', header: 'Needs' },
              { key: 'offers', header: 'Offers' },
              { key: 'health_score', header: 'Health Score' },
              { key: 'last_interaction_date', header: 'Last Contact' },
            ])} className="gap-1 justify-center sm:justify-start"><Download className="w-4 h-4" /><span className="hidden sm:inline">Export CSV</span></Button>
            <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="gap-1 justify-center sm:justify-start"><Upload className="w-4 h-4" /><span className="hidden sm:inline">Import CSV</span></Button>
            <Button variant="outline" size="sm" onClick={runSynergyScanner} disabled={scanning} className="justify-center sm:justify-start">
              {scanning ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
              Synergy Scanner
            </Button>
            <Dialog open={showAdd} onOpenChange={setShowAdd}>
              <DialogTrigger asChild>
                <Button size="sm" className="justify-center sm:justify-start"><Plus className="w-4 h-4 mr-1" /> Add Business</Button>
              </DialogTrigger>
              <DialogContent className="w-[calc(100%-1rem)] max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl p-4 sm:p-6">
                <DialogHeader><DialogTitle>Add New Business</DialogTitle></DialogHeader>
                <BusinessForm businesses={businesses} users={users} onSubmit={data => createMut.mutate(data)} saving={createMut.isPending} />
              </DialogContent>
            </Dialog>
            <CSVImportDialog open={showImport} onOpenChange={setShowImport} />
          </div>
        }
      />

      <div className="flex flex-col gap-2 mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search businesses..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-card" />
          </div>
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-0.5 self-start sm:self-auto">
            <button onClick={() => setViewMode('list')} className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('map')} className={`p-2 rounded-md ${viewMode === 'map' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}>
              <MapPin className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            onClick={() => setFollowUpFilter(!followUpFilter)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium ${followUpFilter ? 'bg-orange-500/20 text-orange-400' : 'bg-card border border-border text-muted-foreground'}`}
          >
            Needs Follow-Up
          </button>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter className="w-3.5 h-3.5" /> Filters:</div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-auto min-w-0 sm:min-w-32 h-8 text-xs bg-card"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              <SelectItem value="new_lead">New Lead</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
              <SelectItem value="in_discussion">In Discussion</SelectItem>
              <SelectItem value="collaborating">Collaborating</SelectItem>
              <SelectItem value="partnered">Partnered</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={managerFilter} onValueChange={setManagerFilter}>
            <SelectTrigger className="w-full sm:w-auto min-w-0 sm:min-w-32 h-8 text-xs bg-card"><SelectValue placeholder="Manager" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Managers</SelectItem>
              {managers.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-auto min-w-0 sm:min-w-32 h-8 text-xs bg-card"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="w-full sm:w-auto min-w-0 sm:min-w-28 h-8 text-xs bg-card"><SelectValue placeholder="City" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={stateFilter} onValueChange={setStateFilter}>
            <SelectTrigger className="w-full sm:w-auto min-w-0 sm:min-w-24 h-8 text-xs bg-card"><SelectValue placeholder="State" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeFilters > 0 && (
            <Button variant="ghost" size="sm" className="h-8 text-xs w-full sm:w-auto justify-center" onClick={clearFilters}>Clear ({activeFilters})</Button>
          )}
        </div>
      </div>

      {viewMode === 'map' ? (
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto gap-1"
            onClick={async () => {
              setGeocoding(true);
              const needGeocode = filtered.filter(b => (b.city || b.state) && (b.latitude == null || b.longitude == null));
              for (const b of needGeocode) {
                const result = await geocodeAddress(b.city, b.state);
                if (result) {
                  await base44.entities.Business.update(b.id, { latitude: result.lat, longitude: result.lng });
                }
              }
              qc.invalidateQueries({ queryKey: ['businesses'] });
              setGeocoding(false);
              toast.success('Geocoding complete');
            }}
            disabled={geocoding}
          >
            {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {geocoding ? 'Geocoding...' : 'Geocode All'}
          </Button>
          <BusinessMap businesses={filtered} height="500px" />
        </div>
      ) : (
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(biz => (
          <Link key={biz.id} to={`/businesses/${biz.id}`} className="block">
            <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{biz.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{biz.industry || 'No industry'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {needsFollowUp(biz) && <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />}
                  <HealthScoreBadge score={biz.health_score || 0} />
                  <StageBadge stage={biz.stage} />
                </div>
              </div>
              {biz.needs && <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2"><span className="font-semibold text-foreground/70">Needs:</span> {biz.needs}</p>}
              {biz.offers && <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2"><span className="font-semibold text-foreground/70">Offers:</span> {biz.offers}</p>}
              {biz.assigned_to_name && (
                <p className="text-[10px] text-muted-foreground mt-2 border-t border-border/50 pt-2">Manager: {biz.assigned_to_name}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
      )}
      {filtered.length === 0 && <p className="text-center text-muted-foreground text-sm py-12">No businesses found</p>}
    </div>
  );
}