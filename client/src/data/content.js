export const trustMetrics = [
  { value: '3 days', label: 'Maximum response window before RIB escalation review' },
  { value: '6 stages', label: 'QR access, evidence triage, intake, investigation, review, oversight' },
  { value: '24/7', label: 'Secure intake for corruption reports and citizen feedback' },
];

export const focusAreas = [
  {
    title: 'Report with confidence',
    description:
      'Choose anonymous or identified reporting, attach evidence, and protect the citizen through the RIB review workflow.',
  },
  {
    title: 'Track every action',
    description:
      'A case timeline shows when a report was received, assigned, responded to, or escalated for investigation review.',
  },
  {
    title: 'Reach RIB instantly',
    description:
      'A public QR code opens the correct RIB reporting channel without asking staff where to go physically.',
  },
];

export const serviceHighlights = [
  'Bribery and extortion reporting',
  'Abuse of authority reporting',
  'Unofficial fee awareness',
  'Evidence and voice-note support',
  'RIB QR intake access',
  'Escalation to investigation and oversight',
];

export const timelineStages = [
  {
    stage: 'QR report received',
    time: '08:35',
    description: 'Citizen report is logged and routed to the RIB anti-corruption intake workflow.',
  },
  {
    stage: 'Evidence triage',
    time: '10:10',
    description: 'RIB checks category, urgency, confidentiality needs, and attached evidence.',
  },
  {
    stage: 'Citizen update',
    time: 'Day 2',
    description: 'The platform keeps the case visible through status updates and deadline tracking.',
  },
  {
    stage: 'Escalation if overdue',
    time: 'Day 3',
    description: 'If no action is recorded, the case moves to investigation or supervisory review.',
  },
];

export const institutionCards = [
  {
    name: 'RIB Public QR Reporting Access Point',
    detail: 'First access channel where citizens scan a QR code and open the reporting form.',
  },
  {
    name: 'RIB Evidence Preservation and Triage Desk',
    detail: 'Reviews screenshots, receipts, documents, and voice notes before intake review.',
  },
  {
    name: 'RIB Anti-Corruption Intake Desk',
    detail: 'Receives structured reports, protects confidentiality, and assigns the case path.',
  },
  {
    name: 'RIB Supervisory Review and Escalation Unit',
    detail: 'Monitors overdue, unresolved, and sensitive cases through oversight dashboards.',
  },
];

export const reportTypes = [
  'Bribery request',
  'Abuse of authority',
  'Unknown service fee',
  'Intimidation or retaliation risk',
  'Missing response',
  'Other corruption issue',
];

export const sampleStatuses = [
  { id: 'CF-2026-0412', status: 'In review', level: 'RIB intake', eta: '1 day left' },
  { id: 'CF-2026-0401', status: 'Escalated', level: 'Investigation review', eta: 'Awaiting action' },
  { id: 'CF-2026-0395', status: 'Resolved', level: 'Evidence triage', eta: 'Feedback sent' },
];
