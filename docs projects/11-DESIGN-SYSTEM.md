# Design System (Interim) — HRIS

**Status:** Interim — derived directly from `06-wireframe-mockup.html`. This document has one purpose: ensure the agent/developer building the real application **uses the tokens & components exactly as they appear in the mockup**, rather than inventing a new design. Once a UI/UX Designer joins in Phase 0, this document can be superseded by a final design system (e.g., in Figma).

> **Instruction for the AI coding agent:** Do not improvise colors, fonts, radii, or spacing outside of what is written here. If a new component is needed that isn't covered by this document, derive it from the existing tokens (do not introduce new colors/values), and flag it as "new component — needs design review" in the PR/commit.

> **Note on UI language:** All in-app text/labels (buttons, statuses, error messages) **remain in Indonesian**, since the target users are employees & HR staff in Indonesia. This document (and its Indonesian counterpart) only describes the *design*, not a change of the product's language.

---

## 1. Design Tokens

### 1.1 Color

| Token | Hex | Usage |
|---|---|---|
| `--ink` | `#1B2430` | Primary text color, dark backgrounds (phone frame, camera box, payslip card gradient start) |
| `--primary` | `#2F6F5E` | Primary action color (main buttons, "present/within radius/paid" status), brand accent |
| `--primary-dark` | `#204F42` | Text on light-primary backgrounds (green pills) |
| `--accent` | `#E8A33D` | Secondary accent (avatar placeholder, "H" brand mark) — used sparingly, not a dominant color |
| `--bg` | `#F5F3EE` | Page background (warm paper tone, not flat white) |
| `--surface` | `#FFFFFF` | Card/panel/table background |
| `--danger` | `#C24A3B` | Errors, rejected/absent status, salary deductions (negative amounts) |
| `--muted` | `#6B7280` | Secondary text/captions/labels |
| `--line` | `#E5E1D8` | Borders & dividers (warm-toned, not neutral gray) |
| `--radius` (default) | `14px` | Standard radius for cards & large buttons |

**Status pill colors (background / text):**

| Status | Background | Text |
|---|---|---|
| Present / Paid / Within Radius | `#E4F3EC` | `#204F42` (primary-dark) |
| Late / Approved / Warning | `#FDF1DC` | `#9A6714` |
| Absent / Rejected / Danger | `#FBEEEC` | `#8A3226` |
| Leave / Info | `#E9EEF7` | `#2F4E8A` |
| Draft / Neutral | `#EFEDE7` | `#6B7280` (muted) |

**Phase label colors (for the task board, ref. `08`/`10`):** Purple, Blue, Sky, Lime, Yellow, Orange, Pink/Red, Green — one distinct color per phase, in order from Phase 0→7.

### 1.2 Typography

| Role | Font | Usage |
|---|---|---|
| **Display / Heading** | `Space Grotesk` (500/600/700) | All headings (`h1,h2,h3`), large salary figures, KPI numbers, the digital clock on the attendance screen, the brand mark |
| **Body / UI** | `Inter` (400/500/600/700) | All body text, labels, buttons, tables, forms |

Import: `https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap`

**Size scale used in the mockup** (do not add new sizes without justification):
- Large page/section title: `26px` (Space Grotesk, 700)
- Card title / username in the app top bar: `17px` (Space Grotesk, 700)
- Large numbers (clock, KPI, salary amount): `24–34px` (Space Grotesk, 700)
- Main body/label text: `13–13.5px` (Inter, 600 for list item titles)
- Caption/sub-label: `11–12.5px` (Inter, 400–500, `--muted` color)
- Eyebrow/section title (uppercase): `11px`, `letter-spacing: .08em–.12em`, `font-weight: 600–700`

### 1.3 Spacing & Radius

