#!/usr/bin/env node
// Materializes and checks pinned upstream sources listed in dependencies.json.
//   node scripts/vendor.mjs sync            copy pinned files into the vendor tree
//   node scripts/vendor.mjs check           exit 1 if the vendor tree differs from the pins
//   node scripts/vendor.mjs update <name> <sha>   show the upstream diff, then repin and sync
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join, relative } from 'node:path';
import { readdirSync, statSync } from 'node:fs';

const root = join(dirname(new URL(import.meta.url).pathname), '..');
const manifestPath = join(root, 'dependencies.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const cacheRoot = process.env.CHEQUE_VENDOR_CACHE || join(tmpdir(), 'cheque-vendor-cache');

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function checkout(source, sha = source.sha) {
  const dir = join(cacheRoot, source.name);
  if (!existsSync(join(dir, '.git'))) {
    mkdirSync(dir, { recursive: true });
    git(['init', '-q'], dir);
    git(['remote', 'add', 'origin', source.repo], dir);
  }
  try {
    git(['cat-file', '-e', `${sha}^{commit}`], dir);
  } catch {
    git(['fetch', '-q', '--depth', '1', 'origin', sha], dir);
  }
  git(['checkout', '-q', '--force', sha], dir);
  return dir;
}

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function treeHash(base, includes) {
  const hash = createHash('sha256');
  const files = includes
    .flatMap((p) => (statSync(join(base, p)).isDirectory() ? walk(join(base, p)) : [join(base, p)]))
    .map((f) => relative(base, f))
    .sort();
  for (const f of files) {
    hash.update(f);
    hash.update('\0');
    hash.update(readFileSync(join(base, f)));
    hash.update('\0');
  }
  return { digest: hash.digest('hex'), files };
}

function destination(source) {
  return join(root, manifest.destinationRoot, source.destination);
}

function sync(source) {
  const src = checkout(source);
  const dest = destination(source);
  rmSync(dest, { recursive: true, force: true });
  for (const p of source.include) {
    mkdirSync(dirname(join(dest, p)), { recursive: true });
    cpSync(join(src, p), join(dest, p), { recursive: true });
  }
  const { digest, files } = treeHash(dest, source.include);
  console.log(`synced ${source.name}@${source.sha.slice(0, 12)} (${files.length} files, ${digest.slice(0, 12)})`);
}

function check(source) {
  const dest = destination(source);
  if (!existsSync(dest)) return [`${source.name}: missing ${relative(root, dest)}`];
  const expected = treeHash(checkout(source), source.include);
  const actual = treeHash(dest, source.include);
  if (expected.digest === actual.digest) return [];
  const extra = actual.files.filter((f) => !expected.files.includes(f));
  const missing = expected.files.filter((f) => !actual.files.includes(f));
  return [`${source.name}: vendor tree differs from ${source.sha.slice(0, 12)} (extra: ${extra.join(', ') || 'none'}; missing: ${missing.join(', ') || 'none'}; or content changed)`];
}

function update(name, sha) {
  const source = manifest.sources.find((s) => s.name === name);
  if (!source) throw new Error(`unknown source ${name}`);
  const dir = checkout(source);
  git(['fetch', '-q', '--depth', '50', 'origin', sha], dir);
  const paths = source.include;
  console.log(`# ${name}: ${source.sha.slice(0, 12)} -> ${sha.slice(0, 12)}`);
  try {
    console.log(git(['diff', '--stat', source.sha, sha, '--', ...paths], dir));
  } catch {
    console.log('(history between pins not available in shallow fetch; showing file list at new pin)');
  }
  source.sha = sha;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  sync(source);
  console.log('Review `git diff` before committing. Roll back with `git checkout -- dependencies.json plugins/cheque/vendor`.');
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'sync') manifest.sources.forEach(sync);
else if (cmd === 'check') {
  const problems = manifest.sources.flatMap(check);
  problems.forEach((p) => console.error(p));
  if (problems.length) process.exit(1);
  console.log(`vendor tree matches ${manifest.sources.length} pins`);
} else if (cmd === 'update') update(args[0], args[1]);
else {
  console.error('usage: vendor.mjs sync | check | update <name> <sha>');
  process.exit(2);
}
