export const emergencyContacts = [
  {
    id: 'anti-corruption',
    title: 'Anti-Corruption Hotline',
    number: '997',
    description: 'Bribery requests, extortion, unofficial payments, and corruption-related incidents.',
  },
  {
    id: 'abuse-by-officer',
    title: 'Abuse by Public Officer',
    number: '3511',
    description: 'Report abuse, intimidation, retaliation risk, or misconduct by a public officer.',
  },
  {
    id: 'emergency',
    title: 'General Emergency',
    number: '112',
    description: 'Immediate danger, violence, or life-threatening events.',
  },
  {
    id: 'rib-qr-intake',
    title: 'RIB QR Reporting Access',
    number: 'QR',
    description: 'Scan the platform QR code to open the structured RIB reporting form.',
  },
  {
    id: 'fire-rescue',
    title: 'Fire and Rescue',
    number: '111',
    description: 'Fire outbreaks, rescue support, and urgent hazard response.',
  },
];

export const publicServices = [
  {
    id: 'qr-corruption-report-intake',
    title: 'QR Corruption Report Intake',
    category: 'RIB anti-corruption reporting',
    primaryOffice: 'RIB Public QR Reporting Access Point and RIB Anti-Corruption Intake Desk',
    processingTime: 'Immediate submission, then up to 3 working days for response or escalation',
    feeNote: 'Reporting corruption through this platform is free.',
    requirements: [
      'Incident date and location',
      'Service or office involved',
      'Clear description of what happened',
      'Evidence where available, such as receipt, screenshot, or voice note',
    ],
  },
  {
    id: 'confidential-citizen-feedback',
    title: 'Confidential Citizen Feedback',
    category: 'Protected reporting',
    primaryOffice: 'RIB Anti-Corruption Intake Desk',
    processingTime: 'Up to 3 working days before response or escalation',
    feeNote: 'No unofficial payment should be made to submit feedback.',
    requirements: [
      'Anonymous or verified reporting mode',
      'Reason confidentiality is needed',
      'Safe contact detail if the citizen wants updates',
    ],
  },
  {
    id: 'evidence-preservation',
    title: 'Evidence and Voice-Note Support',
    category: 'Evidence handling',
    primaryOffice: 'RIB Evidence Preservation and Triage Desk',
    processingTime: 'Reviewed during intake triage',
    feeNote: 'Evidence support is free and should be used responsibly.',
    requirements: [
      'Screenshots, documents, receipts, or payment proof',
      'Voice note when text reporting is difficult',
      'Short explanation connecting evidence to the reported incident',
    ],
  },
  {
    id: 'case-status-tracking',
    title: 'Case Status Tracking',
    category: 'Citizen feedback',
    primaryOffice: 'RIB Intake and Dashboard Oversight',
    processingTime: 'Visible immediately after a case ID is issued',
    feeNote: 'Use the case ID only through official tracking pages.',
    requirements: [
      'Case ID generated after submission',
      'Citizen reference for verified reports',
      'Follow-up note if feedback is not satisfactory',
    ],
  },
  {
    id: 'escalation-dashboard-oversight',
    title: 'Escalation and Dashboard Oversight',
    category: 'Institutional accountability',
    primaryOffice: 'RIB Supervisory Review and Escalation Unit',
    processingTime: 'Triggered after missed deadlines or sensitive case review',
    feeNote: 'Escalation is part of the accountability workflow and is free.',
    requirements: [
      'Open or unresolved case',
      'Deadline breach or sensitive corruption risk',
      'Review note from intake or investigation officer',
    ],
  },
];

export const issueRoutingGuide = [
  {
    issue: 'Bribery or unofficial payment',
    keywords: ['bribe', 'corruption', 'money requested', 'unofficial payment', 'extortion'],
    recommendedOffice: 'RIB Anti-Corruption Intake Desk',
    firstAction:
      'Preserve evidence, submit through the QR reporting form, or call hotline 997 for urgent corruption reporting.',
    escalationPath: ['RIB Intake', 'Investigation Review', 'Supervisory Review', 'National Oversight'],
  },
  {
    issue: 'Abuse of authority or intimidation',
    keywords: ['abuse', 'harassment', 'threat', 'misconduct', 'intimidation', 'retaliation'],
    recommendedOffice: 'RIB Economic and Financial Crimes Directorate',
    firstAction:
      'Prioritize safety, document the incident, and use confidential reporting if exposure could create risk.',
    escalationPath: ['RIB Intake', 'Investigation Review', 'Supervisory Review'],
  },
  {
    issue: 'Missing response after submission',
    keywords: ['delay', 'pending', 'no response', 'waiting too long', 'missing response'],
    recommendedOffice: 'RIB Supervisory Review and Escalation Unit',
    firstAction: 'Track the case ID and request escalation when the response window has passed.',
    escalationPath: ['Evidence Triage', 'RIB Intake', 'Investigation Review', 'Supervisory Review'],
  },
  {
    issue: 'Evidence preservation',
    keywords: ['receipt', 'screenshot', 'recording', 'voice note', 'proof', 'document'],
    recommendedOffice: 'RIB Evidence Preservation and Triage Desk',
    firstAction: 'Attach available evidence and explain how it relates to the reported corruption concern.',
    escalationPath: ['Evidence Triage', 'RIB Intake', 'Investigation Review'],
  },
];

export const assistantQuestionExamples = [
  'How do I report a bribery request to RIB?',
  'Can I submit a corruption complaint anonymously?',
  'What evidence should I attach before submitting a RIB report?',
  'How long should I wait before escalating a missing response?',
  'Which RIB workflow stage reviews sensitive corruption cases?',
];