- Large radius (cards, phone screen, camera box, payslip card): `14–36px` depending on context (outer phone frame `36px`, inner phone screen `26px`, general cards `12–18px`).
- Small radius (pill/badge): `999px` (full pill).
- Mini button radius (admin table): `8–9px`.
- Standard card padding: `12–18px`.
- List item spacing: `1px solid var(--line)` bottom border, `9–13px` vertical padding.

### 1.4 Shadow
- Primary button: `box-shadow: 0 10px 20px -8px rgba(47,111,94,.55)` (soft glow in the primary color, not a generic gray shadow).
- Phone frame: `box-shadow: 0 20px 40px -14px rgba(27,36,48,.35)`.
- Admin shell/large card: `box-shadow: 0 20px 50px -24px rgba(27,36,48,.25)`.

---

## 2. Components (from the mockup, must be replicated)

### 2.1 Buttons
| Variant | Style |
|---|---|
| **Primary** | Background `--primary`, white text, `14px` radius, `15px` padding, Space Grotesk 700 15px, primary-colored glow shadow. Used for the main action (Check In, Approve). |
| **Primary — disabled** | Background `#C7C2B5`, no shadow, `not-allowed` cursor. Used when attendance is rejected (outside geofence). |
| **Secondary** | Background `--surface`, `1px solid var(--line)` border, `--ink` text, `14px` radius. Secondary actions (View history, Download PDF). |
| **Mini (admin table)** | `1px solid var(--line)` border, `6px 12px` padding, `8px` radius, 12px 600 font. `.primary` variant (primary background) and `.dark` variant (ink background) for important actions (Approve All, Mark as Paid). |

### 2.2 Status Pill / Badge
A small pill (`border-radius: 999px`, `4px 10px` padding, `10.5px` 700 font) using the background/text color pairs from table 1.1. **Always use the predefined bg+text pairing** — never invent a new status color.

### 2.3 GPS/Geofence Indicator
A location status card (`.gps-card`) with a pin icon inside a pulsing-animation circle:
- **Within radius**: background `#F0F7F4`, border `#CFE6DC`, `--primary`-colored icon circle + `--primary` pulse ring.
- **Outside radius**: background `#FBEEEC`, border `#F0C7C0`, `--danger`-colored icon circle + `--danger` pulse ring.
- Pulse animation: `scale(.8)→scale(1.6)`, opacity `.6→0`, `2s ease-out infinite` duration.

### 2.4 Camera / Face Capture Box
A dark gradient box (`linear-gradient(145deg,#2A3644,#151C24)`), 3/4 aspect ratio, `18px` radius, containing:
- A white dashed oval guide overlay (`face-guide`) for face positioning.
- A camera status badge in the top corner (live indicator with a green/red dot).
- Hint text below, white, `11px`.

### 2.5 Payslip Summary Card
Dark gradient (`linear-gradient(135deg, var(--ink), #2A3644)`), white text, `16px` radius, `18px` padding. Contains: a period label (uppercase, .7 opacity), a large amount (Space Grotesk 26px 700), and status tags (`ps-tag`, semi-transparent white pills) — **two tags side by side**: HR approval status & payment status, since the two are independent (see `03-SYSTEM-DESIGN.md` §6.2 & §6.3).

**Mobile Payslip History List (below the hero card — T042 extension):**
Each past-period payslip card contains: period label + Feather `file-text` icon, two independent status pills (Disetujui + Sudah Dibayar per §2.2), a mini summary row (THP + Gaji Pokok on `#F8FAFC` background), and a secondary button "Unduh PDF (Period)" that triggers `Linking.openURL()` to `GET /v1/payslips/{id}/pdf`. Do NOT merge the two status pills into one (see principle §3, item 4).

### 2.6 Breakdown Row (Salary/Attendance Details)
A detail list with `justify-content: space-between`, a dashed `var(--line)` bottom border, deduction amounts colored `--danger` with a "–" prefix. The total row (`.total`) is bold with no bottom border.

