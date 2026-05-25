<?php


require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/gemini.php';

$user = requireAuth();
$body = getJsonBody();

$text = trim($body['text'] ?? '');

if ($text === '') {
    errorResponse('Text is required', 400);
}

$today = date('Y-m-d');
$yesterday = date('Y-m-d', strtotime('-1 day'));

$systemPrompt = "You are a financial transaction parser. Convert natural language descriptions of financial transactions into structured JSON.

IMPORTANT: If the user describes MULTIPLE transactions in one message, return an ARRAY of transaction objects. If only one transaction, return a SINGLE object (not an array).

RULES:
1. Extract: title, amount (as a number), category, date, type (income or expense), and icon
2. If the user says 'spent', 'bought', 'paid', etc. it's an expense. Amount should be NEGATIVE for expenses.
3. If the user says 'received', 'earned', 'got paid', 'salary', 'tip', 'got', etc. it's income. Amount should be POSITIVE.
4. For dates: 'today' = {$today}, 'yesterday' = {$yesterday}. If no date mentioned, use today.
5. Pick the best category from: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Salary, Freelance, Investment, Gifts, Travel, Infrastructure, Software, Marketing, Operations, Consulting, Revenue, Other
6. Pick the best icon from: restaurant, shopping_cart, local_taxi, movie, receipt, medical_services, school, account_balance, payments, trending_up, card_giftcard, flight, computer, subscriptions, campaign, description, work, attach_money, category
7. Return ONLY valid JSON, no markdown code fences, no explanation.

EXAMPLE 1 (Single transaction):
INPUT: 'I spent 45 dollars on groceries at Walmart yesterday'
OUTPUT: {\"title\":\"Walmart Groceries\",\"amount\":-45.00,\"category\":\"Food\",\"date\":\"{$yesterday}\",\"type\":\"expense\",\"icon\":\"shopping_cart\"}

EXAMPLE 2 (Multiple transactions):
INPUT: 'I spent 30 on parking, 2000 on gas, but I also got a tip for 1000'
OUTPUT: [
  {\"title\":\"Parking\",\"amount\":-30.00,\"category\":\"Transport\",\"date\":\"{$today}\",\"type\":\"expense\",\"icon\":\"local_taxi\"},
  {\"title\":\"Gas\",\"amount\":-2000.00,\"category\":\"Transport\",\"date\":\"{$today}\",\"type\":\"expense\",\"icon\":\"local_taxi\"},
  {\"title\":\"Tip\",\"amount\":1000.00,\"category\":\"Revenue\",\"date\":\"{$today}\",\"type\":\"income\",\"icon\":\"payments\"}
]";

$messages = [
    ['role' => 'user', 'text' => $text]
];

try {
    $response = callGemini($systemPrompt, $messages);

    $clean = trim($response);
    $clean = preg_replace('/^```json\s*/i', '', $clean);
    $clean = preg_replace('/^```\s*/i', '', $clean);
    $clean = preg_replace('/\s*```$/i', '', $clean);
    $clean = trim($clean);

    $parsed = json_decode($clean, true);

    if (!$parsed) {
        errorResponse('Could not parse transaction from your description. Try being more specific.', 422);
    }

    $isMultiple = isset($parsed[0]);

    if ($isMultiple) {
        foreach ($parsed as &$tx) {
            if (!isset($tx['title']) || !isset($tx['amount'])) {
                errorResponse('Could not parse all transactions. Try being more specific.', 422);
            }
            $tx['amount'] = (float)$tx['amount'];
            $tx['date'] = $tx['date'] ?? $today;
            $tx['type'] = $tx['type'] ?? ($tx['amount'] < 0 ? 'expense' : 'income');
            $tx['icon'] = $tx['icon'] ?? 'category';
            $tx['category'] = $tx['category'] ?? 'Other';
        }
        successResponse(['transactions' => $parsed, 'multiple' => true], 'Multiple transactions parsed successfully');
    } else {
        if (!isset($parsed['title']) || !isset($parsed['amount'])) {
            errorResponse('Could not parse transaction from your description. Try being more specific.', 422);
        }
        $parsed['amount'] = (float)$parsed['amount'];
        $parsed['date'] = $parsed['date'] ?? $today;
        $parsed['type'] = $parsed['type'] ?? ($parsed['amount'] < 0 ? 'expense' : 'income');
        $parsed['icon'] = $parsed['icon'] ?? 'category';
        $parsed['category'] = $parsed['category'] ?? 'Other';

        successResponse($parsed, 'Transaction parsed successfully');
    }
} catch (\Exception $e) {
    errorResponse('AI parsing error: ' . $e->getMessage(), 500);
}