import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { checkPublishable, checkArtifact, publishableSummary, assetName, renderIndex } from '../plugins/stroppers/lib/evidence.mjs';
import { runStatus, treeChanges } from '../plugins/stroppers/lib/playwright.mjs';
import { install, uninstall } from '../plugins/stroppers/lib/install.mjs';
import { tempDir, tempRepo, write } from './helpers.mjs';

test('publication refuses tokens, signed URLs and local paths', () => {
  assert.deepEqual(checkPublishable('see https://github.com/acme/app/releases/download/x/video.webm'), []);
  assert.ok(checkPublishable('token lin_api_abcdefghijklmnopqrstuvwxyz0123').length);
  assert.ok(checkPublishable('https://example.com/v.webm?X-Amz-Signature=abc').length);
  assert.ok(checkPublishable('saved to /Users/someone/run/video.webm').length);
});

test('only regular evidence files inside the run directory can be uploaded', () => {
  const run = tempDir();
  mkdirSync(join(run, 'test-results'));
  writeFileSync(join(run, 'test-results', 'video.webm'), 'v');
  assert.ok(checkArtifact(run, 'test-results/video.webm'));
  const outside = join(tempDir(), 'linear-agent-token.json');
  writeFileSync(outside, '{"token":"secret"}');
  symlinkSync(outside, join(run, 'link.json'));
  assert.throws(() => checkArtifact(run, 'link.json'), /not a regular file/);
  assert.throws(() => checkArtifact(run, `../${outside.split('/').slice(-2).join('/')}`), /./);
  writeFileSync(join(run, 'notes.txt'), 'x');
  assert.throws(() => checkArtifact(run, 'notes.txt'), /not an evidence file type/);
});

test('the published summary carries no local paths or logs and refuses secrets', () => {
  const record = { run_id: 'r', status: 'passed', revision: 'abc', executor: { os: 'linux' }, tests: [{ title: 't', status: 'passed', error: null, file: 'e2e/a.spec.js' }], output_dir: '/Users/x/run', videos: [] };
  const text = publishableSummary(record);
  assert.ok(!text.includes('/Users/'));
  assert.throws(() => publishableSummary({ ...record, tests: [{ title: 'leaked lin_api_abcdefghijklmnopqrstuvwxyz0123', status: 'failed' }] }), /not publishable/);
});

test('asset names are scoped to the run so runs never overwrite each other', () => {
  assert.notEqual(assetName('run-a', 'test-results/x/video.webm'), assetName('run-b', 'test-results/x/video.webm'));
});

test('the result index marks unverified results and never reads as a pass', () => {
  const md = renderIndex({ record: { run_id: 'r', status: 'unverified', revision: 'abc', worktree_clean: true, executor: { mode: 'local', os: 'x', browser: 'chromium' }, started_at: 'a', finished_at: 'b', tests: [] }, criteria: [{ id: 'AC1', criterion: 'c', method: 'browser', status: 'unverified', reason: 'environment' }] });
  assert.match(md, /`unverified`/);
  assert.match(md, /UNVERIFIED/);
});

test('a browser run passes only with a clean exit, a passing test, no failures and a committed tree', () => {
  const pass = [{ status: 'passed' }];
  assert.equal(runStatus({ code: 0, tests: pass, clean: true }).status, 'passed');
  assert.equal(runStatus({ code: 1, tests: pass, clean: true }).status, 'unverified', 'runner error');
  assert.equal(runStatus({ code: 0, tests: [{ status: 'not-applicable' }], clean: true }).status, 'unverified', 'all skipped');
  assert.equal(runStatus({ code: 0, tests: [], clean: true }).status, 'unverified', 'no results');
  assert.equal(runStatus({ code: 0, tests: pass, clean: false }).status, 'unverified', 'dirty tree');
  assert.equal(runStatus({ code: 1, tests: [{ status: 'failed' }], clean: true }).status, 'failed');
});

test('uninstall refuses a manifest that names files Stroppers never manages', () => {
  const repo = tempRepo({ 'README.md': 'keep\n' });
  install(repo);
  write(repo, '.stroppers/managed.json', JSON.stringify({ version: '0', items: [{ path: '../other/README.md', kind: 'file', sha256: 'x' }, { path: 'README.md', kind: 'block' }] }));
  assert.throws(() => uninstall(repo), /never manages/);
});

test('install and uninstall refuse a symlinked parent of a managed path', async () => {
  const { symlinkSync, mkdirSync: mk, writeFileSync: w, readFileSync: r } = await import('node:fs');
  const outside = tempDir();
  w(join(outside, 'SKILL.md'), 'external');
  const repo = tempRepo();
  install(repo, { cloudEntry: true });
  const { rmSync } = await import('node:fs');
  rmSync(join(repo, '.agents/skills/stroppers'), { recursive: true });
  symlinkSync(outside, join(repo, '.agents/skills/stroppers'));
  assert.throws(() => uninstall(repo), /symlink/);
  assert.equal(r(join(outside, 'SKILL.md'), 'utf8'), 'external');
});

test('untracked files make the tree unclean even when git hides them from status', async () => {
  const { git } = await import('./helpers.mjs');
  const repo = tempRepo({ 'a.js': '1\n' });
  git(repo, 'config', 'status.showUntrackedFiles', 'no');
  assert.equal(treeChanges(repo), '');
  write(repo, 'e2e/new.spec.js', 'test');
  assert.match(treeChanges(repo), /new\.spec\.js/);
});
