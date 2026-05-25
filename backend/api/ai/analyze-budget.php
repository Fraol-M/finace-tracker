<?php


require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../helpers/budget.php';

requireAuth();
$body = getJsonBody();

$input = parseBudgetPayload($body);
$summary = computeBudgetSummary($input);
$analysis = generateBudgetAnalysis($input, $summary);

successResponse([
    'summary' => $summary,
    'insights' => $analysis['insights'],
    'calendar' => $analysis['calendar']
], 'Budget analysis generated');
