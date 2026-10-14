import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { join } from 'node:path';
import { triggersFor } from '../plugins/stroppers/lib/triggers.mjs';
import { runFloorGuard, extractGuard } from '../plugins/stroppers/lib/floor.mjs';
import { git, tempRepo, write } from './helpers.mjs';

function change(files, deletions = []) {
  const repo = tempRepo({ 'README.md': '# app\n', 'src/math.js': 'export const add = (a, b) => a + b;\n', 'src/math.test.js': "import { add } from './math.js';\ntest('adds', () => { expect(add(1, 2)).toBe(3); expect(add(0, 0)).toBe(0); });\n" });
  const base = git(repo, 'rev-parse', 'HEAD');
  for (const [p, c] of Object.entries(files)) write(repo, p, c);
  for (const p of deletions) rmSync(join(repo, p));
  git(repo, 'add', '-A');
  git(repo, 'commit', '-qm', 'change');
  return { repo, base };
}

test('a simple internal change triggers only the quality contract and release readiness', () => {
  const { repo, base } = change({ 'src/math.js': 'export const add = (a, b) => a + b;\nexport const sub = (a, b) => a - b;\n' });
  const s = triggersFor(repo, base).specialists;
  assert.equal(s.security.applicable, false);
  assert.equal(s.observability.applicable, false);
  assert.equal(s.browser.applicable, false);
  assert.equal(s.release.applicable, true);
  assert.equal(s.quality_contract.applicable, true);
});

test('a docs-only change needs no security, observability, release or browser work', () => {
  const { repo, base } = change({ 'docs/guide.md': '# Guide\n' });
  const s = triggersFor(repo, base).specialists;
  for (const k of ['security', 'observability', 'release', 'browser']) assert.equal(s[k].applicable, false, k);
  assert.match(s.release.reason, /artifact acceptance/);
});

test('webhook and auth changes trigger the security assessment with reasons', () => {
  const { repo, base } = change({ 'src/webhooks/stripe.js': "import crypto from 'node:crypto';\nexport function handle(req) { return crypto.createHmac('sha256', process.env.STRIPE_SECRET).update(req.body).digest('hex'); }\n" });
  const s = triggersFor(repo, base).specialists;
  assert.equal(s.security.applicable, true);
  assert.ok(s.security.signals.some((x) => x.includes('src/webhooks/stripe.js')));
});

test('a dependency addition triggers security review', () => {
  const { repo, base } = change({ 'package.json': '{"dependencies":{"left-pad":"1.3.0"}}\n' });
  assert.ok(triggersFor(repo, base).specialists.security.signals.some((x) => x.includes('dependency change')));
});

test('a background job triggers observability', () => {
  const { repo, base } = change({ 'src/jobs/nightly-sync.js': 'export function schedule(queue) { queue.enqueue("sync", { retry: 3 }); }\n' });
  const s = triggersFor(repo, base).specialists;
  assert.equal(s.observability.applicable, true);
});

test('a UI component makes browser verification applicable', () => {
  const { repo, base } = change({ 'src/components/Price.tsx': 'export const Price = ({ v }) => <span>{v}</span>;\n' });
  assert.equal(triggersFor(repo, base).specialists.browser.applicable, true);
});

test('floor guard extraction comes from the vendored upstream reference', () => {
  assert.match(extractGuard(), /floor-guard\.mjs/);
});

test('removing an assertion from a kept test is a floor violation', () => {
  const { repo, base } = change({ 'src/math.test.js': "import { add } from './math.js';\ntest('adds', () => { expect(add(1, 2)).toBe(3); });\n" });
  const r = runFloorGuard({ repoRoot: repo, base });
  assert.equal(r.status, 'failed', r.output);
});

test('deleting a test file is a floor violation', () => {
  const { repo, base } = change({}, ['src/math.test.js']);
  assert.equal(runFloorGuard({ repoRoot: repo, base }).status, 'failed');
});

test('skipping a test is a floor violation', () => {
  const { repo, base } = change({ 'src/math.test.js': "import { add } from './math.js';\ntest.skip('adds', () => { expect(add(1, 2)).toBe(3); expect(add(0, 0)).toBe(0); });\n" });
  assert.equal(runFloorGuard({ repoRoot: repo, base }).status, 'failed');
});

test('loosening a CONSTRAINTS.md threshold is detected', () => {
  const repo = tempRepo({ 'CONSTRAINTS.md': '# Constraints\n\n## Enforced with numbers\n\n| Dimension | Rule | Checked by | Runs at |\n| --- | --- | --- | --- |\n| Coverage | line coverage at least 80% | npm run coverage | CI |\n' });
  const base = git(repo, 'rev-parse', 'HEAD');
  write(repo, 'CONSTRAINTS.md', '# Constraints\n\n## Enforced with numbers\n\n| Dimension | Rule | Checked by | Runs at |\n| --- | --- | --- | --- |\n| Coverage | line coverage at least 60% | npm run coverage | CI |\n');
  git(repo, 'commit', '-qam', 'loosen');
  assert.equal(runFloorGuard({ repoRoot: repo, base }).status, 'failed');
});

test('a clean change passes and an unusable base is unverified, not passing', () => {
  const { repo, base } = change({ 'src/math.js': 'export const add = (a, b) => b + a;\n' });
  assert.equal(runFloorGuard({ repoRoot: repo, base }).status, 'passed');
  assert.equal(runFloorGuard({ repoRoot: repo, base: 'does-not-exist' }).status, 'unverified');
});
