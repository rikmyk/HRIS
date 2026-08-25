package pdf

import (
	"bytes"
	"fmt"
	"html/template"
	"math"
	"strings"
	"time"
)

// PayslipPDFData holds all data needed to render the payslip document
type PayslipPDFData struct {
	CompanyName     string
	CompanyAddress  string
	CompanyNPWP     string
	EmployeeName    string
	EmployeeCode    string
	DepartmentName  string
	PositionTitle   string
	PeriodName      string
	PeriodMonth     string
	PeriodYear      string
	BaseSalary      float64
	AllowancesTotal float64
	DeductionsTotal float64
	NetSalary       float64
	TotalPresent    int
	TotalAbsent     int
	TotalLate       int
	TotalLeave      int
	TotalWorkDays   int
	Components      []PayslipComponentData
	GeneratedAt     string
	Allowances      []PayslipComponentData
	Deductions      []PayslipComponentData
}

// PayslipComponentData represents a single salary component line item
type PayslipComponentData struct {
	Name   string
	Type   string // allowance | deduction
	Amount float64
}

// FormatRupiah formats a float64 as Indonesian Rupiah string
func FormatRupiah(amount float64) string {
	if amount < 0 {
		amount = math.Abs(amount)
	}
	s := fmt.Sprintf("%.0f", amount)
	// Insert dots every 3 digits from right
	n := len(s)
	var result strings.Builder
	for i, ch := range s {
		if i > 0 && (n-i)%3 == 0 {
			result.WriteRune('.')
		}
		result.WriteRune(ch)
	}
	return "Rp " + result.String()
}

const PayslipHTMLTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Slip Gaji – {{.EmployeeName}} – {{.PeriodName}}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    color: #1a1f2e;
    background: #f0f4f8;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ---- PRINT TRIGGER BUTTON ---- */
  .print-bar {
    background: #1e40af;
    color: white;
    padding: 12px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .print-bar-info { font-size: 13px; font-weight: 600; }
  .print-bar-sub { font-size: 11px; opacity: 0.75; margin-top: 2px; }
  .btn-print {
    background: white;
    color: #1e40af;
    border: none;
    border-radius: 8px;
    padding: 10px 24px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .btn-print:hover { background: #eff6ff; }
  @media print { .print-bar { display: none; } }

  /* ---- PAGE WRAPPER ---- */
  .page {
    max-width: 794px;
    margin: 0 auto;
    background: #ffffff;
    min-height: 1123px;
    display: flex;
    flex-direction: column;
  }
  @media screen { .page { margin: 20px auto; box-shadow: 0 20px 60px rgba(0,0,0,0.15); } }

  /* ---- HEADER BRAND ---- */
  .doc-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%);
    padding: 28px 40px 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .brand-row { display: flex; align-items: center; gap: 14px; }
  .brand-badge {
    width: 48px; height: 48px;
    background: linear-gradient(135deg, #3b82f6, #6366f1);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; font-weight: 900; color: white;
    box-shadow: 0 4px 12px rgba(99,102,241,0.5);
  }
  .brand-name { font-size: 18px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; }
  .brand-sub  { font-size: 10.5px; color: #93c5fd; margin-top: 2px; }
  .doc-label-group { text-align: right; }
  .doc-label { font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 1px; text-transform: uppercase; }
  .doc-period { font-size: 12px; color: #93c5fd; margin-top: 4px; font-weight: 600; }
  .confidential-badge {
    display: inline-block;
    background: rgba(239,68,68,0.2);
    border: 1px solid rgba(239,68,68,0.4);
    color: #fca5a5;
    font-size: 9px; font-weight: 800;
    padding: 3px 8px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 1px;
    margin-top: 6px;
  }

  /* ---- EMPLOYEE CARD ---- */
  .emp-card {
    margin: 24px 40px 0;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
  }
  .emp-card-header {
    background: linear-gradient(90deg, #1e40af 0%, #3b82f6 100%);
    padding: 10px 20px;
    font-size: 10px; font-weight: 800;
    color: white; text-transform: uppercase; letter-spacing: 1px;
  }
  .emp-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0;
  }
  .emp-cell {
    padding: 14px 20px;
    border-right: 1px solid #e2e8f0;
  }
  .emp-cell:last-child { border-right: none; }
  .emp-cell-label { font-size: 9.5px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .emp-cell-val   { font-size: 13px; font-weight: 700; color: #0f172a; }
  .emp-cell-sub   { font-size: 10.5px; color: #64748b; margin-top: 2px; }

  /* ---- ATTENDANCE STRIP ---- */
  .attendance-strip {
    margin: 16px 40px 0;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 12px;
  }
  .att-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 12px 14px;
    text-align: center;
  }
  .att-val  { font-size: 22px; font-weight: 800; color: #0f172a; line-height: 1; }
  .att-label{ font-size: 9.5px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }
  .att-box.green  { background: #f0fdf4; border-color: #86efac; }
  .att-box.green  .att-val { color: #166534; }
  .att-box.red    { background: #fff1f2; border-color: #fda4af; }
  .att-box.red    .att-val { color: #9f1239; }
  .att-box.amber  { background: #fffbeb; border-color: #fcd34d; }
  .att-box.amber  .att-val { color: #92400e; }
  .att-box.blue   { background: #eff6ff; border-color: #93c5fd; }
  .att-box.blue   .att-val { color: #1e40af; }

  /* ---- SALARY TABLES ---- */
  .tables-row {
    margin: 20px 40px 0;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
  .salary-table-wrap {}
  .salary-table-title {
    font-size: 10px; font-weight: 800;
    color: white; text-transform: uppercase; letter-spacing: 1px;
    padding: 8px 14px;
    border-radius: 8px 8px 0 0;
  }
  .title-allowance { background: linear-gradient(90deg, #059669, #10b981); }
  .title-deduction { background: linear-gradient(90deg, #dc2626, #ef4444); }
  .salary-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; overflow: hidden; }
  .salary-table th {
    background: #f8fafc;
    padding: 8px 12px;
    font-size: 9.5px; font-weight: 700;
    color: #475569; text-transform: uppercase; letter-spacing: 0.4px;
    border-bottom: 1px solid #e2e8f0;
    text-align: left;
  }
  .salary-table th:last-child { text-align: right; }
  .salary-table td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 11.5px; color: #334155; }
  .salary-table td:last-child { text-align: right; font-family: 'Courier New', monospace; font-weight: 700; }
  .salary-table tr:last-child td { border-bottom: none; }
  .salary-table .subtotal-row td {
    background: #f8fafc;
    font-weight: 700;
    border-top: 1.5px solid #e2e8f0;
    font-size: 12px;
  }
  .allowance-val { color: #059669; }
  .deduction-val { color: #dc2626; }

  /* ---- THP HERO ---- */
  .thp-section {
    margin: 20px 40px 0;
    background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1d4ed8 100%);
    border-radius: 12px;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    overflow: hidden;
    position: relative;
  }
  .thp-section::before {
    content: '';
    position: absolute;
    right: -40px; top: -60px;
    width: 200px; height: 200px;
    border-radius: 50%;
    background: rgba(255,255,255,0.04);
  }
  .thp-section::after {
    content: '';
    position: absolute;
    right: 60px; bottom: -80px;
    width: 180px; height: 180px;
    border-radius: 50%;
    background: rgba(255,255,255,0.03);
  }
  .thp-left {}
  .thp-eyebrow { font-size: 10px; font-weight: 700; color: #93c5fd; text-transform: uppercase; letter-spacing: 1.5px; }
  .thp-title   { font-size: 14px; font-weight: 800; color: #e2e8f0; margin-top: 4px; }
  .thp-note    { font-size: 10px; color: #64748b; margin-top: 6px; }
  .thp-amount  { font-size: 34px; font-weight: 900; color: #ffffff; letter-spacing: -1px; position: relative; z-index: 1; }

  /* ---- SIGNATURE STRIP ---- */
  .signature-strip {
    margin: 20px 40px 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  }
  .sig-box {
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px;
    text-align: center;
  }
  .sig-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
  .sig-space { height: 44px; }
  .sig-line  { border-top: 1px solid #e2e8f0; margin-top: 8px; padding-top: 6px; }
  .sig-name  { font-size: 11.5px; font-weight: 700; color: #0f172a; }
  .sig-title-small { font-size: 10px; color: #64748b; margin-top: 2px; }

  /* ---- FOOTER ---- */
  .doc-footer {
    margin: 20px 40px;
    padding-top: 14px;
    border-top: 1px dashed #cbd5e1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .doc-footer-text { font-size: 9.5px; color: #94a3b8; }
  .doc-footer-right { display: flex; align-items: center; gap: 12px; }
  .validation-badge {
    background: #f0fdf4;
    border: 1px solid #86efac;
    color: #166534;
    font-size: 9px; font-weight: 800;
    padding: 4px 10px; border-radius: 4px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
</style>
</head>
<body>

<!-- Print bar (hidden when printing) -->
<div class="print-bar">
  <div>
    <div class="print-bar-info">Slip Gaji — {{.EmployeeName}} | {{.PeriodName}}</div>
    <div class="print-bar-sub">Gunakan tombol cetak di bawah untuk menyimpan sebagai PDF berkualitas tinggi</div>
  </div>
  <button class="btn-print" onclick="window.print()">
    🖨️ Cetak / Simpan PDF
  </button>
</div>

<div class="page">

  <!-- ===== HEADER ===== -->
  <div class="doc-header">
    <div class="brand-row">
      <div class="brand-badge">H</div>
      <div>
        <div class="brand-name">{{.CompanyName}}</div>
        <div class="brand-sub">{{.CompanyAddress}}</div>
        {{if .CompanyNPWP}}<div class="brand-sub">NPWP: {{.CompanyNPWP}}</div>{{end}}
      </div>
    </div>
    <div class="doc-label-group">
      <div class="doc-label">Slip Gaji</div>
      <div class="doc-period">Periode: {{.PeriodName}}</div>
      <div class="confidential-badge">🔒 Rahasia &amp; Privat</div>
    </div>
  </div>

  <!-- ===== EMPLOYEE INFO CARD ===== -->
  <div class="emp-card">
    <div class="emp-card-header">Informasi Karyawan</div>
    <div class="emp-grid">
      <div class="emp-cell">
        <div class="emp-cell-label">Nama Karyawan</div>
        <div class="emp-cell-val">{{.EmployeeName}}</div>
      </div>
      <div class="emp-cell">
        <div class="emp-cell-label">NIK / Kode Karyawan</div>
        <div class="emp-cell-val">{{.EmployeeCode}}</div>
      </div>
      <div class="emp-cell">
        <div class="emp-cell-label">Departemen</div>
        <div class="emp-cell-val">{{.DepartmentName}}</div>
        {{if .PositionTitle}}<div class="emp-cell-sub">{{.PositionTitle}}</div>{{end}}
      </div>
    </div>
  </div>

  <!-- ===== ATTENDANCE SUMMARY ===== -->
  <div class="attendance-strip">
    <div class="att-box green">
      <div class="att-val">{{.TotalPresent}}</div>
      <div class="att-label">Hari Hadir</div>
    </div>
    <div class="att-box red">
      <div class="att-val">{{.TotalAbsent}}</div>
      <div class="att-label">Hari Alpha</div>
    </div>
    <div class="att-box amber">
      <div class="att-val">{{.TotalLate}}</div>
      <div class="att-label">Mnt Terlambat</div>
    </div>
    <div class="att-box blue">
      <div class="att-val">{{.TotalLeave}}</div>
      <div class="att-label">Hari Izin/Cuti</div>
    </div>
    <div class="att-box">
      <div class="att-val">{{.TotalWorkDays}}</div>
      <div class="att-label">Hari Kerja</div>
    </div>
  </div>

  <!-- ===== SALARY COMPONENT TABLES ===== -->
  <div class="tables-row">
    <!-- PENGHASILAN -->
    <div class="salary-table-wrap">
      <div class="salary-table-title title-allowance">✦ Penghasilan (Income)</div>
      <table class="salary-table">
        <thead>
          <tr><th>Komponen</th><th>Jumlah</th></tr>
        </thead>
        <tbody>
          {{range .Allowances}}
          <tr>
            <td>{{.Name}}</td>
            <td class="allowance-val">{{FormatRupiah .Amount}}</td>
          </tr>
          {{end}}
        </tbody>
        <tfoot>
          <tr class="subtotal-row">
            <td>Total Penghasilan</td>
            <td class="allowance-val">{{FormatRupiah .AllowancesTotal}}</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- POTONGAN -->
    <div class="salary-table-wrap">
      <div class="salary-table-title title-deduction">✦ Potongan (Deduction)</div>
      <table class="salary-table">
        <thead>
          <tr><th>Komponen</th><th>Jumlah</th></tr>
        </thead>
        <tbody>
          {{if .Deductions}}
          {{range .Deductions}}
          <tr>
            <td>{{.Name}}</td>
            <td class="deduction-val">{{FormatRupiah .Amount}}</td>
          </tr>
          {{end}}
          {{else}}
          <tr><td colspan="2" style="color:#94a3b8;text-align:center;padding:16px;">Tidak ada potongan</td></tr>
          {{end}}
        </tbody>
        <tfoot>
          <tr class="subtotal-row">
            <td>Total Potongan</td>
            <td class="deduction-val">{{FormatRupiah .DeductionsTotal}}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>

  <!-- ===== THP HERO ===== -->
  <div class="thp-section">
    <div class="thp-left">
      <div class="thp-eyebrow">TOTAL BERSIH DITERIMA</div>
      <div class="thp-title">Take Home Pay (THP) — {{.PeriodName}}</div>
      <div class="thp-note" style="color:#94a3b8;">Penghasilan − Potongan = THP Bersih</div>
    </div>
    <div class="thp-amount">{{FormatRupiah .NetSalary}}</div>
  </div>

  <!-- ===== SIGNATURE ===== -->
  <div class="signature-strip">
    <div class="sig-box">
      <div class="sig-label">Dibuat Oleh</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">Sistem HRIS</div>
        <div class="sig-title-small">Auto-Generated</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Disetujui HRD</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">Manager HRD</div>
        <div class="sig-title-small">Human Resources Dept.</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Diterima Karyawan</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">{{.EmployeeName}}</div>
        <div class="sig-title-small">{{.PositionTitle}}</div>
      </div>
    </div>
  </div>

  <!-- ===== FOOTER ===== -->
  <div class="doc-footer">
    <div class="doc-footer-text">
      Dicetak otomatis oleh Sistem HRIS · {{.GeneratedAt}}<br/>
      Dokumen ini sah tanpa tanda tangan basah sesuai kebijakan perusahaan.
    </div>
    <div class="doc-footer-right">
      <div class="validation-badge">✓ VALID DIGITAL</div>
      <div class="doc-footer-text" style="text-align:right;">ID: HRIS-{{.EmployeeCode}}-{{.PeriodYear}}</div>
    </div>
  </div>

</div><!-- end .page -->
</body>
</html>`

// Generator handles payslip HTML template rendering
type Generator struct{}

// NewGenerator creates a new PDF Generator instance
func NewGenerator() *Generator {
	return &Generator{}
}

// FormatRupiah formats a float64 amount as Indonesian Rupiah string
func formatRupiah(amount float64) string {
	if amount < 0 {
		amount = -amount
	}
	s := fmt.Sprintf("%.0f", amount)
	n := len(s)
	var result strings.Builder
	for i, ch := range s {
		if i > 0 && (n-i)%3 == 0 {
			result.WriteRune('.')
		}
		result.WriteRune(ch)
	}
	return "Rp " + result.String()
}

// GeneratePayslipPDFBuffer renders the payslip HTML template and returns bytes
func (g *Generator) GeneratePayslipPDFBuffer(data PayslipPDFData) ([]byte, error) {
	// Defaults
	if data.CompanyName == "" {
		data.CompanyName = "PT HRIS Nusantara Tech"
	}
	if data.CompanyAddress == "" {
		data.CompanyAddress = "Gedung Cyber 2, Lt. 18, Jl. H.R. Rasuna Said, Jakarta Selatan 12950"
	}
	if data.CompanyNPWP == "" {
		data.CompanyNPWP = "01.234.567.8-901.000"
	}
	if data.GeneratedAt == "" {
		data.GeneratedAt = time.Now().Format("02 January 2006, 15:04 WIB")
	}
	if data.TotalWorkDays == 0 {
		data.TotalWorkDays = 22
	}
	if data.PeriodYear == "" {
		data.PeriodYear = time.Now().Format("2006")
	}

	// Split components into allowances and deductions
	if len(data.Allowances) == 0 && len(data.Deductions) == 0 {
		for _, c := range data.Components {
			amt := c.Amount
			if amt < 0 {
				amt = -amt
			}
			if c.Type == "deduction" {
				data.Deductions = append(data.Deductions, PayslipComponentData{Name: c.Name, Type: c.Type, Amount: amt})
			} else {
				data.Allowances = append(data.Allowances, PayslipComponentData{Name: c.Name, Type: c.Type, Amount: amt})
			}
		}
	}

	// Recalculate totals if missing
	if data.AllowancesTotal == 0 {
		for _, a := range data.Allowances {
			data.AllowancesTotal += a.Amount
		}
	}
	if data.DeductionsTotal == 0 {
		for _, d := range data.Deductions {
			data.DeductionsTotal += d.Amount
		}
	}
	if data.NetSalary == 0 {
		data.NetSalary = data.AllowancesTotal - data.DeductionsTotal
	}

	funcMap := template.FuncMap{
		"FormatRupiah": formatRupiah,
	}

	tmpl, err := template.New("payslip").Funcs(funcMap).Parse(PayslipHTMLTemplate)
	if err != nil {
		return nil, fmt.Errorf("failed to parse payslip template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("failed to execute payslip template: %w", err)
	}

	return buf.Bytes(), nil
}
