-- name: GetEmployeeByUserID :one
SELECT e.id, e.user_id, e.department_id, d.name as department_name, 
       e.position_id, p.title as position_title, 
       e.office_location_id, o.name as office_location_name, o.latitude, o.longitude, o.radius_meters,
       e.manager_id, e.employee_code, e.full_name, e.join_date, e.employment_status, 
       e.bank_account_no, e.bank_name, e.created_at
FROM employee e
LEFT JOIN department d ON d.id = e.department_id
LEFT JOIN position p ON p.id = e.position_id
LEFT JOIN office_location o ON o.id = e.office_location_id
WHERE e.user_id = $1 LIMIT 1;

-- name: ListEmployees :many
SELECT e.id, e.user_id, e.employee_code, e.full_name, e.employment_status,
       d.name as department_name, p.title as position_title, o.name as office_location_name
FROM employee e
LEFT JOIN department d ON d.id = e.department_id
LEFT JOIN position p ON p.id = e.position_id
LEFT JOIN office_location o ON o.id = e.office_location_id
ORDER BY e.full_name ASC;

-- name: CreateEmployee :one
INSERT INTO employee (
  user_id, department_id, position_id, office_location_id, manager_id,
  employee_code, full_name, join_date, employment_status, bank_account_no, bank_name
) VALUES (
  $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
)
RETURNING *;
