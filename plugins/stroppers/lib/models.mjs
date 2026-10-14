// Session model map for Pstack. Pstack reads model routing only from
// user-global files (~/.agents/pstack-models.md, ~/.cursor/rules/...). Stroppers
// never writes those; it renders its own resolved map into ignored session
// state, and the entry point tells the session to use it in their place.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Every role Pstack's setup-pstack defines. Without an explicit choice each
// role runs on the session's own model, which avoids Pstack's Grok defaults.
export const PSTACK_ROLES = [
  'feature, refactoring',
  'bug-fix',
  'perf-issue',
  'hillclimb',
  'judgment and prose',
  'hardest tasks',
  'how explorer',
  'how explainer',
  'why investigators',
  'why synthesizer',
  'reflect tooling',
  'reflect judgment, divergent, synthesizer',
  'swarm workers',
  'arena runners',
  'arena cross-judge pool',
  'architect runners',
  'interrogate reviewers',
];

export function renderModelMap(config) {
  const chosen = config.pstack?.models || {};
  const lines = ['# Stroppers session model map for Pstack (generated; do not edit)', '# budget: inherit'];
  for (const role of PSTACK_ROLES) lines.push(`${role}: ${chosen[role] || 'inherit-parent'}`);
  for (const [role, model] of Object.entries(chosen)) if (!PSTACK_ROLES.includes(role)) lines.push(`${role}: ${model}`);
  return lines.join('\n') + '\n';
}

export function writeModelMap(stateDir, config) {
  mkdirSync(stateDir, { recursive: true });
  const path = join(stateDir, 'pstack-models.md');
  writeFileSync(path, renderModelMap(config));
  return path;
}
