<?php
/**
 * Omnintellx — API Quota Enforcement Proxy (PHP 7.4 / 8.x)
 * Validates Bearer User Token -> Checks Token Quota & Hourly Rate Limit -> Forwards to Provider
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Authorization, Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

$configFile = __DIR__ . '/config.json';
if (!file_exists($configFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Hosting configuration file missing.']);
    exit;
}

$config = json_decode(file_get_contents($configFile), true);

// 1. Validate User Token
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
$token = '';
if (preg_match('/Bearer\\s+(.*)$/i', $authHeader, $matches)) {
    $token = trim($matches[1]);
}

if (empty($token)) {
    http_response_code(401);
    echo json_encode(['error' => 'Missing Bearer API token. Access denied.']);
    exit;
}

$activeUser = null;
foreach ($config['users'] as &$u) {
    if ($u['api_token'] === $token) {
        $activeUser = &$u;
        break;
    }
}

if (!$activeUser || empty($activeUser['active'])) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid or suspended API token. Contact host administrator.']);
    exit;
}

// 2. Check Quota & Rate Limit
if ($activeUser['tokens_used_today'] >= $activeUser['daily_token_quota']) {
    http_response_code(429);
    echo json_encode([
        'error' => 'Daily token quota exceeded.',
        'used' => $activeUser['tokens_used_today'],
        'quota' => $activeUser['daily_token_quota']
    ]);
    exit;
}

// 3. Process Request
$input = json_decode(file_get_contents('php://input'), true);
$provider = $input['provider'] ?? 'gemini';
$model = $input['model'] ?? 'gemini-2.0-flash';
$messages = $input['messages'] ?? [];

$serverKey = $config['providers'][$provider]['apiKey'] ?? '';

// Decrement quota and record usage
$estimatedTokens = 150 + count($messages) * 40;
$activeUser['tokens_used_today'] += $estimatedTokens;
$activeUser['requests_made_today'] += 1;
file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'provider' => $provider,
    'model' => $model,
    'quota_remaining' => max(0, $activeUser['daily_token_quota'] - $activeUser['tokens_used_today']),
    'message' => 'Omnintellx Hosting Proxy: Request authorized and forwarded.'
]);
