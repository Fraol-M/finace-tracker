<?php



require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/gemini.php';
require_once __DIR__ . '/../../config/database.php';

$user = requireAuth();


$db = getDB();
$stmt = $db->prepare('
    SELECT title, amount, category, date, type
    FROM transactions
    WHERE uid = :uid
    ORDER BY date ASC
');
$stmt->execute([':uid' => $user['id']]);
$transactions = $stmt->fetchAll();

if (count($transactions) < 2) {
    successResponse([
        'safeToSpend' => 0,
        'predictedEndBalance' => 0,
        'monthlyIncome' => 0,
        'monthlyExpense' => 0,
        'insights' => 'Add more transactions to get AI-powered predictions.',
        'projections' => []
    ], 'Not enough data for predictions');
    exit;
}


$txLines = [];
foreach ($transactions as $tx) {
    $txLines[] = "{$tx['date']} | {$tx['type']} | {$tx['title']} | \${$tx['amount']} | {$tx['category']}";
}

$today = date('Y-m-d');
$endOfMonth = date('Y-m-t');
$daysLeft = (int)((strtotime($endOfMonth) - strtotime($today)) / 86400);

$systemPrompt = "You are a financial prediction AI. Analyze the user's transaction history to predict their cash flow for the rest of the month.

RULES:
1. Identify recurring income patterns (salary, freelance, etc.)
2. Identify recurring expense patterns and average daily spending
3. Calculate a 'Safe to Spend' amount: how much the user can spend per day for the remaining {$daysLeft} days without going negative
4. Predict the end-of-month balance based on patterns
5. Provide 3 brief, actionable insights
6. Generate daily balance projections for the next 7 days

Return ONLY valid JSON in this exact format (no markdown fences):
{
  \"safeToSpend\": 00.00,
  \"predictedEndBalance\": 0000.00,
  \"monthlyIncome\": 0000.00,
  \"monthlyExpense\": 0000.00,
  \"insights\": [
    \"Insight 1\",
    \"Insight 2\",
    \"Insight 3\"
  ],
  \"projections\": [
    {\"date\": \"YYYY-MM-DD\", \"balance\": 0000.00},
    {\"date\": \"YYYY-MM-DD\", \"balance\": 0000.00}
  ]
}";

$prompt = "Here are my transactions. Today is {$today} and there are {$daysLeft} days left in the month.\n\n" . implode("\n", $txLines);

$messages = [
    ['role' => 'user', 'text' => $prompt]
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
        
        $totalIncome = 0;
        $totalExpense = 0;
        foreach ($transactions as $tx) {
            if ($tx['type'] === 'income') $totalIncome += (float)$tx['amount'];
            else $totalExpense += abs((float)$tx['amount']);
        }
        $net = $totalIncome - $totalExpense;
        $safeToSpend = $daysLeft > 0 ? max(0, $net / $daysLeft) : 0;
        
        $parsed = [
            'safeToSpend' => round($safeToSpend, 2),
            'predictedEndBalance' => round($net, 2),
            'monthlyIncome' => round($totalIncome, 2),
            'monthlyExpense' => round($totalExpense, 2),
            'insights' => ['Based on your current spending, maintain discipline to stay positive.'],
            'projections' => []
        ];
    }
    
    
    $parsed['safeToSpend'] = (float)($parsed['safeToSpend'] ?? 0);
    $parsed['predictedEndBalance'] = (float)($parsed['predictedEndBalance'] ?? 0);
    $parsed['monthlyIncome'] = (float)($parsed['monthlyIncome'] ?? 0);
    $parsed['monthlyExpense'] = (float)($parsed['monthlyExpense'] ?? 0);
    
    successResponse($parsed, 'Predictions generated');
} catch (\Exception $e) {
    errorResponse('AI prediction error: ' . $e->getMessage(), 500);
}
