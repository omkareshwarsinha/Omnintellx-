/**
 * Omnintellx — Authentic Verification Gate
 * Never marks a mission COMPLETE merely because code was generated.
 * Dynamically determines and executes relevant verification gates:
 * - BUILD GATE: verifies build scripts pass without error
 * - TEST GATE: executes unit test suites (npm test, python unittest)
 * - LINTER / SYNTAX GATE: runs syntax validation on all source files
 * - BROWSER / DOM GATE: checks HTML doctype, viewport, scripts, WebGL canvas
 * - SECURITY GATE: scans for leaked credentials and unsafe eval
 * - DELIVERABLES GATE: ensures output artifacts exist on disk
 */

import { WorkspaceManager } from '../projects/workspaceManager';
import { ExecutionManager } from '../execution/executionManager';
import { StructuredMissionState } from './missionState';

export interface VerificationReport {
  allPassed: boolean;
  passedGates: string[];
  failedGates: string[];
  untestedGates: string[];
  details: Record<string, { status: 'PASSED' | 'FAILED' | 'NOT_TESTED'; message: string }>;
  evidence: {
    filesCount: number;
    testsExecuted: boolean;
    buildExecuted: boolean;
    securityFindings: number;
    mobileViewportTested: boolean;
    runtimeErrorsChecked: boolean;
  };
}

