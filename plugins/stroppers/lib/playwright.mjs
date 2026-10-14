// In-session Playwright execution. Runs in whatever environment the workflow
// session is in (local machine or harness cloud VM); there is no routing to
// another machine. Each run gets its own output directory, port and browser
// profile, and a Playwright-managed browser separate from the operator's own.
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';
import { platform, release } from 'node:os';
import { join, relative } from 'node:path';
import { detectSession } from './session.mjs';

function npx(repoRoot, args, opts = {}) {
  return spawnSync('npx', ['--no-install', 'playwright', ...args], { cwd: repoRoot, encoding: 'utf8', timeout: opts.timeout ?? 120000, env: opts.env ?? process.env });
}

export function findPlaywrightConfig(repoRoot) {
  for (const name of ['playwright.config.ts', 'playwright.config.mts', 'playwright.config.js', 'playwright.config.mjs', 'playwright.config.cjs'])
    if (existsSync(join(repoRoot, name))) return name;
  return null;
}

// Classifies the environment before any assertion runs. A setup problem is an
// environment limitation, reported separately from product failures.
export function doctor(repoRoot, { browser = 'chromium' } = {}) {
  const report = { os: `${platform()} ${release()}`, browser, checks: [] };
  const config = findPlaywrightConfig(repoRoot);
  report.config = config;
  if (!config) return { ...report, status: 'not-applicable', reason: 'the repository has no Playwright configuration' };
  const version = npx(repoRoot, ['--version']);
  if (version.status !== 0) return { ...report, status: 'needs-setup', reason: 'Playwright is not installed in the repository; install its dependencies with the repository package manager', detail: version.stderr.trim() };
  report.playwright = version.stdout.trim().replace(/^Version /, '');
  const probe = launchProbe(repoRoot, browser);
  report.checks.push(probe);
  if (probe.ok) return { ...report, status: 'ready' };
  return { ...report, status: 'needs-setup', reason: probe.reason };
}

