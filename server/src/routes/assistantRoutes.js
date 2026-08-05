import { Router } from 'express';
import { z } from 'zod';
import { emergencyContacts, issueRoutingGuide, publicServices } from '../data/publicServiceData.js';
import { rateLimit } from '../middleware/rateLimit.js';

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
      : 'Recommended office: start with the RIB Anti-Corruption Intake Desk or the QR reporting form.';

  const locationHint = [sector, district].filter(Boolean).join(', ');
  const locationLine = locationHint
    ? `Location context: use ${locationHint} as the case location when submitting the report.`
    : 'Location context: share the district or area where the incident happened for more precise guidance.';

  const actionLine = route
    ? `First action: ${route.firstAction}`
    : service
      ? `First action: carry ${service.requirements.slice(0, 2).join(' and ')}.`
      : 'First action: describe your issue, date, institution, and attach any evidence.';

  const escalationLine = route
    ? `Escalation path: ${route.escalationPath.join(' -> ')}.`
    : 'Escalation path: QR Access -> Evidence Triage -> RIB Intake -> Investigation Review -> Supervisory Review -> National Oversight.';

  const docsLine = service
    ? `Required Information/Documents: ${service.requirements.join(', ')}`
    : 'Required Information/Documents: incident date, location, office or person involved, requested amount if any, and evidence where available.';

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

  const platformKnowledge = `
Platform capabilities:
- Citizens can submit anonymous or verified corruption reports.
- Case-study institution: Rwanda Investigation Bureau (RIB), Kigali, Rwanda.
- Workflow: Public QR Access -> Evidence Triage -> RIB Anti-Corruption Intake -> Investigation Review -> Supervisory Review -> National Oversight.
- RIB workflow users register departments, staff, and reporting services after invite-only onboarding.
- The system generates QR access after workflow-point registration.
- Dashboard access requires login with access key.
- Public pages include hotlines, RIB services, reporting, tracking, and assistant guidance.
`;

  return `
You are SACCFP AI Assistant for the RIB anti-corruption and citizen feedback case study.
You must provide practical, lawful, and safe reporting guidance for citizens.

Rules:
1. Answer in ${language === 'rw' ? 'Kinyarwanda' : 'English'}.
2. If question is related to danger, abuse, or corruption, include the most relevant hotline number.
3. Always include:
   - who can receive or review the report first (RIB workflow point)
   - next steps
   - what evidence or information to prepare
   - escalation path when no response is given
4. If the question is about registration, explain required fields and RIB workflow stages clearly.
5. Never invent laws, prices, district names, contacts, or technical features. If unknown, say so and give a safe next step.
6. Remind citizens that corruption reporting through this platform is free.
7. Use this response format:
   - Direct Answer
   - Recommended Office
   - Steps to Follow
   - Required Information/Documents
   - Escalation Path
   - Emergency/Hotline (if relevant)
8. Keep answer concise, practical, and respectful.

Citizen location context:
- Sector/context: ${sector ?? 'not provided'}
- District/area: ${district ?? 'not provided'}

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

// The assistant is deliberately open — a citizen must be able to ask how to
// report before they have an account. But it forwards to a paid model, so
// without a budget per caller it is also a free bill generator.
const assistantLimiter = rateLimit({
  name: 'assistant-ask',
  max: 20,
  windowMs: 10 * 60 * 1000,
  message: 'Too many assistant questions. Please wait a few minutes and try again.',
});

router.post('/ask', assistantLimiter, async (request, response, next) => {
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
