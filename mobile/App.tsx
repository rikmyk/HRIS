import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, SafeAreaView, ScrollView } from 'react-native';
import { Colors, Radius } from './src/theme';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'payslip' | 'profile'>('home');
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
            <Text style={styles.label}>EMAIL</Text>
            <TextInput style={styles.input} value="budi.santoso@nusantara.tech" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput style={styles.input} secureTextEntry value="••••••••" />
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={() => setIsLoggedIn(true)}>
            <Text style={styles.btnPrimaryText}>Masuk ke Aplikasi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Selamat Pagi,</Text>
          <Text style={styles.nameText}>Budi Santoso</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>BS</Text>
        </View>
      </View>

      {/* Main Tab Screen Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'home' && (
          <View style={styles.clockCard}>
            <View style={styles.gpsBadge}>
              <View style={styles.gpsDot} />
              <Text style={styles.gpsText}>GPS In Range — Office HQ (35m)</Text>
            </View>
            <Text style={styles.timeText}>08:14 WIB</Text>
            <Text style={styles.dateText}>Selasa, 25 Agustus 2026</Text>

            <TouchableOpacity style={styles.clockInBtn}>
              <Text style={styles.clockInBtnText}>Absen Masuk (Camera)</Text>
            </TouchableOpacity>

            <Text style={styles.policyText}>
              Kamera depan otomatis terbuka untuk verifikasi selfie. Absensi di luar radius kantor akan ditolak secara otomatis.
            </Text>
          </View>
        )}

        {activeTab === 'history' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Riwayat Absensi Bulan Ini</Text>
            <View style={styles.historyRow}>
              <Text style={styles.historyDate}>25 Aug</Text>
              <Text style={styles.historyTime}>08:14 - 17:05</Text>
              <View style={[styles.pill, styles.pillPresent]}><Text style={styles.pillTextPresent}>Tepat Waktu</Text></View>
            </View>
            <View style={styles.historyRow}>
              <Text style={styles.historyDate}>24 Aug</Text>
              <Text style={styles.historyTime}>08:42 - 17:10</Text>
              <View style={[styles.pill, styles.pillLate]}><Text style={styles.pillTextLate}>Terlambat</Text></View>
            </View>
          </View>
        )}

        {activeTab === 'payslip' && (
          <View style={styles.payslipCard}>
            <Text style={styles.payslipPeriod}>Slip Gaji — Agustus 2026</Text>
            <Text style={styles.payslipAmount}>Rp 9.850.000</Text>
            <View style={styles.tagRow}>
              <View style={[styles.pill, styles.pillPresent]}><Text style={styles.pillTextPresent}>Disetujui HR</Text></View>
              <View style={[styles.pill, styles.pillPresent]}><Text style={styles.pillTextPresent}>Transfer Selesai</Text></View>
            </View>
          </View>
        )}

        {activeTab === 'profile' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Profil Karyawan</Text>
            <Text style={styles.infoLabel}>KODE KARYAWAN: <Text style={styles.infoVal}>EMP-2026-001</Text></Text>
            <Text style={styles.infoLabel}>DEPARTEMEN: <Text style={styles.infoVal}>Engineering</Text></Text>
            <Text style={styles.infoLabel}>JABATAN: <Text style={styles.infoVal}>Senior Software Engineer</Text></Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Tab Navbar per DS §2.9 */}
      <View style={styles.bottomNav}>
        {[
          { id: 'home', label: 'Absensi' },
          { id: 'history', label: 'Riwayat' },
          { id: 'payslip', label: 'Slip Gaji' },
          { id: 'profile', label: 'Profil' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={styles.navItem}
          >
            <Text style={[styles.navText, activeTab === tab.id && styles.navTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.line },
  welcomeText: { fontSize: 13, color: Colors.muted },
  nameText: { fontSize: 18, fontWeight: '700', color: Colors.ink },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', color: Colors.ink },
  content: { padding: 20 },
  clockCard: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 24, borderWidth: 1, borderColor: Colors.line, alignItems: 'center' },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E4F3EC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.pill, marginBottom: 16 },
  gpsDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginRight: 6 },
  gpsText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  timeText: { fontSize: 36, fontWeight: '800', color: Colors.ink, marginBottom: 4 },
  dateText: { fontSize: 13, color: Colors.muted, marginBottom: 24 },
  clockInBtn: { backgroundColor: Colors.primary, paddingVertical: 14, paddingHorizontal: 32, borderRadius: Radius.default, width: '100%', alignItems: 'center', elevation: 4 },
  clockInBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  policyText: { fontSize: 11, color: Colors.muted, textAlign: 'center', marginTop: 16, lineHeight: 16 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.card, padding: 20, borderWidth: 1, borderColor: Colors.line, marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.ink, marginBottom: 12 },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.line },
  historyDate: { fontWeight: '600', color: Colors.ink },
  historyTime: { color: Colors.muted, fontSize: 12 },
  payslipCard: { backgroundColor: Colors.ink, borderRadius: Radius.card, padding: 24, marginBottom: 16 },
  payslipPeriod: { color: Colors.line, fontSize: 13 },
  payslipAmount: { color: '#FFF', fontSize: 28, fontWeight: '800', marginVertical: 8 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.pill },
  pillPresent: { backgroundColor: '#E4F3EC' },
  pillTextPresent: { color: Colors.primaryDark, fontSize: 10, fontWeight: '700' },
  pillLate: { backgroundColor: '#FDF1DC' },
  pillTextLate: { color: '#9A6714', fontSize: 10, fontWeight: '700' },
  bottomNav: { flexDirection: 'row', backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.line, paddingVertical: 12 },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 12, color: Colors.muted },
  navTextActive: { color: Colors.primary, fontWeight: '700' },
  loginCard: { margin: 20, backgroundColor: Colors.surface, padding: 24, borderRadius: Radius.card, borderWidth: 1, borderColor: Colors.line, marginTop: 60 },
  logoBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  logoText: { color: '#FFF', fontWeight: '800', fontSize: 20 },
  loginTitle: { fontSize: 20, fontWeight: '700', color: Colors.ink },
  loginSub: { fontSize: 13, color: Colors.muted, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', color: Colors.ink, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: Colors.line, borderRadius: 8, padding: 10, backgroundColor: '#FAFAFA' },
  btnPrimary: { backgroundColor: Colors.primary, padding: 14, borderRadius: Radius.default, alignItems: 'center', marginTop: 12 },
  btnPrimaryText: { color: '#FFF', fontWeight: '700' },
  infoLabel: { fontSize: 13, color: Colors.muted, marginVertical: 4 },
  infoVal: { fontWeight: '700', color: Colors.ink },
});