### 2.7 List Item (Attendance/Payslip History)
`justify-content: space-between`, a title (13.5px 600) + sub-label (11.5px, muted) on the left, a status pill on the right. Section titles (uppercase 11px, muted, 700) group items by period.

**Mobile Attendance History Card — 3-Row Compact Layout (T023 extension, implemented in `App.tsx`):**
- **Row 1:** `flexDirection: row`, `justifyContent: space-between` — Date label left + Status Badge pill right.
- **Row 2:** `flexDirection: row` — "Masuk: HH:mm WIB" left, "Keluar: HH:mm WIB" right.
- **Row 3:** `flexDirection: row`, `gap: 8` — "📷 Foto Masuk" secondary button (`flex: 1`) + "📷 Foto Keluar" secondary button (`flex: 1`). Tapping opens the Photo Preview Modal (§2.19).

**Mobile Attendance History Filter Bar (above history list — T023 extension):**
3-tab pill selector in a `#E2E8F0` container. Tabs left→right: `7 Hari` | `30 Hari` | `Bulan Ini`. Active tab: `--primary` bg, white text. Inactive: transparent, `--muted` text. Default: `Bulan Ini`.
Above the filter bar, 3 dynamic statistics chips (HADIR/green, TERLAMBAT/amber, ALPHA/danger) update reactively when the active tab changes.

### 2.8 KPI Card (Web Admin Dashboard)
`1px solid var(--line)` border, `14px` radius, `14–16px` padding, a small label (11.5px muted) + a large number (Space Grotesk 24px 700). Number color variants: default `--ink`, `.accent` (amber), `.warn` (`#9A6714`), `.danger` (`--danger`) — chosen based on the metric's meaning (e.g., "Attendance Rejected" = danger).

### 2.9 Bottom Navigation Bar (Mobile)
Fixed at the bottom of mobile screens.
- **Dimensions & Background:** Height `64px`, background `#FFFFFF`, top border `1px solid #E5E1D8`.
- **Items (4 tabs):** `Beranda` (home icon), `Absensi` (calendar/clock icon), `Izin` (file/event icon), `Slip Gaji` (receipt/payroll icon).
- **Active Tab State:** Icon color `--primary` (`#2F6F5E`), Label color `--primary` (`#2F6F5E`), font Inter 600 10px.
- **Inactive Tab State:** Icon color `--muted` (`#6B7280`), Label color `--muted` (`#6B7280`), font Inter 500 10px. Hover/tap highlight uses `#E4F3EC` soft primary tint.
- **Layout:** Vertical stack (icon 20×20px top, 4px gap, text label bottom). Equal 25% flex width per item.

### 2.10 Admin Shell (Web Desktop)
A 2-column layout: sidebar + main content area.
- **Sidebar Container:** Width `190px` (or `220px`), background `#FCFBF9`, right border `1px solid #E5E1D8`, vertical padding `20px`, horizontal padding `12px`.
- **Top Brand Mark:** `28×28px` square mark (background `--ink` `#1B2430`, accent text `#E8A33D` letter "H", Space Grotesk 700 16px), alongside title "HRIS Admin" (Space Grotesk 700 16px `--ink` `#1B2430`).
- **Navigation Links:** 7 menu items (`Dashboard`, `Karyawan`, `Absensi`, `Izin`, `Penggajian`, `Slip Gaji`, `Laporan`).
  - **Active Link:** Background `--ink` (`#1B2430`), text white `#FFFFFF`, `8px` radius, padding `10px 14px`, Inter 600 13px. Left icon in white `#FFFFFF`.
  - **Inactive Link:** Background transparent, text `--muted` (`#6B7280`), `8px` radius, padding `10px 14px`, Inter 500 13px. Left icon in `--muted` (`#6B7280`).
  - **Hover State (Inactive):** Background `#F5F3EE` (warm paper tint), text `--ink` (`#1B2430`), left icon `--ink` (`#1B2430`).
