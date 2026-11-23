# GramaGlow 1.3 — Evaluation-driven improvement notes

This release responds directly to the Attempt #5 evaluation report (88/100, Grade A). It preserves the existing citizen portal, Pipri sample data, bilingual experience, accessibility controls, voting, map, notices and grievance workflow.

## Changes in this revision

### 1. React frontend migration track
- Added `frontend-react/`, a real React + React Router application with reusable layout and page components.
- Shared UI preferences are managed through `PortalContext` (`useContext`, `useState`, `useEffect`); data-driven pages use component-level state/effects.
- Included Home, Notices, Schemes and Grievance pages, responsive styling, a dark theme and language preference toggle.
- `npm run react:install` installs the React/Vite dependencies; `npm run react:dev` starts the React development server at `http://localhost:5173` and proxies `/api` to the existing Node API. Run the API separately with `npm start`.
- `npm run react:build` creates a production build under `public/react-dist`; then open `http://localhost:3000/react`.
- The existing stable vanilla-JS portal remains the default at `/` so the current full feature set is not lost during migration. The React app is a staged migration surface; not every legacy stretch feature has been ported yet.

### 2. Service and repository separation
- Added `GrievanceService` for validation, category/SLA rules, ticket generation and status rules.
- Added `GrievanceRepository` for SQLite reads/writes and SLA escalation persistence.
- Moved grievance creation, status updates and SLA escalation out of HTTP route handlers.

### 3. Database transactions and audit trail
- Grievance creation and its audit event are committed together in one SQLite transaction.
- Admin status/assignment updates and their audit event are committed together.
- Added indexed `audit_logs` storage and protected `GET /api/admin/audit?limit=50` for administrators.
- Ticket identifiers use cryptographic random generation and collision checks.

### 4. Formal API documentation
- Added an OpenAPI 3.1 specification at `docs/openapi.json`.
- The live contract is served at `GET /api/docs/openapi.json`.
- The specification covers key village, notice, grievance, scheme, health and admin audit endpoints, including request schemas and cookie-session security.

### 5. Verification
- Expanded the HTTP integration tests to verify the OpenAPI endpoint and both grievance audit events.
- `npm test` runs the database/business logic, authentication/security and HTTP integration suites against a temporary database copy.

## Run the existing full portal

Prerequisite: Node.js 22.5+ (built-in `node:sqlite`).

```bash
# Set an administrator password before starting the server.
# PowerShell:
$env:GRAMAGLOW_ADMIN_PASSWORD = "use-a-long-unique-password"

# macOS/Linux:
export GRAMAGLOW_ADMIN_PASSWORD="use-a-long-unique-password"

npm start
```

Open `http://localhost:3000`. The static HTML/CSS curriculum showcase remains at `/static.html`.

## Run the React migration build

In a second terminal, from the project root:

```bash
npm run react:install
npm run react:dev
```

Open `http://localhost:5173`. For a production build, run `npm run react:build` and open `http://localhost:3000/react` while the backend server is running.

## API contract and tests

- OpenAPI JSON: `http://localhost:3000/api/docs/openapi.json`
- Protected audit feed: `GET /api/admin/audit` (requires admin session)
- Test suite: `npm test`

## Deployment notes

- Configure a unique admin password through environment variables; never commit credentials.
- Use HTTPS in deployment. The current session store remains in memory and is cleared on restart.
- The React app currently covers the core portal journey; the legacy portal continues to provide the remaining map, voting, audio, and admin workflows until those are migrated component by component.
- Citizen grievance submission and community voting are intentionally public in this demonstration. Add production-grade abuse controls, monitoring, backups and an appropriate identity provider before public deployment.
