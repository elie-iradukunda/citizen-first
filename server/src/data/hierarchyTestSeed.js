const NATIONAL_ROOT_ID = 'NATIONAL-PLATFORM';
const DISTRICT_TARGET_COUNT = 10;
const RELATION_TARGET_COUNT = 10;
const STAFF_PER_INSTITUTION = 10;

const REPORTING_CHAIN = {
  province: 'National Government',
  district: 'Province Governor',
  sector: 'District Authority',
  cell: 'Sector Executive Secretary',
  village: 'Cell Executive Secretary',
};

const CHILD_LEVEL_MAP = {
  province: 'district',
  district: 'sector',
  sector: 'cell',
  cell: 'village',
  village: null,
};

const CHILD_LABEL_MAP = {
  province: 'districts',
  district: 'sectors',
  sector: 'cells',
  cell: 'villages',
  village: null,
};

const LEVEL_PREFIX = {
  province: 'PRO',
  district: 'DIS',
  sector: 'SEC',
  cell: 'CEL',
  village: 'VIL',
};

const LEVEL_ROLE = {
  province: 'province_leader',
  district: 'district_leader',
  sector: 'sector_leader',
  cell: 'cell_leader',
  village: 'village_leader',
};

const LEVEL_TYPE_LABEL = {
  province: 'Province Administration',
  district: 'District Administration',
  sector: 'Sector Administration',
  cell: 'Cell Administration',
  village: 'Village Administration',
};

const LEVEL_PASSWORD = {
  province: 'Province@12345',
  district: 'District@12345',
  sector: 'Sector@12345',
  cell: 'Cell@12345',
  village: 'Village@12345',
};

const POSITION_TEMPLATES = {
  province: {
    title: 'Governor',
    titleKinyarwanda: "Guverineri w'Intara",
  },
  district: {
    title: 'Mayor',
    titleKinyarwanda: "Umuyobozi w'Akarere",
  },
  sector: {
    title: 'Executive Secretary',
    titleKinyarwanda: "Gitifu w'Umurenge",
  },
  cell: {
    title: 'Executive Secretary',
    titleKinyarwanda: "Gitifu w'Akagari",
  },
  village: {
    title: 'Village Leader',
    titleKinyarwanda: "Umuyobozi w'Umudugudu",
  },
};

const SERVICE_BLUEPRINTS = [
  {
    name: 'Service Charter Publishing',
    description:
      'Publishes official procedures, required documents, and service turnaround times.',
  },
  {
    name: 'Citizen Complaint Intake',
    description: 'Receives and validates new citizen cases with accountability-ready metadata.',
  },
  {
    name: 'Complaint Investigation Follow-up',
    description: 'Coordinates investigation activities and tracks actions taken on each case.',
  },
  {
    name: 'Integrity and Anti-Corruption Response',
    description: 'Handles bribery and misconduct allegations with escalation-ready workflow.',
  },
  {
    name: 'Public Communication and Awareness',
    description: 'Delivers service awareness and anti-corruption guidance to residents.',
  },
  {
    name: 'Case Escalation Coordination',
    description: 'Routes unresolved complaints to the next administrative authority.',
  },
  {
    name: 'Service Quality Monitoring',
    description: 'Tracks service quality KPIs and identifies bottlenecks for rapid improvement.',
  },
  {
    name: 'Document Verification Support',
    description: 'Provides verification support for citizen-submitted identity and evidence records.',
  },
  {
    name: 'Community Mediation and Resolution',
    description: 'Supports local mediation for community-level non-criminal service conflicts.',
  },
  {
    name: 'Digital Feedback and Reporting',
    description: 'Maintains digital reporting channels and citizen response notifications.',
  },
];

