-- name: CreateSalaryComponent :one
INSERT INTO salary_component (company_id, name, type, calculation_rule)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListSalaryComponents :many
SELECT * FROM salary_component
WHERE company_id = $1
ORDER BY name ASC;

-- name: UpsertEmployeeSalaryStructure :one
INSERT INTO employee_salary_structure (
  employee_id, base_salary, allowances, deduction_rules
) VALUES (
  $1, $2, $3, $4
)
ON CONFLICT (employee_id) DO UPDATE
SET base_salary = EXCLUDED.base_salary,
    allowances = EXCLUDED.allowances,
    deduction_rules = EXCLUDED.deduction_rules,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: GetEmployeeSalaryStructure :one
SELECT * FROM employee_salary_structure
WHERE employee_id = $1 LIMIT 1;

-- name: CreatePayrollPeriod :one
INSERT INTO payroll_period (company_id, period_start, period_end, cutoff_date, status)
VALUES ($1, $2, $3, $4, 'draft')
RETURNING *;

-- name: GetActivePayrollPeriod :one
SELECT * FROM payroll_period
WHERE company_id = $1 AND status IN ('draft', 'processing')
ORDER BY created_at DESC LIMIT 1;

-- name: CreatePayslip :one
INSERT INTO payslip (
  payroll_period_id, employee_id, total_present, total_late, total_leave, total_absent,
  gross_salary, total_deduction, net_salary, status
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft'
)
ON CONFLICT (payroll_period_id, employee_id) DO UPDATE
SET total_present = EXCLUDED.total_present,
    total_late = EXCLUDED.total_late,
    total_leave = EXCLUDED.total_leave,
    total_absent = EXCLUDED.total_absent,
    gross_salary = EXCLUDED.gross_salary,
    total_deduction = EXCLUDED.total_deduction,
    net_salary = EXCLUDED.net_salary,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- name: CreatePayslipDetail :one
INSERT INTO payslip_detail (
  payslip_id, salary_component_id, component_name, component_type, amount
) VALUES (
  $1, $2, $3, $4, $5
)
RETURNING *;

-- name: ListPayslipsByPeriod :many
SELECT p.*, e.full_name as employee_name, e.employee_code, d.name as department_name
FROM payslip p
JOIN employee e ON e.id = p.employee_id
LEFT JOIN department d ON d.id = e.department_id
WHERE p.payroll_period_id = $1
ORDER BY e.full_name ASC;

-- name: GetPayslipByEmployeeAndPeriod :one
SELECT p.*, pp.period_start, pp.period_end
FROM payslip p
JOIN payroll_period pp ON pp.id = p.payroll_period_id
WHERE p.employee_id = $1 AND p.payroll_period_id = $2 LIMIT 1;

-- name: ListPayslipDetails :many
SELECT * FROM payslip_detail
WHERE payslip_id = $1
ORDER BY component_type ASC, component_name ASC;
