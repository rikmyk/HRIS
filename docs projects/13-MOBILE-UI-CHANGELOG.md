# Mobile UI Changelog — HRIS
**Status:** Living Document · Tracks all UI changes, flow refinements, and features added to the Mobile App **after** the original wireframe/design system was finalized.
**Last Updated:** 2026-08-26
**Responsible files:** `mobile/App.tsx`, `mobile/src/theme.ts`
**Branch:** `feat/t017-t027-attendance-system`

> Use this document as the bridge between the original wireframe spec (`06-wireframe-mockup.html` + `11-DESIGN-SYSTEM.md`) and the actual implemented mobile app. Any decision made here that deviates from or extends the original spec is authoritative — update the relevant base docs when a feature is considered stable.

---

## 1. Attendance Flow Changes

### 1.1 Camera + GPS Permission Modal (NEW — extends T021 & T022)
**Status:** Implemented ✅

**Original Spec (T021/T022):** Camera opens directly on the attendance screen.

**Change:** Camera does NOT open directly. Instead, the employee presses a primary button ("Absen Masuk" or "Absen Keluar") which opens a **full-screen Modal** that:
1. First shows a loading spinner + "Meminta Akses Kamera & GPS HP..." message for ~1 second.
2. Then shows a live camera frame with face-guide oval overlay (per `DS §2.4`).
3. GPS location info is shown inside the modal.

**Rationale:** Prevents camera/GPS sensor from being active on initial screen load. Reduces battery drain and improves first-impression cleanliness.

**Trigger flow:**
```
Tap "Absen Masuk/Keluar" button
  → openAttendanceModal('in' | 'out')
  → setIsCameraModalOpen(true)
  → setIsRequestingPermissions(true) for 1000ms
  → show live camera frame
  → employee taps "📸 Ambil Foto Selfie"
  → setIsPhotoCaptured(true)
  → photo preview + Retake / Submit buttons
  → handleClockIn() or handleClockOut()
```

---

### 1.2 Photo Capture → Preview → Retake / Submit (NEW — extends T021)
**Status:** Implemented ✅

**Original Spec (T021):** Photo is taken and submitted immediately.

**Change:** A 2-step photo flow:
1. **Step 1 — Capture:** Employee taps "📸 Ambil Foto Selfie" → `isPhotoCaptured = true`.
2. **Step 2 — Preview:** A preview box shows the captured face with a green border + "Foto Tersimpan & Valid" badge.
   - **Button A:** 🔄 Foto Ulang → resets `isPhotoCaptured = false`, goes back to camera.
   - **Button B:** ✅ Submit Masuk / Submit Keluar → calls `handleClockIn()` or `handleClockOut()`.

**New State:** `isPhotoCaptured: boolean` added to `App.tsx`.

**Rationale:** Gives employees control to verify their photo quality before final submission — reduces re-submissions due to blurry/failed selfies.

---

### 1.3 Absen Keluar Added to Home Tab (extends T017)
**Status:** Implemented ✅

**Original Spec (T017):** Only Clock-In was explicitly shown in the wireframe mobile home tab.

**Change:** The Home tab now has a sequential 3-state action button:
1. If NOT clocked in → shows "📷 Absen Masuk (Buka Kamera & GPS)" (green primary button).
2. If clocked in BUT NOT clocked out → shows "📷 Absen Keluar (Buka Kamera & GPS)" (dark blue primary button).
3. If both done → shows "✓ Absensi Hari Ini Selesai" (gray disabled button).

**Modal type:** Both Absen Masuk and Absen Keluar use the same `AttendanceModal` component — distinguished by `attendanceType: 'in' | 'out'` state.

---

### 1.4 Live Real-Time Clock (NEW — not in original spec)
**Status:** Implemented ✅

**Change:** The "WAKTU SEKARANG" banner in the Home tab now shows a live, real-time ticking clock (`HH:mm:ss`) powered by:
```typescript
useEffect(() => {
  const timer = setInterval(() => setCurrentTime(new Date()), 1000);
  return () => clearInterval(timer);
}, []);
```
- **`formatTime(date)`** — formats `HH:mm:ss`.
- **`formatDate(date)`** — formats `Senin, 25 Agustus 2026` in full Indonesian.
- The date label is now dynamic (from system clock), not hardcoded.

**Clock-in/Clock-out Timestamps:** When an employee submits attendance, the timestamp is captured from `new Date()` at the exact moment of submission:
```typescript
const nowStr = formatTime(new Date()) + ' WIB';
setClockInTime(nowStr); // stored in component state
```
This timestamp is then shown in the "Status Absensi Hari Ini" summary card and in the Alert confirmation.

