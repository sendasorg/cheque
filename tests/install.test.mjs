import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { install, uninstall, installStatus, PACKAGE_VERSION } from '../plugins/cheque/lib/install.mjs';
import { git, tempDir, tempRepo, write } from './helpers.mjs';

const read = (repo, p) => readFileSync(join(repo, p), 'utf8');

test('install creates owned files and a gitignore block while preserving existing content', () => {
  const repo = tempRepo({ '.gitignore': 'node_modules/\n', 'AGENTS.md': '# Team rules\n' });
  const r = install(repo);
  assert.deepEqual(r.conflicts, []);
  assert.ok(r.created.includes('.cheque/config.yaml'));
  assert.ok(read(repo, '.gitignore').startsWith('node_modules/\n'));
  assert.match(read(repo, '.gitignore'), /\.cheque\/state\//);
  assert.equal(read(repo, 'AGENTS.md'), '# Team rules\n');
  assert.equal(existsSync(join(repo, '.claude/skills/cheque/SKILL.md')), false, 'cloud entry is opt-in');
});

test('a second install is idempotent', () => {
  const repo = tempRepo();
  install(repo);
  const before = ['.gitignore', '.cheque/README.md', '.cheque/config.yaml'].map((p) => read(repo, p));
  const r = install(repo);
  assert.deepEqual(r.created, []);
  assert.deepEqual(r.updated, []);
  assert.deepEqual(['.gitignore', '.cheque/README.md', '.cheque/config.yaml'].map((p) => read(repo, p)), before);
});

test('operator edits to the repository config are never overwritten', () => {
  const repo = tempRepo();
  install(repo);
  write(repo, '.cheque/config.yaml', 'version: 1\nlinear:\n  workspace: acme\n');
  install(repo);
  assert.equal(read(repo, '.cheque/config.yaml'), 'version: 1\nlinear:\n  workspace: acme\n');
});

test('a modified managed file is reported as a conflict, not overwritten', () => {
  const repo = tempRepo();
  install(repo);
  write(repo, '.cheque/README.md', 'our own notes\n');
  const r = install(repo);
  assert.ok(r.conflicts.some((c) => c.startsWith('.cheque/README.md')));
  assert.equal(read(repo, '.cheque/README.md'), 'our own notes\n');
});

test('a pre-existing file cheque did not create is left alone', () => {
  const repo = tempRepo({ '.claude/skills/cheque/SKILL.md': 'someone else\n' });
  const r = install(repo, { cloudEntry: true });
  assert.ok(r.conflicts.some((c) => c.startsWith('.claude/skills/cheque/SKILL.md')));
  assert.equal(read(repo, '.claude/skills/cheque/SKILL.md'), 'someone else\n');
});

test('uninstall removes owned files and blocks but keeps shared documents and config', () => {
  const repo = tempRepo({ '.gitignore': 'node_modules/\n', 'CONSTRAINTS.md': '# Constraints\n', 'GLOSSARY.md': '# Glossary\n', 'docs/adr/0001-x.md': '# ADR\n', '.claude/skills/verify-app/SKILL.md': 'verify\n' });
  install(repo, { cloudEntry: true });
  const r = uninstall(repo);
  assert.equal(read(repo, '.gitignore'), 'node_modules/\n');
  for (const p of ['CONSTRAINTS.md', 'GLOSSARY.md', 'docs/adr/0001-x.md', '.claude/skills/verify-app/SKILL.md', '.cheque/config.yaml']) assert.ok(existsSync(join(repo, p)), p);
  for (const p of ['.cheque/README.md', '.claude/skills/cheque', '.agents/skills/cheque', '.cheque/managed.json']) assert.equal(existsSync(join(repo, p)), false, p);
  assert.ok(r.kept.some((k) => k.startsWith('.cheque/config.yaml')));
});

test('uninstall keeps a managed file the team modified', () => {
  const repo = tempRepo();
  install(repo);
  write(repo, '.cheque/README.md', 'edited\n');
  const r = uninstall(repo);
  assert.equal(read(repo, '.cheque/README.md'), 'edited\n');
  assert.ok(r.conflicts.length === 1);
});

test('update rewrites unmodified managed files and status reports their state', () => {
  const repo = tempRepo();
  install(repo, { version: '0.0.9' });
  assert.match(read(repo, '.cheque/README.md'), /0\.0\.9/);
  install(repo, { version: '0.1.0' });
  assert.match(read(repo, '.cheque/README.md'), /0\.1\.0/);
  const s = installStatus(repo);
  assert.equal(s.version, '0.1.0');
  assert.ok(s.items.every((i) => i.state !== 'missing'));
});

test('cloud entry is kept on update once installed', () => {
  const repo = tempRepo();
  install(repo, { cloudEntry: true });
  install(repo);
  assert.ok(existsSync(join(repo, '.agents/skills/cheque/SKILL.md')));
});

// Runs the cloud entry's setup snippet in a repository whose parent directory
// may hold an attached cheque checkout, and returns the CHEQUE_HOME it chose.
function cloudEntryHome({ attached, cached, envHome, attachedSkill = true, ref = null }) {
  const parent = realpathSync(tempDir('cheque-cloud-'));
  const repo = join(parent, 'app');
  mkdirSync(repo);
  git(repo, 'init', '-q', '-b', 'main');
  install(repo, { cloudEntry: true, ref });
  const snippet = read(repo, '.claude/skills/cheque/SKILL.md').match(/```sh\n([\s\S]*?)```/)[1];
  const home = join(parent, 'home');
  const cacheDir = read(repo, '.claude/skills/cheque/SKILL.md').match(/\.cache\/cheque\/([^"]+)"/)[1];
  const checkout = (dir, version, { skill = true } = {}) => {
    write(dir, 'plugins/cheque/.claude-plugin/plugin.json', `{\n  "name": "cheque",\n  "version": "${version}"\n}\n`);
    if (skill) write(dir, 'plugins/cheque/skills/deliver/SKILL.md', 'deliver\n');
  };
  if (attached) checkout(join(parent, 'cheque'), attached, { skill: attachedSkill });
  if (cached) checkout(join(home, '.cache/cheque', cacheDir), cached);
  const env = { PATH: process.env.PATH, HOME: home, ...(envHome ? { CHEQUE_HOME: join(parent, 'cheque') } : {}) };
  return execFileSync('bash', ['-c', `${snippet}\necho "$CHEQUE_HOME"`], { cwd: repo, env, encoding: 'utf8' }).trim().split('\n').pop().replace(parent, '<parent>');
}

test('cloud entry uses an attached checkout only when it is the pinned version', () => {
  assert.equal(cloudEntryHome({ attached: PACKAGE_VERSION }), '<parent>/app/../cheque');
  assert.equal(cloudEntryHome({ attached: '0.0.1', cached: PACKAGE_VERSION }), `<parent>/home/.cache/cheque/v${PACKAGE_VERSION}`);
  assert.equal(cloudEntryHome({ attached: '0.0.1', cached: PACKAGE_VERSION, envHome: true }), `<parent>/home/.cache/cheque/v${PACKAGE_VERSION}`);
  assert.equal(cloudEntryHome({ attached: PACKAGE_VERSION, attachedSkill: false, cached: PACKAGE_VERSION }), `<parent>/home/.cache/cheque/v${PACKAGE_VERSION}`);
});

test('cloud entry pinned to a custom ref ignores other checkouts of the same version', () => {
  const home = cloudEntryHome({ ref: 'release/next', attached: PACKAGE_VERSION, envHome: true, cached: PACKAGE_VERSION });
  assert.match(home, new RegExp(`^<parent>/home/\\.cache/cheque/v${PACKAGE_VERSION.replaceAll('.', '\\.')}-[0-9a-f]{12}$`));
});

test('install refuses a ref that is not plain git ref characters', () => {
  for (const ref of ['v1;touch x', "a'b", '-x', 'a..b', 'a b', 'a@{1}', 'x.lock', '.candidate', 'release/.candidate', 'a.lock/b']) assert.throws(() => install(tempRepo(), { cloudEntry: true, ref }), /invalid ref/, ref);
  for (const ref of ['release@candidate', 'a=b', '$(id)']) assert.doesNotThrow(() => install(tempRepo(), { cloudEntry: true, ref }), ref);
  assert.throws(() => install(tempRepo(), { ref: 'v0.0.1' }), /different release/);
  const repo = tempRepo();
  install(repo, { cloudEntry: true, ref: 'release/0.2+build.1' });
  const entry = read(repo, '.claude/skills/cheque/SKILL.md');
  assert.match(entry, /--branch 'release\/0\.2\+build\.1' /);
  const cacheOf = (ref) => {
    const r = tempRepo();
    install(r, { cloudEntry: true, ref });
    return read(r, '.claude/skills/cheque/SKILL.md').match(/\.cache\/cheque\/([^"]+)"/)[1];
  };
  const caches = ['release/a+b', 'release/a_b', 'release/a/b'].map(cacheOf);
  assert.equal(new Set([...caches, cacheOf(null)]).size, 4, 'each ref gets its own cache directory');
});

test('a release tag recorded by an earlier install follows the package version', () => {
  const repo = tempRepo();
  install(repo, { cloudEntry: true, version: '0.1.0', ref: 'v0.1.0' });
  install(repo);
  assert.match(read(repo, '.claude/skills/cheque/SKILL.md'), new RegExp(`--branch 'v${PACKAGE_VERSION.replaceAll('.', '\\.')}' `));
  assert.equal(JSON.parse(read(repo, '.cheque/managed.json')).ref, null);
  install(repo, { ref: 'main' });
  install(repo);
  assert.equal(JSON.parse(read(repo, '.cheque/managed.json')).ref, 'main', 'a custom ref is kept');
});

test('cloud entry setup fails when the pinned version is not available', () => {
  const parent = realpathSync(tempDir('cheque-cloud-'));
  const repo = join(parent, 'app');
  mkdirSync(repo);
  git(repo, 'init', '-q', '-b', 'main');
  install(repo, { cloudEntry: true });
  const snippet = read(repo, '.claude/skills/cheque/SKILL.md').match(/```sh\n([\s\S]*?)```/)[1];
  // A git that refuses to clone stands in for a session without network access.
  const bin = join(parent, 'bin');
  write(bin, 'git', `#!/bin/sh\n[ "$1" = clone ] && exit 128\nexec ${execFileSync('which', ['git'], { encoding: 'utf8' }).trim()} "$@"\n`);
  execFileSync('chmod', ['+x', join(bin, 'git')]);
  assert.throws(() => execFileSync('bash', ['-c', snippet], { cwd: repo, env: { PATH: `${bin}:${process.env.PATH}`, HOME: join(parent, 'home') }, stdio: 'pipe' }), /is not available/);
});

test('cloud entry clones only the pinned ref', () => {
  const repo = tempRepo();
  install(repo, { cloudEntry: true });
  const entry = read(repo, '.claude/skills/cheque/SKILL.md');
  assert.doesNotMatch(entry, /CHEQUE_REF/);
  assert.match(entry, new RegExp(`git clone --depth 1 --branch 'v${PACKAGE_VERSION.replaceAll('.', '\\.')}' `));
});

test('generated README names a command the helper accepts', () => {
  const repo = tempRepo();
  install(repo);
  const readme = read(repo, '.cheque/README.md');
  assert.doesNotMatch(readme, /cheque status`/);
  assert.match(readme, /bin\/cheque checkpoint show/);
});
