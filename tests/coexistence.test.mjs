import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CLI, isolatedEnv, tempRepo, write } from './helpers.mjs';

function snapshot(dir) {
  const out = {};
  const walk = (d) => {
    for (const e of readdirSync(d)) {
      const p = join(d, e);
      if (statSync(p).isDirectory()) walk(p);
      else out[p] = readFileSync(p, 'utf8');
    }
  };
  if (existsSync(dir)) walk(dir);
  return out;
}

const run = (repo, env, ...args) => spawnSync(process.execPath, [CLI, ...args, '--repo', repo], { env, encoding: 'utf8' });

const STANDALONE = {
  '.claude/skills/poteto-mode/SKILL.md': '---\nname: poteto-mode\n---\nstandalone pstack\n',
  '.agents/skills/grill-with-docs/SKILL.md': '---\nname: grill-with-docs\n---\nstandalone grill\n',
  '.claude/skills/verify-app/SKILL.md': '---\nname: verify-app\n---\ngenerated verification skill\n',
  'CONSTRAINTS.md': '# Constraints\n',
  'GLOSSARY.md': '# Glossary\n',
  'AGENTS.md': '# Team instructions\n',
  'CLAUDE.md': '@AGENTS.md\n',
};

test('install, update and uninstall write nothing outside the repository', () => {
  const env = isolatedEnv();
  const repo = tempRepo(STANDALONE);
  const before = snapshot(env.HOME);
  for (const cmd of [['install', '--cloud-entry'], ['update'], ['uninstall']]) assert.equal(run(repo, env, ...cmd).status, 0, cmd.join(' '));
  assert.deepEqual(snapshot(env.HOME), before);
});

test('standalone upstream skills, shared documents and team instructions survive install and uninstall unchanged', () => {
  const repo = tempRepo(STANDALONE);
  const env = isolatedEnv();
  const read = () => Object.fromEntries(Object.keys(STANDALONE).map((p) => [p, readFileSync(join(repo, p), 'utf8')]));
  const original = read();
  run(repo, env, 'install', '--cloud-entry');
  assert.deepEqual(read(), original, 'installed');
  run(repo, env, 'uninstall');
  assert.deepEqual(read(), original, 'uninstalled');
});

test('the cloud entry uses a cheque-only name and never replaces an upstream skill', () => {
  const repo = tempRepo(STANDALONE);
  run(repo, isolatedEnv(), 'install', '--cloud-entry');
  const names = execFileSync('git', ['ls-files', '--others', '--exclude-standard'], { cwd: repo, encoding: 'utf8' }).split('\n').filter((p) => p.endsWith('SKILL.md'));
  assert.deepEqual(names.sort(), ['.agents/skills/cheque/SKILL.md', '.claude/skills/cheque/SKILL.md']);
});

test('two developers with different private settings resolve different authority from the same repository', () => {
  const repo = tempRepo({ '.cheque/config.yaml': 'version: 1\nlinear:\n  workspace: acme\n  team: ENG\n' });
  const alice = isolatedEnv();
  const bob = isolatedEnv();
  write(alice.HOME, '.config/cheque/operator.yaml', 'authority:\n  owners:\n    - linear_user_id: alice-id\n  repositories:\n    - acme/app\n');
  write(bob.HOME, '.config/cheque/operator.yaml', 'harness:\n  default: codex\n');
  const explain = (env) => JSON.parse(run(repo, env, 'config', 'explain', '--json').stdout).effective;
  assert.deepEqual(explain(alice).authority.owners, [{ linear_user_id: 'alice-id' }]);
  assert.equal(explain(alice).harness.default, 'claude-code');
  assert.equal(explain(bob).authority, undefined);
  assert.equal(explain(bob).harness.default, 'codex');
  const bobBefore = snapshot(bob.HOME);
  run(repo, alice, 'install');
  assert.deepEqual(snapshot(bob.HOME), bobBefore, 'Alice installing does not touch Bob');
});

test('missing cheque configuration blocks only cheque commands', () => {
  const repo = tempRepo(STANDALONE);
  const r = run(repo, isolatedEnv(), 'doctor', '--json');
  assert.equal(r.status, 3);
  assert.ok(JSON.parse(r.stdout).blockers.some((b) => b.startsWith('linear.workspace')));
  assert.equal(readFileSync(join(repo, '.claude/skills/poteto-mode/SKILL.md'), 'utf8'), STANDALONE['.claude/skills/poteto-mode/SKILL.md']);
});

test('the session model map is written to ignored state, never to the global Pstack file', () => {
  const env = isolatedEnv();
  const repo = tempRepo();
  run(repo, env, 'install');
  const path = run(repo, env, 'models').stdout.trim();
  assert.equal(path, join(repo, '.cheque', 'state', 'pstack-models.md'));
  assert.equal(existsSync(join(env.HOME, '.agents', 'pstack-models.md')), false);
  assert.match(execFileSync('git', ['check-ignore', '.cheque/state/pstack-models.md'], { cwd: repo, encoding: 'utf8' }), /pstack-models/);
});

test('--implementer cannot contradict the harness running the session', () => {
  const repo = tempRepo();
  const r = run(repo, isolatedEnv({ CLAUDECODE: '1' }), 'review', 'select', '--implementer', 'codex');
  assert.equal(r.status, 1);
  assert.match(r.stderr, /contradicts/);
  const ok = run(repo, isolatedEnv({ CLAUDECODE: '1' }), 'review', 'select', '--available', 'claude-code,codex', '--json');
  assert.equal(JSON.parse(ok.stdout).harness, 'codex');
});
