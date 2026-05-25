<?php
/*
 PUT /api/transactions/update
 Update an existing transaction (must belong to authenticated user).
 */

require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

$body = getJsonBody();

$txId     = $body['id'] ?? null;
$title    = trim($body['title'] ?? '');
$amount   = $body['amount'] ?? null;
$category = trim($body['category'] ?? '');
$date     = trim($body['date'] ?? '');

if ($txId === null) {
    errorResponse('Transaction ID is required', 400);
}
if ($title === '' || $amount === null || $category === '' || $date === '') {
    errorResponse('Title, amount, category, and date are required', 400);
}

$db = getDB();

// Verify ownership
$stmt = $db->prepare('SELECT id, type FROM transactions WHERE id = :id AND uid = :uid');
$stmt->execute([':id' => (int)$txId, ':uid' => $user['id']]);
$existing = $stmt->fetch();

if (!$existing) {
    errorResponse('Transaction not found or access denied', 404);
}

$stmt = $db->prepare('
    UPDATE transactions
    SET title = :title, amount = :amount, category = :category, date = :date
    WHERE id = :id AND uid = :uid
');
$stmt->execute([
    ':title'    => $title,
    ':amount'   => (float)$amount,
    ':category' => $category,
    ':date'     => $date,
    ':id'       => (int)$txId,
    ':uid'      => $user['id'],
]);

successResponse([
    'id'       => (int)$txId,
    'uid'      => $user['id'],
    'title'    => $title,
    'amount'   => (float)$amount,
    'category' => $category,
    'date'     => $date,
    'type'     => $existing['type'],
], 'Transaction updated');
