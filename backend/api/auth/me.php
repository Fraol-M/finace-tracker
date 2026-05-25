<?php
/*
 GET /api/auth/me
 Validate current token and return user data.
 */

require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

successResponse([
    'user' => [
        'id'           => $user['id'],
        'username'     => $user['username'],
        'fullName'     => $user['full_name'],
        'email'        => $user['email'],
        'phone'        => $user['phone'],
        'role'         => $user['role'],
        'isUnverified' => $user['is_unverified'],
    ]
], 'Authenticated');
