import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Sparkles, Loader2, Target, Users, Lightbulb, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stageLabels = {
  new_lead: 'New Lead',
  contacted: 'Contacted',
  meeting_scheduled: 'Meeting Scheduled',
  in_discussion: 'In Discussion',
  collaborating: 'Collaborating',
  partnered: 'Partnered',
};

const sectionIcons = {
  'Immediate Next Steps': Target,
  'Outreach & Communication': MessageSquare,
  'Value Proposition': Lightbulb,
  'Long-Term Partnership Potential': TrendingUp,
  'Stakeholder Engagement': Users,
};

export default function BusinessStrategy() {
  const { id } = useParams();
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState({});
  const [activeStep, setActiveStep] = useState(null);

  const { data: biz } = useQuery({
    queryKey: ['business', id],
    queryFn: () => base44.entities.Business.filter({ id }),
    select: (d) => d[0],
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', id],
    queryFn: () => base44.entities.Interaction.filter({ business_id: id }),
    enabled: !!id,
  });

  const generateStrategy = async () => {
    if (!biz) return;
    setLoading(true);
    setStrategy(null);

    const recentInteractions = interactions
      .slice(0, 5)
      .map(i => `- ${i.type} on ${i.interaction_date ? new Date(i.interaction_date).toLocaleDateString() : 'unknown date'}: ${i.notes || i.title || ''}`)
      .join('\n');

    const prompt = `You are a strategic business development advisor. Analyze this business contact and provide specific, actionable next steps to move them toward becoming a client/partner.

Business: ${biz.name}
Industry: ${biz.industry || 'Unknown'}
Current Stage: ${stageLabels[biz.stage] || biz.stage}
Description: ${biz.description || 'N/A'}
What they need: ${biz.needs || 'N/A'}
What they offer: ${biz.offers || 'N/A'}
Contact: ${biz.contact_name || 'N/A'} (${biz.contact_email || 'N/A'})
City/State: ${[biz.city, biz.state].filter(Boolean).join(', ') || 'N/A'}
Tags: ${biz.tags?.join(', ') || 'None'}
Notes: ${biz.notes || 'None'}

Recent Interactions:
${recentInteractions || 'No interactions logged yet.'}

Provide a detailed client acquisition strategy with these 5 sections:
1. Immediate Next Steps (3-5 concrete actions for this week)
2. Outreach & Communication (personalized messaging angles, talking points)
3. Value Proposition (what specifically to offer them based on their needs/industry)
4. Long-Term Partnership Potential (revenue, collaboration, referral opportunities)
5. Stakeholder Engagement (who to build relationships with, how to navigate their org)

Be specific, concise, and practical. Reference their actual details.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          sections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                summary: { type: 'string' },
                points: { type: 'array', items: { type: 'string' } },
              },
            },
          },
          overall_priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          timeline_to_close: { type: 'string' },
          key_insight: { type: 'string' },
        },
      },
    });

    setStrategy(result);
    setLoading(false);
  };

  useEffect(() => {
    if (biz) generateStrategy();
  }, [biz?.id]);

  const priorityColor = {
    high: 'text-red-400 bg-red-400/10',
    medium: 'text-yellow-400 bg-yellow-400/10',
    low: 'text-emerald-400 bg-emerald-400/10',
  };

  return (
    <div className="animate-slide-up max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/pipeline">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <ArrowLeft className="w-4 h-4" /> Pipeline
          </Button>
        </Link>
        {biz && (
          <Link to={`/businesses/${biz.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            View full profile →
          </Link>
        )}
      </div>

      {biz && (
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold">{biz.name}</h1>
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
              {stageLabels[biz.stage] || biz.stage}
            </span>
          </div>
          <p className="text-muted-foreground text-sm">{biz.industry} · {[biz.city, biz.state].filter(Boolean).join(', ') || 'Location unknown'}</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold">AI Acquisition Strategy</span>
        </div>
        <Button variant="outline" size="sm" onClick={generateStrategy} disabled={loading} className="gap-1.5">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Regenerate
        </Button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm">Analyzing business context and generating strategy...</p>
        </div>
      )}

      {strategy && !loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-2">
            {strategy.key_insight && (
              <div className="col-span-2 bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-xs font-semibold text-primary mb-1 uppercase tracking-wider">Key Insight</p>
                <p className="text-sm text-foreground">{strategy.key_insight}</p>
              </div>
            )}
            {strategy.overall_priority && (
              <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Priority:</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${priorityColor[strategy.overall_priority]}`}>
                  {strategy.overall_priority}
                </span>
              </div>
            )}
            {strategy.timeline_to_close && (
              <div className="bg-card border border-border rounded-xl p-3">
                <span className="text-xs text-muted-foreground">Est. Timeline: </span>
                <span className="text-xs font-semibold">{strategy.timeline_to_close}</span>
              </div>
            )}
          </div>

          {strategy.sections?.map((section) => {
            const Icon = sectionIcons[section.title] || Target;
            const isNextSteps = section.title === 'Immediate Next Steps';
            return (
              <div key={section.title} className="bg-card border border-border rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm">{section.title}</h3>
                  {isNextSteps && activeStep !== null && (
                    <button onClick={() => setActiveStep(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
                      Clear highlight
                    </button>
                  )}
                </div>
                {section.summary && <p className="text-sm text-muted-foreground mb-3">{section.summary}</p>}
                {section.points?.length > 0 && (
                  <ul className="space-y-2">
                    {section.points.map((point, i) => {
                      if (isNextSteps) {
                        const key = `next-${i}`;
                        const done = !!checked[key];
                        const isActive = activeStep === i;
                        return (
                          <li key={i} className={`flex items-start gap-2.5 text-sm rounded-lg p-1.5 -mx-1.5 transition-colors ${isActive ? 'bg-primary/10' : ''}`}>
                            <div
                              className={`w-4 h-4 mt-0.5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${done ? 'bg-primary border-primary' : 'border-muted-foreground/40 hover:border-primary/60'}`}
                              onClick={() => setChecked(prev => ({ ...prev, [key]: !prev[key] }))}
                            >
                              {done && <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 10 10"><path d="M1.5 5l2.5 2.5 4.5-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span
                              className={`cursor-pointer flex-1 ${done ? 'line-through text-muted-foreground' : ''} ${isActive ? 'font-medium text-primary' : ''}`}
                              onClick={() => setActiveStep(isActive ? null : i)}
                            >
                              {point}
                            </span>
                          </li>
                        );
                      } else {
                        // Highlight points that share keywords with the active next step
                        const nextStepsSection = strategy.sections?.find(s => s.title === 'Immediate Next Steps');
                        const activeStepText = activeStep !== null ? nextStepsSection?.points?.[activeStep] || '' : '';
                        const stepWords = activeStepText.toLowerCase().split(/\W+/).filter(w => w.length > 4);
                        const isHighlighted = activeStep !== null && stepWords.some(w => point.toLowerCase().includes(w));
                        return (
                          <li key={i} className={`flex items-start gap-2 text-sm rounded-lg p-1.5 -mx-1.5 transition-all ${isHighlighted ? 'bg-yellow-400/10 border border-yellow-400/30' : activeStep !== null ? 'opacity-40' : ''}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-1.5 flex-shrink-0" />
                            <span>{point}</span>
                          </li>
                        );
                      }
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}