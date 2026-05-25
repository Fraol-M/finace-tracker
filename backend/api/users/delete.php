<?php



require_once __DIR__ . '/../../middleware/auth.php';

$admin = requireAdmin();

$body = getJsonBody();
$userId = trim($body['id'] ?? '');

if ($userId === '') {
    errorResponse('User ID is required', 400);
}


if ($userId === $admin['id']) {
    errorResponse('Cannot delete your own admin account', 400);
}

$db = getDB();


$stmt = $db->prepare('SELECT id FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);
if (!$stmt->fetch()) {
    errorResponse('User not found', 404);
}


$stmt = $db->prepare('DELETE FROM users WHERE id = :id');
$stmt->execute([':id' => $userId]);

successResponse(null, 'User deleted');
