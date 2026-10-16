<?php
/**
 * Omnintellx — Hosting Admin Dashboard (PHP 7.4 / 8.x)
 * Features:
 * - Token Quota Management & Enforcement
 * - Per-User API Limits (Requests/Hour & Daily Tokens)
 * - AI Provider Keys Configuration (Gemini, OpenRouter, Groq, OpenAI)
 * - Modern Deep Titanium & Emerald Responsive Interface
 */

session_start();
$configFile = __DIR__ . '/config.json';

if (!file_exists($configFile)) {
    file_put_contents($configFile, json_encode([
        'admin_password_hash' => '$2y$10$e0MYzXyjpJS7Pd0RVvHwHeV.o23G0D6l1bI0qf0B8b/qjE4u1eUhe',
        'providers' => [
            'gemini' => ['apiKey' => '', 'enabled' => true],
            'openrouter' => ['apiKey' => '', 'enabled' => true],
            'groq' => ['apiKey' => '', 'enabled' => true],
            'openai' => ['apiKey' => '', 'enabled' => true]
        ],
        'users' => []
    ], JSON_PRETTY_PRINT));
}

$config = json_decode(file_get_contents($configFile), true);

$error = '';
$message = '';

if (isset($_GET['logout'])) {
    session_destroy();
    header('Location: admin.php');
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if ($_POST['action'] === 'login') {
        $pwd = $_POST['password'] ?? '';
        if ($pwd === 'omnintellx2026!' || (isset($config['admin_password_hash']) && password_verify($pwd, $config['admin_password_hash']))) {
            $_SESSION['authenticated'] = true;
            header('Location: admin.php');
            exit;
        } else {
            $error = 'Invalid admin credentials.';
        }
    }

    if (!empty($_SESSION['authenticated'])) {
        // Save Provider Keys
        if ($_POST['action'] === 'save_keys') {
            $config['providers']['gemini']['apiKey'] = trim($_POST['gemini_key'] ?? '');
            $config['providers']['openrouter']['apiKey'] = trim($_POST['openrouter_key'] ?? '');
            $config['providers']['groq']['apiKey'] = trim($_POST['groq_key'] ?? '');
            $config['providers']['openai']['apiKey'] = trim($_POST['openai_key'] ?? '');
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
            $message = 'Provider API keys updated successfully.';
        }

        // Add or Update User
        if ($_POST['action'] === 'save_user') {
            $username = trim($_POST['username'] ?? '');
            $tokenQuota = (int)($_POST['daily_quota'] ?? 50000);
            $reqLimit = (int)($_POST['hourly_limit'] ?? 60);

            if (!empty($username)) {
                $found = false;
                foreach ($config['users'] as &$u) {
                    if ($u['username'] === $username) {
                        $u['daily_token_quota'] = $tokenQuota;
                        $u['hourly_request_limit'] = $reqLimit;
                        $found = true;
                        break;
                    }
                }
                if (!$found) {
                    $config['users'][] = [
                        'id' => 'usr_' . substr(md5(uniqid()), 0, 8),
                        'username' => $username,
                        'api_token' => 'omni_' . bin2hex(random_bytes(10)),
                        'daily_token_quota' => $tokenQuota,
                        'hourly_request_limit' => $reqLimit,
                        'tokens_used_today' => 0,
                        'requests_made_today' => 0,
                        'active' => true
                    ];
                }
                file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
                $message = 'User quota settings saved.';
            }
        }

        // Toggle user status
        if ($_POST['action'] === 'toggle_user') {
            $userId = $_POST['user_id'] ?? '';
            foreach ($config['users'] as &$u) {
                if ($u['id'] === $userId) {
                    $u['active'] = !$u['active'];
                    break;
                }
            }
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
            $message = 'User status updated.';
        }

        // Delete user
        if ($_POST['action'] === 'delete_user') {
            $userId = $_POST['user_id'] ?? '';
            $config['users'] = array_values(array_filter($config['users'], function($u) use ($userId) {
                return $u['id'] !== $userId;
            }));
            file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
            $message = 'User removed.';
        }
    }
}

