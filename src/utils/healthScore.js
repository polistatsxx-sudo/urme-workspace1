import { addDays, differenceInDays } from 'date-fns';

export function computeHealthScore(business, interactionCount = 0, lastInteractionDate = null) {
  const stage = business?.stage || 'new_lead';
  const count = interactionCount || business?.interaction_count || 0;

  // Recency (40 points max)
  let recencyScore = 0;
  if (lastInteractionDate || business?.last_interaction_date) {
    const dateStr = lastInteractionDate || business.last_interaction_date;
    const days = differenceInDays(new Date(), new Date(dateStr));
    if (days <= 7) recencyScore = 40;
    else if (days <= 14) recencyScore = 30;
    else if (days <= 30) recencyScore = 20;
    else if (days <= 60) recencyScore = 10;
    else recencyScore = 0;
  }

  // Frequency (30 points max)
  let frequencyScore = 0;
  if (count >= 10) frequencyScore = 30;
  else if (count >= 5) frequencyScore = 20;
  else if (count >= 2) frequencyScore = 10;
  else if (count >= 1) frequencyScore = 5;

  // Stage progression (30 points max)
  const stageScores = {
    partnered: 30, collaborating: 25, in_discussion: 20,
    meeting_scheduled: 15, contacted: 10, new_lead: 5, archived: 0,
  };
  const stageScore = stageScores[stage] ?? 0;

  return Math.min(100, recencyScore + frequencyScore + stageScore);
}

export function getHealthLabel(score) {
  if (score >= 80) return { label: 'Strong', colorClass: 'text-emerald-400 bg-emerald-500/15' };
  if (score >= 60) return { label: 'Good', colorClass: 'text-blue-400 bg-blue-500/15' };
  if (score >= 40) return { label: 'Cooling', colorClass: 'text-yellow-400 bg-yellow-500/15' };
  if (score >= 20) return { label: 'At Risk', colorClass: 'text-orange-400 bg-orange-500/15' };
  return { label: 'Cold', colorClass: 'text-red-400 bg-red-500/15' };
}

export function getHealthDotColor(score) {
  if (score >= 80) return 'bg-emerald-400';
  if (score >= 60) return 'bg-blue-400';
  if (score >= 40) return 'bg-yellow-400';
  if (score >= 20) return 'bg-orange-400';
  return 'bg-red-400';
}

export function computeNextFollowUp(stage) {
  const days = {
    new_lead: 5, contacted: 7, meeting_scheduled: 2,
    in_discussion: 7, collaborating: 14, partnered: 21, archived: 90,
  };
  return addDays(new Date(), days[stage] ?? 14).toISOString().slice(0, 10);
}

export function isBusinessStale(business) {
  if (business.stage === 'archived') return false;
  const stageThresholds = {
    new_lead: 7, contacted: 7, meeting_scheduled: 3,
    in_discussion: 10, collaborating: 21, partnered: 21,
  };
  const threshold = stageThresholds[business.stage] ?? 7;
  if (!business.last_interaction_date) return true;
  const days = differenceInDays(new Date(), new Date(business.last_interaction_date));
  return days > threshold;
}

export function needsFollowUp(business) {
  if (business.stage === 'archived') return false;
  if (!business.last_interaction_date) return true;
  if (business.next_follow_up) {
    return new Date(business.next_follow_up) <= new Date();
  }
  return isBusinessStale(business);
}

export function daysSinceLastInteraction(business) {
  if (!business.last_interaction_date) return null;
  return differenceInDays(new Date(), new Date(business.last_interaction_date));
}