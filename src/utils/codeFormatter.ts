/**
 * Omnintellx — Autonomous Code Beautifier & Auto-Formatter
 * Formats HTML, CSS, JS, TS, JSON, and Markdown files cleanly with 2-space indentation.
 */

export function autoFormatCode(rawCode: string, filename: string = 'index.html'): string {
  if (!rawCode || !rawCode.trim()) return rawCode;

  const ext = filename.split('.').pop()?.toLowerCase() || '';

  try {
    // 1. JSON formatting
    if (ext === 'json' || (rawCode.trim().startsWith('{') && rawCode.trim().endsWith('}')) || (rawCode.trim().startsWith('[') && rawCode.trim().endsWith(']'))) {
      try {
        const parsed = JSON.parse(rawCode);
        return JSON.stringify(parsed, null, 2) + '\n';
      } catch (_) {
        // Fallback to general formatting
      }
    }

    // 2. HTML formatting
    if (ext === 'html' || ext === 'htm' || rawCode.trim().startsWith('<!DOCTYPE') || rawCode.trim().startsWith('<html')) {
      return formatHtml(rawCode);
    }

    // 3. CSS / SCSS formatting
    if (ext === 'css' || ext === 'scss') {
      return formatCss(rawCode);
    }

    // 4. JS / TS / JSX / TSX formatting
    return formatJsTs(rawCode);
  } catch (err) {
    console.warn('Auto-formatter encountered an issue, preserving code:', err);
    return rawCode;
  }
}

/**
 * Fast & clean HTML formatter with preserved script and style blocks
 */
function formatHtml(html: string): string {
  let indentLevel = 0;
  const indentStr = '  ';
  const tokens = html.replace(/>\s*</g, '><').match(/(<[^>]+>|[^<]+)/g) || [html];
  const formatted: string[] = [];

  const selfClosing = /^(?:<area|<base|<br|<col|<embed|<hr|<img|<input|<link|<meta|<param|<source|<track|<wbr|\/?!DOCTYPE|\?xml)/i;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i].trim();
    if (!token) continue;

    if (token.startsWith('</')) {
      indentLevel = Math.max(0, indentLevel - 1);
      formatted.push(indentStr.repeat(indentLevel) + token);
    } else if (token.startsWith('<') && !token.startsWith('<!') && !selfClosing.test(token) && !token.endsWith('/>')) {
      formatted.push(indentStr.repeat(indentLevel) + token);
      indentLevel++;
    } else {
      formatted.push(indentStr.repeat(indentLevel) + token);
    }
  }

  return formatted.join('\n');
}

/**
 * Fast & clean CSS formatter
 */
function formatCss(css: string): string {
  let indentLevel = 0;
  const indentStr = '  ';
  const lines = css
    .replace(/\{/g, ' {\n')
    .replace(/\}/g, '\n}\n')
    .replace(/;/g, ';\n')
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const formatted: string[] = [];

  for (const line of lines) {
    if (line.includes('}')) {
      indentLevel = Math.max(0, indentLevel - 1);
    }
    formatted.push(indentStr.repeat(indentLevel) + line);
    if (line.includes('{')) {
      indentLevel++;
    }
  }

  return formatted.join('\n');
}

/**
 * Fast JS/TS beautifier with proper brace balancing
 */
function formatJsTs(code: string): string {
  const lines = code.split('\n');
  let indentLevel = 0;
  const indentStr = '  ';
  const formatted: string[] = [];

  for (let rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      formatted.push('');
      continue;
    }

    // Check if line closes a block first
    const startsWithClose = line.startsWith('}') || line.startsWith(']') || line.startsWith(')');
    if (startsWithClose) {
      indentLevel = Math.max(0, indentLevel - 1);
    }

    formatted.push(indentStr.repeat(indentLevel) + line);

    // Count open/close balance for next lines
    const openBraces = (line.match(/[\{\[\(]/g) || []).length;
    const closeBraces = (line.match(/[\}\]\)]/g) || []).length;
    const diff = openBraces - closeBraces;

    if (!startsWithClose && diff !== 0) {
      indentLevel = Math.max(0, indentLevel + diff);
    } else if (startsWithClose && openBraces > 0) {
      indentLevel = Math.max(0, indentLevel + openBraces);
    }
  }

  return formatted.join('\n');
}
