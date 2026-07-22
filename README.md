# SMART ANTI-CORRUPTION AND CITIZEN FEEDBACK PLATFORM USING QR CODE TECHNOLOGY (SACCFP)

SACCFP is a full-stack civic reporting platform for anti-corruption complaints, citizen feedback, QR-based institutional access, and transparent case tracking.

This deployment is configured for the corrected research case study:

- Case study institution: Rwanda Investigation Bureau (RIB), Kigali, Rwanda
- Workflow: QR Access -> Evidence Triage -> RIB Intake -> Investigation Review -> Supervisory Review -> National Oversight
- Public demo flow: submit a RIB report, receive a case ID, and track the case status

## Stack

- React + Vite
- Tailwind CSS
- JavaScript
- Node.js + Express
- Sequelize + MySQL

## Workspaces

- `client` for the frontend
- `server` for the API

## Dashboard Modules

- Citizen dashboard: `/dashboard/citizen`
- Institution admin dashboard: `/dashboard/institution`
- RIB Officer 1 dashboard: `/dashboard/rib-officer-1`
- RIB Officer 2 dashboard: `/dashboard/rib-officer-2`
- Dashboard hub: `/dashboards`

Dashboard behavior is role-aware:

- Citizen sees QR services, report submission, my reports, and tracking.
- Institution admin sees services, departments, staff registration, staff-service linking, and QR generation.
- RIB Officer 1 sees new reports, evidence review, three-day response, citizen response, and escalation.
- RIB Officer 2 sees escalated reports, overdue cases, final review, status updates, and follow-up summary.

## Presentation Demo Accounts

- Citizen: `citizen.demo@saccfp.rw` / `Citizen@12345`
- Institution Admin: `institution.admin@saccfp.rw` / `Institution@12345`
- RIB Officer 1: `rib.officer1@saccfp.rw` / `RibOfficer1@12345`
- RIB Officer 2: `rib.officer2@saccfp.rw` / `RibOfficer2@12345`

Access keys are also shown on the login screen for presentation use.

## Dashboard API

- `GET /api/dashboard/overview` (auth required)
- `GET /api/dashboard/citizen` (auth required)
- `GET /api/dashboard/citizen/context?province=...&district=...&sector=...&cell=...&village=...` (auth required)
- `POST /api/dashboard/citizen/complaints` (citizen auth required)
- `GET /api/dashboard/officer` (auth required)
- `GET /api/dashboard/officer/explorer?province=...&district=...&sector=...&cell=...&village=...` (auth required)
- `GET /api/dashboard/admin` (auth required)

## Auth API

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

`POST /api/auth/login` supports:

- access key login: `{ "accessKey": "CF-..." }`
- email/password login: `{ "email": "user@...", "password": "..." }`

Session persistence:

- Sessions are saved in `server/.sessions.json`.
- If user does not logout, they can continue dashboard access after refresh or server restart.
- Session expiry is 30 days by default.

## Public Pages

- Home: `/`
- Services: `/services`
- Governance structure: `/governance-structure`
- Emergency contacts: `/emergency`
- AI Assistant: `/assistant`
- Citizen registration: `/register/citizen`
- Institution invite generation: `/register/invite`
- Institution registration by invite: `/register/institution?inviteToken=...`
- Login: `/login?redirect=%2Fdashboards`

## Public APIs

- `GET /api/public/services`
- `GET /api/public/emergency-contacts`
- `GET /api/public/routing-guide`
- `GET /api/public/assistant-questions`
- `POST /api/assistant/ask`

## Registration APIs

- `GET /api/registration/hierarchy`
- `GET /api/registration/field-definitions`
- `GET /api/registration/locations/provinces?source=hybrid|registered|static`
- `GET /api/registration/locations/districts?province=...&source=hybrid|registered|static`
- `GET /api/registration/locations/sectors?province=...&district=...&source=hybrid|registered|static`
- `GET /api/registration/locations/cells?province=...&district=...&sector=...&source=hybrid|registered|static`
- `GET /api/registration/locations/villages?province=...&district=...&sector=...&cell=...&source=hybrid|registered|static`
- `GET /api/registration/locations/tree`
- `GET /api/registration/staff-template`
- `GET /api/registration/relationships/tree` (requires login or `x-access-key`)
- `GET /api/registration/relationships/children/:institutionId` (requires login or `x-access-key`)
- `GET /api/registration/leaders?province=...&district=...&sector=...&cell=...&village=...`
- `POST /api/registration/invites` (requires `x-access-key`)
- `GET /api/registration/invites/:token`
- `POST /api/registration/institutions/complete`
- `POST /api/registration/citizens`

## Institution Management CRUD (auth or `x-access-key` required)

- `GET /api/registration/institutions/:institutionId/manage`
- `PATCH /api/registration/institutions/:institutionId/manage`
- `DELETE /api/registration/institutions/:institutionId` (national admin only; blocked while child units exist)
- Services (support `feeType`, `officialFeeRwf`, `accessNote`, `schedule`, `documents`):
  - `POST /api/registration/institutions/:institutionId/services`
  - `PATCH /api/registration/institutions/:institutionId/services/:serviceName`
  - `DELETE /api/registration/institutions/:institutionId/services/:serviceName`
- Departments:
  - `POST /api/registration/institutions/:institutionId/departments`
  - `PATCH /api/registration/institutions/:institutionId/departments/:departmentId`
  - `DELETE /api/registration/institutions/:institutionId/departments/:departmentId`
