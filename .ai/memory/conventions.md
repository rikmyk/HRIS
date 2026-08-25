# Conventions Memory

> Coding, naming, and process conventions all roles must follow. Reviewer
> enforces this file directly during review.
> **Last updated: 2026-08-25** — backend conventions updated to Go (Fiber, sqlc),
> docs path corrected, backend architecture section updated. See techstack.md + ADR-009.

## Naming Conventions
> Updated 2026-08-25. Backend = Go idiomatic; Frontend/Mobile = TypeScript/React.

| Scope | Convention | Example |
|---|---|---|
| Files (Go backend) | `snake_case.go` | `attendance_service.go` |
| Files (frontend) | `kebab-case.tsx` | `payslip-card.tsx` |
| Go exported identifiers | `PascalCase` | `ClockInHandler`, `PayslipService` |
| Go unexported identifiers | `camelCase` | `haversineDistance`, `clockInTime` |
| Go interfaces | `PascalCase` with verb suffix | `AttendanceRepository` |
| Go constants & iota enums | `PascalCase` or `UPPER_SNAKE_CASE` | `StatusDraft`, `GEOFENCE_RADIUS_DEFAULT` |
| React components | `PascalCase` | `PayslipCard`, `AttendanceList` |
| React hooks | `camelCase` with `use` prefix | `usePayslipDetail`, `useAttendance` |
| Database tables & columns | `snake_case` (PostgreSQL convention) | `attendance_record`, `clock_in_time` |
| Go struct fields (DB mapping) | `snake_case` in sqlc tags | `EmployeeID`, tagged `employee_id` |
| API route path segments | `kebab-case` | `/leave-requests`, `/payroll-periods` |
| Environment variables | `UPPER_SNAKE_CASE` | `DATABASE_URL`, `JWT_SECRET` |
| Branch names | See Git Conventions below | `feat/attendance-geofence` |


## Folder Structure Rules
> Backend: Go modular monolith per `docs projects/03-SYSTEM-DESIGN.md` §4.
> Each domain lives under `/internal/<module>`. Modules must NOT import each
> other's internals directly — use explicit query functions.

```
# HRIS Clean Monorepo Architecture:

backend/        # Go modular monolith backend
  cmd/          # Binary entrypoints (cmd/api/main.go, cmd/worker/main.go)
  internal/     # Domain modules (auth, employee, attendance, leave, payroll, payslip, notification, audit)
  pkg/          # Shared Go packages (db, geo, storage, queue)
  go.mod
  go.sum

frontend/       # Web SPA Admin & PWA App (React + TypeScript + Vite)
  src/
    features/   # Feature-based components mirroring backend modules
    components/ # Shared UI components
    pages/      # Route pages
  package.json

mobile/         # Mobile App for Employee (React Native + Expo SDK 51)
  src/
  package.json

shared/         # Shared TypeScript DTOs and API contract interfaces
  index.ts
  package.json

docs projects/  # All system specs and planning documentation
docker-compose.yml
.env.example
.gitignore
```

Test files: colocated with source using `*_test.go` (backend Go standard) /
`*.test.tsx` (frontend). E2E tests: top-level `e2e/` folder.


## Code Style
- **Backend (Go) Formatter:** `gofmt` / `goimports` (enforced via `golangci-lint`)
- **Backend Linter:** `golangci-lint` (includes `vet`, `errcheck`, `staticcheck`, `gofmt`)
- **Frontend/Mobile Formatter:** Prettier
- **Frontend/Mobile Linter:** ESLint with TypeScript plugin
- **Strict TypeScript:** `strict: true` in `tsconfig.json` for frontend + mobile
- **No `any`** in TypeScript — use `unknown` + type guards; exceptions must be
  commented and reviewed.
- **Go errors:** always handle (no `_` for errors from functions that can fail).
- **Imports:** Go — standard library first, then third-party, then internal (goimports handles this).
  TS — absolute imports via TypeScript path aliases (`@/`, `@shared/`) in `tsconfig`.
- **No hardcoded secrets** — all secrets via environment variables; `.env`
  files are git-ignored; `.env.example` is committed.
- **All code-facing text in English** (variable names, comments, commit
  messages, log messages, error codes) — per Code Language rule below.


## Design System / Aesthetic Direction
> **FINALIZED** — Fase 0 UI design complete. Derived from
> `docs projects/06-wireframe-mockup.html` (2026-08-23).
> Every Frontend task MUST follow this system exactly (ADR-008).
> See ADR-008 in `decisions.md` for the adoption decision.

