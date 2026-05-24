<?php
/**
 * Gemini API helper.
 * Calls the Gemini REST API directly via curl — no Composer dependencies needed.
 */

function getGeminiApiKey(): string {
    // Try .env file first
    $envFile = __DIR__ . '/../../.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (str_starts_with(trim($line), '#')) continue;
            if (str_contains($line, '=')) {
                [$key, $value] = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value, " \t\n\r\0\x0B\"'");
                if ($key === 'GEMINI_API_KEY') return $value;
            }
        }
    }
    // Fallback to environment variable
    $key = getenv('GEMINI_API_KEY');
    if ($key) return $key;

    throw new \RuntimeException('GEMINI_API_KEY not found in .env or environment');
}

/**
 * Call Gemini API for text-only generation.
 *
 * @param string $systemPrompt  System instruction for the model
 * @param array  $messages      Array of ['role' => 'user'|'model', 'text' => '...']
 * @return string The model's text response
 */
function callGemini(string $systemPrompt, array $messages): string {
    $apiKey = getGeminiApiKey();
    $model = 'gemini-2.0-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

    // Build contents array
    $contents = [];
    foreach ($messages as $msg) {
        $contents[] = [
            'role' => $msg['role'],
            'parts' => [['text' => $msg['text']]]
        ];
    }

    $payload = [
        'system_instruction' => [
            'parts' => [['text' => $systemPrompt]]
        ],
        'contents' => $contents,
        'generationConfig' => [
            'temperature' => 0.7,
            'maxOutputTokens' => 2048,
        ]
    ];

    return geminiRequest($url, $payload, $apiKey);
}

/**
 * Call Gemini API with an image (multimodal / vision).
 *
 * @param string $systemPrompt  System instruction
 * @param string $textPrompt    Text prompt to accompany the image
 * @param string $base64Image   Base64-encoded image data (without data URI prefix)
 * @param string $mimeType      Image MIME type (e.g., 'image/jpeg')
 * @return string The model's text response
 */
function callGeminiVision(string $systemPrompt, string $textPrompt, string $base64Image, string $mimeType = 'image/jpeg'): string {
    $apiKey = getGeminiApiKey();
    $model = 'gemini-2.0-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

    $payload = [
        'system_instruction' => [
            'parts' => [['text' => $systemPrompt]]
        ],
        'contents' => [
            [
                'role' => 'user',
                'parts' => [
                    ['text' => $textPrompt],
                    [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => $base64Image
                        ]
                    ]
                ]
            ]
        ],
        'generationConfig' => [
            'temperature' => 0.2,
            'maxOutputTokens' => 2048,
        ]
    ];

    return geminiRequest($url, $payload, $apiKey);
}

/**
 * Low-level curl request to Gemini.
 */
function geminiRequest(string $url, array $payload, string $apiKey): string {
    $jsonPayload = json_encode($payload);

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $jsonPayload,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'x-goog-api-key: ' . $apiKey
        ],
        CURLOPT_TIMEOUT        => 60,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        throw new \RuntimeException("Gemini API curl error: $curlError");
    }

    $result = json_decode($response, true);

    if ($httpCode !== 200) {
        $errorMsg = $result['error']['message'] ?? "HTTP $httpCode";
        throw new \RuntimeException("Gemini API error: $errorMsg");
    }

    // Extract text from response
    $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (empty($text)) {
        throw new \RuntimeException('Gemini returned an empty response');
    }

    return $text;
}
