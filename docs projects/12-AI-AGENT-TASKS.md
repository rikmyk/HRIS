# AI Agent Task Briefs — HRIS

**How to use:** Task titles here match **exactly** the card titles on the Focalboard board (`10-HRIS-Task-Management.boardarchive`) — used for matching, not as a replacement for Focalboard. This file is the **technical specification** read by the AI coding agent; Focalboard remains the visual status-tracking tool.

**Example agent prompt:**
> "Work on task **T017 — Clock-in/clock-out endpoint** per `12-AI-AGENT-TASKS.md`. Follow the schema in `02-ERD-HRIS.md` and the endpoint spec in `05-API-SPEC.md` §3. When done, move the corresponding card in Focalboard to In Progress/Completed."

**Document reference key (abbreviations used below):**
`PRD`=01-PRD-HRIS.md · `ERD`=02-ERD-HRIS.md · `SYS`=03-SYSTEM-DESIGN.md · `ROAD`=04-ROADMAP-STEP-BY-STEP.md · `API`=05-API-SPEC.md · `WIRE`=06-wireframe-mockup.html · `DS`=11-DESIGN-SYSTEM.md

**Final stack (see `SYS` §3):** Go 1.22+ (Fiber, pgx, sqlc, golang-migrate) · PostgreSQL 16 · Redis 7 + Asynq (job queue) · MinIO (object storage) · chromedp (PDF) · React 18 + TypeScript + Vite (Web) · React Native/Expo (Mobile). Modular monolith, 2 processes: `api` & `worker` (see `SYS` §1 & §4).

---

## Phase 0 — Discovery & Design

### T001 — Finalize the PRD with stakeholders
**Type:** Non-technical (process) — not for the coding agent, for the PM.

### T002 — Lock down core business policy
**Type:** Non-technical. Already finalized: geofence auto-reject, single-level HR approval, manual payment. See `PRD` §3.1, §6.

### T003 — Low-fidelity wireframe for all screens
**Type:** Already done — see `WIRE`.

### T004 — High-fidelity Web & Mobile mockup
**Type:** Already done — see `WIRE` + `DS`.

### T005 — Finalize the ERD & tech stack
**Type:** Already done — see `ERD`, `SYS` §1–§3.

### T006 — Set up the repository & basic CI/CD
**Docs:** `SYS` §4 (Go module structure).
**Acceptance Criteria:**
- Go folder structure per `SYS` §4: `/cmd/api`, `/cmd/worker`, `/internal/<module>`, `/pkg/*`.
- Web (React) & Mobile (React Native/Expo) repos — monorepo or separate repos, consistent with `SYS` §3.
- GitHub Actions: lint (`golangci-lint` for Go, `eslint` for TS) + test + build run automatically on every PR.
- Branch protection on `main`.

### T007 — Set up dev & staging environments
**Docs:** `SYS` §10.
**Acceptance Criteria:**
- `docker-compose.yml` runs PostgreSQL 16, Redis 7, MinIO locally.
- `.env.example` fully covers the needs listed in `SYS` §3.
- README with dev environment setup steps from scratch.

---

## Phase 1 — Core Foundation

### T008 — Initial database schema (User, Role, Company)
**Docs:** `ERD` entities `company`, `user`, `role`, `department`, `position`, `office_location`; `SYS` §3 (golang-migrate).
**Acceptance Criteria:**
- PostgreSQL migrations via `golang-migrate` for **all** entities in `ERD` §1 (create all tables from the ERD in this one task, to avoid repeated migration work later).
- Foreign keys & indexes per the relationships shown in ERD diagram §2.
- Data access queries generated via `sqlc` (not an ORM).
- Minimal seed data (1 company, 4 roles: Employee/Manager/HR Admin/Super Admin).

### T009 — Implement the Auth Service
**Docs:** `API` §1, `SYS` §3 (Fiber, JWT).
**Acceptance Criteria:**
- `/internal/auth` module (Go/Fiber): `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/me` endpoints matching `API` §1 exactly (request/response as shown).
- Passwords hashed with bcrypt; JWT access token expires in 1 hour, refresh token expires in 30 days & is revocable (rotated).
- Unit tests: successful login, failed login, valid/expired refresh token.