### Aesthetic Direction
**Clean / Professional / Data-Dense** — internal B2B HR SaaS tool.
Warm off-white base (not pure white), dark ink surfaces for emphasis,
forest green primary action color, amber accent. Light mode only in Fase 1;
Dark mode is a future enhancement.

### Typography
| Role | Font | Weight(s) | Usage |
|---|---|---|---|
| **Display / Headings** | `Space Grotesk` | 500, 600, 700 | Screen titles, payslip amounts, clock time, brand mark |
| **Body / UI** | `Inter` | 400, 500, 600, 700 | All body text, labels, table content, buttons |

Google Fonts import:
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Color Palette & CSS Tokens
```css
:root {
  --ink:          #1B2430;  /* Dark navy — primary text, active states, dark buttons */
  --primary:      #2F6F5E;  /* Forest green — primary CTA, GPS in-range, nav active */
  --primary-dark: #204F42;  /* Darker green — pill text on light-green bg */
  --accent:       #E8A33D;  /* Amber — KPI highlights, avatar bg, brand accent */
  --bg:           #F5F3EE;  /* Warm off-white — page background */
  --surface:      #FFFFFF;  /* White — cards, modals, phone screen */
  --danger:       #C24A3B;  /* Red-brown — errors, outside-geofence, rejected status */
  --muted:        #6B7280;  /* Grey — secondary text, labels, disabled states */
  --line:         #E5E1D8;  /* Warm grey line — borders, dividers, table lines */
  --radius:       14px;     /* Default corner radius */
}
```

Semantic surface variants used in code (not extra tokens, just combinations):
- `#FCFBF9` — admin sidebar/topbar: slightly warm off-white panel surface
- `#EAE6DB` — map placeholder, warm neutral fill
- `#F0F7F4` / border `#CFE6DC` — GPS in-range card background
- `#FBEEEC` / border `#F0C7C0` — error/outside-geofence card background
- `#FDF1DC` / border `#F0DBA6` — info/warning banner (manual payment notice)

### Shape / Radius Scale
| Component | Radius |
|---|---|
| Default cards, buttons | `14px` (`--radius`) |
| Pill badges / tags | `999px` (fully rounded) |
| Phone frame outer | `36px` |
| Phone screen inner | `26px` |
| Camera / payslip hero cards | `16–18px` |
| Admin shell | `18px` |
| Mini buttons | `8px` |
| Bottom nav icons | `6px` |
| Avatar circles | `50%` |
| Mini avatar (square photo) | `6px` |

### Component Patterns (From Wireframe)

**Status Pills** (always `border-radius: 999px`, `font-weight: 700`, `font-size: 10.5px`):
| Variant | Background | Text Color | Used For |
|---|---|---|---|
| `.pill.present` | `#E4F3EC` | `--primary-dark` | Hadir |
| `.pill.late` | `#FDF1DC` | `#9A6714` | Telat |
| `.pill.absent` | `#FBEEEC` | `#8A3226` | Alpha / Ditolak |
| `.pill.leave` | `#E9EEF7` | `#2F4E8A` | Cuti / Izin / Pending |
| `.pill.paid` | `#E4F3EC` | `--primary-dark` | Sudah Dibayar |
| `.pill.approved` | `#FDF1DC` | `#9A6714` | Disetujui (belum dibayar) |
| `.pill.draft` | `#EFEDE7` | `--muted` | Draft |

**Buttons:**
- **Primary** (`btn-primary`): `bg: --primary`, white text, `font: Space Grotesk 700`, `border-radius: 14px`, shadow `0 10px 20px -8px rgba(47,111,94,.55)`. Full-width on mobile.
- **Secondary** (`btn-secondary`): `bg: --surface`, `--ink` text, `border: 1px solid --line`, `font: Inter 600`. Full-width on mobile.
- **Mini** (`btn-mini`): `border: 1px solid --line`, `padding: 6px 12px`, `border-radius: 8px`. Variants: `.primary` (green), `.dark` (--ink + white text).
- **Disabled** state: `bg: #C7C2B5`, no shadow, `cursor: not-allowed`.

**Tab Navigation** (screen switcher):
- Pill-shaped tabs `border-radius: 999px`, inactive: white bg + `--line` border.
- Active: `bg: --ink`, white text — NOT `--primary`. (Deliberate: ink = selected/confirmed)

**Admin Sidebar Nav:**
- Width: `190px`, `bg: #FCFBF9`.
- Active item: `bg: --ink`, white text, `border-radius: 9px`.

**KPI Cards** (`kpi-card`): `border: 1px solid --line`, `border-radius: 14px`, value uses `Space Grotesk 700 24px`. Value color variants: default `--ink`, `.accent` = `--accent`, `.warn` = `#9A6714`, `.danger` = `--danger`.

