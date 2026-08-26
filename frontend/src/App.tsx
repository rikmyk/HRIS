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
  CheckCircle2,
  Eye,
  Sun,
  Moon,
  DollarSign,
  Briefcase,
  Wallet,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/v1';

interface OfficeLocationItem {
  id: string;
  code: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  assigned_employee_count: number;
}

interface EmployeeItem {
  id: string;
  code: string;
  name: string;
  department: string;
  position: string;
  basic_salary: string;       // Gaji Pokok ditetapkan per Karyawan
  allowances: string;         // Tunjangan ditetapkan per Karyawan
  bank_name: string;          // Bank Rekening Transfer
  account_number: string;     // No Rekening Gaji
  office_placements: string[]; // Multi-office placement support
  status: string;
}

interface LeaveRequestItem {
  id: string;
  employee_code: string;
  employee_name: string;
  department: string;
  leave_type: string;
  date_range: string;
  total_days: number;
  reason: string;
  document_url?: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface PayslipItem {
  id: string;
  employee_name: string;
  department: string;
  attendance_summary: string;
  basic_salary: string;
  allowances: string;
  deductions: string;
  gross_salary: string;
  net_salary: string;
  bank_account: string;
  status: 'draft' | 'approved' | 'rejected';
  is_paid: boolean;
  paid_date?: string;
  ref_no?: string;
}

interface DailyAttendanceRecord {
  id: string;
  date: string;
  employee_code: string;
  employee_name: string;
  department: string;
  office_name: string;
  clock_in_time: string;
  clock_in_photo: string;
  clock_in_distance: string;
  clock_out_time: string;
  clock_out_photo: string;
  clock_out_distance: string;
  status: 'valid' | 'late' | 'rejected_geofence';
}

function loadPersistedState<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? (JSON.parse(item) as T) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'employees' | 'offices' | 'monitoring' | 'leave' | 'approval' | 'payment'>('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Collapsed Sidebar State (Persisted)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() =>
    loadPersistedState<boolean>('hris_web_sidebar_collapsed', false)
  );

