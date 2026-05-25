<?php


require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/database.php';

$user = requireAuth();

$month = trim((string)($_GET['month'] ?? ''));
if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
    errorResponse('Month query parameter is required in YYYY-MM format', 400);
}

$db = getDB();

try {
    $stmt = $db->prepare('
        SELECT id, month, monthly_income, rent, utilities, transportation, food, insurance,
               subscriptions, other_bills, savings_goal, has_vacation, vacation_budget,
               ai_recommendations, spending_calendar, created_at, updated_at
        FROM budget_plans
        WHERE user_id = :user_id AND month = :month
        LIMIT 1
    ');
    $stmt->execute([':user_id' => $user['id'], ':month' => $month]);
    $row = $stmt->fetch();

    if (!$row) {
        errorResponse('Budget plan not found', 404);
    }
} catch (PDOException $e) {
    $msg = $e->getMessage();
    if (stripos($msg, 'budget_plans') !== false) {
        errorResponse('Budget table missing. Run backend/setup.php to create it.', 500);
    }
    errorResponse('Database error: ' . $msg, 500);
}

$plan = [
    'id' => (int)$row['id'],
    'month' => $row['month'],
    'monthlyIncome' => (float)$row['monthly_income'],
    'bills' => [
        'rent' => (float)$row['rent'],
        'utilities' => (float)$row['utilities'],
        'transportation' => (float)$row['transportation'],
        'food' => (float)$row['food'],
        'insurance' => (float)$row['insurance'],
        'subscriptions' => (float)$row['subscriptions'],
        'otherBills' => (float)$row['other_bills'],
    ],
    'savingsGoal' => (float)$row['savings_goal'],
    'hasVacation' => (bool)$row['has_vacation'],
    'vacationBudget' => (float)$row['vacation_budget'],
    'createdAt' => $row['created_at'],
    'updatedAt' => $row['updated_at'],
];

$recommendations = json_decode($row['ai_recommendations'] ?? '', true);
$calendar = json_decode($row['spending_calendar'] ?? '', true);

successResponse([
    'budgetPlan' => $plan,
    'aiRecommendations' => $recommendations,
    'calendar' => $calendar,
], 'Budget plan retrieved');
