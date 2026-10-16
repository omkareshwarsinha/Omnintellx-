/**
 * Omnintellx — Developer Utilities & Tools Suite
 */

import React, { useState } from 'react';
import { ProjectFile } from '../types';
import {
  FileJson,
  Regex,
  Binary,
  Palette,
  Hash,
  Fingerprint,
  GitCompare,
  Globe,
  Terminal,
  Code,
  Play,
  Copy,
  Check,
  Send,
  Smartphone,
  Monitor,
  Sparkles,
  ShieldCheck,
  Download,
  FileCode
} from 'lucide-react';

interface ToolsScreenProps {
  files: ProjectFile[];
  initialActiveTool?: string | null;
  onUpdateFileContent?: (fileName: string, content: string) => void;
}

export const ToolsScreen: React.FC<ToolsScreenProps> = ({
  files,
  initialActiveTool = 'json'
}) => {
  const [activeTool, setActiveTool] = useState<string>(initialActiveTool || 'json');

  // JSON state
  const [jsonInput, setJsonInput] = useState('{\n  "name": "Omnintellx",\n  "version": "5.0.0",\n  "status": "production"\n}');
  const [jsonOutput, setJsonOutput] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Regex state
  const [regexPattern, setRegexPattern] = useState('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
  const [regexText, setRegexText] = useState('developer@omnintellx.ai\ninvalid_email@\nalex@google.com');
  const [regexMatches, setRegexMatches] = useState<string[]>([]);

  // Base64 state
  const [b64Input, setB64Input] = useState('Hello from Omnintellx Multi-Agent Architecture');
  const [b64Output, setB64Output] = useState('');

  // Color state
  const [colorHex, setColorHex] = useState('#6366F1');

  // Hash state
  const [hashInput, setHashInput] = useState('Omnintellx Secure Verification Checksum');
  const [hashOutput, setHashOutput] = useState('');

  // UUID state
  const [uuidList, setUuidList] = useState<string[]>([
    'c73a2186-b4b1-4190-8919-86699d7a224a',
    '8f45a190-7cb5-45d2-a720-33cb92b11e2f'
  ]);

  // Diff state
  const [diffA, setDiffA] = useState('function authenticate(token) {\n  return token.isValid();\n}');
  const [diffB, setDiffB] = useState('function authenticate(token) {\n  if (!token) throw new Error("Missing token");\n  return token.validateWithRefresh();\n}');

  // HTTP state
  const [httpMethod, setHttpMethod] = useState('GET');
  const [httpUrl, setHttpUrl] = useState('https://jsonplaceholder.typicode.com/todos/1');
  const [httpResponse, setHttpResponse] = useState('');
  const [httpLoading, setHttpLoading] = useState(false);

  // Terminal state
  const [termLog, setTermLog] = useState<string[]>([
    'Omnintellx Workspace Virtual Shell [Version 5.0.0]',
    'Type "help" to see available commands.'
  ]);
  const [termInput, setTermInput] = useState('');

  // Sandbox Live Preview state
  const [sbHtml, setSbHtml] = useState('<div class="box">\n  <h1>Hello Omnintellx Preview</h1>\n  <button id="btn">Click Test</button>\n</div>');
  const [sbCss, setSbCss] = useState('body { font-family: sans-serif; background: #0B0E13; color: white; padding: 24px; }\n.box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 20px; }\nh1 { color: #818CF8; margin-top: 0; }\nbutton { background: #6366F1; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 600; }');
  const [sbJs, setSbJs] = useState('document.getElementById("btn").addEventListener("click", () => {\n  console.log("Interactive Sandbox Triggered!");\n  alert("Button clicked in Sandbox!");\n});');
  const [sbConsoleLogs, setSbConsoleLogs] = useState<string[]>(['Sandbox mounted ready']);
  const [sbDevice, setSbDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Single HTML Bundler state
  const [singleHtmlInput, setSingleHtmlInput] = useState(`<!-- index.html -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Sample</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Standalone Application</h1>\n  <button id="btn">Click me</button>\n  <script src="app.js"></script>\n</body>\n</html>\n\n/* style.css */\nbody { background: #0B0E13; color: white; font-family: sans-serif; padding: 20px; }\nh1 { color: #818CF8; }\nbutton { background: #6366F1; color: white; border: none; padding: 8px 16px; border-radius: 6px; }\n\n// app.js\ndocument.getElementById('btn').onclick = () => alert('Works inside Single HTML!');`);
  const [singleHtmlResult, setSingleHtmlResult] = useState('');

  // JWT state
  const [jwtInput, setJwtInput] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMzQ1IiwibmFtZSI6IkFsZXggRGV2Iiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  const [jwtHeader, setJwtHeader] = useState('');
  const [jwtPayload, setJwtPayload] = useState('');
  const [jwtValid, setJwtValid] = useState(true);

  // Markdown state
  const [mdInput, setMdInput] = useState('# Omnintellx Architecture\n\n**Multi-Agent Coordination Matrix**\n\n- [x] Master Orchestrator Engine\n- [x] Sub-Agent Hierarchical Delegations\n- [x] Single HTML Bundler Pipeline\n\n```ts\nconst agent = new MasterOrchestrator();\nagent.runPipeline("Deploy application");\n```');

  const [copied, setCopied] = useState(false);

  const copy = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const toolsList = [
    { id: 'single_html', name: 'Single HTML', icon: Sparkles, desc: 'Bundle to 1 File' },
    { id: 'jwt', name: 'JWT Inspector', icon: ShieldCheck, desc: 'Token Decoder' },
    { id: 'json', name: 'JSON Formatter', icon: FileJson, desc: 'Format & Validate' },
    { id: 'regex', name: 'Regex Tester', icon: Regex, desc: 'Pattern Match' },
    { id: 'base64', name: 'Base64', icon: Binary, desc: 'Encode & Decode' },
    { id: 'color', name: 'Color Picker', icon: Palette, desc: 'HEX, RGB & HSL' },
    { id: 'hash', name: 'Hash SHA-256', icon: Hash, desc: 'Checksums' },
    { id: 'uuid', name: 'UUID Generator', icon: Fingerprint, desc: 'RFC 4122 v4' },
    { id: 'diff', name: 'Diff Viewer', icon: GitCompare, desc: 'Compare Changes' },
    { id: 'http', name: 'HTTP Client', icon: Globe, desc: 'REST API Tester' },
    { id: 'terminal', name: 'Virtual Shell', icon: Terminal, desc: 'Workspace Shell' },
    { id: 'preview', name: 'Live Sandbox', icon: Play, desc: 'Run HTML/CSS/JS' }
  ];

  // Tool Handlers
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonOutput(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleTestRegex = () => {
    try {
      const re = new RegExp(regexPattern, 'gm');
      const matches = regexText.match(re) || [];
      setRegexMatches(matches);
    } catch (e: any) {
      setRegexMatches([`Invalid Regex: ${e.message}`]);
    }
  };

  const handleBase64Encode = () => {
    try {
      setB64Output(btoa(b64Input));
    } catch (e: any) {
      setB64Output(`Error: ${e.message}`);
    }
  };

  const handleBase64Decode = () => {
    try {
      setB64Output(atob(b64Input));
    } catch (e: any) {
      setB64Output(`Error: ${e.message}`);
    }
  };

  const handleSha256 = async () => {
    const encoder = new TextEncoder();
    const data = encoder.encode(hashInput);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    setHashOutput(hashHex);
  };

  const handleGenerateUuid = () => {
    const newUuid = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    setUuidList([newUuid, ...uuidList]);
  };

  const handleSendHttp = async () => {
    setHttpLoading(true);
    try {
      const res = await fetch(httpUrl, { method: httpMethod });
      const data = await res.json();
      setHttpResponse(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setHttpResponse(`HTTP Request Error: ${e.message}`);
    } finally {
      setHttpLoading(false);
    }
  };

  const handleTermCommand = () => {
    const cmd = termInput.trim();
    if (!cmd) return;
    setTermInput('');

    const newLogs = [...termLog, `omnintellx> ${cmd}`];
    const parts = cmd.split(' ');
    const main = parts[0].toLowerCase();

    if (main === 'help') {
      newLogs.push('Available commands: ls, cat <file>, help, clear, date, echo <text>, status');
    } else if (main === 'clear') {
      setTermLog([]);
      return;
    } else if (main === 'ls') {
      newLogs.push(files.map(f => `${f.name} (${f.content.length} B)`).join('  ') || 'No files');
    } else if (main === 'cat') {
      const f = files.find(file => file.name === parts[1]);
      newLogs.push(f ? f.content : `File not found: ${parts[1]}`);
    } else if (main === 'date') {
      newLogs.push(new Date().toString());
    } else if (main === 'echo') {
      newLogs.push(parts.slice(1).join(' '));
    } else if (main === 'status') {
      newLogs.push('Omnintellx Multi-Agent Engine: 100% ONLINE');
    } else {
      newLogs.push(`Command not found: ${main}. Type "help" for commands.`);
    }

    setTermLog(newLogs);
  };

  // Single HTML Inliner Logic
  const handleCompileSingleHtml = () => {
    // If files are provided from project, bundle them
    if (files && files.length > 0) {
      const html = files.find(f => f.name.endsWith('.html'))?.content || '<html><body><h1>App</h1></body></html>';
      const css = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n');
      const js = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts')).map(f => f.content).join('\n');

      let bundled = html;
      if (bundled.includes('</head>')) {
        bundled = bundled.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      } else {
        bundled = `<style>\n${css}\n</style>\n` + bundled;
      }
      if (bundled.includes('</body>')) {
        bundled = bundled.replace('</body>', `<script>\n(function(){\n${js}\n})();\n</script>\n</body>`);
      } else {
        bundled = bundled + `\n<script>\n(function(){\n${js}\n})();\n</script>`;
      }
      setSingleHtmlResult(bundled);
    } else {
      setSingleHtmlResult(singleHtmlInput);
    }
  };

  // JWT Decoder Logic
  const handleDecodeJwt = () => {
    try {
      const parts = jwtInput.trim().split('.');
      if (parts.length < 2) {
        setJwtValid(false);
        setJwtHeader('Invalid JWT format (must have 3 parts separated by dots)');
        setJwtPayload('');
        return;
      }
      const headerObj = JSON.parse(atob(parts[0]));
      const payloadObj = JSON.parse(atob(parts[1]));
      setJwtHeader(JSON.stringify(headerObj, null, 2));
      setJwtPayload(JSON.stringify(payloadObj, null, 2));
      setJwtValid(true);
    } catch (e: any) {
      setJwtValid(false);
      setJwtHeader(`Decode Error: ${e.message}`);
      setJwtPayload('');
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-white">Developer Utilities</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Essential tools for everyday code construction, data validation, and live sandbox testing
        </p>
      </div>

      {/* Tools Grid Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {toolsList.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;

          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className={`p-3 rounded-xl border flex flex-col items-center text-center transition-all ${
                isActive
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-white shadow-lg ring-1 ring-indigo-500/30'
                  : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              <Icon className={`w-5 h-5 mb-1.5 ${isActive ? 'text-indigo-400' : ''}`} />
              <span className="text-xs font-semibold">{t.name}</span>
              <span className="text-[10px] text-slate-500 font-mono mt-0.5">{t.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tool Workspace */}
      <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
        {/* SINGLE HTML COMPILER */}
        {activeTool === 'single_html' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  Single HTML Inliner &amp; Bundler
                </h3>
                <p className="text-xs text-slate-400">
                  Combines project HTML, CSS stylesheets, and JS scripts into a standalone single-file document
                </p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Inliner v2.5
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase text-slate-400">Workspace Files Input</label>
              <textarea
                value={singleHtmlInput}
                onChange={(e) => setSingleHtmlInput(e.target.value)}
                rows={6}
                className="w-full p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCompileSingleHtml}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" /> Compile Single HTML
              </button>
              {singleHtmlResult && (
                <>
                  <button
                    onClick={() => copy(singleHtmlResult)}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1.5"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy Bundle
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([singleHtmlResult], { type: 'text/html;charset=utf-8' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'bundle_standalone.html';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download .html
                  </button>
                </>
              )}
            </div>

            {singleHtmlResult && (
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[11px] text-emerald-400">✓ Single HTML Bundle Generated:</span>
                  <span className="font-mono text-[10px]">{(new Blob([singleHtmlResult]).size / 1024).toFixed(1)} KB</span>
                </div>
                <pre className="p-3 bg-black/60 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 overflow-auto max-h-60">
                  {singleHtmlResult}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* JWT INSPECTOR */}
        {activeTool === 'jwt' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                JWT Token Inspector &amp; Claims Decoder
              </h3>
              <p className="text-xs text-slate-400">
                Inspect Header, Payload, expiration timestamp, and claims without sending tokens across the network
              </p>
            </div>

            <textarea
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              rows={3}
              placeholder="Paste JSON Web Token (JWT) here..."
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />

            <button
              onClick={handleDecodeJwt}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> Decode Token
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Header (Algorithm &amp; Type)</label>
                <pre className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-indigo-300 overflow-auto max-h-48 min-h-[100px]">
                  {jwtHeader || 'Click Decode Token to parse header'}
                </pre>
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Payload (Claims &amp; Subject)</label>
                <pre className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-emerald-300 overflow-auto max-h-48 min-h-[100px]">
                  {jwtPayload || 'Click Decode Token to parse claims'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* 1. JSON FORMATTER */}
        {activeTool === 'json' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">JSON Formatter &amp; Validator</h3>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={6}
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button onClick={handleFormatJson} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                Format &amp; Beautify
              </button>
              <button onClick={() => copy(jsonOutput || jsonInput)} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-medium flex items-center gap-1">
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />} Copy
              </button>
            </div>
            {jsonError && <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-mono">Error: {jsonError}</div>}
            {jsonOutput && <pre className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-slate-300 overflow-auto max-h-60">{jsonOutput}</pre>}
          </div>
        )}

        {/* 2. REGEX TESTER */}
        {activeTool === 'regex' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Regex Pattern Tester</h3>
            <input
              type="text"
              value={regexPattern}
              onChange={(e) => setRegexPattern(e.target.value)}
              placeholder="Regex pattern..."
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white"
            />
            <textarea
              value={regexText}
              onChange={(e) => setRegexText(e.target.value)}
              rows={4}
              placeholder="Test string..."
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white"
            />
            <button onClick={handleTestRegex} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
              Find Matches
            </button>
            {regexMatches.length > 0 && (
              <div className="p-3 bg-black/50 border border-white/10 rounded-xl text-xs font-mono space-y-1">
                <span className="text-indigo-400 font-bold">{regexMatches.length} Matches Found:</span>
                {regexMatches.map((m, idx) => (
                  <div key={idx} className="text-emerald-300">[{idx + 1}] {m}</div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 3. BASE64 */}
        {activeTool === 'base64' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Base64 Encoder / Decoder</h3>
            <textarea
              value={b64Input}
              onChange={(e) => setB64Input(e.target.value)}
              rows={4}
              className="w-full p-3 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-white"
            />
            <div className="flex gap-2">
              <button onClick={handleBase64Encode} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                Encode
              </button>
              <button onClick={handleBase64Decode} className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold">
                Decode
              </button>
            </div>
            {b64Output && <pre className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-slate-300 break-all">{b64Output}</pre>}
          </div>
        )}

        {/* 4. COLOR PICKER */}
        {activeTool === 'color' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Color Tokens &amp; Palette</h3>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="w-16 h-16 rounded-xl cursor-pointer bg-transparent border-0"
              />
              <div className="space-y-1 text-xs font-mono text-slate-300">
                <div>HEX: <strong className="text-white">{colorHex}</strong></div>
                <div>CSS Variable: <code className="text-indigo-400 font-mono">var(--primary: {colorHex})</code></div>
              </div>
            </div>
          </div>
        )}

        {/* 5. SHA-256 HASH */}
        {activeTool === 'hash' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Cryptographic SHA-256 Checksum</h3>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white"
            />
            <button onClick={handleSha256} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
              Calculate Hash
            </button>
            {hashOutput && (
              <div className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-emerald-400 break-all flex items-center justify-between">
                <span>{hashOutput}</span>
                <button onClick={() => copy(hashOutput)} className="p-1 hover:text-white text-slate-400">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. UUID GENERATOR */}
        {activeTool === 'uuid' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">RFC 4122 v4 UUID Generator</h3>
              <button onClick={handleGenerateUuid} className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold">
                Generate New UUID
              </button>
            </div>
            <div className="space-y-2">
              {uuidList.map((u, i) => (
                <div key={i} className="p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300 flex items-center justify-between">
                  <span>{u}</span>
                  <button onClick={() => copy(u)} className="p-1 hover:text-white text-slate-400">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. DIFF VIEWER */}
        {activeTool === 'diff' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Diff Code Comparison</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Original</label>
                <textarea
                  value={diffA}
                  onChange={(e) => setDiffA(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Modified</label>
                <textarea
                  value={diffB}
                  onChange={(e) => setDiffB(e.target.value)}
                  rows={6}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300"
                />
              </div>
            </div>
          </div>
        )}

        {/* 8. HTTP CLIENT */}
        {activeTool === 'http' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">HTTP REST API Client</h3>
            <div className="flex gap-2">
              <select
                value={httpMethod}
                onChange={(e) => setHttpMethod(e.target.value)}
                className="px-3 py-2 bg-black/50 border border-white/10 rounded-xl text-xs font-bold text-indigo-400"
              >
                <option>GET</option>
                <option>POST</option>
                <option>PUT</option>
                <option>DELETE</option>
              </select>
              <input
                type="text"
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white"
              />
              <button
                onClick={handleSendHttp}
                disabled={httpLoading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" /> Send
              </button>
            </div>
            {httpResponse && (
              <pre className="p-3 bg-black/50 border border-white/10 rounded-xl font-mono text-xs text-slate-300 overflow-auto max-h-64">
                {httpResponse}
              </pre>
            )}
          </div>
        )}

        {/* 9. VIRTUAL TERMINAL */}
        {activeTool === 'terminal' && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Virtual Workspace Terminal</h3>
            <div className="bg-[#090D13] p-4 rounded-xl font-mono text-xs text-slate-300 space-y-1 min-h-[220px] max-h-[300px] overflow-auto border border-white/10">
              {termLog.map((log, i) => (
                <div key={i} className={log.startsWith('omnintellx>') || log.startsWith('om>') ? 'text-indigo-400 font-bold' : ''}>
                  {log}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={termInput}
                onChange={(e) => setTermInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleTermCommand();
                }}
                placeholder="Type command (e.g. ls, cat index.html, help)..."
                className="flex-1 px-3 py-2 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-white focus:outline-none"
              />
              <button onClick={handleTermCommand} className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold">
                Execute
              </button>
            </div>
          </div>
        )}

        {/* 10. LIVE SANDBOX PREVIEW */}
        {activeTool === 'preview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Interactive Live Sandbox</h3>
              <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/10">
                <button
                  onClick={() => setSbDevice('desktop')}
                  className={`p-1.5 rounded ${sbDevice === 'desktop' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setSbDevice('mobile')}
                  className={`p-1.5 rounded ${sbDevice === 'mobile' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-mono uppercase text-slate-400">HTML Structure</label>
                <textarea
                  value={sbHtml}
                  onChange={(e) => setSbHtml(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300"
                />
                <label className="text-[10px] font-mono uppercase text-slate-400">CSS Styling</label>
                <textarea
                  value={sbCss}
                  onChange={(e) => setSbCss(e.target.value)}
                  rows={4}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300"
                />
                <label className="text-[10px] font-mono uppercase text-slate-400">JavaScript Interactivity</label>
                <textarea
                  value={sbJs}
                  onChange={(e) => setSbJs(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 bg-black/40 border border-white/10 rounded-xl font-mono text-xs text-slate-300"
                />
              </div>

              {/* Render Frame */}
              <div className="flex flex-col items-center justify-center p-3 bg-[#090D13] rounded-xl border border-white/10 overflow-hidden">
                <div
                  className={`transition-all bg-white rounded-lg overflow-hidden border border-slate-700 shadow-2xl ${
                    sbDevice === 'mobile' ? 'w-[300px] h-[380px]' : 'w-full h-[380px]'
                  }`}
                >
                  <iframe
                    title="Live Preview"
                    srcDoc={`<!DOCTYPE html><html><head><style>${sbCss}</style></head><body>${sbHtml}<script>${sbJs}<\/script></body></html>`}
                    className="w-full h-full border-none"
                    sandbox="allow-scripts allow-modals"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
