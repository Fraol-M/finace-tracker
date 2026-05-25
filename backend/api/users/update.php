<?php
/*
 PUT /api/users/update
 Update a user's profile (admin only).
 */

require_once __DIR__ . '/../../middleware/auth.php';

$admin = requireAdmin();

$body = getJsonBody();

$userId   = trim($body['id'] ?? '');
$username = trim($body['username'] ?? '');
$fullName = trim($body['fullName'] ?? '');
$email    = trim($body['email'] ?? '');
$phone    = trim($body['phone'] ?? '-');

if ($userId === '') {
    errorResponse('User ID is required', 400);
}
if ($username === '' || preg_match('/\s/', $username)) {
    errorResponse('Valid username without spaces is required', 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    errorResponse('Valid email is required', 400);
}

$db = getDB();

// Check if user exists
$stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);
if (!$stmt->fetch()) {
    errorResponse('User not found', 404);
}

// Check unique constraints (exclude current user)
$stmt = $db->prepare('
    SELECT id FROM users
    WHERE (LOWER(username) = LOWER(:username) OR LOWER(email) = LOWER(:email))
    AND id != :id
    LIMIT 1
');
$stmt->execute([':username' => $username, ':email' => $email, ':id' => $userId]);
if ($stmt->fetch()) {
    errorResponse('Username or email already taken by another user', 409);
}

// Update
$stmt = $db->prepare('
    UPDATE users SET username = :username, full_name = :full_name, email = :email, phone = :phone
    WHERE id = :id
');
$stmt->execute([
    ':username'  => $username,
    ':full_name' => $fullName ?: 'No Name',
    ':email'     => $email,
    ':phone'     => $phone ?: '-',
    ':id'        => $userId,
]);

successResponse([
    'id'       => $userId,
    'username' => $username,
    'fullName' => $fullName ?: 'No Name',
    'email'    => $email,
    'phone'    => $phone ?: '-',
], 'User updated');
