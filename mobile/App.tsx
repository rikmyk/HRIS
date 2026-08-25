import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, SafeAreaView, ScrollView, Alert, Linking, Modal, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LogOut, LogIn, Camera, BookOpen, Sun, Globe, Info, ChevronRight, ChevronDown } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Colors, Radius } from './src/theme';

const API_BASE = 'http://10.0.2.2:8080/v1'; // standard Android emulator loopback / localhost

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'reject' | 'history' | 'leave' | 'payslip' | 'profile'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [clockInSuccess, setClockInSuccess] = useState<boolean>(false);
  const [clockOutSuccess, setClockOutSuccess] = useState<boolean>(false);
  const [clockInTime, setClockInTime] = useState<string>('08:14:05 WIB');
  const [clockOutTime, setClockOutTime] = useState<string>('17:05:12 WIB');

  // Live Clock Timer
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const formatDate = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  const getGreeting = (date: Date) => {
    const hours = date.getHours();
    if (hours >= 3 && hours < 11) {
      return 'Selamat Pagi 👋';
    } else if (hours >= 11 && hours < 15) {
      return 'Selamat Siang 👋';
    } else if (hours >= 15 && hours < 18) {
      return 'Selamat Sore 👋';
    } else {
      return 'Selamat Malam 👋';
    }
  };
  
  // Camera & GPS Real Sensor State
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [locationData, setLocationData] = useState<{ lat: number; lng: number } | null>(null);
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null);
  const [cameraKey, setCameraKey] = useState<number>(Date.now());
  const cameraRef = useRef<any>(null);

  // Camera Modal & Permission State
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [attendanceType, setAttendanceType] = useState<'in' | 'out'>('in');
  const [isRequestingPermissions, setIsRequestingPermissions] = useState<boolean>(false);
  const [isCameraRefreshing, setIsCameraRefreshing] = useState<boolean>(false);
  const [isPhotoCaptured, setIsPhotoCaptured] = useState<boolean>(false);
  
  // Photo Detail Modal State & History Filter & Pagination State (Max 5 items per page)
  const [selectedPhoto, setSelectedPhoto] = useState<{ title: string; date: string; url: string; loc: string; time: string } | null>(null);
  const [historyFilter, setHistoryFilter] = useState<'7days' | 'month' | '30days'>('month');
  const [attendancePage, setAttendancePage] = useState<number>(1);
  const ATTENDANCE_PER_PAGE = 5;

  // Form input state for Leave Request
  const [leaveReason, setLeaveReason] = useState<string>('Cuti Tahunan keperluan keluarga');
  const [leaveDays, setLeaveDays] = useState<string>('3');

  const [leaveHistory, setLeaveHistory] = useState([
    { id: '1', type: 'Sakit dengan Surat Dokter', date: '12 Jul 2026', days: '2 Hari', status: 'Disetujui' },
    { id: '2', type: 'Cuti Tahunan', date: '01 Jun 2026', days: '1 Hari', status: 'Disetujui' },
    { id: '3', type: 'Izin Keperluan Pribadi', date: '15 Mei 2026', days: '1 Hari', status: 'Disetujui' },
    { id: '4', type: 'Cuti Tahunan', date: '10 Apr 2026', days: '2 Hari', status: 'Disetujui' },
    { id: '5', type: 'Sakit Tanpa Surat Dokter', date: '02 Mar 2026', days: '1 Hari', status: 'Ditolak' },
    { id: '6', type: 'Izin Keluar Kantor', date: '18 Feb 2026', days: '1 Hari', status: 'Disetujui' },
    { id: '7', type: 'Cuti Tahunan', date: '10 Jan 2026', days: '3 Hari', status: 'Disetujui' }
  ]);

  // Leave History Filter & Pagination State (Max 5 items per page)
  const [selectedLeaveFilter, setSelectedLeaveFilter] = useState<string>('all');
  const [leavePage, setLeavePage] = useState<number>(1);
  const LEAVES_PER_PAGE = 5;

  // Payslip History Data with PDF URLs (7 Months for Pagination testing)
  const [payslipHistory] = useState([
    {
      id: 'ps-001',
      period: 'Agustus 2026',
      thp: 'Rp 9.850.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: '-Rp 150.000',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-001/pdf`
    },
    {
      id: 'ps-002',
      period: 'Juli 2026',
      thp: 'Rp 10.000.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: 'Rp 0',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-002/pdf`
    },
    {
      id: 'ps-003',
      period: 'Juni 2026',
      thp: 'Rp 9.700.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: '-Rp 300.000',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-003/pdf`
    },
    {
      id: 'ps-004',
      period: 'Mei 2026',
      thp: 'Rp 10.000.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: 'Rp 0',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-004/pdf`
    },
    {
      id: 'ps-005',
      period: 'April 2026',
      thp: 'Rp 9.800.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: '-Rp 200.000',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-005/pdf`
    },
    {
      id: 'ps-006',
      period: 'Maret 2026',
      thp: 'Rp 10.000.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: 'Rp 0',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-006/pdf`
    },
    {
      id: 'ps-007',
      period: 'Februari 2026',
      thp: 'Rp 9.650.000',
      basicSalary: 'Rp 9.000.000',
      transport: 'Rp 1.000.000',
      deduction: '-Rp 350.000',
      approvalStatus: 'Disetujui',
      paymentStatus: 'Sudah Dibayar',
      pdfUrl: `${API_BASE}/payroll/public/payslips/ps-007/pdf`
    }
  ]);

  // Filter Period Month & Pagination State for Payslip History (Max 5 Months per Page)
  const [selectedPayslipMonth, setSelectedPayslipMonth] = useState<string>('all');
  const [payslipPage, setPayslipPage] = useState<number>(1);
  const PAYSLIPS_PER_PAGE = 5;

  // Attendance History Data with Selfie Photos (8 items for 5-per-page testing)
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
    },
    {
      id: 'att-5',
      date: 'Rabu, 19 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:05:10 WIB',
      clockInLoc: 'Head Office (18m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      clockOut: '17:02:40 WIB',
      clockOutLoc: 'Head Office (20m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80'
    },
    {
      id: 'att-6',
      date: 'Selasa, 18 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:12:45 WIB',
      clockInLoc: 'Head Office (22m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      clockOut: '17:10:15 WIB',
      clockOutLoc: 'Head Office (28m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80'
    },
    {
      id: 'att-7',
      date: 'Jumat, 14 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:09:20 WIB',
      clockInLoc: 'Head Office (15m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      clockOut: '17:04:00 WIB',
      clockOutLoc: 'Head Office (19m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80'
    },
    {
      id: 'att-8',
      date: 'Kamis, 13 Agu 2026',
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: '08:14:50 WIB',
      clockInLoc: 'Head Office (25m)',
      clockInPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
      clockOut: '17:01:10 WIB',
      clockOutLoc: 'Head Office (30m)',
      clockOutPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80'
    }
  ]);

  // Trigger camera & GPS modal
  const openAttendanceModal = async (type: 'in' | 'out') => {
    setAttendanceType(type);
    setIsPhotoCaptured(false);
    setCapturedPhotoUri(null);
    setCameraKey(Date.now());
    setIsCameraModalOpen(true);
    setIsRequestingPermissions(true);

    try {
      if (!cameraPermission?.granted) {
        await requestCameraPermission();
      }
      const locationRes = await Location.requestForegroundPermissionsAsync();
      if (locationRes.status === 'granted') {
        try {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setLocationData({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        } catch (e) {
          console.log('Location fetch error:', e);
        }
      }
    } catch (err) {
      console.log('Permission request error:', err);
    } finally {
      setIsRequestingPermissions(false);
    }
  };

  const handleTakePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
        if (photo && photo.uri) {
          setCapturedPhotoUri(photo.uri);
          setIsPhotoCaptured(true);
        }
      } catch (err) {
        console.log('Camera capture error:', err);
      }
    }
  };

  const handleRetakePhoto = () => {
    setCapturedPhotoUri(null);
    setIsPhotoCaptured(false);
    setIsCameraRefreshing(true);
    setTimeout(() => {
      setCameraKey(Date.now());
      setIsCameraRefreshing(false);
    }, 250);
  };

  // Handlers for Mobile Actions
  const handleClockIn = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('⚠️ Foto Belum Diambil', 'Silakan ambil foto selfie absensi terlebih dahulu.');
      return;
    }
    setIsCameraModalOpen(false);
    const nowStr = formatTime(new Date()) + ' WIB';
    setClockInTime(nowStr);
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
    Alert.alert('✅ Absen Masuk Berhasil!', `Kehadiran Anda telah dicatat pada ${nowStr} (Radius 35m dari Head Office).`);
  };

  const handleClockOut = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('⚠️ Foto Belum Diambil', 'Silakan ambil foto selfie absensi terlebih dahulu.');
      return;
    }
    setIsCameraModalOpen(false);
    const nowStr = formatTime(new Date()) + ' WIB';
    setClockOutTime(nowStr);
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
    Alert.alert('✅ Absen Keluar Berhasil!', `Jam keluar Anda telah dicatat pada ${nowStr} (Head Office). Selamat beristirahat!`);
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
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Phone Header Chrome */}
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>{getGreeting(currentTime)}</Text>
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
            {/* Clock Time & Date Banner (Live Real-Time Ticking Clock) */}
            <View style={{ backgroundColor: '#FFF', borderRadius: Radius.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder, marginBottom: 16 }}>
              <Text style={styles.welcomeText}>WAKTU SEKARANG</Text>
              <Text style={styles.timeText}>
                {formatTime(currentTime)}
              </Text>
              <Text style={styles.dateText}>{formatDate(currentTime)}</Text>

              {/* GPS Status Badge */}
              <View style={styles.gpsCard}>
                <View style={styles.gpsPulseIcon}>
                  <Feather name="map-pin" size={16} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={styles.gpsTitle}>Dalam Radius Geofence</Text>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#166534' }}>MULTI-OFFICE VALID</Text>
                    </View>
                  </View>
                  <Text style={styles.gpsSub}>Terdeteksi: Head Office Jakarta (35m) · Terdaftar 2 Cabang</Text>
                </View>
              </View>
            </View>

            {/* Attendance Status Summary Card */}
            <View style={{ backgroundColor: '#FFF', borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: Colors.lineBorder, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.darkInk, marginBottom: 12 }}>Status Absensi Hari Ini</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText }}>Absen Masuk</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: clockInSuccess ? '#166534' : '#94A3B8' }}>
                  {clockInSuccess ? `✓ ${clockInTime}` : 'Belum Absen'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText }}>Absen Keluar</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: clockOutSuccess ? '#166534' : '#94A3B8' }}>
                  {clockOutSuccess ? `✓ ${clockOutTime}` : 'Belum Absen'}
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            {!clockInSuccess ? (
              <TouchableOpacity style={styles.btnPrimary} onPress={() => openAttendanceModal('in')}>
                <Text style={styles.btnPrimaryText}>Absen Masuk (Buka Kamera & GPS)</Text>
              </TouchableOpacity>
            ) : !clockOutSuccess ? (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#1E3A8A' }]} onPress={() => openAttendanceModal('out')}>
                <Text style={styles.btnPrimaryText}>Absen Keluar (Buka Kamera & GPS)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: '#64748B' }]} disabled>
                <Text style={styles.btnPrimaryText}>Absensi Hari Ini Selesai</Text>
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
            {/* Attendance Summary & Filter Header Card */}
            <View style={{
              backgroundColor: '#FFF',
              borderRadius: Radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: Colors.lineBorder,
              marginBottom: 16
            }}>
              <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Riwayat Absensi Saya</Text>

              {/* Attendance Summary Bar (Dynamic by Filter - At Top) */}
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1, backgroundColor: '#DCFCE7', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#166534' }}>
                    {historyFilter === '7days' ? '5' : historyFilter === 'month' ? '18' : '22'}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#15803D', marginTop: 2 }}>HADIR</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FEF3C7', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#92400E' }}>
                    {historyFilter === '7days' ? '0' : '1'}
                  </Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#B45309', marginTop: 2 }}>TERLAMBAT</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#FEE2E2', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#991B1B' }}>0</Text>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#B91C1C', marginTop: 2 }}>ALPHA</Text>
                </View>
              </View>

              {/* 3-Tab Filter Selector: 7 Hari | 30 Hari | Bulan Ini - Pure White Inactive Background */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => {
                    setHistoryFilter('7days');
                    setAttendancePage(1);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: historyFilter === '7days' ? Colors.forestGreen : Colors.lineBorder,
                    backgroundColor: historyFilter === '7days' ? Colors.forestGreen : '#FFF'
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: historyFilter === '7days' ? '#FFF' : Colors.darkInk }}>7 Hari</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setHistoryFilter('30days');
                    setAttendancePage(1);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: historyFilter === '30days' ? Colors.forestGreen : Colors.lineBorder,
                    backgroundColor: historyFilter === '30days' ? Colors.forestGreen : '#FFF'
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: historyFilter === '30days' ? '#FFF' : Colors.darkInk }}>30 Hari</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setHistoryFilter('month');
                    setAttendancePage(1);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: 'center',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: historyFilter === 'month' ? Colors.forestGreen : Colors.lineBorder,
                    backgroundColor: historyFilter === 'month' ? Colors.forestGreen : '#FFF'
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: historyFilter === 'month' ? '#FFF' : Colors.darkInk }}>Bulan Ini</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Attendance Daily List (Filtered by filter pills & paginated max 5 per page) */}
            {(() => {
              const filteredList = historyFilter === '7days' 
                ? attendanceHistory.slice(0, 5) 
                : attendanceHistory;

              const totalPages = Math.ceil(filteredList.length / ATTENDANCE_PER_PAGE) || 1;
              const paginatedList = filteredList.slice((attendancePage - 1) * ATTENDANCE_PER_PAGE, attendancePage * ATTENDANCE_PER_PAGE);

              return (
                <View>
                  {paginatedList.map((item) => (
                    <View key={item.id} style={{ backgroundColor: '#FFF', borderRadius: Radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: Colors.lineBorder }}>
                      {/* 1. BAGIAN ATAS: Tanggal & Status Badge */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.darkInk }}>{item.date}</Text>
                        <View style={[styles.statusPill, item.status === 'Hadir' ? styles.pillApproved : styles.pillPending]}>
                          <Text style={[styles.statusText, item.status === 'Hadir' ? styles.textApproved : styles.textPending]}>
                            {item.status === 'Hadir' ? 'Hadir' : `Terlambat (${item.lateMinutes}m)`}
                          </Text>
                        </View>
                      </View>

                      {/* 2. BAGIAN TENGAH: Jam Masuk & Jam Keluar Sebaris */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: '#F1F5F9' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <LogIn size={13} color={Colors.forestGreen} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: Colors.mutedText }}>Masuk: </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.darkInk }}>{item.clockIn}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <LogOut size={13} color="#1E3A8A" style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: Colors.mutedText }}>Keluar: </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.darkInk }}>{item.clockOut}</Text>
                        </View>
                      </View>

                      {/* 3. BAGIAN BAWAH: Button Foto Masuk & Keluar Sebaris */}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => setSelectedPhoto({
                            title: 'Foto Selfie Absen Masuk',
                            date: item.date,
                            time: item.clockIn,
                            loc: item.clockInLoc,
                            url: item.clockInPhoto
                          })}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFF',
                            borderWidth: 1,
                            borderColor: Colors.forestGreen,
                            borderRadius: 6,
                            paddingVertical: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Camera size={13} color={Colors.forestGreen} style={{ marginRight: 5 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.forestGreen }}>Foto Masuk</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setSelectedPhoto({
                            title: 'Foto Selfie Absen Keluar',
                            date: item.date,
                            time: item.clockOut,
                            loc: item.clockOutLoc,
                            url: item.clockOutPhoto
                          })}
                          style={{
                            flex: 1,
                            backgroundColor: '#FFF',
                            borderWidth: 1,
                            borderColor: '#1E3A8A',
                            borderRadius: 6,
                            paddingVertical: 6,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Camera size={13} color="#1E3A8A" style={{ marginRight: 5 }} />
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#1E3A8A' }}>Foto Keluar</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}

                  {/* Attendance Pagination Controls */}
                  {totalPages > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 20 }}>
                      <TouchableOpacity
                        disabled={attendancePage <= 1}
                        onPress={() => setAttendancePage(prev => Math.max(prev - 1, 1))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: attendancePage <= 1 ? '#F1F5F9' : Colors.forestGreen,
                          opacity: attendancePage <= 1 ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: attendancePage <= 1 ? Colors.mutedText : '#FFF' }}>
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.darkInk }}>
                        Halaman {attendancePage} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={attendancePage >= totalPages}
                        onPress={() => setAttendancePage(prev => Math.min(prev + 1, totalPages))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: attendancePage >= totalPages ? '#F1F5F9' : Colors.forestGreen,
                          opacity: attendancePage >= totalPages ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: attendancePage >= totalPages ? Colors.mutedText : '#FFF' }}>
                          Selanjutnya
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        )}

        {/* TAB 3: LEAVE REQUEST & HISTORY */}
        {activeTab === 'leave' && (
          <View>
            {/* Form Leave Request Card Container */}
            <View style={{
              backgroundColor: '#FFF',
              borderRadius: Radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: Colors.lineBorder,
              marginBottom: 20
            }}>
              <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Form Pengajuan Izin & Cuti</Text>
              
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

              <TouchableOpacity style={[styles.btnPrimary, { marginTop: 8 }]} onPress={handleSubmitLeave}>
                <Text style={styles.btnPrimaryText}>Kirim Pengajuan Izin</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { marginTop: 24, marginBottom: 12 }]}>Riwayat Pengajuan Izin</Text>

            {/* Filter Pills Selector for Leave History */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'all', label: 'Semua Izin' },
                  { key: 'Cuti Tahunan', label: 'Cuti Tahunan' },
                  { key: 'Sakit', label: 'Sakit' },
                  { key: 'Izin', label: 'Izin Pribadi' }
                ].map((filterItem) => {
                  const isActive = selectedLeaveFilter === filterItem.key;
                  return (
                    <TouchableOpacity
                      key={filterItem.key}
                      onPress={() => {
                        setSelectedLeaveFilter(filterItem.key);
                        setLeavePage(1);
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: isActive ? Colors.forestGreen : '#FFF',
                        borderWidth: 1,
                        borderColor: isActive ? Colors.forestGreen : Colors.lineBorder,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFF' : Colors.darkInk }}>
                        {filterItem.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Filter & Pagination Logic for Leave History */}
            {(() => {
              const filteredList = selectedLeaveFilter === 'all'
                ? leaveHistory
                : leaveHistory.filter(item => item.type.toLowerCase().includes(selectedLeaveFilter.toLowerCase()));

              const totalPages = Math.ceil(filteredList.length / LEAVES_PER_PAGE) || 1;
              const paginatedList = filteredList.slice((leavePage - 1) * LEAVES_PER_PAGE, leavePage * LEAVES_PER_PAGE);

              return (
                <View>
                  {paginatedList.map((item) => (
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

                  {/* Pagination Controls for Leave History (Max 5 items per page) */}
                  {totalPages > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16, backgroundColor: '#FFF', padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.lineBorder }}>
                      <TouchableOpacity
                        disabled={leavePage <= 1}
                        onPress={() => setLeavePage(prev => Math.max(prev - 1, 1))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: leavePage <= 1 ? '#F1F5F9' : Colors.forestGreen,
                          opacity: leavePage <= 1 ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: leavePage <= 1 ? Colors.mutedText : '#FFF' }}>
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.darkInk }}>
                        Halaman {leavePage} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={leavePage >= totalPages}
                        onPress={() => setLeavePage(prev => Math.min(prev + 1, totalPages))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: leavePage >= totalPages ? '#F1F5F9' : Colors.forestGreen,
                          opacity: leavePage >= totalPages ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: leavePage >= totalPages ? Colors.mutedText : '#FFF' }}>
                          Selanjutnya
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}
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
                const pdfUrl = `${API_BASE}/payroll/public/payslips/ps-001/pdf`;
                Alert.alert('Mengunduh Slip Gaji PDF', 'Membuka slip gaji PDF dari Go Backend API...');
                Linking.openURL(pdfUrl).catch(() => {});
              }}>
                <Text style={styles.btnPrimaryText}>Unduh File PDF Slip Gaji Bulan Ini</Text>
              </TouchableOpacity>
            </View>

            {/* Riwayat Slip Gaji Past Periods List */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
              <Text style={styles.sectionTitle}>
                Riwayat Slip Gaji Karyawan
              </Text>
            </View>

            {/* Filter Selector Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'all', label: 'Semua Periode' },
                  { key: 'Agustus 2026', label: 'Agustus 2026' },
                  { key: 'Juli 2026', label: 'Juli 2026' },
                  { key: 'Juni 2026', label: 'Juni 2026' },
                  { key: 'Mei 2026', label: 'Mei 2026' },
                  { key: 'April 2026', label: 'April 2026' }
                ].map((month) => {
                  const isActive = selectedPayslipMonth === month.key;
                  return (
                    <TouchableOpacity
                      key={month.key}
                      onPress={() => {
                        setSelectedPayslipMonth(month.key);
                        setPayslipPage(1);
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: 20,
                        backgroundColor: isActive ? Colors.forestGreen : '#FFF',
                        borderWidth: 1,
                        borderColor: isActive ? Colors.forestGreen : Colors.lineBorder,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFF' : Colors.darkInk }}>
                        {month.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Filter & Pagination Logic */}
            {(() => {
              const filteredList = selectedPayslipMonth === 'all'
                ? payslipHistory
                : payslipHistory.filter(item => item.period === selectedPayslipMonth);

              const totalPages = Math.ceil(filteredList.length / PAYSLIPS_PER_PAGE) || 1;
              
              const currentPaginatedList = selectedPayslipMonth === 'all'
                ? filteredList.slice((payslipPage - 1) * PAYSLIPS_PER_PAGE, payslipPage * PAYSLIPS_PER_PAGE)
                : filteredList;

              return (
                <View>
                  {/* List of Payslips */}
                  {currentPaginatedList.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        backgroundColor: '#FFF',
                        borderRadius: Radius.md,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: Colors.lineBorder
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Feather name="file-text" size={18} color={Colors.forestGreen} />
                          <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.darkInk }}>{item.period}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <View style={[styles.statusPill, styles.pillApproved, { paddingHorizontal: 8, paddingVertical: 2 }]}>
                            <Text style={[styles.statusText, styles.textApproved, { fontSize: 10 }]}>{item.approvalStatus}</Text>
                          </View>
                          <View style={[styles.statusPill, styles.pillPaid, { paddingHorizontal: 8, paddingVertical: 2 }]}>
                            <Text style={[styles.statusText, styles.textPaid, { fontSize: 10 }]}>{item.paymentStatus}</Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: '#F8FAFC', padding: 10, borderRadius: 6 }}>
                        <View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.mutedText }}>TAKE HOME PAY</Text>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.forestGreen, marginTop: 2 }}>
                            {item.thp}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: Colors.mutedText }}>Gaji Pokok: {item.basicSalary}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.btnSecondary, { marginTop: 0, justifyContent: 'center', alignItems: 'center' }]}
                        onPress={() => {
                          Alert.alert('Mengunduh Slip Gaji PDF', `Membuka file PDF Slip Gaji periode ${item.period}...`);
                          Linking.openURL(item.pdfUrl).catch(() => {});
                        }}
                      >
                        <Text style={styles.btnSecondaryText}>Unduh PDF ({item.period})</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Pagination Controls (Max 5 Months per Page) */}
                  {selectedPayslipMonth === 'all' && totalPages > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 20, backgroundColor: '#FFF', padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.lineBorder }}>
                      <TouchableOpacity
                        disabled={payslipPage <= 1}
                        onPress={() => setPayslipPage(prev => Math.max(prev - 1, 1))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: payslipPage <= 1 ? '#F1F5F9' : Colors.forestGreen,
                          opacity: payslipPage <= 1 ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: payslipPage <= 1 ? Colors.mutedText : '#FFF' }}>
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.darkInk }}>
                        Halaman {payslipPage} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={payslipPage >= totalPages}
                        onPress={() => setPayslipPage(prev => Math.min(prev + 1, totalPages))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: payslipPage >= totalPages ? '#F1F5F9' : Colors.forestGreen,
                          opacity: payslipPage >= totalPages ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: payslipPage >= totalPages ? Colors.mutedText : '#FFF' }}>
                          Selanjutnya
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        )}



        {/* TAB 6: PROFIL KARYAWAN */}
        {activeTab === 'profile' && (
          <View>
            <Text style={styles.sectionTitle}>Profil Karyawan</Text>

            {/* 1. GREEN HERO PROFILE CARD (Matching Absen Masuk Forest Green Theme) */}
            <View
              style={{
                backgroundColor: Colors.forestGreen,
                borderRadius: 24,
                paddingVertical: 24,
                paddingHorizontal: 20,
                alignItems: 'center',
                marginBottom: 16,
                shadowColor: Colors.forestGreen,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 12,
                elevation: 4
              }}
            >
              {/* Circular Avatar */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                  borderWidth: 2,
                  borderColor: 'rgba(255, 255, 255, 0.4)'
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800' }}>B</Text>
              </View>

              {/* Employee Full Name */}
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' }}>
                BUDI SANTOSO
              </Text>

              {/* Employee NIK / Account Code */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)', marginBottom: 12 }}>
                EMP-2026-001
              </Text>

              {/* Position Pill Badge */}
              <View
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  borderRadius: 20
                }}
              >
                <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
                  Senior Software Engineer
                </Text>
              </View>
            </View>

            {/* 2. EMPLOYEE DETAILS CARD (White List Card Matching Mockup) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                borderWidth: 1,
                borderColor: Colors.lineBorder,
                paddingHorizontal: 16,
                paddingVertical: 4,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
                elevation: 2
              }}
            >
              {/* Account */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText, fontWeight: '500' }}>Account</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.darkInk }}>EMP-2026-001</Text>
              </View>

              {/* Name */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText, fontWeight: '500' }}>Name</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.darkInk, letterSpacing: 0.3 }}>BUDI SANTOSO</Text>
              </View>

              {/* Employee Code (NIK Number) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText, fontWeight: '500' }}>Employee Code</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.darkInk, fontFamily: 'monospace' }}>332408491203366900</Text>
              </View>

              {/* Department */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText, fontWeight: '500' }}>Department</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.darkInk }}>ENGINEERING</Text>
              </View>

              {/* Penempatan Kantor (Multi-Office Placement) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText, fontWeight: '500' }}>Penempatan Kantor</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#166534', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  Head Office JKT & Bandung Branch
                </Text>
              </View>

              {/* Email */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <Text style={{ fontSize: 13, color: Colors.mutedText, fontWeight: '500' }}>Email</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.darkInk }}>budi.santoso@nusantara.tech</Text>
              </View>
            </View>

            {/* PENGATURAN & BANTUAN APLIKASI (APP SETTINGS, THEME, LANGUAGE & GUIDE) */}
            <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>
              Pengaturan & Bantuan
            </Text>

            <View style={{ backgroundColor: '#FFF', borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.lineBorder, overflow: 'hidden', marginBottom: 24 }}>
              {/* 1. Panduan Penggunaan Aplikasi (View App User Guide) */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <BookOpen size={20} color={Colors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.darkInk }}>Panduan Penggunaan Aplikasi</Text>
                    <Text style={{ fontSize: 11, color: Colors.mutedText, marginTop: 2 }}>Petunjuk absen, pengajuan izin & slip gaji</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.mutedText} />
              </TouchableOpacity>

              {/* 2. Tema Tampilan (Theme Change Dark n Light) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Sun size={20} color={Colors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.darkInk }}>Tema Tampilan</Text>
                    <Text style={{ fontSize: 11, color: Colors.mutedText, marginTop: 2 }}>Mode Terang (Light Mode)</Text>
                  </View>
                </View>
                {/* Non-functional switch pill */}
                <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 20, padding: 3 }}>
                  <View style={{ backgroundColor: Colors.forestGreen, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>Terang</Text>
                  </View>
                  <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 16 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: Colors.mutedText }}>Gelap</Text>
                  </View>
                </View>
              </View>

              {/* 3. Bahasa Aplikasi (Language Change) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Globe size={20} color={Colors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.darkInk }}>Bahasa Aplikasi</Text>
                    <Text style={{ fontSize: 11, color: Colors.mutedText, marginTop: 2 }}>Bahasa Indonesia (Default)</Text>
                  </View>
                </View>
                {/* Non-functional language badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: Colors.lineBorder, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: Colors.darkInk }}>🇮🇩 ID</Text>
                  <ChevronDown size={14} color={Colors.mutedText} />
                </View>
              </View>

              {/* 4. Tentang Aplikasi (About This App) */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Info size={20} color={Colors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.darkInk }}>Tentang HRIS Mobile</Text>
                    <Text style={{ fontSize: 11, color: Colors.mutedText, marginTop: 2 }}>Versi 2.4.0 (Build 2026.08)</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={Colors.mutedText} />
              </TouchableOpacity>
            </View>

            {/* LOGOUT BUTTON WITH LUCIDE ICON */}
            <TouchableOpacity
              style={[styles.btnPrimary, { backgroundColor: Colors.danger, marginBottom: 24, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}
              onPress={() => setIsLoggedIn(false)}
            >
              <LogOut size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.btnPrimaryText}>Keluar dari Akun</Text>
            </TouchableOpacity>
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
      {isCameraModalOpen && (
        <View style={styles.modalOverlayAbsolute}>
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

            {isRequestingPermissions || isCameraRefreshing ? (
              <View style={styles.permissionBox}>
                <ActivityIndicator size="large" color={Colors.forestGreen} style={{ marginBottom: 16 }} />
                <Text style={styles.permissionTitle}>
                  {isCameraRefreshing ? 'Menyiapkan Kamera Live...' : 'Meminta Akses Kamera & GPS HP...'}
                </Text>
                <Text style={styles.permissionSub}>
                  {isCameraRefreshing
                    ? 'Memulihkan stream sensor kamera depan...'
                    : 'Sistem sedang mengaktifkan sensor lokasi presisi dan kamera depan perangkat Anda.'}
                </Text>
              </View>
            ) : !isPhotoCaptured ? (
              <View>
                {/* Live Camera View with CameraView */}
                {cameraPermission?.granted ? (
                  <View style={{ width: '100%', height: 220, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000', position: 'relative' }}>
                    <CameraView
                      key={cameraKey}
                      style={{ width: '100%', height: '100%' }}
                      facing="front"
                      mode="picture"
                      ref={cameraRef}
                      onCameraReady={() => console.log('Camera native preview ready')}
                      onMountError={(e) => console.log('Camera mount error:', e)}
                    />
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between', padding: 14, zIndex: 10 }}>
                      <View style={styles.camTopline}>
                        <View style={styles.badgeLive}>
                          <View style={styles.dotGreen} />
                          <Text style={styles.badgeText}>Live</Text>
                        </View>
                      </View>
                      <View style={[
                        styles.faceGuide,
                        {
                          alignSelf: 'center',
                          borderColor: '#10B981',
                          borderWidth: 2,
                          backgroundColor: 'transparent'
                        }
                      ]} />
                      <Text style={[styles.camHint, { textAlign: 'center', color: '#FFF', fontWeight: '500' }]}>
                        Posisikan wajah Anda di dalam bingkai
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.cameraBoxModal, { backgroundColor: '#FFFFFF', borderColor: Colors.lineBorder, borderWidth: 1, justifyContent: 'center', alignItems: 'center' }]}>
                    <Feather name="camera-off" size={36} color="#64748B" style={{ marginBottom: 10 }} />
                    <Text style={{ color: Colors.darkInk, fontSize: 13, fontWeight: '700', marginBottom: 4 }}>Izin Kamera Belum Aktif</Text>
                    <Text style={{ color: Colors.mutedText, fontSize: 11, textAlign: 'center', marginBottom: 14, paddingHorizontal: 20 }}>
                      Silakan tekan tombol di bawah untuk memberikan akses kamera depan HP.
                    </Text>
                    <TouchableOpacity style={styles.btnPrimary} onPress={requestCameraPermission}>
                      <Text style={styles.btnPrimaryText}>Izinkan Akses Kamera</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* GPS Location info */}
                <View style={styles.gpsCardModal}>
                  <Feather name="map-pin" size={16} color={Colors.forestGreen} style={{ marginRight: 8 }} />
                  <Text style={styles.gpsSubModal}>
                    Lat: {locationData ? locationData.lat.toFixed(4) : '-6.2088'}, Lng: {locationData ? locationData.lng.toFixed(4) : '106.8456'} · Head Office (Radius 35m - Valid)
                  </Text>
                </View>

                {/* Take Photo Action */}
                <TouchableOpacity
                  style={[styles.btnPrimary, { marginTop: 16 }]}
                  onPress={handleTakePicture}
                >
                  <Text style={styles.btnPrimaryText}>Ambil Foto Selfie</Text>
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
                {/* Captured Photo Preview Box - White Card Border Container */}
                <View style={[styles.cameraBoxModal, { backgroundColor: '#FFFFFF', borderColor: Colors.lineBorder, borderWidth: 1, overflow: 'hidden', padding: 0 }]}>
                  {capturedPhotoUri ? (
                    <Image source={{ uri: capturedPhotoUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#10B981', marginBottom: 8 }}>
                        <Feather name="user-check" size={40} color="#10B981" />
                      </View>
                      <Text style={{ color: Colors.darkInk, fontSize: 12, fontWeight: '700' }}>Wajah Terverifikasi</Text>
                    </View>
                  )}
                  <View style={[styles.camTopline, { position: 'absolute', top: 12, left: 12, zIndex: 10 }]}>
                    <View style={[styles.badgeLive, { backgroundColor: '#10B981' }]}>
                      <Feather name="check" size={12} color="#FFF" style={{ marginRight: 4 }} />
                      <Text style={styles.badgeText}>Foto Selfie Tersimpan</Text>
                    </View>
                  </View>
                </View>

                {/* GPS Location info */}
                <View style={styles.gpsCardModal}>
                  <Feather name="map-pin" size={16} color={Colors.forestGreen} style={{ marginRight: 8 }} />
                  <Text style={styles.gpsSubModal}>
                    Lat: {locationData ? locationData.lat.toFixed(4) : '-6.2088'}, Lng: {locationData ? locationData.lng.toFixed(4) : '106.8456'} · Head Office (Radius 35m - Valid)
                  </Text>
                </View>

                {/* 2 Buttons: Retake & Submit */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.btnSecondary, { flex: 1, marginTop: 0 }]}
                    onPress={handleRetakePhoto}
                  >
                    <Text style={styles.btnSecondaryText}>Foto Ulang</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btnPrimary, { flex: 1.4, marginTop: 0, backgroundColor: attendanceType === 'out' ? '#1E3A8A' : Colors.forestGreen }]}
                    onPress={attendanceType === 'in' ? handleClockIn : handleClockOut}
                  >
                    <Text style={styles.btnPrimaryText}>
                      Submit {attendanceType === 'in' ? 'Masuk' : 'Keluar'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      )}

      {/* FULL-SCREEN PHOTO PREVIEW ZOOM MODAL - WHITE CARD DESIGN */}
      <Modal visible={selectedPhoto !== null} animationType="fade" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5 }}>
            <View style={{ width: '100%', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ color: Colors.darkInk, fontSize: 16, fontWeight: '800' }}>{selectedPhoto?.title}</Text>
            </View>

            <View style={{ width: '100%', height: 260, borderRadius: Radius.md, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: Colors.lineBorder }}>
              <Image source={{ uri: selectedPhoto?.url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>

            <View style={{ width: '100%', backgroundColor: '#F8FAFC', padding: 14, borderRadius: Radius.md, marginBottom: 16, borderWidth: 1, borderColor: Colors.lineBorder }}>
              <Text style={{ color: Colors.mutedText, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>DETAIL ABSENSI</Text>
              <Text style={{ color: Colors.darkInk, fontSize: 14, fontWeight: '800', marginTop: 4 }}>{selectedPhoto?.date} · {selectedPhoto?.time}</Text>
              <Text style={{ color: Colors.darkInk, fontSize: 12, marginTop: 4 }}>📍 Lokasi: {selectedPhoto?.loc}</Text>
              <Text style={{ color: '#166534', fontSize: 11, fontWeight: '700', marginTop: 6 }}>✓ GPS & Foto Terverifikasi HRIS (Valid)</Text>
            </View>

            <TouchableOpacity style={[styles.btnPrimary, { width: '100%', backgroundColor: Colors.forestGreen }]} onPress={() => setSelectedPhoto(null)}>
              <Text style={styles.btnPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.creamBg
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 32) + 12 : 16,
    paddingBottom: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lineBorder
  },
  welcomeText: { fontSize: 12, color: Colors.mutedText, textTransform: 'uppercase', fontWeight: '700' },
  nameText: { fontSize: 18, fontWeight: '800', color: Colors.darkInk },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.forestGreen, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  content: { padding: 20, paddingBottom: Platform.OS === 'ios' ? 120 : 110 },
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
  payslipHero: {
    backgroundColor: Colors.forestGreen,
    padding: 20,
    borderRadius: Radius.lg,
    marginBottom: 16,
    shadowColor: Colors.forestGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4
  },
  payslipPeriod: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '700' },
  payslipThpLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10, fontWeight: '800', marginTop: 12, letterSpacing: 0.5 },
  payslipThpAmount: { color: '#FFF', fontSize: 28, fontWeight: '800', marginTop: 4 },
  payslipTagsRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  breakdownCard: { backgroundColor: '#FFF', padding: 16, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.lineBorder },
  breakdownTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  breakdownItem: { fontSize: 13, color: Colors.darkInk },
  breakdownVal: { fontSize: 13, fontWeight: '700', color: Colors.darkInk },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: Colors.lineBorder,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 14
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, color: Colors.mutedText, marginTop: 4 },
  navActiveText: { color: Colors.forestGreen, fontWeight: '700' },
  loginCard: { flex: 1, justifyContent: 'center', padding: 24 },
  logoBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.forestGreen, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  loginTitle: { fontSize: 24, fontWeight: '800', color: Colors.darkInk, marginBottom: 6 },
  loginSub: { fontSize: 13, color: Colors.mutedText, marginBottom: 24 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalOverlayAbsolute: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 20
  },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 36 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.lineBorder },
  modalTitle: { fontSize: 16, fontWeight: '800', color: Colors.darkInk },
  permissionBox: { paddingVertical: 36, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 15, fontWeight: '700', color: Colors.darkInk, marginBottom: 6 },
  permissionSub: { fontSize: 12, color: Colors.mutedText, textAlign: 'center', paddingHorizontal: 20 },
  cameraBoxModal: { height: 220, backgroundColor: '#FFFFFF', borderRadius: Radius.lg, justifyContent: 'space-between', padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder },
  gpsCardModal: { marginTop: 12, backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.lineBorder },
  gpsSubModal: { fontSize: 12, fontWeight: '600', color: Colors.darkInk }
});
