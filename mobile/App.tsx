import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Radius } from './src/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'reject' | 'history' | 'leave' | 'payslip' | 'profile'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);

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
            <TextInput style={styles.input} value="budi.santoso@nusantara.tech" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={styles.input} secureTextEntry value="••••••••" />
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
        <TouchableOpacity style={styles.avatar} onPress={() => setIsLoggedIn(false)}>
          <Text style={styles.avatarText}>BS</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Screen Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* TAB 1: ABSEN MASUK (SUCCESS / CAMERA LIVE) */}
        {activeTab === 'home' && (
          <View>
            {/* Live Camera View Box */}
            <View style={styles.cameraBox}>
              <View style={styles.camTopline}>
                <View style={styles.badgeLive}>
                  <View style={styles.dotGreen} />
                  <Text style={styles.badgeText}>Kamera Depan Aktif</Text>
                </View>
              </View>
              <View style={styles.faceGuide} />
              <Text style={styles.camHint}>Posisikan wajah Anda di dalam bingkai</Text>
            </View>

            {/* GPS Pulse Card */}
            <View style={styles.gpsCard}>
              <View style={styles.gpsPulseIcon}>
                <Feather name="map-pin" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={styles.gpsTitle}>Dalam Radius Geofence</Text>
                <Text style={styles.gpsSub}>Head Office Jakarta · 35m dari titik pusat</Text>
              </View>
            </View>

            {/* Clock Time & Date */}
            <Text style={styles.timeText}>08:14:05</Text>
            <Text style={styles.dateText}>Selasa, 25 Agustus 2026</Text>

            <TouchableOpacity style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Absen Masuk (Verifikasi Selfie)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setActiveTab('reject')}>
              <Text style={styles.btnSecondaryText}>Simulasi Skenario Outside Geofence</Text>
            </TouchableOpacity>
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

            {/* Camera Box Disabled State */}
            <View style={[styles.cameraBox, { backgroundColor: '#1A202C' }]}>
              <View style={styles.camTopline}>
                <View style={[styles.badgeLive, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <View style={[styles.dotGreen, { backgroundColor: '#EF4444' }]} />
                  <Text style={[styles.badgeText, { color: '#F87171' }]}>Di Luar Area Geofence</Text>
                </View>
              </View>
              <View style={[styles.faceGuide, { borderColor: 'rgba(239, 68, 68, 0.4)' }]} />
              <Text style={styles.camHint}>Dekati area kantor untuk mengaktifkan absen</Text>
            </View>

            {/* GPS Outside Card */}
            <View style={[styles.gpsCard, styles.gpsOutsideCard]}>
              <View style={[styles.gpsPulseIcon, { backgroundColor: Colors.danger }]}>
                <Feather name="alert-triangle" size={16} color="#FFF" />
              </View>
              <View>
                <Text style={[styles.gpsTitle, { color: '#8A3226' }]}>Di Luar Radius Kantor</Text>
                <Text style={styles.gpsSub}>Jarak 850m · Batas maksimal 100m</Text>
              </View>
            </View>

            {/* Clock Time & Date */}
            <Text style={styles.timeText}>08:14:05</Text>
            <Text style={styles.dateText}>Selasa, 25 Agustus 2026</Text>

            <TouchableOpacity style={styles.btnDisabled} disabled>
              <Text style={styles.btnDisabledText}>Absen Masuk (Terkunci)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setActiveTab('home')}>
              <Text style={styles.btnSecondaryText}>Kembali ke Absen Normal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 3: RIWAYAT ABSENSI */}
        {activeTab === 'history' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Riwayat Absensi Bulan Ini</Text>
            <View style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>Selasa, 25 Aug</Text>
                <Text style={styles.historyTime}>08:14 – 17:05</Text>
              </View>
              <View style={[styles.pill, styles.pillPresent]}><Text style={styles.pillTextPresent}>Hadir</Text></View>
            </View>
            <View style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>Senin, 24 Aug</Text>
                <Text style={styles.historyTime}>08:42 – 17:10</Text>
              </View>
              <View style={[styles.pill, styles.pillLate]}><Text style={styles.pillTextLate}>Telat 42m</Text></View>
            </View>
            <View style={styles.historyRow}>
              <View>
                <Text style={styles.historyDate}>Jumat, 21 Aug</Text>
                <Text style={styles.historyTime}>Cuti Tahunan</Text>
              </View>
              <View style={[styles.pill, styles.pillLeave]}><Text style={styles.pillTextLeave}>Cuti</Text></View>
            </View>
          </View>
        )}

        {/* TAB 4: AJUKAN IZIN (T030) */}
        {activeTab === 'leave' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ajukan Permohonan Izin / Cuti</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>JENIS IZIN</Text>
              <TextInput style={styles.input} value="Cuti Tahunan" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TANGGAL MULAI - SELESAI</Text>
              <TextInput style={styles.input} value="26 Agu 2026 - 28 Agu 2026" />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ALASAN / CATATAN</Text>
              <TextInput style={[styles.input, { height: 70 }]} multiline value="Keperluan keluarga di luar kota" />
            </View>
            <TouchableOpacity style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>Kirim Pengajuan Izin</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 5: SLIP GAJI */}
        {activeTab === 'payslip' && (
          <View>
            <View style={styles.payslipCard}>
              <Text style={styles.payslipPeriod}>Gaji Bersih · Agustus 2026</Text>
              <Text style={styles.payslipAmount}>Rp 9.850.000</Text>
              <View style={styles.tagRow}>
                <View style={styles.psTag}>
                  <Feather name="check-circle" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.psTagText}>Disetujui HR</Text>
                </View>
                <View style={styles.psTag}>
                  <Feather name="check-circle" size={12} color="#FFF" style={{ marginRight: 4 }} />
                  <Text style={styles.psTagText}>Sudah Dibayar 30 Agu</Text>
                </View>
              </View>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Rincian Take Home Pay</Text>
              <View style={styles.breakdownRow}><Text style={styles.bLabel}>Gaji Pokok</Text><Text style={styles.bValue}>Rp 9.000.000</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.bLabel}>Tunjangan Transport</Text><Text style={styles.bValue}>Rp 1.000.000</Text></View>
              <View style={styles.breakdownRow}><Text style={styles.bLabel}>Potongan Telat</Text><Text style={[styles.bValue, { color: Colors.danger }]}>- Rp 150.000</Text></View>
            </View>
          </View>
        )}

        {/* TAB 6: PROFIL */}
        {activeTab === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profil Personel Karyawan</Text>
            <Text style={styles.infoLabel}>NIK: <Text style={styles.infoVal}>EMP-2026-001</Text></Text>
            <Text style={styles.infoLabel}>NAMA: <Text style={styles.infoVal}>Budi Santoso</Text></Text>
            <Text style={styles.infoLabel}>DEPARTEMEN: <Text style={styles.infoVal}>Engineering</Text></Text>
            <Text style={styles.infoLabel}>JABATAN: <Text style={styles.infoVal}>Senior Software Engineer</Text></Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navbar with Expo Vector Feather Icons per Stitch DS §2.9 */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', label: 'Absen', iconName: 'camera' as const },
          { id: 'history', label: 'Riwayat', iconName: 'clock' as const },
          { id: 'leave', label: 'Izin', iconName: 'file-text' as const },
          { id: 'payslip', label: 'Slip Gaji', iconName: 'credit-card' as const },
          { id: 'profile', label: 'Profil', iconName: 'user' as const },
        ].map((tab) => {
          const isActive = activeTab === tab.id || (activeTab === 'reject' && tab.id === 'home');
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => setActiveTab(tab.id as any)}
              style={styles.navItem}
              activeOpacity={0.7}
            >
              <View style={[styles.navIconBox, isActive && styles.navIconBoxActive]}>
                <Feather name={tab.iconName} size={18} color={isActive ? Colors.primary : Colors.muted} />
              </View>
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.line },
  welcomeText: { fontSize: 12, color: Colors.muted },
  nameText: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: Colors.ink },
  content: { padding: 18 },
  cameraBox: { backgroundColor: '#151C24', borderRadius: 18, height: 260, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: 14 },
  camTopline: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  badgeLive: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ADE80', marginRight: 6 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  faceGuide: { width: 120, height: 150, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.55)', borderStyle: 'dashed', borderRadius: 60 },
  camHint: { position: 'absolute', bottom: 12, color: '#FFF', fontSize: 11, opacity: 0.85 },
  gpsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7F4', borderWidth: 1, borderColor: '#CFE6DC', padding: 12, borderRadius: 14, marginBottom: 16 },
  gpsOutsideCard: { backgroundColor: '#FBEEEC', borderColor: '#F0C7C0' },
  gpsPulseIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  gpsTitle: { fontSize: 13, fontWeight: '700', color: Colors.ink },
  gpsSub: { fontSize: 11.5, color: Colors.muted },
  timeText: { textAlign: 'center', fontSize: 34, fontWeight: '800', color: Colors.ink },
  dateText: { textAlign: 'center', fontSize: 12.5, color: Colors.muted, marginBottom: 18 },
  btnPrimary: { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 14, alignItems: 'center', elevation: 4 },
  btnPrimaryText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  btnSecondary: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.line, paddingVertical: 12, borderRadius: 14, alignItems: 'center', marginTop: 10 },
  btnSecondaryText: { color: Colors.ink, fontWeight: '600', fontSize: 13 },
  btnDisabled: { backgroundColor: '#C7C2B5', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  btnDisabledText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  errorBanner: { backgroundColor: '#FBEEEC', borderWidth: 1, borderColor: '#F0C7C0', padding: 12, borderRadius: 12, marginBottom: 14 },
  errorBannerText: { color: '#8A3226', fontSize: 12, lineHeight: 18 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 18, borderWidth: 1, borderColor: Colors.line, marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.ink, marginBottom: 14 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.line },
  historyDate: { fontWeight: '600', color: Colors.ink, fontSize: 13 },
  historyTime: { color: Colors.muted, fontSize: 11.5, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillPresent: { backgroundColor: '#E4F3EC' },
  pillTextPresent: { color: Colors.primaryDark, fontSize: 10.5, fontWeight: '700' },
  pillLate: { backgroundColor: '#FDF1DC' },
  pillTextLate: { color: '#9A6714', fontSize: 10.5, fontWeight: '700' },
  pillLeave: { backgroundColor: '#E9EEF7' },
  pillTextLeave: { color: '#2F4E8A', fontSize: 10.5, fontWeight: '700' },
  payslipCard: { backgroundColor: Colors.ink, borderRadius: Radius.card, padding: 20, marginBottom: 16 },
  payslipPeriod: { color: Colors.line, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  payslipAmount: { color: '#FFF', fontSize: 26, fontWeight: '800', marginVertical: 8 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  psTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  psTagText: { color: '#FFF', fontSize: 10.5, fontWeight: '600' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.line },
  bLabel: { fontSize: 12.5, color: Colors.ink },
  bValue: { fontSize: 12.5, fontWeight: '600', color: Colors.ink },
  bottomNav: { flexDirection: 'row', backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.line, paddingVertical: 8, paddingHorizontal: 4 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIconBox: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#F5F3EE', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  navIconBoxActive: { backgroundColor: '#E4F3EC' },
  navText: { fontSize: 11, color: Colors.muted, fontWeight: '500' },
  navTextActive: { color: Colors.primary, fontWeight: '700' },
  loginCard: { margin: 20, backgroundColor: Colors.surface, padding: 24, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.line, marginTop: 60 },
  logoBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#FFF', fontWeight: '800', fontSize: 20 },
  loginTitle: { fontSize: 20, fontWeight: '700', color: Colors.ink },
  loginSub: { fontSize: 13, color: Colors.muted, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  input: { borderWidth: 1, borderColor: Colors.line, borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA' },
  label: { fontSize: 11, fontWeight: '700', color: Colors.ink, marginBottom: 6 },
  infoLabel: { fontSize: 13, color: Colors.muted, marginVertical: 4 },
  infoVal: { fontWeight: '700', color: Colors.ink },
});
