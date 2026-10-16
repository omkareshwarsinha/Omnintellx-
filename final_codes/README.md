# ⚡ Omnintellx — Master Autonomous Software Studio (Final Single-File Distribution)

## 📁 Architecture: Single-File HTML + Single-File PHP
This distribution fulfills the zero-dependency, single-file architecture constraint:
- **`index.html`**: 100% self-contained Autonomous Software Studio (inline HTML, CSS, JavaScript, WebGL Three.js, Lucide icons, Monaco editor preview, dynamic code detection, and multi-model council).
- **`intellx.php`**: 100% self-contained PHP API Gateway and multi-provider inference proxy. Zero external library dependencies.
- **`data/`**: Automatically created and maintained by `intellx.php` with JSON storage (`providers.json`, `projects.json`, `settings.json`, `activity.json`, `ideas.json`, `chats.json`).

## 🛡️ Critical Guarantees Verified
1. **Providers Are 100% Independent**: Modifying or testing Gemini NEVER mutates OpenRouter. Each provider maintains its own credentials, endpoint, and model list.
2. **Authoritative Inference Identity**: Targets are identified by `{ providerId, providerType, modelId }`.
3. **Exact Manual Execution**: Selecting OpenRouter / Claude executes OpenRouter / Claude with zero silent fallback.
4. **Zero Silent Pollinations Fallback**: If a provider returns 401, 403, 429, or fails, the real error code and response body are raised and displayed to the user.
5. **Auto-Provisioning**: On first execution, `intellx.php` automatically creates `data/` and all necessary JSON state stores.
