<?php
/**
 * POST /api/auth/signup
 * Register a new user account.
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../helpers/response.php';

$body = getJsonBody();

$fullName = trim($body['fullName'] ?? '');
$username = trim($body['username'] ?? '');
$email    = trim($body['email'] ?? '');
$phone    = trim($body['phone'] ?? '-');
$password = $body['password'] ?? '';

// Validation
if ($fullName === '') {
    errorResponse('Full name is required', 400);
}
if ($username === '' || preg_match('/\s/', $username)) {
    errorResponse('Valid username without spaces is required', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Valid email is required', 400);
}
if (strlen($password) < 8 || !preg_match('/[0-9]/', $password) || !preg_match('/[!@#$%^&*(),.?":{}|<>]/', $password)) {
    errorResponse('Password must be 8+ chars with at least 1 number and 1 special character', 400);
}

$db = getDB();

// Check for duplicate username or email
$stmt = $db->prepare('
    SELECT id FROM users
    WHERE LOWER(username) = LOWER(:username) OR LOWER(email) = LOWER(:email)
    LIMIT 1
');
$stmt->execute([':username' => $username, ':email' => $email]);

if ($stmt->fetch()) {
    errorResponse('Username or email already exists', 409);
}

// Create user
$userId = 'u_' . time() . '_' . bin2hex(random_bytes(4));
$passwordHash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $db->prepare('
    INSERT INTO users (id, username, full_name, email, phone, role, password_hash)
    VALUES (:id, :username, :full_name, :email, :phone, :role, :password_hash)
');
$stmt->execute([
    ':id'            => $userId,
    ':username'      => $username,
    ':full_name'     => $fullName,
    ':email'         => $email,
    ':phone'         => $phone ?: '-',
    ':role'          => 'user',
    ':password_hash' => $passwordHash,
]);

successResponse([
    'user' => [
        'id'       => $userId,
        'username' => $username,
        'fullName' => $fullName,
        'email'    => $email,
        'phone'    => $phone ?: '-',
        'role'     => 'user',
    ]
], 'Account created successfully', 201);
