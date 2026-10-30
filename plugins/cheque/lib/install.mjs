// Target-repository setup. cheque owns only what it records in
// `.cheque/managed.json`: whole files it created and marked blocks inside
// shared files. Install and update never overwrite content they do not own;
// uninstall never removes shared documents (constraints, glossary, ADRs,
// verification skills) even if a cheque workflow helped create them.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, rmdirSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

export const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8')).version;
const TEMPLATES = new URL('../templates/', import.meta.url).pathname;
const MANIFEST = '.cheque/managed.json';
const BLOCK_START = '# >>> cheque managed block (do not edit inside) >>>';
const BLOCK_END = '# <<< cheque managed block <<<';

const sha = (s) => createHash('sha256').update(s).digest('hex');

function template(name, vars = {}) {
  return readFileSync(join(TEMPLATES, name), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

// What cheque manages in a target repository.
// `file`: created when absent; updated only while unmodified.
// `seed`: created once, then owned by the repository (never updated or removed).
// `block`: a marked section inside a shared file.
function plan({ cloudEntry, version, ref }) {
  // A custom ref gets its own cache directory, so the default tag and another
  // ref that declare the same version never reuse each other's checkout.
  const cache = ref ? `v${version}-${sha(ref).slice(0, 12)}` : `v${version}`;
  // Where the cloud entry looks for a checkout. The manifest check cannot tell
  // refs of the same version apart, so a custom ref skips the attached
  // repository and $CHEQUE_HOME and uses only its own cache.
  const candidates = [...(ref ? [] : ['"$CHEQUE_HOME"', '"$(git rev-parse --show-toplevel)/../cheque"']), `"$HOME/.cache/cheque/${cache}"`].join(' ');
  const vars = { version, ref: ref || `v${version}`, cache, candidates, repo_url: 'https://github.com/sendasorg/cheque' };
  const items = [
    { path: '.cheque/config.yaml', kind: 'seed', content: template('config.yaml') },
    { path: '.cheque/README.md', kind: 'file', content: template('cheque-readme.md', vars) },
    { path: '.gitignore', kind: 'block', content: template('gitignore-block.txt') },
  ];
  if (cloudEntry) {
    items.push({ path: '.claude/skills/cheque/SKILL.md', kind: 'file', content: template('cloud-entry-SKILL.md', vars) });
    items.push({ path: '.agents/skills/cheque/SKILL.md', kind: 'file', content: template('cloud-entry-SKILL.md', vars) });
  }
  return items;
}

// Every path cheque can ever manage. The manifest lives in the repository,
// so its entries are checked against this list before anything is touched.
const MANAGEABLE = new Map(plan({ cloudEntry: true, version: '0', ref: null }).map((i) => [i.path, i.kind]));

// Every component of a managed path must be a real directory or file inside
// the repository; a symlinked parent could otherwise redirect a write or delete.
function assertNoSymlinks(repo, rel) {
  let cur = repo;
  for (const part of rel.split('/')) {
    cur = join(cur, part);
    let st;
    try {
      st = lstatSync(cur);
    } catch (e) {
      if (e.code === 'ENOENT') return;
      throw e;
    }
    if (st.isSymbolicLink()) throw new Error(`${relative(repo, cur)} is a symlink; refusing to act on ${rel}`);
  }
}

function readManifest(repo) {
  const p = join(repo, MANIFEST);
  if (!existsSync(p)) return { version: null, items: [] };
  const m = JSON.parse(readFileSync(p, 'utf8'));
  for (const item of m.items || []) {
    if (MANAGEABLE.get(item.path) !== item.kind) throw new Error(`${MANIFEST} lists ${item.path} (${item.kind}), which cheque never manages; refusing to act on it`);
    assertNoSymlinks(repo, item.path);
  }
  return m;
}

function writeManifest(repo, m) {
  mkdirSync(join(repo, '.cheque'), { recursive: true });
  writeFileSync(join(repo, MANIFEST), JSON.stringify(m, null, 2) + '\n');
}

function blockText(content) {
  return `${BLOCK_START}\n${content.trimEnd()}\n${BLOCK_END}\n`;
}

function upsertBlock(existing, content) {
  const start = existing.indexOf(BLOCK_START);
  const end = existing.indexOf(BLOCK_END);
  if (start === -1 && end === -1) return { text: `${existing}${existing && !existing.endsWith('\n') ? '\n' : ''}${existing ? '\n' : ''}${blockText(content)}` };
  if (start === -1 || end === -1 || end < start) return { conflict: 'managed block markers are incomplete' };
  return { text: existing.slice(0, start) + blockText(content) + existing.slice(end + BLOCK_END.length + 1) };
}

function removeBlock(existing) {
  const start = existing.indexOf(BLOCK_START);
  const end = existing.indexOf(BLOCK_END);
  if (start === -1 || end === -1) return existing;
  const before = existing.slice(0, start).replace(/\n\n$/, '\n');
  return before + existing.slice(end + BLOCK_END.length + 1);
}

// The ref is written into the cloud entry's shell commands, inside single
// quotes, and can come from the committed manifest. So it must be a name git
// accepts as a branch or tag, with no quote in it. A release tag means "this
// release": a tag recorded by an earlier install follows the package version
// on update, and an explicit tag for another release is refused.
function customRef(ref, { explicit, version }) {
  if (!ref) return null;
  // `git clone --branch` takes a short branch or tag name, so a fully
  // qualified refs/... name is refused rather than failing at clone time, as
  // is @{...}, which check-ref-format expands against the current repository.
  const valid = !ref.includes("'") && !ref.startsWith('refs/') && !ref.includes('@{') && spawnSync('git', ['check-ref-format', '--branch', ref], { stdio: 'ignore' }).status === 0;
  if (!valid) throw new Error(`invalid ref ${JSON.stringify(ref)}: use a short git branch or tag name with no quote`);
  if (/^v\d+\.\d+\.\d+$/.test(ref)) {
    if (explicit && ref !== `v${version}`) throw new Error(`ref ${ref} is a different release than cheque ${version}; install that release instead`);
    return null;
  }
  return ref;
}

export function install(repo, { cloudEntry = false, version = PACKAGE_VERSION, ref = null } = {}) {
  const manifest = readManifest(repo);
  const pin = customRef(ref || manifest.ref, { explicit: Boolean(ref), version });
  const recorded = Object.fromEntries(manifest.items.map((i) => [i.path, i]));
  const report = { created: [], updated: [], unchanged: [], conflicts: [], kept: [] };
  const items = [];
  const wantCloud = cloudEntry || manifest.items.some((i) => i.path.endsWith('skills/cheque/SKILL.md'));

  for (const item of plan({ cloudEntry: wantCloud, version, ref: pin })) {
    assertNoSymlinks(repo, item.path);
    const abs = join(repo, item.path);
    const exists = existsSync(abs);
    const current = exists ? readFileSync(abs, 'utf8') : null;
    const prior = recorded[item.path];

    if (item.kind === 'block') {
      const next = upsertBlock(current ?? '', item.content);
      if (next.conflict) {
        report.conflicts.push(`${item.path}: ${next.conflict}`);
        if (prior) items.push(prior);
        continue;
      }
      if (next.text === current) report.unchanged.push(item.path);
      else {
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, next.text);
        (exists ? report.updated : report.created).push(item.path);
      }
      items.push({ path: item.path, kind: 'block', sha256: sha(item.content) });
      continue;
    }

    if (!exists) {
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, item.content);
      report.created.push(item.path);
      items.push({ path: item.path, kind: item.kind, sha256: sha(item.content) });
      continue;
    }
    if (item.kind === 'seed') {
      report.kept.push(item.path);
      items.push(prior || { path: item.path, kind: 'seed', sha256: null });
      continue;
    }
    if (current === item.content) {
      report.unchanged.push(item.path);
      items.push({ path: item.path, kind: item.kind, sha256: sha(item.content) });
    } else if (prior && sha(current) === prior.sha256) {
      writeFileSync(abs, item.content);
      report.updated.push(item.path);
      items.push({ path: item.path, kind: item.kind, sha256: sha(item.content) });
    } else {
      report.conflicts.push(`${item.path}: exists with content cheque did not write; left unchanged`);
      if (prior) items.push(prior);
    }
  }
  writeManifest(repo, { version, ref: pin, installed_at: manifest.installed_at || new Date().toISOString(), updated_at: new Date().toISOString(), items });
  return report;
}