  useEffect(() => {
    try {
      localStorage.setItem('hris_web_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
    } catch (e) {}
  }, [isSidebarCollapsed]);

  // Tab Filter States
  const [employeeFilterStatus, setEmployeeFilterStatus] = useState<string>('all');
  const [approvalFilterStatus, setApprovalFilterStatus] = useState<string>('all');
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<string>('all');

  // Real-time Clock & Live Date State
  const [currentDateTime, setCurrentDateTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatIndonesianFullDateTime = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${dayName}, ${day} ${monthName} ${year} · ${hours}:${minutes}:${seconds} WIB`;
  };

  const formatIndonesianDateOnly = (date: Date) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName}, ${day} ${monthName} ${year}`;
  };

  const formatTimeOnly = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds} WIB`;
  };

  const formatIndonesianMonthYear = (date: Date) => {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Modal States
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<DailyAttendanceRecord | null>(null);
  const [selectedPayslipDetail, setSelectedPayslipDetail] = useState<PayslipItem | null>(null);
  const [selectedLeaveDetail, setSelectedLeaveDetail] = useState<LeaveRequestItem | null>(null);

  // Add & Edit Employee States
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState<boolean>(false);
  const [editingSalaryEmp, setEditingSalaryEmp] = useState<EmployeeItem | null>(null);
  const [isEditSalaryModalOpen, setIsEditSalaryModalOpen] = useState<boolean>(false);
  const [editBasicSalary, setEditBasicSalary] = useState<string>('');
  const [editAllowances, setEditAllowances] = useState<string>('');
  const [selectedPlacements, setSelectedPlacements] = useState<string[]>([]);

  // New Employee Form Input State
  const [newEmpCode, setNewEmpCode] = useState<string>('EMP-2026-004');
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newEmpDept, setNewEmpDept] = useState<string>('Engineering');
  const [newEmpPos, setNewEmpPos] = useState<string>('Software Engineer');
  const [newEmpSalary, setNewEmpSalary] = useState<string>('8500000');
  const [newEmpAllowance, setNewEmpAllowance] = useState<string>('1000000');
  const [newEmpBank, setNewEmpBank] = useState<string>('BCA');
  const [newEmpAccountNo, setNewEmpAccountNo] = useState<string>('8801998877');
  const [newEmpStatus, setNewEmpStatus] = useState<string>('Permanent');
  const [newEmpPlacements, setNewEmpPlacements] = useState<string[]>(['Head Office Jakarta']);

  // Master Data Office Locations
  const [officeLocations, setOfficeLocations] = useState<OfficeLocationItem[]>(() =>
    loadPersistedState('hris_web_offices', [
      {
        id: 'off-1',
        code: 'HO-JKT',
        name: 'Head Office Jakarta',
        address: 'Jl. Sudirman No. 45, Jakarta Selatan',
        latitude: -6.2088,
        longitude: 106.8456,
        radius_meters: 150,
        assigned_employee_count: 140
      },
      {
        id: 'off-2',
        code: 'BR-BDG',
        name: 'Bandung Branch Office',
        address: 'Jl. Asia Afrika No. 12, Bandung',
        latitude: -6.9147,
        longitude: 107.6098,
        radius_meters: 150,
        assigned_employee_count: 25
      },
      {
        id: 'off-3',
        code: 'BR-SBY',
        name: 'Surabaya Branch Office',
        address: 'Jl. Pemuda No. 88, Surabaya',
        latitude: -7.2575,
        longitude: 112.7521,
        radius_meters: 150,
        assigned_employee_count: 15
      }
    ])
  );

  // Master Data Employee List with Penetapan Gaji & Multi-Office Placement
  const [employees, setEmployees] = useState<EmployeeItem[]>(() =>
    loadPersistedState('hris_web_employees', [
      {
        id: 'emp-001',
        code: 'EMP-2026-001',
        name: 'Budi Santoso',
        department: 'Engineering',
        position: 'Senior Software Engineer',
        basic_salary: 'Rp 9.000.000',
        allowances: 'Rp 1.000.000',
        bank_name: 'Mandiri',
        account_number: '1330xxxxxx',
        office_placements: ['Head Office Jakarta', 'Bandung Branch Office'],
        status: 'Permanent'
      },
      {
        id: 'emp-002',
        code: 'EMP-2026-002',
        name: 'Dewi Anggraini',
        department: 'Marketing',
        position: 'Marketing Specialist',
        basic_salary: 'Rp 7.500.000',
        allowances: 'Rp 1.000.000',
        bank_name: 'BCA',
        account_number: '8801xxxxxx',
        office_placements: ['Head Office Jakarta'],
        status: 'Permanent'
      },
      {
        id: 'emp-003',
        code: 'EMP-2026-003',
        name: 'Rian Pratama',
        department: 'Sales',
        position: 'Field Representative',
        basic_salary: 'Rp 6.000.000',
        allowances: 'Rp 1.500.000',
        bank_name: 'BNI',
        account_number: '0441xxxxxx',
        office_placements: ['Bandung Branch Office', 'Surabaya Branch Office'],
        status: 'Contract'
      },
      {
        id: 'emp-004',
        code: 'EMP-2026-004',
        name: 'Siti Rahma',
        department: 'HR & GA',
        position: 'HR Officer',
        basic_salary: 'Rp 7.000.000',
        allowances: 'Rp 800.000',
        bank_name: 'BRI',
        account_number: '0203xxxxxx',
        office_placements: ['Head Office Jakarta'],
        status: 'Permanent'
      },
      {
        id: 'emp-005',
        code: 'EMP-2026-005',
        name: 'Ahmad Fauzi',
        department: 'Finance',
        position: 'Accountant',
        basic_salary: 'Rp 8.000.000',
        allowances: 'Rp 1.000.000',
        bank_name: 'Mandiri',
        account_number: '1331xxxxxx',
        office_placements: ['Head Office Jakarta'],
        status: 'Permanent'
      },
      {
        id: 'emp-006',
        code: 'EMP-2026-006',
        name: 'Hendra Wijaya',
        department: 'Operations',
        position: 'Operations Supervisor',
        basic_salary: 'Rp 8.500.000',
        allowances: 'Rp 1.200.000',
        bank_name: 'BCA',
        account_number: '8802xxxxxx',
        office_placements: ['Surabaya Branch Office'],
        status: 'Permanent'
      }
    ])
  );

  // Daily Attendance Records per Employee (Foto Masuk + Foto Keluar + Pagination Max 10)
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendanceRecord[]>(() =>
    loadPersistedState('hris_web_attendance_records_v4', [
      {
        id: 'att-2026-001',
        date: '26 Agu 2026',
        employee_code: 'EMP-2026-001',
        employee_name: 'Budi Santoso',
        department: 'Engineering',
        office_name: 'Head Office Jakarta',
        clock_in_time: '08:02:15 WIB',
        clock_in_photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        clock_in_distance: '35m',
        clock_out_time: '-',
        clock_out_photo: '',
        clock_out_distance: '-',
        status: 'valid'
      }
    ])
  );

  // Leave Requests Data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(() =>
    loadPersistedState('hris_web_leave_requests', [
      {
        id: 'lr-101',
        employee_code: 'EMP-2026-002',
        employee_name: 'Dewi Anggraini',
        department: 'Marketing',
        leave_type: 'Sakit dengan Surat Dokter',
        date_range: '25 Agu 2026',
        total_days: 1,
        reason: 'Demam tinggi dan flu, melampirkan surat keterangan istirahat dari dr. Handoko Sp.PD.',
        document_url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80',
        status: 'pending'
      },
      {
        id: 'lr-102',
        employee_code: 'EMP-2026-003',
        employee_name: 'Rian Pratama',
        department: 'Sales',
        leave_type: 'Cuti Tahunan',
        date_range: '26–28 Agu 2026',
        total_days: 3,
        reason: 'Acara keluarga tahunan di Yogyakarta.',
        status: 'pending'
      }
    ])
  );

  // Payslips Data (Synchronized with Assigned Employee Salary)
  const [payslips, setPayslips] = useState<PayslipItem[]>(() =>
    loadPersistedState('hris_web_payslips', [
      {
        id: 'ps-001',
        employee_name: 'Budi Santoso',
        department: 'Engineering',
        attendance_summary: '18 / 3 / 2 / 1',
        basic_salary: 'Rp 9.000.000',
        allowances: 'Rp 1.000.000',
        deductions: '-Rp 150.000',
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
        basic_salary: 'Rp 7.500.000',
        allowances: 'Rp 1.000.000',
        deductions: 'Rp 0',
        gross_salary: 'Rp 8.500.000',
        net_salary: 'Rp 8.500.000',
        bank_account: 'BCA · 8801xxxxxx',
        status: 'approved',
        is_paid: false
      },
      {
        id: 'ps-003',
        employee_name: 'Siti Rahma',
        department: 'HR & GA',
        attendance_summary: '20 / 0 / 0 / 0',
        basic_salary: 'Rp 7.000.000',
        allowances: 'Rp 800.000',
        deductions: 'Rp 0',
        gross_salary: 'Rp 7.800.000',
        net_salary: 'Rp 7.800.000',
        bank_account: 'BRI · 0203xxxxxx',
        status: 'draft',
        is_paid: false
      }
    ])
  );

  // Filters State
  const [leaveFilterStatus, setLeaveFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [monitoringFilterStatus, setMonitoringFilterStatus] = useState<'all' | 'valid' | 'rejected_geofence'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination State for Monitoring Absensi (Max 10 records per page)
  const [monitoringPage, setMonitoringPage] = useState<number>(1);
  const monitoringPageSize = 10;

  // Save to LocalStorage
  useEffect(() => { localStorage.setItem('hris_web_offices', JSON.stringify(officeLocations)); }, [officeLocations]);
  useEffect(() => { localStorage.setItem('hris_web_employees', JSON.stringify(employees)); }, [employees]);
  useEffect(() => { localStorage.setItem('hris_web_attendance_records_v3', JSON.stringify(attendanceRecords)); }, [attendanceRecords]);
  useEffect(() => { localStorage.setItem('hris_web_leave_requests', JSON.stringify(leaveRequests)); }, [leaveRequests]);
  useEffect(() => { localStorage.setItem('hris_web_payslips', JSON.stringify(payslips)); }, [payslips]);

    // Real-time listener & Backend Polling for Mobile App Selfie Clock-In & Clock-Out Sync
    useEffect(() => {
      const syncAttendanceFromStorage = () => {
        try {
          const saved = localStorage.getItem('hris_web_attendance_records_v3');
          if (saved) {
            const parsed = JSON.parse(saved);
            setAttendanceRecords(parsed);
          }
        } catch (e) {}
      };

      window.addEventListener('storage', syncAttendanceFromStorage);

      let channel: BroadcastChannel | null = null;
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('hris_attendance_channel_v3');
        channel.onmessage = (event) => {
          if (event.data) {
            setAttendanceRecords(event.data);
            showToast(`🔔 Foto Selfie Absensi Mobile Real-time Terbaca!`);
          }
        };
      }

      // Live Polling from Go Backend REST API (http://localhost:8080/v1/attendance/records)
      const fetchBackendRecords = async () => {
        try {
          const res = await fetch('http://localhost:8080/v1/attendance/records', {
            headers: { 'Authorization': 'Bearer demo-token-emp-001' }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              setAttendanceRecords(prev => {
                const mergedMap = new Map();
                prev.forEach(r => mergedMap.set(`${r.employee_code}-${r.date}`, r));
                json.data.forEach((r: DailyAttendanceRecord) => mergedMap.set(`${r.employee_code}-${r.date}`, r));
                return Array.from(mergedMap.values());
              });
            }
          }
        } catch (err) {
          // Backend server offline fallback
        }
      };

      // Live Polling for Leave Requests from Go Backend API (http://localhost:8080/v1/leave/requests)
      const fetchBackendLeaveRequests = async () => {
        try {
          const res = await fetch('http://localhost:8080/v1/leave/requests', {
            headers: { 'Authorization': 'Bearer demo-token-emp-001' }
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
              setLeaveRequests(prev => {
                const map = new Map();
                prev.forEach(r => map.set(r.id, r));
                json.data.forEach((r: any) => {
                  map.set(r.id, {
                    id: r.id,
                    employee_code: r.employee_code || 'EMP-2026-001',
                    employee_name: r.employee_name || 'Budi Santoso',
                    department: r.department || 'Engineering',
                    leave_type: r.leave_type_name || r.leave_type || 'Cuti Tahunan',
                    date_range: r.start_date === r.end_date ? r.start_date : `${r.start_date} - ${r.end_date}`,
                    total_days: r.days_count || 1,
                    reason: r.reason || 'Keperluan pribadi',
                    document_url: r.attachment_url || '',
                    status: r.status || 'pending'
                  });
                });
                return Array.from(map.values());
              });
            }
          }
        } catch (err) {}
      };

      fetchBackendRecords();
      fetchBackendLeaveRequests();
      const interval = setInterval(() => {
        fetchBackendRecords();
        fetchBackendLeaveRequests();
      }, 3000);

      return () => {
        window.removeEventListener('storage', syncAttendanceFromStorage);
        if (channel) channel.close();
        clearInterval(interval);
      };
    }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Format currency helper
  const formatRupiah = (valStr: string) => {
    const num = parseInt(valStr.replace(/\D/g, '')) || 0;
    return `Rp ${num.toLocaleString('id-ID')}`;
  };

  // E2E Action Handlers
  const handleAddEmployeeSubmit = async () => {
    if (!newEmpName.trim()) {
      showToast('⚠️ Masukkan nama lengkap karyawan!');
      return;
    }

    const formattedBasic = formatRupiah(newEmpSalary);
    const formattedAllow = formatRupiah(newEmpAllowance);

    const newEmp: EmployeeItem = {
      id: `emp-00${employees.length + 1}`,
      code: newEmpCode,
      name: newEmpName,
      department: newEmpDept,
      position: newEmpPos,
      basic_salary: formattedBasic,
      allowances: formattedAllow,
      bank_name: newEmpBank,
      account_number: newEmpAccountNo,
      office_placements: newEmpPlacements,
      status: newEmpStatus
    };

    setEmployees(prev => [...prev, newEmp]);

    // Also auto-generate draft payslip with assigned salary!
    const newPayslip: PayslipItem = {
      id: `ps-00${payslips.length + 1}`,
      employee_name: newEmpName,
      department: newEmpDept,
      attendance_summary: '20 / 0 / 0 / 0',
      basic_salary: formattedBasic,
      allowances: formattedAllow,
      deductions: 'Rp 0',
      gross_salary: formatRupiah(String((parseInt(newEmpSalary) || 0) + (parseInt(newEmpAllowance) || 0))),
      net_salary: formatRupiah(String((parseInt(newEmpSalary) || 0) + (parseInt(newEmpAllowance) || 0))),
      bank_account: `${newEmpBank} · ${newEmpAccountNo}`,
      status: 'draft',
      is_paid: false
    };

    setPayslips(prev => [...prev, newPayslip]);
    setIsAddEmployeeModalOpen(false);
    showToast(`Karyawan Baru ${newEmpName} BERHASIL DITAMBAHKAN dengan Penetapan Gaji ${formattedBasic}!`);

    // Reset inputs
    setNewEmpName('');
    setNewEmpCode(`EMP-2026-00${employees.length + 2}`);
  };

  const handleApproveLeave = async (id: string, name: string) => {
    try { await fetch(`${API_BASE}/leave/requests/${id}/approve`, { method: 'POST' }); } catch (e) {}
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
    showToast(`Pengajuan izin ${name} BERHASIL DI-APPROVE!`);
  };

  const handleRejectLeave = async (id: string, name: string) => {
    try { await fetch(`${API_BASE}/leave/requests/${id}/reject`, { method: 'POST' }); } catch (e) {}
    setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
    showToast(`Pengajuan izin ${name} DITOLAK.`);
  };

  const handleApprovePayslip = async (id: string, name: string) => {
    try { await fetch(`${API_BASE}/payroll/payslips/${id}/approve`, { method: 'POST' }); } catch (e) {}
    setPayslips(prev => prev.map(p => p.id === id ? { ...p, status: 'approved' } : p));
    showToast(`Slip gaji ${name} BERHASIL DISETUJUI! PDF Siap diunduh.`);
  };

  const handleBulkApprovePayslips = async () => {
    try { await fetch(`${API_BASE}/payroll/payslips/bulk-approve`, { method: 'POST' }); } catch (e) {}
    setPayslips(prev => prev.map(p => ({ ...p, status: 'approved' })));
    showToast(`Seluruh Draft Slip Gaji (${formatIndonesianMonthYear(currentDateTime)}) BERHASIL DI-APPROVE SEKALIGUS!`);
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
    } catch (e) {}
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
    } catch (e) {}
    const todayStr = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    setPayslips(prev => prev.map(p => p.status === 'approved' ? { ...p, is_paid: true, paid_date: todayStr, ref_no: 'TRF-BATCH-202608' } : p));
    showToast(`Berhasil menandai ${approvedUnpaid.length} slip gaji TERPILIH SEBAGAI SUDAH DIBAYAR!`);
  };

  const handleDownloadPDF = (id: string, name: string) => {
    showToast(`Mengunduh Slip Gaji PDF ${name}...`);
    window.open(`${API_BASE}/payroll/public/payslips/${id}/pdf`, '_blank');
  };

  const filteredLeaveRequests = leaveRequests.filter(r => {
    const matchesStatus = leaveFilterStatus === 'all' || r.status === leaveFilterStatus;
    const matchesSearch = r.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredAttendanceRecords = attendanceRecords.filter(att => {
    const matchesStatus = monitoringFilterStatus === 'all' || att.status === monitoringFilterStatus;
    const matchesSearch = att.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) || att.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  if (!isLoggedIn) {
    return (
      <div className="login-split-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
        <div style={{ flex: 1, background: 'var(--ink)', color: '#fff', padding: '60px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, background: 'var(--primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 24 }}>H</div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontSize: 32, marginBottom: 12 }}>HRIS Admin Portal</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 400, lineHeight: 1.6 }}>
            Sistem Manajemen Sumber Daya Manusia & Penggajian Terpadu. Kelola penetapan gaji, kehadiran geofence, foto selfie, izin, dan slip gaji dalam satu dasbor.
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
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'relative',
      filter: isDarkMode ? 'invert(0.9) hue-rotate(180deg)' : 'none',
      transition: 'filter 0.3s ease'
    }}>
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
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Perluas Sidebar" : "Minimize Sidebar"}
              style={{
                background: '#FFFFFF',
                border: '1.5px solid var(--line)',
                borderRadius: 8,
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink)',
                marginRight: 4,
                transition: 'all 0.15s ease'
              }}
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
            <div className="brand-mark">H</div>
            {!isSidebarCollapsed && <span>HRIS Admin</span>}
          </div>

          {/* Center: Live Timestamp Clock */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: 'var(--primary-dark)', background: '#F0FDF4', padding: '4px 12px', borderRadius: 20, border: '1.5px solid #BBF7D0' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span>{formatTimeOnly(currentDateTime)}</span>
          </div>

          {/* Right: Live Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}>
            <Calendar size={14} color="var(--primary-dark)" />
            <span style={{ fontWeight: 700 }}>{formatIndonesianDateOnly(currentDateTime)}</span>
          </div>
        </div>

        {/* Layout */}
        <div className="admin-layout">
          {/* Sidebar */}
          <div className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div>
              <div className={`side-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} title="Dashboard">
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </div>
              <div className={`side-link ${activeTab === 'employees' ? 'active' : ''}`} onClick={() => setActiveTab('employees')} title="Karyawan & Penetapan Gaji">
                <Users size={18} />
                <span>Karyawan & Penetapan Gaji</span>
              </div>
              <div className={`side-link ${activeTab === 'offices' ? 'active' : ''}`} onClick={() => setActiveTab('offices')} title="Lokasi Kantor Cabang">
                <Building2 size={18} />
                <span>Lokasi Kantor Cabang</span>
              </div>
              <div className={`side-link ${activeTab === 'monitoring' ? 'active' : ''}`} onClick={() => setActiveTab('monitoring')} title="Monitoring Absensi & Foto">
                <MapPin size={18} />
                <span>Monitoring Absensi & Foto</span>
              </div>
              <div className={`side-link ${activeTab === 'leave' ? 'active' : ''}`} onClick={() => setActiveTab('leave')} title="Pengajuan Izin">
                <FileText size={18} />
                <span>Pengajuan Izin</span>
              </div>
              <div className={`side-link ${activeTab === 'approval' ? 'active' : ''}`} onClick={() => setActiveTab('approval')} title="Approval Slip Gaji">
                <FileCheck size={18} />
                <span>Approval Slip Gaji</span>
              </div>
              <div className={`side-link ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')} title="Penandaan Pembayaran">
                <CreditCard size={18} />
                <span>Penandaan Pembayaran</span>
              </div>
            </div>

            {/* Bottom User Profile, Mode Terang & Keluar Button */}
            <div style={{ paddingTop: 16, borderTop: '1.5px solid var(--line)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10, alignItems: isSidebarCollapsed ? 'center' : 'stretch' }}>
              {/* User Profile Card */}
              {isSidebarCollapsed ? (
                <div title="Sari Wijaya (HR Admin)" style={{ width: 36, height: 36, borderRadius: '50%', background: '#2F6F5E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, border: '1.5px solid #1E4D40', flexShrink: 0, cursor: 'pointer' }}>
                  SW
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: '#F8FAFC', borderRadius: 10, border: '1.5px solid var(--line)' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#2F6F5E', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, border: '1px solid #1E4D40', flexShrink: 0 }}>
                    SW
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Sari Wijaya</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>HR Admin</div>
                  </div>
                </div>
              )}

              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? "Mode Gelap" : "Mode Terang"}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isSidebarCollapsed ? 0 : 8,
                  background: '#FFFFFF',
                  border: '1.5px solid var(--line)',
                  borderRadius: 8,
                  padding: isSidebarCollapsed ? '8px 0' : '8px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  width: '100%',
                  transition: 'all 0.15s ease'
                }}
              >
                {isDarkMode ? <Moon size={16} color="var(--ink)" /> : <Sun size={16} color="var(--accent)" />}
                {!isSidebarCollapsed && <span>{isDarkMode ? 'Mode Gelap' : 'Mode Terang'}</span>}
              </button>

              {/* LogOut Button */}
              <button
                onClick={() => setIsLoggedIn(false)}
                title="Keluar"
                className="btn-mini"
                style={{
                  width: '100%',
                  padding: isSidebarCollapsed ? '8px 0' : '8px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: isSidebarCollapsed ? 0 : 6,
                  color: '#C24A3B',
                  borderColor: '#FCA5A5',
                  background: '#FEF2F2',
                  fontWeight: 700,
                  marginRight: 0
                }}
              >
                <LogOut size={15} />
                {!isSidebarCollapsed && <span>Keluar</span>}
              </button>
            </div>
          </div>

          {/* Main View Container */}
          <div className="admin-main">
            {/* TAB 1: DASHBOARD OVERVIEW */}
            {activeTab === 'dashboard' && (
              <>
                <h2>Dashboard Overview</h2>
                <p className="sub">Ringkasan status absensi, permohonan izin, dan kelola slip gaji karyawan</p>
                <div className="kpi-row">
                  <div className="kpi-card">
                    <div className="kpi-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <UserCheck size={15} color="var(--primary-dark)" /> Hadir Hari Ini
                    </div>
                    <div className="kpi-value">142 / {employees.length}</div>
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
                      <FileText size={15} color="#2F4E8A" /> Pengajuan Izin Pending
                    </div>
                    <div className="kpi-value accent">{leaveRequests.filter(r => r.status === 'pending').length}</div>
                  </div>
                </div>

                {/* Quick Leave Table in Dashboard */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 }}>
                  <h2 style={{ fontSize: 15, margin: 0 }}>Pengajuan Izin Terbaru</h2>
                  <button onClick={() => setActiveTab('leave')} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    Kelola Semua Izin <Check size={14} />
                  </button>
                </div>

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
                    {leaveRequests.slice(0, 3).map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="name-cell"><div className="n">{r.employee_name}</div><div className="d">{r.department}</div></div>
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
              </>
            )}

            {/* TAB 2: MANAJEMEN KARYAWAN & PENETAPAN GAJI */}
            {activeTab === 'employees' && (
              <>
                <h2>Manajemen Karyawan & Penetapan Gaji</h2>
                <p className="sub">Daftar seluruh personel ({employees.length} karyawan), penetapan Gaji Pokok & Tunjangan, serta penempatan kantor cabang</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--line)', marginBottom: 20, paddingBottom: 0 }}>
                  <div className="tab-nav-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    <button
                      onClick={() => setEmployeeFilterStatus('all')}
                      className={`tab-nav-btn ${employeeFilterStatus === 'all' ? 'active' : ''}`}
                    >
                      Semua Karyawan ({employees.length})
                    </button>
                    <button
                      onClick={() => setEmployeeFilterStatus('Permanent')}
                      className={`tab-nav-btn ${employeeFilterStatus === 'Permanent' ? 'active' : ''}`}
                    >
                      Pegawai Tetap ({employees.filter(e => e.status === 'Permanent').length})
                    </button>
                    <button
                      onClick={() => setEmployeeFilterStatus('Contract')}
                      className={`tab-nav-btn ${employeeFilterStatus === 'Contract' ? 'active' : ''}`}
                    >
                      Pegawai Kontrak ({employees.filter(e => e.status === 'Contract').length})
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ position: 'relative', width: 240 }}>
                      <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
                      <input
                        type="text"
                        placeholder="Cari nama / NIK..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ padding: '8px 14px 8px 36px', borderRadius: 8, border: '1px solid var(--line)', width: '100%' }}
                      />
                    </div>
                    
                    <button
                      onClick={() => setIsAddEmployeeModalOpen(true)}
                      className="btn-mini primary"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8 }}
                    >
                      <Plus size={15} /> Tambah Karyawan Baru
                    </button>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Kode NIK</th>
                      <th>Nama Lengkap</th>
                      <th>Departemen & Jabatan</th>
                      <th>Penetapan Gaji Pokok & Tunjangan</th>
                      <th>Rekening Transfer Gaji</th>
                      <th>Penempatan Cabang</th>
                      <th>Aksi Edit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.filter(emp => {
                      const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            emp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            emp.department.toLowerCase().includes(searchQuery.toLowerCase());
                      if (employeeFilterStatus === 'all') return matchesSearch;
                      return matchesSearch && emp.status === employeeFilterStatus;
                    }).map(emp => (
                      <tr key={emp.id}>
                        <td><strong>{emp.code}</strong></td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{emp.name}</div>
                          <span className="pill present" style={{ fontSize: 10 }}>{emp.status}</span>
                        </td>
                        <td>
                          <div><strong>{emp.department}</strong></div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{emp.position}</div>
                        </td>
                        <td>
                          <div style={{ color: 'var(--primary-dark)', fontWeight: 800 }}>{emp.basic_salary}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>+ {emp.allowances} (Tunjangan)</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{emp.bank_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{emp.account_number}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {emp.office_placements.map((loc, idx) => (
                              <span key={idx} className="pill present" style={{ fontSize: 10, background: idx === 0 ? '#DCFCE7' : '#E0F2FE', color: idx === 0 ? '#166534' : '#0369A1' }}>
                                {loc}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setEditingSalaryEmp(emp);
                              setEditBasicSalary(emp.basic_salary);
                              setEditAllowances(emp.allowances);
                              setSelectedPlacements(emp.office_placements || []);
                              setIsEditSalaryModalOpen(true);
                            }}
                            className="btn-mini primary"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <Edit3 size={13} /> Atur Gaji & Cabang
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* TAB 3: MASTER DATA KANTOR CABANG */}
            {activeTab === 'offices' && (
              <>
                <h2>Master Data Lokasi Kantor Cabang</h2>
                <p className="sub">Kelola koordinat GPS dan radius geofence untuk absensi karyawan</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--line)', marginBottom: 20, paddingBottom: 0 }}>
                  <div className="tab-nav-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    <button className="tab-nav-btn active">
                      Semua Kantor Cabang ({officeLocations.length})
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ position: 'relative', width: 240 }}>
                      <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
                      <input type="text" placeholder="Cari nama kantor..." style={{ padding: '8px 14px 8px 36px', borderRadius: 8, border: '1px solid var(--line)', width: '100%' }} />
                    </div>
                    <button onClick={() => showToast('Form Tambah Lokasi Kantor Cabang Baru SIAP')} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8 }}><Plus size={15} /> Tambah Cabang</button>
                  </div>
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Kode Cabang</th>
                      <th>Nama Kantor Cabang</th>
                      <th>Alamat</th>
                      <th>Koordinat GPS (Lat, Lng)</th>
                      <th>Radius Geofence</th>
                      <th>Jumlah Karyawan</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {officeLocations.map(off => (
                      <tr key={off.id}>
                        <td><strong>{off.code}</strong></td>
                        <td><strong>{off.name}</strong></td>
                        <td style={{ fontSize: 12, maxWidth: 220 }}>{off.address}</td>
                        <td style={{ fontSize: 12, fontFamily: 'monospace' }}>{off.latitude}, {off.longitude}</td>
                        <td><span className="pill present">{off.radius_meters} Meter</span></td>
                        <td><strong>{off.assigned_employee_count} Personel</strong></td>
                        <td>
                          <button onClick={() => showToast(`Mengedit radius & koordinat ${off.name}`)} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Edit3 size={13} /> Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* TAB 4: MONITORING ABSENSI & FOTO SELFIE */}
            {activeTab === 'monitoring' && (() => {
              const filteredAtt = attendanceRecords.filter(att => {
                const matchesSearch = att.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      att.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                      att.department.toLowerCase().includes(searchQuery.toLowerCase());
                if (monitoringFilterStatus === 'all') return matchesSearch;
                return matchesSearch && att.status === monitoringFilterStatus;
              });

              const totalPages = Math.ceil(filteredAtt.length / monitoringPageSize) || 1;
              const paginatedAtt = filteredAtt.slice(
                (monitoringPage - 1) * monitoringPageSize,
                monitoringPage * monitoringPageSize
              );

              return (
                <>
                  <h2>Monitoring Absensi & Foto Selfie — Real-time</h2>
                  <p className="sub" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Building2 size={14} /> Multi-Office Geofence · Verifikasi Absen Masuk & Keluar Seluruh Karyawan
                  </p>

                  {/* Filter Selector & Search Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--line)', marginBottom: 20, paddingBottom: 0 }}>
                    <div className="tab-nav-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                      <button
                        onClick={() => { setMonitoringFilterStatus('all'); setMonitoringPage(1); }}
                        className={`tab-nav-btn ${monitoringFilterStatus === 'all' ? 'active' : ''}`}
                      >
                        Semua Karyawan ({attendanceRecords.length})
                      </button>
                      <button
                        onClick={() => { setMonitoringFilterStatus('valid'); setMonitoringPage(1); }}
                        className={`tab-nav-btn ${monitoringFilterStatus === 'valid' ? 'active' : ''}`}
                      >
                        Valid Dalam Radius ({attendanceRecords.filter(a => a.status === 'valid').length})
                      </button>
                      <button
                        onClick={() => { setMonitoringFilterStatus('rejected_geofence'); setMonitoringPage(1); }}
                        className={`tab-nav-btn ${monitoringFilterStatus === 'rejected_geofence' ? 'active' : ''}`}
                      >
                        Ditolak ({attendanceRecords.filter(a => a.status === 'rejected_geofence').length})
                      </button>
                    </div>

                    <div style={{ position: 'relative', width: 240, marginBottom: 8 }}>
                      <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
                      <input
                        type="text"
                        placeholder="Cari karyawan / NIK..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setMonitoringPage(1); }}
                        style={{ padding: '8px 14px 8px 36px', borderRadius: 8, border: '1px solid var(--line)', width: '100%' }}
                      />
                    </div>
                  </div>

                  <table>
                    <thead>
                      <tr>
                        <th>Karyawan</th>
                        <th>Tanggal</th>
                        <th>Jam Masuk</th>
                        <th>Jam Keluar</th>
                        <th>Penempatan Kantor</th>
                        <th>Status Geofence</th>
                        <th>Aksi Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedAtt.map(att => (
                        <tr key={att.id}>
                          <td>
                            <div className="name-cell">
                              <div className="n">{att.employee_name}</div>
                              <div className="d">{att.employee_code} · {att.department}</div>
                            </div>
                          </td>
                          <td><strong>{att.date}</strong></td>
                          <td>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{att.clock_in_time}</div>
                              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Radius {att.clock_in_distance}</div>
                            </div>
                          </td>
                          <td>
                            {att.clock_out_time && att.clock_out_time !== '-' ? (
                              <div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{att.clock_out_time}</div>
                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>Radius {att.clock_out_distance}</div>
                              </div>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--muted)', fontStyle: 'italic' }}>Belum Absen Keluar</span>
                            )}
                          </td>
                          <td><span style={{ fontSize: 12, fontWeight: 500, color: 'var(--ink)' }}>{att.office_name}</span></td>
                          <td>
                            <span className={`pill ${att.status === 'valid' ? 'present' : 'absent'}`}>
                              {att.status === 'valid' ? '✓ Hadir (Valid)' : '⚠️ Ditolak (Luar Radius)'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedPhotoModal(att)}
                              className="btn-mini primary"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 10px', fontSize: 11 }}
                            >
                              <Eye size={13} /> Zoom Foto & Maps
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* CLIENT-SIDE PAGINATION CONTROL (MAX 10 PER PAGE) */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      Menampilkan <strong>{filteredAtt.length === 0 ? 0 : (monitoringPage - 1) * monitoringPageSize + 1}–{Math.min(monitoringPage * monitoringPageSize, filteredAtt.length)}</strong> dari <strong>{filteredAtt.length}</strong> data absensi (Halaman {monitoringPage} dari {totalPages})
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button
                        disabled={monitoringPage === 1}
                        onClick={() => setMonitoringPage(prev => Math.max(prev - 1, 1))}
                        className="btn-mini"
                        style={{ opacity: monitoringPage === 1 ? 0.5 : 1, cursor: monitoringPage === 1 ? 'not-allowed' : 'pointer' }}
                      >
                        ◄ Sebelumnya
                      </button>

                      {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(pNum => (
                        <button
                          key={pNum}
                          onClick={() => setMonitoringPage(pNum)}
                          className={`btn-mini ${monitoringPage === pNum ? 'primary' : ''}`}
                          style={{ padding: '6px 10px', minWidth: 30, fontWeight: monitoringPage === pNum ? 800 : 400 }}
                        >
                          {pNum}
                        </button>
                      ))}

                      <button
                        disabled={monitoringPage >= totalPages}
                        onClick={() => setMonitoringPage(prev => Math.min(prev + 1, totalPages))}
                        className="btn-mini"
                        style={{ opacity: monitoringPage >= totalPages ? 0.5 : 1, cursor: monitoringPage >= totalPages ? 'not-allowed' : 'pointer' }}
                      >
                        Berikutnya ►
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* TAB 5: PENGAJUAN IZIN */}
            {activeTab === 'leave' && (
              <>
                <h2>Pengajuan Izin Karyawan</h2>
                <p className="sub">Kelola dan review seluruh permohonan izin, sakit, dan cuti karyawan</p>

                {/* Filter Tabs & Search Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--line)', marginBottom: 20, paddingBottom: 0 }}>
                  <div className="tab-nav-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    <button
                      onClick={() => setLeaveFilterStatus('all')}
                      className={`tab-nav-btn ${leaveFilterStatus === 'all' ? 'active' : ''}`}
                    >
                      Semua ({leaveRequests.length})
                    </button>
                    <button
                      onClick={() => setLeaveFilterStatus('pending')}
                      className={`tab-nav-btn ${leaveFilterStatus === 'pending' ? 'active' : ''}`}
                    >
                      Menunggu Review ({leaveRequests.filter(r => r.status === 'pending').length})
                    </button>
                    <button
                      onClick={() => setLeaveFilterStatus('approved')}
                      className={`tab-nav-btn ${leaveFilterStatus === 'approved' ? 'active' : ''}`}
                    >
                      Disetujui ({leaveRequests.filter(r => r.status === 'approved').length})
                    </button>
                    <button
                      onClick={() => setLeaveFilterStatus('rejected')}
                      className={`tab-nav-btn ${leaveFilterStatus === 'rejected' ? 'active' : ''}`}
                    >
                      Ditolak ({leaveRequests.filter(r => r.status === 'rejected').length})
                    </button>
                  </div>

                  <div style={{ position: 'relative', width: 240, marginBottom: 8 }}>
                    <Search size={15} color="var(--muted)" style={{ position: 'absolute', left: 12, top: 11 }} />
                    <input
                      type="text"
                      placeholder="Cari karyawan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{ padding: '8px 14px 8px 36px', borderRadius: 8, border: '1px solid var(--line)', width: '100%' }}
                    />
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Jenis Izin</th>
                      <th>Periode Tanggal</th>
                      <th>Durasi</th>
                      <th>Alasan & Dokumen</th>
                      <th>Status Approval</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeaveRequests.map(r => (
                      <tr key={r.id}>
                        <td>
                          <div className="name-cell">
                            <div className="n">{r.employee_name}</div>
                            <div className="d">{r.employee_code} · {r.department}</div>
                          </div>
                        </td>
                        <td><strong>{r.leave_type}</strong></td>
                        <td>{r.date_range}</td>
                        <td><span className="pill present">{r.total_days} Hari</span></td>
                        <td>
                          <button
                            onClick={() => setSelectedLeaveDetail(r)}
                            className="btn-mini"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <FileText size={13} /> Lihat Alasan
                          </button>
                        </td>
                        <td>
                          <span className={`pill ${r.status === 'approved' ? 'present' : r.status === 'rejected' ? 'absent' : 'leave'}`}>
                            {r.status === 'approved' ? 'Disetujui' : r.status === 'rejected' ? 'Ditolak' : 'Menunggu Review'}
                          </span>
                        </td>
                        <td>
                          {r.status === 'pending' ? (
                            <>
                              <button onClick={() => handleApproveLeave(r.id, r.employee_name)} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                              <button onClick={() => handleRejectLeave(r.id, r.employee_name)} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}><X size={13} /> Tolak</button>
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Selesai</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* TAB 6: APPROVAL SLIP GAJI */}
            {activeTab === 'approval' && (
              <>
                <h2>Approval Slip Gaji — {formatIndonesianMonthYear(currentDateTime)}</h2>
                <p className="sub">Review komponen rincian gaji karyawan (Gaji Pokok & Tunjangan terdaftar) sebelum diterbitkan sebagai dokumen PDF</p>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--line)', marginBottom: 20, paddingBottom: 0 }}>
                  <div className="tab-nav-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    <button
                      onClick={() => setApprovalFilterStatus('all')}
                      className={`tab-nav-btn ${approvalFilterStatus === 'all' ? 'active' : ''}`}
                    >
                      Semua Slip ({payslips.length})
                    </button>
                    <button
                      onClick={() => setApprovalFilterStatus('draft')}
                      className={`tab-nav-btn ${approvalFilterStatus === 'draft' ? 'active' : ''}`}
                    >
                      Draft Menunggu Review ({payslips.filter(p => p.status === 'draft').length})
                    </button>
                    <button
                      onClick={() => setApprovalFilterStatus('approved')}
                      className={`tab-nav-btn ${approvalFilterStatus === 'approved' ? 'active' : ''}`}
                    >
                      Sudah Disetujui ({payslips.filter(p => p.status === 'approved').length})
                    </button>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Absensi (H/T/I/A)</th>
                      <th>Gaji Pokok & Tunjangan</th>
                      <th>Take Home Pay (THP)</th>
                      <th>Status Slip</th>
                      <th>Aksi Approval & Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.filter(p => {
                      if (approvalFilterStatus === 'all') return true;
                      return p.status === approvalFilterStatus;
                    }).map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="name-cell"><div className="n">{p.employee_name}</div><div className="d">{p.department}</div></div>
                        </td>
                        <td>{p.attendance_summary}</td>
                        <td>
                          <div>{p.basic_salary}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>+ {p.allowances}</div>
                        </td>
                        <td><strong style={{ color: 'var(--primary-dark)', fontSize: 14 }}>{p.net_salary}</strong></td>
                        <td>
                          <span className={`pill ${p.status === 'approved' ? 'approved' : 'draft'}`}>
                            {p.status === 'approved' ? 'Disetujui' : 'Draft'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => setSelectedPayslipDetail(p)} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Eye size={13} /> Rincian Gaji
                            </button>

                            {p.status === 'draft' ? (
                              <button onClick={() => handleApprovePayslip(p.id, p.employee_name)} className="btn-mini primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Approve</button>
                            ) : (
                              <button onClick={() => handleDownloadPDF(p.id, p.employee_name)} className="btn-mini" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FileText size={13} /> PDF</button>
                            )}
                          </div>
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

            {/* TAB 7: PENANDAAN PEMBAYARAN */}
            {activeTab === 'payment' && (
              <>
                <h2>Penandaan Pembayaran Gaji — {formatIndonesianMonthYear(currentDateTime)}</h2>
                <p className="sub">Slip berstatus "Disetujui" yang telah ditransfer manual melalui Internet Banking</p>
                <div className="error-banner" style={{ background: '#FDF1DC', borderColor: '#F0DBA6', color: '#7A5A0F', padding: 14, borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <ShieldAlert size={18} color="#7A5A0F" />
                  <div>
                    Sistem <strong>tidak melakukan transfer otomatis</strong>. Lakukan transfer bank perusahaan terlebih dahulu, lalu tandai status pembayaran di bawah ini.
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid var(--line)', marginBottom: 20, paddingBottom: 0 }}>
                  <div className="tab-nav-bar" style={{ marginBottom: 0, borderBottom: 'none' }}>
                    <button
                      onClick={() => setPaymentFilterStatus('all')}
                      className={`tab-nav-btn ${paymentFilterStatus === 'all' ? 'active' : ''}`}
                    >
                      Semua Gaji ({payslips.length})
                    </button>
                    <button
                      onClick={() => setPaymentFilterStatus('unpaid')}
                      className={`tab-nav-btn ${paymentFilterStatus === 'unpaid' ? 'active' : ''}`}
                    >
                      Menunggu Pembayaran ({payslips.filter(p => !p.is_paid).length})
                    </button>
                    <button
                      onClick={() => setPaymentFilterStatus('paid')}
                      className={`tab-nav-btn ${paymentFilterStatus === 'paid' ? 'active' : ''}`}
                    >
                      Sudah Dibayar ({payslips.filter(p => p.is_paid).length})
                    </button>
                  </div>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Karyawan</th>
                      <th>Take Home Pay (THP)</th>
                      <th>No. Rekening Tujuan</th>
                      <th>Status Pembayaran</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.filter(p => {
                      if (paymentFilterStatus === 'all') return true;
                      if (paymentFilterStatus === 'unpaid') return !p.is_paid;
                      if (paymentFilterStatus === 'paid') return p.is_paid;
                      return true;
                    }).map(p => (
                      <tr key={p.id}>
                        <td>
                          <div className="name-cell"><div className="n">{p.employee_name}</div><div className="d">{p.department}</div></div>
                        </td>
                        <td><strong style={{ fontSize: 14, color: 'var(--primary-dark)' }}>{p.net_salary}</strong></td>
                        <td><strong>{p.bank_account}</strong></td>
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

      {/* MODAL 1: FORM TAMBAH KARYAWAN BARU */}
      {isAddEmployeeModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 580, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Space Grotesk' }}>Tambah Karyawan Baru</h3>
              </div>
              <button onClick={() => setIsAddEmployeeModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>KODE NIK KARYAWAN</label>
                <input
                  type="text"
                  value={newEmpCode}
                  onChange={(e) => setNewEmpCode(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>NAMA LENGKAP</label>
                <input
                  type="text"
                  placeholder="Contoh: Andi Pratama"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>DEPARTEMEN</label>
                <select
                  value={newEmpDept}
                  onChange={(e) => setNewEmpDept(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: '#fff' }}
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Sales">Sales</option>
                  <option value="HR & GA">HR & GA</option>
                  <option value="Finance">Finance</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>JABATAN</label>
                <input
                  type="text"
                  placeholder="Contoh: Frontend Developer"
                  value={newEmpPos}
                  onChange={(e) => setNewEmpPos(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--primary-dark)' }}>PENETAPAN GAJI POKOK (RP)</label>
                <input
                  type="number"
                  placeholder="8500000"
                  value={newEmpSalary}
                  onChange={(e) => setNewEmpSalary(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--primary)', fontSize: 13, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4, color: 'var(--primary-dark)' }}>TUNJANGAN TRANSPORT & MAKAN (RP)</label>
                <input
                  type="number"
                  placeholder="1000000"
                  value={newEmpAllowance}
                  onChange={(e) => setNewEmpAllowance(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px solid var(--primary)', fontSize: 13, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>NAMA BANK REKENING</label>
                <select
                  value={newEmpBank}
                  onChange={(e) => setNewEmpBank(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, background: '#fff' }}
                >
                  <option value="BCA">BCA</option>
                  <option value="Mandiri">Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                  <option value="CIMB Niaga">CIMB Niaga</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 4 }}>NO. REKENING TUJUAN</label>
                <input
                  type="text"
                  placeholder="8801998877"
                  value={newEmpAccountNo}
                  onChange={(e) => setNewEmpAccountNo(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>PENEMPATAN KANTOR CABANG GEOFENCE</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {officeLocations.map(off => {
                  const isChecked = newEmpPlacements.includes(off.name);
                  return (
                    <label key={off.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewEmpPlacements([...newEmpPlacements, off.name]);
                          } else {
                            setNewEmpPlacements(newEmpPlacements.filter(p => p !== off.name));
                          }
                        }}
                        style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                      />
                      <span><strong>{off.name}</strong> ({off.address})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <button onClick={() => setIsAddEmployeeModalOpen(false)} className="btn-mini">Batal</button>
              <button onClick={handleAddEmployeeSubmit} className="btn-mini primary" style={{ padding: '10px 18px', fontWeight: 700 }}>
                Simpan & Daftarkan Karyawan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ATUR GAJI & PENEMPATAN KARYAWAN EXIST */}
      {isEditSalaryModalOpen && editingSalaryEmp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 520, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1.5px solid var(--line)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarSign size={20} color="var(--primary)" />
                <h3 style={{ margin: 0, fontSize: 18, fontFamily: 'Space Grotesk' }}>Edit Penetapan Gaji & Cabang</h3>
              </div>
              <button onClick={() => setIsEditSalaryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 16, background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{editingSalaryEmp.name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{editingSalaryEmp.code} · {editingSalaryEmp.department} ({editingSalaryEmp.position})</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>GAJI POKOK</label>
                <input
                  type="text"
                  value={editBasicSalary}
                  onChange={(e) => setEditBasicSalary(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4 }}>TUNJANGAN</label>
                <input
                  type="text"
                  value={editAllowances}
                  onChange={(e) => setEditAllowances(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 13, fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 6 }}>PENEMPATAN KANTOR CABANG (MULTI-PLACEMENT)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {officeLocations.map(off => {
                  const isSelected = (selectedPlacements || []).includes(off.name);
                  return (
                    <label key={off.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const current = selectedPlacements || [];
                          if (e.target.checked) {
                            setSelectedPlacements([...current, off.name]);
                          } else {
                            setSelectedPlacements(current.filter(p => p !== off.name));
                          }
                        }}
                        style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
                      />
                      <span><strong>{off.name}</strong> ({off.address})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
              <button onClick={() => setIsEditSalaryModalOpen(false)} className="btn-mini">Batal</button>
              <button
                onClick={() => {
                  const formattedBasic = editBasicSalary.startsWith('Rp') ? editBasicSalary : formatRupiah(editBasicSalary);
                  const formattedAllow = editAllowances.startsWith('Rp') ? editAllowances : formatRupiah(editAllowances);

                  setEmployees(prev => prev.map(e => e.id === editingSalaryEmp.id ? {
                    ...e,
                    basic_salary: formattedBasic,
                    allowances: formattedAllow,
                    office_placements: selectedPlacements || []
                  } : e));

                  // Also update their active draft payslip if exists
                  setPayslips(prev => prev.map(p => p.employee_name === editingSalaryEmp.name ? {
                    ...p,
                    basic_salary: formattedBasic,
                    allowances: formattedAllow,
                    net_salary: formattedBasic
                  } : p));

                  setIsEditSalaryModalOpen(false);
                  showToast(`Penetapan gaji & cabang ${editingSalaryEmp.name} BERHASIL DIPERBARUI!`);
                }}
                className="btn-mini primary"
                style={{ padding: '8px 16px' }}
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INTERACTIVE SELFIE PHOTO & GPS ZOOM MODAL - MOBILE THEME ALIGNED */}
      {selectedPhotoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#FFF', borderRadius: 16, maxWidth: 640, width: '100%', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1.5px solid #2F6F5E' }}>
            <div style={{ padding: '16px 20px', background: '#2F6F5E', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #245749' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 16, fontFamily: 'Space Grotesk' }}>Verifikasi Foto Selfie Absen Masuk & Keluar</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{selectedPhotoModal.employee_name} ({selectedPhotoModal.employee_code}) · {selectedPhotoModal.date}</div>
              </div>
              <button onClick={() => setSelectedPhotoModal(null)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: 20, background: '#FBF9F5' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* Clock In Photo Box */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, background: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#166534', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Foto Selfie Absen Masuk
                  </div>
                  <div style={{ height: 190, borderRadius: 8, overflow: 'hidden', background: '#E2E8F0', marginBottom: 10, border: '1px solid #E2E8F0' }}>
                    <img src={selectedPhotoModal.clock_in_photo} alt="Selfie Masuk" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>Jam: {selectedPhotoModal.clock_in_time}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Radius: {selectedPhotoModal.clock_in_distance}</div>
                </div>

                {/* Clock Out Photo Box */}
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 12, padding: 12, background: '#FFFFFF', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#B91C1C', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    Foto Selfie Absen Keluar
                  </div>
                  <div style={{ height: 190, borderRadius: 8, overflow: 'hidden', background: '#E2E8F0', marginBottom: 10, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {selectedPhotoModal.clock_out_photo ? (
                      <img src={selectedPhotoModal.clock_out_photo} alt="Selfie Keluar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 12, padding: 10 }}>
                        ⏳ Belum Absen Keluar
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink)', fontWeight: 600 }}>Jam: {selectedPhotoModal.clock_out_time}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>Radius: {selectedPhotoModal.clock_out_distance}</div>
                </div>
              </div>

              <div style={{ background: selectedPhotoModal.status === 'valid' ? '#F0FDF4' : '#FEF2F2', borderRadius: 12, padding: 14, border: `1px solid ${selectedPhotoModal.status === 'valid' ? '#BBF7D0' : '#FECACA'}`, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Penempatan Kantor Cabang:</span>
                  <strong style={{ fontSize: 13, color: 'var(--ink)' }}>{selectedPhotoModal.office_name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Status Validasi Geofence & GPS:</span>
                  <span className={`pill ${selectedPhotoModal.status === 'valid' ? 'present' : 'absent'}`} style={{ fontWeight: 700, fontSize: 11 }}>
                    {selectedPhotoModal.status === 'valid' ? '✓ Valid Dalam Radius' : '⚠️ Ditolak (Luar Radius)'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedPhotoModal(null)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 10,
                  background: '#2F6F5E',
                  color: '#FFFFFF',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: 14,
                  fontFamily: 'Space Grotesk',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(47,111,94,0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                Tutup Pratinjau Foto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PAYSLIP RINCIAN GAJI DETAIL BREAKDOWN MODAL */}
      {selectedPayslipDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 480, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'Space Grotesk' }}>Rincian Slip Gaji Karyawan</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Periode {formatIndonesianMonthYear(currentDateTime)}</div>
              </div>
              <button onClick={() => setSelectedPayslipDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 16, background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>{selectedPayslipDetail.employee_name}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedPayslipDetail.department} · {selectedPayslipDetail.bank_account}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>Gaji Pokok Terdaftar:</span>
                <strong>{selectedPayslipDetail.basic_salary}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ color: 'var(--muted)' }}>Tunjangan Transport & Makan:</span>
                <strong>{selectedPayslipDetail.allowances}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#C24A3B' }}>
                <span>Potongan Keterlambatan:</span>
                <strong>{selectedPayslipDetail.deductions}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', borderTop: '2px dashed var(--line)', background: '#DCFCE7', borderRadius: 8, color: '#166534', fontWeight: 800, fontSize: 15 }}>
                <span>TAKE HOME PAY (THP)</span>
                <span>{selectedPayslipDetail.net_salary}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setSelectedPayslipDetail(null)} className="btn-mini">Tutup</button>
              {selectedPayslipDetail.status === 'draft' ? (
                <button
                  onClick={() => {
                    handleApprovePayslip(selectedPayslipDetail.id, selectedPayslipDetail.employee_name);
                    setSelectedPayslipDetail(null);
                  }}
                  className="btn-mini primary"
                >
                  <Check size={14} /> Approve Gaji Ini
                </button>
              ) : (
                <button onClick={() => handleDownloadPDF(selectedPayslipDetail.id, selectedPayslipDetail.employee_name)} className="btn-mini dark">
                  <FileText size={14} /> Cetak PDF
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: LEAVE REQUEST REASON & ATTACHMENT MODAL */}
      {selectedLeaveDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, maxWidth: 500, width: '100%', padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontFamily: 'Space Grotesk' }}>Detail Pengajuan Izin</h3>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{selectedLeaveDetail.employee_name} ({selectedLeaveDetail.employee_code})</div>
              </div>
              <button onClick={() => setSelectedLeaveDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ marginBottom: 16, background: '#F8FAFC', padding: 12, borderRadius: 10, border: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Jenis Izin:</span>
                <strong style={{ fontSize: 13 }}>{selectedLeaveDetail.leave_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>Periode:</span>
                <strong style={{ fontSize: 13 }}>{selectedLeaveDetail.date_range} ({selectedLeaveDetail.total_days} Hari)</strong>
              </div>
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--line)' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Alasan Karyawan:</div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink)', lineHeight: 1.5 }}>"{selectedLeaveDetail.reason}"</p>
              </div>
            </div>

            {selectedLeaveDetail.document_url && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>Lampiran Surat Keterangan / Dokumen:</div>
                <div style={{ height: 160, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)' }}>
                  <img src={selectedLeaveDetail.document_url} alt="Lampiran" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => setSelectedLeaveDetail(null)} className="btn-mini">Tutup</button>
              {selectedLeaveDetail.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleRejectLeave(selectedLeaveDetail.id, selectedLeaveDetail.employee_name);
                      setSelectedLeaveDetail(null);
                    }}
                    className="btn-mini"
                    style={{ background: '#FBEEEC', color: '#8A3226', borderColor: '#F0C7C0' }}
                  >
                    Tolak Izin
                  </button>
                  <button
                    onClick={() => {
                      handleApproveLeave(selectedLeaveDetail.id, selectedLeaveDetail.employee_name);
                      setSelectedLeaveDetail(null);
                    }}
                    className="btn-mini primary"
                  >
                    Approve Izin
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
