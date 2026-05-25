<?php


function getGeminiApiKey(): string {

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

    $key = getenv('GEMINI_API_KEY');
    if ($key) return $key;

    throw new \RuntimeException('GEMINI_API_KEY not found in .env or environment');
}


function callGemini(string $systemPrompt, array $messages): string {
    $apiKey = getGeminiApiKey();
    $model = 'gemini-2.5-flash';
    $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

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


function callGeminiVision(string $systemPrompt, string $textPrompt, string $base64Image, string $mimeType = 'image/jpeg'): string {
    $apiKey = getGeminiApiKey();
    $model = 'gemini-2.5-flash';
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

    $text = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
    if (empty($text)) {
        throw new \RuntimeException('Gemini returned an empty response');
    }

    return $text;
}
