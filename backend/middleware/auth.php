<?php
/*
 Auth middleware — validates Bearer token from the Authorization header.
 Sets $GLOBALS['auth_user'] with the authenticated user row.
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/response.php';

function requireAuth(): array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

    if (!preg_match('/^Bearer\s+(.+)$/i', $header, $matches)) {
        errorResponse('Authentication required', 401);
    }

    $token = $matches[1];
    $db = getDB();

    $stmt = $db->prepare('
        SELECT u.id, u.username, u.full_name, u.email, u.phone, u.role, u.is_unverified
        FROM auth_tokens t
        JOIN users u ON u.id = t.user_id
        WHERE t.token = :token AND t.expires_at > NOW()
    ');
    $stmt->execute([':token' => $token]);
    $user = $stmt->fetch();

    if (!$user) {
        errorResponse('Invalid or expired token', 401);
    }

    // Normalize boolean
    $user['is_unverified'] = (bool)$user['is_unverified'];

    return $user;
}

function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        errorResponse('Admin access required', 403);
    }
    return $user;
}
