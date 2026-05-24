<?php
/**
 * POST /api/auth/login
 * Authenticate user with username/email + password. Returns a bearer token.
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$body = getJsonBody();
$identifier = trim($body['identifier'] ?? '');
$password   = $body['password'] ?? '';

if ($identifier === '' || $password === '') {
    errorResponse('Username/email and password are required', 400);
}

$db = getDB();

// Find user by username or email (case-insensitive)
$stmt = $db->prepare('
    SELECT * FROM users
    WHERE LOWER(username) = LOWER(:id1) OR LOWER(email) = LOWER(:id2)
    LIMIT 1
');
$stmt->execute([':id1' => $identifier, ':id2' => $identifier]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    errorResponse('Invalid username/email or password', 401);
}

// Generate auth token
$token = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

$stmt = $db->prepare('
    INSERT INTO auth_tokens (user_id, token, expires_at)
    VALUES (:user_id, :token, :expires_at)
');
$stmt->execute([
    ':user_id'    => $user['id'],
    ':token'      => $token,
    ':expires_at' => $expiresAt,
]);

// Return user data (without password hash) + token
successResponse([
    'token' => $token,
    'user'  => [
        'id'           => $user['id'],
        'username'     => $user['username'],
        'fullName'     => $user['full_name'],
        'email'        => $user['email'],
        'phone'        => $user['phone'],
        'role'         => $user['role'],
        'isUnverified' => (bool)$user['is_unverified'],
    ]
], 'Login successful');