export function uninstall(repo) {
  const manifest = readManifest(repo);
  const report = { removed: [], kept: [], conflicts: [] };
  for (const item of manifest.items) {
    const abs = join(repo, item.path);
    if (!existsSync(abs)) continue;
    const current = readFileSync(abs, 'utf8');
    if (item.kind === 'block') {
      const next = removeBlock(current);
      if (next.trim() === '') rmSync(abs);
      else writeFileSync(abs, next);
      report.removed.push(`${item.path} (managed block)`);
    } else if (item.kind === 'seed') {
      report.kept.push(`${item.path} (repository configuration; delete it yourself if no longer wanted)`);
    } else if (sha(current) === item.sha256) {
      rmSync(abs);
      pruneEmptyDirs(repo, dirname(item.path));
      report.removed.push(item.path);
    } else {
      report.conflicts.push(`${item.path}: modified since install; left in place`);
    }
  }
  rmSync(join(repo, MANIFEST), { force: true });
  return report;
}

function pruneEmptyDirs(repo, rel) {
  while (rel && rel !== '.' && rel !== '.cheque') {
    const abs = join(repo, rel);
    if (!existsSync(abs) || readdirSync(abs).length) return;
    rmdirSync(abs);
    rel = dirname(rel);
  }
}

export function installStatus(repo) {
  const manifest = readManifest(repo);
  return {
    installed: manifest.items.length > 0,
    version: manifest.version,
    package_version: PACKAGE_VERSION,
    items: manifest.items.map((i) => {
      const abs = join(repo, i.path);
      const state = !existsSync(abs) ? 'missing' : i.kind !== 'file' ? i.kind : sha(readFileSync(abs, 'utf8')) === i.sha256 ? 'unmodified' : 'modified';
      return { path: i.path, kind: i.kind, state };
    }),
  };
}
