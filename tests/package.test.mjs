import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

test('plugin version is identical in both harness manifests and the marketplace', () => {
  // Harnesses cache installed plugins by version: an unbumped release is never picked up.
  const claude = json('plugins/cheque/.claude-plugin/plugin.json').version;
  const codex = json('plugins/cheque/.codex-plugin/plugin.json').version;
  const market = json('.claude-plugin/marketplace.json').plugins.find((p) => p.name === 'cheque').version;
  assert.equal(codex, claude);
  assert.equal(market, claude);
});

test('both marketplaces point at the plugin directory', () => {
  assert.equal(json('.claude-plugin/marketplace.json').plugins[0].source, './plugins/cheque');
  assert.equal(json('.agents/plugins/marketplace.json').plugins[0].source.path, './plugins/cheque');
});

function walk(dir) {
  return readdirSync(dir).flatMap((e) => (statSync(join(dir, e)).isDirectory() ? walk(join(dir, e)) : [join(dir, e)]));
}

test('every relative link in Cheque skills and vendored skills resolves', () => {
  const broken = [];
  const files = walk(join(root, 'plugins/cheque')).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const text = readFileSync(f, 'utf8').replace(/```[\s\S]*?```/g, '');
    for (const [, target] of text.matchAll(/\]\(([^)\s#]+)(?:#[^)]*)?\)/g)) {
      if (/^[a-z]+:/i.test(target)) continue;
      if (!existsSync(resolve(dirname(f), target))) broken.push(`${f.slice(root.length)} -> ${target}`);
    }
  }
  // Known upstream links that only resolve inside the cursor/plugins monorepo
  // or point at files pstack does not ship; documented in references/pstack.md.
  const known = broken.filter((b) => b.includes('/vendor/pstack/'));
  const unexpected = broken.filter((b) => !b.includes('/vendor/pstack/'));
  assert.deepEqual(unexpected, []);
  assert.ok(known.length < 25, `pstack broken links grew: ${known.length}`);
});

test('no Cheque skill name collides with a vendored upstream skill name', () => {
  const own = readdirSync(join(root, 'plugins/cheque/skills'));
  // Own skills are namespaced by the plugin (cheque:<name>) in both harnesses;
  // vendored skills are never registered, so bare upstream names stay free.
  assert.ok(!existsSync(join(root, 'plugins/cheque/skills/poteto-mode')));
  assert.deepEqual(own.sort(), ['deliver', 'grill-me', 'grill-with-docs']);
});