- **Top Header Bar (Main Area):** Background `#F5F3EE` or `#FFFFFF`, height `64px`, border-bottom `1px solid #E5E1D8`, displaying current page title (Space Grotesk 700 20px `#1B2430`) and right-aligned user profile pill with round avatar.

### 2.11 Info/Warning Banner
Background `#FDF1DC` (info) or `#FBEEEC` (error), matching border, `12px` radius, `11–13px` padding, `12px` text. Used for important messages such as "attendance rejected" or "the system does not transfer funds automatically".

### 2.12 Mobile Login Screen (T015)
Pre-auth screen — **no bottom navigation**. Structure (top to bottom):
- Page background `--bg` (`#F5F3EE`), centered column layout, `16px` horizontal margin.
- **Brand mark block:** Circle avatar `64px` diameter, `--ink` background, `--accent` letter "H" (Space Grotesk 700 28px). Below: "HRIS" title Space Grotesk 700 26px `--ink`. Subtitle "Human Resource Information System" Inter 400 12px `--muted`.
- **Form card:** `--surface` white, `18px` radius, `18px` padding, soft shadow `0 20px 40px -14px rgba(27,36,48,.20)`.
  - "Email / No. Karyawan" input field: Inter 14px, `1px solid var(--line)`, `12px` radius, `14px` padding, `--muted` placeholder.
  - "Kata Sandi" input field: same style + show/hide eye icon right side.
  - Primary button "Masuk": full-width, `--primary` bg, white Space Grotesk 700 15px, `14px` radius, glow shadow `0 10px 20px -8px rgba(47,111,94,.55)`.
  - "Lupa Kata Sandi?" link: centered below button, `--primary` color, Inter 13px.
- Footer: "© 2026 HRIS System" Inter 11px `--muted` centered, bottom of screen.

### 2.13 Web Admin Login Page (T014)
Pre-auth full-page screen — **no sidebar**. Split-panel layout:
- **Left panel (50%):** `--bg` (`#F5F3EE`) background. Centered branding block:
  - `28×28px` square brand mark (`--ink` bg, `--accent` "H" text), Space Grotesk 700.
  - "HRIS" title Space Grotesk 700 32px `--ink`.
  - "Sistem Informasi SDM" subtitle Inter 400 16px `--muted`.
  - 3 feature bullets with check icon in `--primary`: "Absensi GPS & Foto", "Penggajian Otomatis", "Approval Slip Gaji".
- **Right panel (50%):** White (`--surface`) background. Centered login card `420px` wide, `20px` radius, shadow `0 20px 50px -24px rgba(27,36,48,.25)`:
  - Heading "Masuk" Space Grotesk 600 24px `--ink`.
  - Subtitle "Gunakan akun HR Admin Anda" Inter 400 14px `--muted`.
  - "Email" + "Kata Sandi" inputs (same style as §2.12 form card).
  - Row: "Ingat saya" checkbox + "Lupa kata sandi?" `--primary` link (right-aligned).
  - Primary button "Masuk" full-width (same style as §2.12).
  - Version caption Inter 11px `--muted` bottom of card.

### 2.14 Employee Management Screen — Web Admin (T011)
Uses **Admin Shell** (§2.10) as the base layout. "Karyawan" nav item is active.
- **Content header:** Page title "Manajemen Karyawan" Space Grotesk 700 20px left. Right side: search input (`1px --line` border, `10px` radius, Inter 13px, magnifier icon) + "Tambah Karyawan" mini button (`.primary` variant per §2.1).
- **Filter chips row:** Pill tabs (Semua | Aktif | Tidak Aktif | Per Departemen) — active chip: `--primary` bg white text; inactive: `--surface` bg `1px --line` border `--muted` text. All `999px` radius, Inter 600 12px.
- **Employee table card:** `--surface` white, `14px` radius, `1px solid var(--line)`, shadow. Table structure:
  - Header row: uppercase Inter 600 11px `--muted` letter-spacing `0.08em`. Columns: No. Karyawan | Nama (+ avatar circle 28px `--accent` bg `--ink` initial) | Departemen | Jabatan | Status | Tgl Bergabung | Aksi.
  - Data rows: Inter 13px `--ink`, `1px --line` bottom border, `12px` vertical padding. Alternating rows plain white (no zebra).
  - Status pill per §2.2: Aktif → present color (`#E4F3EC` / `#204F42`); Tidak Aktif → neutral (`#EFEDE7` / `#6B7280`).
  - Aksi column: "Lihat" + "Edit" mini buttons (`.secondary` and `.primary` mini variants per §2.1, `8px` radius, `6px 12px` padding).