---

## 2. Attendance History Changes

### 2.1 Photo Triggers in History Cards (NEW — extends T023)
**Status:** Implemented ✅

**Original Spec (T023):** History list showed date, status pill, and basic info (no photos).

**Change:** Each attendance history card now contains:
- **Row 1:** Date + Status Badge (Hadir / Terlambat / Alpha).
- **Row 2:** Jam Masuk & Jam Keluar displayed horizontally side-by-side.
- **Row 3:** Two photo trigger buttons — "📷 Foto Masuk" and "📷 Foto Keluar".

Tapping a photo button opens a **full-screen Photo Preview Modal** (`selectedPhoto` state) showing:
- Full-resolution selfie photo (from Unsplash CDN as placeholder; replace with MinIO signed URL in production).
- Attendance detail: date, time, GPS location.
- "✓ GPS & Foto Terverifikasi HRIS (Valid)" confirmation.
- "Tutup Pratinjau" close button.

**New State:** `selectedPhoto: { title, date, url, loc, time } | null` in `App.tsx`.

---

### 2.2 3-Tab Filter + Dynamic Statistics (NEW — extends T023)
**Status:** Implemented ✅

**Original Spec (T023):** Single attendance history list for current month.

**Change:** A **3-Tab Filter Bar** has been added with the following tabs (left to right):

| Position | Label | Filter Logic |
|---|---|---|
| Left | 7 Hari | `attendanceHistory.slice(0, 2)` (simulated) |
| Middle | 30 Hari | `attendanceHistory` (full list) |
| Right | Bulan Ini | `attendanceHistory` (full list) |

**Default active tab:** "Bulan Ini" (rightmost).

**Statistics Panel (above the 3-tab filter bar):**
Three colored summary chips (HADIR / TERLAMBAT / ALPHA) update dynamically based on the active filter:

| Filter | Hadir | Terlambat | Alpha |
|---|---|---|---|
| 7 Hari | 5 | 0 | 0 |
| 30 Hari | 22 | 1 | 0 |
| Bulan Ini | 18 | 1 | 0 |

**New State:** `historyFilter: '7days' | 'month' | '30days'` in `App.tsx` (default: `'month'`).

**Layout Order (top to bottom):**
1. Statistics summary chips (HADIR / TERLAMBAT / ALPHA).
2. 3-Tab Filter selector (7 Hari | 30 Hari | Bulan Ini).
3. History card list.

---

### 2.3 Removed Legacy "Riwayat Kehadiran Bulan Ini" Block
**Status:** Removed ✅

The old plain attendance history block (text-only cards without selfie photo buttons) that was a duplicate of the new selfie-enabled history has been **fully removed**. The History tab now has a single, unified source of truth.

---

## 3. Payslip Changes

### 3.1 Historical Payslip List with PDF Download per Period (NEW — extends T042)
**Status:** Implemented ✅

**Original Spec (T042):** A single hero card showing the current month's payslip + 1 PDF download button.

**Change:** Below the hero card, a "Riwayat Slip Gaji Karyawan" section has been added showing a scrollable list of past monthly payslips.

**Each payslip card contains:**
- 📄 Period label (e.g., "Agustus 2026") + Feather "file-text" icon.
- Dual status pills: HR approval status ("Disetujui") + Payment status ("Sudah Dibayar") — displayed independently per `DS §2.2`.
- Mini summary panel (Take Home Pay amount + Gaji Pokok).
- **"Unduh PDF (Period)" button** → triggers `Linking.openURL(item.pdfUrl)` pointing to the Go Backend PDF endpoint:
  ```
  GET /v1/payroll/public/payslips/{id}/pdf
  ```

**Simulated Data (3 months):**

| Period | THP | Deduction |
|---|---|---|
| Agustus 2026 | Rp 9.850.000 | -Rp 150.000 |
| Juli 2026 | Rp 10.000.000 | Rp 0 |
| Juni 2026 | Rp 9.700.000 | -Rp 300.000 |

**New State:** `payslipHistory: array` added to `App.tsx` (static mock data — replace with `GET /payslips/me` in production).

---

## 4. Design System Extensions (Mobile-Specific)

### 4.1 Action Modal Pattern
Not in `DS §2`, but now a standard for the mobile app:

| Element | Style |
|---|---|
| Modal container | `backgroundColor: rgba(0,0,0,0.7)`, `flex: 1`, centered |
| Modal card | White `#FFF`, `borderRadius: Radius.lg`, `padding: 24`, `width: '95%'` |
| Header row | Left title (Space Grotesk 700) + Right X close button (Feather icon) |
| Content | Camera box, GPS strip, or photo preview |

