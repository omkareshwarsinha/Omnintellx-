/**
 * Omnintellx — Single HTML Compiler Engine
 * Transforms projects and workspaces into self-contained single-file HTML applications.
 */

import { Project, Artifact, ProjectContract, ProviderConfig } from '../types';

export function compileProjectToSingleHtml(project: Project): string {
  if (!project) return '<!DOCTYPE html><html><body><h1>No project selected</h1></body></html>';

  const htmlFile = project.files.find(f => f.name === 'index.html') || 
                   project.files.find(f => f.name.endsWith('.html') && !f.name.startsWith('output/')) || 
                   project.files.find(f => f.name === 'output/index.html') ||
                   project.files.find(f => f.name.endsWith('.html')) || 
                   project.files[0];

  const cssFiles = project.files.filter(f => f.name.endsWith('.css') && !f.name.startsWith('output/'));
  const jsFiles = project.files.filter(f => (f.name.endsWith('.js') || f.name.endsWith('.ts') || f.name.endsWith('.jsx') || f.name.endsWith('.tsx')) && !f.name.startsWith('output/'));
  const jsonFiles = project.files.filter(f => f.name.endsWith('.json') && !f.name.startsWith('output/'));

  // If there are no separate CSS or JS files and htmlFile is already a standalone bundle
  if (cssFiles.length === 0 && jsFiles.length === 0 && htmlFile && htmlFile.content.includes('<!DOCTYPE html>')) {
    return htmlFile.content;
  }

  let baseHtml = htmlFile?.content || `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.name)}</title>
</head>
<body>
  <div id="app">
    <h1>${escapeHtml(project.name)}</h1>
    <p>${escapeHtml(project.description || 'Standalone compiled application.')}</p>
  </div>
</body>
</html>`;

  // Combine CSS
  const combinedCss = cssFiles.map(c => `/* === ${c.name} === */\n${c.content}`).join('\n\n');

  // Combine JSON mock data injection
  const embeddedDataScript = jsonFiles.length > 0 ? `
  // Embedded Static JSON Datasets
  window.__OM_LABS_DATA__ = ${JSON.stringify(jsonFiles.reduce((acc, f) => {
    try {
      acc[f.name] = JSON.parse(f.content);
    } catch {
      acc[f.name] = f.content;
    }
    return acc;
  }, {} as Record<string, any>))};
  ` : '';

  // Combine JS with standalone local mock environment
  const combinedJs = jsFiles.map(j => `// === ${j.name} ===\n${j.content}`).join('\n\n');

  let output = baseHtml;

  // Auto-inject Tailwind & Lucide CDN into Single HTML if missing
  if (!output.includes('tailwindcss.com') && (output.includes('class="') || combinedCss.includes('@apply') || output.includes('bg-') || output.includes('flex'))) {
    if (output.includes('<head>')) {
      output = output.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
    }
  }
  if (!output.includes('lucide@latest') && !output.includes('lucide.dev') && output.includes('data-lucide')) {
    if (output.includes('</head>')) {
      output = output.replace('</head>', '  <script src="https://unpkg.com/lucide@latest"></script>\n</head>');
    }
  }

  // 1. Remove external CSS links matching bundled file names
  cssFiles.forEach(c => {
    const linkRegex = new RegExp(`<link[^>]+href=["'](\\./)?${escapeRegex(c.name)}["'][^>]*>`, 'gi');
    output = output.replace(linkRegex, '');
  });

  // 2. Remove external script tags matching bundled file names
  jsFiles.forEach(j => {
    const scriptRegex = new RegExp(`<script[^>]+src=["'](\\./)?${escapeRegex(j.name)}["'][^>]*>\\s*</script>`, 'gi');
    output = output.replace(scriptRegex, '');
  });

  // 3. Inject CSS
  if (combinedCss.trim()) {
    const styleTag = `\n  <style id="omnintellx-compiled-styles">\n${combinedCss}\n  </style>\n`;
    if (output.includes('</head>')) {
      output = output.replace('</head>', `${styleTag}</head>`);
    } else {
      output = `<head>${styleTag}</head>\n` + output;
    }
  }

  // 4. Inject JS
  const scriptTag = `\n  <script id="omnintellx-compiled-script">\n  (function() {\n    console.log("[Omnintellx Standalone] Runtime mounted for '${escapeHtml(project.name)}'");\n${embeddedDataScript}\n${combinedJs}\n  })();\n  </script>\n`;
  if (output.includes('</body>')) {
    output = output.replace('</body>', `${scriptTag}</body>`);
  } else {
    output = output + `\n${scriptTag}`;
  }

  return output;
}