**GPS/Geofence Card:**
- In-range: green background `#F0F7F4`, border `#CFE6DC`, pulse `--primary`.
- Outside: red background `#FBEEEC`, border `#F0C7C0`, pulse `--danger`.
- Animated pulse ring on the GPS dot icon (`@keyframes pulse` scale 0.8→1.6).

**Payslip Hero Card** (`payslip-card`): dark gradient `linear-gradient(135deg, --ink, #2A3644)`, white text, `border-radius: 16px`. Amount in `Space Grotesk 700 26px`. Status tags use `rgba(255,255,255,.15)` frosted pill.

**Camera/Selfie Box** (`camera-box`): dark gradient `linear-gradient(145deg, #2A3644, #151C24)`, `aspect-ratio: 3/4`, face guide = dashed white oval. Live badge uses `backdrop-filter: blur(4px)`.

**Error/Warning Banners** (`error-banner`): icon + text layout, `border-radius: 12px`, color-coded by type (red for error, amber for info/warning).

**Tables (Web Admin):**
- `th`: `font-size: 11px`, `UPPERCASE`, `letter-spacing: .05em`, `--muted` color.
- `td`: `padding: 11px 10px`, `border-bottom: 1px solid --line`.
- Last row has no bottom border.

### Screen Inventory (from Wireframe)
**Mobile (Employee App) — 5 screens:**
1. `s-clockin` — Absen Clock-in (GPS in-range, camera live, "Absen Masuk" CTA active)
2. `s-clockin-reject` — Absen Ditolak (outside geofence, button disabled, error banner)
3. `s-attendance` — Riwayat Absensi (list + monthly summary pills)
4. `s-payslip-list` — Slip Gaji Riwayat (list by year, status pills)
5. `s-payslip-detail` — Slip Gaji Detail (payslip hero card + breakdown rows + PDF download)

**Web Admin (HR) — 4 screens:**
6. `s-admin-dash` — Dashboard (KPI row + leave request table)
7. `s-admin-live` — Monitoring Absensi Real-time (map placeholder + table with rejection log)
8. `s-admin-payslip` — Approval Slip Gaji (KPI row + table with Approve/Bulk-approve)
9. `s-admin-payment` — Penandaan Pembayaran (checkbox bulk-select + "Tandai Dibayar")

**Bottom Nav (Mobile, 4 tabs):** Absen · Riwayat · Izin · Slip Gaji
**Admin Sidebar (Web, 7 links):** Dashboard · Karyawan · Monitoring Absensi · Pengajuan Izin · Payroll & Slip Gaji · Laporan · Pengaturan Kantor

### Reference
Source file: `docs projects/06-wireframe-mockup.html`
See ADR-008 in `decisions.md` for the design system adoption decision.


## Commit & Branching
See `.ai/skills/git.md` for full commit/branch conventions.

### Protected Branches
Branches that must **never** be edited or committed to directly. Planner,
Backend, Frontend, Docs, and Release roles must run the Branch Safety Check
(`.ai/skills/git.md` Section 0) before any file edit.

- `main`
- `staging`

<!-- Add/remove branch names above as this project's setup requires. -->

### New Branch Base
New task branches are created **from `staging`**, not from `main`, unless
this project has no `staging` branch.

## Backend Architecture
> Updated 2026-08-25 from `docs projects/03-SYSTEM-DESIGN.md` and `decisions.md`.
> Backend language: **Go** (not NestJS/TypeScript) — see ADR-009.

- **API style in use:** REST (ADR-007)
- **Framework:** Go + Fiber v2.52+ — modular monolith, domain folders under
  `/internal/*` (ADR-005). 2 binary processes (`api`, `worker`) from same codebase.
- **Job queue:** Asynq (Redis-backed) — ADR-009. **Not BullMQ/RabbitMQ.**
- **Auth mechanism:** JWT 1-hour access token + 30-day refresh token, rotated
  on refresh (ADR-007). Optional device binding per employee to prevent
  shared-device attendance abuse.
- **Error response shape:**
  ```json
  { "success": false, "error": { "code": "ERROR_CODE", "message": "Human-readable message" } }
  ```
  See `docs projects/05-API-SPEC.md` §12 for full error code catalogue.
- **Versioning scheme:** URL versioning — all endpoints under `/v1/`.
- **Pagination style:** Offset-based (`page`, `limit`) with `meta.total` in
  response — consistent with the response envelope in `docs projects/05-API-SPEC.md`.
- **RBAC:** Fiber middleware validates JWT role claim on every endpoint.
  Roles: `EMP` (Employee), `MGR` (Manager), `HR` (HR Admin), `SA` (Super Admin).
