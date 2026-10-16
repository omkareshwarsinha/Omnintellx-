<?php
/**
 * Omnintellx — Master Autonomous Software Studio
 * Self-Contained Single-File PHP Backend & Multi-Provider API Gateway
 * 
 * Features:
 * 1. 100% Single-File Deployment (Zero external library or file includes required)
 * 2. Automatic directory creation (data/)
 * 3. Automatic JSON provisioning (providers.json, projects.json, settings.json, activity.json, ideas.json, chats.json)
 * 4. Multi-Provider API Gateway (Gemini, OpenRouter, Anthropic, OpenAI, Cerebras, Grok, DeepSeek, Groq, Together, Mistral, Ollama, Custom)
 * 5. Strict Provider Independence (Zero state pollution, exact target execution)
 * 6. Real Latency & Auth Verification (Real HTTP status returned, NO silent fallback to Pollinations)
 * 7. Project & Workspace Filesystem Operations
 * 8. Activity & Audit Telemetry Logging
 */

// Enable session & CORS
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// 1. AUTOMATIC STORAGE & JSON DIRECTORY PROVISIONING
// ============================================================================
$dataDir = __DIR__ . '/data';
if (!is_dir($dataDir)) {
    @mkdir($dataDir, 0755, true);
}

function get_json_path($filename) {
    global $dataDir;
    return $dataDir . '/' . $filename;
}

function read_json_data($filename, $default = []) {
    $path = get_json_path($filename);
    if (!file_exists($path)) {
        return $default;
    }
    $raw = @file_get_contents($path);
    if ($raw === false || $raw === '') {
        return $default;
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : $default;
}

function write_json_data($filename, $data) {
    $path = get_json_path($filename);
    $raw = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return @file_put_contents($path, $raw, LOCK_EX) !== false;
}

// Auto-seed providers.json if missing
if (!file_exists(get_json_path('providers.json'))) {
    $initialProviders = [
        'version' => 1,
        'providers' => [
            [
                'id' => 'prov_gemini',
                'name' => 'Google Gemini',
                'type' => 'gemini',
                'baseUrl' => 'https://generativelanguage.googleapis.com/v1beta',
                'apiKey' => '',
                'models' => [
                    'gemini-2.0-flash',
                    'gemini-2.0-flash-lite',
                    'gemini-1.5-pro',
                    'gemini-1.5-flash'
                ],
                'defaultModel' => 'gemini-2.0-flash',
                'selectedModelId' => 'gemini-2.0-flash',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_openrouter',
                'name' => 'OpenRouter Gateway',
                'type' => 'openrouter',
                'baseUrl' => 'https://openrouter.ai/api/v1',
                'apiKey' => '',
                'models' => [
                    'anthropic/claude-3.7-sonnet',
                    'anthropic/claude-3.5-sonnet',
                    'google/gemini-2.5-pro',
                    'google/gemini-2.5-flash',
                    'openai/gpt-4.5-preview',
                    'openai/gpt-4o',
                    'deepseek/deepseek-r1',
                    'deepseek/deepseek-chat',
                    'meta-llama/llama-3.3-70b-instruct',
                    'qwen/qwen-2.5-coder-32b-instruct'
                ],
                'defaultModel' => 'anthropic/claude-3.7-sonnet',
                'selectedModelId' => 'anthropic/claude-3.7-sonnet',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_anthropic',
                'name' => 'Anthropic Claude',
                'type' => 'anthropic',
                'baseUrl' => 'https://api.anthropic.com/v1',
                'apiKey' => '',
                'models' => [
                    'claude-3-7-sonnet-20250219',
                    'claude-3-5-sonnet-20241022',
                    'claude-3-5-haiku-20241022'
                ],
                'defaultModel' => 'claude-3-7-sonnet-20250219',
                'selectedModelId' => 'claude-3-7-sonnet-20250219',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_openai',
                'name' => 'OpenAI API',
                'type' => 'openai',
                'baseUrl' => 'https://api.openai.com/v1',
                'apiKey' => '',
                'models' => ['gpt-4o', 'gpt-4o-mini', 'o3-mini', 'o1'],
                'defaultModel' => 'gpt-4o',
                'selectedModelId' => 'gpt-4o',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_cerebras',
                'name' => 'Cerebras Fast Compute',
                'type' => 'cerebras',
                'baseUrl' => 'https://api.cerebras.ai/v1',
                'apiKey' => '',
                'models' => ['llama3.3-70b', 'llama3.1-8b'],
                'defaultModel' => 'llama3.3-70b',
                'selectedModelId' => 'llama3.3-70b',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_groq',
                'name' => 'Groq LPUs',
                'type' => 'groq',
                'baseUrl' => 'https://api.groq.com/openai/v1',
                'apiKey' => '',
                'models' => ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'deepseek-r1-distill-llama-70b'],
                'defaultModel' => 'llama-3.3-70b-versatile',
                'selectedModelId' => 'llama-3.3-70b-versatile',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_deepseek',
                'name' => 'DeepSeek API',
                'type' => 'deepseek',
                'baseUrl' => 'https://api.deepseek.com',
                'apiKey' => '',
                'models' => ['deepseek-chat', 'deepseek-reasoner'],
                'defaultModel' => 'deepseek-chat',
                'selectedModelId' => 'deepseek-chat',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_grok',
                'name' => 'xAI Grok',
                'type' => 'grok',
                'baseUrl' => 'https://api.x.ai/v1',
                'apiKey' => '',
                'models' => ['grok-2-latest', 'grok-2-vision-latest', 'grok-beta'],
                'defaultModel' => 'grok-2-latest',
                'selectedModelId' => 'grok-2-latest',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_together',
                'name' => 'Together AI',
                'type' => 'together',
                'baseUrl' => 'https://api.together.xyz/v1',
                'apiKey' => '',
                'models' => ['meta-llama/Llama-3.3-70B-Instruct-Turbo', 'deepseek-ai/DeepSeek-R1'],
                'defaultModel' => 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                'selectedModelId' => 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_mistral',
                'name' => 'Mistral AI',
                'type' => 'mistral',
                'baseUrl' => 'https://api.mistral.ai/v1',
                'apiKey' => '',
                'models' => ['mistral-large-latest', 'codestral-latest'],
                'defaultModel' => 'mistral-large-latest',
                'selectedModelId' => 'mistral-large-latest',
                'status' => 'untested'
            ],
            [
                'id' => 'prov_ollama',
                'name' => 'Local Ollama',
                'type' => 'ollama',
                'baseUrl' => 'http://localhost:11434',
                'apiKey' => '',
                'models' => ['llama3.3:latest', 'qwen2.5-coder:7b', 'deepseek-r1:8b'],
                'defaultModel' => 'llama3.3:latest',
                'selectedModelId' => 'llama3.3:latest',
                'status' => 'untested',
                'isLocalOnly' => true
            ],
            [
                'id' => 'prov_custom',
                'name' => 'Custom OpenAI-Compatible',
                'type' => 'custom',
                'baseUrl' => 'https://api.openai.com/v1',
                'apiKey' => '',
                'models' => ['custom-model'],
                'defaultModel' => 'custom-model',
                'selectedModelId' => 'custom-model',
                'status' => 'untested'
            ]
        ],
        'activeInferenceTarget' => [
            'providerId' => 'prov_gemini',
            'providerType' => 'gemini',
            'modelId' => 'gemini-2.5-flash'
        ],
        'routingMode' => 'MANUAL',
        'fallbackMode' => 'NONE'
    ];
    write_json_data('providers.json', $initialProviders);
}

