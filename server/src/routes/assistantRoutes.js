import { Router } from 'express';
import { z } from 'zod';
import { emergencyContacts, issueRoutingGuide, publicServices } from '../data/publicServiceData.js';
import {
  GOVERNMENT_LEVELS,
  NEXT_LEVEL_MAP,
  POSITION_TEMPLATES,
  RWANDA_ADMINISTRATIVE_STRUCTURE,
} from '../data/registrationData.js';

const router = Router();

const askAssistantSchema = z.object({
  question: z.string().min(4).max(1200),
  sector: z.string().max(120).optional(),
  district: z.string().max(120).optional(),
  language: z.enum(['en', 'rw']).optional(),
});

function matchGuides(question) {
  const normalizedQuestion = question.toLowerCase();
  return issueRoutingGuide.filter((guide) =>
    guide.keywords.some((keyword) => normalizedQuestion.includes(keyword)),
  );
}

function matchServices(question) {
  const normalizedQuestion = question.toLowerCase();
  return publicServices.filter(
    (service) =>
      normalizedQuestion.includes(service.title.toLowerCase()) ||
      normalizedQuestion.includes(service.category.toLowerCase()) ||
      service.requirements.some((item) => normalizedQuestion.includes(item.toLowerCase())),
  );
}

function buildFallbackAnswer({ question, sector, district }) {
  const guideMatches = matchGuides(question);
  const serviceMatches = matchServices(question);
  const route = guideMatches[0];
  const service = serviceMatches[0];

  const officeLine = route
    ? `Recommended office: ${route.recommendedOffice}.`
    : service
      ? `Recommended office: ${service.primaryOffice}.`
      : 'Recommended office: start at your Cell office or Sector front desk for guided routing.';

  const locationHint = [sector, district].filter(Boolean).join(', ');
  const locationLine = locationHint
    ? `Location context: prioritize the service desk in ${locationHint}.`
    : 'Location context: share your sector or district for more precise office guidance.';

  const actionLine = route
    ? `First action: ${route.firstAction}`
    : service
      ? `First action: carry ${service.requirements.slice(0, 2).join(' and ')}.`
      : 'First action: describe your issue, date, institution, and attach any evidence.';

  const escalationLine = route
    ? `Escalation path: ${route.escalationPath.join(' -> ')}.`
    : 'Escalation path: Cell -> Sector -> District -> Province when no response is given.';

  const docsLine = service
    ? `Required Information/Documents: ${service.requirements.join(', ')}`
    : 'Required Information/Documents: National ID, service request details, institution name, and evidence where available.';

  return [
    `Direct Answer: Based on your question, here is the safest route.`,
    `Recommended Office: ${officeLine.replace('Recommended office: ', '').replace(/\.$/, '')}.`,
    `Steps to Follow: ${actionLine.replace('First action: ', '')}`,
    docsLine,
    `Escalation Path: ${escalationLine.replace('Escalation path: ', '')}`,
    `Location Context: ${locationLine.replace('Location context: ', '')}`,
  ].join('\n');
}

