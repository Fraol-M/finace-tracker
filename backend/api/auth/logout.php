<?php
/*
 POST /api/auth/logout
 Invalidate the current auth token.
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

// Extract token from header
$header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
preg_match('/^Bearer\s+(.+)$/i', $header, $matches);
$token = $matches[1];

$db = getDB();
$stmt = $db->prepare('DELETE FROM auth_tokens WHERE token = :token');
$stmt->execute([':token' => $token]);

successResponse(null, 'Logged out successfully');
