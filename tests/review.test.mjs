import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { selectReviewer, harnessForStep, fallbackAllowed } from '../plugins/stroppers/lib/harness.mjs';
import { runReview, reviewCurrent, validateFindings } from '../plugins/stroppers/lib/review.mjs';
import { reviewerEnv, classifyFailure } from '../plugins/stroppers/lib/adapters.mjs';
import { git, tempDir, tempRepo, write } from './helpers.mjs';

const base = (over = {}) => ({
  harness: { default: 'claude-code', review: { policy: 'different-harness', preferences: ['claude-code', 'codex'] }, fallback: { enabled: false }, ...over.harness },
  adapters: { 'claude-code': { enabled: true }, codex: { enabled: true }, ...over.adapters },
});

test('different-harness policy picks Codex for a Claude implementation and Claude for a Codex one', () => {
  assert.equal(selectReviewer({ config: base(), implementer: 'claude-code' }).harness, 'codex');
  assert.equal(selectReviewer({ config: base(), implementer: 'codex' }).harness, 'claude-code');
});

test('selection follows the actual implementer, not the global default', () => {
  const config = base({ harness: { steps: { implement: 'codex' } } });
  assert.equal(harnessForStep(config, 'implement'), 'codex');
  assert.equal(selectReviewer({ config, implementer: harnessForStep(config, 'implement') }).harness, 'claude-code');
});

test('explicit reviewer override wins and survives a change of global default', () => {
  const config = base({ harness: { default: 'codex', review: { policy: 'different-harness', reviewer: 'codex', preferences: [] } } });
  const r = selectReviewer({ config, implementer: 'claude-code' });
  assert.equal(r.harness, 'codex');
  assert.equal(r.reason, 'explicit reviewer override');
});

test('missing reviewer blocks instead of falling back to the implementer', () => {
  const r = selectReviewer({ config: base(), implementer: 'claude-code', available: ['claude-code'] });
  assert.equal(r.blocked, true);
  assert.match(r.reason, /no different-harness reviewer is available/);
});

test('same-harness review only happens when configured explicitly', () => {
  const config = base({ harness: { review: { policy: 'same-harness' } } });
  assert.equal(selectReviewer({ config, implementer: 'codex' }).harness, 'codex');
  const override = base({ harness: { review: { policy: 'different-harness', reviewer: 'claude-code' } } });
  assert.equal(selectReviewer({ config: override, implementer: 'claude-code' }).blocked, true);
});

test('a third registered harness is selected deterministically by preference and never the implementer', () => {
  const config = base({ harness: { review: { policy: 'different-harness', preferences: ['third', 'codex', 'claude-code'] } }, adapters: { third: { enabled: true, command: ['true'], fake: true } } });
  assert.equal(selectReviewer({ config, implementer: 'claude-code' }).harness, 'third');
  assert.equal(selectReviewer({ config, implementer: 'third' }).harness, 'codex');
  config.adapters.third.enabled = false;
  assert.equal(selectReviewer({ config, implementer: 'claude-code' }).harness, 'codex');
});

test('subscription fallback is opt-in globally or per step', () => {
  assert.equal(fallbackAllowed(base(), 'review'), false);
  assert.equal(fallbackAllowed(base({ harness: { fallback: { enabled: true, steps: ['implement'] } } }), 'review'), false);
  assert.equal(fallbackAllowed(base({ harness: { fallback: { enabled: true, steps: [] } } }), 'review'), true);
});

test('reviewer environment strips API-billing keys and marks the reviewer role', () => {
  const env = reviewerEnv({ ANTHROPIC_API_KEY: 'x', OPENAI_API_KEY: 'y', CODEX_API_KEY: 'z', ANTHROPIC_AUTH_TOKEN: 'w', PATH: '/bin' });
  assert.deepEqual(Object.keys(env).sort(), ['PATH', 'STROPPERS_ROLE']);
  assert.equal(env.STROPPERS_ROLE, 'reviewer');
});

test('failure text is classified as exhaustion, auth failure or error', () => {
  assert.equal(classifyFailure("You've hit your usage limit. Try again later."), 'exhausted');
  assert.equal(classifyFailure('Error: 429 Too Many Requests'), 'exhausted');
  assert.equal(classifyFailure('Not logged in. Please run /login'), 'auth-failed');
  assert.equal(classifyFailure('segfault'), 'error');
});

