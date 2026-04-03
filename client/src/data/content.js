export const trustMetrics = [
  { value: '3 days', label: 'Maximum response window before escalation' },
  { value: '4 levels', label: 'Cell, sector, district, and province routing' },
  { value: '24/7', label: 'Secure intake for reports, service issues, and abuse' },
];

export const focusAreas = [
  {
    title: 'Report with confidence',
    description:
      'Choose anonymous or identified reporting, attach evidence, and protect the dignity of the citizen all the way through review.',
  },
  {
    title: 'Track every action',
    description:
      'A case timeline shows when a complaint was received, assigned, responded to, or escalated to the next authority.',
  },
  {
    title: 'Reach institutions instantly',
    description:
      'Each office can publish a QR code so citizens open the exact reporting channel for that location without searching.',
  },
];

export const serviceHighlights = [
  'Bribery and extortion reporting',
  'Delayed service complaints',
  'Official fee awareness',
  'Voice-to-text complaint intake',
  'Institution-level QR access',
  'Escalation across administrative levels',
];

export const timelineStages = [
  {
    stage: 'Complaint received',
    time: '08:35',
    description: 'Citizen report is logged and routed to the institution on duty.',
  },
  {
    stage: 'Officer review',
    time: '10:10',
    description: 'Assigned officer checks category, urgency, and attached evidence.',
  },
  {
    stage: 'Citizen update',
    time: 'Day 2',
    description: 'The platform sends a progress message and keeps the case visible.',
  },
  {
    stage: 'Escalation if overdue',
    time: 'Day 3',
    description: 'If no action is recorded, the complaint moves to the next level automatically.',
  },
];

export const institutionCards = [
  {
    name: 'Cell Office',
    detail: 'First-response channel for local service delivery and basic case resolution.',
  },
  {
    name: 'Sector Office',
    detail: 'Escalation for unresolved issues, service misconduct, and repeated delays.',
  },
  {
    name: 'District Office',
    detail: 'Oversight dashboard, trend monitoring, and intervention for systemic issues.',
  },
  {
    name: 'National Oversight',
    detail: 'Cross-institution reporting, analytics, and anti-corruption supervision.',
  },
];

export const reportTypes = [
  'Bribery request',
  'Delayed service',
  'Abuse of authority',
  'Unknown service fee',
  'Missing response',
  'Other service issue',
];

export const sampleStatuses = [
  { id: 'CF-2026-0412', status: 'In review', level: 'Sector', eta: '1 day left' },
  { id: 'CF-2026-0401', status: 'Escalated', level: 'District', eta: 'Awaiting action' },
  { id: 'CF-2026-0377', status: 'Resolved', level: 'Cell', eta: 'Feedback sent' },
];
