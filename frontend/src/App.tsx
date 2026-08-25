import React, { useState } from 'react';
import './index.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dash' | 'emp' | 'live' | 'leave' | 'payroll' | 'reports' | 'settings'>('dash');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

  if (!isLoggedIn) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg)' }}>
        <div style={{ background: 'var(--surface)', padding: '32px', borderRadius: 'var(--radius)', width: '380px', border: '1px solid var(--line)' }}>
          <h2 style={{ margin: '0 0 8px 0' }}>HRIS Web Admin Login</h2>
          <p style={{ color: 'var(--muted)', fontSize: '14px', marginBottom: '24px' }}>Masukkan email & password untuk masuk ke Portal HR</p>
          
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>EMAIL ADRES</label>
            <input type="email" defaultValue="hr.admin@nusantara.tech" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>PASSWORD</label>
            <input type="password" defaultValue="••••••••" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--line)', boxSizing: 'border-box' }} />
          </div>

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => setIsLoggedIn(true)}>Masuk Admin Portal</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      {/* Admin Sidebar per DS §2.10 */}
      <aside style={{ width: '220px', backgroundColor: '#FCFBF9', borderRight: '1px solid var(--line)', padding: '24px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>H</div>
          <span className="display-font" style={{ fontWeight: 700, fontSize: '18px' }}>HRIS Admin</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          {[
            { id: 'dash', label: 'Dashboard' },
            { id: 'emp', label: 'Karyawan' },
            { id: 'live', label: 'Monitoring Absensi' },
            { id: 'leave', label: 'Pengajuan Izin' },
            { id: 'payroll', label: 'Payroll & Slip Gaji' },
            { id: 'reports', label: 'Laporan' },
            { id: 'settings', label: 'Pengaturan Kantor' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 12px',
                borderRadius: '9px',
                border: 'none',
                backgroundColor: activeTab === item.id ? 'var(--ink)' : 'transparent',
                color: activeTab === item.id ? '#FFFFFF' : 'var(--ink)',
                fontWeight: activeTab === item.id ? 600 : 400,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => setIsLoggedIn(false)}
          style={{ padding: '10px 12px', borderRadius: '9px', border: '1px solid var(--line)', backgroundColor: 'transparent', color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}
        >
          Keluar (Logout)
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '32px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>
              {activeTab === 'dash' && 'Dashboard Overview'}
              {activeTab === 'emp' && 'Manajemen Karyawan'}
              {activeTab === 'live' && 'Monitoring Absensi Real-time'}
              {activeTab === 'leave' && 'Persetujuan Izin & Cuti'}
              {activeTab === 'payroll' && 'Payroll & Persetujuan Slip Gaji'}
              {activeTab === 'reports' && 'Laporan System'}
              {activeTab === 'settings' && 'Pengaturan Kantor & Geofence'}
            </h1>
            <span style={{ color: 'var(--muted)', fontSize: '13px' }}>PT HRIS Nusantara Tech</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="pill pill-present">Online Admin</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>HR</div>
          </div>
        </header>

        <section style={{ backgroundColor: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--line)', padding: '24px' }}>
          <p style={{ color: 'var(--muted)' }}>Halaman <strong>{activeTab.toUpperCase()}</strong> telah terintegrasi dengan fondasi backend Go modular monolith.</p>
        </section>
      </main>
    </div>
  );
};

export default App;
