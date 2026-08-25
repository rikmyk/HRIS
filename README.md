# HRIS — Human Resource Information System

A centralized HRIS platform featuring automated attendance with Haversine GPS geofencing & selfie photo capture, single-level HR payslip approval, and automated payroll calculation.

---

## Technical Architecture

- **Backend**: Go 1.22+ (Fiber v2.52+, pgx v5, sqlc, golang-migrate)
- **Database**: PostgreSQL 16
- **Cache & Worker Queue**: Redis 7 + Asynq v0.24+
- **Object Storage**: MinIO (S3-compatible for attendance photos and payslip PDFs)
- **PDF Generation**: `chromedp` (headless Chrome in Go)
- **Web SPA & PWA**: React 18 + TypeScript + Vite 5+ (TailwindCSS v3.4)
- **Mobile**: React Native (Expo SDK 51+)

---

## Directory Structure

```text
.
├── backend/            # Go modular monolith backend
│   ├── cmd/
│   │   ├── api/        # HTTP API process entrypoint
│   │   └── worker/     # Background worker process entrypoint
│   ├── internal/       # Domain modules (auth, employee, attendance, leave, payroll, payslip, notification, audit)
│   ├── pkg/            # Shared Go packages (db, geo, storage, queue)
│   ├── go.mod
│   └── go.sum
├── frontend/           # React Web SPA & PWA App
├── mobile/             # React Native (Expo) Mobile App
├── shared/             # Shared TypeScript types and DTO interfaces
├── docs projects/      # System design specifications and planning docs
├── .github/workflows/  # CI/CD automation pipelines
├── docker-compose.yml  # Local development infrastructure setup
└── .env.example        # Environment variable baseline template
```

---

## Getting Started (Local Development)

### 1. Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Go 1.22+](https://go.dev/)
- [Node.js 20+](https://nodejs.org/)

### 2. Infrastructure Setup
Spin up PostgreSQL, Redis, and MinIO containers:

```bash
docker-compose up -d
```

Verify running services:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MinIO API**: `localhost:9000`
- **MinIO Console**: `http://localhost:9001` (User: `minio_admin`, Password: `minio_secret_password`)

### 3. Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Running the Backend

Run unit tests:
```bash
cd backend
go test -v ./...
```

Start HTTP API server:
```bash
cd backend
go run cmd/api/main.go
```
The API server will listen on `http://localhost:8080` (Health check at `http://localhost:8080/health`).

Start Worker process:
```bash
cd backend
go run cmd/worker/main.go
```

---

## Dual Language Documentation

- **English (Primary)**: `README.md`
- **Indonesian (Secondary)**: `README.id.md`