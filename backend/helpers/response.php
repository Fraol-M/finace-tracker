<?php
/**
 * JSON response helpers for the API.
 */

function jsonResponse($data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function successResponse($data = null, string $message = 'OK', int $statusCode = 200): void {
    jsonResponse([
        'success' => true,
        'message' => $message,
        'data'    => $data
    ], $statusCode);
}

function errorResponse(string $message, int $statusCode = 400): void {
    jsonResponse([
        'success' => false,
        'message' => $message,
        'data'    => null
    ], $statusCode);
}

/**
 * Read JSON request body and return as associative array.
 */
function getJsonBody(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}
