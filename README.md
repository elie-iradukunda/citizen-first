# Citizen First

Citizen First is a full-stack civic reporting platform for anti-corruption complaints, citizen feedback, QR-based institutional access, and transparent case tracking.

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
- Citizen issue submit: `/dashboard/citizen/submit`
- Citizen services explorer: `/dashboard/citizen/services`
- Citizen leaders explorer: `/dashboard/citizen/leaders`
- Institution level dashboard (province, district, sector, cell, village): `/dashboard/officer`
- Oversight admin dashboard: `/dashboard/admin`
- Dashboard hub: `/dashboards`

Dashboard behavior is role-aware:

- Sidebar navigation is filtered by logged-in role.
- Level leaders see governance mandate, required decisions, and scoped queue.
- Invite setup can use active login session (access key input optional).

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

## Linked Hierarchy Test Seed

By default (`SEED_HIERARCHY_TEST_DATA=true`), server startup preloads a full linked chain:
National -> Province -> District -> Sector -> Cell -> Village.

Use these login credentials:

- National admin: `national.seed.admin@citizenfirst.gov.rw` / `National@12345`
- Province leader: `province.leader@citizenfirst.gov.rw` / `Province@12345`
- District leader: `district.leader@citizenfirst.gov.rw` / `District@12345`
- Sector leader: `sector.leader@citizenfirst.gov.rw` / `Sector@12345`
- Cell leader: `cell.leader@citizenfirst.gov.rw` / `Cell@12345`
- Village leader: `village.leader@citizenfirst.gov.rw` / `Village@12345`

Citizen registration page now loads location options from registered hierarchy (`source=registered`),
so province/district/sector/cell/village are linked to institution registration records.

## AI Assistant Setup (Free Gemini Tier)

1. Create `server/.env` from `server/.env.example`.
2. Add your Gemini API key:
   `GEMINI_API_KEY=your_key_here`
3. Keep or change the model:
   `GEMINI_MODEL=gemini-2.5-flash`
4. Set national admin access key for first top-level invite:
   `SYSTEM_ADMIN_ACCESS_KEY=CF-ADMIN-2026`
5. Dashboard login keys:
   `DASHBOARD_ADMIN_ACCESS_KEY=CF-DASH-ADMIN-2026`
   `DASHBOARD_OFFICER_ACCESS_KEY=CF-DASH-OFFICER-2026`
   `DASHBOARD_CITIZEN_ACCESS_KEY=CF-DASH-CITIZEN-2026`
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