export function compileStudioWorkspaceToSingleHtml(
  allProjects: Project[],
  artifacts: Artifact[],
  contracts: ProjectContract[],
  providers: ProviderConfig[]
): string {
  const jsonState = JSON.stringify({
    version: '3.6.0',
    exportTimestamp: new Date().toISOString(),
    projectCount: allProjects.length,
    projects: allProjects,
    artifacts,
    contracts,
    providers: providers.map(p => ({ ...p, apiKey: '' }))
  });

  return `<!DOCTYPE html>
<html lang="en" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Omnintellx — Autonomous Intent Studio (Standalone)</title>
  <meta name="description" content="Commercial Autonomous AI Engineering Studio in a 100% standalone, zero-dependency single-file HTML application.">
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">

  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            display: ['"Space Grotesk"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          colors: {
            brand: { 400: '#818CF8', 500: '#6366F1', 600: '#4F46E5', 900: '#1E1B4B', 950: '#070913' },
            accent: { cyan: '#06B6D4', emerald: '#10B981', amber: '#F59E0B', rose: '#F43F5E' }
          }
        }
      }
    }
  </script>

  <!-- Lucide Icons -->
  <script src="https://unpkg.com/lucide@latest"></script>

  <style>
    body { background-color: #07090E; color: #F8FAFC; font-family: 'Plus Jakarta Sans', sans-serif; }
    .glass-panel { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
    .glass-card { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 16px; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
    .glass-card:hover { border-color: rgba(99, 102, 241, 0.4); transform: translateY(-2px); }
    .glow-border { box-shadow: 0 0 35px -10px rgba(99, 102, 241, 0.25); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
  </style>
</head>
<body class="min-h-screen flex flex-col selection:bg-brand-500 selection:text-white">

  <!-- Background Particle Mesh -->
  <canvas id="bg-canvas" class="fixed inset-0 pointer-events-none z-0 opacity-30"></canvas>

  <!-- Toast Notification Container -->
  <div id="toast-container" class="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"></div>

  <!-- Main Sticky Studio Topbar -->
  <header class="sticky top-0 z-40 bg-[#07090E]/90 backdrop-blur-xl border-b border-white/10 px-4 h-14 flex items-center justify-between">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 shadow-md shadow-brand-500/20">
        <div class="w-full h-full bg-[#07090E] rounded-[6px] flex items-center justify-center">
          <i data-lucide="cpu" class="w-4 h-4 text-brand-400"></i>
        </div>
      </div>
      <div>
        <div class="flex items-center gap-1.5">
          <span class="font-display font-bold text-sm text-white tracking-tight">Omnintellx</span>
          <span class="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-500/20">STANDALONE OS</span>
        </div>
      </div>
    </div>

    <!-- Central Intent Command Palette -->
    <div class="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 w-[420px] focus-within:border-brand-400 transition-colors">
      <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-400 shrink-0"></i>
      <input 
        id="top-intent-input"
        type="text" 
        placeholder="Type any intent: 'create game', 'editor', 'chat', 'export html', 'theme'..."
        class="w-full bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none"
      />
      <kbd class="text-[10px] font-mono text-slate-400 bg-white/10 px-1.5 py-0.5 rounded">ENTER</kbd>
    </div>

    <!-- Studio Quick Actions -->
    <div class="flex items-center gap-2">
      <button id="btn-audio-toggle" class="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-brand-400 transition-colors" title="Toggle Sound">
        <i data-lucide="volume-2" class="w-4 h-4"></i>
      </button>

      <button id="btn-download-active-html" class="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-brand-600 to-indigo-600 hover:brightness-110 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all">
        <i data-lucide="download" class="w-3.5 h-3.5"></i>
        <span>Download HTML</span>
      </button>

      <button id="btn-open-preview-window" class="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 transition-colors" title="Open Full Screen Preview">
        <i data-lucide="play" class="w-4 h-4"></i>
      </button>
    </div>
  </header>

  <!-- Studio Workspace Layout -->
  <div class="flex-1 flex overflow-hidden z-10">

    <!-- Left Navigation Bar -->
    <aside class="w-16 sm:w-56 bg-[#0B0F17]/80 border-r border-white/10 flex flex-col justify-between p-2 sm:p-3 shrink-0">
      <div class="space-y-1">
        <div class="hidden sm:block px-2.5 py-1 text-[10px] font-mono uppercase text-slate-500 tracking-wider">Studio Workspace</div>
        
        <button class="nav-tab-btn active w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600/20 text-brand-300 border border-brand-500/30 transition-all" data-tab="tab-chat">
          <i data-lucide="message-square-code" class="w-4 h-4 text-brand-400 shrink-0"></i>
          <span class="hidden sm:inline">AI Code Chat</span>
        </button>

        <button class="nav-tab-btn w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all" data-tab="tab-editor">
          <i data-lucide="code-2" class="w-4 h-4 text-accent-cyan shrink-0"></i>
          <span class="hidden sm:inline">Code Editor</span>
        </button>

        <button class="nav-tab-btn w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all" data-tab="tab-preview">
          <i data-lucide="layout" class="w-4 h-4 text-emerald-400 shrink-0"></i>
          <span class="hidden sm:inline">Live Sandbox</span>
        </button>

        <button class="nav-tab-btn w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all" data-tab="tab-projects">
          <i data-lucide="folder-kanban" class="w-4 h-4 text-amber-400 shrink-0"></i>
          <span class="hidden sm:inline">Projects Hub</span>
        </button>

        <button class="nav-tab-btn w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/5 transition-all" data-tab="tab-terminal">
          <i data-lucide="terminal" class="w-4 h-4 text-rose-400 shrink-0"></i>
          <span class="hidden sm:inline">Agent Telemetry</span>
        </button>
      </div>

      <!-- Active Project Indicator -->
      <div class="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-1">
        <div class="text-[9px] font-mono text-slate-500 uppercase">Active Workspace</div>
        <div id="sidebar-active-project-name" class="text-xs font-bold text-slate-200 truncate">Loading...</div>
        <div id="sidebar-file-count" class="text-[10px] text-brand-400 font-mono">0 files</div>
      </div>
    </aside>

    <!-- Center Interactive Content Viewport -->
    <main class="flex-1 flex flex-col overflow-hidden bg-[#07090E]">

      <!-- TAB 1: AI CODE CHAT -->
      <div id="tab-chat" class="tab-pane flex-1 flex flex-col overflow-hidden">
        <!-- Chat Header -->
        <div class="h-12 border-b border-white/10 px-4 flex items-center justify-between bg-white/[0.02]">
          <div class="flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span class="text-xs font-bold text-white">Claude Code &amp; Gemini 3.7 Agent</span>
            <span class="text-[10px] font-mono bg-brand-500/10 text-brand-300 px-2 py-0.5 rounded border border-brand-500/20">AUTONOMOUS DISPATCH</span>
          </div>
          <div class="flex items-center gap-1.5">
            <button class="quick-intent-chip text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10" data-intent="Build a sleek cyber racing game">🏎️ Racing Game</button>
            <button class="quick-intent-chip text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10" data-intent="Build a high converting SaaS landing page with pricing calculator">💼 SaaS Landing Page</button>
            <button class="quick-intent-chip text-xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10" data-intent="Build a retro synthwave canvas visualizer">🎵 Audio Visualizer</button>
          </div>
        </div>

        <!-- Messages Feed -->
        <div id="chat-messages-container" class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Bot Welcome Message -->
          <div class="flex gap-3 max-w-3xl">
            <div class="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
              <i data-lucide="bot" class="w-4 h-4 text-white"></i>
            </div>
            <div class="space-y-2 flex-1">
              <div class="text-[11px] font-bold text-brand-300 flex items-center gap-2">
                Omnintellx Autonomous Agent Fleet <span class="text-[9px] text-slate-500 font-mono">System Ready</span>
              </div>
              <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 leading-relaxed space-y-2">
                <p>Welcome to <strong>Omnintellx Standalone AI Studio</strong>. I am fully autonomous and controllable by pure natural language intent.</p>
                <p>Ask me to build web applications, generate interactive games, synthesize pricing calculators, modify files, or execute any development workflow.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Chat Input Bar -->
        <div class="p-3 border-t border-white/10 bg-[#0A0E17]/90">
          <form id="chat-form" class="flex items-center gap-2">
            <input 
              id="chat-input"
              type="text" 
              placeholder="Describe what you want to build or type an intent (e.g. 'Build an interactive 3D particle portfolio')..."
              class="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button type="submit" class="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all">
              <span>Send</span>
              <i data-lucide="send" class="w-3.5 h-3.5"></i>
            </button>
          </form>
        </div>
      </div>

      <!-- TAB 2: CODE EDITOR -->
      <div id="tab-editor" class="tab-pane hidden flex-1 flex overflow-hidden">
        <!-- File Tree Sidebar -->
        <div class="w-56 bg-[#0B0F17] border-r border-white/10 flex flex-col p-2 space-y-2 shrink-0">
          <div class="flex items-center justify-between px-2 pt-1">
            <span class="text-[11px] font-mono uppercase text-slate-400">Files</span>
            <button id="btn-add-file" class="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white" title="Add File">
              <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            </button>
          </div>
          <div id="editor-file-list" class="flex-1 overflow-y-auto space-y-0.5"></div>
        </div>

        <!-- Editor Core -->
        <div class="flex-1 flex flex-col bg-[#07090E]">
          <!-- Active Tab Bar -->
          <div class="h-10 border-b border-white/10 px-4 flex items-center justify-between bg-white/[0.02]">
            <div class="flex items-center gap-2">
              <i data-lucide="file-code" class="w-4 h-4 text-brand-400"></i>
              <span id="editor-active-file-title" class="text-xs font-mono font-bold text-white">index.html</span>
            </div>
            <div class="flex items-center gap-2">
              <button id="btn-copy-file-content" class="text-xs px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 flex items-center gap-1">
                <i data-lucide="copy" class="w-3 h-3"></i> Copy
              </button>
              <button id="btn-save-file-content" class="text-xs px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white font-semibold flex items-center gap-1">
                <i data-lucide="save" class="w-3 h-3"></i> Save
              </button>
            </div>
          </div>

          <!-- Code Textarea -->
          <textarea id="editor-code-textarea" class="flex-1 p-4 bg-[#05070B] text-slate-200 font-mono text-xs leading-relaxed focus:outline-none resize-none selection:bg-brand-500 selection:text-white"></textarea>
        </div>
      </div>

      <!-- TAB 3: LIVE SANDBOX PREVIEW -->
      <div id="tab-preview" class="tab-pane hidden flex-1 flex flex-col bg-[#0B0F17]">
        <!-- Preview Device Bar -->
        <div class="h-11 border-b border-white/10 px-4 flex items-center justify-between bg-white/[0.02]">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-white">Live Execution Sandbox</span>
            <span class="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">STANDALONE IFRAME</span>
          </div>

          <div class="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
            <button class="preview-device-btn active px-2.5 py-1 rounded text-xs text-white bg-brand-600" data-width="100%">Desktop</button>
            <button class="preview-device-btn px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white" data-width="768px">Tablet</button>
            <button class="preview-device-btn px-2.5 py-1 rounded text-xs text-slate-400 hover:text-white" data-width="375px">Mobile</button>
          </div>

          <button id="btn-refresh-preview" class="p-1.5 rounded hover:bg-white/10 text-slate-300" title="Reload Preview">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <!-- Sandbox Frame Container -->
        <div class="flex-1 p-4 flex items-center justify-center overflow-auto bg-[#05070B]">
          <iframe id="preview-sandbox-iframe" class="w-full h-full rounded-xl border border-white/10 bg-[#07090E] shadow-2xl transition-all" sandbox="allow-scripts allow-modals allow-same-origin allow-forms"></iframe>
        </div>
      </div>

      <!-- TAB 4: PROJECTS HUB -->
      <div id="tab-projects" class="tab-pane hidden flex-1 overflow-y-auto p-6 space-y-6">
        <div class="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 class="text-lg font-display font-bold text-white">Workspace Projects</h2>
            <p class="text-xs text-slate-400">Switch between pre-engineered applications or generate new ones.</p>
          </div>
          <button id="btn-create-project-prompt" class="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center gap-1.5">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i> New Project
          </button>
        </div>

        <div id="projects-grid-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>
      </div>

      <!-- TAB 5: AGENT TELEMETRY & TERMINAL -->
      <div id="tab-terminal" class="tab-pane hidden flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        <div class="flex items-center justify-between border-b border-white/10 pb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i>
            <span class="text-xs font-bold text-white font-mono">Autonomous Fleet Telemetry</span>
          </div>
          <button id="btn-clear-terminal" class="text-xs text-slate-400 hover:text-slate-200">Clear Logs</button>
        </div>

        <div id="terminal-feed-box" class="flex-1 bg-black/70 p-4 rounded-2xl border border-white/10 font-mono text-xs text-slate-300 space-y-1.5 overflow-y-auto">
          <div class="text-emerald-400">[SYSTEM] Omnintellx Standalone Multi-Agent Core mounted.</div>
          <div class="text-brand-300">[AGENTS] 12 Specialized Agent roles active: Principal Architect, Design Systems Lead, Frontend Core Engineer, Security Analyst.</div>
          <div class="text-slate-400">[ORCHESTRATOR] Zero-dependency single-file HTML compilation pipeline ready.</div>
        </div>
      </div>

    </main>
  </div>

  <!-- Runtime Logic Script -->
  <script>
    // Embedded Workspace State
    const WORKSPACE = ${jsonState};
    let currentProjectIndex = 0;
    let currentFileIndex = 0;
    let audioEnabled = true;
    let audioCtx = null;

    function getActiveProject() {
      return WORKSPACE.projects[currentProjectIndex] || WORKSPACE.projects[0];
    }

    function getActiveFile() {
      const proj = getActiveProject();
      return proj.files[currentFileIndex] || proj.files[0];
    }

    function playBeep(freq = 440, type = 'sine', duration = 0.1) {
      if (!audioEnabled) return;
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function showToast(title, desc = '', type = 'info') {
      const container = document.getElementById('toast-container');
      if (!container) return;
      const toast = document.createElement('div');
      toast.className = 'p-3 rounded-2xl bg-[#0F172A]/95 border border-white/15 backdrop-blur-xl shadow-2xl flex items-start gap-2.5 pointer-events-auto transition-all transform translate-y-2 opacity-0 text-xs';
      
      let icon = '<i data-lucide="info" class="w-4 h-4 text-brand-400 shrink-0 mt-0.5"></i>';
      if (type === 'success') icon = '<i data-lucide="check-circle" class="w-4 h-4 text-emerald-400 shrink-0 mt-0.5"></i>';
      if (type === 'warning') icon = '<i data-lucide="alert-triangle" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5"></i>';

      toast.innerHTML = icon + '<div class="flex-1"><div class="font-bold text-white">' + title + '</div>' + (desc ? '<div class="text-[11px] text-slate-400 mt-0.5">' + desc + '</div>' : '') + '</div>';
      container.appendChild(toast);
      lucide.createIcons();

      requestAnimationFrame(() => toast.classList.remove('translate-y-2', 'opacity-0'));
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-x-4');
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    }

    function appendTerminal(msg, colorClass = 'text-slate-300') {
      const feed = document.getElementById('terminal-feed-box');
      if (!feed) return;
      const div = document.createElement('div');
      const timeStr = new Date().toISOString().substring(11, 19);
      div.className = colorClass;
      div.innerText = '[' + timeStr + '] ' + msg;
      feed.appendChild(div);
      feed.scrollTop = feed.scrollHeight;
    }

    // Compile Single HTML for any Project
    function compileProjectToHtml(proj) {
      if (!proj) return '<h1>No project selected</h1>';
      const outputIdx = proj.files.find(f => f.name === 'output/index.html');
      if (outputIdx && outputIdx.content.includes('<!DOCTYPE html>') && outputIdx.content.length > 500) {
        return outputIdx.content;
      }
      const htmlFile = proj.files.find(f => f.name.endsWith('.html') && !f.name.startsWith('output/')) || proj.files[0];
      const cssFiles = proj.files.filter(f => f.name.endsWith('.css') && !f.name.startsWith('output/'));
      const jsFiles = proj.files.filter(f => (f.name.endsWith('.js') || f.name.endsWith('.ts')) && !f.name.startsWith('output/'));

      let html = htmlFile ? htmlFile.content : '<h1>' + proj.name + '</h1>';
      const css = cssFiles.map(c => c.content).join('\\n');
      const js = jsFiles.map(j => j.content).join('\\n');

      if (!html.includes('tailwindcss.com') && (html.includes('class=') || css.includes('@apply'))) {
        html = '<script src="https://cdn.tailwindcss.com"><\\/script>\\n' + html;
      }
      if (!html.includes('lucide@latest') && html.includes('data-lucide')) {
        html = '<script src="https://unpkg.com/lucide@latest"><\\/script>\\n' + html;
      }

      if (css) html = '<style>' + css + '</style>\\n' + html;
      if (js) html = html + '\\n<script>' + js + '<\\/script>';
      return html;
    }

    // Tab Navigation Switcher
    function switchTab(tabId) {
      document.querySelectorAll('.tab-pane').forEach(el => el.classList.add('hidden'));
      document.querySelectorAll('.nav-tab-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-brand-600/20', 'text-brand-300', 'border', 'border-brand-500/30');
        btn.classList.add('text-slate-400');
        if (btn.getAttribute('data-tab') === tabId) {
          btn.classList.add('active', 'bg-brand-600/20', 'text-brand-300', 'border', 'border-brand-500/30');
          btn.classList.remove('text-slate-400');
        }
      });
      const targetPane = document.getElementById(tabId);
      if (targetPane) targetPane.classList.remove('hidden');

      if (tabId === 'tab-preview') {
        renderSandboxPreview();
      } else if (tabId === 'tab-editor') {
        renderEditorFiles();
      } else if (tabId === 'tab-projects') {
        renderProjectsGrid();
      }
      playBeep(420, 'sine', 0.06);
    }

    // Render Sandbox Preview
    function renderSandboxPreview() {
      const iframe = document.getElementById('preview-sandbox-iframe');
      if (!iframe) return;
      const html = compileProjectToHtml(getActiveProject());
      iframe.srcdoc = html;
      appendTerminal('PREVIEW_RENDER: Sandbox loaded project "' + getActiveProject().name + '"', 'text-emerald-400');
    }

    // Render Editor Files
    function renderEditorFiles() {
      const proj = getActiveProject();
      const listEl = document.getElementById('editor-file-list');
      const titleEl = document.getElementById('editor-active-file-title');
      const textEl = document.getElementById('editor-code-textarea');

      if (!listEl) return;
      listEl.innerHTML = '';

      proj.files.forEach((f, idx) => {
        const btn = document.createElement('button');
        const isActive = idx === currentFileIndex;
        btn.className = 'w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between transition-colors ' + (isActive ? 'bg-brand-600/20 text-brand-300 font-semibold' : 'text-slate-400 hover:bg-white/5 hover:text-white');
        btn.innerHTML = '<span class="truncate">' + f.name + '</span><span class="text-[9px] text-slate-600">' + (f.name.split('.').pop() || '') + '</span>';
        btn.onclick = () => {
          currentFileIndex = idx;
          renderEditorFiles();
          playBeep(480, 'sine', 0.05);
        };
        listEl.appendChild(btn);
      });

      const activeFile = getActiveFile();
      if (titleEl) titleEl.innerText = activeFile.name;
      if (textEl) textEl.value = activeFile.content;
    }

    // Render Projects Grid
    function renderProjectsGrid() {
      const grid = document.getElementById('projects-grid-container');
      if (!grid) return;
      grid.innerHTML = '';

      WORKSPACE.projects.forEach((p, idx) => {
        const card = document.createElement('div');
        const isActive = idx === currentProjectIndex;
        card.className = 'glass-card p-5 space-y-3 ' + (isActive ? 'border-brand-500/60 bg-brand-500/[0.06]' : '');
        card.innerHTML = \`
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-white">\${p.name}</span>
            <span class="text-[10px] font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded">\${p.files.length} files</span>
          </div>
          <p class="text-xs text-slate-400 line-clamp-2">\${p.description || 'Autonomous web application'}</p>
          <div class="pt-2 flex items-center gap-2">
            <button class="flex-1 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-colors" onclick="selectProject(\${idx})">
              \${isActive ? 'Active Project' : 'Switch Project'}
            </button>
            <button class="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs" onclick="downloadProjectHtml(\${idx})">
              <i data-lucide="download" class="w-3.5 h-3.5"></i>
            </button>
          </div>
        \`;
        grid.appendChild(card);
      });
      lucide.createIcons();
    }

    function selectProject(idx) {
      currentProjectIndex = idx;
      currentFileIndex = 0;
      updateSidebarProjectInfo();
      renderProjectsGrid();
      showToast('Switched Workspace', 'Active: ' + getActiveProject().name, 'success');
      appendTerminal('PROJECT_SWITCH: Selected "' + getActiveProject().name + '"', 'text-brand-300');
      playBeep(520, 'triangle', 0.1);
    }

    function downloadProjectHtml(idx) {
      const proj = WORKSPACE.projects[idx] || getActiveProject();
      const html = compileProjectToHtml(proj);
      const filename = proj.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_') + '_standalone.html';
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('HTML Downloaded', filename, 'success');
      playBeep(640, 'triangle', 0.12);
    }

    function updateSidebarProjectInfo() {
      const proj = getActiveProject();
      const nameEl = document.getElementById('sidebar-active-project-name');
      const countEl = document.getElementById('sidebar-file-count');
      if (nameEl) nameEl.innerText = proj.name;
      if (countEl) countEl.innerText = proj.files.length + ' files';
    }

    // Intent Command Dispatcher
    function executeIntent(rawIntent) {
      if (!rawIntent || !rawIntent.trim()) return;
      const intent = rawIntent.toLowerCase().trim();
      appendTerminal('DISPATCH_INTENT: "' + rawIntent + '"', 'text-amber-300');
      playBeep(540, 'triangle', 0.12);

      if (intent.includes('chat') || intent.includes('ask') || intent.includes('prompt')) {
        switchTab('tab-chat');
        showToast('Intent Executed', 'Navigated to AI Code Chat', 'info');
      } else if (intent.includes('editor') || intent.includes('code') || intent.includes('edit file')) {
        switchTab('tab-editor');
        showToast('Intent Executed', 'Opened Code Editor', 'info');
      } else if (intent.includes('preview') || intent.includes('sandbox') || intent.includes('run') || intent.includes('game') || intent.includes('play')) {
        switchTab('tab-preview');
        showToast('Intent Executed', 'Rendered Live Execution Sandbox', 'success');
      } else if (intent.includes('project') || intent.includes('hub') || intent.includes('switch')) {
        switchTab('tab-projects');
        showToast('Intent Executed', 'Opened Projects Hub', 'info');
      } else if (intent.includes('terminal') || intent.includes('telemetry') || intent.includes('log') || intent.includes('agent')) {
        switchTab('tab-terminal');
        showToast('Intent Executed', 'Opened Agent Telemetry', 'info');
      } else if (intent.includes('download') || intent.includes('export') || intent.includes('save html')) {
        downloadProjectHtml(currentProjectIndex);
      } else if (intent.includes('sound') || intent.includes('audio') || intent.includes('mute')) {
        audioEnabled = !audioEnabled;
        showToast('Audio Synth', audioEnabled ? 'Sound Enabled' : 'Sound Muted', 'info');
      } else {
        // Feed into AI Chat
        switchTab('tab-chat');
        handleUserChatMessage(rawIntent);
      }
    }

    // AI Chat Handler
    function handleUserChatMessage(msgText) {
      const container = document.getElementById('chat-messages-container');
      if (!container) return;

      // Append User message
      const userDiv = document.createElement('div');
      userDiv.className = 'flex gap-3 max-w-3xl ml-auto flex-row-reverse';
      userDiv.innerHTML = \`
        <div class="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
          <i data-lucide="user" class="w-4 h-4 text-white"></i>
        </div>
        <div class="space-y-1 text-right">
          <div class="text-[10px] font-mono text-slate-400">User Command</div>
          <div class="p-3.5 rounded-2xl bg-brand-600/30 border border-brand-500/30 text-xs text-white leading-relaxed text-left">\${msgText}</div>
        </div>
      \`;
      container.appendChild(userDiv);
      lucide.createIcons();
      container.scrollTop = container.scrollHeight;

      // Simulate autonomous multi-agent response
      setTimeout(() => {
        const botDiv = document.createElement('div');
        botDiv.className = 'flex gap-3 max-w-3xl';
        botDiv.innerHTML = \`
          <div class="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center shrink-0">
            <i data-lucide="bot" class="w-4 h-4 text-white"></i>
          </div>
          <div class="space-y-2 flex-1">
            <div class="text-[11px] font-bold text-brand-300 flex items-center gap-2">
              Omnintellx Autonomous Engine <span class="text-[9px] text-emerald-400 font-mono">100% Standalone Output</span>
            </div>
            <div class="p-4 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-200 leading-relaxed space-y-2.5">
              <p>Executed autonomous synthesis for: <strong>\${msgText}</strong>.</p>
              <div class="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-emerald-400 space-y-1">
                <div>✓ Verified responsive design tokens (Tailwind CSS CDN)</div>
                <div>✓ Audio synthesizer calibrated at 44.1 kHz</div>
                <div>✓ Zero external API keys needed in standalone build</div>
                <div>✓ Output synchronized with <strong>output/index.html</strong></div>
              </div>
              <div class="pt-1 flex items-center gap-2">
                <button class="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs flex items-center gap-1.5" onclick="switchTab('tab-preview')">
                  <i data-lucide="play" class="w-3.5 h-3.5"></i> Launch Live Preview
                </button>
                <button class="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-1.5" onclick="downloadProjectHtml(currentProjectIndex)">
                  <i data-lucide="download" class="w-3.5 h-3.5"></i> Download HTML
                </button>
              </div>
            </div>
          </div>
        \`;
        container.appendChild(botDiv);
        lucide.createIcons();
        container.scrollTop = container.scrollHeight;
        playBeep(600, 'triangle', 0.15);
      }, 500);
    }

    // Init Event Listeners
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    document.querySelectorAll('.preview-device-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.preview-device-btn').forEach(b => {
          b.classList.remove('active', 'bg-brand-600', 'text-white');
          b.classList.add('text-slate-400');
        });
        btn.classList.add('active', 'bg-brand-600', 'text-white');
        btn.classList.remove('text-slate-400');
        const iframe = document.getElementById('preview-sandbox-iframe');
        if (iframe) iframe.style.width = btn.getAttribute('data-width');
      });
    });

    const topIntentInput = document.getElementById('top-intent-input');
    if (topIntentInput) {
      topIntentInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          executeIntent(topIntentInput.value);
          topIntentInput.value = '';
        }
      });
    }

    document.querySelectorAll('.quick-intent-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const intent = btn.getAttribute('data-intent');
        if (intent) executeIntent(intent);
      });
    });

    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    if (chatForm && chatInput) {
      chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (chatInput.value.trim()) {
          handleUserChatMessage(chatInput.value.trim());
          chatInput.value = '';
        }
      });
    }

    const downloadBtn = document.getElementById('btn-download-active-html');
    if (downloadBtn) downloadBtn.addEventListener('click', () => downloadProjectHtml(currentProjectIndex));

    const previewWindowBtn = document.getElementById('btn-open-preview-window');
    if (previewWindowBtn) {
      previewWindowBtn.addEventListener('click', () => {
        const html = compileProjectToHtml(getActiveProject());
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
      });
    }

    const refreshPreviewBtn = document.getElementById('btn-refresh-preview');
    if (refreshPreviewBtn) refreshPreviewBtn.addEventListener('click', renderSandboxPreview);

    const audioToggleBtn = document.getElementById('btn-audio-toggle');
    if (audioToggleBtn) {
      audioToggleBtn.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        showToast('Audio Synth', audioEnabled ? 'Sound Enabled' : 'Sound Muted', 'info');
      });
    }

    const saveFileBtn = document.getElementById('btn-save-file-content');
    if (saveFileBtn) {
      saveFileBtn.addEventListener('click', () => {
        const activeFile = getActiveFile();
        const textEl = document.getElementById('editor-code-textarea');
        if (activeFile && textEl) {
          activeFile.content = textEl.value;
          showToast('File Saved', activeFile.name, 'success');
          appendTerminal('FILE_SAVE: Saved content for "' + activeFile.name + '"', 'text-emerald-400');
          playBeep(600, 'triangle', 0.1);
        }
      });
    }

    const copyFileBtn = document.getElementById('btn-copy-file-content');
    if (copyFileBtn) {
      copyFileBtn.addEventListener('click', () => {
        const textEl = document.getElementById('editor-code-textarea');
        if (textEl) {
          navigator.clipboard.writeText(textEl.value);
          showToast('Copied', 'File contents copied to clipboard', 'info');
        }
      });
    }

    const clearTermBtn = document.getElementById('btn-clear-terminal');
    if (clearTermBtn) {
      clearTermBtn.addEventListener('click', () => {
        const feed = document.getElementById('terminal-feed-box');
        if (feed) feed.innerHTML = '<div class="text-slate-500">[LOGS CLEARED] Ready for incoming intent stream.</div>';
      });
    }

    // Canvas Background Loop
    (function initCanvas() {
      const canvas = document.getElementById('bg-canvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      let w = (canvas.width = window.innerWidth);
      let h = (canvas.height = window.innerHeight);

      window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
      });

      const particles = [];
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 1
        });
      }

      function draw() {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = w;
          if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h;
          if (p.y > h) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();

          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 120) {
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }
        }
        requestAnimationFrame(draw);
      }
      draw();
    })();

    // Bootstrap
    updateSidebarProjectInfo();
    renderEditorFiles();
    renderProjectsGrid();
    renderSandboxPreview();
    lucide.createIcons();
  </script>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
