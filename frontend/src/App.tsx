import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  MapPin,
  FileCheck,
  CreditCard,
  LogOut,
  UserCheck,
  Clock,
  AlertTriangle,
  FileText,
  Search,
  Plus,
  Check,
  X,
  Edit3,
  Trash2,
  Info,
  ShieldAlert,
  Building2,
  Calendar,
  CheckCircle2
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/v1';

interface LeaveRequestItem {
  id: string;
  employee_name: string;
  department: string;
  leave_type: string;
  date_range: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PayslipItem {
  id: string;
  employee_name: string;
  department: string;
  attendance_summary: string;
  gross_salary: string;
  net_salary: string;
  bank_account: string;
  status: 'draft' | 'approved' | 'rejected';
  is_paid: boolean;
  paid_date?: string;
  ref_no?: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'monitoring' | 'approval' | 'payment'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dynamic interactive state for E2E workflows
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([
    {
      id: 'lr-101',
      employee_name: 'Dewi Anggraini',
      department: 'Marketing',
      leave_type: 'Sakit dengan Surat Dokter',
      date_range: '25 Agu 2026',
      status: 'pending'
    },
    {
      id: 'lr-102',
      employee_name: 'Rian Pratama',
      department: 'Engineering',
      leave_type: 'Cuti Tahunan',
      date_range: '26–28 Agu 2026',
      status: 'pending'
    }
  ]);

  const [payslips, setPayslips] = useState<PayslipItem[]>([
    {
      id: 'ps-001',
      employee_name: 'Budi Santoso',
      department: 'Engineering',
      attendance_summary: '18 / 3 / 2 / 1',
      gross_salary: 'Rp 10.000.000',
      net_salary: 'Rp 9.850.000',
      bank_account: 'Mandiri · 1330xxxxxx',
      status: 'draft',
      is_paid: false
    },
    {
      id: 'ps-002',
      employee_name: 'Dewi Anggraini',
      department: 'Marketing',
      attendance_summary: '19 / 0 / 1 / 0',
      gross_salary: 'Rp 8.500.000',
      net_salary: 'Rp 8.500.000',
      bank_account: 'BCA · 8801xxxxxx',
      status: 'approved',
      is_paid: false
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // E2E Action Handlers with API call + UI State Sync
  const handleApproveLeave = async (id: string, name: string) => {
    try {
      await fetch(`${API_BASE}/leave/requests/${id}/approve`, { method: 'POST' });
    } catch (e) {
      console.log('API offline, updating UI locally');
    }
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    showToast(`Pengajuan izin ${name} BERHASIL DI-APPROVE!`);
  };

  const handleRejectLeave = async (id: string, name: string) => {
    try {
      await fetch(`${API_BASE}/leave/requests/${id}/reject`, { method: 'POST' });
    } catch (e) {
      console.log('API offline, updating UI locally');
    }
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    showToast(`Pengajuan izin ${name} DITOLAK.`);
  };

  const handleApprovePayslip = async (id: string, name: string) => {
    try {
      await fetch(`${API_BASE}/payroll/payslips/${id}/approve`, { method: 'POST' });
    } catch (e) {
      console.log('API offline, updating UI locally');
    }
    setPayslips(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    showToast(`Slip gaji ${name} BERHASIL DISETUJUI! PDF Siap diunduh.`);
  };

  const handleBulkApprovePayslips = async () => {
    try {
      await fetch(`${API_BASE}/payroll/payslips/bulk-approve`, { method: 'POST' });
    } catch (e) {
      console.log('API offline, updating UI locally');
    }
    setPayslips(prev => prev.map(p => ({ ...p, status: 'approved' })));
    showToast('Seluruh Draft Slip Gaji (Agustus 2026) BERHASIL DI-APPROVE SEKALIGUS!');
  };

  const handleMarkAsPaid = async (id: string, name: string) => {
    const target = payslips.find(p => p.id === id);
    if (target && target.status !== 'approved') {
      showToast(`⚠️ GAGAL: Slip gaji ${name} harus di-approve terlebih dahulu sebelum ditandai dibayar!`);
      return;
    }
    try {
      await fetch(`${API_BASE}/payroll/payslips/${id}/mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_reference: 'TRF-MANUAL-202608' })
      });
    } catch (e) {
      console.log('API offline, updating UI locally');
    }
    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    setPayslips(prev => prev.map(p => p.id === id ? { ...p, is_paid: true, paid_date: todayStr, ref_no: 'TRF-MANUAL-202608' } : p));
    showToast(`Status pembayaran gaji ${name} DITANDAI DIBAYAR (Ref: TRF-MANUAL-202608)!`);
  };

  const handleBulkMarkAsPaid = async () => {
    const approvedUnpaid = payslips.filter(p => p.status === 'approved' && !p.is_paid);
    if (approvedUnpaid.length === 0) {
      showToast('⚠️ Tidak ada slip gaji berstatus Disetujui yang belum dibayar.');
      return;
    }
    try {
      await fetch(`${API_BASE}/payroll/payslips/bulk-mark-paid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payslip_ids: approvedUnpaid.map(p => p.id), payment_reference: 'TRF-BATCH-202608' })
      });
    } catch (e) {
      console.log('API offline, updating UI locally');
    }
    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    setPayslips(prev => prev.map(p => p.status === 'approved' ? { ...p, is_paid: true, paid_date: todayStr, ref_no: 'TRF-BATCH-202608' } : p));
    showToast(`Berhasil menandai ${approvedUnpaid.length} slip gaji TERPILIH SEBAGAI SUDAH DIBAYAR!`);
  };

  const handleDownloadPDF = (id: string, name: string) => {
    showToast(`Mengunduh Slip Gaji PDF ${name}...`);
    window.open(`${API_BASE}/payroll/payslips/${id}/pdf`, '_blank');
  };

  if (!isLoggedIn) {
    return (
      <div className="login-split-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ flex: 1, background: 'var(--ink)', color: '#fff', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 24 }}>H</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 32, marginBottom: 12 }}>HRIS Admin Portal</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 400, lineHeight: 1.6 }}>
            Sistem Manajemen Sumber Daya Manusia & Penggajian Terpadu. Kelola kehadiran geofence, izin, dan slip gaji dalam satu dasbor.
          </p>
        </div>
        <div style={{ flex: 1, padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 500 }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: 24, marginBottom: 8 }}>Masuk Akun Admin</h2>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Gunakan email kredensial HR atau Super Admin</p>
          
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMAIL ADRES</label>
            <input type="email" defaultValue="hr.admin@nusantara.tech" style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontSize: 14 }} />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>PASSWORD</label>
            <input type="password" defaultValue="••••••••" style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid var(--line)', background: '#fff', fontSize: 14 }} />
          </div>

          <button onClick={() => { setIsLoggedIn(true); showToast('Selamat Datang, Sari Wijaya (HR Admin)'); }} className="btn-mini dark" style={{ width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Masuk ke Portal Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Toast Alert Notification */}
      {toastMessage && (
        <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, background: '#2F6F5E', color: '#fff', padding: '14px 20px', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 600 }}>
          <CheckCircle2 size={18} color="#fff" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="admin-shell">
        {/* Topbar */}
        <div className="admin-topbar">
          <div className="brand">
            <div className="brand-mark">H</div>
            <span>HRIS Admin</span>
          </div>
          <div className="admin-user">
            <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12 }}>SW</div>
            <span>Sari Wijaya · HR Admin</span>
            <button onClick={() => setIsLoggedIn(false)} className="btn-mini" style={{ marginLeft: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>

        {/* Layout */}
        <div className="admin-layout">
          {/* Sidebar */}
          <div className="admin-sidebar">
            <div className={`side-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <LayoutDashboard size={17} /> Dashboard
            </div>
            <div className={`side-link ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')}>
              <Users size={17} /> Karyawan
            </div>
            <div className={`side-link ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')}>
              <MapPin size={17} /> Monitoring Absensi
            </div>
            <div className={`side-link ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveTab('approval')}>
              <FileCheck size={17} /> Approval Slip Gaji
            </div>
            <div className={`side-link ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>
              <CreditCard size={17} /> Penandaan Pembayaran
            </div>
          </div>

          {/* Main View Container */}
          <div className="admin-main">
            {activeTab === 'dashboard' && (
              <>
                <h2>Dashboard Overview</h2>
                <p className="sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={14} /> Selasa, 25 Agustus 2026</p>
                <div className="kpi-row">
                  <div className="kpi-card">
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={15} color="var(--primary-dark)" /> Hadir Hari Ini
                    </div>
                    <div className="kpi-value">142 / 150</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Clock size={15} color="#9A6714" /> Terlambat
                    </div>
                    <div className="kpi-value warn">9</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={15} color="#8A3226" /> Absen Ditolak (di luar radius)
                    </div>
                    <div className="kpi-value danger">3</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FileText size={15} color="#2F4E8A" /> Slip Gaji Belum Dibayar
                    </div>
                    <div className="kpi-value accent">{payslips.filter(p => !p.is_paid).length}</div>
                  </div>
                </div>

                <h2 style={{ fontSize: 15, marginBottom: 12, marginTop: 24 }}>Pengajuan Izin Terbaru</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Jenis Izin</th>
                      <th>Tanggal</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveRequests.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="row-flex">
                            <div className="mini-avatar"></div>
                            <div className="name-cell"><div className="n">{r.employee_name}</div><div className="d">{r.department}</div></div>
                          </div>
                        </td>
                        <td>{r.leave_type}</td>
                        <td>{r.date_range}</td>
                        <td>
                          <span className={`pill ${r.status === 'approved' ? 'present' : r.status === 'rejected' ? 'absent' : 'leave'}`}>
                            {r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {r.status === 'pending' ? (
                            <>
                              <button onClick={() => handleApproveLeave(r.id, r.employee_name)} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                              <button onClick={() => handleRejectLeave(r.id, r.employee_name)} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 6 }}><X size={13} /> Tolak</button>
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Telah Diproses</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="panel-note" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Info size={16} color="var(--primary-dark)" />
                  KPI "Absen Ditolak" menandakan percobaan absen di luar radius geofence — berguna untuk mendeteksi pola anomali lokasi kantor.
                </div>
              </>
            )}

            {activeTab === 'employees' && (
              <>
                <h2>Manajemen Karyawan</h2>
                <p className="sub">Daftar seluruh personel, departemen, dan posisi pekerjaan</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ position: 'relative', width: 280 }}>
                    <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
                    <input type="text" placeholder="Cari nama / NIK..." style={{ padding: '8px 14px 8px 36px', borderRadius: 8, border: '1px solid var(--line)', width: '100%' }} />
                  </div>
                  <button onClick={() => showToast('Form Tambah Karyawan Baru SIAP (NIK EMP-2026-003)')} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Tambah Karyawan Baru</button>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Kode Karyawan</th>
                      <th>Nama Lengkap</th>
                      <th>Departemen</th>
                      <th>Jabatan</th>
                      <th>Lokasi Kantor</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>EMP-2026-001</strong></td>
                      <td>Budi Santoso</td>
                      <td>Engineering</td>
                      <td>Senior Software Engineer</td>
                      <td>Head Office Jakarta</td>
                      <td><span className="pill present">Permanent</span></td>
                      <td>
                        <button onClick={() => showToast('Membuka modal edit Budi Santoso')} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Edit3 size={13} /> Edit</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>EMP-2026-002</strong></td>
                      <td>Dewi Anggraini</td>
                      <td>Marketing</td>
                      <td>Marketing Specialist</td>
                      <td>Head Office Jakarta</td>
                      <td><span className="pill present">Permanent</span></td>
                      <td>
                        <button onClick={() => showToast('Membuka modal edit Dewi Anggraini')} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Edit3 size={13} /> Edit</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {activeTab === 'monitoring' && (
              <>
                <h2>Monitoring Absensi — Real-time</h2>
                <p className="sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building2 size={14} /> Kantor Pusat Jakarta · Radius Geofence 100m</p>
                <div style={{ background: '#EAE6DB', border: '1px solid var(--line)', borderRadius: 14, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 20, gap: 8 }}>
                  <MapPin size={18} color="var(--primary)" /> Peta Lokasi Absen Real-time — Pin Hijau (Dalam Radius) & Pin Merah (Percobaan Ditolak)
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Jam Absen</th>
                      <th>Jarak dari Kantor</th>
                      <th>Foto Selfie</th>
                      <th>Status Geofence</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Budi Santoso</div><div className="d">Engineering</div></div>
                        </div>
                      </td>
                      <td>08:02:15</td>
                      <td>35m</td>
                      <td><div className="mini-avatar" style={{ borderRadius: 6, background: '#2F6F5E' }}></div></td>
                      <td><span className="pill present">Hadir (Valid)</span></td>
                    </tr>
                    <tr>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Ahmad Fauzi</div><div className="d">Sales Lapangan</div></div>
                        </div>
                      </td>
                      <td>08:41:02</td>
                      <td>850m</td>
                      <td>—</td>
                      <td><span className="pill absent">Ditolak — Luar Radius</span></td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}

            {activeTab === 'approval' && (
              <>
                <h2>Approval Slip Gaji — Agustus 2026</h2>
                <p className="sub">Periode Cutoff 20 Agu 2026</p>
                <div className="kpi-row">
                  <div className="kpi-card"><div className="kpi-label">Draft Menunggu Review</div><div className="kpi-value accent">{payslips.filter(p => p.status === 'draft').length}</div></div>
                  <div className="kpi-card"><div className="kpi-label">Sudah Disetujui</div><div className="kpi-value">{payslips.filter(p => p.status === 'approved').length}</div></div>
                  <div className="kpi-card"><div className="kpi-label">Sudah Dibayar</div><div className="kpi-value">{payslips.filter(p => p.is_paid).length}</div></div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Hadir / Telat / Izin / Alpha</th>
                      <th>Gaji Bersih</th>
                      <th>Status Slip</th>
                      <th>Aksi Approval</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="row-flex">
                            <div className="mini-avatar"></div>
                            <div className="name-cell"><div className="n">{p.employee_name}</div><div className="d">{p.department}</div></div>
                          </div>
                        </td>
                        <td>{p.attendance_summary}</td>
                        <td><strong>{p.net_salary}</strong></td>
                        <td>
                          <span className={`pill ${p.status === 'approved' ? 'approved' : 'draft'}`}>
                            {p.status === 'approved' ? 'Disetujui' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          {p.status === 'draft' ? (
                            <button onClick={() => handleApprovePayslip(p.id, p.employee_name)} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                          ) : (
                            <button onClick={() => handleDownloadPDF(p.id, p.employee_name)} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> Lihat PDF</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16 }}>
                  <button onClick={handleBulkApprovePayslips} className="btn-mini dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Approve Semua Draft</button>
                </div>
              </>
            )}

            {activeTab === 'payment' && (
              <>
                <h2>Penandaan Pembayaran — Agustus 2026</h2>
                <p className="sub">Slip berstatus "Disetujui" yang telah ditransfer manual melalui Internet Banking</p>
                <div className="error-banner" style={{ background: '#FDF1DC', borderColor: '#F0DBA6', color: '#7A5A0F', padding: 14, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={18} color="#7A5A0F" />
                  <div>
                    Sistem <strong>tidak melakukan transfer otomatis</strong>. Lakukan transfer bank perusahaan terlebih dahulu, lalu tandai status pembayaran di bawah ini.
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Gaji Bersih</th>
                      <th>No. Rekening</th>
                      <th>Status Pembayaran</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="row-flex">
                            <div className="mini-avatar"></div>
                            <div className="name-cell"><div className="n">{p.employee_name}</div><div className="d">{p.department}</div></div>
                          </div>
                        </td>
                        <td><strong>{p.net_salary}</strong></td>
                        <td>{p.bank_account}</td>
                        <td>
                          <span className={`pill ${p.is_paid ? 'paid' : p.status === 'approved' ? 'approved' : 'draft'}`}>
                            {p.is_paid ? 'Sudah Dibayar' : p.status === 'approved' ? 'Disetujui (Belum Dibayar)' : 'Draft (Belum Approve)'}
                          </span>
                        </td>
                        <td>
                          {!p.is_paid ? (
                            <button onClick={() => handleMarkAsPaid(p.id, p.employee_name)} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Tandai Dibayar</button>
                          ) : (
                            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{p.paid_date} · Ref {p.ref_no}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: 16 }}>
                  <button onClick={handleBulkMarkAsPaid} className="btn-mini dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Tandai Terpilih Sebagai Sudah Dibayar</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