function buildSystemPrompt({ question, sector, district, language }) {
  const compactServices = publicServices
    .map(
      (service) =>
        `- ${service.title}: office=${service.primaryOffice}; time=${service.processingTime}; fee_note=${service.feeNote}`,
    )
    .join('\n');

  const compactGuides = issueRoutingGuide
    .map(
      (guide) =>
        `- ${guide.issue}: office=${guide.recommendedOffice}; first_action=${guide.firstAction}; path=${guide.escalationPath.join(' -> ')}`,
    )
    .join('\n');

  const compactEmergency = emergencyContacts
    .map((contact) => `- ${contact.title}: ${contact.number}`)
    .join('\n');

  const hierarchyRules = Object.entries(NEXT_LEVEL_MAP)
    .map(([role, nextLevel]) => `- ${role} can invite ${nextLevel ?? 'no next level'}`)
    .join('\n');

  const levelTemplates = Object.entries(POSITION_TEMPLATES)
    .map(
      ([level, template]) =>
        `- ${level}: title=${template.title}; kinyarwanda=${template.titleKinyarwanda}; reports_to=${template.reportsTo}`,
    )
    .join('\n');

  const provinceSummary = RWANDA_ADMINISTRATIVE_STRUCTURE.map(
    (entry) => `${entry.province} (${entry.districts.length} districts)`,
  ).join(', ');

  const platformKnowledge = `
Platform capabilities:
- Citizens register with location: country -> province -> district -> sector -> cell -> village.
- Institution registration is secure and invite-only.
- Hierarchical flow: National admin -> Province -> District -> Sector -> Cell -> Village.
- Leaders register departments and employees after institution onboarding.
- System generates QR code after institution registration.
- Dashboard access requires login with access key.
- Emergency pages and reporting pages are available to the public.
`;

  return `
You are Citizen First AI Assistant for Rwanda public service guidance.
You must provide practical, lawful, and safe guidance for citizens.

Rules:
1. Answer in ${language === 'rw' ? 'Kinyarwanda' : 'English'}.
2. If question is related to danger, abuse, or corruption, include the most relevant hotline number.
3. Always include:
   - who can solve the issue first (office)
   - next steps
   - what documents or information to prepare
   - escalation path when no response is given
4. If the question is about registration, explain required fields and hierarchy clearly.
5. Never invent laws, prices, district names, contacts, or technical features. If unknown, say so and give a safe next step.
6. If exact fee is unknown, advise checking official notice board and official payment channels.
7. Use this response format:
   - Direct Answer
   - Recommended Office
   - Steps to Follow
   - Required Information/Documents
   - Escalation Path
   - Emergency/Hotline (if relevant)
8. Keep answer concise, practical, and respectful.

Citizen location context:
- Sector: ${sector ?? 'not provided'}
- District: ${district ?? 'not provided'}

Rwanda governance levels:
- ${GOVERNMENT_LEVELS.join(' -> ')}

Role invite rules:
${hierarchyRules}

Official position templates:
${levelTemplates}

Province summary:
${provinceSummary}

${platformKnowledge}

Service catalog:
${compactServices}

Issue routing guide:
${compactGuides}

Emergency contacts:
${compactEmergency}

Citizen question:
${question}
`;
}

async function queryGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const configuredModel = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash';
  const candidateModels = [
    configuredModel,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
  ];

  for (const model of [...new Set(candidateModels)]) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildSystemPrompt(payload) }] }],
        generationConfig: {
          temperature: 0.25,
          topP: 0.95,
          maxOutputTokens: 700,
        },
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        continue;
      }
      const errorText = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();
    if (text) {
      return text;
    }
  }

  return null;
}

router.post('/ask', async (request, response, next) => {
  try {
    const parseResult = askAssistantSchema.safeParse(request.body);
    if (!parseResult.success) {
      return response.status(400).json({
        message: 'Invalid assistant request payload.',
        errors: parseResult.error.flatten(),
      });
    }

    const payload = parseResult.data;
    const guideMatches = matchGuides(payload.question).slice(0, 2);
    const serviceMatches = matchServices(payload.question).slice(0, 2);

    let answer = buildFallbackAnswer(payload);
    let provider = 'local-fallback';

    try {
      const geminiAnswer = await queryGemini(payload);
      if (geminiAnswer) {
        answer = geminiAnswer;
        provider = 'gemini';
      }
    } catch (error) {
      console.error(error);
    }

    const relevantEmergency = emergencyContacts.filter((contact) => {
      const lowercaseQuestion = payload.question.toLowerCase();
      return (
        lowercaseQuestion.includes('emergency') ||
        lowercaseQuestion.includes('accident') ||
        lowercaseQuestion.includes('abuse') ||
        lowercaseQuestion.includes('bribe') ||
        lowercaseQuestion.includes('corruption') ||
        lowercaseQuestion.includes(contact.title.toLowerCase())
      );
    });

    return response.json({
      provider,
      answer,
      matchedGuidance: guideMatches,
      matchedServices: serviceMatches,
      emergencyContacts: relevantEmergency.length > 0 ? relevantEmergency : emergencyContacts.slice(0, 3),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
