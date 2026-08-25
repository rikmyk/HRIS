# HRIS — Human Resource Information System (Bahasa Indonesia)

Platform HRIS terpusat dengan absensi otomatis berbasis GPS Geofencing (Haversine) & foto selfie, persetujuan slip gaji HR satu tingkat, dan kalkulasi payroll otomatis.

---

## Arsitektur Teknis

- **Backend**: Go 1.22+ (Fiber v2.52+, pgx v5, sqlc, golang-migrate)
- **Database**: PostgreSQL 16
- **Cache & Worker Queue**: Redis 7 + Asynq v0.24+
- **Object Storage**: MinIO (S3-compatible untuk foto absensi dan PDF slip gaji)
- **PDF Generation**: `chromedp` (headless Chrome dalam Go)
- **Web SPA & PWA**: React 18 + TypeScript + Vite 5+ (TailwindCSS v3.4)
- **Mobile**: React Native (Expo SDK 51+)

---

## Struktur Direktori

```text
.
├── backend/            # Go modular monolith backend
│   ├── cmd/
│   │   ├── api/        # Process HTTP API entrypoint
│   │   └── worker/     # Process Background worker entrypoint
│   ├── internal/       # Modul domain (auth, employee, attendance, leave, payroll, payslip, notification, audit)
│   ├── pkg/            # Utility Go bersama (pkg/geo Haversine, db, storage, queue)
│   ├── go.mod
│   └── go.sum
├── frontend/           # Aplikasi Web SPA Admin & PWA
├── mobile/             # Aplikasi Mobile Karyawan (React Native Expo)
├── shared/             # Tipe TypeScript dan antarmuka DTO bersama
├── docs projects/      # Spesifikasi arsitektur dan dokumen perencanaan
├── .github/workflows/  # Pipeline otomatisasi CI/CD
├── docker-compose.yml  # Konfigurasi infrastruktur pengembang lokal
└── .env.example        # Template konfigurasi environment variable
```

---

## Panduan Memulai (Pengembangan Lokal)

### 1. Prasyarat
- [Docker & Docker Compose](https://www.docker.com/)
- [Go 1.22+](https://go.dev/)
- [Node.js 20+](https://nodejs.org/)

### 2. Memulai Infrastruktur
Jalankan kontainer PostgreSQL, Redis, dan MinIO:

```bash
docker-compose up -d
```

Verifikasi layanan berjalan:
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`
- **MinIO API**: `localhost:9000`
- **MinIO Console**: `http://localhost:9001` (Username: `minio_admin`, Password: `minio_secret_password`)

### 3. Environment Variables
Salin file `.env.example` ke `.env`:

```bash
cp .env.example .env
```

### 4. Menjalankan Backend

Jalankan pengujian unit:
```bash
cd backend
go test -v ./...
```

Jalankan server HTTP API:
```bash
cd backend
go run cmd/api/main.go
```
Server API akan mendengarkan di `http://localhost:8080` (Cek kesehatan di `http://localhost:8080/health`).

Jalankan proses Worker:
```bash
cd backend
go run cmd/worker/main.go
```

---

## Dokumentasi Dua Bahasa

- **Bahasa Inggris (Utama)**: `README.md`
- **Bahasa Indonesia (Sekunder)**: `README.id.md`
