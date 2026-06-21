import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Search, X, ChevronRight, Building2, User, CheckSquare, Calendar, ArrowLeft, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';

const RECENT_KEY = 'urme_recent_searches';

function getRecent() {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); } catch { return []; }
}
function addRecent(query) {
  const recent = getRecent().filter(r => r.toLowerCase() !== query.toLowerCase());
  recent.unshift(query);
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)));
}
function clearRecent() {
  localStorage.removeItem(RECENT_KEY);
}

const typeConfig = {
  businesses: { icon: Building2, color: 'text-blue-400', label: 'Businesses', getPath: (item) => `/businesses/${item.id}`, subtitle: (item) => item.industry || 'No industry' },
  contacts: { icon: User, color: 'text-purple-400', label: 'Contacts', getPath: (item) => `/contacts/${item.id}`, subtitle: (item) => item.business_name || 'No business' },
  tasks: { icon: CheckSquare, color: 'text-green-400', label: 'Tasks', getPath: () => '/tasks', subtitle: (item) => item.due_date ? format(new Date(item.due_date), 'MMM d') : 'No due date', useToast: (item) => toast.info(`Showing task: ${item.title}`) },
  events: { icon: Calendar, color: 'text-orange-400', label: 'Events', getPath: (item) => '/events', subtitle: (item) => `${item.date ? format(new Date(item.date), 'MMM d') : ''}${item.location ? ' · ' + item.location : ''}` },
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState(null);
  const [recent, setRecent] = useState([]);
  const [showAll, setShowAll] = useState({});
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const { data: businesses = [] } = useQuery({ queryKey: ['businesses'], queryFn: () => base44.entities.Business.list(), enabled: open });
  const { data: contacts = [] } = useQuery({ queryKey: ['contacts-all'], queryFn: () => base44.entities.Contact.list(), enabled: open });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => base44.entities.Task.list(), enabled: open });
  const { data: events = [] } = useQuery({ queryKey: ['events'], queryFn: () => base44.entities.Event.list(), enabled: open });

  useEffect(() => {
    const handler = () => { setOpen(true); setRecent(getRecent()); };
    window.addEventListener('open-global-search', handler);
    return () => window.removeEventListener('open-global-search', handler);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setRecent(getRecent());
    } else {
      setQuery('');
      setDebouncedQuery('');
      setActiveFilter(null);
      setShowAll({});
    }
  }, [open]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 250);
    return () => clearTimeout(t);
  }, [query]);

  const allData = { businesses, contacts, tasks, events };

  const filterResults = (type) => {
    const data = allData[type] || [];
    if (!debouncedQuery) return [];
    const q = debouncedQuery.toLowerCase();
    if (type === 'businesses') return data.filter(d => d.name?.toLowerCase().includes(q) || d.industry?.toLowerCase().includes(q));
    if (type === 'contacts') return data.filter(d => d.full_name?.toLowerCase().includes(q) || d.business_name?.toLowerCase().includes(q));
    if (type === 'tasks') return data.filter(d => d.title?.toLowerCase().includes(q));
    if (type === 'events') return data.filter(d => d.name?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q));
    return [];
  };

  const handleResultClick = (type, item) => {
    const cfg = typeConfig[type];
    addRecent(debouncedQuery);
    setOpen(false);
    if (cfg.useToast) cfg.useToast(item);
    navigate(cfg.getPath(item));
  };

  const handleRecentClick = (q) => {
    setQuery(q);
    setDebouncedQuery(q);
  };

  const typesToShow = activeFilter ? [activeFilter] : ['businesses', 'contacts', 'tasks', 'events'];
  const hasResults = typesToShow.some(t => filterResults(t).length > 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Top bar */}
          <div className="flex items-center gap-2 px-3 py-3 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search businesses, contacts, tasks, events..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9 bg-secondary/50 h-10"
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="flex-shrink-0 text-sm">
              Cancel
            </Button>
          </div>

          {/* Quick filter chips (empty state) */}
          {!debouncedQuery && (
            <div className="px-3 py-3">
              <div className="flex gap-2 flex-wrap">
                {Object.entries(typeConfig).map(([type, cfg]) => (
                  <button
                    key={type}
                    onClick={() => { setActiveFilter(type); setQuery(' '); setDebouncedQuery(' '); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium border border-border bg-card active:scale-95 transition-transform ${activeFilter === type ? cfg.color + ' border-current' : 'text-muted-foreground'}`}
                  >
                    <cfg.icon className="w-3.5 h-3.5" />
                    {cfg.label}
                  </button>
                ))}
                {activeFilter && (
                  <button onClick={() => { setActiveFilter(null); setQuery(''); }} className="text-xs text-muted-foreground px-2 py-2">
                    Clear filter
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {!debouncedQuery && recent.length > 0 && (
            <div className="px-3 pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Recent
                </span>
                <button onClick={() => { clearRecent(); setRecent([]); }} className="text-[10px] text-muted-foreground hover:text-foreground">
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recent.map((q, i) => (
                  <button key={i} onClick={() => handleRecentClick(q)}
                    className="text-xs bg-secondary text-secondary-foreground px-2.5 py-1.5 rounded-full active:scale-95 transition-transform">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-3 pb-6">
            {debouncedQuery && !hasResults && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="w-10 h-10 text-muted-foreground opacity-20 mb-3" />
                <p className="text-sm text-muted-foreground">No results for "{debouncedQuery}"</p>
              </div>
            )}

            {typesToShow.map(type => {
              const results = filterResults(type);
              if (results.length === 0) return null;
              const cfg = typeConfig[type];
              const max = showAll[type] ? 100 : 5;
              return (
                <div key={type} className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                    {cfg.label}
                  </p>
                  <div className="space-y-1">
                    {results.slice(0, max).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(type, item)}
                        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-3 py-3 active:bg-secondary/50 transition-colors text-left"
                        style={{ minHeight: 52 }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          <cfg.icon className={`w-4 h-4 ${cfg.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{item.name || item.full_name || item.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{cfg.subtitle(item)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                    {results.length > 5 && !showAll[type] && (
                      <button
                        onClick={() => setShowAll(p => ({ ...p, [type]: true }))}
                        className="w-full text-xs text-primary py-2 active:scale-95 transition-transform"
                      >
                        Show all {results.length} results
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}