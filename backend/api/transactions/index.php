<?php


require_once __DIR__ . '/../../middleware/auth.php';

$user = requireAuth();

$db = getDB();

$stmt = $db->prepare('
    SELECT id, uid, title, amount, category, date, type, icon
    FROM transactions
    WHERE uid = :uid
    ORDER BY date DESC, id DESC
');
$stmt->execute([':uid' => $user['id']]);
$rows = $stmt->fetchAll();

$transactions = array_map(function($row) {
    return [
        'id'       => (int)$row['id'],
        'uid'      => $row['uid'],
        'title'    => $row['title'],
        'amount'   => (float)$row['amount'],
        'category' => $row['category'],
        'date'     => $row['date'],
        'type'     => $row['type'],
        'icon'     => $row['icon'],
    ];
}, $rows);

successResponse($transactions, 'Transactions retrieved');