// Auto-seed projects.json if missing
if (!file_exists(get_json_path('projects.json'))) {
    $initialProjects = [
        'version' => 1,
        'projects' => [
            [
                'id' => 'proj_starter_01',
                'name' => 'Cybersecurity 3D Network Operations',
                'description' => 'Interactive Three.js WebGL cinematic cybersecurity hub with glassmorphism telemetry UI and real-time defense monitoring.',
                'createdAt' => time() - 3600,
                'updatedAt' => time(),
                'files' => [
                    [
                        'id' => 'file_index_html',
                        'name' => 'index.html',
                        'content' => "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <title>CyberSecurity 3D Hub</title>\n  <script src=\"https://cdn.tailwindcss.com\"><\/script>\n  <script src=\"https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js\"><\/script>\n<\/head>\n<body class=\"bg-slate-950 text-white min-h-screen flex flex-col justify-between overflow-x-hidden\">\n  <header class=\"p-6 border-b border-cyan-500/20 flex justify-between items-center backdrop-blur bg-slate-900/60\">\n    <h1 class=\"text-xl font-bold text-cyan-400 tracking-wider\">CYBERSEC // THREAT GRID<\/h1>\n    <span class=\"text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono\">ACTIVE DEFENSE: ONLINE<\/span>\n  <\/header>\n  <main class=\"flex-1 relative flex items-center justify-center p-8\">\n    <canvas id=\"grid-canvas\" class=\"absolute inset-0 w-full h-full pointer-events-none\"><\/canvas>\n    <div class=\"relative z-10 max-w-xl text-center space-y-4 bg-slate-900/80 p-8 rounded-2xl border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/10\">\n      <h2 class=\"text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500\">Autonomous Node Topology<\/h2>\n      <p class=\"text-sm text-slate-400 leading-relaxed\">Living WebGL mesh tracking real-time ingress vectors and mitigating adversarial threats automatically.<\/p>\n    <\/div>\n  <\/main>\n  <script>\n    const canvas = document.getElementById('grid-canvas');\n    const scene = new THREE.Scene();\n    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);\n    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });\n    renderer.setSize(window.innerWidth, window.innerHeight);\n    const geo = new THREE.IcosahedronGeometry(3, 2);\n    const mat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true, transparent: true, opacity: 0.35 });\n    const mesh = new THREE.Mesh(geo, mat);\n    scene.add(mesh);\n    camera.position.z = 7;\n    function anim() { requestAnimationFrame(anim); mesh.rotation.x += 0.003; mesh.rotation.y += 0.005; renderer.render(scene, camera); }\n    anim();\n    window.addEventListener('resize', () => { camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix(); renderer.setSize(window.innerWidth, window.innerHeight); });\n  <\/script>\n<\/body>\n<\/html>"
                    ]
                ]
            ]
        ]
    ];
    write_json_data('projects.json', $initialProjects);
}

