import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { install, uninstall, installStatus } from '../plugins/stroppers/lib/install.mjs';
import { tempRepo, write } from './helpers.mjs';

const read = (repo, p) => readFileSync(join(repo, p), 'utf8');

test('install creates owned files and a gitignore block while preserving existing content', () => {
  const repo = tempRepo({ '.gitignore': 'node_modules/\n', 'AGENTS.md': '# Team rules\n' });
  const r = install(repo);
  assert.deepEqual(r.conflicts, []);
  assert.ok(r.created.includes('.stroppers/config.yaml'));
  assert.ok(read(repo, '.gitignore').startsWith('node_modules/\n'));
  assert.match(read(repo, '.gitignore'), /\.stroppers\/state\//);
  assert.equal(read(repo, 'AGENTS.md'), '# Team rules\n');
  assert.equal(existsSync(join(repo, '.claude/skills/stroppers/SKILL.md')), false, 'cloud entry is opt-in');
});

test('a second install is idempotent', () => {
  const repo = tempRepo();
  install(repo);
  const before = ['.gitignore', '.stroppers/README.md', '.stroppers/config.yaml'].map((p) => read(repo, p));
  const r = install(repo);
  assert.deepEqual(r.created, []);
  assert.deepEqual(r.updated, []);
  assert.deepEqual(['.gitignore', '.stroppers/README.md', '.stroppers/config.yaml'].map((p) => read(repo, p)), before);
});

test('operator edits to the repository config are never overwritten', () => {
  const repo = tempRepo();
  install(repo);
  write(repo, '.stroppers/config.yaml', 'version: 1\nlinear:\n  workspace: acme\n');
  install(repo);
  assert.equal(read(repo, '.stroppers/config.yaml'), 'version: 1\nlinear:\n  workspace: acme\n');
});

test('a modified managed file is reported as a conflict, not overwritten', () => {
  const repo = tempRepo();
  install(repo);
  write(repo, '.stroppers/README.md', 'our own notes\n');
  const r = install(repo);
  assert.ok(r.conflicts.some((c) => c.startsWith('.stroppers/README.md')));
  assert.equal(read(repo, '.stroppers/README.md'), 'our own notes\n');
});

test('a pre-existing file Stroppers did not create is left alone', () => {
  const repo = tempRepo({ '.claude/skills/stroppers/SKILL.md': 'someone else\n' });
  const r = install(repo, { cloudEntry: true });
  assert.ok(r.conflicts.some((c) => c.startsWith('.claude/skills/stroppers/SKILL.md')));
  assert.equal(read(repo, '.claude/skills/stroppers/SKILL.md'), 'someone else\n');
});

test('uninstall removes owned files and blocks but keeps shared documents and config', () => {
  const repo = tempRepo({ '.gitignore': 'node_modules/\n', 'CONSTRAINTS.md': '# Constraints\n', 'GLOSSARY.md': '# Glossary\n', 'docs/adr/0001-x.md': '# ADR\n', '.claude/skills/verify-app/SKILL.md': 'verify\n' });
  install(repo, { cloudEntry: true });
  const r = uninstall(repo);
  assert.equal(read(repo, '.gitignore'), 'node_modules/\n');
  for (const p of ['CONSTRAINTS.md', 'GLOSSARY.md', 'docs/adr/0001-x.md', '.claude/skills/verify-app/SKILL.md', '.stroppers/config.yaml']) assert.ok(existsSync(join(repo, p)), p);
  for (const p of ['.stroppers/README.md', '.claude/skills/stroppers', '.agents/skills/stroppers', '.stroppers/managed.json']) assert.equal(existsSync(join(repo, p)), false, p);
  assert.ok(r.kept.some((k) => k.startsWith('.stroppers/config.yaml')));
});

test('uninstall keeps a managed file the team modified', () => {
  const repo = tempRepo();
  install(repo);
  write(repo, '.stroppers/README.md', 'edited\n');
  const r = uninstall(repo);
  assert.equal(read(repo, '.stroppers/README.md'), 'edited\n');
  assert.ok(r.conflicts.length === 1);
});

test('update rewrites unmodified managed files and status reports their state', () => {
  const repo = tempRepo();
  install(repo, { version: '0.0.9' });
  assert.match(read(repo, '.stroppers/README.md'), /0\.0\.9/);
  install(repo, { version: '0.1.0' });
  assert.match(read(repo, '.stroppers/README.md'), /0\.1\.0/);
  const s = installStatus(repo);
  assert.equal(s.version, '0.1.0');
  assert.ok(s.items.every((i) => i.state !== 'missing'));
});

test('cloud entry is kept on update once installed', () => {
  const repo = tempRepo();
  install(repo, { cloudEntry: true });
  install(repo);
  assert.ok(existsSync(join(repo, '.agents/skills/stroppers/SKILL.md')));
});
