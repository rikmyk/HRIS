-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. COMPANY
CREATE TABLE company (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Jakarta',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. OFFICE_LOCATION
CREATE TABLE office_location (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    latitude NUMERIC(10, 8) NOT NULL,
    longitude NUMERIC(11, 8) NOT NULL,
    radius_meters INT NOT NULL DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. DEPARTMENT
CREATE TABLE department (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. POSITION
CREATE TABLE position (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES department(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. ROLE
CREATE TABLE role (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- EMP, MGR, HR, SA
    name VARCHAR(100) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. USER
CREATE TABLE "user" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. EMPLOYEE
CREATE TABLE employee (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    department_id UUID REFERENCES department(id) ON DELETE SET NULL,
    position_id UUID REFERENCES position(id) ON DELETE SET NULL,
    office_location_id UUID REFERENCES office_location(id) ON DELETE SET NULL,
    manager_id UUID REFERENCES employee(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    join_date DATE NOT NULL,
    employment_status VARCHAR(50) NOT NULL DEFAULT 'permanent', -- permanent, contract, intern
    bank_account_no VARCHAR(100),
    bank_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. ATTENDANCE_RECORD
CREATE TABLE attendance_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_in_lat NUMERIC(10, 8),
    clock_in_lng NUMERIC(11, 8),
    clock_in_photo_url TEXT,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_out_lat NUMERIC(10, 8),
    clock_out_lng NUMERIC(11, 8),
    clock_out_photo_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'present', -- present, late, early_leave, absent, on_leave, sick, holiday
    late_minutes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

-- 9. ATTENDANCE_REJECTED_LOG
CREATE TABLE attendance_rejected_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    device_id VARCHAR(255),
    attempted_lat NUMERIC(10, 8) NOT NULL,
    attempted_lng NUMERIC(11, 8) NOT NULL,
    distance_meters NUMERIC(10, 2) NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. LEAVE_TYPE
CREATE TABLE leave_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT true,
    quota_per_year INT NOT NULL DEFAULT 12,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. LEAVE_REQUEST
CREATE TABLE leave_request (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    leave_type_id UUID NOT NULL REFERENCES leave_type(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    attachment_url TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by UUID REFERENCES employee(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. SALARY_COMPONENT
CREATE TABLE salary_component (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- allowance, deduction
    calculation_rule VARCHAR(100) NOT NULL DEFAULT 'fixed', -- fixed, percentage, formula
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. EMPLOYEE_SALARY_STRUCTURE
CREATE TABLE employee_salary_structure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID UNIQUE NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    base_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    allowances JSONB NOT NULL DEFAULT '[]'::jsonb,
    deduction_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. PAYROLL_PERIOD
CREATE TABLE payroll_period (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    cutoff_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, processing, review, approved, completed
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. PAYSLIP
CREATE TABLE payslip (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES payroll_period(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    total_present INT NOT NULL DEFAULT 0,
    total_late INT NOT NULL DEFAULT 0,
    total_leave INT NOT NULL DEFAULT 0,
    total_absent INT NOT NULL DEFAULT 0,
    gross_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, approved, rejected
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    pdf_url TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    paid_date DATE,
    payment_reference VARCHAR(100),
    marked_paid_by UUID REFERENCES "user"(id) ON DELETE SET NULL,
    marked_paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_employee_payroll_period UNIQUE (payroll_period_id, employee_id)
);

-- 16. PAYSLIP_DETAIL
CREATE TABLE payslip_detail (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payslip_id UUID NOT NULL REFERENCES payslip(id) ON DELETE CASCADE,
    salary_component_id UUID REFERENCES salary_component(id) ON DELETE SET NULL,
    component_name VARCHAR(100) NOT NULL,
    component_type VARCHAR(50) NOT NULL, -- allowance, deduction
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. PAYSLIP_APPROVAL_LOG
CREATE TABLE payslip_approval_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payslip_id UUID NOT NULL REFERENCES payslip(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES "user"(id),
    action VARCHAR(50) NOT NULL, -- review, approve, reject, mark_paid
    notes TEXT,
    acted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. NOTIFICATION
CREATE TABLE notification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. AUDIT_LOG
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES "user"(id) ON DELETE SET NULL,
    entity VARCHAR(100) NOT NULL,
    entity_id UUID,
    action VARCHAR(50) NOT NULL, -- create, update, delete, approve, mark_paid
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES for Performance
CREATE INDEX idx_user_company_email ON "user"(company_id, email);
CREATE INDEX idx_employee_company ON employee(user_id, department_id, office_location_id);
CREATE INDEX idx_attendance_employee_date ON attendance_record(employee_id, attendance_date);
CREATE INDEX idx_leave_request_employee ON leave_request(employee_id, status);
CREATE INDEX idx_payslip_period_employee ON payslip(payroll_period_id, employee_id, status);
CREATE INDEX idx_audit_log_entity ON audit_log(entity, entity_id);

-- SEED ROLES
INSERT INTO role (code, name, permissions) VALUES
('EMP', 'Employee', '{"attendance": ["read", "create"], "leave": ["read", "create"], "payslip": ["read"]}'::jsonb),
('MGR', 'Manager', '{"attendance": ["read"], "leave": ["read", "approve", "reject"], "payslip": ["read"]}'::jsonb),
('HR', 'HR Admin', '{"employee": ["all"], "attendance": ["all"], "leave": ["all"], "payroll": ["all"], "payslip": ["all"]}'::jsonb),
('SA', 'Super Admin', '{"*": ["all"]}'::jsonb)
ON CONFLICT (code) DO NOTHING;

-- SEED DEFAULT COMPANY
INSERT INTO company (id, name, timezone) VALUES
('00000000-0000-0000-0000-000000000001', 'PT HRIS Nusantara Tech', 'Asia/Jakarta')
ON CONFLICT (id) DO NOTHING;
