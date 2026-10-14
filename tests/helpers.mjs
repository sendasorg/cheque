import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const PLUGIN = new URL('../plugins/cheque/', import.meta.url).pathname;
export const CLI = join(PLUGIN, 'bin', 'cheque');

export function tempDir(prefix = 'cheque-test-') {
  return mkdtempSync(join(tmpdir(), prefix));
}

export function write(root, rel, content) {
  const p = join(root, rel);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
}

export function git(cwd, ...args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' },
  }).trim();
}

export function tempRepo(files = {}) {
  const root = tempDir('cheque-repo-');
  git(root, 'init', '-q', '-b', 'main');
  for (const [rel, content] of Object.entries(files)) write(root, rel, content);
  git(root, 'add', '-A');
  git(root, 'commit', '-q', '--allow-empty', '-m', 'init');
  return root;
}

// Environment with no operator config and no harness credentials leaking in.
export function isolatedEnv(extra = {}) {
  const home = tempDir('cheque-home-');
  return { PATH: process.env.PATH, HOME: home, XDG_CONFIG_HOME: join(home, '.config'), ...extra };
}