### 4.2 Photo Preview Modal (full-screen overlay)
Dark overlay (`rgba(0,0,0,0.85)`), dark card (`#1E293B`), photo in 260px height container, meta info in `#0F172A` box.

### 4.3 Compact History Card (3-row layout)
New card anatomy replacing the old 2-row layout:
- **Row 1:** `flexDirection: row`, justifyContent: `space-between` — Date text + Status Badge pill.
- **Row 2:** `flexDirection: row` — "Masuk: HH:mm" on left + "Keluar: HH:mm" on right.
- **Row 3:** `flexDirection: row`, `gap: 8` — "📷 Foto Masuk" button + "📷 Foto Keluar" button (secondary style, `flex: 1`).

### 4.4 App Settings & Assistance (NEW — Profile Screen)
**Status:** Implemented (UI Shell) ✅

**Added Items:**
1. **Panduan Penggunaan Aplikasi (View App User Guide)** — `book-open` icon, directs user to app guide.
2. **Tema Tampilan (Theme Change)** — `sun` icon, displays `Mode Terang (Light Mode)` with a non-functional pill switch (`[ Terang | Gelap ]`).
3. **Bahasa Aplikasi (Language Change)** — `globe` icon, displays `Bahasa Indonesia (Default)` with an `🇮🇩 ID` selector pill.
4. **Tentang HRIS Mobile (About This App)** — `info` icon, displays application version `v2.4.0 (Build 2026.08)`.

### 4.5 Green Hero Profile Card & Details Card Redesign (NEW — Profile Screen)
**Status:** Implemented ✅

**Mockup Alignment:** Restructured profile screen to match exact visual layout provided in screenshot:
1. **Green Hero Profile Card (`Colors.forestGreen` / `#2F6F5E`):**
   - Theme color matching the active clock-in button ("Absen Masuk") and mobile design system.
   - Translucent circular avatar container (`rgba(255,255,255,0.25)`) with white bold initial letter.
   - Large bold uppercase employee name (`BUDI SANTOSO`).
   - Employee account NIK badge subtitle (`EMP-2026-001`).
   - Translucent rounded position pill (`Senior Software Engineer`).
2. **White Details Card:**
   - Single clean card container with light border (`#F1F5F9`) and key-value rows (`Account`, `Name`, `Employee Code`, `Department`, `Penempatan Kantor`, `Email`).

### 4.6 Safe Area Padding & Status Bar Adjustments (NEW — Mobile App)
**Status:** Implemented ✅

**Fixes & Adjustments:**
1. **Top Safe Area / Notch & Status Bar**: Added `Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0` top padding to `styles.container` and rendered `<StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />` to prevent the header from overlapping the device status bar.
2. **Bottom Safe Area / Home Indicator**: Added `paddingBottom: Platform.OS === 'ios' ? 24 : 12` to `styles.bottomNav` and increased `content` scroll padding to `120px` to prevent the bottom navigation bar and content from being covered by iOS/Android gesture bars.

### 4.7 Forest Green Theme Alignment for Payslip Hero Card (NEW — Mobile App)
**Status:** Implemented ✅

**Styling Updates:**
1. **Payslip Hero Card (`styles.payslipHero`)**: Changed background color from slate dark (`#1E293B`) to **Forest Green** (`Colors.forestGreen` / `#2F6F5E`), matching the Profile hero card and primary clock-in action buttons.
2. **Typography Contrast**: Adjusted text label opacities (`rgba(255,255,255,0.85)` for period and `rgba(255,255,255,0.75)` for Take Home Pay label) with green elevation shadows (`elevation: 4`, `shadowColor: Colors.forestGreen`).

### 4.8 Real CameraView & GPS Sensor Integration (NEW — Mobile App)
**Status:** Implemented ✅

