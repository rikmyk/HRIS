// Shared Types Baseline for HRIS Frontend & Mobile

export type Role = 'EMP' | 'MGR' | 'HR' | 'SA';

export interface UserSession {
  id: string;
  email: string;
  role: Role;
  employeeId?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}