- **Query layer:** `sqlc` generates type-safe Go code from raw SQL. Not an ORM.
- **Migrations:** `golang-migrate` (CLI + Go library). Migration files in
  `/db/migrations/`.
- **Notes:** All modules write to `audit_log` on any state-changing operation
  (payroll, approval, payment marking). Geofence check uses Haversine formula
  in `/pkg/geo` — see ADR-004.


## Testing Conventions
> Priority by business risk (per `backend-architecture.md` recommendation):

- **Near-100% coverage (money/compliance/irreversible):** Payroll Engine
  calculation logic, payslip state machine transitions, geofence check.
- **Standard 70-80% coverage:** Auth, Employee CRUD, Leave workflow,
  Notification triggers, API endpoint integration tests.
- **Lower priority:** Static UI components, pure reporting queries.

Mechanical conventions:
- **Test file naming/location:** `*.spec.ts` colocated with source (backend);
  `*.test.tsx` colocated with source (frontend).
- **E2E tests:** top-level `e2e/` folder.
- **Fixtures/mocks:** use factory pattern; no shared global mutable state
  between tests.


## Code Language — MANDATORY, No Exception
**Everything code-facing is always English**: comments, variable/function/
class names, commit messages, log messages, error messages, PR/branch
descriptions — regardless of what language the business domain or PRD is
written in. See `.ai/skills/coding.md` and `.ai/skills/git.md`.

## Documentation Conventions — MANDATORY Dual-Version Generation
**Every generated doc (spec, README, API doc, guide, changelog) is produced
in two versions:**
- **English — primary/authoritative version.** This is the source of
  truth if the two versions ever drift; technical accuracy is checked
  against this one.
- **Indonesian — secondary/reading version**, for the user's own
  convenience. A faithful translation of the English version, not a
  separately-written document — content must match, only the language
  differs.

**File naming:** the English version keeps the normal filename; the
Indonesian version gets an `.id` suffix before the extension —
e.g. `docs/specs/2026-08-01-topic-design.md` (English, primary) and
`docs/specs/2026-08-01-topic-design.id.md` (Indonesian, secondary). Same
pattern for READMEs (`README.md` / `README.id.md`) and other doc types.

**Process:** write and finalize the English version first (including
Spec Self-Review, `.ai/skills/brainstorming.md` Step 9), then translate it
into the `.id.md` companion. Never write the Indonesian version as the
primary draft — English is authored, Indonesian is derived.

- README must always include: setup steps, environment variables,
  migration/seed instructions.
- Changelog entries required whenever a change crosses a module boundary
  documented in `.ai/memory/modules.md` (if this project uses that file).

## Docs Root Location — MANDATORY, Never Inside a Sub-Project Folder
> See `.ai/skills/documentation.md` — Documentation Location Rule.
> All documentation (specs, API docs, guides, changelogs) lives at the
> workspace root, outside every individual sub-project folder — never
> nested inside e.g. `frontend/` or `backend/`.

- **Workspace root path:** `d:\1 MY PROJECT\HRIS\HRIS\`
  (sub-projects will be: `cmd/`, `internal/`, `pkg/` for Go backend;
  `frontend/`, `mobile/`, `shared/` for TS front-end)
- **Docs folder:** `d:\1 MY PROJECT\HRIS\HRIS\docs projects\`
  (8 foundation documents from Fase 0 — see Related Docs below)


## Spec / Design Doc Location
- **Default for new specs:** `docs projects/specs/YYYY-MM-DD-<topic>-design.md`
  (English primary) + `docs projects/specs/YYYY-MM-DD-<topic>-design.id.md`
  (Indonesian companion).
- **Existing docs on file (Fase 0):**
  | File | Content |
  |---|---|
  | `docs projects/01-PRD-HRIS.md` | Master PRD |
  | `docs projects/02-ERD-HRIS.md` | Entity Relationship Diagram |
  | `docs projects/03-SYSTEM-DESIGN.md` | System Design (FINAL stack) |
  | `docs projects/04-ROADMAP-STEP-BY-STEP.md` | Phased roadmap |
  | `docs projects/05-API-SPEC.md` | REST API specification |
  | `docs projects/06-wireframe-mockup.html` | Interactive UI wireframe |
  | `docs projects/11-DESIGN-SYSTEM.md` | Design System (tokens, components, mobile modal patterns) |
  | `docs projects/12-AI-AGENT-TASKS.md` | AI Agent task briefs (T001–T058) |
  | `docs projects/13-MOBILE-UI-CHANGELOG.md` | Mobile UI Changelog — all UI decisions beyond original wireframe |