- Staff:
  - `POST /api/registration/institutions/:institutionId/employees` (optional platform login account)
  - `POST /api/registration/institutions/:institutionId/employees/:employeeId/account`
  - `PATCH /api/registration/institutions/:institutionId/employees/:employeeId`
  - `DELETE /api/registration/institutions/:institutionId/employees/:employeeId` (leader is protected; linked login is deactivated)
- Staff-to-service links (dissertation "Link Staff to Services" feature):
  - `POST /api/registration/institutions/:institutionId/service-links` (`{ employeeId, serviceName }`)
  - `DELETE /api/registration/institutions/:institutionId/service-links/:linkId`
  - Linked staff appear as `responsibleStaff` on each service in the public profile and citizen context.

`GET /api/institutions/:slug/access-qr` (dissertation route name) is an alias of `GET /api/institutions/:slug/qr`.

## Seeded presentation data (matches the dissertation test-data design)

- Kacyiru Sector Office: 4 services (Civil status certificate support 500 RWF, Land document
  guidance, Social affairs and Mutuelle support, Citizen complaint reception), 4 departments
  (Civil Status, Land and Infrastructure, Social Affairs, Customer Care), 5 staff
  (leader + Agnes Mukamana, Jean Bosco Ndayisenga, Claudine Uwase, Patrick Habimana),
  and staff-to-service links for each service.
- RIB workflow chain: QR Access -> Evidence Triage -> RIB Intake -> Investigation Review ->
  Supervisory Review -> National Oversight, with leaders, staff, and departments per level.
- Demo complaints in every workflow state: submitted, in review, responded, escalated,
  and resolved (with responses, escalation history, and evidence flags).

The public institution profile (`GET /api/institutions/:slug`) now also exposes the `staff` directory
(leaders and support staff with contacts and duties) next to `services` and `departments`.

## Test suites

- Backend (in-memory API, no DB needed): `npm test`
  - includes the full lifecycle suite: RIB creates an institution (QR generated at creation) ->
    leader logs in -> service/department/staff CRUD -> citizen registers and scans the QR ->
    corruption report with evidence -> respond -> escalate (district -> province -> national) ->
    citizen accepts -> resolved -> RIB deletes the institution.
- End-to-end UI (Playwright + real Chrome): start `DB_DISABLED=true npm run dev`, then `npm run test:e2e`
  - `e2e/full-lifecycle.spec.js` drives the same journey through the UI, including the
    view-details pop-up modals for services, staff, departments, and citizen cases.

Registration login credentials:

- Citizen registration now requires `email` + `password`.
- Institution leader registration now requires leader `email` + `password`.
- After registration, both can log in at `/login` using email/password (access key still supported).

## Hierarchical Institution Workflow

1. National admin creates invite for Province registration.
2. Province leader registers and receives access key.
3. Province leader creates invite for District.
4. District registers and invites Sector.
5. Sector registers and invites Cell.
6. Cell registers and invites Village.
7. At each level: leader can register departments and employees.
8. At each level (except village), leader enters expected lower-level units (districts/sectors/cells/villages).
9. Each institution also registers service catalog entries for citizen guidance.
10. System auto-generates institution QR code after successful registration.

## RIB Case Study Seed

By default, server startup preloads RIB workflow records for:

QR Access -> Evidence Triage -> RIB Intake -> Investigation Review -> Supervisory Review -> National Oversight.

The citizen demo profile uses Kigali City, Gasabo, Kacyiru, Kamatamu, Ubumwe as the case-study context.

## AI Assistant Setup (Free Gemini Tier)

1. Create `server/.env` from `server/.env.example`.
2. Add your Gemini API key:
   `GEMINI_API_KEY=your_key_here`
3. Keep or change the model:
   `GEMINI_MODEL=gemini-2.5-flash`
4. Set national admin access key for first top-level invite:
   `SYSTEM_ADMIN_ACCESS_KEY=CF-ADMIN-2026`
5. Dashboard login keys:
   `DASHBOARD_CITIZEN_ACCESS_KEY=CF-CITIZEN-2026`
   `DASHBOARD_INSTITUTION_ADMIN_ACCESS_KEY=CF-INSTITUTION-2026`
   `DASHBOARD_RIB_OFFICER_ONE_ACCESS_KEY=CF-RIB-OFFICER1-2026`
   `DASHBOARD_RIB_OFFICER_TWO_ACCESS_KEY=CF-RIB-OFFICER2-2026`
6. Seeded linked hierarchy data:
   `SEED_HIERARCHY_TEST_DATA=true`

If `GEMINI_API_KEY` is missing, the assistant still works using local fallback guidance.

## Run locally

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:5173` and backend runs on `http://localhost:4000`.

## Database auto setup (Sequelize)

On backend startup:

- database is created automatically when missing (`DB_AUTO_CREATE_DATABASE=true`)
- Sequelize models are synced to MySQL tables
- optional sync controls:
  - `DB_SYNC_ALTER=true` to auto-alter table structure when you intentionally run schema migration
  - `DB_SYNC_FORCE=true` to drop and recreate tables (development only)

If port `4000` is already busy, server retries next ports automatically (`PORT_RETRY_ATTEMPTS`).

### Core database tables

- `users`
- `citizens`
- `institutions`
- `institution_departments`
- `institution_employees`
- `registration_invites`
- `complaints`
- `complaint_responses`
- `complaint_escalations`
- `voice_records`
- `institution_qr_codes`
- `auth_sessions`
