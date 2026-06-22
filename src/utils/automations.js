import { addDays } from 'date-fns';
import { base44 } from '@/api/base44Client';

const stageAutomations = {
  contacted: {
    taskTitle: (name) => `Send intro email to ${name}`,
    taskPriority: 'medium',
    taskDays: 2,
    interactionType: 'note',
    interactionTitle: 'Moved to Contacted',
  },
  meeting_scheduled: {
    taskTitle: (name) => `Prepare meeting agenda for ${name}`,
    taskPriority: 'high',
    taskDays: 1,
    interactionType: 'note',
    interactionTitle: 'Meeting scheduled',
  },
  in_discussion: {
    taskTitle: (name) => `Draft proposal for ${name}`,
    taskPriority: 'medium',
    taskDays: 5,
    interactionType: 'meeting',
    interactionTitle: 'Initial discussion held',
  },
  collaborating: {
    taskTitle: (name) => `Set up collaboration framework with ${name}`,
    taskPriority: 'medium',
    taskDays: 7,
    interactionType: 'note',
    interactionTitle: 'Collaboration started',
  },
  partnered: {
    taskTitle: (name) => `Schedule quarterly review with ${name}`,
    taskPriority: 'low',
    taskDays: 30,
    interactionType: 'note',
    interactionTitle: 'Partnership formalized 🎉',
  },
};

export function runStageChangeAutomations(business, oldStage, newStage, userId, userName) {
  const config = stageAutomations[newStage];
  if (!config) return [];

  const dueDate = addDays(new Date(), config.taskDays).toISOString().slice(0, 10);
  const today = new Date().toISOString();

  const promises = [
    base44.entities.Task.create({
      title: config.taskTitle(business.name),
      priority: config.taskPriority,
      due_date: dueDate,
      status: 'todo',
      business_id: business.id,
      business_name: business.name,
      assigned_to: userId,
      assigned_to_name: userName,
    }),
    base44.entities.Interaction.create({
      business_id: business.id,
      business_name: business.name,
      type: config.interactionType,
      title: config.interactionTitle,
      notes: `Pipeline stage changed from ${oldStage} to ${newStage}`,
      interaction_date: today,
      logged_by_id: userId,
      logged_by_name: userName,
    }),
  ];

  return promises;
}