<?php


require_once __DIR__ . '/../helpers/response.php';
require_once __DIR__ . '/../config/gemini.php';

function normalizeBudgetAmount($value, string $label, bool $allowZero = true): float {
    if ($value === null || $value === '') {
        return 0.0;
    }

    if (!is_numeric($value)) {
        errorResponse("$label must be a number", 400);
    }

    $amount = (float)$value;
    if ($allowZero) {
        if ($amount < 0) {
            errorResponse("$label must be 0 or greater", 400);
        }
    } else {
        if ($amount <= 0) {
            errorResponse("$label must be greater than 0", 400);
        }
    }

    return $amount;
}

function parseBudgetPayload(array $body): array {
    $month = trim((string)($body['month'] ?? ''));
    if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
        errorResponse('Month must be in YYYY-MM format', 400);
    }

    $monthlyIncome = normalizeBudgetAmount($body['monthlyIncome'] ?? null, 'Monthly income', false);

    $bills = is_array($body['bills'] ?? null) ? $body['bills'] : [];
    $rent = normalizeBudgetAmount($bills['rent'] ?? 0, 'Rent');
    $utilities = normalizeBudgetAmount($bills['utilities'] ?? 0, 'Utilities');
    $transportation = normalizeBudgetAmount($bills['transportation'] ?? 0, 'Transportation');
    $food = normalizeBudgetAmount($bills['food'] ?? 0, 'Food');
    $insurance = normalizeBudgetAmount($bills['insurance'] ?? 0, 'Insurance');
    $subscriptions = normalizeBudgetAmount($bills['subscriptions'] ?? 0, 'Subscriptions');
    $otherBills = normalizeBudgetAmount($bills['otherBills'] ?? 0, 'Other bills');

    $savingsGoal = normalizeBudgetAmount($body['savingsGoal'] ?? 0, 'Savings goal');

    $hasVacationRaw = $body['hasVacation'] ?? false;
    $hasVacation = filter_var($hasVacationRaw, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    if ($hasVacation === null) {
        $hasVacation = false;
    }

    $vacationBudget = normalizeBudgetAmount($body['vacationBudget'] ?? 0, 'Vacation budget');
    if (!$hasVacation) {
        $vacationBudget = 0.0;
    }

    return [
        'month' => $month,
        'monthlyIncome' => $monthlyIncome,
        'bills' => [
            'rent' => $rent,
            'utilities' => $utilities,
            'transportation' => $transportation,
            'food' => $food,
            'insurance' => $insurance,
            'subscriptions' => $subscriptions,
            'otherBills' => $otherBills,
        ],
        'savingsGoal' => $savingsGoal,
        'hasVacation' => (bool)$hasVacation,
        'vacationBudget' => $vacationBudget,
    ];
}

function getDaysInMonth(string $month): int {
    $date = DateTime::createFromFormat('Y-m-d', $month . '-01');
    if (!$date) {
        errorResponse('Invalid month', 400);
    }
    return (int)$date->format('t');
}

function computeBudgetSummary(array $input): array {
    $bills = $input['bills'];
    $totalFixed = $bills['rent'] + $bills['utilities'] + $bills['transportation'] + $bills['food']
        + $bills['insurance'] + $bills['subscriptions'] + $bills['otherBills'];

    $remainingAfterBills = $input['monthlyIncome'] - $totalFixed;
    $remainingAfterSavings = $remainingAfterBills - $input['savingsGoal'];
    $remainingAfterVacation = $remainingAfterSavings - ($input['hasVacation'] ? $input['vacationBudget'] : 0);
    $daysInMonth = getDaysInMonth($input['month']);
    $dailySpendingLimit = $daysInMonth > 0 ? max(0, $remainingAfterVacation / $daysInMonth) : 0;

    return [
        'totalFixedExpenses' => round($totalFixed, 2),
        'remainingAfterBills' => round($remainingAfterBills, 2),
        'remainingAfterSavings' => round($remainingAfterSavings, 2),
        'remainingAfterVacation' => round($remainingAfterVacation, 2),
        'dailySpendingLimit' => round($dailySpendingLimit, 2),
        'daysInMonth' => $daysInMonth,
    ];
}

function cleanGeminiJson(string $text): string {
    $clean = trim($text);
    $clean = preg_replace('/^```json\s*/i', '', $clean);
    $clean = preg_replace('/^```\s*/i', '', $clean);
    $clean = preg_replace('/\s*```$/i', '', $clean);
    return trim($clean);
}

