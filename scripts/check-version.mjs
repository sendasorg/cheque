#!/usr/bin/env node
// Checks that a change to what ships goes out under a new plugin version.
//   node scripts/check-version.mjs <base>            base..HEAD (CI)
//   node scripts/check-version.mjs <base> --staged   base..index (pre-commit)
//   node scripts/check-version.mjs <base> --github   base..HEAD, errors as annotations
//
// Harnesses refresh an installed plugin only when its version changes, so a
// change that ships without a new version never reaches anyone. Against
// <base>, the version in plugins/cheque/.claude-plugin/plugin.json must:
// - be X.Y.Z, three non-negative integers;
// - change when plugins/cheque/ changed, or when the plugin was renamed;
// - when it changes, go up, and not reuse a version already tagged v<version>.
// It can't tell MAJOR from PATCH; review does (README, Contributing).
// tests/package.test.mjs keeps both manifests and the marketplace on one
// version, so this file stands for all three.
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const MANIFEST = 'plugins/cheque/.claude-plugin/plugin.json';
const SHIPPED = 'plugins/cheque/';
const VERSION = /^\d+\.\d+\.\d+$/;

function git(cwd, ...args) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

function manifestAt(cwd, rev) {
  // ':' reads the index.
  const p = git(cwd, 'show', rev === ':' ? `:${MANIFEST}` : `${rev}:${MANIFEST}`);
  if (p.status !== 0) return {};
  try {
    return JSON.parse(p.stdout);
  } catch {
    return {};
  }
}

const tuple = (v) => v.split('.').map(Number);
const lessOrEqual = (a, b) => {
  const [x, y] = [tuple(a), tuple(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return true;
};

// Returns null when the version is acceptable, otherwise the reason it isn't.
export function checkVersion(cwd, base, { staged = false } = {}) {
  const prev = manifestAt(cwd, base);
  const next = manifestAt(cwd, staged ? ':' : 'HEAD');
  // String(): a manifest can hold a number or null where the version belongs,
  // and that should get the format error, not a crash.
  const [oldV, newV] = [String(prev.version ?? ''), String(next.version ?? '')];

  if (!VERSION.test(newV)) return `the plugin version is ${JSON.stringify(newV)}; it must be X.Y.Z, three numbers, with no 'v' prefix or suffix.`;

  const diff = git(cwd, 'diff', '--name-only', ...(staged ? ['--cached', base] : [base, 'HEAD']), '--', SHIPPED);
  // A base git can't resolve (a typo, a shallow clone) diffs as nothing; that
  // must fail rather than pass as "no shipped change".
  if (diff.status !== 0) return `could not diff against ${base}: ${diff.stderr.trim()}`;
  const shippedChanged = diff.stdout.trim() !== '';
  const renamed = Boolean(prev.name) && prev.name !== next.name;

  if (oldV === newV) {
    if (renamed) return `the plugin was renamed (${prev.name} → ${next.name}) but the version is still ${newV}. A rename changes every skill's qualified name: bump MAJOR.`;
    if (shippedChanged) return `${SHIPPED} changed but the plugin version is still ${newV}. Bump MAJOR for a breaking change (a renamed skill, command, config key or environment variable), MINOR for a feature, PATCH otherwise.`;
    return null;
  }

  // A changed version must move forward and be new. A revert that restores an
  // old number would otherwise pass, and the release job would find that tag
  // taken and ship the commit untagged.
  if (VERSION.test(oldV) && lessOrEqual(newV, oldV)) return `the plugin version went from ${oldV} to ${newV}. It must go up; bump past ${oldV} even when reverting.`;
  if (git(cwd, 'rev-parse', '--quiet', '--verify', `refs/tags/v${newV}`).status === 0) return `v${newV} is already tagged. Bump to a version that hasn't shipped.`;
  return null;
}

// pathToFileURL percent-encodes the path, so a checkout path with spaces still
// matches import.meta.url.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [base, ...flags] = process.argv.slice(2);
  if (!base || base.startsWith('-')) {
    console.error('usage: node scripts/check-version.mjs <base> [--staged] [--github]');
    process.exit(2);
  }
  const problem = checkVersion(process.cwd(), base, { staged: flags.includes('--staged') });
  if (problem) {
    console.error((flags.includes('--github') ? '::error::' : 'version check: ') + problem);
    process.exit(1);
  }
}