test('approve verdict with a high finding fails validation', () => {
  const f = { severity: 'high', title: 't', body: 'b', file: 'a.js', line_start: 1, line_end: 1, confidence: 1, recommendation: 'r', scenario: 's', evidence: 'e' };
  assert.deepEqual(validateFindings({ verdict: 'approve', summary: 's', findings: [f], next_steps: [] }), ['approve verdict with critical/high findings']);
  assert.ok(validateFindings({ verdict: 'needs-attention', summary: 's', findings: [{ ...f, evidence: '' }], next_steps: [] }).includes('findings[0].evidence'));
});

// Fake reviewer CLIs exercise the real runner: worktree, prompt, timeout and output handling.
function fakeReviewer(dir, name, body) {
  const p = write(dir, `${name}.sh`, `#!/bin/sh\n${body}\n`);
  chmodSync(p, 0o755);
  return p;
}

function fixture() {
  const repo = tempRepo({ 'a.js': 'export const a = 1;\n' });
  const baseSha = git(repo, 'rev-parse', 'HEAD');
  write(repo, 'a.js', 'export const a = 2;\n');
  git(repo, 'commit', '-qam', 'change');
  return { repo, baseSha, headSha: git(repo, 'rev-parse', 'HEAD') };
}

async function review(script, over = {}) {
  const { repo, baseSha, headSha } = fixture();
  const bin = tempDir();
  const cmd = fakeReviewer(bin, 'third', script);
  const config = base({ adapters: { third: { enabled: true, command: [cmd], fake: true } } });
  const result = await runReview({ repoRoot: repo, config, reviewer: 'third', implementer: 'claude-code', base: baseSha, head: headSha, contract: { outcome: 'a is 2', acceptance_criteria: ['a equals 2'] }, stateDir: join(repo, '.stroppers', 'state'), env: { PATH: process.env.PATH, ...over.env }, timeoutMs: over.timeoutMs });
  return { result, repo, headSha };
}

const finding = '{"severity":"medium","title":"t","body":"b","file":"a.js","line_start":1,"line_end":1,"confidence":0.8,"recommendation":"r","scenario":"s","evidence":"e"}';

test('findings from a reviewer are recorded with head identity and raw output', async () => {
  const { result, headSha } = await review(`pwd > "$STROPPERS_REVIEW_OUTPUT.cwd"; cat > /dev/null; echo '{"verdict":"needs-attention","summary":"s","findings":[${finding}],"next_steps":[]}' > "$STROPPERS_REVIEW_OUTPUT"`);
  assert.equal(result.status, 'findings');
  assert.equal(result.head, headSha);
  assert.equal(result.findings[0].disposition, null);
  assert.ok(readFileSync(join(result.record_path, '..', 'prompt.md'), 'utf8').includes('"a equals 2"'));
  assert.notEqual(readFileSync(join(result.record_path, '..', 'reviewer-output.json.cwd'), 'utf8').trim(), '', 'ran in a worktree');
});

test('a reviewer timeout is recorded as timeout, not as a clean review', async () => {
  const { result } = await review('sleep 30', { timeoutMs: 500 });
  assert.equal(result.status, 'timeout');
  assert.deepEqual(result.findings, []);
});

test('quota exhaustion and auth failure are distinguished', async () => {
  assert.equal((await review('echo "You have reached your usage limit" >&2; exit 1')).result.status, 'exhausted');
  assert.equal((await review('echo "Not logged in" >&2; exit 1')).result.status, 'auth-failed');
});

test('a delegated reviewer cannot start another review', async () => {
  const { result } = await review('exit 0', { env: { STROPPERS_ROLE: 'reviewer' } });
  assert.equal(result.status, 'refused');
});

test('a review is current only for the head it reviewed', async () => {
  const { result, headSha } = await review(`cat > /dev/null; echo '{"verdict":"approve","summary":"ok","findings":[],"next_steps":[]}' > "$STROPPERS_REVIEW_OUTPUT"`);
  assert.equal(result.status, 'clean');
  assert.equal(reviewCurrent(result, headSha), true);
  assert.equal(reviewCurrent(result, 'f'.repeat(40)), false);
});