### T010 — Implement RBAC
**Docs:** `PRD` §2 (role & access table), `API` role legend in each endpoint table.
**Acceptance Criteria:**
- A Fiber middleware that rejects requests when the role (from the JWT claim) doesn't match the "Role" column for that endpoint in `API`.
- Returns `403 FORBIDDEN` per the error codes in `API` §12.
- Tests: each role can only access its permitted endpoints.

### T011 — CRUD for Employee, Department, Position
**Docs:** `API` §2, `ERD` entities `employee`, `department`, `position`.
**Acceptance Criteria:**
- `/internal/employee` module: all endpoints in `API` §2 (except office-locations, see T012) work with validation.
- `employee.manager_id` self-reference works, for the leave approval hierarchy used later in T029.

### T012 — CRUD for Office Location + geofence
**Docs:** `API` §2 (`/office-locations`), `ERD` entity `office_location`.
**Acceptance Criteria:**
- Endpoint accepts & stores `latitude`, `longitude`, `radius_meters` matching the `API` §2 example.
- Input validation: valid coordinates (-90..90, -180..180) and radius > 0.

### T013 — Set up the React SPA + PWA scaffolding
**Docs:** `SYS` §3 (Web Frontend: React 18 + TypeScript + Vite + TailwindCSS + vite-plugin-pwa).
**Acceptance Criteria:**
- Vite + React 18 + TypeScript + TailwindCSS installed.
- `vite-plugin-pwa` configured (manifest, basic service worker — offline sync isn't needed yet, that's T024).
- Design tokens from `DS` §4 (CSS variables) installed as the base theme.

### T014 — Login page & basic Web layout
**Docs:** `WIRE` (admin shell structure: topbar, sidebar), `DS` §2.10.
**Acceptance Criteria:**
- Admin shell layout (190px sidebar + topbar) per `DS` §2.10 — not a new generic layout.
- Login form wired to `POST /auth/login`.

### T015 — Set up the React Native (Expo) project
**Docs:** `SYS` §3 (Mobile: React Native/Expo SDK 51+).
**Acceptance Criteria:**
- Expo project runs on Android & iOS simulators.
- Auth flow (login → store token in secure storage → auto-redirect) works.

### T016 — Unit tests for the Auth & Employee modules
**Acceptance Criteria:** ≥ 70% coverage for these 2 modules; tests cover error scenarios (error codes from `API` §12).

---

## Phase 2 — GPS + Photo Attendance

### T016B — Multi-Office Placement & Multi-Geofence Validation
**Docs:** `SPEC-2026-08-25-MULTI-OFFICE`, `ERD` table `employee_office_placement`, `API` §2 & §3.
**Acceptance Criteria:**
- **Junction table `employee_office_placement`** created in DB migrations (`/db/migrations/`).
- **Web Admin Employee Placement UI & API:** HR Admin can assign 1 or multiple office placement locations (`office_location_ids: string[]`) to an employee via `POST /employees`, `PUT /employees/{id}`, and `PUT /employees/{id}/office-placements`.
- **Multi-Geofence Validation:** Geofence logic evaluates distance from employee GPS against **ALL** active assigned office placement locations for the employee. Attendance is accepted if within radius of ANY assigned placement; matching `office_location_id` is recorded on `attendance_record`.

### T017 — Clock-in/clock-out endpoint
**Docs:** `API` §3, `ERD` entity `attendance_record`.
**Acceptance Criteria:**
- `/internal/attendance` module: `POST /attendance/clock-in` & `/clock-out` accept `multipart/form-data` (photo, lat, lng, device_id, captured_at) matching the `API` §3 example exactly.
- Success & rejection (403 `OUTSIDE_GEOFENCE`) responses matching the JSON examples in `API` §3.

### T018 — Implement the Haversine geofence check
**Docs:** `SYS` §7 (Geofencing & Photo Validation), `SYS` §4 (`/pkg/geo`).
**Acceptance Criteria:**
- Haversine function in `/pkg/geo`, used by the `attendance` module.
- **If the distance exceeds the radius → auto-reject (HTTP 403), do NOT store an `attendance_record`** — write to `attendance_rejected_log` instead (see T020). This is a final business decision — do not change it to "pending review".
- Unit test with coordinates exactly at the radius boundary (edge case).

