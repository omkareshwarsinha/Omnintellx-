import fs from 'fs';
import path from 'path';
import { generateGenericOutputSuite } from '../backend/utils/outputGenerator';

const workspacesDir = path.resolve(process.cwd(), 'workspaces');

if (!fs.existsSync(workspacesDir)) {
  fs.mkdirSync(workspacesDir, { recursive: true });
}

const entries = fs.readdirSync(workspacesDir, { withFileTypes: true });
const targetDirs = entries.filter(e => e.isDirectory() && !e.name.startsWith('.')).map(e => e.name);

for (const dirName of targetDirs) {
  const dirPath = path.join(workspacesDir, dirName);
  const dirEntries = fs.readdirSync(dirPath, { withFileTypes: true });

  const filesSummary = dirEntries
    .filter(e => !e.isDirectory() && !e.name.startsWith('.'))
    .map(e => {
      const full = path.join(dirPath, e.name);
      const content = fs.readFileSync(full, 'utf8');
      const st = fs.statSync(full);
      return {
        path: e.name,
        content,
        size: st.size
      };
    });

  if (filesSummary.length > 0) {
    const suite = generateGenericOutputSuite(dirName, filesSummary);
    const outDir = path.join(dirPath, 'output');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    for (const [relPath, content] of Object.entries(suite)) {
      const fullOut = path.join(dirPath, relPath);
      const parent = path.dirname(fullOut);
      if (!fs.existsSync(parent)) fs.mkdirSync(parent, { recursive: true });
      fs.writeFileSync(fullOut, content, 'utf8');
    }
  }
}
console.log('[Omnintellx] Workspace deliverables synchronized.');
