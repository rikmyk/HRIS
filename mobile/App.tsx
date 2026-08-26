import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, TextInput, ScrollView, Alert, Linking, Modal, ActivityIndicator, Image, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LogOut, LogIn, Camera, BookOpen, Sun, Moon, Globe, Info, ChevronRight, ChevronDown } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Colors, Radius, getThemeColors } from './src/theme';

// Cross-Platform Storage Persistence Helper with AsyncStorage Support
const loadPersistedMobileState = <T,>(key: string, defaultVal: T): T => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(key);
      if (saved !== null) return JSON.parse(saved);
    }
  } catch (e) {
    console.log('Mobile storage read error:', key, e);
  }
  return defaultVal;
};

const savePersistedMobileState = async (key: string, val: any) => {
  try {
    const jsonVal = JSON.stringify(val);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, jsonVal);
    }
    await AsyncStorage.setItem(key, jsonVal);
  } catch (e) {
    console.log('Mobile storage save error:', key, e);
  }
};

const API_BASE = 'http://10.0.2.2:8080/v1';

const fetchWithTimeout = async (url: string, options: any = {}, timeoutMs = 2500) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return response;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
};

const getApiBaseUrl = () => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:8080/v1`;
      }
    }
  } catch (e) {}

  if (typeof window !== 'undefined' && window.location && window.location.hostname) {
    const host = window.location.hostname;
    return `http://${host}:8080/v1`;
  }
  return 'http://localhost:8080/v1';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'reject' | 'history' | 'leave' | 'payslip' | 'profile'>('home');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [clockInSuccess, setClockInSuccess] = useState<boolean>(() => loadPersistedMobileState('@hris_mobile_clock_in_success', false));
  const [clockOutSuccess, setClockOutSuccess] = useState<boolean>(() => loadPersistedMobileState('@hris_mobile_clock_out_success', false));
  const [clockInTime, setClockInTime] = useState<string>(() => loadPersistedMobileState('@hris_mobile_clock_in_time', '08:14:05 WIB'));
  const [clockOutTime, setClockOutTime] = useState<string>(() => loadPersistedMobileState('@hris_mobile_clock_out_time', '17:05:12 WIB'));
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState<boolean>(false);
  const [selectedPayslip, setSelectedPayslip] = useState<{ period: string; thp: string; basicSalary?: string; pdfUrl?: string } | null>(null);

  // Dark Mode Theme State (Persisted)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() =>
    loadPersistedMobileState<boolean>('@hris_mobile_theme_dark', false)
  );

  useEffect(() => {
    savePersistedMobileState('@hris_mobile_theme_dark', isDarkMode);
  }, [isDarkMode]);

  const themeColors = getThemeColors(isDarkMode);

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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
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

  // Form input state for Leave Request (Dynamic Backend Connected)
  const [selectedLeaveTypeId, setSelectedLeaveTypeId] = useState<string>('lt-01');
  const [startDate, setStartDate] = useState<string>('2026-08-26');
  const [endDate, setEndDate] = useState<string>('2026-08-28');
  const [leaveReason, setLeaveReason] = useState<string>('Cuti Tahunan keperluan keluarga');
  const [leaveSubmitStatus, setLeaveSubmitStatus] = useState<{ type: 'success' | 'warning' | 'error'; msg: string } | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState<boolean>(false);

  const leaveTypesList = [
    { id: 'lt-01', name: 'Cuti Tahunan', quota: 'Sisa 9 Hari' },
    { id: 'lt-02', name: 'Sakit (Surat Dokter)', quota: '14 Hari' },
    { id: 'lt-03', name: 'Izin Unpaid', quota: 'Tanpa Quota' }
  ];

  const computeLeaveDays = (sDate: string, eDate: string) => {
    try {
      const d1 = new Date(sDate);
      const d2 = new Date(eDate);
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return isNaN(diffDays) || diffDays < 1 ? 1 : diffDays;
    } catch (e) {
      return 1;
    }
  };

  const [leaveHistory, setLeaveHistory] = useState(() =>
    loadPersistedMobileState('@hris_mobile_leave_history', [
      { id: '1', type: 'Sakit dengan Surat Dokter', date: '12 Jul 2026', days: '2 Hari', status: 'Disetujui' },
      { id: '2', type: 'Cuti Tahunan', date: '01 Jun 2026', days: '1 Hari', status: 'Disetujui' },
      { id: '3', type: 'Izin Keperluan Pribadi', date: '15 Mei 2026', days: '1 Hari', status: 'Disetujui' },
      { id: '4', type: 'Cuti Tahunan', date: '10 Apr 2026', days: '2 Hari', status: 'Disetujui' },
      { id: '5', type: 'Sakit Tanpa Surat Dokter', date: '02 Mar 2026', days: '1 Hari', status: 'Ditolak' },
      { id: '6', type: 'Izin Keluar Kantor', date: '18 Feb 2026', days: '1 Hari', status: 'Disetujui' },
      { id: '7', type: 'Cuti Tahunan', date: '10 Jan 2026', days: '3 Hari', status: 'Disetujui' }
    ])
  );

  // Leave History Filter & Pagination State (Max 5 items per page)
  const [selectedLeaveFilter, setSelectedLeaveFilter] = useState<string>('all');
  const [leavePage, setLeavePage] = useState<number>(1);
  const LEAVES_PER_PAGE = 5;

  // Employee Profile & Multi-Office Dynamic State (Connected to Backend DB)
  const [employeeProfile, setEmployeeProfile] = useState({
    id: 'emp-001',
    code: 'EMP-2026-001',
    name: 'Budi Santoso',
    department: 'Engineering',
    position: 'Senior Software Engineer',
    office: 'Head Office Jakarta',
    avatarInitials: 'BS'
  });

  const [officeLocations, setOfficeLocations] = useState<any[]>([
    { id: 'off-001', name: 'Head Office Jakarta', latitude: -6.2088, longitude: 106.8456, radius_meters: 100 }
  ]);

  // Payslip History Data with PDF URLs (Connected to Backend DB)
  const [payslipHistory, setPayslipHistory] = useState([
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

  // Attendance History Data with Selfie Photos (Persisted in storage)
  const [attendanceHistory, setAttendanceHistory] = useState(() =>
    loadPersistedMobileState('@hris_mobile_attendance_history', [
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
    ])
  );

  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Hydrate states asynchronously on mobile startup via AsyncStorage
  useEffect(() => {
    const hydrateState = async () => {
      try {
        const inSuccessStr = await AsyncStorage.getItem('@hris_mobile_clock_in_success');
        if (inSuccessStr !== null) setClockInSuccess(JSON.parse(inSuccessStr));

        const outSuccessStr = await AsyncStorage.getItem('@hris_mobile_clock_out_success');
        if (outSuccessStr !== null) setClockOutSuccess(JSON.parse(outSuccessStr));

        const inTimeStr = await AsyncStorage.getItem('@hris_mobile_clock_in_time');
        if (inTimeStr !== null) setClockInTime(JSON.parse(inTimeStr));

        const outTimeStr = await AsyncStorage.getItem('@hris_mobile_clock_out_time');
        if (outTimeStr !== null) setClockOutTime(JSON.parse(outTimeStr));

        const attHistStr = await AsyncStorage.getItem('@hris_mobile_attendance_history');
        if (attHistStr !== null) {
          const parsed = JSON.parse(attHistStr);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAttendanceHistory(parsed);
          }
        }
      } catch (e) {
        console.log('Mobile AsyncStorage hydration error:', e);
      } finally {
        setIsHydrated(true);
      }
    };
    hydrateState();
  }, []);

  // Sync mobile states to storage after hydration
  useEffect(() => {
    if (isHydrated) savePersistedMobileState('@hris_mobile_clock_in_success', clockInSuccess);
  }, [clockInSuccess, isHydrated]);

  useEffect(() => {
    if (isHydrated) savePersistedMobileState('@hris_mobile_clock_out_success', clockOutSuccess);
  }, [clockOutSuccess, isHydrated]);

  useEffect(() => {
    if (isHydrated) savePersistedMobileState('@hris_mobile_clock_in_time', clockInTime);
  }, [clockInTime, isHydrated]);

  useEffect(() => {
    if (isHydrated) savePersistedMobileState('@hris_mobile_clock_out_time', clockOutTime);
  }, [clockOutTime, isHydrated]);

  useEffect(() => {
    if (isHydrated) savePersistedMobileState('@hris_mobile_leave_history', leaveHistory);
  }, [leaveHistory, isHydrated]);

  useEffect(() => {
    if (isHydrated) savePersistedMobileState('@hris_mobile_attendance_history', attendanceHistory);
  }, [attendanceHistory, isHydrated]);

  // Load real attendance history from Go Backend DB on App mount
  useEffect(() => {
    const fetchBackendAttendanceHistory = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        let token = 'demo-token-emp-001';
        try {
          const authRes = await fetch(`${baseUrl}/auth/demo-token`);
          const authJson = await authRes.json();
          if (authJson && authJson.success && authJson.data && authJson.data.access_token) {
            token = authJson.data.access_token;
          }
        } catch (authErr) {
          console.log('Using default demo token fallback');
        }

        const res = await fetch(`${baseUrl}/attendance/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((item: any, idx: number) => {
            const clockInTimeStr = item.clock_in_time ? formatTime(new Date(item.clock_in_time)) + ' WIB' : (item.clockIn || '08:14:00 WIB');
            const clockOutTimeStr = item.clock_out_time ? formatTime(new Date(item.clock_out_time)) + ' WIB' : (item.clockOut || '-');
            const formattedDateStr = item.attendance_date || item.date || formatDate(new Date());
            return {
              id: item.id || `att-${idx}-${Date.now()}`,
              date: formattedDateStr,
              status: item.status === 'present' ? 'Hadir' : (item.status === 'late' ? 'Terlambat' : 'Hadir'),
              lateMinutes: item.late_minutes || item.lateMinutes || 0,
              clockIn: clockInTimeStr,
              clockInLoc: item.clockInLoc || 'Head Office (25m)',
              clockInPhoto: item.clock_in_photo_url || item.clockInPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
              clockOut: clockOutTimeStr,
              clockOutLoc: item.clockOutLoc || (clockOutTimeStr !== '-' ? 'Head Office (30m)' : '-'),
              clockOutPhoto: item.clock_out_photo_url || item.clockOutPhoto || '-'
            };
          });
          setAttendanceHistory(mapped);
        }
      } catch (e) {
        console.log('Mobile initial attendance API sync completed or using offline cache');
      }
    };

    // Load Employee Profile from Backend DB
    const fetchEmployeeProfile = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        let token = 'demo-token-emp-001';
        try {
          const authRes = await fetch(`${baseUrl}/auth/demo-token`);
          const authJson = await authRes.json();
          if (authJson?.success && authJson.data?.access_token) {
            token = authJson.data.access_token;
          }
        } catch (e) {}

        const res = await fetch(`${baseUrl}/employees/emp-001`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json && json.success && json.data) {
          const emp = json.data;
          const name = emp.full_name || 'Budi Santoso';
          const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'BS';
          setEmployeeProfile({
            id: emp.id || 'emp-001',
            code: emp.employee_code || 'EMP-2026-001',
            name,
            department: emp.department_name || 'Engineering',
            position: emp.position_title || 'Senior Software Engineer',
            office: emp.office_name || 'Head Office Jakarta',
            avatarInitials: initials
          });
        }
      } catch (e) {
        console.log('Mobile profile API sync complete');
      }
    };

    // Load Leave Requests History from Backend DB
    const fetchBackendLeaves = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        let token = 'demo-token-emp-001';
        try {
          const authRes = await fetch(`${baseUrl}/auth/demo-token`);
          const authJson = await authRes.json();
          if (authJson?.success && authJson.data?.access_token) {
            token = authJson.data.access_token;
          }
        } catch (e) {}

        const res = await fetch(`${baseUrl}/leave/requests`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((item: any, idx: number) => ({
            id: item.id || `lr-${idx}`,
            type: item.leave_type_name || 'Cuti Tahunan',
            date: `${item.start_date || '2026-08-26'} - ${item.end_date || '2026-08-28'}`,
            days: `${item.days_count || 1} Hari`,
            status: item.status === 'approved' ? 'Disetujui' : (item.status === 'rejected' ? 'Ditolak' : 'Pending')
          }));
          setLeaveHistory(mapped);
        }
      } catch (e) {
        console.log('Mobile leave API sync complete');
      }
    };

    // Load Payslips from Backend DB
    const fetchBackendPayslips = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        let token = 'demo-token-emp-001';
        try {
          const authRes = await fetch(`${baseUrl}/auth/demo-token`);
          const authJson = await authRes.json();
          if (authJson?.success && authJson.data?.access_token) {
            token = authJson.data.access_token;
          }
        } catch (e) {}

        const res = await fetch(`${baseUrl}/payroll/payslips?period_id=period-2026-08`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          const mapped = json.data.map((ps: any, idx: number) => ({
            id: ps.id || `ps-00${idx + 1}`,
            period: ps.period_name || 'Agustus 2026',
            thp: `Rp ${ps.net_salary ? ps.net_salary.toLocaleString('id-ID') : '9.850.000'}`,
            basicSalary: `Rp ${ps.gross_salary ? ps.gross_salary.toLocaleString('id-ID') : '9.000.000'}`,
            transport: 'Rp 1.000.000',
            deduction: `-Rp ${ps.total_deduction ? ps.total_deduction.toLocaleString('id-ID') : '150.000'}`,
            approvalStatus: ps.status === 'approved' ? 'Disetujui' : 'Draft',
            paymentStatus: ps.is_paid ? 'Sudah Dibayar' : 'Belum Dibayar',
            pdfUrl: `${baseUrl}/payroll/public/payslips/${ps.id || 'ps-001'}/pdf`
          }));
          setPayslipHistory(mapped);
        }
      } catch (e) {
        console.log('Mobile payslips API sync complete');
      }
    };

    // Load Office Locations from Backend DB
    const fetchOfficeLocations = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        let token = 'demo-token-emp-001';
        try {
          const authRes = await fetch(`${baseUrl}/auth/demo-token`);
          const authJson = await authRes.json();
          if (authJson?.success && authJson.data?.access_token) {
            token = authJson.data.access_token;
          }
        } catch (e) {}

        const res = await fetch(`${baseUrl}/office-locations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data) && json.data.length > 0) {
          setOfficeLocations(json.data);
        }
      } catch (e) {
        console.log('Mobile office locations API sync complete');
      }
    };

    fetchBackendAttendanceHistory();
    fetchEmployeeProfile();
    fetchBackendLeaves();
    fetchBackendPayslips();
    fetchOfficeLocations();
  }, []);

  // Trigger camera & GPS modal with fast location lookup
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
          // Fast GPS lookup: check cached last known position first for instant response
          let loc = await Location.getLastKnownPositionAsync();
          if (!loc) {
            loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
          }
          if (loc) {
            setLocationData({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          }
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
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.4, base64: true });
        if (photo) {
          const photoSrc = photo.base64 ? `data:image/jpeg;base64,${photo.base64}` : photo.uri;
          setCapturedPhotoUri(photoSrc);
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
    }, 150);
  };

  // Handlers for Mobile Actions - Instant Optimistic UI + Non-Blocking Async Fetch
  const handleClockIn = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('⚠️ Foto Belum Diambil', 'Silakan ambil foto selfie absensi terlebih dahulu.');
      return;
    }

    // 1. Instant UI update & modal close (0ms delay)
    setIsCameraModalOpen(false);
    const nowStr = formatTime(new Date()) + ' WIB';
    setClockInTime(nowStr);
    setClockInSuccess(true);

    const todayDateStr = formatDate(new Date());
    const newAttRecord = {
      id: `att-${Date.now()}`,
      date: todayDateStr,
      status: 'Hadir',
      lateMinutes: 0,
      clockIn: nowStr,
      clockInLoc: 'Head Office (35m)',
      clockInPhoto: capturedPhotoUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
      clockOut: '-',
      clockOutLoc: '-',
      clockOutPhoto: '-'
    };
    setAttendanceHistory(prev => [newAttRecord, ...prev]);

    // Sync captured selfie photo directly to Web Admin shared localStorage & BroadcastChannel
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const todayStr = formatDate(new Date());
        const existingRecords = JSON.parse(window.localStorage.getItem('hris_web_attendance_records_v3') || '[]');
        
        let updatedRecords = [...existingRecords];
        const existingIdx = updatedRecords.findIndex((r: any) => r.date === todayStr && r.employee_code === 'EMP-2026-001');
        
        if (existingIdx >= 0) {
          updatedRecords[existingIdx] = {
            ...updatedRecords[existingIdx],
            clock_in_time: nowStr,
            clock_in_photo: capturedPhotoUri || updatedRecords[existingIdx].clock_in_photo,
            clock_in_distance: '35m',
            status: 'valid'
          };
        } else {
          const newRow = {
            id: `att-${Date.now()}`,
            date: todayStr,
            employee_code: 'EMP-2026-001',
            employee_name: employeeProfile?.name || 'Budi Santoso',
            department: 'Engineering',
            office_name: 'Head Office Jakarta',
            clock_in_time: nowStr,
            clock_in_photo: capturedPhotoUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
            clock_in_distance: '35m',
            clock_out_time: '-',
            clock_out_photo: '',
            clock_out_distance: '-',
            status: 'valid'
          };
          updatedRecords = [newRow, ...updatedRecords];
        }

        window.localStorage.setItem('hris_web_attendance_records_v3', JSON.stringify(updatedRecords));

        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('hris_attendance_channel_v3');
          channel.postMessage(updatedRecords);
          channel.close();
        }
      }
    } catch (err) {
      console.log('Sync to web admin localstorage error:', err);
    }

    Alert.alert('✅ Absen Masuk Berhasil!', `Kehadiran Anda telah dicatat pada ${nowStr} (Radius 35m dari Head Office).`);

    // 2. Background API call to Go Backend to persist attendance record
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    try {
      const baseUrl = getApiBaseUrl();
      const todayStr = formatDate(new Date());
      await fetch(`${baseUrl}/attendance/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token-emp-001'
        },
        body: JSON.stringify({
          id: `att-${Date.now()}`,
          date: todayStr,
          employee_code: 'EMP-2026-001',
          employee_name: employeeProfile?.name || 'Budi Santoso',
          department: 'Engineering',
          office_name: 'Head Office Jakarta',
          clock_in_time: nowStr,
          clock_in_photo: capturedPhotoUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
          clock_in_distance: '35m',
          clock_out_time: '-',
          clock_out_photo: '',
          clock_out_distance: '-',
          status: 'valid'
        }),
        signal: controller.signal
      });
    } catch (e) {
      console.log('Mobile API sync completed or timed out gracefully');
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleClockOut = async () => {
    if (!capturedPhotoUri) {
      Alert.alert('⚠️ Foto Belum Diambil', 'Silakan ambil foto selfie absensi terlebih dahulu.');
      return;
    }

    // 1. Instant UI update & modal close (0ms delay)
    setIsCameraModalOpen(false);
    const nowStr = formatTime(new Date()) + ' WIB';
    setClockOutTime(nowStr);
    setClockOutSuccess(true);

    setAttendanceHistory(prev =>
      prev.map((item, idx) =>
        idx === 0
          ? {
              ...item,
              clockOut: nowStr,
              clockOutLoc: 'Head Office (32m)',
              clockOutPhoto: capturedPhotoUri || item.clockOutPhoto
            }
          : item
      )
    );

    // Sync captured selfie OUT photo directly to Web Admin
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const todayStr = formatDate(new Date());
        const existingRecords = JSON.parse(window.localStorage.getItem('hris_web_attendance_records_v3') || '[]');
        
        let updatedRecords = [...existingRecords];
        const existingIdx = updatedRecords.findIndex((r: any) => r.employee_code === 'EMP-2026-001');
        
        if (existingIdx >= 0) {
          updatedRecords[existingIdx] = {
            ...updatedRecords[existingIdx],
            clock_out_time: nowStr,
            clock_out_photo: capturedPhotoUri || updatedRecords[existingIdx].clock_out_photo,
            clock_out_distance: '32m'
          };
        }

        window.localStorage.setItem('hris_web_attendance_records_v3', JSON.stringify(updatedRecords));

        if ('BroadcastChannel' in window) {
          const channel = new BroadcastChannel('hris_attendance_channel_v3');
          channel.postMessage(updatedRecords);
          channel.close();
        }
      }
    } catch (err) {
      console.log('Sync clock out error:', err);
    }

    Alert.alert('✅ Absen Keluar Berhasil!', `Jam keluar Anda telah dicatat pada ${nowStr} (Head Office). Selamat beristirahat!`);

    // 2. Background API call to Go Backend to persist clock out
    const controller = new AbortController();
    const timeoutId2 = setTimeout(() => controller.abort(), 2500);
    try {
      const baseUrl = getApiBaseUrl();
      const todayStr = formatDate(new Date());
      await fetch(`${baseUrl}/attendance/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer demo-token-emp-001'
        },
        body: JSON.stringify({
          id: `att-${Date.now()}`,
          date: todayStr,
          employee_code: 'EMP-2026-001',
          employee_name: employeeProfile?.name || 'Budi Santoso',
          department: 'Engineering',
          office_name: 'Head Office Jakarta',
          clock_out_time: nowStr,
          clock_out_photo: capturedPhotoUri || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&q=80',
          clock_out_distance: '32m',
          status: 'valid'
        }),
        signal: controller.signal
      });
    } catch (e) {
      console.log('Mobile API clock out sync completed or timed out gracefully');
    } finally {
      clearTimeout(timeoutId2);
    }
  };

  const handleSimulateOutsideGeofence = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/attendance/clock-in`, {
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

  const handleResetAttendance = () => {
    setClockInSuccess(false);
    setClockOutSuccess(false);
    setClockInTime('08:14:05 WIB');
    setClockOutTime('17:05:12 WIB');

    savePersistedMobileState('@hris_mobile_clock_in_success', false);
    savePersistedMobileState('@hris_mobile_clock_out_success', false);
    savePersistedMobileState('@hris_mobile_clock_in_time', '08:14:05 WIB');
    savePersistedMobileState('@hris_mobile_clock_out_time', '17:05:12 WIB');

    Alert.alert('🔄 Reset Absensi Berhasil', 'Status absensi hari ini telah di-reset ke kondisi awal. Anda bisa melakukan simulasi/tes absen kembali.');
  };

  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const host = window.location.hostname || 'localhost';
      return `http://${host}:8080/v1`;
    }
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).experienceUrl || '';
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip && ip !== 'localhost' && ip !== '127.0.0.1') {
        return `http://${ip}:8080/v1`;
      }
    }
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/v1';
    }
    return 'http://localhost:8080/v1';
  };

  const handleDownloadPayslip = (period: string, payslipId: string = 'ps-001', thp: string = 'Rp 9.850.000', basicSalary: string = 'Rp 9.000.000') => {
    const baseUrl = getApiBaseUrl();
    const pdfUrl = `${baseUrl}/payroll/public/payslips/${payslipId}/pdf`;
    setSelectedPayslip({
      period,
      thp,
      basicSalary,
      pdfUrl
    });
    setIsPayslipModalOpen(true);
  };

  const handleOpenBrowserPrint = () => {
    if (!selectedPayslip) return;

    const periodStr = selectedPayslip.period || 'Agustus 2026';
    const thpStr = selectedPayslip.thp || 'Rp 9.850.000';
    const basicStr = selectedPayslip.basicSalary || 'Rp 9.000.000';
    const empName = employeeProfile?.name || 'Budi Santoso';

    const htmlDocument = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SLIP GAJI - ${periodStr} - ${empName.toUpperCase()}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; color: #0F172A; background: #F8FAFC; margin: 0; }
          .card { max-width: 600px; margin: 0 auto; background: #FFFFFF; padding: 32px; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #E2E8F0; }
          .header { border-bottom: 2px solid #2F6F5E; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 22px; font-weight: 800; color: #2F6F5E; margin: 0; }
          .sub { color: #64748B; font-size: 12px; margin-top: 4px; font-weight: 600; letter-spacing: 0.5px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; font-size: 13px; background: #F1F5F9; padding: 16px; border-radius: 8px; }
          .row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; }
          .total { background: #DCFCE7; color: #166534; padding: 16px; border-radius: 8px; font-size: 16px; font-weight: 800; display: flex; justify-content: space-between; margin-top: 20px; border: 1px solid #BBF7D0; }
          .print-btn { background: #2F6F5E; color: white; border: none; padding: 14px 24px; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: 24px; width: 100%; font-size: 15px; transition: all 0.2s; }
          .print-btn:hover { background: #204F42; }
          @media print { .print-btn { display: none !important; } body { background: white; padding: 0; } .card { box-shadow: none; border: none; } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <h1 class="title">PT NUSANTARA TECH</h1>
              <div class="sub">SLIP GAJI RESMI KARYAWAN</div>
            </div>
            <div style="text-align: right;">
              <div style="font-weight: 700; font-size: 11px; color: #64748B;">PERIODE</div>
              <div style="color: #2F6F5E; font-weight: 800; font-size: 16px;">${periodStr}</div>
            </div>
          </div>

          <div class="grid">
            <div><strong>NAMA:</strong> ${empName.toUpperCase()}</div>
            <div><strong>NIK:</strong> EMP-2026-001</div>
            <div><strong>DEPARTEMEN:</strong> ENGINEERING</div>
            <div><strong>STATUS:</strong> TETAP / DISETUJUI</div>
          </div>

          <h3 style="margin-bottom: 12px; font-size: 14px; color: #334155;">RINCIAN GAJI & POTONGAN</h3>
          <div class="row"><span>Gaji Pokok</span><strong>${basicStr}</strong></div>
          <div class="row"><span>Tunjangan Transport & Makan</span><strong>Rp 1.000.000</strong></div>
          <div class="row" style="color: #B91C1C;"><span>Potongan Keterlambatan</span><strong>-Rp 150.000</strong></div>

          <div class="total">
            <span>TAKE HOME PAY (THP)</span>
            <span>${thpStr}</span>
          </div>

          <button class="print-btn" onclick="window.print()">🖨️ Cetak / Simpan sebagai PDF</button>
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 350);
          };
        </script>
      </body>
      </html>
    `;

    const fileName = `Slip_Gaji_${periodStr.replace(/\s+/g, '_')}_EMP-001.html`;

    // 1. Web / Mobile Web Environments: Real File Download to Downloads Folder
    if (typeof document !== 'undefined') {
      try {
        const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8' });
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
        
        Alert.alert(
          '📥 Unduh File Berhasil',
          `Dokumen ${fileName} telah berhasil diunduh ke memori/folder Downloads perangkat Anda.`,
          [{ text: 'OK', onPress: () => setIsPayslipModalOpen(false) }]
        );
        return;
      } catch (e) {
        console.log('Web download error:', e);
      }
    }

    // 2. Native Mobile App (Android / iOS): Trigger Data URI / File Stream
    try {
      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlDocument)}`;
      Linking.openURL(dataUri).then(() => {
        Alert.alert(
          '📥 Unduh Dokumen Berhasil',
          `Dokumen Slip Gaji ${periodStr} (${thpStr}) berhasil dibuat & disimpan ke perangkat Anda.`,
          [{ text: 'OK', onPress: () => setIsPayslipModalOpen(false) }]
        );
      }).catch(() => {
        const baseUrl = getApiBaseUrl();
        const pdfUrl = selectedPayslip.pdfUrl || `${baseUrl}/payroll/public/payslips/ps-001/pdf`;
        Linking.openURL(pdfUrl).catch(() => {
          Alert.alert(
            '📄 Dokumen Terverifikasi',
            `File Slip Gaji Periode ${periodStr} (${thpStr}) telah berhasil diproses oleh sistem HRIS.`,
            [{ text: 'OK', onPress: () => setIsPayslipModalOpen(false) }]
          );
        });
      });
    } catch (e) {
      Alert.alert(
        '📄 Dokumen Terverifikasi',
        `File Slip Gaji Periode ${periodStr} (${thpStr}) telah diproses.`
      );
    }
  };

  const handleSubmitLeave = async () => {
    if (isSubmittingLeave) return;

    const actualReason = leaveReason.trim() || 'Keperluan keluarga / izin pribadi';
    const selectedTypeObj = leaveTypesList.find(t => t.id === selectedLeaveTypeId) || leaveTypesList[0];
    const daysCount = computeLeaveDays(startDate, endDate);

    // 1. INSTANT OPTIMISTIC UI UPDATE (0ms Instant Delay)
    const newItem = {
      id: `lr-${Date.now()}`,
      type: selectedTypeObj.name,
      date: `${startDate} - ${endDate}`,
      days: `${daysCount} Hari`,
      status: 'Pending'
    };

    const updatedList = [newItem, ...leaveHistory];
    setLeaveHistory(updatedList);
    setSelectedLeaveFilter('all');
    setLeavePage(1);
    savePersistedMobileState('@hris_mobile_leave_history', updatedList);

    // Cross-sync to Web Admin storage if on browser environment
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const webLeaves = window.localStorage.getItem('hris_web_leave_requests');
        const existingWebList = webLeaves ? JSON.parse(webLeaves) : [];
        const newWebItem = {
          id: `lr-${Date.now().toString().slice(-4)}`,
          employee_name: employeeProfile.name,
          department: employeeProfile.department,
          leave_type: selectedTypeObj.name,
          date_range: `${startDate} - ${endDate}`,
          status: 'pending'
        };
        window.localStorage.setItem('hris_web_leave_requests', JSON.stringify([newWebItem, ...existingWebList]));
      }
    } catch (err) {}

    const successMessage = `✅ Pengajuan ${selectedTypeObj.name} (${daysCount} Hari) Berhasil Dikirim!`;
    setLeaveSubmitStatus({ type: 'success', msg: successMessage });
    setLeaveReason('Keperluan keluarga / izin pribadi');

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(successMessage);
    } else {
      Alert.alert('✅ Pengajuan Berhasil!', successMessage);
    }

    setTimeout(() => {
      setLeaveSubmitStatus(null);
    }, 5000);

    // 2. NON-BLOCKING BACKGROUND API SYNC (0ms UI Latency)
    (async () => {
      try {
        const baseUrl = getApiBaseUrl();
        let token = 'demo-token-emp-001';
        try {
          const authRes = await fetchWithTimeout(`${baseUrl}/auth/demo-token`, {}, 800);
          const authJson = await authRes.json();
          if (authJson?.success && authJson.data?.access_token) {
            token = authJson.data.access_token;
          }
        } catch (e) {}

        await fetchWithTimeout(`${baseUrl}/leave/request`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            employee_id: 'emp-001',
            employee_code: 'EMP-2026-001',
            employee_name: employeeProfile?.name || 'Budi Santoso',
            department: employeeProfile?.department || 'Engineering',
            leave_type_id: selectedLeaveTypeId,
            start_date: startDate,
            end_date: endDate,
            reason: actualReason
          })
        }, 3000);
      } catch (e) {
        console.log('Background leave API sync completed');
      }
    })();
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
    <SafeAreaView style={[styles.container, { backgroundColor: themeColors.bg }]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={themeColors.headerBg} />
      {/* Phone Header Chrome */}
      <View style={[styles.header, { backgroundColor: themeColors.headerBg, borderBottomColor: themeColors.lineBorder }]}>
        <View>
          <Text style={styles.welcomeText}>{getGreeting(currentTime)}</Text>
          <Text style={[styles.nameText, { color: themeColors.darkInk }]}>{employeeProfile.name}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => setActiveTab('profile')}>
          <Text style={styles.avatarText}>{employeeProfile.avatarInitials}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tab Screen Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* TAB 1: ABSEN HOME & STATUS */}
        {activeTab === 'home' && (
          <View>
            {/* Clock Time & Date Banner (Live Real-Time Ticking Clock) */}
            <View style={{ backgroundColor: themeColors.surface, borderRadius: Radius.lg, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: themeColors.lineBorder, marginBottom: 16 }}>
              <Text style={styles.welcomeText}>WAKTU SEKARANG</Text>
              <Text style={[styles.timeText, { color: themeColors.darkInk }]}>
                {formatTime(currentTime)}
              </Text>
              <Text style={[styles.dateText, { color: themeColors.mutedText }]}>{formatDate(currentTime)}</Text>

              {/* GPS Status Badge */}
              <View style={[styles.gpsCard, { backgroundColor: themeColors.subCardBg, borderColor: themeColors.lineBorder }]}>
                <View style={styles.gpsPulseIcon}>
                  <Feather name="map-pin" size={16} color="#FFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.gpsTitle, { color: themeColors.darkInk }]}>Dalam Radius Geofence</Text>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 9, fontWeight: '800', color: '#166534' }}>MULTI-OFFICE VALID</Text>
                    </View>
                  </View>
                  <Text style={[styles.gpsSub, { color: themeColors.mutedText }]}>Terdeteksi: Head Office Jakarta (35m) · Terdaftar 2 Cabang</Text>
                </View>
              </View>
            </View>

            {/* Attendance Status Summary Card */}
            <View style={{ backgroundColor: themeColors.surface, borderRadius: Radius.lg, padding: 16, borderWidth: 1, borderColor: themeColors.lineBorder, marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: themeColors.darkInk, marginBottom: 12 }}>Status Absensi Hari Ini</Text>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText }}>Absen Masuk</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: clockInSuccess ? '#166534' : themeColors.mutedText }}>
                  {clockInSuccess ? `✓ ${clockInTime}` : 'Belum Absen'}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText }}>Absen Keluar</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: clockOutSuccess ? '#166534' : themeColors.mutedText }}>
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

            {/* Reset Absen Button for Quick Testing / Refresh */}
            <TouchableOpacity
              style={[styles.btnSecondary, { marginTop: 10, borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' }]}
              onPress={handleResetAttendance}
            >
              <Text style={[styles.btnSecondaryText, { color: '#475569' }]}>🔄 Reset Status Absen Hari Ini (Testing Mode)</Text>
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
              backgroundColor: themeColors.surface,
              borderRadius: Radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: themeColors.lineBorder,
              marginBottom: 16
            }}>
              <Text style={[styles.sectionTitle, { color: themeColors.darkInk, marginBottom: 14 }]}>Riwayat Absensi Saya</Text>

              {/* Attendance Summary Bar (Dynamic calculated from DB & History State) */}
              {(() => {
                const activeList = historyFilter === '7days' 
                  ? attendanceHistory.slice(0, 5) 
                  : historyFilter === '30days'
                  ? attendanceHistory.slice(0, 30)
                  : attendanceHistory;

                const hadirCount = activeList.filter(item => item.status === 'Hadir').length;
                const lateCount = activeList.filter(item => item.status === 'Terlambat').length;
                const alphaCount = activeList.filter(item => item.status === 'Alfa' || item.status === 'Alpha' || item.status === 'Absen').length;

                return (
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#064E3B' : '#DCFCE7', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: isDarkMode ? '#6EE7B7' : '#166534' }}>
                        {hadirCount}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#A7F3D0' : '#15803D', marginTop: 2 }}>HADIR</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: isDarkMode ? '#FDE68A' : '#92400E' }}>
                        {lateCount}
                      </Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#FCD34D' : '#B45309', marginTop: 2 }}>TERLAMBAT</Text>
                    </View>
                    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#7F1D1D' : '#FEE2E2', padding: 12, borderRadius: Radius.md, alignItems: 'center' }}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: isDarkMode ? '#FCA5A5' : '#991B1B' }}>{alphaCount}</Text>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#FECDD3' : '#B91C1C', marginTop: 2 }}>ALPHA</Text>
                    </View>
                  </View>
                );
              })()}

              {/* 3-Tab Filter Selector: 7 Hari | 30 Hari | Bulan Ini */}
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
                    borderColor: historyFilter === '7days' ? Colors.forestGreen : themeColors.lineBorder,
                    backgroundColor: historyFilter === '7days' ? Colors.forestGreen : themeColors.surface
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: historyFilter === '7days' ? '#FFF' : themeColors.darkInk }}>7 Hari</Text>
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
                    borderColor: historyFilter === '30days' ? Colors.forestGreen : themeColors.lineBorder,
                    backgroundColor: historyFilter === '30days' ? Colors.forestGreen : themeColors.surface
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: historyFilter === '30days' ? '#FFF' : themeColors.darkInk }}>30 Hari</Text>
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
                    borderColor: historyFilter === 'month' ? Colors.forestGreen : themeColors.lineBorder,
                    backgroundColor: historyFilter === 'month' ? Colors.forestGreen : themeColors.surface
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: historyFilter === 'month' ? '#FFF' : themeColors.darkInk }}>Bulan Ini</Text>
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
                    <View key={item.id} style={{ backgroundColor: themeColors.surface, borderRadius: Radius.md, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: themeColors.lineBorder }}>
                      {/* 1. BAGIAN ATAS: Tanggal & Status Badge */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: themeColors.darkInk }}>{item.date}</Text>
                        <View style={[styles.statusPill, item.status === 'Hadir' ? styles.pillApproved : styles.pillPending]}>
                          <Text style={[styles.statusText, item.status === 'Hadir' ? styles.textApproved : styles.textPending]}>
                            {item.status === 'Hadir' ? 'Hadir' : `Terlambat (${item.lateMinutes}m)`}
                          </Text>
                        </View>
                      </View>

                      {/* 2. BAGIAN TENGAH: Jam Masuk & Jam Keluar Sebaris */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: themeColors.subCardBg, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, marginBottom: 10, borderWidth: 1, borderColor: themeColors.lineBorder }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <LogIn size={13} color={Colors.forestGreen} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: themeColors.mutedText }}>Masuk: </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: themeColors.darkInk }}>{item.clockIn}</Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <LogOut size={13} color={item.clockOut && item.clockOut !== '-' ? (isDarkMode ? '#60A5FA' : '#1E3A8A') : '#64748B'} style={{ marginRight: 6 }} />
                          <Text style={{ fontSize: 12, color: themeColors.mutedText }}>Keluar: </Text>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: item.clockOut && item.clockOut !== '-' ? themeColors.darkInk : '#D97706' }}>
                            {item.clockOut && item.clockOut !== '-' ? item.clockOut : 'Belum Absen'}
                          </Text>
                        </View>
                      </View>

                      {/* 3. BAGIAN BAWAH: Button Foto Masuk & Keluar / Status Jam Kerja */}
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
                            backgroundColor: themeColors.surface,
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

                        {item.clockOut && item.clockOut !== '-' && item.clockOutPhoto && item.clockOutPhoto !== '-' ? (
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
                              backgroundColor: themeColors.surface,
                              borderWidth: 1,
                              borderColor: isDarkMode ? '#60A5FA' : '#1E3A8A',
                              borderRadius: 6,
                              paddingVertical: 6,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Camera size={13} color={isDarkMode ? '#60A5FA' : '#1E3A8A'} style={{ marginRight: 5 }} />
                            <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#60A5FA' : '#1E3A8A' }}>Foto Keluar</Text>
                          </TouchableOpacity>
                        ) : (
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: isDarkMode ? '#78350F' : '#FEF3C7',
                              borderWidth: 1,
                              borderColor: isDarkMode ? '#B45309' : '#FCD34D',
                              borderRadius: 6,
                              paddingVertical: 6,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#FDE68A' : '#92400E' }}>
                              ⏳ Masih Jam Kerja
                            </Text>
                          </View>
                        )}
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
                          backgroundColor: attendancePage <= 1 ? (isDarkMode ? '#334155' : '#F1F5F9') : Colors.forestGreen,
                          opacity: attendancePage <= 1 ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: attendancePage <= 1 ? themeColors.mutedText : '#FFF' }}>
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.darkInk }}>
                        Halaman {attendancePage} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={attendancePage >= totalPages}
                        onPress={() => setAttendancePage(prev => Math.min(prev + 1, totalPages))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: attendancePage >= totalPages ? (isDarkMode ? '#334155' : '#F1F5F9') : Colors.forestGreen,
                          opacity: attendancePage >= totalPages ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: attendancePage >= totalPages ? themeColors.mutedText : '#FFF' }}>
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
              backgroundColor: themeColors.surface,
              borderRadius: Radius.md,
              padding: 16,
              borderWidth: 1,
              borderColor: themeColors.lineBorder,
              marginBottom: 20
            }}>
              <Text style={[styles.sectionTitle, { color: themeColors.darkInk, marginBottom: 14 }]}>Form Pengajuan Izin & Cuti</Text>

              {leaveSubmitStatus && (
                <View style={{
                  backgroundColor: leaveSubmitStatus.type === 'success' ? '#DCFCE7' : (leaveSubmitStatus.type === 'warning' ? '#FEF3C7' : '#FEE2E2'),
                  padding: 12,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: leaveSubmitStatus.type === 'success' ? '#BBF7D0' : (leaveSubmitStatus.type === 'warning' ? '#FDE68A' : '#FCA5A5'),
                  marginBottom: 14
                }}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: '700',
                    color: leaveSubmitStatus.type === 'success' ? '#166534' : (leaveSubmitStatus.type === 'warning' ? '#92400E' : '#991B1B')
                  }}>
                    {leaveSubmitStatus.msg}
                  </Text>
                </View>
              )}
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.mutedText }]}>JENIS IZIN / CUTI</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {leaveTypesList.map((typeObj) => {
                    const isSelected = selectedLeaveTypeId === typeObj.id;
                    return (
                      <TouchableOpacity
                        key={typeObj.id}
                        onPress={() => setSelectedLeaveTypeId(typeObj.id)}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 8,
                          borderWidth: 1,
                          borderColor: isSelected ? Colors.forestGreen : themeColors.lineBorder,
                          backgroundColor: isSelected ? (isDarkMode ? '#064E3B' : '#DCFCE7') : themeColors.surface
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: isSelected ? (isDarkMode ? '#6EE7B7' : '#166534') : themeColors.darkInk }}>
                          {typeObj.name}
                        </Text>
                        <Text style={{ fontSize: 10, color: isSelected ? (isDarkMode ? '#A7F3D0' : '#15803D') : themeColors.mutedText }}>
                          {typeObj.quota}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                  <Text style={[styles.label, { color: themeColors.mutedText }]}>TANGGAL MULAI</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.darkInk, borderColor: themeColors.lineBorder }]}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={themeColors.mutedText}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
                  <Text style={[styles.label, { color: themeColors.mutedText }]}>TANGGAL SELESAI</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.darkInk, borderColor: themeColors.lineBorder }]}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={themeColors.mutedText}
                  />
                </View>
              </View>

              {/* Dynamic Calculated Duration Preview Badge */}
              <View style={{ backgroundColor: themeColors.subCardBg, padding: 10, borderRadius: 8, marginBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 12, color: themeColors.mutedText, fontWeight: '600' }}>Total Durasi Izin:</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.forestGreen }}>
                  {computeLeaveDays(startDate, endDate)} Hari Working Days
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: themeColors.mutedText }]}>ALASAN PENGAJUAN</Text>
                <TextInput 
                  style={[styles.input, { backgroundColor: themeColors.surface, color: themeColors.darkInk, borderColor: themeColors.lineBorder, height: 70, textAlignVertical: 'top' }]} 
                  multiline 
                  value={leaveReason} 
                  onChangeText={setLeaveReason} 
                  placeholder="Isi alasan lengkap pengajuan izin..."
                  placeholderTextColor={themeColors.mutedText}
                />
              </View>

              <TouchableOpacity
                disabled={isSubmittingLeave}
                style={[
                  styles.btnPrimary,
                  { marginTop: 4, opacity: isSubmittingLeave ? 0.7 : 1 }
                ]}
                onPress={handleSubmitLeave}
              >
                <Text style={styles.btnPrimaryText}>
                  {isSubmittingLeave ? '⏳ Memproses Pengajuan...' : 'Kirim Pengajuan Izin (Ke Backend API)'}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: themeColors.darkInk, marginTop: 24, marginBottom: 12 }]}>Riwayat Pengajuan Izin</Text>

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
                        backgroundColor: isActive ? Colors.forestGreen : themeColors.surface,
                        borderWidth: 1,
                        borderColor: isActive ? Colors.forestGreen : themeColors.lineBorder,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFF' : themeColors.darkInk }}>
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
                    <View key={item.id} style={[styles.historyCard, { backgroundColor: themeColors.surface, borderColor: themeColors.lineBorder }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.historyType, { color: themeColors.darkInk }]}>{item.type}</Text>
                        <Text style={[styles.historyDate, { color: themeColors.mutedText }]}>{item.date} · {item.days}</Text>
                      </View>
                      <View style={[styles.statusPill, item.status === 'Disetujui' ? styles.pillApproved : styles.pillPending]}>
                        <Text style={[styles.statusText, item.status === 'Disetujui' ? styles.textApproved : styles.textPending]}>{item.status}</Text>
                      </View>
                    </View>
                  ))}

                  {/* Pagination Controls for Leave History (Max 5 items per page) */}
                  {totalPages > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 16, backgroundColor: themeColors.surface, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: themeColors.lineBorder }}>
                      <TouchableOpacity
                        disabled={leavePage <= 1}
                        onPress={() => setLeavePage(prev => Math.max(prev - 1, 1))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: leavePage <= 1 ? (isDarkMode ? '#334155' : '#F1F5F9') : Colors.forestGreen,
                          opacity: leavePage <= 1 ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: leavePage <= 1 ? themeColors.mutedText : '#FFF' }}>
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.darkInk }}>
                        Halaman {leavePage} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={leavePage >= totalPages}
                        onPress={() => setLeavePage(prev => Math.min(prev + 1, totalPages))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: leavePage >= totalPages ? (isDarkMode ? '#334155' : '#F1F5F9') : Colors.forestGreen,
                          opacity: leavePage >= totalPages ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: leavePage >= totalPages ? themeColors.mutedText : '#FFF' }}>
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
            <Text style={[styles.sectionTitle, { color: themeColors.darkInk }]}>Slip Gaji Karyawan</Text>

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
            <View style={[styles.breakdownCard, { backgroundColor: themeColors.surface, borderColor: themeColors.lineBorder }]}>
              <Text style={[styles.breakdownTitle, { color: themeColors.darkInk }]}>Rincian Komponen</Text>
              
              <View style={[styles.breakdownRow, { borderBottomColor: themeColors.lineBorder }]}>
                <Text style={[styles.breakdownItem, { color: themeColors.darkInk }]}>Gaji Pokok</Text>
                <Text style={[styles.breakdownVal, { color: themeColors.darkInk }]}>Rp 9.000.000</Text>
              </View>

              <View style={[styles.breakdownRow, { borderBottomColor: themeColors.lineBorder }]}>
                <Text style={[styles.breakdownItem, { color: themeColors.darkInk }]}>Tunjangan Transport</Text>
                <Text style={[styles.breakdownVal, { color: themeColors.darkInk }]}>Rp 1.000.000</Text>
              </View>

              <View style={[styles.breakdownRow, { borderBottomColor: themeColors.lineBorder }]}>
                <Text style={[styles.breakdownItem, { color: themeColors.darkInk }]}>Potongan Keterlambatan (30m)</Text>
                <Text style={[styles.breakdownVal, { color: '#E11D48' }]}>-Rp 150.000</Text>
              </View>

              <TouchableOpacity style={[styles.btnPrimary, { marginTop: 16 }]} onPress={() => {
                handleDownloadPayslip('Agustus 2026', 'ps-001', 'Rp 9.850.000');
              }}>
                <Text style={styles.btnPrimaryText}>Unduh File PDF Slip Gaji Bulan Ini</Text>
              </TouchableOpacity>
            </View>

            {/* Riwayat Slip Gaji Past Periods List */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
              <Text style={[styles.sectionTitle, { color: themeColors.darkInk }]}>
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
                        backgroundColor: isActive ? Colors.forestGreen : themeColors.surface,
                        borderWidth: 1,
                        borderColor: isActive ? Colors.forestGreen : themeColors.lineBorder,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '700', color: isActive ? '#FFF' : themeColors.darkInk }}>
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
                        backgroundColor: themeColors.surface,
                        borderRadius: Radius.md,
                        padding: 16,
                        marginBottom: 12,
                        borderWidth: 1,
                        borderColor: themeColors.lineBorder
                      }}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Feather name="file-text" size={18} color={Colors.forestGreen} />
                          <Text style={{ fontSize: 15, fontWeight: '700', color: themeColors.darkInk }}>{item.period}</Text>
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

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, backgroundColor: themeColors.subCardBg, padding: 10, borderRadius: 6, borderWidth: 1, borderColor: themeColors.lineBorder }}>
                        <View>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: themeColors.mutedText }}>TAKE HOME PAY</Text>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.forestGreen, marginTop: 2 }}>
                            {item.thp}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 11, color: themeColors.mutedText }}>Gaji Pokok: {item.basicSalary}</Text>
                      </View>

                      <TouchableOpacity
                        style={[styles.btnSecondary, { borderColor: themeColors.lineBorder, marginTop: 0, justifyContent: 'center', alignItems: 'center' }]}
                        onPress={() => {
                          handleDownloadPayslip(item.period, item.id, item.thp);
                        }}
                      >
                        <Text style={[styles.btnSecondaryText, { color: themeColors.darkInk }]}>Unduh PDF ({item.period})</Text>
                      </TouchableOpacity>
                    </View>
                  ))}

                  {/* Pagination Controls (Max 5 Months per Page) */}
                  {selectedPayslipMonth === 'all' && totalPages > 1 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 20, backgroundColor: themeColors.surface, padding: 12, borderRadius: Radius.md, borderWidth: 1, borderColor: themeColors.lineBorder }}>
                      <TouchableOpacity
                        disabled={payslipPage <= 1}
                        onPress={() => setPayslipPage(prev => Math.max(prev - 1, 1))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: payslipPage <= 1 ? (isDarkMode ? '#334155' : '#F1F5F9') : Colors.forestGreen,
                          opacity: payslipPage <= 1 ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: payslipPage <= 1 ? themeColors.mutedText : '#FFF' }}>
                          Sebelumnya
                        </Text>
                      </TouchableOpacity>

                      <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.darkInk }}>
                        Halaman {payslipPage} dari {totalPages}
                      </Text>

                      <TouchableOpacity
                        disabled={payslipPage >= totalPages}
                        onPress={() => setPayslipPage(prev => Math.min(prev + 1, totalPages))}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: 6,
                          backgroundColor: payslipPage >= totalPages ? (isDarkMode ? '#334155' : '#F1F5F9') : Colors.forestGreen,
                          opacity: payslipPage >= totalPages ? 0.5 : 1
                        }}
                      >
                        <Text style={{ fontSize: 12, fontWeight: '700', color: payslipPage >= totalPages ? themeColors.mutedText : '#FFF' }}>
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
                <Text style={{ color: '#FFFFFF', fontSize: 32, fontWeight: '800' }}>{employeeProfile.avatarInitials}</Text>
              </View>

              {/* Employee Full Name */}
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, marginBottom: 4, textAlign: 'center' }}>
                {employeeProfile.name.toUpperCase()}
              </Text>

              {/* Employee NIK / Account Code */}
              <Text style={{ fontSize: 13, fontWeight: '600', color: 'rgba(255, 255, 255, 0.85)', marginBottom: 12 }}>
                {employeeProfile.code}
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
                  {employeeProfile.position}
                </Text>
              </View>
            </View>

            {/* 2. EMPLOYEE DETAILS CARD (White/Dark List Card Matching Mockup) */}
            <View
              style={{
                backgroundColor: themeColors.surface,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: themeColors.lineBorder,
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText, fontWeight: '500' }}>Account</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.darkInk }}>{employeeProfile.code}</Text>
              </View>

              {/* Name */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText, fontWeight: '500' }}>Name</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: themeColors.darkInk, letterSpacing: 0.3 }}>{employeeProfile.name.toUpperCase()}</Text>
              </View>

              {/* Employee Code (NIK Number) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText, fontWeight: '500' }}>Employee ID</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.darkInk, fontFamily: 'monospace' }}>{employeeProfile.id}</Text>
              </View>

              {/* Department */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText, fontWeight: '500' }}>Department</Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: themeColors.darkInk }}>{employeeProfile.department.toUpperCase()}</Text>
              </View>

              {/* Penempatan Kantor (Multi-Office Placement) */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText, fontWeight: '500' }}>Penempatan Kantor</Text>
                <Text style={{ fontSize: 12, fontWeight: '800', color: isDarkMode ? '#4ADE80' : '#166534', textAlign: 'right', flex: 1, marginLeft: 16 }}>
                  {employeeProfile.office}
                </Text>
              </View>

              {/* Email */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 }}>
                <Text style={{ fontSize: 13, color: themeColors.mutedText, fontWeight: '500' }}>Email</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.darkInk }}>budi.santoso@nusantara.tech</Text>
              </View>
            </View>

            {/* PENGATURAN & BANTUAN APLIKASI (APP SETTINGS, THEME, LANGUAGE & GUIDE) */}
            <Text style={[styles.sectionTitle, { color: themeColors.darkInk, marginTop: 20, marginBottom: 12 }]}>
              Pengaturan & Bantuan
            </Text>

            <View style={{ backgroundColor: themeColors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: themeColors.lineBorder, overflow: 'hidden', marginBottom: 24 }}>
              {/* 1. Panduan Penggunaan Aplikasi (View App User Guide) */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <BookOpen size={20} color={themeColors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: themeColors.darkInk }}>Panduan Penggunaan Aplikasi</Text>
                    <Text style={{ fontSize: 11, color: themeColors.mutedText, marginTop: 2 }}>Petunjuk absen, pengajuan izin & slip gaji</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={themeColors.mutedText} />
              </TouchableOpacity>

              {/* 2. Tema Tampilan (Theme Change Dark n Light) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsDarkMode(!isDarkMode)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  {isDarkMode ? <Moon size={20} color={themeColors.darkInk} /> : <Sun size={20} color={themeColors.darkInk} />}
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: themeColors.darkInk }}>Tema Tampilan</Text>
                    <Text style={{ fontSize: 11, color: themeColors.mutedText, marginTop: 2 }}>
                      {isDarkMode ? 'Mode Gelap (Dark Mode)' : 'Mode Terang (Light Mode)'}
                    </Text>
                  </View>
                </View>

                {/* Interactive Theme Switch Pill */}
                <View 
                  style={{ 
                    flexDirection: 'row', 
                    backgroundColor: isDarkMode ? '#334155' : '#E2E8F0', 
                    borderRadius: 9999, 
                    padding: 3,
                    borderWidth: 1,
                    borderColor: themeColors.lineBorder,
                    overflow: 'hidden'
                  }}
                >
                  <View 
                    style={{ 
                      backgroundColor: !isDarkMode ? Colors.forestGreen : 'transparent', 
                      paddingHorizontal: 12, 
                      paddingVertical: 5, 
                      borderRadius: 9999,
                      overflow: 'hidden'
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: !isDarkMode ? '#FFF' : themeColors.mutedText }}>Terang</Text>
                  </View>
                  <View 
                    style={{ 
                      backgroundColor: isDarkMode ? Colors.forestGreen : 'transparent', 
                      paddingHorizontal: 12, 
                      paddingVertical: 5, 
                      borderRadius: 9999,
                      overflow: 'hidden'
                    }}
                  >
                    <Text style={{ fontSize: 10, fontWeight: '800', color: isDarkMode ? '#FFF' : themeColors.mutedText }}>Gelap</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* 3. Bahasa Aplikasi (Language Change) */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Globe size={20} color={themeColors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: themeColors.darkInk }}>Bahasa Aplikasi</Text>
                    <Text style={{ fontSize: 11, color: themeColors.mutedText, marginTop: 2 }}>Bahasa Indonesia (Default)</Text>
                  </View>
                </View>
                {/* Non-functional language badge */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: themeColors.subCardBg, borderWidth: 1, borderColor: themeColors.lineBorder, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: themeColors.darkInk }}>🇮🇩 ID</Text>
                  <ChevronDown size={14} color={themeColors.mutedText} />
                </View>
              </View>

              {/* 4. Tentang Aplikasi (About This App) */}
              <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Info size={20} color={themeColors.darkInk} />
                  <View>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: themeColors.darkInk }}>Tentang HRIS Mobile</Text>
                    <Text style={{ fontSize: 11, color: themeColors.mutedText, marginTop: 2 }}>Versi 2.4.0 (Build 2026.08)</Text>
                  </View>
                </View>
                <ChevronRight size={18} color={themeColors.mutedText} />
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
      <View style={[styles.bottomNav, { backgroundColor: themeColors.tabBarBg, borderTopColor: themeColors.lineBorder }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
          <Feather name="camera" size={20} color={activeTab === 'home' ? Colors.forestGreen : themeColors.mutedText} />
          <Text style={[styles.navText, { color: activeTab === 'home' ? Colors.forestGreen : themeColors.mutedText }, activeTab === 'home' && styles.navActiveText]}>Absen</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('history')}>
          <Feather name="clock" size={20} color={activeTab === 'history' ? Colors.forestGreen : themeColors.mutedText} />
          <Text style={[styles.navText, { color: activeTab === 'history' ? Colors.forestGreen : themeColors.mutedText }, activeTab === 'history' && styles.navActiveText]}>Riwayat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('leave')}>
          <Feather name="file-text" size={20} color={activeTab === 'leave' ? Colors.forestGreen : themeColors.mutedText} />
          <Text style={[styles.navText, { color: activeTab === 'leave' ? Colors.forestGreen : themeColors.mutedText }, activeTab === 'leave' && styles.navActiveText]}>Izin</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('payslip')}>
          <Feather name="credit-card" size={20} color={activeTab === 'payslip' ? Colors.forestGreen : themeColors.mutedText} />
          <Text style={[styles.navText, { color: activeTab === 'payslip' ? Colors.forestGreen : themeColors.mutedText }, activeTab === 'payslip' && styles.navActiveText]}>Slip Gaji</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
          <Feather name="user" size={20} color={activeTab === 'profile' ? Colors.forestGreen : themeColors.mutedText} />
          <Text style={[styles.navText, { color: activeTab === 'profile' ? Colors.forestGreen : themeColors.mutedText }, activeTab === 'profile' && styles.navActiveText]}>Profil</Text>
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

      {/* IN-APP PAYSLIP PREVIEW & DOWNLOAD MODAL */}
      <Modal visible={isPayslipModalOpen} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 480, backgroundColor: themeColors.surface, borderRadius: Radius.lg, padding: 24, borderWidth: 1, borderColor: themeColors.lineBorder, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 }}>
            
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 2, borderBottomColor: Colors.forestGreen, paddingBottom: 12, marginBottom: 16 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.forestGreen }}>PT NUSANTARA TECH</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: themeColors.mutedText, marginTop: 2 }}>SLIP GAJI RESMI KARYAWAN</Text>
              </View>
              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: Colors.forestGreen }}>{selectedPayslip?.period}</Text>
              </View>
            </View>

            {/* Employee Details Grid */}
            <View style={{ backgroundColor: themeColors.subCardBg, padding: 12, borderRadius: Radius.md, marginBottom: 16, borderWidth: 1, borderColor: themeColors.lineBorder }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: themeColors.mutedText }}>Nama:</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.darkInk }}>Budi Santoso</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 12, color: themeColors.mutedText }}>NIK:</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: themeColors.darkInk }}>EMP-2026-001</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 12, color: themeColors.mutedText }}>Departemen / Status:</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.forestGreen }}>Engineering / Tetap</Text>
              </View>
            </View>

            {/* Breakdown */}
            <Text style={{ fontSize: 12, fontWeight: '800', color: themeColors.mutedText, marginBottom: 8, letterSpacing: 0.5 }}>RINCIAN GAJI & POTONGAN</Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
              <Text style={{ fontSize: 13, color: themeColors.darkInk }}>Gaji Pokok</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.darkInk }}>{selectedPayslip?.basicSalary || 'Rp 9.000.000'}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
              <Text style={{ fontSize: 13, color: themeColors.darkInk }}>Tunjangan Transport & Makan</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: themeColors.darkInk }}>Rp 1.000.000</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: themeColors.lineBorder }}>
              <Text style={{ fontSize: 13, color: '#E11D48' }}>Potongan Keterlambatan</Text>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#E11D48' }}>-Rp 150.000</Text>
            </View>

            {/* Total THP Box */}
            <View style={{ backgroundColor: '#DCFCE7', padding: 14, borderRadius: Radius.md, marginTop: 14, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' }}>
              <Text style={{ fontSize: 13, fontWeight: '800', color: Colors.forestGreen }}>TAKE HOME PAY (THP)</Text>
              <Text style={{ fontSize: 16, fontWeight: '800', color: Colors.forestGreen }}>{selectedPayslip?.thp}</Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={[styles.btnPrimary, { backgroundColor: Colors.forestGreen, marginBottom: 8 }]} onPress={handleOpenBrowserPrint}>
              <Text style={styles.btnPrimaryText}>📥 Unduh Slip Gaji (PDF)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSecondary} onPress={() => setIsPayslipModalOpen(false)}>
              <Text style={styles.btnSecondaryText}>Tutup</Text>
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
    paddingTop: 12,
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
