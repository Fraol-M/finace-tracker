<?php




require_once __DIR__ . '/middleware/cors.php';


$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = $_SERVER['REQUEST_METHOD'];


$routes = [
    
    'POST /api/auth/login'    => __DIR__ . '/api/auth/login.php',
    'POST /api/auth/signup'   => __DIR__ . '/api/auth/signup.php',
    'POST /api/auth/logout'   => __DIR__ . '/api/auth/logout.php',
    'GET /api/auth/me'        => __DIR__ . '/api/auth/me.php',

    
    'GET /api/users'          => __DIR__ . '/api/users/index.php',
    'PUT /api/users/update'   => __DIR__ . '/api/users/update.php',
    'DELETE /api/users/delete' => __DIR__ . '/api/users/delete.php',

    
    'GET /api/transactions'          => __DIR__ . '/api/transactions/index.php',
    'POST /api/transactions'         => __DIR__ . '/api/transactions/create.php',
    'PUT /api/transactions/update'   => __DIR__ . '/api/transactions/update.php',
    'DELETE /api/transactions/delete' => __DIR__ . '/api/transactions/delete.php',

    
    'POST /api/ai/chat'              => __DIR__ . '/api/ai/chat.php',
    'POST /api/ai/parse-transaction' => __DIR__ . '/api/ai/parse-transaction.php',
    'POST /api/ai/parse-receipt'     => __DIR__ . '/api/ai/parse-receipt.php',
    'POST /api/ai/predict'           => __DIR__ . '/api/ai/predict.php',
];

$routeKey = "$method $uri";

if (isset($routes[$routeKey])) {
    require $routes[$routeKey];
} else {
    require_once __DIR__ . '/helpers/response.php';
    errorResponse("Route not found: $method $uri", 404);
}
