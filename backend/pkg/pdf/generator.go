package pdf

import (
	"bytes"
	"fmt"
	"html/template"
	"time"
)

type PayslipPDFData struct {
	CompanyName     string
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
<html>
<head>
    <meta charset="UTF-8">
    <title>Slip Gaji - {{.EmployeeName}}</title>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 13px; color: #1E293B; margin: 0; padding: 40px; background: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #2F6F5E; padding-bottom: 16px; margin-bottom: 24px; }
        .company-name { font-size: 20px; font-weight: bold; color: #2F6F5E; }
        .title { font-size: 16px; font-weight: 700; color: #475569; text-transform: uppercase; }
        .emp-info { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: #F8FAFC; padding: 16px; border-radius: 8px; margin-bottom: 24px; }
        .emp-info div { line-height: 1.6; }
        .emp-info label { font-size: 11px; font-weight: bold; color: #64748B; text-transform: uppercase; display: block; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #F1F5F9; color: #334155; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; border-bottom: 1px solid #CBD5E1; }
        td { padding: 10px 12px; border-bottom: 1px solid #E2E8F0; }
        .amount { text-align: right; font-family: monospace; font-size: 14px; }
        .total-row { font-weight: bold; background: #F8FAFC; }
        .thp-box { background: #E2EBF6; border: 1px solid #B4CBE5; border-radius: 8px; padding: 16px; text-align: right; }
        .thp-label { font-size: 12px; color: #2F4E8A; font-weight: bold; text-transform: uppercase; }
        .thp-amount { font-size: 24px; color: #1E3A8A; font-weight: 800; margin-top: 4px; }
        .footer { margin-top: 40px; font-size: 11px; color: #94A3B8; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="company-name">{{.CompanyName}}</div>
            <div style="font-size: 12px; color: #64748B;">Dokumen Rahasia - Rahasia Penghasilan</div>
        </div>
        <div style="text-align: right;">
            <div class="title">SLIP GAJI KARAYWAN</div>
            <div style="font-size: 13px; font-weight: 600; color: #2F6F5E;">Periode: {{.PeriodName}}</div>
        </div>
    </div>

    <div class="emp-info">
        <div>
            <label>NAMA KARAYWAN</label>
            <div><strong>{{.EmployeeName}}</strong> ({{.EmployeeCode}})</div>
            <label style="margin-top: 8px;">DEPARTEMEN / JABATAN</label>
            <div>{{.DepartmentName}} · {{.PositionTitle}}</div>
        </div>
        <div>
            <label>REKAP KEHADIRAN PERIODE INI</label>
            <div>Hadir: <strong>{{.TotalPresent}} hari</strong> | Telat: <strong>{{.TotalLate}} kali</strong> | Cuti/Izin: <strong>{{.TotalLeave}} hari</strong></div>
            <label style="margin-top: 8px;">TANGGAL DICETAK</label>
            <div>{{.GeneratedAt}}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Rincian Komponen Gaji</th>
                <th>Tipe</th>
                <th style="text-align: right;">Jumlah (IDR)</th>
            </tr>
        </thead>
        <tbody>
            {{range .Components}}
            <tr>
                <td>{{.Name}}</td>
                <td>{{.Type}}</td>
                <td class="amount">{{printf "%.2f" .Amount}}</td>
            </tr>
            {{end}}
        </tbody>
    </table>

    <div class="thp-box">
        <div class="thp-label">Total Gaji Bersih (Take Home Pay)</div>
        <div class="thp-amount">Rp {{printf "%.2f" .NetSalary}}</div>
    </div>

    <div class="footer">
        Dicetak secara otomatis oleh HRIS Nusantara Tech System · Valid tanpa tanda tangan basah.
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

	// Returns HTML buffer (or simulated PDF byte stream for lightweight runtime rendering)
	return buf.Bytes(), nil
}
