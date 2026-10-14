// Runs Addy Osmani's floor guard exactly as published: the reference
// implementation is extracted from the vendored floor-guard.md at run time,
// so Cheque never maintains a second copy of the rules.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const REFERENCE = new URL('../vendor/addyosmani-agent-skills/skills/constraint-driven-development/references/floor-guard.md', import.meta.url).pathname;

export function extractGuard(markdown = readFileSync(REFERENCE, 'utf8')) {
  const section = markdown.split('## Reference')[1];
  const m = section?.match(/```js\n([\s\S]*?)\n```/);
  if (!m) throw new Error('floor-guard reference implementation not found in vendored floor-guard.md');
  return m[1];
}

// Exit codes follow the upstream contract: 0 clean, 1 violation, 2 could not run.
// A 2 is reported as `unverified`, never as passing.
export function runFloorGuard({ repoRoot, base }) {
  const dir = mkdtempSync(join(tmpdir(), 'cheque-floor-'));
  const script = join(dir, 'floor-guard.mjs');
  writeFileSync(script, extractGuard());
  const r = spawnSync(process.execPath, [script, '--base', base], { cwd: repoRoot, encoding: 'utf8' });
  const output = `${r.stdout}${r.stderr}`.trim();
  if (r.status === 0) return { status: 'passed', output };
  if (r.status === 1) return { status: 'failed', reason: 'floor violation', output };
  return { status: 'unverified', reason: `floor guard could not run (exit ${r.status})`, output };
}
