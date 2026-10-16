# 🔄 Omnintellx Autonomous Agentic Workflow Guide (Manus & Ideavo Framework)

## The Core Philosophy
> *"The AI should never 'generate a project.' It should operate a project."*

## The Complete End-to-End Workflow Diagram
```
┌─────────────────────┐
│       USER          │
│ "Build me a 3D..."  │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────┐
│   MISSION INTERPRETER    │
│  Intent                  │
│  Constraints             │
│  Desired output          │
│  Missing information     │
└────────────┬─────────────┘
             │
┌────────────┴────────────┐
│                         │
Missing info?         Sufficient?
│                         │
▼                         ▼
┌─────────────┐    ┌──────────────┐
│ ASK USER    │    │    PLANNER   │
└──────┬──────┘    └──────┬───────┘
       │                  │
       └────────────┬─────┘
                    ▼
┌──────────────────────────┐
│     PROJECT INSPECTOR    │
│  Existing files?         │
│  Framework?              │
│  Dependencies?           │
│  Current errors?         │
│  Git/checkpoints?        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│      TASK GRAPH          │
│  Task 1                  │
│  Task 2                  │
│  Task 3                  │
│  Dependencies            │
│  Verification criteria   │
└────────────┬─────────────┘
             │
             ▼
┌────────────────────────────────────┐
│          AGENT EXECUTION           │
│  THINK → SELECT ACTION → TOOL      │
└─────────────────┬──────────────────┘
                  │
┌────────────┼────────────┐
▼            ▼            ▼
FILE TOOLS   TERMINAL     BROWSER
│            │            │
└────────────┼────────────┘
             ▼
┌──────────────────────────┐
│       OBSERVATION        │
│  stdout / stderr         │
│  file changes            │
│  build result            │
│  test result             │
│  browser errors          │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│       EVALUATOR          │
│  Did action work?        │
│  Did task succeed?       │
│  Any regression?         │
└────────────┬─────────────┘
             │
┌────────────┴─────────────┐
│                          │
FAILED                   PASSED
│                          │
▼                          ▼
┌──────────────┐    ┌──────────────┐
│   DEBUGGER   │    │ NEXT TASK    │
└──────┬───────┘    └──────┬───────┘
       │                   │
       ▼                   │
┌──────────────┐           │
│ PATCH CODE   │───────────┘
└──────────────┘
       ▲
       │
       └────── EXECUTION LOOP

      ALL TASKS DONE
             │
             ▼
┌──────────────────────────┐
│    FINAL VERIFICATION    │
│  Build                   │
│  Tests                   │
│  Runtime                 │
│  Browser                 │
│  Requirements            │
│  Security                │
└────────────┬─────────────┘
             │
    ┌────────┴────────┐
    │                 │
  FAIL              PASS
    │                 │
    ▼                 ▼
DEBUG LOOP     ┌─────────────┐
               │   RELEASE   │
               └──────┬──────┘
                      │
                      ▼
               REAL PROJECT
```

## Step-by-Step Workflow Walkthrough

### 1. Mission Interpretation
The AI parses the user input and constructs a structured **Mission Object**:
```json
{
  "goal": "Build an interactive 3D WebGL aerospace site",
  "project_type": "web_3d",
  "constraints": ["Zero external telemetry", "Mobile responsive"],
  "requirements": ["WebGL canvas", "Telemetry HUD", "Particle stars"],
  "unknowns": [],
  "status": "understanding"
}
```
If critical parameters are absent, the system queries the user before coding.

### 2. Project Inspection
Before touching any files, the agent queries the workspace:
- Does the project directory exist?
- Are there existing files (`index.html`, `package.json`)?
- What dependencies are installed?
- What is the latest git commit or checkpoint snapshot?

### 3. Dynamic Task Graph (DAG)
The Planner constructs an ordered graph of tasks with clear acceptance criteria:
- Task 1: Initialize HTML5 entrypoint & 3D canvas viewport
- Task 2: Configure Three.js scene, camera, lighting, and animation loop
- Task 3: Build responsive telemetry overlay and HUD controls
- Task 4: Run build & automated syntax verification

### 4. Agent Execution Loop
For each task:
- **THINK**: Reason through the file changes and imports needed.
- **SELECT ACTION**: Choose tool (`create_file`, `edit_file`, `execute_command`).
- **TOOL EXECUTION**: Execute the action on disk.
- **OBSERVE**: Capture stderr, stdout, and file status.
- **EVALUATE**: Confirm the modification achieved the task verification criteria.
- **DEBUG LOOP**: If an error occurred, hand over to Debugger, hotpatch the code, and re-test.

### 5. Final Verification & Release
Once all tasks are resolved, the system runs final end-to-end verification and bundles the application into `/omni/index.html` and offline deliverables.