function buildFallbackCalendar(array $input, array $summary): array {
    $month = $input['month'];
    $daysInMonth = $summary['daysInMonth'];
    $dailyLimit = $summary['dailySpendingLimit'];

    $billSchedule = [
        ['key' => 'rent', 'label' => 'Rent', 'day' => 1],
        ['key' => 'transportation', 'label' => 'Transportation', 'day' => 1],
        ['key' => 'subscriptions', 'label' => 'Subscriptions', 'day' => 5],
        ['key' => 'utilities', 'label' => 'Utilities', 'day' => 10],
        ['key' => 'insurance', 'label' => 'Insurance', 'day' => 15],
        ['key' => 'otherBills', 'label' => 'Other bills', 'day' => 20],
    ];

    $vacationDays = [];
    $vacationDaily = 0.0;
    if ($input['hasVacation'] && $input['vacationBudget'] > 0) {
        $start = min(21, max(1, $daysInMonth - 3));
        $end = min($daysInMonth, $start + 3);
        $vacationDays = range($start, $end);
        $vacationDaily = count($vacationDays) > 0 ? round($input['vacationBudget'] / count($vacationDays), 2) : 0.0;
    }

    $calendar = [];
    $balance = 0.0;

    for ($day = 1; $day <= $daysInMonth; $day++) {
        $date = sprintf('%s-%02d', $month, $day);
        $planned = [];
        $notes = [];
        $type = 'regular';

        if ($day === 1) {
            $balance += $input['monthlyIncome'];
            $type = 'payday';
            $notes[] = 'Income received.';
        }

        foreach ($billSchedule as $bill) {
            $amount = $input['bills'][$bill['key']] ?? 0;
            if ($amount > 0 && $day === $bill['day']) {
                $planned[] = [
                    'category' => $bill['label'],
                    'amount' => round($amount, 2),
                    'status' => 'scheduled'
                ];
                $balance -= $amount;
                if ($type === 'regular') {
                    $type = 'bill-day';
                }
            }
        }

        if ($input['savingsGoal'] > 0 && $day === 15) {
            $planned[] = [
                'category' => 'Savings',
                'amount' => round($input['savingsGoal'], 2),
                'status' => 'scheduled'
            ];
            $balance -= $input['savingsGoal'];
            $type = 'savings-day';
        }

        if ($vacationDaily > 0 && in_array($day, $vacationDays, true)) {
            $planned[] = [
                'category' => 'Vacation',
                'amount' => round($vacationDaily, 2),
                'status' => 'scheduled'
            ];
            $balance -= $vacationDaily;
            $type = 'vacation-day';
        }

        if ($dailyLimit > 0) {
            $balance -= $dailyLimit;
            $notes[] = 'Daily discretionary budget applies.';
        }

        if ($balance < 0) {
            $type = 'warning';
            $notes[] = 'Low balance warning.';
        }

        $calendar[] = [
            'date' => $date,
            'type' => $type,
            'plannedExpenses' => $planned,
            'availableToSpend' => round($dailyLimit, 2),
            'runningBalance' => round($balance, 2),
            'notes' => implode(' ', $notes),
        ];
    }

    return $calendar;
}

function generateBudgetAnalysis(array $input, array $summary): array {
    $fallbackInsights = [
        'Your fixed expenses account for ' . round(($summary['totalFixedExpenses'] / max(1, $input['monthlyIncome'])) * 100, 1) . '% of income.',
        'Daily discretionary budget is $' . number_format($summary['dailySpendingLimit'], 2) . '.',
        'Review subscriptions and food to find quick savings if needed.',
        'Automate savings to hit your goal on schedule.',
        'Track weekly spending to avoid late-month pressure.'
    ];

    $fallbackCalendar = buildFallbackCalendar($input, $summary);

    $systemPrompt = "You are a financial planning assistant. Build a day-by-day budget calendar for the given month.\n\n" .
        "Return ONLY valid JSON with this structure:\n" .
        "{\"insights\": [\"tip\", \"tip\"], \"calendar\": [" .
        "{\"date\":\"YYYY-MM-DD\",\"type\":\"payday|bill-day|savings-day|vacation-day|regular|warning|milestone\",\"plannedExpenses\":[{\"category\":\"Rent\",\"amount\":0,\"status\":\"scheduled\"}],\"availableToSpend\":0,\"runningBalance\":0,\"notes\":\"...\"}]}.\n" .
        "Use plain ASCII text only. Do not include markdown or extra keys.";

    $prompt = "MONTH: {$input['month']}\n" .
        "MONTHLY INCOME: {$input['monthlyIncome']}\n" .
        "BILLS: rent={$input['bills']['rent']}, utilities={$input['bills']['utilities']}, transportation={$input['bills']['transportation']}, food={$input['bills']['food']}, insurance={$input['bills']['insurance']}, subscriptions={$input['bills']['subscriptions']}, other={$input['bills']['otherBills']}\n" .
        "SAVINGS GOAL: {$input['savingsGoal']}\n" .
        "VACATION: " . ($input['hasVacation'] ? 'yes' : 'no') . "\n" .
        "VACATION BUDGET: {$input['vacationBudget']}\n" .
        "SUMMARY: fixed={$summary['totalFixedExpenses']}, remainingAfterBills={$summary['remainingAfterBills']}, remainingAfterSavings={$summary['remainingAfterSavings']}, remainingAfterVacation={$summary['remainingAfterVacation']}, dailySpendingLimit={$summary['dailySpendingLimit']}, daysInMonth={$summary['daysInMonth']}\n" .
        "RULES: Income arrives on day 1. Spread discretionary spending evenly using dailySpendingLimit. Schedule bills near typical dates (1st, 5th, 10th, 15th, 20th).";

    $messages = [
        ['role' => 'user', 'text' => $prompt]
    ];

    try {
        $response = callGemini($systemPrompt, $messages);
        $clean = cleanGeminiJson($response);
        $parsed = json_decode($clean, true);

        if (!is_array($parsed)) {
            return ['insights' => $fallbackInsights, 'calendar' => $fallbackCalendar];
        }

        $insights = $parsed['insights'] ?? $fallbackInsights;
        if (!is_array($insights)) {
            $insights = [$insights];
        }

        $calendar = $parsed['calendar'] ?? $fallbackCalendar;
        if (!is_array($calendar) || count($calendar) < $summary['daysInMonth']) {
            $calendar = $fallbackCalendar;
        }

        return [
            'insights' => $insights,
            'calendar' => $calendar
        ];
    } catch (Exception $e) {
        return ['insights' => $fallbackInsights, 'calendar' => $fallbackCalendar];
    }
}
