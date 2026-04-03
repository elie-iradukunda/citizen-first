export const emergencyContacts = [
  {
    id: 'emergency',
    title: 'General Emergency',
    number: '112',
    description: 'Immediate danger, violence, or life-threatening events.',
  },
  {
    id: 'traffic-accident',
    title: 'Traffic Accidents',
    number: '113',
    description: 'Road crashes, traffic incidents, and emergency road response.',
  },
  {
    id: 'abuse-by-officer',
    title: 'Abuse by Public Officer',
    number: '3511',
    description: 'Report abuse, intimidation, or misconduct by an officer.',
  },
  {
    id: 'anti-corruption',
    title: 'Anti-Corruption Hotline',
    number: '997',
    description: 'Bribery requests, extortion, and corruption-related incidents.',
  },
  {
    id: 'maritime',
    title: 'Maritime Incidents',
    number: '110',
    description: 'Water transport incidents and maritime emergency reports.',
  },
  {
    id: 'driving-license',
    title: 'Driving License Queries',
    number: '118',
    description: 'Driving permit and transport-license support questions.',
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
    id: 'civil-registry-documents',
    title: 'Civil Registry Documents',
    category: 'Citizen identity',
    primaryOffice: 'Cell Executive Secretary and Sector Civil Registry Office',
    processingTime: '1 to 5 working days',
    feeNote: 'Check official notice board; never pay unofficial cash.',
    requirements: [
      'National ID or parent/guardian ID',
      'Application letter or request form',
      'Supporting civil status evidence where required',
    ],
  },
  {
    id: 'land-service-requests',
    title: 'Land and Property Service Requests',
    category: 'Land administration',
    primaryOffice: 'Sector Land Office and District Land Bureau',
    processingTime: '3 to 15 working days',
    feeNote: 'Use only official payment channels documented by the institution.',
    requirements: [
      'National ID',
      'Land reference details or certificate',
      'Transfer or correction forms if applicable',
    ],
  },
  {
    id: 'driving-license-support',
    title: 'Driving License Support',
    category: 'Transport',
    primaryOffice: 'Transport Service Desk and Traffic Unit',
    processingTime: '1 to 10 working days',
    feeNote: 'Always request receipt and verify amount before payment.',
    requirements: [
      'National ID',
      'Existing permit details (for renewal or correction)',
      'Application confirmation or exam reference',
    ],
  },
  {
    id: 'business-license-support',
    title: 'Business Registration and License Support',
    category: 'Business services',
    primaryOffice: 'Sector Business Services Desk and District One Stop Center',
    processingTime: '2 to 7 working days',
    feeNote: 'Follow official tariffs only and keep all transaction receipts.',
    requirements: [
      'Applicant National ID',
      'Business details and location',
      'Any required sector compliance certificates',
    ],
  },
  {
    id: 'social-assistance-requests',
    title: 'Social Assistance and Vulnerability Support',
    category: 'Social protection',
    primaryOffice: 'Cell Social Affairs Officer and Sector Social Protection Unit',
    processingTime: '3 to 14 working days',
    feeNote: 'Most social-assistance intake should not require informal fees.',
    requirements: [
      'National ID or household details',
      'Proof of socio-economic category when requested',
      'Written explanation of assistance need',
    ],
  },
  {
    id: 'complaint-follow-up',
    title: 'Public Service Complaint Follow-Up',
    category: 'Governance',
    primaryOffice: 'Institution Complaint Desk, Sector Office, then District Escalation Desk',
    processingTime: 'Up to 3 working days per administrative level',
    feeNote: 'Complaint submission should be free; report any payment demand.',
    requirements: [
      'Case ID if already submitted',
      'Service office and incident date',
      'Evidence such as receipts, screenshots, or witness detail',
    ],
  },
];

export const issueRoutingGuide = [
  {
    issue: 'Bribery or corruption',
    keywords: ['bribe', 'corruption', 'money requested', 'unofficial payment', 'extortion'],
    recommendedOffice: 'Anti-Corruption Desk at Sector or District level',
    firstAction: 'Collect basic evidence and report immediately through hotline 997 or official complaint platform.',
    escalationPath: ['Sector', 'District', 'Province', 'National oversight'],
  },
  {
    issue: 'Delayed service with no response',
    keywords: ['delay', 'pending', 'no response', 'waiting too long', 'missing response'],
    recommendedOffice: 'Institution Service Desk and Sector Administration Office',
    firstAction: 'Submit complaint with date of original request and request written tracking reference.',
    escalationPath: ['Cell', 'Sector', 'District', 'Province'],
  },
  {
    issue: 'Officer misconduct or abuse',
    keywords: ['abuse', 'harassment', 'threat', 'misconduct', 'intimidation'],
    recommendedOffice: 'Disciplinary Office and District Governance Unit',
    firstAction: 'Prioritize safety; report misconduct via 3511 and submit documented complaint.',
    escalationPath: ['Sector', 'District', 'National oversight'],
  },
  {
    issue: 'Driving license support',
    keywords: ['driving license', 'license', 'permit', 'traffic'],
    recommendedOffice: 'Traffic Service Desk and License Support Office',
    firstAction: 'Use hotline 118 for query triage and visit assigned service desk with ID and permit details.',
    escalationPath: ['Service desk', 'Sector transport focal point', 'District administration'],
  },
  {
    issue: 'Civil status documentation',
    keywords: ['birth certificate', 'marriage', 'civil registry', 'nida', 'id'],
    recommendedOffice: 'Cell office first, then Sector Civil Registry',
    firstAction: 'Bring identity document and supporting civil records, then request official form.',
    escalationPath: ['Cell', 'Sector', 'District civil registrar'],
  },
];

export const assistantQuestionExamples = [
  'How do I report a bribery request in my sector office?',
  'Where can I renew my driving license and what do I need?',
  'My service request is delayed, who should I contact first?',
  'What is the emergency number for abuse by an officer?',
  'Which office handles civil registry correction in my district?',
];