const STAFF_TEMPLATES = [
  {
    title: 'Service Delivery Officer',
    titleKinyarwanda: 'Umukozi ushinzwe itangwa rya serivisi',
    description: 'Manages service desk flow and citizen requests.',
  },
  {
    title: 'Case Management Officer',
    titleKinyarwanda: 'Umukozi ushinzwe imicungire yibibazo',
    description: 'Tracks case progress and updates case records.',
  },
  {
    title: 'Integrity Focal Officer',
    titleKinyarwanda: 'Umukozi ushinzwe ubunyangamugayo',
    description: 'Coordinates anti-corruption alerts and risk reporting.',
  },
  {
    title: 'Citizen Engagement Officer',
    titleKinyarwanda: 'Umukozi ushinzwe ubuhuza nabaturage',
    description: 'Leads outreach and citizen awareness communication.',
  },
  {
    title: 'Data and Records Officer',
    titleKinyarwanda: 'Umukozi ushinzwe amakuru ninyandiko',
    description: 'Maintains data quality and official documentation logs.',
  },
  {
    title: 'Monitoring and Evaluation Officer',
    titleKinyarwanda: 'Umukozi ushinzwe igenzura nisesengura',
    description: 'Monitors targets and reports performance indicators.',
  },
  {
    title: 'Operations Officer',
    titleKinyarwanda: 'Umukozi ushinzwe ibikorwa bya buri munsi',
    description: 'Supports day-to-day administrative operations.',
  },
  {
    title: 'Response Coordination Officer',
    titleKinyarwanda: 'Umukozi ushinzwe guhuza ibisubizo',
    description: 'Coordinates official responses to citizen complaints.',
  },
  {
    title: 'Community Liaison Officer',
    titleKinyarwanda: 'Umukozi ushinzwe ubufatanye numuryango',
    description: 'Links institution teams with local community structures.',
  },
];

const DISTRICT_NAMES = [
  'Kicukiro',
  'Gasabo',
  'Nyarugenge',
  'Kigali North',
  'Kigali South',
  'Kigali East',
  'Kigali West',
  'Kigali Central',
  'Kigali Hills',
  'Kigali Gateway',
];

const SECTOR_NAMES = [
  'Kagarama',
  'Remera',
  'Nyamirambo',
  'Kinyinya',
  'Gikondo',
  'Nyarutarama',
  'Kibagabaga',
  'Kimihurura',
  'Gahanga',
  'Masaka',
];

const CELL_NAMES = [
  'Kanserege',
  'Rukiri',
  'Rugarama',
  'Amahoro Cell',
  'Ubumwe Cell',
  'Ubwiyunge Cell',
  'Imena Cell',
  'Isange Cell',
  'Imanzi Cell',
  'Inkingi Cell',
];

const VILLAGE_NAMES = [
  'Amahoro',
  'Ubumwe',
  'Ubwiyunge',
  'Imanzi',
  'Intsinzi',
  'Urugwiro',
  'Ikizere',
  'Iterambere',
  'Umurava',
  'Twizerane',
];

const LEADER_NAMES_BY_LEVEL = {
  province: [
    'Kabarebe Jean',
    'Mukamana Chantal',
    'Ndayambaje Robert',
    'Uwimana Carine',
    'Habumuremyi Emmanuel',
    'Murebwayire Diane',
    'Niyonzima Eric',
    'Ingabire Sandrine',
    'Rukundo Alain',
    'Umutoni Claudine',
  ],
  district: [
    'Murekatete Alice',
    'Niyomugabo Eric',
    'Kantengwa Sarah',
    'Habimana Claude',
    'Nyirahabimana Lea',
    'Ndayisenga Pascal',
    'Mukundwa Diane',
    'Karangwa Jean Paul',
    'Uwayezu Joyeuse',
    'Ntezimana Patrick',
  ],
  sector: [
    'Ndayisaba Patrick',
    'Nyiraneza Solange',
    'Rukundo Yves',
    'Umuhoza Vestine',
    'Iradukunda Moise',
    'Nshimiyimana Clarisse',
    'Kayitesi Yvonne',
    'Munyaneza Fred',
    'Mukeshimana Diane',
    'Mutabazi Emmanuel',
  ],
  cell: [
    'Uwimana Eric',
    'Munyakazi Jean Claude',
    'Mukamana Nadine',
    'Nkurunziza Patrick',
    'Ishimwe Carine',
    'Rurangwa Michel',
    'Niyonsaba Francoise',
    'Mugabo Fidele',
    'Nyiransabimana Ange',
    'Murwanashyaka Eric',
  ],
  village: [
    'Mukamana Claudine',
    'Nduwimana Jeanne',
    'Hakizimana Enock',
    'Nyirabazungu Aline',
    'Nshimiyimana Patrick',
    'Munyampundu Rachel',
    'Niyonzima Samuel',
    'Ingabire Liliane',
    'Rwigema Christophe',
    'Mushimiyimana Olive',
  ],
};

