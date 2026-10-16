# 🏗️ Omnintellx System Architecture Specification

## 1. High-Level Architectural Topography
Omnintellx is structured as a resilient, client-server event-driven system:

```
┌────────────────────────────────────────────────────────┐
│                   USER INTERFACE                       │
│  - Topbar & Workspace Indicator                       │
│  - Multi-Model Chat & Tool Action Stream               │
│  - Task Graph DAG Visualizer                           │
│  - Code Studio, Monaco Editor & Live Preview           │
└──────────────────────────┬─────────────────────────────┘
                           │ WebSockets & REST API
                           ▼
┌────────────────────────────────────────────────────────┐
│              OMNINTELLX MASTER ORCHESTRATOR            │
│  - Mission Interpreter & Ambiguity Resolver            │
│  - Project Inspector & Dependency Analyzer             │
│  - Dynamic Task DAG Synthesizer                        │
│  - Bounded Concurrency Pool (1-16 workers)             │
│  - Multi-AI Council Protocol Router                    │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│       TOOL GATEWAY       │  │    EVALUATOR & DEBUG     │
│  - WorkspaceManager (FS) │  │  - AST & Syntax Audit     │
│  - ExecutionManager (Cmd)│  │  - Runtime Error Tracker  │
│  - Git Checkpoint Engine │  │  - Regression Monitor     │
│  - Browser Sandbox       │  │  - Automated Hotpatcher   │
└────────────┬─────────────┘  └────────────┬─────────────┘
             │                             │
             └──────────────┬──────────────┘
                            ▼
┌────────────────────────────────────────────────────────┐
│               LOCAL ISOLATED WORKSPACES                │
│  /workspaces/{projectId}/...                           │
│  Authoritative Single Source of Truth on Disk          │
└────────────────────────────────────────────────────────┘
```

## 2. The 6 Logical Engineering Capabilities
1. **Architect & Mission Controller**: Analyzes intent, discovers unknowns, formulates technical architecture.
2. **Principal Planner**: Decomposes technical spec into concrete tasks with dependencies and validation criteria.
3. **Lead Software Engineer**: Operates tools to write complete, robust source files with zero placeholders.
4. **Debugger & QA Specialist**: Diagnoses failures, parses tracebacks, and applies targeted patches.
5. **Reviewer & Security Auditor**: Validates against OWASP, syntax correctness, and security invariants.
6. **Release Engineer**: Bundles assets into single-file portable distributions and creates release documentation.

## 3. Filesystem Sandboxing & Path Traversal Guards
- All operations are strictly constrained within `workspaces/{projectId}/`.
- Path traversal sequences (`..`, null bytes, symlink breakout) are denied by the `PathSecurity` layer.
- Rollback engine supports point-in-time snapshot restoration for zero-loss development.
