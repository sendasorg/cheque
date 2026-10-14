// Target-repository setup. Stroppers owns only what it records in
// `.stroppers/managed.json`: whole files it created and marked blocks inside
// shared files. Install and update never overwrite content they do not own;
// uninstall never removes shared documents (constraints, glossary, ADRs,
// verification skills) even if a Stroppers workflow helped create them.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, readdirSync, rmdirSync } from 'node:fs';
import { dirname, join } from 'node:path';

export const PACKAGE_VERSION = JSON.parse(readFileSync(new URL('../.claude-plugin/plugin.json', import.meta.url), 'utf8')).version;
const TEMPLATES = new URL('../templates/', import.meta.url).pathname;
const MANIFEST = '.stroppers/managed.json';
const BLOCK_START = '# >>> stroppers managed block (do not edit inside) >>>';
const BLOCK_END = '# <<< stroppers managed block <<<';

const sha = (s) => createHash('sha256').update(s).digest('hex');

function template(name, vars = {}) {
  return readFileSync(join(TEMPLATES, name), 'utf8').replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}

// What Stroppers manages in a target repository.
// `file`: created when absent; updated only while unmodified.
// `seed`: created once, then owned by the repository (never updated or removed).
// `block`: a marked section inside a shared file.
function plan({ cloudEntry, version }) {
  const vars = { version, repo_url: 'https://github.com/sogamoso/stroppers' };
  const items = [
    { path: '.stroppers/config.yaml', kind: 'seed', content: template('config.yaml') },
    { path: '.stroppers/README.md', kind: 'file', content: template('stroppers-readme.md', vars) },
    { path: '.gitignore', kind: 'block', content: template('gitignore-block.txt') },
  ];
  if (cloudEntry) {
    items.push({ path: '.claude/skills/stroppers/SKILL.md', kind: 'file', content: template('cloud-entry-SKILL.md', vars) });
    items.push({ path: '.agents/skills/stroppers/SKILL.md', kind: 'file', content: template('cloud-entry-SKILL.md', vars) });
  }
  return items;
}

function readManifest(repo) {
  const p = join(repo, MANIFEST);
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : { version: null, items: [] };
}

function writeManifest(repo, m) {
  mkdirSync(join(repo, '.stroppers'), { recursive: true });
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

export function install(repo, { cloudEntry = false, version = PACKAGE_VERSION } = {}) {
  const manifest = readManifest(repo);
  const recorded = Object.fromEntries(manifest.items.map((i) => [i.path, i]));
  const report = { created: [], updated: [], unchanged: [], conflicts: [], kept: [] };
  const items = [];
  const wantCloud = cloudEntry || manifest.items.some((i) => i.path.endsWith('skills/stroppers/SKILL.md'));

  for (const item of plan({ cloudEntry: wantCloud, version })) {
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
      report.conflicts.push(`${item.path}: exists with content Stroppers did not write; left unchanged`);
      if (prior) items.push(prior);
    }
  }
  writeManifest(repo, { version, installed_at: manifest.installed_at || new Date().toISOString(), updated_at: new Date().toISOString(), items });
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
  while (rel && rel !== '.' && rel !== '.stroppers') {
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
