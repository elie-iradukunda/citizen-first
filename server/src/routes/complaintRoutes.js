import { Router } from 'express';
import { z } from 'zod';
import { complaints } from '../data/mockData.js';
import { getAuthUserFromRequest } from '../middleware/authMiddleware.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Case IDs are sequential, so an unthrottled lookup lets someone walk the whole
// register to learn which offices are under investigation.
const publicTrackLimiter = rateLimit({
  name: 'public-case-track',
  max: 30,
  windowMs: 60 * 1000,
  message: 'Too many case lookups. Please wait a minute and try again.',
});

// Public reporting must stay open — that is the point of the platform — but not
// so open that the officers' queue can be flooded with junk.
const publicReportLimiter = rateLimit({
  name: 'public-case-create',
  max: 5,
  windowMs: 10 * 60 * 1000,
  message: 'Too many reports submitted from this connection. Please wait before sending another.',
});

// Case IDs are short and sequential, so this lookup has to assume the caller
// guessed the ID rather than reported the case. It therefore exposes only
// progress facts — never the reporter, the evidence, the accused, the report
// text, or internal review notes. Citizens who need the full record read it
// from their own authenticated dashboard instead.
function buildPublicCaseView(item) {
  return {
    id: item.id,
    status: item.status,
    currentLevel: item.currentLevel,
    category: item.category,
    issueType: item.issueType ?? 'corruption_issue',
    reportingMode: item.reportingMode ?? 'verified',
    submittedAt: item.submittedAt,
    updatedAt: item.updatedAt,
    deadlineAt: item.deadlineAt,
    resolvedAt: item.resolvedAt ?? null,
    sourceInstitutionName: item.sourceInstitutionName ?? null,
    serviceName: item.serviceName ?? null,
    hasOfficialResponse: Boolean(item.response),
  };
}

const createComplaintSchema = z.object({
  category: z.string().min(3),
  institutionId: z.number().int().positive().default(3),
  message: z.string().min(20),
  reportingMode: z.enum(['anonymous', 'verified']),
  citizenReference: z.string().optional(),
  sourceInstitutionSlug: z.string().optional(),
  submittedVia: z.enum(['public', 'qr', 'dashboard']).default('public'),
  serviceName: z.string().optional(),
});

const ribLocation = {
  country: 'Rwanda',
  province: 'Kigali City',
  district: 'Gasabo',
  sector: 'Kacyiru',
  cell: 'Kamatamu',
  village: 'Ubumwe',
};

const ribSourceByInstitutionId = {
  1: {
    level: 'village',
    institutionId: 'RIB-QR',
    slug: 'rib-public-qr-reporting-access-point',
    name: 'RIB Public QR Reporting Access Point',
    officerId: 101,
  },
  2: {
    level: 'cell',
    institutionId: 'RIB-EVIDENCE',
    slug: 'rib-evidence-preservation-and-triage-desk',
    name: 'RIB Evidence Preservation and Triage Desk',
    officerId: 102,
  },
  3: {
    level: 'sector',
    institutionId: 'RIB-INTAKE',
    slug: 'rib-anti-corruption-intake-desk',
    name: 'RIB Anti-Corruption Intake Desk',
    officerId: 103,
  },
  4: {
    level: 'district',
    institutionId: 'RIB-FIN',
    slug: 'rib-economic-and-financial-crimes-directorate',
    name: 'RIB Economic and Financial Crimes Directorate',
    officerId: 104,
  },
  5: {
    level: 'province',
    institutionId: 'RIB-SUPERVISION',
    slug: 'rib-supervisory-review-and-escalation-unit',
    name: 'RIB Supervisory Review and Escalation Unit',
    officerId: 105,
  },
  6: {
    level: 'national',
    institutionId: 'RIB-NATIONAL',
    slug: 'rib-national-oversight-command',
    name: 'RIB National Oversight Command',
    officerId: 106,
  },
};

// Listing every case is an oversight action, not a public one: the raw records
// carry reporter identity and evidence. Reviewers use the dashboard endpoints,
// which scope results to what that role is allowed to see.
router.get('/', (request, response) => {
  const authContext = getAuthUserFromRequest(request);
  if (!authContext) {
    return response.status(401).json({
      message: 'Authentication required to list cases.',
    });
  }

  if (!['national_admin', 'oversight_admin'].includes(authContext.user.role)) {
    return response.status(403).json({
      message: 'Only national oversight can list every case. Use your dashboard queue instead.',
    });
  }

  return response.json({
    items: complaints.map((item) => buildPublicCaseView(item)),
  });
});

router.get('/:id', publicTrackLimiter, (request, response) => {
  const complaint = complaints.find((item) => item.id === request.params.id);

  if (!complaint) {
    return response.status(404).json({
      message: 'Complaint not found.',
    });
  }

  return response.json({
    item: buildPublicCaseView(complaint),
  });
});

router.post('/', publicReportLimiter, (request, response) => {
  const validationResult = createComplaintSchema.safeParse(request.body);

  if (!validationResult.success) {
    return response.status(400).json({
      message: 'Invalid complaint payload.',
      errors: validationResult.error.flatten(),
    });
  }

  const source =
    ribSourceByInstitutionId[validationResult.data.institutionId] ?? ribSourceByInstitutionId[3];

  const nextComplaint = {
    id: `CF-${new Date().getFullYear()}-${String(complaints.length + 412).padStart(4, '0')}`,
    issueType: 'corruption_issue',
    category: validationResult.data.category,
    institutionId: validationResult.data.institutionId,
    sourceInstitutionId: source.institutionId,
    sourceInstitutionSlug: validationResult.data.sourceInstitutionSlug ?? source.slug,
    sourceInstitutionName: source.name,
    serviceName: validationResult.data.serviceName ?? 'QR corruption report intake',
    message: validationResult.data.message,
    reportingMode: validationResult.data.reportingMode,
    submittedVia: validationResult.data.submittedVia,
    citizenReference:
      validationResult.data.citizenReference ??
      `CID-2026-RIB-${String(Math.floor(1000 + Math.random() * 9000))}`,
    status: 'submitted',
    currentLevel: source.level,
    initialLevel: source.level,
    submittedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deadlineAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    assignedOfficerId: source.officerId,
    reporterUserId: null,
    reporterProfile: null,
    location: ribLocation,
    taggedLeaderEmployeeIds: [],
    accusedLeaderEmployeeIds: [],
    accusedLeaders: [],
    responses: [],
    response: null,
    feedbackStatus: null,
    autoEscalateEnabled: false,
  };

  complaints.unshift(nextComplaint);

  return response.status(201).json({
    message: 'Complaint received successfully.',
    item: buildPublicCaseView(nextComplaint),
  });
});

export default router;
