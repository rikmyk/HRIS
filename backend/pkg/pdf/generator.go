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

// formatRupiah formats a float64 amount as Indonesian Rupiah string
func formatRupiah(amount float64) string {
	if amount < 0 {
		amount = math.Abs(amount)
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

const PayslipHTMLTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Slip Gaji – {{.EmployeeName}} – {{.PeriodName}}</title>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11px;
    color: #000;
    background: #e5e7eb;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ---- PRINT BAR (screen only) ---- */
  .print-bar {
    background: #1f2937;
    color: #fff;
    padding: 10px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .print-bar-text { font-size: 12px; font-weight: bold; }
  .print-bar-sub  { font-size: 10px; color: #9ca3af; margin-top: 2px; }
  .btn-print {
    background: #fff;
    color: #1f2937;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    font-size: 12px;
    font-weight: bold;
    cursor: pointer;
  }
  .btn-print:hover { background: #f3f4f6; }
  @media print { .print-bar { display: none !important; } }

  /* ---- PAGE ---- */
  .page {
    max-width: 794px;
    margin: 0 auto;
    background: #fff;
    min-height: 1123px;
  }
  @media screen {
    .page { margin: 24px auto; box-shadow: 0 4px 24px rgba(0,0,0,0.18); }
  }

  /* ---- HEADER: logo left + doc title right ---- */
  .doc-header {
    padding: 28px 36px 20px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 2px solid #000;
  }
  .company-logo-box {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  /* Letter-mark logo — simple and professional */
  .company-mark {
    width: 52px;
    height: 52px;
    border: 2.5px solid #000;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 900;
    color: #000;
    letter-spacing: -1px;
    flex-shrink: 0;
  }
  .company-info {}
  .company-name { font-size: 15px; font-weight: bold; color: #000; letter-spacing: 0.2px; }
  .company-addr { font-size: 9.5px; color: #374151; margin-top: 2px; line-height: 1.5; }
  .company-npwp { font-size: 9px; color: #6b7280; margin-top: 3px; }

  .doc-title-group { text-align: right; }
  .doc-title { font-size: 18px; font-weight: bold; color: #000; text-transform: uppercase; letter-spacing: 2px; }
  .doc-subtitle { font-size: 10px; color: #374151; margin-top: 4px; }
  .doc-no { font-size: 9px; color: #6b7280; margin-top: 2px; }

  /* ---- DIVIDER TEXT ---- */
  .section-label {
    background: #000;
    color: #fff;
    font-size: 9.5px;
    font-weight: bold;
    padding: 4px 36px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  /* ---- EMPLOYEE INFO TABLE ---- */
  .emp-table {
    width: 100%;
    border-collapse: collapse;
    margin: 0;
  }
  .emp-table td {
    padding: 5px 36px;
    font-size: 11px;
    color: #000;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: top;
  }
  .emp-table td.lbl {
    width: 180px;
    color: #374151;
    font-size: 10.5px;
  }
  .emp-table td.sep { width: 20px; color: #9ca3af; }
  .emp-table td.val { font-weight: bold; }

  /* ---- ATTENDANCE ROW ---- */
  .att-row {
    display: flex;
    border-top: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
  }
  .att-cell {
    flex: 1;
    padding: 10px 0;
    text-align: center;
    border-right: 1px solid #e5e7eb;
  }
  .att-cell:last-child { border-right: none; }
  .att-num   { font-size: 18px; font-weight: bold; color: #000; line-height: 1; }
  .att-label { font-size: 9px; color: #6b7280; margin-top: 3px; text-transform: uppercase; letter-spacing: 0.5px; }

  /* ---- SALARY TABLE ---- */
  .salary-wrap { padding: 0 36px 0; }
  .salary-two-col { display: flex; gap: 24px; margin-top: 0; }
  .salary-col { flex: 1; }
  .salary-col-title {
    font-size: 10px;
    font-weight: bold;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 6px 0;
    border-bottom: 1.5px solid #000;
    color: #000;
  }
  .sal-table { width: 100%; border-collapse: collapse; }
  .sal-table tr td { padding: 5px 0; font-size: 11px; color: #000; border-bottom: 1px solid #f3f4f6; }
  .sal-table tr td:last-child { text-align: right; font-family: 'Courier New', Courier, monospace; white-space: nowrap; }
  .sal-table .subtotal td {
    border-top: 1px solid #000;
    border-bottom: 1.5px solid #000;
    font-weight: bold;
    padding: 6px 0;
    font-size: 11.5px;
  }
  .sal-table .subtotal td:last-child { color: #000; }
  .empty-row td { color: #9ca3af; font-style: italic; }

  /* ---- THP STRIP ---- */
  .thp-strip {
    margin: 18px 36px 0;
    border: 2px solid #000;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 20px;
  }
  .thp-left-label { font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #000; }
  .thp-left-note  { font-size: 9.5px; color: #6b7280; margin-top: 3px; }
  .thp-amount     { font-size: 22px; font-weight: bold; color: #000; font-family: 'Courier New', Courier, monospace; }

  /* ---- NOTE ---- */
  .note-strip {
    margin: 12px 36px 0;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    padding: 8px 14px;
    font-size: 9.5px;
    color: #6b7280;
    line-height: 1.6;
  }

  /* ---- SIGNATURE ---- */
  .sig-row {
    margin: 24px 36px 0;
    display: flex;
    gap: 16px;
  }
  .sig-box {
    flex: 1;
    border: 1px solid #d1d5db;
    padding: 12px 14px;
    text-align: center;
  }
  .sig-title  { font-size: 9.5px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; }
  .sig-space  { height: 48px; }
  .sig-line   { border-top: 1px solid #d1d5db; padding-top: 6px; margin-top: 4px; }
  .sig-name   { font-size: 11px; font-weight: bold; color: #000; }
  .sig-pos    { font-size: 9.5px; color: #6b7280; margin-top: 2px; }

  /* ---- FOOTER ---- */
  .doc-footer {
    margin: 20px 36px 28px;
    padding-top: 12px;
    border-top: 1px solid #d1d5db;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-text  { font-size: 9px; color: #9ca3af; line-height: 1.6; }
  .footer-right { font-size: 9px; color: #9ca3af; text-align: right; }
</style>
</head>
<body>

<div class="print-bar">
  <div>
    <div class="print-bar-text">Slip Gaji — {{.EmployeeName}} | {{.PeriodName}}</div>
    <div class="print-bar-sub">Klik Cetak untuk menyimpan sebagai PDF</div>
  </div>
  <button class="btn-print" onclick="window.print()">🖨 Cetak / Simpan PDF</button>
</div>

<div class="page">

  <!-- HEADER -->
  <div class="doc-header">
    <div class="company-logo-box">
      <div class="company-mark">H</div>
      <div class="company-info">
        <div class="company-name">{{.CompanyName}}</div>
        <div class="company-addr">{{.CompanyAddress}}</div>
        {{if .CompanyNPWP}}<div class="company-npwp">NPWP: {{.CompanyNPWP}}</div>{{end}}
      </div>
    </div>
    <div class="doc-title-group">
      <div class="doc-title">Slip Gaji</div>
      <div class="doc-subtitle">Periode: {{.PeriodName}}</div>
      <div class="doc-no">Tanggal Cetak: {{.GeneratedAt}}</div>
    </div>
  </div>

  <!-- EMPLOYEE INFO -->
  <div class="section-label">Data Karyawan</div>
  <table class="emp-table">
    <tr>
      <td class="lbl">Nama Lengkap</td><td class="sep">:</td><td class="val">{{.EmployeeName}}</td>
      <td class="lbl">Departemen</td><td class="sep">:</td><td class="val">{{.DepartmentName}}</td>
    </tr>
    <tr>
      <td class="lbl">NIK / Kode Karyawan</td><td class="sep">:</td><td class="val">{{.EmployeeCode}}</td>
      <td class="lbl">Jabatan</td><td class="sep">:</td><td class="val">{{if .PositionTitle}}{{.PositionTitle}}{{else}}-{{end}}</td>
    </tr>
    <tr>
      <td class="lbl">Periode Pembayaran</td><td class="sep">:</td><td class="val">{{.PeriodName}}</td>
      <td class="lbl">Hari Kerja Periode Ini</td><td class="sep">:</td><td class="val">{{.TotalWorkDays}} Hari</td>
    </tr>
  </table>

  <!-- ATTENDANCE -->
  <div class="section-label" style="margin-top:14px;">Rekap Kehadiran</div>
  <div class="att-row">
    <div class="att-cell">
      <div class="att-num">{{.TotalPresent}}</div>
      <div class="att-label">Hari Hadir</div>
    </div>
    <div class="att-cell">
      <div class="att-num">{{.TotalAbsent}}</div>
      <div class="att-label">Hari Alpha</div>
    </div>
    <div class="att-cell">
      <div class="att-num">{{.TotalLate}}</div>
      <div class="att-label">Menit Terlambat</div>
    </div>
    <div class="att-cell">
      <div class="att-num">{{.TotalLeave}}</div>
      <div class="att-label">Hari Izin / Cuti</div>
    </div>
  </div>

  <!-- SALARY COMPONENTS -->
  <div class="section-label" style="margin-top:14px;">Rincian Gaji</div>
  <div class="salary-wrap">
    <div class="salary-two-col" style="margin-top:12px;">

      <!-- PENGHASILAN -->
      <div class="salary-col">
        <div class="salary-col-title">Penghasilan</div>
        <table class="sal-table">
          <tbody>
            {{range .Allowances}}
            <tr>
              <td>{{.Name}}</td>
              <td>{{FormatRupiah .Amount}}</td>
            </tr>
            {{end}}
            {{if not .Allowances}}
            <tr class="empty-row"><td colspan="2">Tidak ada data penghasilan</td></tr>
            {{end}}
          </tbody>
          <tfoot>
            <tr class="subtotal">
              <td>Jumlah Penghasilan</td>
              <td>{{FormatRupiah .AllowancesTotal}}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- POTONGAN -->
      <div class="salary-col">
        <div class="salary-col-title">Potongan</div>
        <table class="sal-table">
          <tbody>
            {{range .Deductions}}
            <tr>
              <td>{{.Name}}</td>
              <td>{{FormatRupiah .Amount}}</td>
            </tr>
            {{end}}
            {{if not .Deductions}}
            <tr class="empty-row"><td colspan="2">Tidak ada potongan</td></tr>
            {{end}}
          </tbody>
          <tfoot>
            <tr class="subtotal">
              <td>Jumlah Potongan</td>
              <td>{{FormatRupiah .DeductionsTotal}}</td>
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  </div>

  <!-- TAKE HOME PAY -->
  <div class="thp-strip">
    <div>
      <div class="thp-left-label">Total Gaji Bersih Diterima (Take Home Pay)</div>
      <div class="thp-left-note">Penghasilan  −  Potongan  =  Gaji Bersih</div>
    </div>
    <div class="thp-amount">{{FormatRupiah .NetSalary}}</div>
  </div>

  <!-- NOTE -->
  <div class="note-strip">
    Slip gaji ini diterbitkan secara resmi oleh sistem HRIS perusahaan. Apabila terdapat ketidaksesuaian, harap menghubungi bagian Human Resources dalam waktu 3 (tiga) hari kerja sejak tanggal cetak.
  </div>

  <!-- SIGNATURE -->
  <div class="sig-row">
    <div class="sig-box">
      <div class="sig-title">Disiapkan Oleh</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">Departemen Payroll</div>
        <div class="sig-pos">Human Resources &amp; Payroll</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Disetujui Oleh</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">Manager HRD</div>
        <div class="sig-pos">Human Resources Dept.</div>
      </div>
    </div>
    <div class="sig-box">
      <div class="sig-title">Diterima Oleh</div>
      <div class="sig-space"></div>
      <div class="sig-line">
        <div class="sig-name">{{.EmployeeName}}</div>
        <div class="sig-pos">{{if .PositionTitle}}{{.PositionTitle}}{{else}}Karyawan{{end}}</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="doc-footer">
    <div class="footer-text">
      Dicetak otomatis oleh Sistem HRIS · {{.GeneratedAt}}<br/>
      Dokumen ini sah tanpa tanda tangan basah sesuai kebijakan perusahaan.
    </div>
    <div class="footer-right">
      Nomor Dokumen: HRIS/SLIP/{{.PeriodYear}}/{{.EmployeeCode}}<br/>
      Halaman 1 dari 1
    </div>
  </div>

</div>
</body>
</html>`

// Generator handles payslip HTML template rendering
type Generator struct{}

// NewGenerator creates a new Generator instance
func NewGenerator() *Generator { return &Generator{} }

// GeneratePayslipPDFBuffer renders the payslip HTML template and returns bytes
func (g *Generator) GeneratePayslipPDFBuffer(data PayslipPDFData) ([]byte, error) {
	// Defaults
	if data.CompanyName == "" {
		data.CompanyName = "PT HRIS Nusantara Tech"
	}
	if data.CompanyAddress == "" {
		data.CompanyAddress = "Gedung Cyber 2 Lt.18, Jl. H.R. Rasuna Said, Jakarta Selatan 12950"
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

	// Auto-split Components into Allowances / Deductions if not already split
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

	// Recalculate totals
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
		"not": func(v interface{}) bool {
			if v == nil {
				return true
			}
			// handles slices
			return false
		},
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
