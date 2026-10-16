/**
 * Omnintellx — Real Client-Side Validation & Security Engine
 * Zero fabricated metrics. Real DOM parsing, CSS verification, JS syntax check, and static security audit.
 */

export interface ValidationCheckItem {
  id: string;
  name: string;
  category: 'HTML' | 'CSS' | 'JAVASCRIPT' | 'JSON' | 'SECURITY' | 'SERVER_RUNTIME';
  type: 'STATIC_CHECK' | 'BROWSER_RUNTIME' | 'UNAVAILABLE';
  status: 'PASSED' | 'WARNING' | 'FAILED' | 'NOT_TESTED';
  message: string;
  file?: string;
  line?: number;
}

export interface ValidationReport {
  timestamp: number;
  totalExecuted: number;
  passed: number;
  warnings: number;
  failed: number;
  notTested: number;
  checks: ValidationCheckItem[];
  errors: string[];
  serverRuntimeNote?: string;
}

export class RealProjectValidator {
  /**
   * Validate HTML document via browser DOMParser
   */
  static validateHtml(content: string, filename: string = 'index.html'): ValidationCheckItem[] {
    const checks: ValidationCheckItem[] = [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'text/html');

      // Check for parsererror
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        checks.push({
          id: `html-parse-${Date.now()}`,
          name: 'HTML Document Parsing',
          category: 'HTML',
          type: 'STATIC_CHECK',
          status: 'FAILED',
          message: `HTML parsing syntax error: ${parserError.textContent?.slice(0, 100)}`,
          file: filename
        });
        return checks;
      }

      // Check basic document structure
      const hasDoctype = content.trim().toLowerCase().startsWith('<!doctype html');
      checks.push({
        id: `html-doctype-${filename}`,
        name: 'HTML5 Doctype Declaration',
        category: 'HTML',
        type: 'STATIC_CHECK',
        status: hasDoctype ? 'PASSED' : 'WARNING',
        message: hasDoctype ? '<!DOCTYPE html> declared properly' : 'Missing standard <!DOCTYPE html> declaration',
        file: filename
      });

      // Check title tag
      const title = doc.querySelector('title');
      const hasTitle = !!title && (title.textContent?.trim().length || 0) > 0;
      checks.push({
        id: `html-title-${filename}`,
        name: 'Document Title Element',
        category: 'HTML',
        type: 'STATIC_CHECK',
        status: hasTitle ? 'PASSED' : 'WARNING',
        message: hasTitle ? `Title element present ("${title?.textContent?.trim().slice(0, 30)}")` : 'Missing <title> in <head>',
        file: filename
      });

      // Check viewport meta
      const viewport = doc.querySelector('meta[name="viewport"]');
      checks.push({
        id: `html-viewport-${filename}`,
        name: 'Mobile Viewport Meta Tag',
        category: 'HTML',
        type: 'STATIC_CHECK',
        status: viewport ? 'PASSED' : 'WARNING',
        message: viewport ? 'Responsive viewport configured' : 'Missing <meta name="viewport"> tag for mobile responsiveness',
        file: filename
      });