**Features Integrated:**
1. **Live Camera (`expo-camera` SDK 54)**: Replaced mock camera placeholder box in `mobile/App.tsx` with live `<CameraView facing="front" ref={cameraRef}>` rendering live hardware front camera feed inside the modal.
2. **Selfie Photo Capture**: Added `takePictureAsync()` capture mechanism saving base64/uri photo state (`capturedPhotoUri`) with photo preview frame and retake option (`🔄 Foto Ulang`).
3. **Live GPS Location (`expo-location`)**: Wired `Location.getCurrentPositionAsync()` to fetch real latitude/longitude coordinates dynamically upon modal open.
4. **Retake Photo Blank Screen Fix**: Implemented `cameraKey` timestamp state (`setCameraKey(Date.now())`) on `<CameraView key={cameraKey}>` to force a clean unmount and immediate hardware surface remount when clicking "Foto Ulang", eliminating black/blank preview screens on Android/iOS.
5. **Android SurfaceView Z-Ordering Fix**: Replaced native React Native `<Modal transparent>` for camera dialog with conditional absolute View overlay (`styles.modalOverlayAbsolute`). This resolves Android OS hardware composer `SurfaceView` window bleeding where camera preview rendered behind the parent window while leaving the modal sheet container blank.
6. **CameraView Native Surface & Layout Overlay Separation**: Separated `<CameraView style={{ width: '100%', height: '100%' }} mode="picture" />` from UI text/guides overlay (`zIndex: 10`). In Expo SDK 54 on Android, nesting children inside `CameraView` caused child ViewGroup layout passes to obscure the underlying native `TextureView` surface buffer resulting in blank/dark previews during retakes.
7. **Strict Front Camera Lock & Clean "Live" Badge UI**: Locked `<CameraView facing="front">` strictly to the front camera, removed the camera toggle button completely, and simplified top-left badge text to read only `"Live"`.
8. **Native CameraX Capture Lock Release Delay (`isCameraRefreshing`)**: Implemented a 250ms asynchronous refresh window during retake (`handleRetakePhoto`). After calling `takePictureAsync()`, Android native CameraX driver locks the camera capture pipeline. Temporarily unmounting `<CameraView>` for 250ms via `isCameraRefreshing = true` allows Android hardware to close the snapshot thread and re-initialize live preview without black/blank screen locks.
9. **Direct Hardware Selfie Photo Capture (Simplified Pipeline)**: Removed client-side face detection & liveness restrictions per request. Users can take selfie photos directly via `<CameraView facing="front">` using `📸 Ambil Foto Selfie` button with immediate preview and photo retake support (`🔄 Foto Ulang`).
10. **Clean Pure White Card Aesthetics for Photo Preview & Zoom Dialogs**: Redesigned all modal cards (attendance selfie preview container, GPS card container, and full-screen photo detail modal container) to use pure white backgrounds (`#FFFFFF`) with crisp light borders (`borderColor: Colors.lineBorder`) and dark typography (`color: Colors.darkInk`), ensuring color is reserved strictly for action buttons (`btnPrimary`, `btnSecondary`).

### 4.9 Max 5 Items-per-Page Pagination System (NEW — Attendance, Payslip, Leave Modules)
**Status:** Implemented ✅

**Implementation Details:**
1. **Attendance History Pagination**: Added `attendancePage` state and `ATTENDANCE_PER_PAGE = 5` constant to limit daily attendance history rendering to a maximum of 5 records per page.
2. **Filter Reset Logic**: Switching attendance filter tabs (`7 Hari`, `30 Hari`, `Bulan Ini`) automatically resets `attendancePage` back to 1.
3. **Payslip & Leave Request Pagination**: Implemented matching 5-item pagination controls (`Sebelumnya`, `Halaman X dari Y`, `Selanjutnya`) for Payslip History and Leave Request History tabs.
4. **Pagination Control Bar**: Added responsive bottom pagination control bar rendered only when total filtered pages > 1, with disabled opacity states for boundary pages.

### 4.10 Standardized White Card Containers & Minimalist Lucide Icons (NEW — Profile & Form Modules)
**Status:** Implemented ✅

**Implementation Details:**
1. **Leave Request Form Card Container**: Enclosed all form input fields (leave type, days, reason) and submission button inside a unified white Card container (`#FFF`, `Colors.lineBorder`).
2. **Attendance History Summary Header Card Container**: Enclosed attendance summary statistics cards and filter tabs inside a styled white Card container.
3. **Minimalist Lucide React Iconography**: Replaced legacy `Feather` icons in the Profile settings and assistance menu with `lucide-react-native` icons (`BookOpen`, `Sun`, `Globe`, `Info`, `ChevronRight`, `ChevronDown`) in a plain dark ink color (`Colors.darkInk`), eliminating background circle wrappers per user request.

### 4.11 Complete Dynamic Dark Mode & Switch Pill Capsule Lock (NEW — All Mobile Modules)
**Status:** Implemented ✅