- **Pagination row:** Inter 13px, page number pills, prev/next arrows, `--muted` color.

### 2.15 Leave Request Form — Mobile (T030a)
Uses the same mobile shell (top nav + bottom nav) as §2.7 list screens.
- **Top nav bar:** Back arrow icon left, "Ajukan Izin" title Space Grotesk 700 17px centered.
- **Page background:** `--bg` (`#F5F3EE`), `16px` horizontal margin.
- **Form card:** `--surface`, `14px` radius, `18px` padding, `1px --line` border, shadow.
  - "Jenis Izin" dropdown: label Inter 600 13px, selector row with selected value + chevron icon right, `1px --line` border `12px` radius.
  - "Tanggal Mulai" + "Tanggal Selesai": two-column row, each with calendar icon, `1px --line` border `12px` radius.
  - "Durasi" read-only badge: pill `999px` radius, bg `#E4F3EC`, text `#204F42`, "3 Hari Kerja" Inter 600 12px.
  - "Alasan" multiline textarea: `4` visible rows, `--muted` placeholder, `1px --line` border `12px` radius.
  - "Lampiran (Opsional)" upload zone: dashed `1px --line` border `12px` radius, upload icon + "Tambah Dokumen Pendukung" Inter 13px `--muted` centered.
- **Sisa cuti info card:** `--surface` `12px` radius `1px --line`, calendar icon `--primary` + "Sisa Cuti Tahunan: 8 hari" Inter 600 13px `--ink`.
- **Fixed bottom:** Primary button "Kirim Permohonan" full-width (same style as §2.1 primary button).
- **Bottom nav:** Same as §2.9, "Izin" tab active (`--primary`).

### 2.16 Leave Request History — Mobile (T030b)
Uses the same mobile list shell as §2.7 (Attendance/Payslip History).
- **Top nav bar:** "Riwayat Izin" Space Grotesk 700 17px. No back arrow (tab root screen).
- **Summary stat row:** 3 mini stat cards side-by-side (`--surface`, `10px` radius, `12px` padding, `1px --line`): "Disetujui" number in `--primary`, "Menunggu" in `#9A6714`, "Ditolak" in `--danger`.
- **Filter tab row:** Same pill-tab style as §2.14 filter chips. Tabs: Semua | Menunggu | Disetujui | Ditolak.
- **List items** grouped by month (section headers uppercase 11px `--muted` 700):
  - Each item: `--surface` card `12px` radius `14px` padding `1px --line`.
  - Left: colored icon circle `32px` (green=cuti, yellow=sakit, blue=izin) + leave type title `13.5px` Space Grotesk 600 + date range `11.5px` Inter `--muted` + reason text `11px` Inter `--muted`.
  - Right: status pill per §2.2 (Disetujui/Menunggu/Ditolak using the correct bg+text pair).
- **FAB:** Circle `56px`, `--primary` bg, white "+" icon, bottom-right fixed, shadow.
- **Bottom nav:** "Izin" tab active.

