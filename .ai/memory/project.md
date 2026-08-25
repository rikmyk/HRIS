# Project Memory

> This file holds long-term context about the project itself. Planner and
> Docs load this file for context. Update it whenever the project's scope,
> goals, or audience materially change.
> Last updated: 2026-08-25 — docs paths corrected, new docs registered, tech stack note updated; `13-MOBILE-UI-CHANGELOG.md` added for all mobile UI decisions made outside the original wireframe.

## Project Name
HRIS — Human Resource Information System

## Description
A centralized HRIS platform that replaces manual attendance and payroll
processes with a fully digital system. Employees clock in/out via GPS +
selfie photo with automatic geofence rejection (outside-radius = auto-reject,
no record saved). Payroll is calculated automatically from attendance data;
HR reviews and approves digital payslips, which then appear in each
employee's account. Salary payments are performed **manually by HR** outside
the system (no payment gateway); HR marks payment status inside the system.
Accessible via Web SPA + PWA (installable, offline-first for attendance) and
Mobile App (Android/iOS).

## Goals
- Eliminate manual/Excel-based attendance and payroll with a reliable digital
  system that prevents proxy attendance (titip absen) via GPS geofencing +
  photo capture.
- Automate the full payroll cycle: attendance recap → payroll calculation →
  draft slip generation → HR approval → PDF delivery to employee.
- Provide complete, immutable audit trails for all payroll, approval, and
  payment-marking actions (compliance & accountability).
- Support minimum 5,000 active employees with 99.5% uptime target.

## Target Users

| Role | Who They Are | What the System Solves |
|---|---|---|
| **Employee (Karyawan)** | Daily staff | Clock in/out with GPS+photo, view payslips, submit leave requests |
| **Manager/Supervisor** | Direct supervisors | Approve/reject leave requests for their team |
| **HR Admin** | HR and payroll staff | Manage employees, configure salary components, review/approve payslips, mark payment status, monitor attendance in real-time |
| **Super Admin** | System administrators | Configure company, roles & permissions, geofence coordinates per office/branch |

## Current Stage
**Fase 0 — Discovery, Design & UI Canvas** (100% COMPLETE).
All 8 planning documents in `docs projects/` are finalized, and all 16 UI screens
(9 original + 7 newly generated gap screens) have been generated and 100% synchronized
with the Design System (ADR-008 & `11-DESIGN-SYSTEM.md`).
Next milestone: **Fase 0 Infrastructure (T006–T007)** (Go backend repo structure, CI/CD,
docker-compose dev env) & **Fase 1 Core Foundation (T008–T016)** (Auth + Employee Management).

## Key Constraints
- **No payment gateway integration** — salary payment is always manual by HR
  via internet banking; system only records payment status.
- **Single-level payroll approval** — HR Admin is the final approver; no
  separate Finance approver level.
- **Payslip immutability after approval** — approved slips cannot be edited
  directly; corrections must go through a new revision process with full
  audit logging.
- **Geofence auto-reject is non-negotiable** — attendance outside radius is
  rejected at the server (HTTP 403), no record created; only a rejection log
  is saved for HR monitoring.
- **Offline-first for attendance (PWA)** — IndexedDB + Service Worker
  background sync; timestamp used is capture time, not server-receive time.
- **UU PDP compliance** — GPS coordinates and selfie photos must be stored
  encrypted at rest; data retention follows company policy.
- **Timeline** — approximately 4–5 months for full build (Fase 0–7);
  MVP fast-path (Fase 1–4) achievable in 6–8 weeks.

## Out-of-Scope (Project-Level)
- Recruitment (ATS) and applicant tracking.
- Performance appraisal and learning management system (LMS).
- Integration with external accounting/ERP systems (may be Fase next).
- Face recognition / liveness detection (optional future enhancement).
- Automatic salary disbursement / payment gateway of any kind.

## Related Spec
- Master PRD: `docs projects/01-PRD-HRIS.md`
- ERD: `docs projects/02-ERD-HRIS.md`
- System Design (FINAL Go stack): `docs projects/03-SYSTEM-DESIGN.md`
- Roadmap: `docs projects/04-ROADMAP-STEP-BY-STEP.md`
- API Spec: `docs projects/05-API-SPEC.md`
- Wireframe Mockup: `docs projects/06-wireframe-mockup.html`
- Design System: `docs projects/11-DESIGN-SYSTEM.md`
- AI Agent Task Briefs (T001–T058): `docs projects/12-AI-AGENT-TASKS.md`
- Mobile UI Changelog (all changes beyond wireframe): `docs projects/13-MOBILE-UI-CHANGELOG.md`
- Multi-Office Placement Spec: `docs projects/specs/2026-08-25-multi-office-placement-design.md` (Indonesian: `2026-08-25-multi-office-placement-design.id.md`)
