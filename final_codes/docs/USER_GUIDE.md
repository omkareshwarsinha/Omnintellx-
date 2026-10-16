# 📖 Omnintellx User & Developer Guide

## 1. Quick Start
1. **Open Omnintellx**: Launch the studio in your browser.
2. **Configure API Gateways (Settings)**:
   - Navigate to **Settings & API Configuration** → **API Gateways & Models**.
   - Enter your API keys for **OpenRouter**, **Google Gemini**, **Cerebras**, **xAI Grok**, **Local LLM (Ollama)**, or **Custom API**.
   - Click **Test Connection** (or **Test All Connections & Crawl**).
   - Omnintellx tests the connection and crawls all available models from that provider.
   - Select your default model or toggle enabled models with the interactive chips.
3. **Choose a Reasoning Model**: Select your desired model from the top dropdown in the chat header.
4. **Select Mode**:
   - **Direct Chat**: For interactive questions, brainstorming, and single-file creation.
   - **Manus Agent**: For complete autonomous project operation.
   - **Multi-AI Council**: For multi-model peer review and synthesis.

## 2. Using the New Chat Feature
- Click **+ New Chat** in the top navigation.
- If your active project has files, you will be prompted:
  - **Continue in Current Workspace**: Clears chat log but retains project files.
  - **Create Brand New Workspace**: Spins up an isolated directory and fresh workspace.

## 3. Auto-Code Detection & Applier
- Whenever an AI model responds with code blocks, Omnintellx parses the files automatically.
- Check the **Auto-Detected Workspace Files** card at the bottom of the response:
  - Click **⚡ Apply to Workspace** to commit the code to disk.
  - Click **Preview** to view the app in the sandbox iframe.
  - Click **Edit** to jump to the code in the Monaco Code Editor.

## 4. Exporting Deliverables
- Complete release deliverables are packaged in both `/omnin/` and `/omni/`:
  - `omnin/index.html` & `omni/index.html`: Standalone portable single-file build.
  - `omnin/docs.zip` & `omni/docs.zip`: Complete documentation package containing exclusively docs.
  - `omnin/docs/` & `omni/docs/`: Full documentation markdown suite.