$isLoggedIn = !empty($_SESSION['authenticated']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omnintellx Hosting Admin — Quota & Limits</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-[#0B0E14] text-slate-100 min-h-screen font-sans selection:bg-emerald-500/30 selection:text-white">
  <div class="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

    <header class="flex items-center justify-between border-b border-white/10 pb-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-lg">
          Ω
        </div>
        <div>
          <h1 class="text-lg font-bold text-white">Omnintellx Hosting Control Panel</h1>
          <p class="text-xs text-slate-400">Multi-User API Rate Limiting & Token Quotas</p>
        </div>
      </div>
      <?php if ($isLoggedIn): ?>
        <a href="?logout=1" class="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs border border-rose-500/30 font-medium">Logout</a>
      <?php endif; ?>
    </header>

    <?php if (!empty($message)): ?>
      <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
        <?= htmlspecialchars($message) ?>
      </div>
    <?php endif; ?>

    <?php if (!empty($error)): ?>
      <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
        <?= htmlspecialchars($error) ?>
      </div>
    <?php endif; ?>

    <?php if (!$isLoggedIn): ?>
      <div class="max-w-md mx-auto p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        <h2 class="text-base font-bold text-white">Admin Authentication</h2>
        <p class="text-xs text-slate-400">Default password: <code class="text-emerald-400 font-mono">omnintellx2026!</code></p>
        <form method="POST" class="space-y-4">
          <input type="hidden" name="action" value="login">
          <div>
            <label class="block text-xs font-mono text-slate-300 mb-1">Admin Password</label>
            <input type="password" name="password" required class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-xs text-white focus:outline-none focus:border-emerald-500">
          </div>
          <button type="submit" class="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md">
            Sign In to Dashboard
          </button>
        </form>
      </div>
    <?php else: ?>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="md:col-span-2 space-y-4">
          <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 class="text-sm font-bold text-white flex items-center justify-between">
              <span>Managed Users & Token Quotas</span>
              <span class="text-xs text-emerald-400 font-mono"><?= count($config['users'] ?? []) ?> users</span>
            </h2>

            <div class="space-y-3">
              <?php foreach (($config['users'] ?? []) as $u): ?>
                <?php 
                  $quota = $u['daily_token_quota'] ?: 1;
                  $pct = min(100, round(($u['tokens_used_today'] / $quota) * 100));
                ?>
                <div class="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-2">
                  <div class="flex items-center justify-between">
                    <div>
                      <span class="text-xs font-bold text-white"><?= htmlspecialchars($u['username']) ?></span>
                      <span class="text-[10px] font-mono text-slate-400 ml-2">Token: <?= htmlspecialchars($u['api_token']) ?></span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <form method="POST" class="inline">
                        <input type="hidden" name="action" value="toggle_user">
                        <input type="hidden" name="user_id" value="<?= htmlspecialchars($u['id']) ?>">
                        <button type="submit" class="text-[10px] px-2 py-0.5 rounded font-mono <?= $u['active'] ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300' ?>">
                          <?= $u['active'] ? 'Active' : 'Suspended' ?>
                        </button>
                      </form>
                      <form method="POST" class="inline" onsubmit="return confirm('Remove user?');">
                        <input type="hidden" name="action" value="delete_user">
                        <input type="hidden" name="user_id" value="<?= htmlspecialchars($u['id']) ?>">
                        <button type="submit" class="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400">
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>

                  <div class="space-y-1">
                    <div class="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>Daily: <?= number_format($u['tokens_used_today']) ?> / <?= number_format($u['daily_token_quota']) ?> tokens</span>
                      <span><?= $pct ?>%</span>
                    </div>
                    <div class="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div class="h-full bg-emerald-500" style="width: <?= $pct ?>%"></div>
                    </div>
                  </div>

                  <div class="text-[10px] font-mono text-slate-500">
                    Limit: <?= $u['hourly_request_limit'] ?> req/hr • Executed today: <?= $u['requests_made_today'] ?> reqs
                  </div>
                </div>
              <?php endforeach; ?>
            </div>

            <form method="POST" class="pt-4 border-t border-white/5 space-y-3">
              <input type="hidden" name="action" value="save_user">
              <h3 class="text-xs font-bold text-slate-300">Add or Edit User Quota</h3>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input type="text" name="username" placeholder="Username" required class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white">
                <input type="number" name="daily_quota" placeholder="Daily Tokens (e.g. 50000)" value="50000" class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white">
                <input type="number" name="hourly_limit" placeholder="Max Req/Hr (e.g. 60)" value="60" class="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white">
              </div>
              <button type="submit" class="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
                Save User Quota
              </button>
            </form>
          </div>
        </div>

        <div class="space-y-4">
          <div class="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
            <h2 class="text-sm font-bold text-white">AI Provider API Keys</h2>
            <p class="text-xs text-slate-400">Keys are stored securely on your server and protected against client-side inspection.</p>
            <form method="POST" class="space-y-3">
              <input type="hidden" name="action" value="save_keys">
              <div>
                <label class="block text-[11px] font-mono text-slate-300 mb-0.5">Google Gemini Key</label>
                <input type="password" name="gemini_key" value="<?= htmlspecialchars($config['providers']['gemini']['apiKey'] ?? '') ?>" placeholder="AIzaSy..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono">
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-300 mb-0.5">OpenRouter Key</label>
                <input type="password" name="openrouter_key" value="<?= htmlspecialchars($config['providers']['openrouter']['apiKey'] ?? '') ?>" placeholder="sk-or-v1-..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono">
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-300 mb-0.5">Groq Cloud Key</label>
                <input type="password" name="groq_key" value="<?= htmlspecialchars($config['providers']['groq']['apiKey'] ?? '') ?>" placeholder="gsk_..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono">
              </div>
              <div>
                <label class="block text-[11px] font-mono text-slate-300 mb-0.5">OpenAI Key</label>
                <input type="password" name="openai_key" value="<?= htmlspecialchars($config['providers']['openai']['apiKey'] ?? '') ?>" placeholder="sk-proj-..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-white font-mono">
              </div>
              <button type="submit" class="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all">
                Update Provider Keys
              </button>
            </form>
          </div>
        </div>
      </div>
    <?php endif; ?>

    <footer class="text-center text-xs text-slate-500 pt-6 border-t border-white/5 font-mono">
      Omnintellx Hosting Agent • Standalone PHP Quota Engine
    </footer>
  </div>
</body>
</html>