const PRIMARY_OVERRIDES = {
  province: {
    institutionName: 'Kigali City Governor Office',
    officialEmail: 'province.kigali@citizenfirst.gov.rw',
    officialPhone: '+250788610001',
    officeAddress: 'Kigali City Headquarters',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: '',
      sector: '',
      cell: '',
      village: '',
    },
    leader: {
      userId: 'USR-SEED-PRO-001',
      fullName: 'Kabarebe Jean',
      nationalId: '1199000011112221',
      email: 'province.leader@citizenfirst.gov.rw',
      phone: '+250788610011',
      password: 'Province@12345',
      accessKey: 'CF-PRO-SEED-2026',
    },
  },
  district: {
    institutionName: 'Kicukiro District Office',
    officialEmail: 'district.kicukiro@citizenfirst.gov.rw',
    officialPhone: '+250788620001',
    officeAddress: 'Kicukiro District Headquarters',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Kicukiro',
      sector: '',
      cell: '',
      village: '',
    },
    leader: {
      userId: 'USR-SEED-DIS-001',
      fullName: 'Murekatete Alice',
      nationalId: '1199000011112222',
      email: 'district.leader@citizenfirst.gov.rw',
      phone: '+250788620011',
      password: 'District@12345',
      accessKey: 'CF-DIS-SEED-2026',
    },
  },
  sector: {
    institutionName: 'Kagarama Sector Office',
    officialEmail: 'sector.kagarama@citizenfirst.gov.rw',
    officialPhone: '+250788630001',
    officeAddress: 'Kagarama Sector Main Office',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Kicukiro',
      sector: 'Kagarama',
      cell: '',
      village: '',
    },
    leader: {
      userId: 'USR-SEED-SEC-001',
      fullName: 'Ndayisaba Patrick',
      nationalId: '1199000011112223',
      email: 'sector.leader@citizenfirst.gov.rw',
      phone: '+250788630011',
      password: 'Sector@12345',
      accessKey: 'CF-SEC-SEED-2026',
    },
  },
  cell: {
    institutionName: 'Kanserege Cell Office',
    officialEmail: 'cell.kanserege@citizenfirst.gov.rw',
    officialPhone: '+250788640001',
    officeAddress: 'Kanserege Cell Office',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Kicukiro',
      sector: 'Kagarama',
      cell: 'Kanserege',
      village: '',
    },
    leader: {
      userId: 'USR-SEED-CEL-001',
      fullName: 'Uwimana Eric',
      nationalId: '1199000011112224',
      email: 'cell.leader@citizenfirst.gov.rw',
      phone: '+250788640011',
      password: 'Cell@12345',
      accessKey: 'CF-CEL-SEED-2026',
    },
  },
  village: {
    institutionName: 'Amahoro Village Office',
    officialEmail: 'village.amahoro@citizenfirst.gov.rw',
    officialPhone: '+250788650001',
    officeAddress: 'Amahoro Village Point',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: 'Kicukiro',
      sector: 'Kagarama',
      cell: 'Kanserege',
      village: 'Amahoro',
    },
    leader: {
      userId: 'USR-SEED-VIL-001',
      fullName: 'Mukamana Claudine',
      nationalId: '1199000011112225',
      email: 'village.leader@citizenfirst.gov.rw',
      phone: '+250788650011',
      password: 'Village@12345',
      accessKey: 'CF-VIL-SEED-2026',
    },
  },
};

function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function pad3(number) {
  return String(number).padStart(3, '0');
}

function buildInstitutionId(level, index) {
  return `${LEVEL_PREFIX[level]}-${String(9000 + index).padStart(4, '0')}`;
}

function buildServiceCatalog(level, institutionName) {
  const levelLabel = level.charAt(0).toUpperCase() + level.slice(1);
  return SERVICE_BLUEPRINTS.map((entry, index) => ({
    name: `${levelLabel} ${index + 1}: ${entry.name}`,
    description: `${entry.description} (${institutionName})`,
    feeType: index % 3 === 0 ? 'paid' : 'free',
    officialFeeRwf: index % 3 === 0 ? (index + 1) * 1000 : 0,
    accessNote:
      index % 3 === 0
        ? 'Official fee must be receipted before service completion.'
        : 'No official payment required for this service.',
  }));
}

function buildLevelUserId(level, index) {
  return `USR-SEED-${LEVEL_PREFIX[level]}-${pad3(index)}`;
}

function buildAccessKey(level, index) {
  return `CF-${LEVEL_PREFIX[level]}-SEED-${pad3(index)}`;
}

function buildLeaderEmail(level, index) {
  return `${level}.leader${String(index).padStart(2, '0')}@citizenfirst.gov.rw`;
}

function createNationalIdFactory(start = 611100001000) {
  let serial = start;
  return () => {
    const nationalId = `1199${String(serial).padStart(12, '0')}`;
    serial += 1;
    return nationalId;
  };
}