### 2.17 Reporting Dashboard — Web Admin (T047)
Uses **Admin Shell** (§2.10) as the base layout. "Laporan" nav item is active.
- **Content header:** "Laporan & Rekap" Space Grotesk 700 20px left. Right: period dropdown "Agustus 2026" + "Export Excel" mini button (`.dark` variant `--ink` bg white text per §2.1).
- **KPI row (4 cards):** Same style as §2.8 but for payroll totals:
  - "Total Gaji Bruto" — large Rp amount, `--ink` color (default variant).
  - "Total Potongan" — Rp amount, `--danger` color (`.danger` variant).
  - "Gaji Bersih Dibayar" — Rp amount, `--primary` color.
  - "Karyawan Digaji" — count, `--accent` (#E8A33D) color.
- **Middle row (2 cards side-by-side):**
  - LEFT "Rekap Absensi per Departemen": `--surface` card `14px` radius. Mini table: Departemen | Hadir | Terlambat | Izin | Alpha | Kehadiran%. Numbers colored: present=`--primary`, late=`#9A6714`, absent=`--danger`.
  - RIGHT "Status Pembayaran": `--surface` card. Donut chart placeholder (circle outline, inner text total count) + legend pills: "Sudah Dibayar" (green pill) + "Belum Dibayar" (danger pill).
- **Full-width bottom table "Rekap Slip Gaji":** Same table structure as §2.14. Columns: No. Karyawan | Nama | Departemen | Gaji Bersih | Status Slip (pill) | Status Bayar (pill). Status pills per §2.2.

### 2.18 Attendance Action Modal (NEW — T021/T022 extension, `App.tsx`)
Triggered when employee taps "Absen Masuk" or "Absen Keluar". Camera does NOT open on page load (improves first-impression UX, saves battery).
- **Modal overlay:** `backgroundColor: rgba(0,0,0,0.7)`, full-screen, vertically centered.
- **Modal card:** White `#FFFFFF`, `borderRadius: Radius.lg`, `padding: 24px`, `width: 95%`.
- **State 1 — Permission Request:** `ActivityIndicator` large spinner + "Meminta Akses Kamera & GPS HP..." text (~1s delay).
- **State 2 — Camera Live:** Camera frame per §2.4, GPS strip below ("Lat/Lng · Office Name (Radius Xm - Valid)"), "📸 Ambil Foto Selfie" primary button + "Batal" secondary button.
- **State 3 — Photo Preview:** Dark box (`#0F172A`) with face-check placeholder icon, green border `#10B981`, "Foto Tersimpan & Valid" badge. Two-button row side-by-side: `🔄 Foto Ulang` (secondary, resets to State 2) + `✅ Submit Masuk/Keluar` (primary; blue `#1E3A8A` for clock-out, `--primary` for clock-in).

### 2.19 Photo Preview Modal — Attendance History (NEW — T023 extension, `App.tsx`)
Full-screen overlay shown when employee taps "📷 Foto Masuk" or "📷 Foto Keluar" in the attendance history card.
- **Overlay:** `rgba(0,0,0,0.85)` background, full-screen, centered.
- **Card:** `#1E293B` dark background, `borderRadius: Radius.lg`, `padding: 20px`, `width: 100%`.
- **Header:** White bold title (e.g., "Foto Masuk — 25 Agu 2026") + white Feather X close button right.
- **Photo container:** `width: 100%`, `height: 260px`, `borderRadius: Radius.md`, `overflow: hidden`, actual `<Image>` from MinIO signed URL.
- **Detail block:** `#0F172A` inner card — date/time bold white, GPS location `--muted` grey, "✓ GPS & Foto Terverifikasi HRIS (Valid)" in `#10B981` green.
- **Close button:** "Tutup Pratinjau" full-width `--primary` primary button.

### 2.20 Mobile Pagination Controls Component Pattern (NEW — 14-MOBILE-PAGINATION-AND-UI-SPEC.md)
Standardized client-side pagination component applied to all mobile history lists (Attendance, Payslip, Leave Requests) when total records exceed `5` items per page:
- **State & Constants:** `attendancePage`, `payslipPage`, `leavePage` reset to `1` on tab/filter state change; per-page constant fixed at `5`.
- **Layout:** `flexDirection: row`, `justifyContent: space-between`, `alignItems: center`, `marginTop: 12`, `marginBottom: 20`.
- **Controls:** `Sebelumnya` (prev) button, `Halaman X dari Y` label (`Colors.darkInk`), `Selanjutnya` (next) button.
- **Button Styling:** `paddingHorizontal: 14`, `paddingVertical: 8`, `borderRadius: 6`. Active state: `backgroundColor: Colors.forestGreen`, white bold text. Boundary/Disabled state: `backgroundColor: '#F1F5F9'`, `opacity: 0.5`, muted text.

### 2.21 Lucide Iconography & Container Wrappers (NEW — 14-MOBILE-PAGINATION-AND-UI-SPEC.md)
Standardized icon styling for profile settings and form components:
- **Icon Set:** `lucide-react-native` icons (`BookOpen`, `Sun`, `Globe`, `Info`, `ChevronRight`, `ChevronDown`).
- **Coloring:** Monochrome Dark Ink (`Colors.darkInk` / `#1E293B`).
- **Minimalist Styling:** Background wrapper circles/rectangles behind list icons are removed for a clean, flat appearance.
- **White Card Container Pattern:** Form input blocks and summary headers are enclosed inside unified white Card containers (`#FFFFFF`, `1px solid --line`, `14px` corner radius).

---

## 3. Principles the Agent Must Follow

1. **Do not change the fonts.** Space Grotesk for display/headings, Inter for body — not Poppins/Roboto/the system-ui default.
2. **Do not use colors outside the §1.1 palette.** If a new color is needed (e.g., for a chart), derive a tint/shade from the 6 base colors (`ink`, `primary`, `accent`, `bg`, `danger`, `muted`) — do not pick an arbitrary new hex value.
3. **Consistent radii**: large elements (cards/phone/camera) use a 14–36px radius, pills are always fully rounded (`999px`), mini buttons are 8–9px. Do not mix in a 4px/sharp-corner style anywhere else.
4. **Two independent statuses on the payslip** (HR approval vs. manual payment status) must always be displayed separately — never merge them into a single status, since this reflects a real business flow.
5. **Status colors are NOT a per-developer choice** — use the table 1.1 mapping so colors stay consistent across screens (e.g., "Present" and "Paid" are both green everywhere).
6. **Mobile = direct camera capture only, no upload.** Do not add a gallery-upload button anywhere in the attendance UI — this is a business decision (anti-fraud), not just a visual preference.
7. **Warm neutral page background** (`#F5F3EE`), not flat white (`#FFFFFF`) — white surfaces are reserved specifically for cards/panels layered on top, to create visual contrast.
8. **Product UI copy stays in Indonesian** — do not translate button/status labels to English even though the agent is reading the English version of this document.

---

## 4. Quick Reference (Copy-Paste CSS Variables)

```css
:root{
  --ink:#1B2430;
  --primary:#2F6F5E;
  --primary-dark:#204F42;
  --accent:#E8A33D;
  --bg:#F5F3EE;
  --surface:#FFFFFF;
  --danger:#C24A3B;
  --muted:#6B7280;
  --line:#E5E1D8;
  --radius:14px;
}
```

**Font import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 5. Document Status Note

This is **not** the final design system — it does not yet specify: dark mode, detailed responsive breakpoints, an elevation/z-index system, motion/transition standards beyond the pulse animation, or an official icon set (the mockup still uses gray square placeholders for icons). These items need to be filled in by a UI/UX Designer in Phase 0 (see `04-ROADMAP-STEP-BY-STEP.md`). Until then, **this document is the single source of visual truth** to follow — it takes precedence over any AI agent's default design assumptions/preferences.