### T019 — Upload photos to Object Storage
**Docs:** `SYS` §3 (MinIO), §8 (encryption at rest), §4 (`/pkg/storage`).
**Acceptance Criteria:**
- Photos are uploaded to MinIO via the `/pkg/storage` wrapper; the URL is stored in `attendance_record.clock_in_photo_url`/`clock_out_photo_url`.
- Files are encrypted at rest (Server-Side Encryption) and not publicly accessible without a signed URL.

### T020 — Log rejected attendance attempts
**Docs:** `API` §3 (`/attendance/rejected-attempts`), `ERD` entity `attendance_rejected_log`.
**Acceptance Criteria:**
- Every clock-in/out attempt rejected by the geofence check is recorded (device, lat/lng, time, distance) in the `attendance_rejected_log` table — **not** in `attendance_record`.
- The HR-facing list endpoint matches `API` §3.

### T021 — Native camera integration (selfie only)
**Docs:** `DS` §2.4, §2.18, `WIRE` screen `s-clockin`, `13-MOBILE-UI-CHANGELOG.md` §1.1–§1.2.
**Acceptance Criteria:**
- Camera opens inside a **Modal** (NOT on page load) — triggered by tapping "Absen Masuk" or "Absen Keluar". See `DS §2.18` for the 3-state modal machine (Permission → Camera → Preview).
- **There is no gallery-selection button in the UI at all** (anti-fraud, per `DS §3` principle 6).
- Oval face-guide overlay per `DS §2.4`.
- **2-step photo flow**: capture → preview with "🔄 Foto Ulang" (retake) + "✅ Submit" buttons; only on Submit does the photo attach to the clock-in/out API request.
- ⚠️ **Mobile UI already prototyped in `mobile/App.tsx`** — wire real `expo-camera` CameraView to replace the mock camera box.

### T022 — GPS integration & geofence status UI
**Docs:** `DS` §2.3, §2.18, `WIRE` screens `s-clockin` & `s-clockin-reject`, `13-MOBILE-UI-CHANGELOG.md` §1.1.
**Acceptance Criteria:**
- GPS status badge (within radius / outside radius) with colors & pulse animation per `DS §2.3`.
- GPS info displayed **inside the Attendance Action Modal** (§2.18), not on the main home screen.
- The "Check In" button disabled (visual state per `DS §2.1`) when outside the radius.
- Error banner per `DS §2.11` shown on rejection (Tab 2: "Absen Ditolak" screen).
- ⚠️ **Mobile UI already prototyped in `mobile/App.tsx`** — wire real `expo-location` to replace hardcoded coordinates.

### T023 — Attendance History screen + monthly summary
**Docs:** `WIRE` screen `s-attendance`, `DS` §2.7, §2.19, `13-MOBILE-UI-CHANGELOG.md` §2.
**Acceptance Criteria:**
- **3-Row Compact Card Layout** per `DS §2.7` (Date+Badge / Time row / Photo trigger buttons row).
- "📷 Foto Masuk" + "📷 Foto Keluar" buttons open the Photo Preview Modal per `DS §2.19` — do NOT embed photo thumbnails in the card.
- **3-Tab Filter Bar** (7 Hari | 30 Hari | Bulan Ini) + dynamic HADIR/TERLAMBAT/ALPHA statistics chips above, updating reactively per active tab.
- Data from `GET /attendance/me?range=7d|30d|month` & `/attendance/summary` (`API §3`).
- ⚠️ **Mobile UI already prototyped in `mobile/App.tsx`** — replace mock `attendanceHistory` with real API call.

### T024 — Offline-first attendance capture (IndexedDB)
**Docs:** `SYS` §9.
**Acceptance Criteria:**
- If a clock-in submission fails due to being offline, the data (photo+GPS+timestamp) is stored locally in IndexedDB (via Workbox/`vite-plugin-pwa`).
- Background sync automatically resubmits once back online; the timestamp used is the capture time, not the sync time.

### T025 — Daily attendance KPI dashboard
**Docs:** `WIRE` screen `s-admin-dash`, `DS` §2.8.
**Acceptance Criteria:**
- 4 KPI cards (Present Today, Late, Rejected Attempts, Unpaid Payslips) with colors per `DS` §2.8 variants (`.warn`, `.danger`, `.accent`).

