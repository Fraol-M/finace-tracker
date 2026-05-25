<?php



require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

$body = getJsonBody();
$txId = $body['id'] ?? null;

if ($txId === null) {
    errorResponse('Transaction ID is required', 400);
}

$db = getDB();


$stmt = $db->prepare('SELECT id FROM transactions WHERE id = :id AND uid = :uid');
$stmt->execute([':id' => (int)$txId, ':uid' => $user['id']]);

if (!$stmt->fetch()) {
    errorResponse('Transaction not found or access denied', 404);
}

$stmt = $db->prepare('DELETE FROM transactions WHERE id = :id AND uid = :uid');
$stmt->execute([':id' => (int)$txId, ':uid' => $user['id']]);

successResponse(null, 'Transaction deleted');