// Auto-seed settings.json if missing
if (!file_exists(get_json_path('settings.json'))) {
    write_json_data('settings.json', [
        'routingMode' => 'MANUAL',
        'fallbackMode' => 'NONE',
        'localOnlyMode' => false,
        'autoApplyCode' => true,
        'terminalAutoScroll' => true,
        'editorFontSize' => 14,
        'universalSystemPrompt' => 'You are Omnintellx, an Autonomous Multi-Agent Software Engineering Studio. You write complete, production-grade code without placeholders.'
    ]);
}

// Auto-seed activity.json if missing
if (!file_exists(get_json_path('activity.json'))) {
    write_json_data('activity.json', [
        'activities' => [
            [
                'id' => 'act_' . time(),
                'type' => 'SYSTEM_INIT',
                'timestamp' => date('c'),
                'metadata' => ['engine' => 'Omnintellx Production PHP Engine', 'status' => 'ONLINE']
            ]
        ]
    ]);
}

// Auto-seed ideas.json if missing
if (!file_exists(get_json_path('ideas.json'))) {
    write_json_data('ideas.json', ['ideas' => []]);
}

// Auto-seed chats.json if missing
if (!file_exists(get_json_path('chats.json'))) {
    write_json_data('chats.json', ['sessions' => []]);
}

// ============================================================================
// 2. HTTP REQUEST PARSING
// ============================================================================
$action = $_GET['action'] ?? $_POST['action'] ?? '';
$rawInput = @file_get_contents('php://input');
$jsonInput = json_decode($rawInput, true);
$input = is_array($jsonInput) ? $jsonInput : $_POST;