### T026 — Real-time attendance monitoring map
**Docs:** `WIRE` screen `s-admin-live`.
**Acceptance Criteria:**
- The map shows a pin per employee who has checked in today (green = within radius, red = rejected attempt from the T020 log).
- A table below the map: name, check-in time, distance, photo, status.

### T027 — Geofence test scenarios (within/outside radius)
**Acceptance Criteria:** Test cases cover: exactly on the radius boundary, slightly outside, slightly inside, and null/error device coordinates.

---

## Phase 3 — Leave & Payroll Engine

### T028 — CRUD for Leave Type & Leave Request
**Docs:** `API` §4, `ERD` entities `leave_type`, `leave_request`.

### T029 — Manager leave-approval workflow
**Docs:** `API` §4 (`approve`/`reject`), `ERD` relationship `leave_request.approved_by → employee.manager_id`.
**Acceptance Criteria:** Only a direct manager (via `employee.manager_id`) can approve/reject their subordinates' requests.

### T030 — Mobile leave-request screen
**Docs:** `WIRE` bottom-nav "Izin" (Leave) tab (no detailed screen exists in the mockup yet — derive it from the `DS` §2.1 form pattern + §2.7 list pattern).

### T031 — CRUD for Salary Component & Salary Structure
**Docs:** `API` §5, `ERD` entities `salary_component`, `employee_salary_structure`.

### T032 — Payroll Engine — automatic calculation
**Docs:** `PRD` §4.3, `SYS` §5 (payroll module), §6.2 (Monthly Payroll sequence diagram).
**Acceptance Criteria:**
- `/internal/payroll` module. Input: attendance & leave recap per employee within 1 `payroll_period`.
- Output: `payslip` (draft) + `payslip_detail` per component, following the formula gross - deductions = net.
- **One database transaction per employee** (not one giant transaction for the whole batch).
- Unit tests covering scenarios: full attendance, some lateness, some absences, paid & unpaid leave, and combinations thereof.

### T033 — Scheduled job to generate draft payslips
**Docs:** `API` §6, `SYS` §3 (Asynq), §6.2.
**Acceptance Criteria:** An Asynq job (in the `worker` process) runs automatically exactly on each `payroll_period`'s `cutoff_date`, and is idempotent (does not double-generate if re-run).

### T034 — Unit tests for payroll calculation
**Acceptance Criteria:** Coverage of all scenarios from T032, plus edge cases (an employee who joined mid-period, an employee who resigned mid-period).

---

## Phase 4 — Payslip & Approval

### T035 — Payslip review & approve endpoints
**Docs:** `API` §7.
**Acceptance Criteria:** `/internal/payslip` module. `PATCH /payslips/{id}` (correction), `POST /payslips/{id}/approve`, `/reject` matching the `API` §7 example. The payslip is **immutable** once `approved` (see `SYS` §8).

### T036 — Automatic payslip PDF generation
**Docs:** `API` §7 (`pdf_url`), `SYS` §3 (chromedp), §5 (payslip module).
**Acceptance Criteria:** The `worker` process generates the PDF via **chromedp** (renders an HTML/CSS template → PDF) upon approval, containing the details shown in `WIRE` screen `s-payslip-detail`, stored in MinIO, with the link appearing in `payslip.pdf_url`.

### T037 — Bulk approve payslips
**Docs:** `API` §7 (`/payslips/bulk-approve`), `WIRE` `s-admin-payslip` "Approve All Drafts" button.

### T038 — Mark-paid & bulk-mark-paid endpoints
**Docs:** `API` §8.
**Acceptance Criteria:** Matches the `API` §8 request/response examples. **No payment gateway integration** — purely a database status update.

### T039 — `payslips/unpaid` endpoint
**Docs:** `API` §8.

### T040 — Payslip approval screen
**Docs:** `WIRE` screen `s-admin-payslip`, `DS` §2.6, §2.8.
**Acceptance Criteria:** A table with columns for present/late/leave/absent counts, net salary, status (draft/approved pill per `DS` §1.1), and Approve & View Details buttons.

### T041 — Manual payment-marking screen
**Docs:** `WIRE` screen `s-admin-payment`, `DS` §2.11 (info banner).
**Acceptance Criteria:** The "the system does not transfer funds automatically" info banner **must be shown**. A multi-select checkbox + "Mark Selected as Paid" button.

