<?php


require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config/gemini.php';

$user = requireAuth();
$body = getJsonBody();

$imageData = $body['image'] ?? '';
$mimeType = $body['mimeType'] ?? 'image/jpeg';

if ($imageData === '') {
    errorResponse('Image data is required', 400);
}

if (str_contains($imageData, ',')) {
    $parts = explode(',', $imageData, 2);

    if (preg_match('/data:([^;]+);/', $parts[0], $matches)) {
        $mimeType = $matches[1];
    }
    $imageData = $parts[1];
}

$today = date('Y-m-d');

$systemPrompt = "You are a receipt and invoice parser for a finance tracking application. Analyze the uploaded image and extract financial transaction details.

RULES:
1. Extract: store/vendor name (as title), total amount, date, individual line items if visible
2. The transaction type is always 'expense' for receipts
3. Amount should be NEGATIVE (it's an expense)
4. **IMPORTANT**: Always use TODAY'S DATE ({$today}) for the transaction, regardless of what date appears on the receipt. Users want to track when they're logging the expense, not the original receipt date.
5. Pick the best category from: Food, Transport, Shopping, Entertainment, Bills, Health, Education, Travel, Infrastructure, Software, Operations, Other
6. Pick the best icon from: restaurant, shopping_cart, local_taxi, movie, receipt, medical_services, school, flight, computer, subscriptions, description, category
7. Return ONLY valid JSON, no markdown code fences, no explanation.
8. If you cannot read the receipt clearly, still try your best guess.

OUTPUT FORMAT:
{
  \"title\": \"Store Name Purchase\",
  \"amount\": -00.00,
  \"category\": \"Category\",
  \"date\": \"{$today}\",
  \"type\": \"expense\",
  \"icon\": \"icon_name\",
  \"items\": [
    {\"name\": \"Item 1\", \"price\": 0.00},
    {\"name\": \"Item 2\", \"price\": 0.00}
  ],
  \"confidence\": \"high|medium|low\"
}";

$textPrompt = "Please analyze this receipt/invoice image and extract the transaction details as structured JSON.";

try {
    $response = callGeminiVision($systemPrompt, $textPrompt, $imageData, $mimeType);
    
    $clean = trim($response);
    $clean = preg_replace('/^```json\s*/i', '', $clean);
    $clean = preg_replace('/^```\s*/i', '', $clean);
    $clean = preg_replace('/\s*```$/i', '', $clean);
    $clean = trim($clean);
    
    $parsed = json_decode($clean, true);
    
    if (!$parsed || !isset($parsed['title'])) {
        errorResponse('Could not extract data from this image. Please try a clearer photo.', 422);
    }
    
    $parsed['amount'] = (float)($parsed['amount'] ?? 0);
    if ($parsed['amount'] > 0) $parsed['amount'] = -$parsed['amount']; // ensure negative
    $parsed['date'] = $parsed['date'] ?? $today;
    $parsed['type'] = 'expense';
    $parsed['icon'] = $parsed['icon'] ?? 'receipt';
    $parsed['category'] = $parsed['category'] ?? 'Other';
    
    successResponse($parsed, 'Receipt parsed successfully');
} catch (\Exception $e) {
    errorResponse('AI vision error: ' . $e->getMessage(), 500);
}
