import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'monitoring' | 'approval' | 'payment'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

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

          <button onClick={() => setIsLoggedIn(true)} className="btn-mini dark" style={{ width: '100%', padding: '14px', borderRadius: 10, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            Masuk ke Portal Admin
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', width: '100vw', margin: 0, padding: 0, overflow: 'hidden' }}>
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
                    <div className="kpi-value accent">12</div>
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
                    <tr>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Dewi Anggraini</div><div className="d">Marketing</div></div>
                        </div>
                      </td>
                      <td>Sakit dengan Surat Dokter</td>
                      <td>25 Agu 2026</td>
                      <td><span className="pill leave">Pending</span></td>
                      <td>
                        <button className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                        <button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={13} /> Tolak</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Rian Pratama</div><div className="d">Engineering</div></div>
                        </div>
                      </td>
                      <td>Cuti Tahunan</td>
                      <td>26–28 Agu 2026</td>
                      <td><span className="pill leave">Pending</span></td>
                      <td>
                        <button className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                        <button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><X size={13} /> Tolak</button>
                      </td>
                    </tr>
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
                  <button className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Plus size={15} /> Tambah Karyawan Baru</button>
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
                        <button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Edit3 size={13} /> Edit</button>
                        <button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#8A3226' }}><Trash2 size={13} /> Hapus</button>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>EMP-2026-002</strong></td>
                      <td>Siti Rahma</td>
                      <td>Human Resources</td>
                      <td>HR Specialist</td>
                      <td>Head Office Jakarta</td>
                      <td><span className="pill present">Permanent</span></td>
                      <td>
                        <button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Edit3 size={13} /> Edit</button>
                        <button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#8A3226' }}><Trash2 size={13} /> Hapus</button>
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
                <p className="sub">150 karyawan · Cutoff otomatis 20 Agu 2026</p>
                <div className="kpi-row">
                  <div className="kpi-card"><div className="kpi-label">Draft Menunggu Review</div><div className="kpi-value accent">23</div></div>
                  <div className="kpi-card"><div className="kpi-label">Sudah Disetujui</div><div className="kpi-value">115</div></div>
                  <div className="kpi-card"><div className="kpi-label">Direvisi</div><div className="kpi-value warn">2</div></div>
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
                    <tr>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Budi Santoso</div><div className="d">Engineering</div></div>
                        </div>
                      </td>
                      <td>18 / 3 / 2 / 1</td>
                      <td>Rp 9.850.000</td>
                      <td><span className="pill draft">Draft</span></td>
                      <td>
                        <button className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                        <button className="btn-mini">Rincian</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Dewi Anggraini</div><div className="d">Marketing</div></div>
                        </div>
                      </td>
                      <td>19 / 0 / 1 / 0</td>
                      <td>Rp 8.500.000</td>
                      <td><span className="pill approved">Disetujui</span></td>
                      <td><button className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> Lihat PDF</button></td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 16 }}>
                  <button className="btn-mini dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Approve Semua Draft (23)</button>
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
                      <th><input type="checkbox" defaultChecked /></th>
                      <th>Karyawan</th>
                      <th>Gaji Bersih</th>
                      <th>No. Rekening</th>
                      <th>Status Pembayaran</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><input type="checkbox" defaultChecked /></td>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Dewi Anggraini</div><div className="d">Marketing</div></div>
                        </div>
                      </td>
                      <td>Rp 8.500.000</td>
                      <td>BCA · 8801xxxxxx</td>
                      <td><span className="pill approved">Disetujui</span></td>
                      <td><button className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Tandai Dibayar</button></td>
                    </tr>
                    <tr>
                      <td><input type="checkbox" /></td>
                      <td>
                        <div className="row-flex">
                          <div className="mini-avatar"></div>
                          <div className="name-cell"><div className="n">Budi Santoso</div><div className="d">Engineering</div></div>
                        </div>
                      </td>
                      <td>Rp 9.850.000</td>
                      <td>Mandiri · 1330xxxxxx</td>
                      <td><span className="pill paid">Sudah Dibayar</span></td>
                      <td style={{ color: 'var(--muted)', fontSize: 12 }}>30 Agu · Ref TRF-001</td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: 16 }}>
                  <button className="btn-mini dark" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Check size={14} /> Tandai Terpilih Sebagai Sudah Dibayar (1)</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