### T042 — Payslip history & detail screens (Mobile)
**Docs:** `WIRE` screens `s-payslip-list` & `s-payslip-detail`, `DS` §2.5, §2.6, `13-MOBILE-UI-CHANGELOG.md` §3.
**Acceptance Criteria:**
- Hero card: dark gradient card with 2 independent side-by-side status tags (HR approval + payment status) — **do not merge them into one status** (per `DS §3` principle 4).
- Breakdown row per `DS §2.6` with deductions in `--danger` color.
- **Payslip History List** below the hero card — see `13-MOBILE-UI-CHANGELOG.md §3.1`:
  - Each past-month card shows: period label, dual status pills (Disetujui + Sudah Dibayar), THP + Gaji Pokok mini row, and a "Unduh PDF (Period)" secondary button.
  - PDF button triggers `Linking.openURL()` to `GET /v1/payslips/{id}/pdf`.
- Data from `GET /payslips/me` (`API §7`).
- ⚠️ **Mobile UI already prototyped in `mobile/App.tsx`** — replace mock `payslipHistory` with real API call.

### T043 — Notifications for payslip issuance & payment status
**Docs:** `API` §9, `SYS` §6.2/§6.3 (trigger list), §5 (notification module).

### T044 — Audit log for approve & mark-paid actions
**Docs:** `ERD` entity `audit_log`, `SYS` §8.
**Acceptance Criteria:** Append-only log; cannot be deleted/edited via any API.

---

## Phase 5 — Reporting

### T045 — Attendance & payroll recap per period
**Docs:** `API` §10.

### T046 — Export reports to Excel/PDF
**Docs:** `API` §10 (`/reports/export`).

### T047 — Web Admin reporting dashboard
**Docs:** `API` §10, `DS` §2.10 (admin shell layout).

### T048 — Reminder for approved-but-unpaid payslips
**Docs:** `API` §9 (reminder trigger), `API` §8 (`/payslips/unpaid`), `SYS` §3 (Asynq scheduled job).

---

## Phase 6 — Mobile Polish & QA

### T049 — Build & submit to Play Store/App Store
**Acceptance Criteria:** Icon & splash screen per `DS` (ink+accent brand mark), camera/location permission requests with clear in-app explanations (not the generic OS permission dialog alone).

### T050 — PWA hardening
**Docs:** `SYS` §9.

### T051 — Basic security audit
**Docs:** `SYS` §8.

### T052 — Load testing for peak attendance hours
**Acceptance Criteria:** Simulate a spike in concurrent `clock-in` requests (office start time), verifying that Redis rate limiting (`API` §13) does not block legitimate users.

### T053 — User Acceptance Testing (UAT)
**Type:** Non-technical (process, involves real HR staff & sample employees).

### T054 — Admin & Employee user manual
**Type:** Documentation — the agent can help draft it from `PRD` + `WIRE`, but it needs human review.

---

## Phase 7 — Go-Live

### T055 — Migrate existing employee data
**Docs:** `ERD` entity `employee` and its dependents.
**Acceptance Criteria:** An idempotent migration script with a dry-run mode, logging every row's success/failure.

### T056–T058 — Training, Rollout, Monitoring
**Type:** Non-technical (operational process, not for the coding agent).

---

## Usage Notes

- Tasks marked **"Non-technical"** should not be handed to the coding agent — they're PM/HR/QA work. Mark them complete directly in Focalboard.
- For technical tasks, always include **at least 2 reference documents** (the `Docs` field) when prompting the agent — the task title alone is not enough detail for the agent to work accurately.
- If the agent needs a detail that turns out not to be documented anywhere (discovered during development), **write it back into the relevant document** (PRD/ERD/API Spec/Design System) so it becomes part of the persisted source of truth — don't let a decision live only in the agent's chat history.
- All `SYS §X` references above follow the final section numbering: §1 Architecture Decision, §2 Diagram, §3 Tech Stack, §4 Module Structure, §5 Modules & Responsibilities, §6 Sequence flows (6.1/6.2/6.3), §7 Geofencing, §8 Security, §9 Offline Strategy, §10 Deployment.