function createPhoneFactory(start = 7100010) {
  let serial = start;
  return () => {
    const phone = `+25078${String(serial).padStart(7, '0')}`;
    serial += 1;
    return phone;
  };
}

function createLeaderProfile(level, index, nextNationalId, nextPhone) {
  const role = LEVEL_ROLE[level];
  const position = POSITION_TEMPLATES[level];
  const leaderNames = LEADER_NAMES_BY_LEVEL[level];
  const fullName = leaderNames[index - 1] ?? `${level} Leader ${index}`;

  return {
    userId: buildLevelUserId(level, index),
    fullName,
    nationalId: nextNationalId(),
    email: buildLeaderEmail(level, index),
    phone: nextPhone(),
    password: LEVEL_PASSWORD[level],
    accessKey: buildAccessKey(level, index),
    role,
    positionTitle: position.title,
    positionKinyarwanda: position.titleKinyarwanda,
  };
}

function withPrimaryOverride(level, index, payload) {
  if (index !== 1) {
    return payload;
  }

  const override = PRIMARY_OVERRIDES[level];
  if (!override) {
    return payload;
  }

  return {
    ...payload,
    institutionName: override.institutionName,
    officialEmail: override.officialEmail,
    officialPhone: override.officialPhone,
    officeAddress: override.officeAddress,
    location: override.location,
    leader: {
      ...payload.leader,
      ...override.leader,
      role: LEVEL_ROLE[level],
      positionTitle: POSITION_TEMPLATES[level].title,
      positionKinyarwanda: POSITION_TEMPLATES[level].titleKinyarwanda,
    },
  };
}

function buildInstitutionEntry({
  level,
  index,
  parentInstitutionId,
  institutionName,
  location,
  expectedChildUnits,
  nextNationalId,
  nextPhone,
}) {
  const institutionId = buildInstitutionId(level, index);
  const leader = createLeaderProfile(level, index, nextNationalId, nextPhone);
  const payload = {
    institutionId,
    level,
    parentInstitutionId,
    institutionName,
    institutionType: LEVEL_TYPE_LABEL[level],
    officialEmail: `${slugify(institutionName)}@citizenfirst.gov.rw`,
    officialPhone: nextPhone(),
    officeAddress: `${institutionName} Main Office`,
    location,
    expectedChildUnits,
    childUnitLabel: CHILD_LABEL_MAP[level],
    services: buildServiceCatalog(level, institutionName),
    leader,
  };

  return withPrimaryOverride(level, index, payload);
}

function buildHierarchyChain() {
  const nextNationalId = createNationalIdFactory(911100001000);
  const nextPhone = createPhoneFactory(7600010);

  const province = buildInstitutionEntry({
    level: 'province',
    index: 1,
    parentInstitutionId: NATIONAL_ROOT_ID,
    institutionName: 'Kigali City Governor Office',
    location: {
      country: 'Rwanda',
      province: 'Kigali City',
      district: '',
      sector: '',
      cell: '',
      village: '',
    },
    expectedChildUnits: DISTRICT_TARGET_COUNT,
    nextNationalId,
    nextPhone,
  });

  const districts = Array.from({ length: DISTRICT_TARGET_COUNT }, (_, index) => {
    const districtName = DISTRICT_NAMES[index] ?? `Kigali District ${index + 1}`;
    return buildInstitutionEntry({
      level: 'district',
      index: index + 1,
      parentInstitutionId: province.institutionId,
      institutionName: `${districtName} District Office`,
      location: {
        country: 'Rwanda',
        province: 'Kigali City',
        district: districtName,
        sector: '',
        cell: '',
        village: '',
      },
      expectedChildUnits: 1,
      nextNationalId,
      nextPhone,
    });
  });

  const sectors = Array.from({ length: RELATION_TARGET_COUNT }, (_, index) => {
    const sectorName = SECTOR_NAMES[index] ?? `Kigali Sector ${index + 1}`;
    return buildInstitutionEntry({
      level: 'sector',
      index: index + 1,
      parentInstitutionId: districts[index]?.institutionId ?? districts[0].institutionId,
      institutionName: `${sectorName} Sector Office`,
      location: {
        country: 'Rwanda',
        province: 'Kigali City',
        district: districts[index]?.location?.district ?? districts[0].location.district,
        sector: sectorName,
        cell: '',
        village: '',
      },
      expectedChildUnits: 1,
      nextNationalId,
      nextPhone,
    });
  });

  const cells = Array.from({ length: RELATION_TARGET_COUNT }, (_, index) => {
    const cellName = CELL_NAMES[index] ?? `Kigali Cell ${index + 1}`;
    return buildInstitutionEntry({
      level: 'cell',
      index: index + 1,
      parentInstitutionId: sectors[index]?.institutionId ?? sectors[0].institutionId,
      institutionName: `${cellName} Cell Office`,
      location: {
        country: 'Rwanda',
        province: 'Kigali City',
        district: sectors[index]?.location?.district ?? sectors[0].location.district,
        sector: sectors[index]?.location?.sector ?? sectors[0].location.sector,
        cell: cellName,
        village: '',
      },
      expectedChildUnits: 1,
      nextNationalId,
      nextPhone,
    });
  });

  const villages = Array.from({ length: RELATION_TARGET_COUNT }, (_, index) => {
    const villageName = VILLAGE_NAMES[index] ?? `Kigali Village ${index + 1}`;
    return buildInstitutionEntry({
      level: 'village',
      index: index + 1,
      parentInstitutionId: cells[index]?.institutionId ?? cells[0].institutionId,
      institutionName: `${villageName} Village Office`,
      location: {
        country: 'Rwanda',
        province: 'Kigali City',
        district: cells[index]?.location?.district ?? cells[0].location.district,
        sector: cells[index]?.location?.sector ?? cells[0].location.sector,
        cell: cells[index]?.location?.cell ?? cells[0].location.cell,
        village: villageName,
      },
      expectedChildUnits: null,
      nextNationalId,
      nextPhone,
    });
  });

  return [province, ...districts, ...sectors, ...cells, ...villages];
}

