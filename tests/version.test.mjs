import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkVersion, MANIFEST } from '../scripts/check-version.mjs';
import { spawnSync } from 'node:child_process';
import { cpSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { git, tempDir, tempRepo, write } from './helpers.mjs';

const manifest = (version, name = 'cheque') => JSON.stringify({ name, version });

function repo() {
  const root = tempRepo({ [MANIFEST]: manifest('1.0.0'), 'plugins/cheque/lib/a.mjs': 'a\n', 'README.md': 'r\n' });
  return { root, base: git(root, 'rev-parse', 'HEAD') };
}

function commit(root, files) {
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '-m', 'change');
}

test('a docs-only change needs no new version', () => {
  const { root, base } = repo();
  commit(root, { 'README.md': 'r2\n' });
  assert.equal(checkVersion(root, base), null);
});

test('a change to the shipped plugin without a new version fails', () => {
  const { root, base } = repo();
  commit(root, { 'plugins/cheque/lib/a.mjs': 'b\n' });
  assert.match(checkVersion(root, base), /changed but the plugin version is still 1\.0\.0/);
});

test('a change to the shipped plugin with a higher version passes', () => {
  const { root, base } = repo();
  commit(root, { 'plugins/cheque/lib/a.mjs': 'b\n', [MANIFEST]: manifest('1.0.1') });
  assert.equal(checkVersion(root, base), null);
});

test('a renamed plugin must bump even when nothing else changed', () => {
  const { root, base } = repo();
  write(root, MANIFEST, manifest('1.0.0', 'other'));
  git(root, 'add', '-A');
  assert.match(checkVersion(root, base, { staged: true }), /renamed \(cheque → other\)/);
});

test('a version must go up and must not already be tagged', () => {
  const { root, base } = repo();
  commit(root, { [MANIFEST]: manifest('0.9.9') });
  assert.match(checkVersion(root, base), /must go up/);
  git(root, '-c', 'tag.gpgSign=false', 'tag', '-a', 'v1.1.0', '-m', 'v1.1.0', base);
  commit(root, { [MANIFEST]: manifest('1.1.0') });
  assert.match(checkVersion(root, base), /v1\.1\.0 is already tagged/);
});

test('a version that is not X.Y.Z fails', () => {
  const { root, base } = repo();
  commit(root, { [MANIFEST]: manifest('v1.0.1') });
  assert.match(checkVersion(root, base), /must be X\.Y\.Z/);
});

test('a base git cannot resolve fails instead of passing as unchanged', () => {
  const { root } = repo();
  assert.match(checkVersion(root, 'no-such-ref'), /could not diff against no-such-ref/);
});

test('the script runs from a checkout path with spaces', () => {
  const { root, base } = repo();
  commit(root, { 'plugins/cheque/lib/a.mjs': 'b\n' });
  // realpath: macOS temp dirs sit behind a symlink, which import.meta.url resolves.
  const dir = join(realpathSync(tempDir()), 'with space');
  cpSync(new URL('../scripts/check-version.mjs', import.meta.url).pathname, join(dir, 'check-version.mjs'));
  const run = spawnSync(process.execPath, [join(dir, 'check-version.mjs'), base], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /changed but the plugin version is still 1\.0\.0/);
});
