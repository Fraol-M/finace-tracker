<?php


require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/budget.php';
require_once __DIR__ . '/../../config/database.php';

$user = requireAuth();
$body = getJsonBody();

$input = parseBudgetPayload($body);
$summary = computeBudgetSummary($input);
$analysis = generateBudgetAnalysis($input, $summary);

$recommendations = array_merge($summary, [
    'insights' => $analysis['insights']
]);

$db = getDB();

try {
    $stmt = $db->prepare('
        INSERT INTO budget_plans (
            user_id, month, monthly_income, rent, utilities, transportation, food, insurance,
            subscriptions, other_bills, savings_goal, has_vacation, vacation_budget, ai_recommendations, spending_calendar
        ) VALUES (
            :user_id, :month, :monthly_income, :rent, :utilities, :transportation, :food, :insurance,
            :subscriptions, :other_bills, :savings_goal, :has_vacation, :vacation_budget, :ai_recommendations, :spending_calendar
        )
        ON DUPLICATE KEY UPDATE
            monthly_income = VALUES(monthly_income),
            rent = VALUES(rent),
            utilities = VALUES(utilities),
            transportation = VALUES(transportation),
            food = VALUES(food),
            insurance = VALUES(insurance),
            subscriptions = VALUES(subscriptions),
            other_bills = VALUES(other_bills),
            savings_goal = VALUES(savings_goal),
            has_vacation = VALUES(has_vacation),
            vacation_budget = VALUES(vacation_budget),
            ai_recommendations = VALUES(ai_recommendations),
            spending_calendar = VALUES(spending_calendar),
            updated_at = CURRENT_TIMESTAMP
    ');

    $stmt->execute([
        ':user_id' => $user['id'],
        ':month' => $input['month'],
        ':monthly_income' => $input['monthlyIncome'],
        ':rent' => $input['bills']['rent'],
        ':utilities' => $input['bills']['utilities'],
        ':transportation' => $input['bills']['transportation'],
        ':food' => $input['bills']['food'],
        ':insurance' => $input['bills']['insurance'],
        ':subscriptions' => $input['bills']['subscriptions'],
        ':other_bills' => $input['bills']['otherBills'],
        ':savings_goal' => $input['savingsGoal'],
        ':has_vacation' => $input['hasVacation'] ? 1 : 0,
        ':vacation_budget' => $input['vacationBudget'],
        ':ai_recommendations' => json_encode($recommendations),
        ':spending_calendar' => json_encode($analysis['calendar']),
    ]);

    $stmt = $db->prepare('
        SELECT id, month, monthly_income, rent, utilities, transportation, food, insurance,
               subscriptions, other_bills, savings_goal, has_vacation, vacation_budget,
               ai_recommendations, spending_calendar, created_at, updated_at
        FROM budget_plans
        WHERE user_id = :user_id AND month = :month
        LIMIT 1
    ');
    $stmt->execute([':user_id' => $user['id'], ':month' => $input['month']]);
    $row = $stmt->fetch();

    if (!$row) {
        errorResponse('Budget plan could not be saved', 500);
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

$storedRecommendations = json_decode($row['ai_recommendations'] ?? '', true);
$storedCalendar = json_decode($row['spending_calendar'] ?? '', true);

successResponse([
    'budgetPlan' => $plan,
    'aiRecommendations' => $storedRecommendations ?? $recommendations,
    'calendar' => $storedCalendar ?? $analysis['calendar'],
], 'Budget plan saved', 201);