const HIERARCHY_CHAIN = buildHierarchyChain();

export const HIERARCHY_TEST_CREDENTIALS = {
  nationalAdmin: {
    email: 'national.seed.admin@citizenfirst.gov.rw',
    password: 'National@12345',
    accessKey: 'CF-NATIONAL-SEED-2026',
  },
  provinceLeader: {
    email: 'province.leader@citizenfirst.gov.rw',
    password: 'Province@12345',
    accessKey: 'CF-PRO-SEED-2026',
  },
  districtLeader: {
    email: 'district.leader@citizenfirst.gov.rw',
    password: 'District@12345',
    accessKey: 'CF-DIS-SEED-2026',
  },
  sectorLeader: {
    email: 'sector.leader@citizenfirst.gov.rw',
    password: 'Sector@12345',
    accessKey: 'CF-SEC-SEED-2026',
  },
  cellLeader: {
    email: 'cell.leader@citizenfirst.gov.rw',
    password: 'Cell@12345',
    accessKey: 'CF-CEL-SEED-2026',
  },
  villageLeader: {
    email: 'village.leader@citizenfirst.gov.rw',
    password: 'Village@12345',
    accessKey: 'CF-VIL-SEED-2026',
  },
};

function addInstitutionEmployees({
  institution,
  institutionEmployees,
  nextNationalId,
  nextPhone,
  now,
}) {
  institutionEmployees.push({
    employeeId: `EMP-SEED-${institution.institutionId}-L01`,
    institutionId: institution.institutionId,
    fullName: institution.leader.fullName,
    nationalId: institution.leader.nationalId,
    phone: institution.leader.phone,
    email: institution.leader.email,
    positionTitle: institution.leader.positionTitle,
    positionKinyarwanda: institution.leader.positionKinyarwanda,
    reportsTo: REPORTING_CHAIN[institution.level] ?? 'N/A',
    description: `Seed leader for ${institution.institutionName}.`,
    status: 'Active',
    isLeader: true,
    createdAt: now,
  });

  const staffTarget = Math.max(0, STAFF_PER_INSTITUTION - 1);
  for (let index = 0; index < staffTarget; index += 1) {
    const template = STAFF_TEMPLATES[index % STAFF_TEMPLATES.length];
    const employeeNumber = index + 1;
    institutionEmployees.push({
      employeeId: `EMP-SEED-${institution.institutionId}-S${String(employeeNumber).padStart(2, '0')}`,
      institutionId: institution.institutionId,
      fullName: `${institution.level.toUpperCase()} Staff ${String(employeeNumber).padStart(2, '0')} - ${institution.location.district || 'Kigali'}`,
      nationalId: nextNationalId(),
      phone: nextPhone(),
      email: `${slugify(institution.institutionName)}.staff${String(employeeNumber).padStart(2, '0')}@citizenfirst.gov.rw`,
      positionTitle: template.title,
      positionKinyarwanda: template.titleKinyarwanda,
      reportsTo: institution.leader.positionTitle,
      description: template.description,
      status: 'Active',
      isLeader: false,
      createdAt: now,
    });
  }
}

