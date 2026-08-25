-- name: GetUserByEmail :one
SELECT u.id, u.company_id, u.role_id, r.code as role_code, u.email, u.password_hash, u.phone, u.status, u.created_at, u.updated_at
FROM "user" u
JOIN role r ON r.id = u.role_id
WHERE u.email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT u.id, u.company_id, u.role_id, r.code as role_code, u.email, u.phone, u.status, u.created_at, u.updated_at
FROM "user" u
JOIN role r ON r.id = u.role_id
WHERE u.id = $1 LIMIT 1;

-- name: CreateUser :one
INSERT INTO "user" (
  company_id, role_id, email, password_hash, phone, status
) VALUES (
  $1, $2, $3, $4, $5, $6
)
RETURNING id, company_id, role_id, email, phone, status, created_at;

-- name: GetRoleByCode :one
SELECT id, code, name, permissions
FROM role
WHERE code = $1 LIMIT 1;

-- name: ListRoles :many
SELECT id, code, name, permissions
FROM role
ORDER BY name ASC;
