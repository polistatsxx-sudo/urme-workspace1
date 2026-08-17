import React, { useEffect, useMemo, useState } from 'react';
import { Search, X, LifeBuoy, Info, Lightbulb, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import PageHeader from '@/components/shared/PageHeader';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HELP_SECTIONS, groupHelpSections, searchHelpSections } from '@/data/helpContent';

const ALL = 'all';

function Callout({ icon: Icon, label, children, tone }) {
  const tones = {
    tip: 'bg-accent/10 border-accent/20 text-accent',
    stuck: 'bg-orange-500/10 border-orange-500/25 text-orange-400',
    role: 'bg-primary/5 border-primary/20 text-primary',
  };
  return (
    <div className={`flex items-start gap-2 border rounded-lg p-3 ${tones[tone]}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/80 leading-relaxed">
        <span className="font-semibold">{label} </span>
        {children}
      </p>
    </div>
  );
}

function SectionBody({ section }) {
  // `whatFor` is deliberately not repeated here: it sits in the always-visible header
  // above, so a reader sees what the topic is for before any of the steps.
  return (
    <div className="space-y-3">
      {section.body?.length > 0 && (
        <div className="space-y-2">
          {section.body.map((paragraph, i) => (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">{paragraph}</p>
          ))}
        </div>
      )}

      {section.steps?.length > 0 && (
        <ol className="space-y-2">
          {section.steps.map((step, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-foreground/80">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      {section.tip && (
        <Callout icon={Lightbulb} label="Tip:" tone="tip">{section.tip}</Callout>
      )}

      {section.ifStuck && (
        <Callout icon={HelpCircle} label="If it doesn’t work:" tone="stuck">{section.ifStuck}</Callout>
      )}

      {section.roleNote && (
        <Callout icon={Info} label="Who can do this:" tone="role">{section.roleNote}</Callout>
      )}
    </div>
  );
}

export default function HelpYourself() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [openIds, setOpenIds] = useState([]);

  const trimmed = query.trim();

  const results = useMemo(() => {
    const matches = searchHelpSections(trimmed);
    return category === ALL ? matches : matches.filter((section) => section.category === category);
  }, [trimmed, category]);

  // Searching should show the answer, not another thing to click, so every match opens
  // while a query is active. Clearing the box collapses them again.
  useEffect(() => {
    setOpenIds(trimmed ? searchHelpSections(trimmed).map((section) => section.id) : []);
  }, [trimmed]);

  const groups = useMemo(() => groupHelpSections(results), [results]);
  const categories = useMemo(
    () => [ALL, ...groupHelpSections(HELP_SECTIONS).map((group) => group.category)],
    []
  );

  const isFiltering = trimmed.length > 0 || category !== ALL;

  const reset = () => {
    setQuery('');
    setCategory(ALL);
  };

  return (
    <div className="animate-slide-up pb-20">
      <PageHeader
        title="How-To Guide"
        subtitle="New here? Start at the top. Looking for one thing? Search for it below."
      />

      {/* Search */}
      <div className="sticky top-14 sm:top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pt-2 pb-3 -mx-3 px-3 sm:-mx-0 sm:px-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type what you want to do — “password”, “add a company”, “map”…"
            aria-label="Search help topics"
            // The clear button below is ours; hide the one WebKit adds to type="search".
            className="pl-9 pr-9 h-11 bg-card [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Topic chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 mt-2 snap-x">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              aria-pressed={category === cat}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium snap-start transition-colors ${
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat === ALL ? 'All topics' : cat}
            </button>
          ))}
        </div>

        {isFiltering && (
          <p className="text-xs text-muted-foreground mt-2" role="status">
            {results.length} {results.length === 1 ? 'topic' : 'topics'}
            {trimmed ? ` matching “${trimmed}”` : ''}
          </p>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16">
          <LifeBuoy className="w-10 h-10 text-muted-foreground opacity-20 mb-3" />
          <p className="text-sm font-medium">No results — try another term</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Try fewer words, or a plainer one. Things like “password”, “add a company”, “money” or
            “locked out” all work.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
            Show all topics
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.category}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                {group.category}
              </h2>
              <Accordion
                type="multiple"
                value={openIds}
                onValueChange={setOpenIds}
                className="bg-card border border-border rounded-xl px-4 divide-y divide-border/50"
              >
                {group.sections.map((section) => (
                  <AccordionItem key={section.id} value={section.id} id={section.id} className="border-b-0">
                    <AccordionTrigger className="hover:no-underline gap-3 text-left">
                      <span className="min-w-0">
                        <span className="block font-semibold">{section.title}</span>
                        <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                          {section.whatFor}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <SectionBody section={section} />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      )}

      <p className="text-[11px] text-muted-foreground text-center mt-8">
        Still stuck? Ask an admin or your CEO. They can unlock your account, switch your access back
        on, and change things you are not allowed to change yourself.
      </p>
    </div>
  );
}
