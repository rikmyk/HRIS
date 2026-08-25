package pdf

import (
	"bytes"
	"fmt"
	"html/template"
	"time"
)

type PayslipPDFData struct {
	CompanyName     string
	CompanyAddress string
	EmployeeName    string
	EmployeeCode    string
	DepartmentName  string
	PositionTitle   string
	PeriodName      string
	BaseSalary      float64
	AllowancesTotal float64
	DeductionsTotal float64
	NetSalary       float64
	TotalPresent    int
	TotalLate       int
	TotalLeave      int
	Components      []PayslipComponentData
	GeneratedAt     string
}

type PayslipComponentData struct {
	Name   string
	Type   string
	Amount float64
}

const PayslipHTMLTemplate = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SLIP GAJI - {{.EmployeeName}} ({{.PeriodName}})</title>
    <style>
        @page { size: A4; margin: 20mm; }
        * { box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
            font-size: 13px; 
            color: #1B2430; 
            margin: 0; 
            padding: 36px; 
            background: #F5F3EE;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #FFFFFF;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.05);
            border: 1px solid #E5E1D8;
        }
        .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 2.5px solid #2F6F5E; 
            padding-bottom: 20px; 
            margin-bottom: 28px; 
        }
        .logo-group { display: flex; align-items: center; gap: 12px; }
        .logo-badge {
            width: 44px;
            height: 44px;
            background: #2F6F5E;
            color: #FFFFFF;
            border-radius: 10px;
            font-weight: 900;
            font-size: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .company-name { font-size: 20px; font-weight: 800; color: #1B2430; letter-spacing: -0.5px; }
        .company-sub { font-size: 12px; color: #6B7280; margin-top: 2px; }
        .doc-title { text-align: right; }
        .title-text { font-size: 18px; font-weight: 800; color: #2F6F5E; letter-spacing: 0.5px; text-transform: uppercase; }
        .period-text { font-size: 13px; font-weight: 700; color: #6B7280; margin-top: 4px; }
        
        .confidential-tag {
            display: inline-block;
            background: #FEF3C7;
            color: #92400E;
            font-size: 10px;
            font-weight: 800;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-top: 6px;
        }

        .emp-card { 
            background: #F9F8F6; 
            border: 1px solid #E5E1D8;
            border-radius: 10px; 
            padding: 20px; 
            margin-bottom: 28px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
        }
        .emp-field { line-height: 1.5; }
        .emp-label { font-size: 10px; font-weight: 800; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .emp-val { font-size: 14px; font-weight: 700; color: #1B2430; }

        .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #1B2430;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            padding-left: 8px;
            border-left: 3px solid #2F6F5E;
        }

        table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
        th { background: #F1F5F9; color: #475569; text-align: left; padding: 12px 14px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #CBD5E1; }
        td { padding: 12px 14px; border-bottom: 1px solid #E2E8F0; font-size: 13px; color: #334155; }
        .amount { text-align: right; font-family: 'Courier New', Courier, monospace; font-size: 14px; font-weight: 700; }
        .deduction { color: #C24A3B; }

        .thp-container { 
            background: linear-gradient(135deg, #1B2430 0%, #2F6F5E 100%); 
            border-radius: 12px; 
            padding: 24px; 
            color: #FFFFFF;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 32px;
        }
        .thp-title { font-size: 12px; font-weight: 800; color: #D1D5DB; text-transform: uppercase; letter-spacing: 1px; }
        .thp-note { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
        .thp-amount { font-size: 30px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px; }

        .footer { 
            border-top: 1px dashed #CBD5E1;
            padding-top: 20px; 
            font-size: 11px; 
            color: #94A3B8; 
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header Section -->
        <div class="header">
            <div class="logo-group">
                <div class="logo-badge">H</div>
                <div>
                    <div class="company-name">{{.CompanyName}}</div>
                    <div class="company-sub">{{.CompanyAddress}}</div>
                </div>
            </div>
            <div class="doc-title">
                <div class="title-text">SLIP GAJI RESMI</div>
                <div class="period-text">Periode: {{.PeriodName}}</div>
                <div class="confidential-tag">RAHASIA & PRIVAT</div>
            </div>
        </div>

        <!-- Employee Info Card -->
        <div class="emp-card">
            <div class="emp-field">
                <div class="emp-label">NAMA KARAYWAN</div>
                <div class="emp-val">{{.EmployeeName}}</div>
            </div>
            <div class="emp-field">
                <div class="emp-label">NOMOR INDUK KARYAWAN (NIK)</div>
                <div class="emp-val">{{.EmployeeCode}}</div>
            </div>
            <div class="emp-field">
                <div class="emp-label">DEPARTEMEN</div>
                <div class="emp-val">{{.DepartmentName}}</div>
            </div>
            <div class="emp-field">
                <div class="emp-label">JABATAN</div>
                <div class="emp-val">{{.PositionTitle}}</div>
            </div>
            <div class="emp-field">
                <div class="emp-label">REKAP KEHADIRAN</div>
                <div class="emp-val">{{.TotalPresent}} Hari Hadir | {{.TotalLate}} Min Terlambat</div>
            </div>
            <div class="emp-field">
                <div class="emp-label">TANGGAL DICETAK</div>
                <div class="emp-val">{{.GeneratedAt}}</div>
            </div>
        </div>

        <!-- Component Table -->
        <div class="section-title">Rincian Komponen Gaji & Potongan</div>
        <table>
            <thead>
                <tr>
                    <th>Komponen Penghasilan / Potongan</th>
                    <th>Kategori</th>
                    <th style="text-align: right;">Jumlah (IDR)</th>
                </tr>
            </thead>
            <tbody>
                {{range .Components}}
                <tr>
                    <td style="font-weight: 600;">{{.Name}}</td>
                    <td style="text-transform: capitalize; color: #64748B;">{{.Type}}</td>
                    <td class="amount {{if eq .Type "deduction"}}deduction{{end}}">
                        {{if eq .Type "deduction"}}-{{end}}Rp {{printf "%.2f" .Amount}}
                    </td>
                </tr>
                {{end}}
            </tbody>
        </table>

        <!-- Take Home Pay Card -->
        <div class="thp-container">
            <div>
                <div class="thp-title">GAJI BERSIH (TAKE HOME PAY)</div>
                <div class="thp-note">Sudah termasuk tunjangan dan potongan keterlambatan</div>
            </div>
            <div class="thp-amount">Rp {{printf "%.2f" .NetSalary}}</div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div>Dokumen ini diterbitkan otomatis oleh sistem HRIS Nusantara Tech.</div>
            <div>Validasi Digital ID: HRIS-SLIP-2026-OK</div>
        </div>
    </div>
</body>
</html>`

type Generator struct{}

func NewGenerator() *Generator {
	return &Generator{}
}

func (g *Generator) GeneratePayslipPDFBuffer(data PayslipPDFData) ([]byte, error) {
	if data.CompanyName == "" {
		data.CompanyName = "PT HRIS Nusantara Tech"
	}
	if data.CompanyAddress == "" {
		data.CompanyAddress = "Gedung Cyber 2, Lt. 18, Jl. H.R. Rasuna Said, Jakarta Selatan"
	}
	if data.GeneratedAt == "" {
		data.GeneratedAt = time.Now().Format("02 January 2006 15:04 WIB")
	}

	tmpl, err := template.New("payslip").Parse(PayslipHTMLTemplate)
	if err != nil {
		return nil, fmt.Errorf("failed to parse payslip template: %w", err)
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return nil, fmt.Errorf("failed to execute payslip template: %w", err)
	}

	return buf.Bytes(), nil
}