function launchProbe(repoRoot, browser) {
  const script = `const pw=require('playwright-core');(async()=>{const b=await pw.${browser}.launch({headless:true});const v=b.version();await b.close();console.log(v)})().catch(e=>{console.error(e.message);process.exit(1)})`;
  const r = spawnSync(process.execPath, ['-e', script], { cwd: repoRoot, encoding: 'utf8', timeout: 60000 });
  if (r.status === 0) return { name: 'launch', ok: true, browser_version: r.stdout.trim() };
  const msg = r.stderr || '';
  if (/Executable doesn't exist|browserType\.launch: .*install/i.test(msg)) return { name: 'launch', ok: false, reason: 'browser binaries are missing', missing: 'browsers' };
  if (/missing (system )?(dependencies|libraries)|error while loading shared libraries|Host system is missing/i.test(msg)) return { name: 'launch', ok: false, reason: 'system libraries are missing', missing: 'system-deps' };
  return { name: 'launch', ok: false, reason: msg.split('\n')[0] || 'browser failed to launch' };
}

// Installs what the doctor found missing, using Playwright's own installer for
// the repository's pinned version. Installation is pre-authorized; missing
// privileges are reported as an environment limitation, not retried as prompts.
export function prepare(repoRoot, { browser = 'chromium' } = {}) {
  const before = doctor(repoRoot, { browser });
  if (before.status !== 'needs-setup' || !before.playwright) return { ...before, commands: [] };
  const commands = [];
  const run = (args) => {
    const r = npx(repoRoot, args, { timeout: 900000 });
    commands.push({ command: `npx playwright ${args.join(' ')}`, exit: r.status, tail: `${r.stdout}${r.stderr}`.trim().split('\n').slice(-3).join('\n') });
    return r;
  };
  const withDeps = platform() === 'linux';
  const r = run(['install', ...(withDeps ? ['--with-deps'] : []), browser]);
  if (r.status !== 0) {
    const denied = /permission denied|are you root|sudo|EACCES|not permitted/i.test(`${r.stdout}${r.stderr}`);
    return { ...before, status: 'environment-limitation', reason: denied ? 'installing browser system dependencies needs privileges this session does not have; use a preconfigured image or the harness environment setup script' : 'Playwright installation failed', commands };
  }
  const after = doctor(repoRoot, { browser });
  return { ...after, commands };
}

export function freePort() {
  return new Promise((resolve, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

// Wrapper config: imports the repository's own Playwright config and overrides
// only what evidence and isolation need. The repository file is not modified.
export function wrapperConfig({ repoRoot, configFile, outputDir, port, browser, headless }) {
  const rel = relative(outputDir, join(repoRoot, configFile)).split('\\').join('/');
  return `// Generated by Stroppers for one verification run. Not committed.
import base from '${rel.startsWith('.') ? rel : `./${rel}`}';
const cfg = base?.default ?? base;
const port = ${port};
// Playwright resolves relative paths against the config file, which lives in
// the run directory; anchor them to the repository instead.
const root = ${JSON.stringify(repoRoot)};
const fromRoot = (p) => (p && !p.startsWith('/') ? root + '/' + p.replace(/^\\.\\//, '') : p || root);
const webServer = cfg.webServer
  ? [].concat(cfg.webServer).map((s) => ({ ...s, cwd: fromRoot(s.cwd || '.'), port: s.url ? undefined : port, url: s.url ? s.url.replace(/:\\d+/, ':' + port) : undefined, reuseExistingServer: false, env: { ...(s.env || {}), PORT: String(port) } }))
  : undefined;
const enforced = (use = {}) => ({
  ...use,
  ...(cfg.webServer ? { baseURL: 'http://127.0.0.1:' + port } : {}),
  headless: ${headless},
  video: 'on',
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  channel: undefined,
  launchOptions: { ...(use.launchOptions || {}), executablePath: undefined },
});
export default {
  ...cfg,
  testDir: fromRoot(cfg.testDir || '.'),
  outputDir: ${JSON.stringify(join(outputDir, 'test-results'))},
  reporter: [['json', { outputFile: ${JSON.stringify(join(outputDir, 'results.json'))} }], ['line']],
  webServer,
  use: { ...enforced(cfg.use), baseURL: cfg.webServer ? 'http://127.0.0.1:' + port : cfg.use?.baseURL },
  // Project settings would otherwise override the isolation and evidence settings.
  projects: (cfg.projects || [{ name: '${browser}' }])
    .filter((p) => !p.use?.browserName || p.use.browserName === '${browser}')
    .map((p) => ({ ...p, testDir: p.testDir ? fromRoot(p.testDir) : undefined, use: { ...enforced(p.use), baseURL: cfg.webServer ? 'http://127.0.0.1:' + port : p.use?.baseURL ?? cfg.use?.baseURL } })),
};
`;
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((e) => (statSync(join(dir, e)).isDirectory() ? walk(join(dir, e)) : [join(dir, e)]));
}

export function summarizeResults(resultsPath) {
  if (!existsSync(resultsPath)) return { tests: [], stats: null };
  const report = JSON.parse(readFileSync(resultsPath, 'utf8'));
  const tests = [];
  const visit = (suite, prefix = []) => {
    for (const spec of suite.specs || [])
      for (const t of spec.tests || []) {
        const last = t.results?.at(-1) || {};
        tests.push({ title: [...prefix, spec.title].filter(Boolean).join(' › '), status: last.status === 'passed' ? 'passed' : last.status === 'skipped' ? 'not-applicable' : 'failed', error: last.error?.message?.split('\n')[0] || null, file: spec.file });
      }
    for (const child of suite.suites || []) visit(child, [...prefix, suite.title]);
  };
  for (const s of report.suites || []) visit(s);
  return { tests, stats: report.stats || null };
}

// Uncommitted changes, including untracked files whatever status.showUntrackedFiles says.
export function treeChanges(repoRoot) {
  return execFileSync('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

// A run passes only when the runner exited cleanly, at least one test passed,
// none failed, and the result is bound to a committed revision.
export function runStatus({ code, tests, clean }) {
  if (tests.some((t) => t.status === 'failed')) return { status: 'failed', reason: 'one or more browser assertions failed' };
  if (!tests.some((t) => t.status === 'passed')) return { status: 'unverified', reason: tests.length ? 'every test was skipped' : `no test results (exit ${code}); see run.log` };
  if (code !== 0) return { status: 'unverified', reason: `Playwright exited ${code} although no assertion failed (setup, teardown or runner error); see run.log` };
  if (!clean) return { status: 'unverified', reason: 'the working tree had uncommitted changes, so the result is not bound to a commit' };
  return { status: 'passed', reason: null };
}

// Local continuation: stop process groups left by runs that never finished
// (no record.json), and only those this checkout started.
export function cleanupAbandoned(artifactsRoot) {
  const cleaned = [];
  if (!existsSync(artifactsRoot)) return cleaned;
  for (const run of readdirSync(artifactsRoot)) {
    const dir = join(artifactsRoot, run);
    const marker = join(dir, 'running.json');
    if (!existsSync(marker) || existsSync(join(dir, 'record.json'))) continue;
    const { pgid } = JSON.parse(readFileSync(marker, 'utf8'));
    try {
      process.kill(-pgid, 'SIGTERM');
    } catch {}
    writeFileSync(join(dir, 'record.json'), JSON.stringify({ run_id: run, status: 'unverified', reason: 'run was interrupted and cleaned up on continuation; rerun it' }, null, 2));
    cleaned.push(run);
  }
  return cleaned;
}

export async function runBrowserVerification({ repoRoot, runId, browser = 'chromium', headless = true, maxMinutes = 20, grep = null, artifactsRoot }) {
  const configFile = findPlaywrightConfig(repoRoot);
  if (!configFile) return { status: 'not-applicable', reason: 'no Playwright configuration in the repository' };
  const ready = doctor(repoRoot, { browser });
  if (ready.status !== 'ready') return { status: 'unverified', reason: `environment: ${ready.reason}`, environment: ready };
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  // Untracked, non-ignored files count: Playwright could run or serve them.
  const treeState = () => treeChanges(repoRoot);
  const dirty = treeState();
  const outputDir = join(artifactsRoot, runId);
  mkdirSync(outputDir, { recursive: true });
  const port = await freePort();
  const wrapper = join(outputDir, 'stroppers.playwright.config.mjs');
  writeFileSync(wrapper, wrapperConfig({ repoRoot, configFile, outputDir, port, browser, headless }));
  const args = ['--no-install', 'playwright', 'test', '--config', wrapper, ...(grep ? ['--grep', grep] : [])];
  const started = new Date();
  const code = await new Promise((resolve) => {
    const child = spawn('npx', args, { cwd: repoRoot, env: { ...process.env, PORT: String(port), STROPPERS_RUN_ID: runId, CI: '1' }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    let log = '';
    writeFileSync(join(outputDir, 'running.json'), JSON.stringify({ pgid: child.pid, started_at: new Date().toISOString() }));
    child.stdout.on('data', (d) => (log += d));
    child.stderr.on('data', (d) => (log += d));
    const timer = setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {}
    }, maxMinutes * 60000);
    child.on('close', (c) => {
      clearTimeout(timer);
      writeFileSync(join(outputDir, 'run.log'), log);
      // Stop only what this run started: its own process group.
      try {
        process.kill(-child.pid, 'SIGTERM');
      } catch {}
      resolve(c);
    });
  });
  const { tests, stats } = summarizeResults(join(outputDir, 'results.json'));
  const videos = walk(join(outputDir, 'test-results')).filter((f) => f.endsWith('.webm'));
  const traces = walk(join(outputDir, 'test-results')).filter((f) => f.endsWith('.zip'));
  const after = treeState();
  const sameRevision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim() === revision;
  const { status, reason } = runStatus({ code, tests, clean: dirty === '' && after === '' && sameRevision });
  const record = {
    run_id: runId,
    status,
    reason,
    revision,
    worktree_clean: dirty === '',
    executor: { os: ready.os, browser, browser_version: ready.checks[0]?.browser_version, playwright: ready.playwright, headless, harness: detectSession().harness, mode: detectSession().mode },
    port,
    started_at: started.toISOString(),
    finished_at: new Date().toISOString(),
    exit_code: code,
    tests,
    stats,
    videos: videos.map((v) => relative(outputDir, v)),
    traces: traces.map((t) => relative(outputDir, t)),
    output_dir: outputDir,
  };
  writeFileSync(join(outputDir, 'record.json'), JSON.stringify(record, null, 2));
  return record;
}