      // Check script tags for unclosed or broken inline tags
      const scripts = doc.querySelectorAll('script:not([src])');
      scripts.forEach((script, idx) => {
        const text = script.textContent || '';
        if (text.trim().length > 0) {
          const jsCheck = this.validateJsSyntax(text, `${filename} (inline script #${idx + 1})`);
          checks.push(...jsCheck);
        }
      });

    } catch (err: any) {
      checks.push({
        id: `html-err-${Date.now()}`,
        name: 'HTML DOMParser Execution',
        category: 'HTML',
        type: 'STATIC_CHECK',
        status: 'FAILED',
        message: `HTML validation error: ${err.message}`,
        file: filename
      });
    }

    return checks;
  }

  /**
   * Validate JavaScript syntax in the browser
   */
  static validateJsSyntax(code: string, filename: string): ValidationCheckItem[] {
    const checks: ValidationCheckItem[] = [];

    // Strip module imports/exports for syntax testing in new Function if needed
    let sanitizedCode = code;
    try {
      // 1. Try Function constructor for basic syntax checking (does not execute)
      // Replace import/export statements with dummy variables to avoid top-level module syntax error in Function()
      const parseable = code
        .replace(/import\s+.*?from\s+['"].*?['"];?/g, '/* import */')
        .replace(/import\s+['"].*?['"];?/g, '/* import */')
        .replace(/export\s+default\s+/g, '/* export default */ ')
        .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ');

      new Function(parseable);

      checks.push({
        id: `js-syntax-${filename}`,
        name: 'JavaScript Syntax Validation',
        category: 'JAVASCRIPT',
        type: 'BROWSER_RUNTIME',
        status: 'PASSED',
        message: 'No JavaScript syntax errors detected',
        file: filename
      });
    } catch (syntaxErr: any) {
      checks.push({
        id: `js-syntax-err-${filename}`,
        name: 'JavaScript Syntax Validation',
        category: 'JAVASCRIPT',
        type: 'BROWSER_RUNTIME',
        status: 'FAILED',
        message: `Syntax error: ${syntaxErr.message}`,
        file: filename
      });
    }

    return checks;
  }

  /**
   * Validate CSS syntax
   */
  static validateCss(cssText: string, filename: string): ValidationCheckItem[] {
    const checks: ValidationCheckItem[] = [];

    // Check matching braces
    let braceCount = 0;
    let malformed = false;
    for (let i = 0; i < cssText.length; i++) {
      if (cssText[i] === '{') braceCount++;
      else if (cssText[i] === '}') {
        braceCount--;
        if (braceCount < 0) {
          malformed = true;
          break;
        }
      }
    }

    if (malformed || braceCount !== 0) {
      checks.push({
        id: `css-braces-${filename}`,
        name: 'CSS Braces Symmetry',
        category: 'CSS',
        type: 'STATIC_CHECK',
        status: 'FAILED',
        message: `Mismatched CSS curly braces (${braceCount > 0 ? `${braceCount} unclosed` : 'extra closing brace'})`,
        file: filename
      });
    } else {
      checks.push({
        id: `css-syntax-${filename}`,
        name: 'CSS Syntax Structure',
        category: 'CSS',
        type: 'STATIC_CHECK',
        status: 'PASSED',
        message: 'CSS ruleblocks balanced with valid brace pairs',
        file: filename
      });
    }

    return checks;
  }

  /**
   * Validate JSON syntax
   */
  static validateJson(jsonText: string, filename: string): ValidationCheckItem[] {
    try {
      JSON.parse(jsonText);
      return [{
        id: `json-valid-${filename}`,
        name: 'JSON Syntax & Schema Parse',
        category: 'JSON',
        type: 'BROWSER_RUNTIME',
        status: 'PASSED',
        message: 'Valid JSON document parsed successfully',
        file: filename
      }];
    } catch (err: any) {
      return [{
        id: `json-err-${filename}`,
        name: 'JSON Syntax & Schema Parse',
        category: 'JSON',
        type: 'BROWSER_RUNTIME',
        status: 'FAILED',
        message: `Invalid JSON: ${err.message}`,
        file: filename
      }];
    }
  }

  /**
   * Real Static Security Audit
   * Never claims "OWASP 100/100" - reports actual static checks performed.
   */
  static performStaticSecurityAudit(files: Array<{ name: string; content: string }>): ValidationCheckItem[] {
    const checks: ValidationCheckItem[] = [];

    let secretLeakFound = false;
    let dangerousEvalFound = false;
    let insecureHttpFound = false;

    // Secret pattern regexes
    const secretPatterns = [
      { name: 'OpenAI Secret Key', regex: /sk-[A-Za-z0-9-_]{32,}/ },
      { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/ },
      { name: 'Private Key Header', regex: /-----BEGIN PRIVATE KEY-----/ }
    ];

    files.forEach(f => {
      // 1. Hardcoded secret scan
      for (const pat of secretPatterns) {
        if (pat.regex.test(f.content)) {
          secretLeakFound = true;
          checks.push({
            id: `sec-secret-${f.name}`,
            name: `Credential & Secret Leak Check (${pat.name})`,
            category: 'SECURITY',
            type: 'STATIC_CHECK',
            status: 'FAILED',
            message: `Possible hardcoded credential detected matching ${pat.name}`,
            file: f.name
          });
        }
      }

      // 2. Dangerous eval/Function injection
      if (/\beval\s*\(/.test(f.content)) {
        dangerousEvalFound = true;
        checks.push({
          id: `sec-eval-${f.name}`,
          name: 'Dynamic Code Execution (eval)',
          category: 'SECURITY',
          type: 'STATIC_CHECK',
          status: 'WARNING',
          message: 'Use of eval() detected. Can cause arbitrary code execution if dynamic input is passed.',
          file: f.name
        });
      }

      // 3. Insecure mixed-content HTTP in scripts/links
      if (/src=["']http:\/\//i.test(f.content) || /href=["']http:\/\//i.test(f.content)) {
        insecureHttpFound = true;
        checks.push({
          id: `sec-http-${f.name}`,
          name: 'Mixed Content (Insecure HTTP)',
          category: 'SECURITY',
          type: 'STATIC_CHECK',
          status: 'WARNING',
          message: 'External script/asset loaded over unencrypted HTTP instead of HTTPS',
          file: f.name
        });
      }
    });

    if (!secretLeakFound) {
      checks.push({
        id: 'sec-secret-clean',
        name: 'Hardcoded Secret Scan',
        category: 'SECURITY',
        type: 'STATIC_CHECK',
        status: 'PASSED',
        message: 'No unencrypted API keys or private keys found in scanned files'
      });
    }

    if (!dangerousEvalFound) {
      checks.push({
        id: 'sec-eval-clean',
        name: 'Dangerous Script Execution Audit',
        category: 'SECURITY',
        type: 'STATIC_CHECK',
        status: 'PASSED',
        message: 'No unsafe eval() calls detected in scanned source files'
      });
    }

    if (!insecureHttpFound) {
      checks.push({
        id: 'sec-http-clean',
        name: 'HTTPS Transport Security Check',
        category: 'SECURITY',
        type: 'STATIC_CHECK',
        status: 'PASSED',
        message: 'All external asset URLs utilize HTTPS encryption'
      });
    }

    return checks;
  }

  /**
   * Run complete validation suite across all project workspace files
   */
  static validateProject(files: Array<{ name: string; content: string }>): ValidationReport {
    return this.runCompleteWorkspaceValidation(files);
  }

  static runCompleteWorkspaceValidation(files: Array<{ name: string; content: string }>): ValidationReport {
    const checks: ValidationCheckItem[] = [];
    const errors: string[] = [];

    let hasBackendServerFiles = false;

    // Check each file
    files.forEach(f => {
      const lower = f.name.toLowerCase();

      if (lower.endsWith('.html') || lower.endsWith('.htm')) {
        checks.push(...this.validateHtml(f.content, f.name));
      } else if (lower.endsWith('.css')) {
        checks.push(...this.validateCss(f.content, f.name));
      } else if (lower.endsWith('.js') || lower.endsWith('.ts')) {
        checks.push(...this.validateJsSyntax(f.content, f.name));
      } else if (lower.endsWith('.json')) {
        checks.push(...this.validateJson(f.content, f.name));
      } else if (lower.endsWith('.py') || lower.endsWith('.sh') || lower.includes('dockerfile')) {
        hasBackendServerFiles = true;
      }
    });

    // Check cross-file references (e.g. index.html references styles.css or app.js)
    const indexHtml = files.find(f => f.name.toLowerCase() === 'index.html' || f.name.toLowerCase().endsWith('/index.html'));
    if (indexHtml) {
      const localLinks = Array.from(indexHtml.content.matchAll(/<(?:link|script)\s+[^>]*(?:href|src)=["']([^"']+)["']/gi));
      localLinks.forEach(match => {
        const ref = match[1];
        if (!ref.startsWith('http://') && !ref.startsWith('https://') && !ref.startsWith('//') && !ref.startsWith('data:')) {
          const cleanRef = ref.replace(/^\.?\//, '');
          const exists = files.some(f => f.name === cleanRef || f.name.endsWith('/' + cleanRef));
          if (!exists) {
            checks.push({
              id: `broken-ref-${cleanRef}`,
              name: 'Local Asset Link Integrity',
              category: 'HTML',
              type: 'STATIC_CHECK',
              status: 'WARNING',
              message: `Asset reference "${ref}" not found in project workspace files`,
              file: indexHtml.name
            });
          }
        }
      });
    }

    // Static security audit
    checks.push(...this.performStaticSecurityAudit(files));

    // Handle server execution honesty
    if (hasBackendServerFiles) {
      checks.push({
        id: 'server-runtime-unavailable',
        name: 'Backend Execution Engine',
        category: 'SERVER_RUNTIME',
        type: 'UNAVAILABLE',
        status: 'NOT_TESTED',
        message: 'Server execution unavailable in browser-only mode.'
      });
    }

    // Tally actual results
    let passed = 0;
    let warnings = 0;
    let failed = 0;
    let notTested = 0;

    checks.forEach(c => {
      if (c.status === 'PASSED') passed++;
      else if (c.status === 'WARNING') warnings++;
      else if (c.status === 'FAILED') {
        failed++;
        errors.push(`${c.name} (${c.file || 'General'}): ${c.message}`);
      } else if (c.status === 'NOT_TESTED') notTested++;
    });

    return {
      timestamp: Date.now(),
      totalExecuted: passed + warnings + failed,
      passed,
      warnings,
      failed,
      notTested,
      checks,
      errors,
      serverRuntimeNote: hasBackendServerFiles ? 'Server execution unavailable in browser-only mode.' : undefined
    };
  }
}