**Implementation Details:**
1. **Dynamic Theme Engine (`themeColors`)**: Migrated all remaining UI hardcoded hex colors (`#FFF`, `#FFFFFF`, `#1E293B`) in Leave History, Payslip List/Breakdown, and Attendance History to dynamic `themeColors` tokens (`surface`, `subCardBg`, `lineBorder`, `darkInk`, `mutedText`).
2. **Outlined Surface Aesthetics**: Standardized cards in both Light and Dark modes to use `themeColors.surface` with explicit `borderWidth: 1` and `borderColor: themeColors.lineBorder` (`#334155` in Dark Mode), preventing white flashes and background blending.
3. **Attendance History Dark Mode Adjustments**: Updated summary stat counters (Hadir, Terlambat, Alpha) and selfie action trigger buttons to maintain high visual contrast in dark mode.
4. **Payslip Module Dark Mode Adjustments**: Refactored monthly payslip history cards, THP badges, breakdown detail rows, and pagination controls to be theme-aware.
5. **Theme Switch Pill Oval Shape Lock**: Resolved transition layout glitch where toggling Light/Dark mode caused the switch pill to lose its oval geometry and render rectangular corners. Applied `borderRadius: 9999` (capsule radius) and explicit `overflow: 'hidden'` on both the track container and inner active pills.

### 4.12 Web Admin & Employee App Parity Synchronization (NEW — Web Admin Frontend)
**Status:** Implemented ✅

**Implementation Details:**
1. **Interactive Selfie Photo View & Zoom Modal**: Replaced plain color avatars in the attendance monitoring table with actual employee selfie thumbnails and added a full-screen **"Zoom Foto & Maps"** preview modal (displaying employee selfie photo, NIK, clock-in timestamp, geofence office location, GPS distance, and validation tag).
2. **Dedicated Leave Management Tab (`activeTab === 'leave'`)**: Added a dedicated "Pengajuan Izin" sidebar navigation item equipped with status filter buttons (*Semua*, *Menunggu Review*, *Disetujui*, *Ditolak*), employee search bar, leave detail preview modal (showing employee reason & doctor's note document attachments), and instant Approve / Reject action triggers.
3. **Interactive Payslip Breakdown Modal**: Added a **"Rincian Gaji"** detail breakdown modal in the Approval & Payment tabs, allowing HR Admins to inspect itemized Gaji Pokok, Tunjangan, and Potongan before approving or marking as paid.
4. **Interactive "+ Tambah Karyawan Baru" Form Modal**: Added a complete form modal to register new personnel (NIK, Nama Lengkap, Departemen, Jabatan, Status, Penetapan Gaji Pokok, Penetapan Tunjangan, Rekening Bank Transfer, and Multi-Office Geofence Placement) which automatically generates draft payslips synced with the assigned salary.
5. **Master Data Penetapan Gaji & Cabang Button**: Added an **"Atur Gaji & Cabang"** action trigger for existing employees to update their base salary, allowances, and branch assignments.
6. **Monitoring Filter Selector**: Added tab filters (*Semua*, *✓ Valid Dalam Radius*, *⚠️ Ditolak Luar Radius*) and employee search capability in real-time attendance monitoring.
7. **Topbar Light/Dark Mode Switcher**: Added a theme toggle switcher button in the Web Admin header topbar.

---

## 5. API Integration Notes (for backend team)

The following endpoints are already called (or simulated) from `mobile/App.tsx` and must be available in the Go backend:

| Endpoint | Called From | Status |
|---|---|---|
| `POST /v1/attendance/clock-in` | `handleClockIn()` | Simulated (try/catch) |
| `POST /v1/attendance/clock-out` | `handleClockOut()` | Simulated (try/catch) |
| `POST /v1/leave/request` | `handleSubmitLeave()` | Simulated (try/catch) |
| `GET /v1/payroll/public/payslips/ps-001/pdf` | PDF Download button | `Linking.openURL()` |
| `GET /v1/payroll/public/payslips/ps-002/pdf` | Riwayat PDF button | `Linking.openURL()` |
| `GET /v1/payroll/public/payslips/ps-003/pdf` | Riwayat PDF button | `Linking.openURL()` |

> **Note on `captured_at`:** When wiring the real camera integration, pass the exact capture timestamp (not submission timestamp) to `POST /attendance/clock-in` per `API §3` spec — matching the offline-first principle in T024.

---

## 6. Outstanding Items / Next Steps

| Item | Priority | Task Ref |
|---|---|---|
| Wire live camera (`expo-camera`) to replace the mock camera box | High | T021 |
| Wire real GPS (`expo-location`) to replace hardcoded coordinates | High | T022 |
| Replace `attendanceHistory` mock data with `GET /attendance/me?range=...` | High | T023 |
| Replace `payslipHistory` mock data with `GET /payslips/me` | High | T042 |
| Implement `useMemo` on filtered history list to prevent re-renders | Medium | — |
| Add `30 Hari` and `7 Hari` filter query params to backend endpoint | Medium | T023 |
| Real-device testing: camera modal transition smoothness on low-end Android | Medium | T049 |
