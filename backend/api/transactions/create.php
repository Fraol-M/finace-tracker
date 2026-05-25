<?php
/*
 POST /api/transactions
 Create a new transaction for the authenticated user.
 */

require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

$body = getJsonBody();

$title    = trim($body['title'] ?? '');
$amount   = $body['amount'] ?? null;
$category = trim($body['category'] ?? '');
$date     = trim($body['date'] ?? '');
$type     = trim($body['type'] ?? '');
$icon     = trim($body['icon'] ?? '');

if ($title === '' || $amount === null || $category === '' || $date === '' || $type === '') {
    errorResponse('Title, amount, category, date, and type are required', 400);
}

if (!in_array($type, ['income', 'expense'])) {
    errorResponse('Type must be "income" or "expense"', 400);
}

$db = getDB();

$stmt = $db->prepare('
    INSERT INTO transactions (uid, title, amount, category, date, type, icon)
    VALUES (:uid, :title, :amount, :category, :date, :type, :icon)
');
$stmt->execute([
    ':uid'      => $user['id'],
    ':title'    => $title,
    ':amount'   => (float)$amount,
    ':category' => $category,
    ':date'     => $date,
    ':type'     => $type,
    ':icon'     => $icon,
]);

$newId = (int)$db->lastInsertId();

successResponse([
    'id'       => $newId,
    'uid'      => $user['id'],
    'title'    => $title,
    'amount'   => (float)$amount,
    'category' => $category,
    'date'     => $date,
    'type'     => $type,
    'icon'     => $icon,
], 'Transaction created', 201);
