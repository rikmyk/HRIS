import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert, Linking, Modal, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius } from './src/theme';

const API_BASE = 'http://10.0.2.2:8080/v1'; // standard Android emulator loopback / localhost

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'reject' | 'history' | 'leave' | 'payslip' | 'profile'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [clockInSuccess, setClockInSuccess] = useState<boolean>(false);
  const [clockOutSuccess, setClockOutSuccess] = useState<boolean>(false);
  
  // Camera Modal & Permission State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [attendanceType, setAttendanceType] = useState<'in' | 'out'>('in');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState<boolean>(false);
  const [isPhotoCaptured, setIsPhotoCaptured] = useState<boolean>(false);
  
  // Photo Detail Modal State
  const [selectedPhoto, setSelectedPhoto] = useState<{ title: string; date: string; url: string; loc: string; time: string } | null>(null);

  // Form input state for Leave Request
  const [leaveReason, setLeaveReason] = useState<string>('Cuti Tahunan keperluan keluarga');
  const [leaveDays, setLeaveDays] = useState<string>('3');

  const [leaveHistory, setLeaveHistory] = useState([
    { id: '1', type: 'Sakit dengan Surat Dokter', date: '12 Jul 2026', days: '2 Hari', status: 'Disetujui' },
    { id: '2', type: 'Cuti Tahunan', date: '01 Jun 2026', days: '1 Hari', status: 'Disetujui' }
  ]);

  // Attendance History Data with Selfie Photos
  const [attendanceHistory] = useState([
    {
      id: 'att-1',
      date: 'Selasa, 25 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:14:05 WIB',
      clockInLoc: 'Head Office (35m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      clockOut: '17:05:12 WIB',
      clockOutLoc: 'Head Office (32m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
    },
    {
      id: 'att-2',
      date: 'Senin, 24 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:08:19 WIB',
      clockInLoc: 'Head Office (42m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      clockOut: '17:12:00 WIB',
      clockOutLoc: 'Head Office (40m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
    },
    {
      id: 'att-3',
      date: 'Jumat, 21 Agu 2026',
      status: 'Terlambat',
      lateMinutes: 14,
      clockIn: '08:44:12 WIB',
      clockInLoc: 'Head Office (68m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      clockOut: '17:00:45 WIB',
      clockOutLoc: 'Head Office (30m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
    },
    {
      id: 'att-4',
      date: 'Kamis, 20 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:11:30 WIB',
      clockInLoc: 'Head Office (20m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      clockOut: '17:08:22 WIB',
      clockOutLoc: 'Head Office (25m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
    }
  ]);

  // Trigger camera & GPS modal
  const openAttendanceModal = (type: 'in' | 'out') => {
    setAttendanceType(type);
    setIsCameraModalOpen(true);
    setIsRequestingPermissions(true);
    setIsPhotoCaptured(false);
    setTimeout(() => {
      setIsRequestingPermissions(false);
    }, 1000);
  };

  // Handlers for Mobile Actions
  const handleClockIn = async () => {
    setIsCameraModalOpen(false);
    try {
      await fetch(`${API_BASE}/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: -6.2088, longitude: 106.8456 })
      });
    } catch (e) {
      console.log('Mobile API call simulated');
    }
    setClockInSuccess(true);
    Alert.alert('✅ Absen Masuk Berhasil!', 'Kehadiran Anda telah dicatat pada 08:14:05 (Radius 35m dari Head Office).');
  };

  const handleClockOut = async () => {
    setIsCameraModalOpen(false);
    try {
      await fetch(`${API_BASE}/attendance/clock-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: -6.2088, longitude: 106.8456 })
      });
    } catch (e) {
      console.log('Mobile API call simulated');
    }
    setClockOutSuccess(true);
    Alert.alert('✅ Absen Keluar Berhasil!', 'Jam keluar Anda telah dicatat pada 17:05:12 (Head Office). Selamat beristirahat!');
  };

  const handleSimulateOutsideGeofence = async () => {
    try {
      await fetch(`${API_BASE}/attendance/clock-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude: -6.2200, longitude: 106.8500 }) // Outside geofence coordinates
      });
    } catch (e) {
      console.log('Mobile API call simulated');
    }
    setActiveTab('reject');
    Alert.alert('⚠️ Absen Ditolak (Luar Radius)', 'Sistem mendeteksi posisi Anda 850m dari lokasi kantor. Radius maksimum: 100m.');
  };

  const handleSubmitLeave = async () => {
    if (!leaveReason.trim()) {
      Alert.alert('Peringatan', 'Harap isi alasan pengajuan izin');
      return;
    }
    try {
      await fetch(`${API_BASE}/leave/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type_id: 'lt-01',
          start_date: '2026-08-26',
          end_date: '2026-08-28',
          reason: leaveReason
        })
      });
    } catch (e) {
      console.log('Mobile API call simulated');
    }

    const newItem = {
      id: String(Date.now()),
      type: 'Cuti Tahunan',
      date: '26–28 Agu 2026',
      days: `${leaveDays} Hari`,
      status: 'Pending'
    };

    setLeaveHistory([newItem, ...leaveHistory]);
    Alert.alert('✅ Pengajuan Berhasil!', 'Pengajuan izin telah dikirim ke Manager untuk persetujuan.');
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loginCard}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>H</Text>
          </View>
          <Text style={styles.loginTitle}>HRIS Karyawan</Text>
          <Text style={styles.loginSub}>Masuk dengan email perusahaan Anda</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>EMAIL ADRES</Text>
            <TextInput style={styles.input} defaultValue="budi.santoso@nusantara.tech" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={styles.input} secureTextEntry defaultValue="••••••••" />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => setIsLoggedIn(true)}>
            <Text style={styles.btnPrimaryText}>Masuk ke Aplikasi Mobile</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Phone Header Chrome */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Selamat Pagi 👋</Text>
          <Text style={styles.nameText}>Budi Santoso</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => setActiveTab('profile')}>
          <Text style={styles.avatarText}>BS</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Screen Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* TAB 1: ABSEN HOME & STATUS */}
        {activeTab === 'home' && (
          <View>
            {/* Clock Time & Date Banner */}
            <View style={{ backgroundColor: '#FFF', borderRadius: Radius.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder, marginBottom: 16 }}>
              <Text style={styles.welcomeText}>WAKTU SEKARANG</Text>
              <Text style={styles.timeText}>
                {clockOutSuccess ? '17:05:12' : clockInSuccess ? '17:05:00' : '08:14:05'}
              </Text>
              <Text style={styles.dateText}>Selasa, 25 Agustus 2026</Text>

              {/* GPS Status Badge */}
              <View style={styles.gpsCard}>
                <View style={styles.gpsPulseIcon}>
                  <Feather name="map-pin" size={16} color="#FFF" />
                </View>
                <View>
                  <Text style={styles.gpsTitle}>Dalam Radius Geofence</Text>
                  <Text style={styles.gpsSub}>Head Office Jakarta · 35m dari titik pusat</Text>
                </View>
              </View>
            </View>

            {/* Attendance Status Summary Card */}
            <View style={{ backgroundColor: '#FFF', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.lineBorder, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.darkInk, marginBottom: 12 }}>Status Absensi Hari Ini</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText }}>Absen Masuk</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: clockInSuccess ? '#166534' : '#94A3B8' }}>
                  {clockInSuccess ? '✓ 08:14:05 WIB' : 'Belum Absen'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText }}>Absen Keluar</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: clockOutSuccess ? '#166534' : '#94A3B8' }}>
                  {clockOutSuccess ? '✓ 17:05:12 WIB' : 'Belum Absen'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            {!clockInSuccess ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => openAttendanceModal('in')}>
                <Text style={styles.btnPrimaryText}>📷 Absen Masuk (Buka Kamera & GPS)</Text>
              </TouchableOpacity>
            ) : !clockOutSuccess ? (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#1E3A8A' }]} onPress={() => openAttendanceModal('out')}>
                <Text style={styles.btnPrimaryText}>📷 Absen Keluar (Buka Kamera & GPS)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#64748B' }]} disabled>
                <Text style={styles.btnPrimaryText}>✓ Absensi Hari Ini Selesai</Text>
              </TouchableOpacity>
            )}

            {!clockInSuccess && (
              <TouchableOpacity style={styles.btnSecondary} onPress={handleSimulateOutsideGeofence}>
                <Text style={styles.btnSecondaryText}>Simulasi Skenario Outside Geofence</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* TAB 2: ABSEN DITOLAK (REJECTED GEOFENCE SCREEN) */}
        {activeTab === 'reject' && (
          <View>
            {/* Error Notification Banner */}
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>
                ⚠️ <Text style={{ fontWeight: '700' }}>Absen Ditolak.</Text> Anda berada 850m dari kantor. Absen hanya bisa dilakukan dalam radius 100m dari Head Office.
              </Text>
            </View>

            {/* Map Simulation Box */}
            <View style={styles.mapBox}>
              <Feather name="alert-triangle" size={32} color="#8A3226" />
              <Text style={styles.mapTitle}>Di Luar Radius Kantor</Text>
              <Text style={styles.mapSub}>Jarak Anda: 850m | Radius Maks: 100m</Text>
            </View>

            <TouchableOpacity style={styles.btnPrimaryDisabled} disabled>
              <Text style={styles.btnDisabledText}>Absen Masuk Ditolak</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setActiveTab('home')}>
              <Text style={styles.btnSecondaryText}>Kembali ke Kamera Absen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 3: RIWAYAT ABSENSI KARYAWAN (ATTENDANCE HISTORY WITH SELFIES) */}
        {activeTab === 'history' && (
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Riwayat Absensi Saya</Text>
              <View style={{ backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Colors.lineBorder }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.forestGreen }}>Agustus 2026</Text>
              </View>
            </View>

            {/* Attendance Summary Bar */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
              <View style={{ flex: 1, backgroundColor: '#DCFCE7', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#166534' }}>18</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D', marginTop: 2 }}>HADIR</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#FEF3C7', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#92400E' }}>1</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309', marginTop: 2 }}>TERLAMBAT</Text>
              </View>
              <View style={{ flex: 1, backgroundColor: '#FEE2E2', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#991B1B' }}>0</Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: '#B91C1C', marginTop: 2 }}>ALPHA</Text>
              </View>
            </View>

            {/* Attendance Daily List */}
            {attendanceHistory.map((item) => (
              <View key={item.id} style={{ backgroundColor: '#FFF', borderRadius: Radius.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.lineBorder }}>
                {/* Header Date & Status */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.darkInk }}>{item.date}</Text>
                  <View style={[styles.statusPill, item.status === 'Hadir' ? styles.pillApproved : styles.pillPending]}>
                    <Text style={[styles.statusText, item.status === 'Hadir' ? styles.textApproved : styles.textPending]}>
                      {item.status === 'Hadir' ? 'Hadir Tepat Waktu' : `Terlambat (${item.lateMinutes} mnt)`}
                    </Text>
                  </View>
                </View>

                {/* Clock-In & Clock-Out Grid with Clean Photo Buttons */}
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {/* Clock In Column */}
                  <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.mutedText, marginBottom: 4 }}>ABSEN MASUK</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.darkInk }}>{item.clockIn}</Text>
                      <Text style={{ fontSize: 10, color: Colors.mutedText, marginTop: 2, marginBottom: 8 }}>{item.clockInLoc}</Text>
                    </View>

                    {/* Button Foto Absen Masuk */}
                    <TouchableOpacity
                      onPress={() => setSelectedPhoto({
                        title: 'Foto Selfie Absen Masuk',
                        date: item.date,
                        time: item.clockIn,
                        loc: item.clockInLoc,
                        url: item.clockInPhoto
                      })}
                      style={{
                        backgroundColor: '#FFF',
                        borderWidth: 1,
                        borderColor: Colors.forestGreen,
                        borderRadius: Radius.md,
                        paddingVertical: 7,
                        paddingHorizontal: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginTop: 4
                      }}
                    >
                      <Feather name="camera" size={12} color={Colors.forestGreen} style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.forestGreen }}>Foto Masuk</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Clock Out Column */}
                  <View style={{ flex: 1, backgroundColor: '#F8FAFC', padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'space-between' }}>
                    <View>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.mutedText, marginBottom: 4 }}>ABSEN KELUAR</Text>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: Colors.darkInk }}>{item.clockOut}</Text>
                      <Text style={{ fontSize: 10, color: Colors.mutedText, marginTop: 2, marginBottom: 8 }}>{item.clockOutLoc}</Text>
                    </View>

                    {/* Button Foto Absen Keluar */}
                    <TouchableOpacity
                      onPress={() => setSelectedPhoto({
                        title: 'Foto Selfie Absen Keluar',
                        date: item.date,
                        time: item.clockOut,
                        loc: item.clockOutLoc,
                        url: item.clockOutPhoto
                      })}
                      style={{
                        backgroundColor: '#FFF',
                        borderWidth: 1,
                        borderColor: '#1E3A8A',
                        borderRadius: Radius.md,
                        paddingVertical: 7,
                        paddingHorizontal: 8,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginTop: 4
                      }}
                    >
                      <Feather name="camera" size={12} color="#1E3A8A" style={{ marginRight: 4 }} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A' }}>Foto Keluar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 3: LEAVE REQUEST & HISTORY */}
        {activeTab === 'leave' && (
          <View>
            <Text style={styles.sectionTitle}>Form Pengajuan Izin & Cuti</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>JENIS IZIN</Text>
              <View style={styles.readOnlyBox}>
                <Text style={styles.readOnlyText}>Cuti Tahunan (Sisa Quota: 9 Hari)</Text>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>DURASI (HARI)</Text>
              <TextInput style={styles.input} value={leaveDays} onChangeText={setLeaveDays} keyboardType="numeric" />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>ALASAN PENGAJUAN</Text>
              <TextInput 
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]} 
                multiline 
                value={leaveReason} 
                onChangeText={setLeaveReason} 
              />
            </View>

            <TouchableOpacity style={styles.btnPrimary} onPress={handleSubmitLeave}>
              <Text style={styles.btnPrimaryText}>Kirim Pengajuan Izin</Text>
            </TouchableOpacity>

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Riwayat Pengajuan Izin</Text>
            {leaveHistory.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyType}>{item.type}</Text>
                  <Text style={styles.historyDate}>{item.date} · {item.days}</Text>
                </View>
                <View style={[styles.statusPill, item.status === 'Disetujui' ? styles.pillApproved : styles.pillPending]}>
                  <Text style={[styles.statusText, item.status === 'Disetujui' ? styles.textApproved : styles.textPending]}>{item.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TAB 4: PAYSLIP LIST & DETAIL */}
        {activeTab === 'payslip' && (
          <View>
            <Text style={styles.sectionTitle}>Slip Gaji Karyawan</Text>

            {/* Premium Payslip Hero Card */}
            <View style={styles.payslipHero}>
              <Text style={styles.payslipPeriod}>Agustus 2026</Text>
              <Text style={styles.payslipThpLabel}>GAJI BERSIH (TAKE HOME PAY)</Text>
              <Text style={styles.payslipThpAmount}>Rp 9.850.000</Text>
              
              <View style={styles.payslipTagsRow}>
                <View style={[styles.statusPill, styles.pillApproved]}>
                  <Text style={[styles.statusText, styles.textApproved]}>Disetujui</Text>
                </View>
                <View style={[styles.statusPill, styles.pillPaid]}>
                  <Text style={[styles.statusText, styles.textPaid]}>Sudah Dibayar</Text>
                </View>
              </View>
            </View>

            {/* Breakdown Components */}
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Rincian Komponen</Text>
              
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>Gaji Pokok</Text>
                <Text style={styles.breakdownVal}>Rp 9.000.000</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>Tunjangan Transport</Text>
                <Text style={styles.breakdownVal}>Rp 1.000.000</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>Potongan Keterlambatan (30m)</Text>
                <Text style={[styles.breakdownVal, { color: '#8A3226' }]}>-Rp 150.000</Text>
              </View>

              <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={() => {
                const pdfUrl = 'http://localhost:8080/v1/payroll/public/payslips/ps-001/pdf';
                Alert.alert('Mengunduh Slip Gaji PDF', 'Membuka slip gaji PDF dari Go Backend API...');
                Linking.openURL(pdfUrl).catch(() => {});
              }}>
                <Text style={styles.btnPrimaryText}>Unduh File PDF Slip Gaji</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 5: RIWAYAT KEHADIRAN */}
        {activeTab === 'history' && (
          <View>
            <Text style={styles.sectionTitle}>Riwayat Kehadiran Bulan Ini</Text>
            <View style={styles.historyCard}>
              <View>
                <Text style={styles.historyType}>Hadir (Valid Geofence)</Text>
                <Text style={styles.historyDate}>Selasa, 25 Agu 2026 · 08:14 - 17:05</Text>
              </View>
              <View style={[styles.statusPill, styles.pillApproved]}>
                <Text style={[styles.statusText, styles.textApproved]}>Hadir</Text>
              </View>
            </View>

            <View style={styles.historyCard}>
              <View>
                <Text style={styles.historyType}>Hadir (Terlambat 15m)</Text>
                <Text style={styles.historyDate}>Senin, 24 Agu 2026 · 08:30 - 17:00</Text>
              </View>
              <View style={[styles.statusPill, styles.pillPending]}>
                <Text style={[styles.statusText, styles.textPending]}>Telat</Text>
              </View>
            </View>
          </View>
        )}

        {/* TAB 6: PROFIL KARYAWAN */}
        {activeTab === 'profile' && (
          <View>
            <Text style={styles.sectionTitle}>Profil Karyawan</Text>

            <View style={styles.breakdownCard}>
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <View style={[styles.avatar, { width: 64, height: 64, borderRadius: 32, marginBottom: 12 }]}>
                  <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '800' }}>BS</Text>
                </View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.darkInk }}>Budi Santoso</Text>
                <Text style={{ fontSize: 13, color: Colors.mutedText, marginTop: 2 }}>Senior Software Engineer</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>NIK Karyawan</Text>
                <Text style={styles.breakdownVal}>EMP-2026-001</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>Email</Text>
                <Text style={styles.breakdownVal}>budi.santoso@nusantara.tech</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>Departemen</Text>
                <Text style={styles.breakdownVal}>Engineering</Text>
              </View>

              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownItem}>Lokasi Kerja</Text>
                <Text style={styles.breakdownVal}>Head Office Jakarta</Text>
              </View>

              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.danger, marginTop: 20 }]} onPress={() => setIsLoggedIn(false)}>
                <Text style={styles.btnPrimaryText}>Keluar dari Akun</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Feather name="camera" size={20} color={activeTab === 'home' ? Colors.forestGreen : Colors.mutedText} />
          <Text style={[styles.navText, activeTab === 'home' && styles.navActiveText]}>Absen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('history')}>
          <Feather name="clock" size={20} color={activeTab === 'history' ? Colors.forestGreen : Colors.mutedText} />
          <Text style={[styles.navText, activeTab === 'history' && styles.navActiveText]}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('leave')}>
          <Feather name="file-text" size={20} color={activeTab === 'leave' ? Colors.forestGreen : Colors.mutedText} />
          <Text style={[styles.navText, activeTab === 'leave' && styles.navActiveText]}>Izin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('payslip')}>
          <Feather name="credit-card" size={20} color={activeTab === 'payslip' ? Colors.forestGreen : Colors.mutedText} />
          <Text style={[styles.navText, activeTab === 'payslip' && styles.navActiveText]}>Slip Gaji</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Feather name="user" size={20} color={activeTab === 'profile' ? Colors.forestGreen : Colors.mutedText} />
          <Text style={[styles.navText, activeTab === 'profile' && styles.navActiveText]}>Profil</Text>
        </TouchableOpacity>
      </View>

      {/* CAMERA & GPS ATTENDANCE MODAL DIALOG */}
      <Modal visible={isCameraModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather name="camera" size={20} color={Colors.forestGreen} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>
                  {attendanceType === 'in' ? 'Verifikasi Absen Masuk' : 'Verifikasi Absen Keluar'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsCameraModalOpen(false)}>
                <Feather name="x" size={22} color={Colors.darkInk} />
              </TouchableOpacity>
            </View>

            {isRequestingPermissions ? (
              <View style={styles.permissionBox}>
                <ActivityIndicator size="large" color={Colors.forestGreen} style={{ marginBottom: 16 }} />
                <Text style={styles.permissionTitle}>Meminta Akses Kamera & GPS HP...</Text>
                <Text style={styles.permissionSub}>
                  Sistem sedang mengaktifkan sensor lokasi presisi dan kamera depan perangkat Anda.
                </Text>
              </View>
            ) : !isPhotoCaptured ? (
              <View>
                {/* Live Camera Frame */}
                <View style={styles.cameraBoxModal}>
                  <View style={styles.camTopline}>
                    <View style={styles.badgeLive}>
                      <View style={styles.dotGreen} />
                      <Text style={styles.badgeText}>Kamera Depan Aktif · Live</Text>
                    </View>
                  </View>
                  <View style={styles.faceGuide} />
                  <Text style={styles.camHint}>Posisikan wajah Anda di dalam bingkai</Text>
                </View>

                {/* GPS Location info */}
                <View style={styles.gpsCardModal}>
                  <Feather name="map-pin" size={16} color={Colors.forestGreen} style={{ marginRight: 8 }} />
                  <Text style={styles.gpsSubModal}>
                    Lat: -6.2088, Lng: 106.8456 · Head Office (Radius 35m - Valid)
                  </Text>
                </View>

                {/* Take Photo Action */}
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 16 }]}
                  onPress={() => setIsPhotoCaptured(true)}
                >
                  <Text style={styles.btnPrimaryText}>📸 Ambil Foto Selfie</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnSecondary, { marginTop: 8 }]}
                  onPress={() => setIsCameraModalOpen(false)}
                >
                  <Text style={styles.btnSecondaryText}>Batal</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Captured Photo Preview Box */}
                <View style={[styles.cameraBoxModal, { backgroundColor: '#0F172A', borderColor: '#10B981', borderWidth: 2 }]}>
                  <View style={styles.camTopline}>
                    <View style={[styles.badgeLive, { backgroundColor: '#10B981' }]}>
                      <Feather name="check" size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.badgeText}>Foto Tersimpan & Valid</Text>
                    </View>
                  </View>
                  
                  {/* Photo Preview Avatar Placeholder */}
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#1E293B', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#10B981' }}>
                    <Feather name="user-check" size={48} color="#10B981" />
                  </View>
                  
                  <Text style={{ color: '#E2E8F0', fontSize: 12, fontWeight: '600' }}>Wajah Terverifikasi (Kualitas Bagus)</Text>
                </View>

                {/* GPS Location info */}
                <View style={styles.gpsCardModal}>
                  <Feather name="map-pin" size={16} color={Colors.forestGreen} style={{ marginRight: 8 }} />
                  <Text style={styles.gpsSubModal}>
                    Lat: -6.2088, Lng: 106.8456 · Head Office (Radius 35m - Valid)
                  </Text>
                </View>

                {/* 2 Buttons: Retake & Submit */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.btnSecondary, { flex: 1, marginTop: 0 }]}
                    onPress={() => setIsPhotoCaptured(false)}
                  >
                    <Text style={styles.btnSecondaryText}>🔄 Foto Ulang</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnPrimary, { flex: 1.4, marginTop: 0, backgroundColor: attendanceType === 'out' ? '#1E3A8A' : Colors.forestGreen }]}
                    onPress={attendanceType === 'in' ? handleClockIn : handleClockOut}
                  >
                    <Text style={styles.btnPrimaryText}>
                      ✅ Submit {attendanceType === 'in' ? 'Masuk' : 'Keluar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* FULL-SCREEN PHOTO PREVIEW ZOOM MODAL */}
      <Modal visible={selectedPhoto !== null} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: '#1E293B', borderRadius: Radius.lg, padding: 20, alignItems: 'center' }}>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{selectedPhoto?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedPhoto(null)}>
                <Feather name="x" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <View style={{ width: '100%', height: 260, borderRadius: Radius.md, overflow: 'hidden', marginBottom: 16 }}>
              <Image source={{ uri: selectedPhoto?.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>

            <View style={{ width: '100%', backgroundColor: '#0F172A', padding: 12, borderRadius: Radius.md, marginBottom: 16 }}>
              <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '700' }}>DETAIL ABSENSI</Text>
              <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 4 }}>{selectedPhoto?.date} · {selectedPhoto?.time}</Text>
              <Text style={{ color: '#CBD5E1', fontSize: 12, marginTop: 2 }}>📍 Lokasi: {selectedPhoto?.loc}</Text>
              <Text style={{ color: '#10B981', fontSize: 11, fontWeight: '700', marginTop: 6 }}>✓ GPS & Foto Terverifikasi HRIS (Valid)</Text>
            </View>

            <TouchableOpacity style={[styles.btnPrimary, { width: '100%', backgroundColor: Colors.forestGreen }]} onPress={() => setSelectedPhoto(null)}>
              <Text style={styles.btnPrimaryText}>Tutup Pratinjau</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.creamBg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: Colors.lineBorder },
  welcomeText: { fontSize: 12, color: Colors.mutedText, textTransform: 'uppercase', fontWeight: '700' },
  nameText: { fontSize: 18, fontWeight: '800', color: Colors.darkInk },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.forestGreen, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  content: { padding: 20, paddingBottom: 100 },
  cameraBox: { height: 200, backgroundColor: '#1E293B', borderRadius: Radius.lg, justifyContent: 'space-between', padding: 14, alignItems: 'center' },
  camTopline: { width: '100%', flexDirection: 'row', justifyContent: 'flex-start' },
  badgeLive: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  faceGuide: { width: 100, height: 110, borderRadius: 50, borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)', borderStyle: 'dashed' },
  camHint: { color: '#94A3B8', fontSize: 12, marginBottom: 4 },
  gpsCard: { marginTop: 14, backgroundColor: '#FFF', borderRadius: Radius.md, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder },
  gpsPulseIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.forestGreen, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  gpsTitle: { fontSize: 13, fontWeight: '700', color: Colors.darkInk },
  gpsSub: { fontSize: 11, color: Colors.mutedText },
  timeText: { fontSize: 36, fontWeight: '800', color: Colors.darkInk, textAlign: 'center', marginTop: 16 },
  dateText: { fontSize: 13, color: Colors.mutedText, textAlign: 'center', marginBottom: 20 },
  btnPrimary: { backgroundColor: Colors.forestGreen, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  btnSecondary: { marginTop: 10, paddingVertical: 12, borderRadius: Radius.md, alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder },
  btnSecondaryText: { color: Colors.darkInk, fontWeight: '600', fontSize: 13 },
  errorBanner: { backgroundColor: '#FADBD8', padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: '#F5B7B1', marginBottom: 16 },
  errorBannerText: { color: '#78281F', fontSize: 13, lineHeight: 18 },
  mapBox: { height: 160, backgroundColor: '#FADBD8', borderRadius: Radius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#F5B7B1' },
  mapTitle: { fontSize: 15, fontWeight: '700', color: '#78281F', marginTop: 8 },
  mapSub: { fontSize: 12, color: '#78281F' },
  btnPrimaryDisabled: { backgroundColor: '#E2E8F0', paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center' },
  btnDisabledText: { color: '#94A3B8', fontWeight: '700', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.darkInk, marginBottom: 14 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.mutedText, marginBottom: 6 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: Colors.lineBorder, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  readOnlyBox: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: Colors.lineBorder, borderRadius: Radius.md, paddingHorizontal: 12, paddingVertical: 12 },
  readOnlyText: { fontSize: 13, color: Colors.darkInk, fontWeight: '600' },
  historyCard: { backgroundColor: '#FFF', padding: 14, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.lineBorder, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyType: { fontSize: 14, fontWeight: '700', color: Colors.darkInk },
  historyDate: { fontSize: 12, color: Colors.mutedText, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  pillApproved: { backgroundColor: '#D4EFDF' },
  pillPending: { backgroundColor: '#FCF3CF' },
  pillPaid: { backgroundColor: '#D6EAF8' },
  statusText: { fontSize: 11, fontWeight: '700' },
  textApproved: { color: '#196F3D' },
  textPending: { color: '#B7950B' },
  textPaid: { color: '#1B4F72' },
  payslipHero: { backgroundColor: '#1E293B', padding: 20, borderRadius: Radius.lg, marginBottom: 16 },
  payslipPeriod: { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  payslipThpLabel: { color: '#CBD5E1', fontSize: 10, fontWeight: '800', marginTop: 12 },
  payslipThpAmount: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  payslipTagsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  breakdownCard: { backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.lineBorder },
  breakdownTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  breakdownItem: { fontSize: 13, color: Colors.darkInk },
  breakdownVal: { fontSize: 13, fontWeight: '700', color: Colors.darkInk },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 64, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: Colors.lineBorder, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  navItem: { alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, color: Colors.mutedText, marginTop: 4 },
  navActiveText: { color: Colors.forestGreen, fontWeight: '700' },
  loginCard: { flex: 1, justifyContent: 'center', padding: 24 },
  logoBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.forestGreen, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  loginTitle: { fontSize: 24, fontWeight: '800', color: Colors.darkInk, marginBottom: 6 },
  loginSub: { fontSize: 13, color: Colors.mutedText, marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.lineBorder },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.darkInk },
  permissionBox: { paddingVertical: 36, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 15, fontWeight: '700', color: Colors.darkInk, marginBottom: 6 },
  permissionSub: { fontSize: 12, color: Colors.mutedText, textAlign: 'center', paddingHorizontal: 20, lineHeight: 18 },
  cameraBoxModal: { height: 220, backgroundColor: '#1E293B', borderRadius: Radius.lg, justifyContent: 'space-between', padding: 14, alignItems: 'center' },
  gpsCardModal: { marginTop: 12, backgroundColor: '#F8FAFC', borderRadius: Radius.md, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder },
  gpsSubModal: { fontSize: 12, fontWeight: '600', color: Colors.darkInk }
});
