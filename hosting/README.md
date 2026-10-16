# Omnintellx — PHP Self-Hosted Distribution

This directory contains the self-hosted deployment package for Omnintellx, compatible with any standard PHP 7.4 / 8.x web host (e.g., Apache, Nginx, InfinityFree, cPanel).

## Files
- `index.html`: Complete standalone client web application.
- `admin.php`: Session-authenticated admin dashboard for token quotas and API limits (Default password: `omnintellx2026!`).
- `api_proxy.php`: Server-side proxy enforcing Bearer user token limits and daily token quotas before forwarding requests upstream.
- `config.json`: User quotas and provider API keys storage.

## Deployment Instructions
1. Upload all files in this directory to your web hosting root (e.g. `public_html/` or `/htdocs/`).
2. Open `yourdomain.com/admin.php` in your browser.
3. Sign in using `omnintellx2026!`.
4. Enter your AI Provider API keys (Gemini, OpenRouter, Groq, or OpenAI) and manage user token limits.
5. Clients access `yourdomain.com/` and connect through `api_proxy.php`.
