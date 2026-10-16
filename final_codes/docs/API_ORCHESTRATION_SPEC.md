# 🌐 Omnintellx Multi-AI API Orchestration Specification

## 1. Multi-API Gateway & Model Routing Architecture
Omnintellx provides a universal provider abstraction supporting both cloud and local AI gateways:
- **Google Gemini**: Gemini 2.5 Flash, Gemini 1.5 Pro, Gemini Flash thinking via Google AI Studio API.
- **OpenRouter**: Unified access to Claude 3.7 Sonnet, GPT-4o, DeepSeek R1, Llama 3.3 70B, Qwen 2.5 Coder.
- **Cerebras Fast Compute**: Ultra-high-speed inference for Llama 3.3 70B, Llama 3.1 8B.
- **xAI Grok**: Grok-2, Grok-2 Vision, Grok Beta via official xAI endpoints.
- **Local LLMs**: Ollama daemon (localhost:11434), LocalAI, LM Studio, vLLM for 100% offline air-gapped compute.
- **Custom OpenAI-Compatible**: Any endpoint adhering to standard `/v1/chat/completions` and `/v1/models`.

## 2. Dynamic Model Discovery & Live Crawling
When a user inputs an API key or base URL and clicks **Test Connection**, the system invokes the live model crawler:
1. Dispatches authentication test to `/api/models/test`.
2. Queries the provider's `/models` or `/api/tags` catalog endpoint with valid Bearer credentials.
3. Automatically parses and returns all allotted models granted to that account.
4. Populates interactive model chips directly in Settings and the Chat Reasoning Engine dropdown.
5. Users can toggle active models, set default models, or type custom fine-tuned model IDs.

## 3. Tool Execution Schema (JSON-RPC)

### `create_file`
```json
{
  "tool": "create_file",
  "params": {
    "path": "src/components/Viewer.tsx",
    "content": "import React from 'react';..."
  }
}
```

### `edit_file`
```json
{
  "tool": "edit_file",
  "params": {
    "path": "index.html",
    "target": "<title>Old Title</title>",
    "replacement": "<title>Omnintellx Autonomous App</title>"
  }
}
```

### `execute_command`
```json
{
  "tool": "execute_command",
  "params": {
    "command": "npm test"
  }
}
```

## 4. Server Endpoints Reference
- `POST /api/models/test`: Verify API key/URL and crawl allotted models.
- `POST /api/projects`: Initialize project workspace on disk.
- `GET /api/projects/:id/files`: List workspace files.
- `POST /api/projects/:id/files/write`: Write/update file.
- `POST /api/projects/:id/files/edit`: Find-and-replace edit.
- `POST /api/projects/:id/files/delete`: Delete file.
- `POST /api/execute`: Run terminal command in workspace.
- `POST /api/projects/:id/output/compile`: Compile project deliverables.
