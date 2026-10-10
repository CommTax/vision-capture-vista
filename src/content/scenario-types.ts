// src/content/scenario-types.ts
export type ScenarioType =
  | 'behavioral' | 'situational' | 'functional' | 'coaching' | 'leadership'
  | 'self-intro' | 'negotiation' | 'motivational' | 'self-awareness'
  | 'technical' | 'strategic' | 'custom' | 'activity';

export const SCENARIO_TYPE_META: Record<
  ScenarioType,
  { label: string; icon: string; hint: string }
> = {
  behavioral:       { label: 'Behavioural',    icon: 'message-circle', hint: 'Tell me about a time…' },
  situational:      { label: 'Situational',    icon: 'compass',        hint: 'What would you do if…' },
  functional:       { label: 'Functional',     icon: 'wrench',         hint: 'How would you handle…' },
  coaching:         { label: 'Coaching',       icon: 'users',          hint: 'How do you handle…' },
  leadership:       { label: 'Leadership',     icon: 'crown',          hint: 'How did you lead…' },
  'self-intro':     { label: 'Self Intro',     icon: 'user',           hint: 'Tell me about yourself' },
  negotiation:      { label: 'Negotiation',    icon: 'handshake',      hint: 'What are your expectations…' },
  motivational:     { label: 'Motivational',   icon: 'sparkles',       hint: 'Why this role?' },
  'self-awareness': { label: 'Self-Awareness', icon: 'eye',            hint: 'What is your weakness?' },
  technical:        { label: 'Technical',      icon: 'code',           hint: 'Walk me through how…' },
  strategic:        { label: 'Strategic',      icon: 'target',         hint: 'Where do you see…' },
  custom:           { label: 'Custom',         icon: 'pencil-line',    hint: 'Your own question' },
  activity:         { label: 'General',        icon: 'layers',         hint: 'Open practice' },
};

export const SCENARIO_GROUP_ORDER: ScenarioType[] = [
  'behavioral', 'situational', 'functional', 'coaching', 'leadership',
  'self-intro', 'negotiation', 'motivational', 'self-awareness',
  'technical', 'strategic', 'custom', 'activity',
];