function send_json($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function send_error($message, $statusCode = 400, $extra = []) {
    send_json(array_merge(['ok' => false, 'error' => $message], $extra), $statusCode);
}

// Helper to log activities
function log_activity($type, $metadata = []) {
    $data = read_json_data('activity.json', ['activities' => []]);
    $data['activities'] = $data['activities'] ?? [];
    array_unshift($data['activities'], [
        'id' => 'act_' . microtime(true),
        'type' => $type,
        'timestamp' => date('c'),
        'metadata' => $metadata
    ]);
    if (count($data['activities']) > 200) {
        $data['activities'] = array_slice($data['activities'], 0, 200);
    }
    write_json_data('activity.json', $data);
}

// Helper: Make HTTP request using cURL or fallback to file_get_contents
function execute_http_request($url, $method = 'POST', $headers = [], $body = null, $timeout = 45) {
    $start = microtime(true);
    
    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Omnintellx-Studio/5.0 (InfinityFree/Client)');
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

        $formattedHeaders = [];
        foreach ($headers as $k => $v) {
            $formattedHeaders[] = $k . ': ' . $v;
        }
        curl_setopt($ch, CURLOPT_HTTPHEADER, $formattedHeaders);

        if ($body !== null) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, is_string($body) ? $body : json_encode($body));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr = curl_error($ch);
        curl_close($ch);

        $latency = (int)round((microtime(true) - $start) * 1000);

        if ($response === false) {
            return [
                'ok' => false,
                'statusCode' => 0,
                'latency' => $latency,
                'error' => 'cURL error: ' . $curlErr,
                'body' => null
            ];
        }

        return [
            'ok' => ($httpCode >= 200 && $httpCode < 300),
            'statusCode' => $httpCode,
            'latency' => max($latency, 15),
            'body' => $response,
            'error' => ($httpCode >= 200 && $httpCode < 300) ? null : "HTTP $httpCode: " . substr($response, 0, 250)
        ];
    } else {
        // Fallback using stream_context
        $headerLines = [];
        foreach ($headers as $k => $v) {
            $headerLines[] = $k . ': ' . $v;
        }

        $opts = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headerLines),
                'content' => $body !== null ? (is_string($body) ? $body : json_encode($body)) : null,
                'timeout' => $timeout,
                'ignore_errors' => true
            ],
            'ssl' => [
                'verify_peer' => false,
                'verify_peer_name' => false
            ]
        ];

        $context = stream_context_create($opts);
        $response = @file_get_contents($url, false, $context);
        $latency = (int)round((microtime(true) - $start) * 1000);

        $httpCode = 200;
        if (isset($http_response_header) && is_array($http_response_header)) {
            if (preg_match('/HTTP\/\S*\s+(\d+)/', $http_response_header[0], $m)) {
                $httpCode = (int)$m[1];
            }
        }

        if ($response === false) {
            return [
                'ok' => false,
                'statusCode' => $httpCode ?: 0,
                'latency' => $latency,
                'error' => 'Connection failed: Unable to connect to host',
                'body' => null
            ];
        }

        return [
            'ok' => ($httpCode >= 200 && $httpCode < 300),
            'statusCode' => $httpCode,
            'latency' => max($latency, 15),
            'body' => $response,
            'error' => ($httpCode >= 200 && $httpCode < 300) ? null : "HTTP $httpCode: " . substr($response, 0, 250)
        ];
    }
}

