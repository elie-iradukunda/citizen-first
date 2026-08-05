// Spreadsheet export.
//
// Output is CSV rather than a binary .xlsx: Excel opens it directly (the BOM
// below is what makes it pick UTF-8, so Kinyarwanda characters survive), and it
// costs no dependency on a spreadsheet library — which matters for a file that
// carries corruption-case data and therefore wants a small trusted surface.

const UTF8_BOM = '﻿';

// Excel treats a leading =, +, -, or @ as a formula, so a crafted field value
// can run as a command when the file is opened. Every value is neutralised
// before it is written.
function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return '';
  }

  let text = String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  if (/["\n\r,]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

/**
 * @param {Array<{key: string, label: string}>} columns
 * @param {Array<object>} rows
 */
export function buildCsv(columns, rows) {
  const header = columns.map((column) => escapeCsvValue(column.label)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeCsvValue(row[column.key])).join(','),
  );

  return `${UTF8_BOM}${[header, ...body].join('\r\n')}\r\n`;
}

export function sendCsv(response, filenameBase, columns, rows) {
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `${filenameBase}-${stamp}.csv`;

  response.setHeader('Content-Type', 'text/csv; charset=utf-8');
  response.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  // These files contain case data; keep them out of shared caches.
  response.setHeader('Cache-Control', 'no-store');

  return response.send(buildCsv(columns, rows));
}

function formatDateTime(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  // Excel parses this shape as a date without needing a locale guess.
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function formatLocation(location = {}) {
  return [location.village, location.cell, location.sector, location.district, location.province]
    .filter(Boolean)
    .join(', ');
}

function readableLabel(value = '') {
  return String(value).replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

// Case rows are built from the already-redacted dashboard summaries, so an
// anonymous reporter stays anonymous in the spreadsheet too. That is the whole
// reason this maps summaries rather than raw complaint records.
export const CASE_COLUMNS = [
  { key: 'id', label: 'Case ID' },
  { key: 'status', label: 'Status' },
  { key: 'issueType', label: 'Issue type' },
  { key: 'category', label: 'Category' },
  { key: 'currentLevel', label: 'Current level' },
  { key: 'institution', label: 'Reviewing institution' },
  { key: 'assignedOfficer', label: 'Assigned officer' },
  { key: 'reportingMode', label: 'Reporting mode' },
  { key: 'submittedVia', label: 'Submitted via' },
  { key: 'reporterName', label: 'Reporter' },
  { key: 'reporterPhone', label: 'Reporter phone' },
  { key: 'location', label: 'Location' },
  { key: 'sourceInstitution', label: 'Scanned institution' },
  { key: 'serviceName', label: 'Service' },
  { key: 'accusedOfficials', label: 'Accused officials' },
  { key: 'reportedPersonName', label: 'Reported person' },
  { key: 'amountRequestedRwf', label: 'Amount requested (RWF)' },
  { key: 'evidence', label: 'Evidence attached' },
  { key: 'submittedAt', label: 'Submitted at' },
  { key: 'deadlineAt', label: 'Response deadline' },
  { key: 'respondedAt', label: 'Responded at' },
  { key: 'resolvedAt', label: 'Resolved at' },
  { key: 'escalationCount', label: 'Times escalated' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'officialResponse', label: 'Official response' },
];

export function toCaseRow(summary) {
  const evidence = [
    summary.evidenceImage ? 'Photo' : null,
    summary.evidenceDocument ? 'Document' : null,
    summary.voiceNote ? 'Voice note' : null,
  ].filter(Boolean);

  const isOpen = ['submitted', 'in_review', 'escalated', 'responded'].includes(summary.status);

  return {
    id: summary.id,
    status: readableLabel(summary.status),
    issueType: readableLabel(summary.issueType),
    category: summary.category,
    currentLevel: readableLabel(summary.currentLevel),
    institution: summary.institution,
    assignedOfficer: summary.assignedOfficer,
    reportingMode: readableLabel(summary.reportingMode),
    submittedVia: readableLabel(summary.submittedVia),
    // Null for anonymous reports: the summary was redacted upstream.
    reporterName: summary.reporterProfile?.fullName ?? 'Anonymous',
    reporterPhone: summary.reporterProfile?.phone ?? '',
    location: formatLocation(summary.location),
    sourceInstitution: summary.sourceInstitution?.institutionName ?? '',
    serviceName: summary.serviceName ?? summary.sourceInstitution?.serviceName ?? '',
    accusedOfficials: (summary.accusedLeaders ?? [])
      .map((leader) => `${leader.leaderName} (${leader.positionTitle ?? 'Official'})`)
      .join('; '),
    reportedPersonName: summary.reportedPersonName ?? '',
    amountRequestedRwf: summary.amountRequestedRwf ?? '',
    evidence: evidence.length > 0 ? evidence.join(', ') : 'None',
    submittedAt: formatDateTime(summary.submittedAt),
    deadlineAt: formatDateTime(summary.deadlineAt),
    respondedAt: formatDateTime(summary.response?.respondedAt),
    resolvedAt: formatDateTime(summary.resolvedAt),
    escalationCount: (summary.escalationHistory ?? []).length,
    overdue: isOpen && summary.deadlineAt && new Date(summary.deadlineAt) < new Date() ? 'Yes' : 'No',
    officialResponse: summary.response?.message ?? '',
  };
}

export const INSTITUTION_COLUMNS = [
  { key: 'institutionId', label: 'Institution ID' },
  { key: 'institutionName', label: 'Institution' },
  { key: 'level', label: 'Level' },
  { key: 'institutionType', label: 'Type' },
  { key: 'location', label: 'Location' },
  { key: 'officialEmail', label: 'Official email' },
  { key: 'officialPhone', label: 'Official phone' },
  { key: 'officeAddress', label: 'Office address' },
  { key: 'servicesCount', label: 'Services' },
  { key: 'employeeCount', label: 'Staff' },
  { key: 'childUnits', label: 'Registered child units' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Registered at' },
];

export function toInstitutionRow(institution) {
  return {
    institutionId: institution.institutionId,
    institutionName: institution.institutionName,
    level: readableLabel(institution.level),
    institutionType: institution.institutionType ?? '',
    location: formatLocation(institution.location),
    officialEmail: institution.officialEmail ?? '',
    officialPhone: institution.officialPhone ?? '',
    officeAddress: institution.officeAddress ?? '',
    servicesCount: institution.services?.length ?? 0,
    employeeCount: institution.employeeCount ?? 0,
    childUnits: institution.registeredChildUnits ?? 0,
    status: readableLabel(institution.status ?? 'active'),
    createdAt: formatDateTime(institution.createdAt),
  };
}

export const CITIZEN_COLUMNS = [
  { key: 'citizenId', label: 'Citizen ID' },
  { key: 'fullName', label: 'Full name' },
  { key: 'nationalId', label: 'National ID' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'gender', label: 'Gender' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Registered at' },
];

export function toCitizenRow(citizen) {
  return {
    citizenId: citizen.citizenId,
    fullName: citizen.fullName,
    nationalId: citizen.nationalId,
    phone: citizen.phone,
    email: citizen.email,
    gender: citizen.gender ?? '',
    location: formatLocation(citizen.location),
    status: readableLabel(citizen.status ?? 'active'),
    createdAt: formatDateTime(citizen.createdAt),
  };
}

export const STAFF_COLUMNS = [
  { key: 'employeeId', label: 'Staff ID' },
  { key: 'fullName', label: 'Full name' },
  { key: 'institutionName', label: 'Institution' },
  { key: 'positionTitle', label: 'Position' },
  { key: 'positionKinyarwanda', label: 'Position (Kinyarwanda)' },
  { key: 'departmentName', label: 'Department' },
  { key: 'reportsTo', label: 'Reports to' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'isLeader', label: 'Institution leader' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Registered at' },
];

export function toStaffRow(employee, institutionName, departmentName) {
  return {
    employeeId: employee.employeeId,
    fullName: employee.fullName,
    institutionName: institutionName ?? '',
    positionTitle: employee.positionTitle ?? '',
    positionKinyarwanda: employee.positionKinyarwanda ?? '',
    departmentName: departmentName ?? '',
    reportsTo: employee.reportsTo ?? '',
    phone: employee.phone ?? '',
    email: employee.email ?? '',
    isLeader: employee.isLeader === true ? 'Yes' : 'No',
    status: employee.status ?? '',
    createdAt: formatDateTime(employee.createdAt),
  };
}
