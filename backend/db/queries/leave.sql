-- name: CreateLeaveType :one
INSERT INTO leave_type (company_id, name, is_paid, quota_per_year)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: ListLeaveTypes :many
SELECT * FROM leave_type
WHERE company_id = $1
ORDER BY name ASC;

-- name: CreateLeaveRequest :one
INSERT INTO leave_request (
  employee_id, leave_type_id, start_date, end_date, reason, attachment_url, status
) VALUES (
  $1, $2, $3, $4, $5, $6, 'pending'
)
RETURNING *;

-- name: ListLeaveRequestsByEmployee :many
SELECT lr.*, lt.name as leave_type_name, lt.is_paid
FROM leave_request lr
JOIN leave_type lt ON lt.id = lr.leave_type_id
WHERE lr.employee_id = $1
ORDER BY lr.created_at DESC;

-- name: ListPendingLeaveRequestsForManager :many
SELECT lr.*, e.full_name as employee_name, e.employee_code, lt.name as leave_type_name
FROM leave_request lr
JOIN employee e ON e.id = lr.employee_id
JOIN leave_type lt ON lt.id = lr.leave_type_id
WHERE e.manager_id = $1 AND lr.status = 'pending'
ORDER BY lr.created_at ASC;

-- name: UpdateLeaveRequestStatus :one
UPDATE leave_request
SET status = $2, approved_by = $3, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
WHERE id = $1
RETURNING *;