// ============================================================================
// 3. ACTION DISPATCHER
// ============================================================================
try {
    switch ($action) {
        // ----------------------------------------------------
        // PING / HEALTH
        // ----------------------------------------------------
        case 'system.ping':
        case 'ping':
            send_json([
                'ok' => true,
                'engine' => 'Omnintellx Autonomous Software Studio Engine',
                'status' => 'ONLINE',
                'version' => '5.0.0',
                'dataDir' => $dataDir,
                'timestamp' => date('c')
            ]);
            break;

        // ----------------------------------------------------
        // PROVIDERS PERSISTENCE (Strict Independence)
        // ----------------------------------------------------
        case 'providers.get':
        case 'get_providers':
            $provData = read_json_data('providers.json');
            send_json([
                'ok' => true,
                'providers' => $provData['providers'] ?? [],
                'activeInferenceTarget' => $provData['activeInferenceTarget'] ?? null,
                'routingMode' => $provData['routingMode'] ?? 'MANUAL',
                'fallbackMode' => $provData['fallbackMode'] ?? 'NONE'
            ]);
            break;

        case 'providers.save':
        case 'save_providers':
            $providers = $input['providers'] ?? null;
            if (!is_array($providers)) {
                send_error('Invalid providers array');
            }

            $existing = read_json_data('providers.json');
            $existing['providers'] = $providers;
            if (isset($input['activeInferenceTarget'])) {
                $existing['activeInferenceTarget'] = $input['activeInferenceTarget'];
            }
            if (isset($input['routingMode'])) {
                $existing['routingMode'] = $input['routingMode'];
            }
            if (isset($input['fallbackMode'])) {
                $existing['fallbackMode'] = $input['fallbackMode'];
            }

            write_json_data('providers.json', $existing);
            log_activity('PROVIDERS_UPDATED', ['count' => count($providers)]);
            send_json(['ok' => true, 'message' => 'Providers persisted successfully']);
            break;

        // ----------------------------------------------------
        // STRICT LIVE PROVIDER CONNECTION TEST
        // ----------------------------------------------------
        case 'provider.test':
        case 'test_provider':
            $providerId = $input['providerId'] ?? '';
            $provType = $input['type'] ?? '';
            $apiKey = trim($input['apiKey'] ?? '');
            $baseUrl = trim($input['baseUrl'] ?? '');
            $modelId = trim($input['modelId'] ?? '');

            if (empty($provType)) {
                send_error('Provider type is required for testing', 400);
            }

            // Google Gemini
            if ($provType === 'gemini') {
                if (empty($apiKey)) {
                    send_json([
                        'ok' => false,
                        'latency' => 0,
                        'statusCode' => 401,
                        'error' => 'Gemini API key is required. Enter your API key in settings.'
                    ], 200);
                }
                $base = $baseUrl ?: 'https://generativelanguage.googleapis.com/v1beta';

                // Step 1: Discover models
                $listUrl = rtrim($base, '/') . '/models?key=' . urlencode($apiKey);
                $listRes = execute_http_request($listUrl, 'GET', ['Content-Type' => 'application/json'], null, 8);

                $discoveredModels = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash', 'gemini-1.5-pro'];
                if ($listRes['ok']) {
                    $listData = json_decode($listRes['body'], true);
                    if (!empty($listData['models']) && is_array($listData['models'])) {
                        $discoveredModels = [];
                        foreach ($listData['models'] as $m) {
                            if (!empty($m['name'])) {
                                $discoveredModels[] = preg_replace('/^models\//', '', $m['name']);
                            }
                        }
                    }
                } else if ($listRes['statusCode'] === 400 || $listRes['statusCode'] === 401 || $listRes['statusCode'] === 403) {
                    send_json([
                        'ok' => false,
                        'providerId' => $provId ?: 'prov_gemini',
                        'providerType' => 'gemini',
                        'modelId' => $modelId ?: 'gemini-2.0-flash',
                        'latency' => $listRes['latency'],
                        'statusCode' => $listRes['statusCode'],
                        'errorType' => 'AUTHENTICATION',
                        'error' => 'Gemini HTTP ' . $listRes['statusCode'] . ' — Invalid API key or permission denied'
                    ]);
                }

                // Step 2: Minimal live inference probe on selected model (Mandatory for ok: true)
                $targetModel = $modelId ?: ($discoveredModels[0] ?? 'gemini-2.0-flash');
                $genUrl = rtrim($base, '/') . '/models/' . $targetModel . ':generateContent?key=' . urlencode($apiKey);
                $genRes = execute_http_request($genUrl, 'POST', ['Content-Type' => 'application/json'], [
                    'contents' => [['role' => 'user', 'parts' => [['text' => 'Respond OK']]]]
                ], 10);

                if ($genRes['ok']) {
                    send_json([
                        'ok' => true,
                        'providerId' => $provId ?: 'prov_gemini',
                        'providerType' => 'gemini',
                        'modelId' => $targetModel,
                        'latency' => $genRes['latency'],
                        'statusCode' => 200,
                        'models' => array_slice($discoveredModels, 0, 20),
                        'message' => 'Connected successfully to Google Gemini AI Studio [' . $targetModel . ']'
                    ]);
                } else {
                    $st = $genRes['statusCode'];
                    $errType = ($st === 401 || $st === 403) ? 'AUTHENTICATION' : (($st === 429) ? 'RATE_LIMIT' : (($st === 400 || $st === 404) ? 'INVALID_MODEL' : 'NETWORK'));
                    $msg = ($st === 401 || $st === 403) ? 'Gemini HTTP ' . $st . ' — Invalid API key' : (($st === 429) ? 'Gemini HTTP 429 — Rate limited' : (($st === 400 || $st === 404) ? 'Gemini HTTP ' . $st . ' — Invalid model [' . $targetModel . ']' : ($genRes['error'] ?: 'Gemini inference failed')));
                    send_json([
                        'ok' => false,
                        'providerId' => $provId ?: 'prov_gemini',
                        'providerType' => 'gemini',
                        'modelId' => $targetModel,
                        'latency' => $genRes['latency'],
                        'statusCode' => $st,
                        'errorType' => $errType,
                        'error' => $msg,
                        'models' => $discoveredModels
                    ]);
                }
            }

            // OpenRouter
            if ($provType === 'openrouter') {
                if (empty($apiKey)) {
                    send_json([
                        'ok' => false,
                        'providerId' => $provId ?: 'prov_openrouter',
                        'providerType' => 'openrouter',
                        'latency' => 0,
                        'statusCode' => 401,
                        'errorType' => 'AUTHENTICATION',
                        'error' => 'OpenRouter API key is required. Enter your API key in settings.'
                    ]);
                }
                $base = $baseUrl ?: 'https://openrouter.ai/api/v1';

                // Step 1: List models for discovery
                $modelsUrl = rtrim($base, '/') . '/models';
                $modelsRes = execute_http_request($modelsUrl, 'GET', [
                    'Authorization' => 'Bearer ' . $apiKey
                ], null, 6);

                $discoveredModels = ['anthropic/claude-3.7-sonnet', 'google/gemini-2.5-pro', 'deepseek/deepseek-r1', 'openai/gpt-4o'];
                if ($modelsRes['ok']) {
                    $mData = json_decode($modelsRes['body'], true);
                    if (!empty($mData['data']) && is_array($mData['data'])) {
                        $discoveredModels = array_map(function($item) { return $item['id']; }, array_slice($mData['data'], 0, 30));
                    }
                } else if ($modelsRes['statusCode'] === 401 || $modelsRes['statusCode'] === 403) {
                    send_json([
                        'ok' => false,
                        'providerId' => $provId ?: 'prov_openrouter',
                        'providerType' => 'openrouter',
                        'latency' => $modelsRes['latency'],
                        'statusCode' => 401,
                        'errorType' => 'AUTHENTICATION',
                        'error' => 'OpenRouter HTTP 401 — Invalid API key'
                    ]);
                }

                // Step 2: Live Minimal Chat Completions Probe on Selected Model (Mandatory for ok: true)
                $targetModel = $modelId ?: 'anthropic/claude-3.7-sonnet';
                $url = rtrim($base, '/') . '/chat/completions';
                $res = execute_http_request($url, 'POST', [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $apiKey,
                    'HTTP-Referer' => 'https://omnintellx.ai',
                    'X-Title' => 'Omnintellx Studio'
                ], [
                    'model' => $targetModel,
                    'messages' => [['role' => 'user', 'content' => 'Say OK']],
                    'max_tokens' => 4
                ], 10);

                if ($res['ok']) {
                    send_json([
                        'ok' => true,
                        'providerId' => $provId ?: 'prov_openrouter',
                        'providerType' => 'openrouter',
                        'modelId' => $targetModel,
                        'latency' => $res['latency'],
                        'statusCode' => 200,
                        'models' => $discoveredModels,
                        'message' => 'Connected successfully to OpenRouter Gateway [' . $targetModel . ']'
                    ]);
                } else {
                    $st = $res['statusCode'];
                    $errType = ($st === 401) ? 'AUTHENTICATION' : (($st === 402) ? 'INSUFFICIENT_CREDITS' : (($st === 429) ? 'RATE_LIMIT' : (($st === 400) ? 'INVALID_MODEL' : 'NETWORK')));
                    $msg = ($st === 401) ? 'OpenRouter HTTP 401 — Invalid API key' : (($st === 402) ? 'OpenRouter HTTP 402 — Insufficient credits on account' : (($st === 429) ? 'OpenRouter HTTP 429 — Rate limited' : (($st === 400) ? 'OpenRouter HTTP 400 — Invalid model [' . $targetModel . ']' : ($res['error'] ?: 'OpenRouter inference probe failed'))));
                    send_json([
                        'ok' => false,
                        'providerId' => $provId ?: 'prov_openrouter',
                        'providerType' => 'openrouter',
                        'modelId' => $targetModel,
                        'latency' => $res['latency'],
                        'statusCode' => $st,
                        'errorType' => $errType,
                        'error' => $msg,
                        'models' => $discoveredModels
                    ]);
                }
            }

            // Anthropic Claude
            if ($provType === 'anthropic') {
                if (empty($apiKey)) {
                    send_json([
                        'ok' => false,
                        'latency' => 0,
                        'statusCode' => 401,
                        'error' => 'Anthropic API key is required.'
                    ]);
                }
                $targetModel = $modelId ?: 'claude-3-7-sonnet-20250219';
                $base = $baseUrl ?: 'https://api.anthropic.com/v1';
                $url = rtrim($base, '/') . '/messages';

                $res = execute_http_request($url, 'POST', [
                    'Content-Type' => 'application/json',
                    'x-api-key' => $apiKey,
                    'anthropic-version' => '2023-06-01'
                ], [
                    'model' => $targetModel,
                    'messages' => [['role' => 'user', 'content' => 'Say OK']],
                    'max_tokens' => 5
                ], 10);

                if ($res['ok']) {
                    send_json([
                        'ok' => true,
                        'latency' => $res['latency'],
                        'models' => ['claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']
                    ]);
                } else {
                    send_json([
                        'ok' => false,
                        'latency' => $res['latency'],
                        'statusCode' => $res['statusCode'],
                        'error' => $res['error'] ?: 'Anthropic connection failed.'
                    ]);
                }
            }

            // Standard OpenAI-Compatible (OpenAI, Cerebras, Groq, DeepSeek, Together, Mistral, Grok, Custom)
            $defaultEndpoints = [
                'openai' => 'https://api.openai.com/v1',
                'cerebras' => 'https://api.cerebras.ai/v1',
                'groq' => 'https://api.groq.com/openai/v1',
                'deepseek' => 'https://api.deepseek.com',
                'together' => 'https://api.together.xyz/v1',
                'mistral' => 'https://api.mistral.ai/v1',
                'grok' => 'https://api.x.ai/v1',
                'custom' => 'https://api.openai.com/v1'
            ];

            $base = $baseUrl ?: ($defaultEndpoints[$provType] ?? 'https://api.openai.com/v1');
            $headers = ['Content-Type' => 'application/json'];
            if (!empty($apiKey)) {
                $headers['Authorization'] = 'Bearer ' . $apiKey;
            }

            $url = rtrim($base, '/') . '/chat/completions';
            $targetModel = $modelId ?: 'default-model';

            $res = execute_http_request($url, 'POST', $headers, [
                'model' => $targetModel,
                'messages' => [['role' => 'user', 'content' => 'Say OK']],
                'max_tokens' => 5
            ], 10);

            if ($res['ok']) {
                send_json([
                    'ok' => true,
                    'latency' => $res['latency'],
                    'message' => 'Connection verified successfully.'
                ]);
            } else {
                send_json([
                    'ok' => false,
                    'latency' => $res['latency'],
                    'statusCode' => $res['statusCode'],
                    'error' => $res['error'] ?: "Connection error for $provType."
                ]);
            }
            break;

        // ----------------------------------------------------
        // INFERENCE PROXY (No Silent Fallback!)
        // ----------------------------------------------------
        case 'chat.completions':
        case 'chat_completion':
            $provType = $input['providerType'] ?? $input['provider'] ?? '';
            $providerId = $input['providerId'] ?? '';
            $modelId = $input['modelId'] ?? $input['model'] ?? '';
            $messages = $input['messages'] ?? [];
            $apiKey = trim($input['apiKey'] ?? '');
            $baseUrl = trim($input['baseUrl'] ?? '');
            $temperature = $input['temperature'] ?? 0.2;

            if (empty($provType) || empty($modelId)) {
                send_error('Provider type and model ID are required.', 400);
            }

            // Gemini Chat Execution
            if ($provType === 'gemini') {
                if (empty($apiKey)) {
                    send_error('Gemini API key is required for inference.', 401);
                }
                $base = $baseUrl ?: 'https://generativelanguage.googleapis.com/v1beta';
                $url = rtrim($base, '/') . '/models/' . $modelId . ':generateContent?key=' . urlencode($apiKey);

                $contents = [];
                $systemParts = [];
                foreach ($messages as $m) {
                    if ($m['role'] === 'system') {
                        $systemParts[] = ['text' => $m['content']];
                    } else {
                        $contents[] = [
                            'role' => $m['role'] === 'assistant' ? 'model' : 'user',
                            'parts' => [['text' => $m['content']]]
                        ];
                    }
                }

                $payload = ['contents' => $contents];
                if (!empty($systemParts)) {
                    $payload['systemInstruction'] = ['parts' => $systemParts];
                }

                $res = execute_http_request($url, 'POST', ['Content-Type' => 'application/json'], $payload, 60);
                if (!$res['ok']) {
                    send_error($res['error'] ?: 'Gemini inference failed', $res['statusCode'] ?: 500);
                }

                $data = json_decode($res['body'], true);
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? '';
                send_json([
                    'ok' => true,
                    'content' => $text,
                    'providerId' => $providerId,
                    'modelId' => $modelId,
                    'latency' => $res['latency']
                ]);
            }

            // OpenAI / OpenRouter / Anthropic Compatible Execution
            $defaultEndpoints = [
                'openrouter' => 'https://openrouter.ai/api/v1',
                'openai' => 'https://api.openai.com/v1',
                'cerebras' => 'https://api.cerebras.ai/v1',
                'groq' => 'https://api.groq.com/openai/v1',
                'deepseek' => 'https://api.deepseek.com',
                'together' => 'https://api.together.xyz/v1',
                'mistral' => 'https://api.mistral.ai/v1',
                'grok' => 'https://api.x.ai/v1',
                'ollama' => 'http://localhost:11434',
                'custom' => 'https://api.openai.com/v1'
            ];

            $base = $baseUrl ?: ($defaultEndpoints[$provType] ?? 'https://api.openai.com/v1');
            $headers = ['Content-Type' => 'application/json'];
            if (!empty($apiKey)) {
                $headers['Authorization'] = 'Bearer ' . $apiKey;
            }
            if ($provType === 'openrouter') {
                $headers['HTTP-Referer'] = 'https://omnintellx.ai';
                $headers['X-Title'] = 'Omnintellx Studio';
            }

            $url = rtrim($base, '/') . '/chat/completions';
            $res = execute_http_request($url, 'POST', $headers, [
                'model' => $modelId,
                'messages' => $messages,
                'temperature' => $temperature
            ], 60);

            if (!$res['ok']) {
                send_error($res['error'] ?: "Inference error from $provType", $res['statusCode'] ?: 500);
            }

            $data = json_decode($res['body'], true);
            $text = $data['choices'][0]['message']['content'] ?? '';
            send_json([
                'ok' => true,
                'content' => $text,
                'providerId' => $providerId,
                'modelId' => $modelId,
                'latency' => $res['latency']
            ]);
            break;

        // ----------------------------------------------------
        // PROJECT & WORKSPACE OPERATIONS
        // ----------------------------------------------------
        case 'project.list':
        case 'projects_list':
            $data = read_json_data('projects.json');
            send_json(['ok' => true, 'data' => $data['projects'] ?? []]);
            break;

        case 'project.save_all':
            $projects = $input['projects'] ?? null;
            if (!is_array($projects)) {
                send_error('Invalid projects data');
            }
            $data = ['version' => 1, 'projects' => $projects];
            write_json_data('projects.json', $data);
            log_activity('PROJECTS_SAVED_ALL', ['count' => count($projects)]);
            send_json(['ok' => true, 'message' => 'All projects saved successfully']);
            break;

        case 'project.save':
        case 'project_save':
            $proj = $input['project'] ?? null;
            if (!$proj || empty($proj['id'])) {
                send_error('Invalid project object');
            }
            $data = read_json_data('projects.json', ['projects' => []]);
            $existing = false;
            foreach ($data['projects'] as &$p) {
                if ($p['id'] === $proj['id']) {
                    $p = array_merge($p, $proj, ['updatedAt' => time()]);
                    $existing = true;
                    break;
                }
            }
            if (!$existing) {
                $proj['createdAt'] = time();
                $proj['updatedAt'] = time();
                $data['projects'][] = $proj;
            }
            write_json_data('projects.json', $data);
            log_activity('PROJECT_SAVED', ['projectId' => $proj['id'], 'name' => $proj['name'] ?? '']);
            send_json(['ok' => true, 'project' => $proj]);
            break;

        // ----------------------------------------------------
        // CHAT SESSIONS PERSISTENCE
        // ----------------------------------------------------
        case 'chat.list':
            $data = read_json_data('chats.json');
            send_json(['ok' => true, 'data' => $data['sessions'] ?? []]);
            break;

        case 'chat.save_all':
            $sessions = $input['sessions'] ?? [];
            write_json_data('chats.json', ['sessions' => $sessions]);
            send_json(['ok' => true]);
            break;

        // ----------------------------------------------------
        // ACTIVITY LOGS
        // ----------------------------------------------------
        case 'activity.list':
        case 'get_activity':
            $data = read_json_data('activity.json');
            send_json(['ok' => true, 'data' => $data['activities'] ?? []]);
            break;

        case 'activity.log':
            $type = $input['type'] ?? 'UNKNOWN';
            $meta = $input['metadata'] ?? [];
            log_activity($type, $meta);
            send_json(['ok' => true]);
            break;

        // ----------------------------------------------------
        // SETTINGS PERSISTENCE
        // ----------------------------------------------------
        case 'settings.get':
            $data = read_json_data('settings.json');
            send_json(['ok' => true, 'data' => $data]);
            break;

        case 'settings.save':
            $settings = $input['settings'] ?? [];
            write_json_data('settings.json', $settings);
            send_json(['ok' => true]);
            break;

        // ----------------------------------------------------
        // DEFAULT HEALTH PING
        // ----------------------------------------------------
        default:
            send_json([
                'engine' => 'Omnintellx Autonomous Software Studio Engine',
                'status' => 'ONLINE',
                'version' => '5.0.0',
                'dataDir' => $dataDir,
                'availableActions' => [
                    'system.ping',
                    'providers.get',
                    'providers.save',
                    'provider.test',
                    'chat.completions',
                    'project.list',
                    'project.save',
                    'project.save_all',
                    'chat.list',
                    'chat.save_all',
                    'activity.list',
                    'activity.log',
                    'settings.get',
                    'settings.save'
                ],
                'timestamp' => date('c')
            ]);
            break;
    }
} catch (Exception $e) {
    send_error($e->getMessage(), 500);
}