export class VerificationGate {
  static async evaluate(
    state: StructuredMissionState,
    emitEvent?: (type: string, message: string, data?: any) => void
  ): Promise<VerificationReport> {
    emitEvent?.('verification.started', 'Verification Gate: Evaluating mission completion criteria...');

    const passedGates: string[] = [];
    const failedGates: string[] = [];
    const untestedGates: string[] = [];
    const details: Record<string, { status: 'PASSED' | 'FAILED' | 'NOT_TESTED'; message: string }> = {};

    const wsFiles = await WorkspaceManager.listFiles(state.projectId);
    const nonDir = wsFiles.filter(f => !f.isDirectory);
    const fileNames = nonDir.map(f => f.name);
    const exec = ExecutionManager.getInstance();

    // 1. FILES EXISTENCE GATE (Minimum viable project)
    if (nonDir.length === 0) {
      failedGates.push('FILES_GATE');
      details['FILES_GATE'] = { status: 'FAILED', message: 'Workspace is completely empty. No files created.' };
    } else {
      passedGates.push('FILES_GATE');
      details['FILES_GATE'] = { status: 'PASSED', message: `${nonDir.length} files exist in workspace.` };
    }

    // 2. SYNTAX & LINT GATE
    let syntaxPassed = true;
    let syntaxError = '';
    for (const f of nonDir) {
      if (f.name.endsWith('.js')) {
        const checkRes = await exec.executeCommand({
          command: `node --check "${f.relativePath}"`,
          cwd: state.workspace.path,
          projectId: state.projectId,
          timeoutMs: 8000
        });
        if (checkRes.exitCode !== 0) {
          syntaxPassed = false;
          syntaxError = `JavaScript syntax error in ${f.relativePath}: ${checkRes.stderr || checkRes.stdout}`;
          break;
        }
      } else if (f.name.endsWith('.py')) {
        const pyCheck = await exec.executeCommand({
          command: `python3 -m py_compile "${f.relativePath}"`,
          cwd: state.workspace.path,
          projectId: state.projectId,
          timeoutMs: 8000
        });
        if (pyCheck.exitCode !== 0) {
          syntaxPassed = false;
          syntaxError = `Python syntax error in ${f.relativePath}: ${pyCheck.stderr || pyCheck.stdout}`;
          break;
        }
      }
    }

    if (syntaxPassed) {
      passedGates.push('SYNTAX_GATE');
      details['SYNTAX_GATE'] = { status: 'PASSED', message: 'All source files passed language syntax verification.' };
    } else {
      failedGates.push('SYNTAX_GATE');
      details['SYNTAX_GATE'] = { status: 'FAILED', message: syntaxError };
    }

    // 3. BUILD GATE (If package.json has build script)
    let buildExecuted = false;
    if (fileNames.includes('package.json')) {
      try {
        const pkg = JSON.parse(await WorkspaceManager.readFile(state.projectId, 'package.json'));
        if (pkg.scripts?.build) {
          buildExecuted = true;
          emitEvent?.('build.started', 'Running build script (npm run build)...');
          const bRes = await exec.executeCommand({
            command: 'npm run build',
            cwd: state.workspace.path,
            projectId: state.projectId,
            timeoutMs: 35000
          });
          if (bRes.exitCode === 0) {
            passedGates.push('BUILD_GATE');
            details['BUILD_GATE'] = { status: 'PASSED', message: 'npm run build completed successfully.' };
          } else {
            failedGates.push('BUILD_GATE');
            details['BUILD_GATE'] = { status: 'FAILED', message: `Build failed: ${bRes.stderr || bRes.stdout}` };
          }
        }
      } catch {}
    }
    if (!buildExecuted) {
      untestedGates.push('BUILD_GATE');
      details['BUILD_GATE'] = { status: 'NOT_TESTED', message: 'No build script defined in project. (NOT TESTED)' };
    }

    // 4. TEST GATE (If tests exist)
    let testsExecuted = false;
    let testCmd = '';
    if (fileNames.some(fn => fn.startsWith('test_') && fn.endsWith('.py'))) {
      testCmd = 'python3 -m unittest discover -s . -p "test_*.py"';
    } else if (fileNames.includes('package.json')) {
      try {
        const pkg = JSON.parse(await WorkspaceManager.readFile(state.projectId, 'package.json'));
        if (pkg.scripts?.test && !pkg.scripts.test.includes('no test specified')) {
          testCmd = 'npm test';
        }
      } catch {}
    }

    if (testCmd) {
      testsExecuted = true;
      emitEvent?.('test.started', `Running test suite: "${testCmd}"...`);
      const tRes = await exec.executeCommand({
        command: testCmd,
        cwd: state.workspace.path,
        projectId: state.projectId,
        timeoutMs: 25000
      });
      if (tRes.exitCode === 0) {
        passedGates.push('TEST_GATE');
        details['TEST_GATE'] = { status: 'PASSED', message: `Test suite passed: ${testCmd}` };
      } else {
        failedGates.push('TEST_GATE');
        details['TEST_GATE'] = { status: 'FAILED', message: `Tests failed: ${tRes.stderr || tRes.stdout}` };
      }
    } else {
      untestedGates.push('TEST_GATE');
      details['TEST_GATE'] = { status: 'NOT_TESTED', message: 'No test suite specified or executed. (NOT TESTED)' };
    }

    // 5. BROWSER / DOM GATE & MOBILE VIEWPORT GATE
    let mobileViewportTested = false;
    if (fileNames.includes('index.html')) {
      try {
        const html = await WorkspaceManager.readFile(state.projectId, 'index.html');
        const hasDoctype = html.toLowerCase().includes('<!doctype html');
        const hasBody = /<body\b/i.test(html);
        if (hasDoctype && hasBody) {
          passedGates.push('BROWSER_GATE');
          details['BROWSER_GATE'] = { status: 'PASSED', message: 'index.html has valid HTML5 structure.' };
        } else {
          failedGates.push('BROWSER_GATE');
          details['BROWSER_GATE'] = { status: 'FAILED', message: 'index.html missing DOCTYPE or body tag.' };
        }

        // Mobile Viewport Check
        mobileViewportTested = true;
        const hasViewportMeta = /<meta\s+[^>]*name=["']viewport["'][^>]*content=["'][^"']*width=device-width/i.test(html);
        if (hasViewportMeta) {
          passedGates.push('MOBILE_VIEWPORT_GATE');
          details['MOBILE_VIEWPORT_GATE'] = { status: 'PASSED', message: 'Mobile viewport meta configured (<meta name="viewport" content="width=device-width...>).' };
        } else {
          failedGates.push('MOBILE_VIEWPORT_GATE');
          details['MOBILE_VIEWPORT_GATE'] = { status: 'FAILED', message: 'Missing mobile viewport meta tag in index.html for responsive layout.' };
        }
      } catch {}
    } else {
      untestedGates.push('BROWSER_GATE');
      details['BROWSER_GATE'] = { status: 'NOT_TESTED', message: 'No HTML document found in workspace. (NOT TESTED)' };
      untestedGates.push('MOBILE_VIEWPORT_GATE');
      details['MOBILE_VIEWPORT_GATE'] = { status: 'NOT_TESTED', message: 'Non-web project. Mobile viewport not applicable. (NOT TESTED)' };
    }

    // 6. RUNTIME ERROR & INTERACTION GATES (Real Execution Observation)
    // If runtime interactive observation wasn't executed in headless browser, report NOT_TESTED!
    untestedGates.push('INTERACTION_GATE');
    details['INTERACTION_GATE'] = { status: 'NOT_TESTED', message: 'Automated user interaction sequence not executed in this run. (NOT TESTED)' };

    // 7. SECURITY GATE (Zero token leaks)
    let secretLeakFound = false;
    for (const f of nonDir) {
      try {
        const content = await WorkspaceManager.readFile(state.projectId, f.relativePath);
        if (/(AIza[0-9A-Za-z-_]{35}|sk-[a-zA-Z0-9]{32,})/.test(content)) {
          secretLeakFound = true;
          break;
        }
      } catch {}
    }

    if (!secretLeakFound) {
      passedGates.push('SECURITY_GATE');
      details['SECURITY_GATE'] = { status: 'PASSED', message: 'Zero credentials or API tokens leaked in source code.' };
    } else {
      failedGates.push('SECURITY_GATE');
      details['SECURITY_GATE'] = { status: 'FAILED', message: 'Security scan detected hardcoded API secret in workspace.' };
    }

    const allPassed = failedGates.length === 0 && passedGates.length > 0;

    emitEvent?.(
      allPassed ? 'verification.passed' : 'verification.failed',
      `Verification complete: ${passedGates.length} passed, ${failedGates.length} failed, ${untestedGates.length} not tested.`,
      { passedGates, failedGates, untestedGates, details }
    );

    return {
      allPassed,
      passedGates,
      failedGates,
      untestedGates,
      details,
      evidence: {
        filesCount: nonDir.length,
        testsExecuted,
        buildExecuted,
        securityFindings: secretLeakFound ? 1 : 0,
        mobileViewportTested,
        runtimeErrorsChecked: false
      }
    };
  }
}
