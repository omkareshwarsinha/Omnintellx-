/**
 * Omnintellx — Autonomous AI Code Block Parser & Project File Extractor
 * Extracts code blocks from AI messages, auto-formats them, and writes them directly into Project files.
 * Also parses autonomous tool calls (create_file, edit_file, delete_file, execute_command).
 */

import { Project, ProjectFile } from '../types';
import { autoFormatCode } from './codeFormatter';
import { compileProjectToSingleHtml } from './singleHtmlCompiler';

export interface ExtractedCodeFile {
  name: string;
  content: string;
  language: string;
  lineCount?: number;
  sizeBytes?: number;
}

export interface ExtractedToolCall {
  id: string;
  tool: 'create_file' | 'edit_file' | 'delete_file' | 'execute_command' | 'git_checkpoint' | 'inspect_project' | string;
  params: Record<string, any>;
  rawBlock: string;
}

export function extractCodeFilesFromText(text: string): ExtractedCodeFile[] {
  if (!text) return [];

  const files: ExtractedCodeFile[] = [];
  // Supports ```lang // filename, ```lang /* filename */, ```lang <!-- filename -->, ```lang File: filename, or ```lang:path/to/file
  const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)(?::([^\n]+))?\s*(?:\/\/\s*(?:File:\s*)?([a-zA-Z0-9_\-\.\/]+)|\/\*\s*(?:File:\s*)?([a-zA-Z0-9_\-\.\/]+)\s*\*\/|<!--\s*(?:File:\s*)?([a-zA-Z0-9_\-\.\/]+)\s*-->|#\s*(?:File:\s*)?([a-zA-Z0-9_\-\.\/]+))?\n([\s\S]*?)```/g;

  let match;
  let unnamedIndex = 1;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const rawLang = (match[1] || '').trim().toLowerCase();
    const colonPath = (match[2] || '').trim();
    const specifiedName = (match[3] || match[4] || match[5] || match[6] || colonPath || '').trim();
    const rawCode = match[7];

    if (!rawCode || !rawCode.trim()) continue;

    let fileName = specifiedName;

    if (!fileName) {
      if (rawLang === 'html' || rawCode.includes('<!DOCTYPE') || rawCode.includes('<html')) {
        fileName = files.some(f => f.name === 'index.html') ? `page_${unnamedIndex}.html` : 'index.html';
      } else if (rawLang === 'css' || rawCode.includes('@import') || (rawCode.includes('{') && rawCode.includes('margin:'))) {
        fileName = files.some(f => f.name === 'style.css') ? `styles_${unnamedIndex}.css` : 'style.css';
      } else if (rawLang === 'json') {
        fileName = `config_${unnamedIndex}.json`;
      } else if (rawLang === 'typescript' || rawLang === 'ts') {
        fileName = `module_${unnamedIndex}.ts`;
      } else if (rawLang === 'tsx' || rawLang === 'jsx' || rawCode.includes('import React') || rawCode.includes('export default')) {
        fileName = files.some(f => f.name === 'App.tsx') ? `Component_${unnamedIndex}.tsx` : 'App.tsx';
      } else if (rawLang === 'javascript' || rawLang === 'js') {
        fileName = files.some(f => f.name === 'app.js') ? `script_${unnamedIndex}.js` : 'app.js';
      } else if (rawLang === 'python' || rawLang === 'py') {
        fileName = files.some(f => f.name === 'main.py') ? `script_${unnamedIndex}.py` : 'main.py';
      } else {
        fileName = `code_${unnamedIndex}.${rawLang || 'txt'}`;
      }
      unnamedIndex++;
    }

    // Auto-format the extracted code
    const formattedCode = autoFormatCode(rawCode.trim(), fileName);
    const lineCount = formattedCode.split('\n').length;
    const sizeBytes = new TextEncoder().encode(formattedCode).length;

    files.push({
      name: fileName,
      content: formattedCode,
      language: rawLang || 'text',
      lineCount,
      sizeBytes
    });
  }

  return files;
}

export function extractToolCallsFromText(text: string): ExtractedToolCall[] {
  if (!text) return [];
  const calls: ExtractedToolCall[] = [];

  // 1. Tag format: [TOOL: create_file {"path": "...", "content": "..."}]
  const tagRegex = /\[TOOL:\s*([a-zA-Z0-9_\-]+)\s+([\s\S]*?)\]/g;
  let m;
  while ((m = tagRegex.exec(text)) !== null) {
    try {
      const tool = m[1].trim();
      const params = JSON.parse(m[2].trim());
      calls.push({
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        tool,
        params,
        rawBlock: m[0]
      });
    } catch {}
  }

  // 2. XML format: <tool_call name="...">{"path": "..."}</tool_call>
  const xmlRegex = /<tool_call\s+name=["']([a-zA-Z0-9_\-]+)["']>([\s\S]*?)<\/tool_call>/g;
  while ((m = xmlRegex.exec(text)) !== null) {
    try {
      const tool = m[1].trim();
      const params = JSON.parse(m[2].trim());
      calls.push({
        id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        tool,
        params,
        rawBlock: m[0]
      });
    } catch {}
  }

  return calls;
}

/**
 * Apply extracted code files into a Project, updating existing files or appending new ones.
 * Automatically synchronizes omni/index.html and omni/standalone.html with fresh single-file compilation.
 */
export function applyExtractedFilesToProject(project: Project, extractedFiles: ExtractedCodeFile[]): Project {
  if (!extractedFiles || extractedFiles.length === 0) return project;

  const updatedFiles: ProjectFile[] = [...project.files];

  for (const ef of extractedFiles) {
    const existingIndex = updatedFiles.findIndex(f => f.name.toLowerCase() === ef.name.toLowerCase());
    if (existingIndex >= 0) {
      updatedFiles[existingIndex] = {
        ...updatedFiles[existingIndex],
        content: ef.content,
        updatedAt: Date.now(),
        lastEditedByAgent: 'AI Assistant'
      };
    } else {
      updatedFiles.push({
        id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: ef.name,
        content: ef.content,
        updatedAt: Date.now(),
        lastEditedByAgent: 'AI Assistant'
      });
    }
  }

  // Compile full standalone single HTML output
  const tempProj: Project = {
    ...project,
    files: updatedFiles
  };
  const standaloneHtml = compileProjectToSingleHtml(tempProj);

  // Write/update omni/index.html and omni/standalone.html
  const omniIndex = updatedFiles.findIndex(f => f.name === 'omni/index.html');
  if (omniIndex >= 0) {
    updatedFiles[omniIndex] = { ...updatedFiles[omniIndex], content: standaloneHtml, updatedAt: Date.now() };
  } else {
    updatedFiles.push({
      id: `file_omni_${Date.now()}_1`,
      name: 'omni/index.html',
      content: standaloneHtml,
      updatedAt: Date.now(),
      lastEditedByAgent: 'Single HTML Compiler'
    });
  }

  const omniStandaloneIndex = updatedFiles.findIndex(f => f.name === 'omni/standalone.html');
  if (omniStandaloneIndex >= 0) {
    updatedFiles[omniStandaloneIndex] = { ...updatedFiles[omniStandaloneIndex], content: standaloneHtml, updatedAt: Date.now() };
  } else {
    updatedFiles.push({
      id: `file_omni_${Date.now()}_2`,
      name: 'omni/standalone.html',
      content: standaloneHtml,
      updatedAt: Date.now(),
      lastEditedByAgent: 'Single HTML Compiler'
    });
  }

  return {
    ...project,
    files: updatedFiles,
    updatedAt: Date.now()
  };
}