export function seedHierarchyTestData({
  systemUsers,
  registeredInstitutions,
  institutionEmployees,
  institutionDepartments,
  createPasswordCredentials,
}) {
  if (process.env.SEED_HIERARCHY_TEST_DATA === 'false') {
    return;
  }

  const hasSeed = systemUsers.some((entry) => entry.userId === 'USR-SEED-NAT-001');
  if (hasSeed) {
    return;
  }

  const now = new Date().toISOString();
  const nextNationalId = createNationalIdFactory(971100001000);
  const nextPhone = createPhoneFactory(7900010);

  const nationalUserId = 'USR-SEED-NAT-001';
  systemUsers.push({
    userId: nationalUserId,
    role: 'national_admin',
    level: 'national',
    fullName: 'Seed National Admin',
    email: HIERARCHY_TEST_CREDENTIALS.nationalAdmin.email,
    nationalId: null,
    institutionId: NATIONAL_ROOT_ID,
    accessKey: HIERARCHY_TEST_CREDENTIALS.nationalAdmin.accessKey,
    status: 'active',
    ...createPasswordCredentials(HIERARCHY_TEST_CREDENTIALS.nationalAdmin.password, nationalUserId),
    createdAt: now,
  });

  for (const item of HIERARCHY_CHAIN) {
    const alreadyExists = registeredInstitutions.some(
      (entry) => entry.institutionId === item.institutionId,
    );
    if (alreadyExists) {
      continue;
    }

    registeredInstitutions.push({
      institutionId: item.institutionId,
      slug: item.institutionName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      level: item.level,
      parentInstitutionId: item.parentInstitutionId,
      institutionName: item.institutionName,
      institutionType: item.institutionType,
      officialEmail: item.officialEmail,
      officialPhone: item.officialPhone,
      officeAddress: item.officeAddress,
      location: item.location,
      leaderNationalId: item.leader.nationalId,
      childLevel: CHILD_LEVEL_MAP[item.level],
      childUnitLabel: item.childUnitLabel,
      expectedChildUnits: item.expectedChildUnits,
      registeredChildUnits: 0,
      childInstitutionIds: [],
      services: item.services,
      employeeCount: 0,
      createdByInviteId: `INV-SEED-${item.institutionId}`,
      createdAt: now,
      updatedAt: now,
      status: 'active',
      qrCodeDataUrl: null,
    });

    systemUsers.push({
      userId: item.leader.userId,
      role: item.leader.role,
      level: item.level,
      fullName: item.leader.fullName,
      email: item.leader.email,
      nationalId: item.leader.nationalId,
      institutionId: item.institutionId,
      accessKey: item.leader.accessKey,
      status: 'active',
      location: item.location,
      ...createPasswordCredentials(item.leader.password, item.leader.userId),
      createdAt: now,
    });

    addInstitutionEmployees({
      institution: item,
      institutionEmployees,
      nextNationalId,
      nextPhone,
      now,
    });

    institutionDepartments.push({
      departmentId: `DEP-SEED-${item.institutionId}-OPS`,
      institutionId: item.institutionId,
      name: 'Operations',
      description: 'Coordinates daily service delivery and workflow execution.',
      createdAt: now,
    });
    institutionDepartments.push({
      departmentId: `DEP-SEED-${item.institutionId}-INT`,
      institutionId: item.institutionId,
      name: 'Integrity and Accountability',
      description: 'Handles complaint quality, transparency, and anti-corruption follow-up.',
      createdAt: now,
    });
    institutionDepartments.push({
      departmentId: `DEP-SEED-${item.institutionId}-CIT`,
      institutionId: item.institutionId,
      name: 'Citizen Service Desk',
      description: 'Supports citizen inquiries, service routing, and follow-up communication.',
      createdAt: now,
    });
  }

  for (const institution of registeredInstitutions) {
    const children = registeredInstitutions
      .filter((entry) => entry.parentInstitutionId === institution.institutionId)
      .map((entry) => entry.institutionId);

    institution.childInstitutionIds = children;
    institution.registeredChildUnits = children.length;
    institution.employeeCount = institutionEmployees.filter(
      (entry) => entry.institutionId === institution.institutionId,
    ).length;
    institution.updatedAt = now;
  }
}
