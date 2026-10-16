# 📄 Omnintellx Autonomous Software Studio — Product Requirements Document (PRD)

## 1. Executive Summary
**Omnintellx** is a next-generation Autonomous Multi-Agent Software Engineering Platform engineered on the principle:
> *"The AI should never 'generate a project.' It should operate a project."*

Inspired by the agentic breakthroughs of **Manus** and **Ideavo**, Omnintellx integrates a full stateful execution loop that translates high-level user missions into concrete filesystem actions, continuous terminal telemetry, dynamic task graphs, automated debugging, and verified production deliverables.

## 2. Core Vision & Problem Statement
- **Problem**: Traditional AI code assistants generate isolated code snippets or dump unverified static templates. When runtime errors occur, the user is left stranded to debug and wire files manually.
- **Solution**: Omnintellx operates the project like an autonomous staff engineer. It inspects existing files, formulates a dynamic Directed Acyclic Graph (DAG) of tasks, executes edits via real filesystem tools, verifies execution through terminal and browser sandboxes, observes stdout/stderr, hotpatches bugs through a dedicated debugger loop, and packages production deliverables.

## 3. Key Capabilities & Functional Requirements
### 3.1. Proper Chat UI for Multi-Model Interaction
- Direct interaction with cutting-edge frontier reasoning models:
  - **Google Gemini 2.5 Flash & 1.5 Pro**
  - **Anthropic Claude 3.5 Sonnet**
  - **OpenAI GPT-4o**
  - **DeepSeek R1 & V3**
  - **Meta / Groq Llama 3.3 70B**
  - **Local In-Browser Kernel**
- Mode switching: **Direct AI Chat**, **Manus & Ideavo Agent Loop**, and **Multi-AI Council**.
- Real-time token tracking, latency indicators, and interactive tool call cards.

### 3.2. Models Control and Edit Files & Codes
- Bidirectional execution gateway:
  - `create_file(path, content)`
  - `edit_file(path, target, replacement)`
  - `delete_file(path)`
  - `execute_command(command)`
  - `inspect_project()`
  - `git_checkpoint(name, reason)`
- Observations from stdout/stderr, compilation logs, and browser runtime errors are streamed back to the agent for evaluation.

### 3.3. Zero Predefined Templates — 100% Genuine Dynamic Code
- No hardcoded calculators, canned e-commerce stubs, or mock templates.
- Every application is synthesized dynamically from the user's brief using full language features (HTML5, Modern CSS, WebGL/Three.js, React, Node.js, Python).

### 3.4. Auto Code Detection & Dynamic Workspace Applier
- Real-time parser scans AI messages for markdown code blocks and target filenames.
- Detected files card shows line counts, byte sizes, and 1-click **⚡ Apply to Workspace**.
- Automatic apply mode directly writes to disk and refreshes live preview immediately.

### 3.5. Smart Workspace Generation on New Chat
- When user initiates a new chat, the system detects whether an active workspace with files exists.
- Offers an explicit decision:
  1. **Continue Working in Current Workspace** (preserves context, memory, and files).
  2. **Create Brand New Workspace** (initializes isolated folder, clean file tree, and checkpoint 0).

### 3.6. Multi-AI Council Consensus Engine
- AI Council brings together specialized roles:
  1. **Architect (Gemini Pro)**: Mission decomposition & specs.
  2. **Lead Software Engineer (Claude 3.5 Sonnet)**: Production implementation.
  3. **QA & Security Auditor (DeepSeek R1)**: Vulnerability scan & edge-cases.
  4. **UI/UX Design Director**: Aesthetics & micro-interactions.
- Collaborative consensus output ensures enterprise code quality.

## 4. Deliverables & Output Structure
All production outputs are compiled into the `/omni` directory:
- `omni/index.html`: Self-contained standalone distribution.
- `omni/standalone.html`: Zero-dependency offline portable bundle.
- `omni/omnintellx.html`: Full enterprise development studio bundle.
- `omni/docs.zip`: Clean ZIP package containing exclusively documentation files.
- `omni/build-manifest.json`: Verification manifest & checksums.
