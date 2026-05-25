<?php



require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/gemini.php';
require_once __DIR__ . '/../../config/database.php';

$user = requireAuth();
$body = getJsonBody();

$message = trim($body['message'] ?? '');
$persona = $body['persona'] ?? 'default';
$history = $body['history'] ?? [];

if ($message === '') {
    errorResponse('Message is required', 400);
}


$db = getDB();
$stmt = $db->prepare('
    SELECT title, amount, category, date, type
    FROM transactions
    WHERE uid = :uid
    ORDER BY date DESC
    LIMIT 200
');
$stmt->execute([':uid' => $user['id']]);
$transactions = $stmt->fetchAll();


$totalIncome = 0;
$totalExpense = 0;
$categoryTotals = [];
$txLines = [];

foreach ($transactions as $tx) {
    $amt = (float)$tx['amount'];
    if ($tx['type'] === 'income') {
        $totalIncome += $amt;
    } else {
        $totalExpense += abs($amt);
    }
    $cat = $tx['category'];
    $categoryTotals[$cat] = ($categoryTotals[$cat] ?? 0) + abs($amt);
    $txLines[] = "{$tx['date']} | {$tx['type']} | {$tx['title']} | \${$tx['amount']} | {$tx['category']}";
}

arsort($categoryTotals);
$catSummary = [];
foreach ($categoryTotals as $cat => $total) {
    $catSummary[] = "  - {$cat}: \$" . number_format($total, 2);
}

$today = date('Y-m-d');
$dataContext = "
USER FINANCIAL DATA (as of {$today}):
- User: {$user['full_name']} ({$user['username']})
- Total Income: \$" . number_format($totalIncome, 2) . "
- Total Expenses: \$" . number_format($totalExpense, 2) . "
- Net: \$" . number_format($totalIncome - $totalExpense, 2) . "
- Top Categories by Spending:
" . implode("\n", array_slice($catSummary, 0, 10)) . "

RECENT TRANSACTIONS (most recent first):
" . implode("\n", array_slice($txLines, 0, 50));


$personaPrompts = [
    'default' => "You are FinPrecision AI, a friendly and professional financial assistant. You help users understand their spending patterns, answer questions about their finances, and provide actionable advice. Be concise but thorough. Use numbers and percentages when relevant. Format your responses with clear structure using markdown when helpful.",

    'ramsay' => "You are Chef Gordon Ramsay reviewing someone's financial spending. You are brutally honest, dramatic, and hilarious — just like you are about food. Use cooking metaphors. Be shocked at wasteful spending. Praise good financial decisions reluctantly. Use ALL CAPS for dramatic effect occasionally. Throw in signature Ramsay phrases like 'This spending is RAW!', 'What are you, a donkey?!', 'Finally, some good financial sense!'. Keep it entertaining but also give genuine financial advice underneath the humor.",

    'coach' => "You are a warm, supportive, and encouraging financial wellness coach. You celebrate wins, no matter how small. You frame challenges positively — never shame spending, instead redirect toward goals. Use phrases like 'Great progress!', 'Let's build on this', 'You're doing better than you think'. Give practical, gentle suggestions. Use encouraging emojis sparingly (✨, 💪, 🌟). Make the user feel empowered about their financial journey.",

    'pirate' => "You are Captain Goldbeard, a legendary pirate financial advisor! You speak in full pirate dialect. Replace money terms with pirate equivalents: dollars = doubloons, savings = treasure chest, spending = plundering, budget = ship's manifest, income = loot, expenses = cannonball holes in the hull. Use pirate expressions like 'Arrr!', 'Shiver me timbers!', 'Blimey!', 'Walk the plank!'. Despite the persona, give genuinely useful financial advice wrapped in pirate language."
];

$systemPrompt = ($personaPrompts[$persona] ?? $personaPrompts['default']) . "\n\nHere is the user's financial data that you should use to answer their questions:\n" . $dataContext;


$messages = [];
foreach ($history as $h) {
    $role = ($h['role'] ?? 'user') === 'assistant' ? 'model' : 'user';
    $messages[] = ['role' => $role, 'text' => $h['content'] ?? ''];
}
$messages[] = ['role' => 'user', 'text' => $message];

try {
    $response = callGemini($systemPrompt, $messages);
    successResponse([
        'reply' => $response,
        'persona' => $persona,
    ], 'AI response generated');
} catch (\Exception $e) {
    errorResponse('AI service error: ' . $e->getMessage(), 500);
}
