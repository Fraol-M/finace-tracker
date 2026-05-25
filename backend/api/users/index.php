<?php



require_once __DIR__ . '/../../middleware/auth.php';

$admin = requireAdmin();

$db = getDB();
$stmt = $db->query('SELECT id, username, full_name, email, phone, role, is_unverified FROM users ORDER BY created_at ASC');
$rows = $stmt->fetchAll();

$users = array_map(function($row) {
    return [
        'id'           => $row['id'],
        'username'     => $row['username'],
        'fullName'     => $row['full_name'],
        'email'        => $row['email'],
        'phone'        => $row['phone'],
        'role'         => $row['role'],
        'isUnverified' => (bool)$row['is_unverified'],
    ];
}, $rows);

successResponse($users, 'Users retrieved');
