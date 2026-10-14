// Configuration resolution: packaged defaults < private operator config <
// repository config < private repo-local overrides < recorded task exceptions.
// Authority keys (owners, repositories, environments, credential names) are
// accepted only from private layers; a committed repository file or task text
// cannot widen them.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { parseYaml } from './yaml.mjs';

const HARNESS_ID = /^[a-z][a-z0-9-]*$/;
const str = { type: 'string' };
const nullableStr = { type: 'string', nullable: true };
const int = (min, max) => ({ type: 'integer', min, max });
const bool = { type: 'boolean' };
const list = (item) => ({ type: 'list', item });
const harnessRef = { type: 'string', pattern: HARNESS_ID, nullable: true };

// The closed schema. Every key a layer may set appears here; anything else is
// rejected so a typo never silently falls back to a default.
export const SCHEMA = {
  type: 'map',
  keys: {
    version: { type: 'integer', min: 1, max: 1 },
    harness: {
      type: 'map',
      keys: {
        default: { type: 'string', pattern: HARNESS_ID },
        steps: {
          type: 'map',
          keys: { implement: harnessRef, feedback: harnessRef, live_verification: harnessRef },
        },
        review: {
          type: 'map',
          keys: {
            policy: { type: 'enum', values: ['different-harness', 'same-harness'] },
            reviewer: harnessRef,
            preferences: list({ type: 'string', pattern: HARNESS_ID }),
            timeout_minutes: int(1, 240),
          },
        },
        fallback: {
          type: 'map',
          keys: {
            enabled: bool,
            steps: list({ type: 'enum', values: ['implement', 'review', 'feedback', 'live_verification'] }),
          },
        },
      },
    },
    adapters: {
      type: 'dict',
      keyPattern: HARNESS_ID,
      value: {
        type: 'map',
        keys: { enabled: bool, command: { type: 'list', item: str }, fake: bool },
      },
    },
    linear: {
      type: 'map',
      keys: {
        workspace: nullableStr,
        team: nullableStr,
        project: nullableStr,
        credential_env: { type: 'string', pattern: /^[A-Z][A-Z0-9_]*$/, nullable: true },
        approval_state: nullableStr,
      },
    },
    authority: {
      type: 'map',
      private: true,
      keys: {
        owners: list({
          type: 'map',
          keys: { linear_user_id: str, label: nullableStr },
          required: ['linear_user_id'],
        }),
        repositories: list({ type: 'string', pattern: /^[\w.-]+\/[\w.-]+$/ }),
        environments: list(str),
      },
    },
    recovery: {
      type: 'map',
      keys: {
        fix_cycles: int(1, 10),
        infra_retries: int(0, 10),
        infra_backoff_seconds: list({ type: 'integer', min: 1, max: 3600 }),
      },
    },
    verification: {
      type: 'map',
      keys: {
        browser: { type: 'enum', values: ['chromium', 'firefox', 'webkit'] },
        headless: bool,
        max_run_minutes: int(1, 120),
        evidence_publication: { type: 'enum', values: ['github-release', 'pr-comment-only'] },
      },
    },
    documents: {
      type: 'map',
      keys: {
        constraints: str,
        glossary: str,
        adr_dir: str,
        verification_skill: nullableStr,
        planning_dir: str,
      },
    },
    pstack: {
      type: 'map',
      keys: {
        models: { type: 'dict', keyPattern: /^[a-z][a-z0-9 ,-]*$/, value: str },
      },
    },
  },
};

export class ConfigError extends Error {
  constructor(errors) {
    super(errors.join('\n'));
    this.errors = errors;
  }
}

function typeName(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'list';
  return typeof v;
}

export function validate(value, schema = SCHEMA, path = '', layer = 'repo', errors = []) {
  const at = path || '(root)';
  if (value === null || value === undefined) {
    if (!schema.nullable && schema.type !== 'map' && schema.type !== 'dict') errors.push(`${at}: must not be empty`);
    return errors;
  }
  switch (schema.type) {
    case 'map':
    case 'dict': {
      if (typeName(value) !== 'object') {
        errors.push(`${at}: expected a mapping, got ${typeName(value)}`);
        break;
      }
      if (schema.private && !['packaged', 'operator', 'local'].includes(layer)) {
        errors.push(`${at}: may only be set in private operator or repo-local config, not in the ${layer} layer`);
        break;
      }
      for (const [k, v] of Object.entries(value)) {
        const child = path ? `${path}.${k}` : k;
        if (schema.type === 'dict') {
          if (!schema.keyPattern.test(k)) errors.push(`${child}: invalid key`);
          validate(v, schema.value, child, layer, errors);
        } else if (!schema.keys[k]) errors.push(`${child}: unknown setting`);
        else validate(v, schema.keys[k], child, layer, errors);
      }
      for (const req of schema.required || []) if (!(req in value)) errors.push(`${at}: missing ${req}`);
      break;
    }
    case 'list':
      if (!Array.isArray(value)) errors.push(`${at}: expected a list, got ${typeName(value)}`);
      else value.forEach((item, i) => validate(item, schema.item, `${path}[${i}]`, layer, errors));
      break;
    case 'string':
      if (typeof value !== 'string') errors.push(`${at}: expected text, got ${typeName(value)}`);
      else if (schema.pattern && !schema.pattern.test(value)) errors.push(`${at}: invalid value ${JSON.stringify(value)}`);
      break;
    case 'integer':
      if (!Number.isInteger(value)) errors.push(`${at}: expected a whole number`);
      else if (value < schema.min || value > schema.max) errors.push(`${at}: must be between ${schema.min} and ${schema.max}`);
      break;
    case 'boolean':
      if (typeof value !== 'boolean') errors.push(`${at}: expected true or false`);
      break;
    case 'enum':
      if (!schema.values.includes(value)) errors.push(`${at}: must be one of ${schema.values.join(', ')}`);
      break;
  }
  return errors;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function merge(base, overlay) {
  if (!isPlainObject(base) || !isPlainObject(overlay)) return overlay === undefined ? base : overlay;
  const out = { ...base };
  for (const [k, v] of Object.entries(overlay)) out[k] = isPlainObject(v) && isPlainObject(base[k]) ? merge(base[k], v) : v;
  return out;
}

const PACKAGE_DEFAULTS_PATH = new URL('../defaults.yaml', import.meta.url).pathname;

export function operatorConfigPath(env = process.env) {
  return env.STROPPERS_OPERATOR_CONFIG || join(env.XDG_CONFIG_HOME || join(homedir(), '.config'), 'stroppers', 'operator.yaml');
}

function readLayer(name, path, inline) {
  if (inline) return { name, source: `${name} (environment)`, data: parseYaml(inline) };
  if (!path || !existsSync(path)) return null;
  try {
    return { name, source: path, data: parseYaml(readFileSync(path, 'utf8')) };
  } catch (e) {
    throw new ConfigError([`${path}: ${e.message}`]);
  }
}

function isTracked(repoRoot, path) {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', path], { cwd: repoRoot, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Task exceptions come from an approved delivery record. They may change
// non-authority settings (for example a per-task reviewer override); they can
// never touch `authority` or the Linear binding.
const TASK_EXCEPTION_FORBIDDEN = ['authority', 'linear', 'adapters'];

export function resolveConfig({ repoRoot, env = process.env, taskExceptions = null } = {}) {
  const layers = [
    readLayer('packaged', PACKAGE_DEFAULTS_PATH),
    readLayer('operator', operatorConfigPath(env), env.STROPPERS_OPERATOR_CONFIG_YAML),
    repoRoot ? readLayer('repo', join(repoRoot, '.stroppers', 'config.yaml')) : null,
    repoRoot ? readLayer('local', join(repoRoot, '.stroppers', 'config.local.yaml')) : null,
  ].filter(Boolean);
  if (taskExceptions) layers.push({ name: 'task', source: 'approved task exceptions', data: taskExceptions });

  const errors = [];
  // The repo-local file is private only while git ignores it. A committed copy
  // is repository content and cannot carry authority.
  if (repoRoot && layers.some((l) => l.name === 'local') && isTracked(repoRoot, '.stroppers/config.local.yaml'))
    errors.push('.stroppers/config.local.yaml is committed to git; it must stay untracked to act as private config');
  for (const layer of layers) {
    for (const e of validate(layer.data, SCHEMA, '', layer.name)) errors.push(`${layer.source}: ${e}`);
    if (layer.name === 'task')
      for (const k of TASK_EXCEPTION_FORBIDDEN)
        if (k in (layer.data || {})) errors.push(`${layer.source}: ${k} cannot be changed by a task exception`);
  }
  if (errors.length) throw new ConfigError(errors);

  let effective = {};
  const sources = {};
  for (const layer of layers) {
    effective = merge(effective, layer.data || {});
    for (const k of Object.keys(layer.data || {})) sources[k] = [...(sources[k] || []), layer.source];
  }
  const semantic = semanticErrors(effective);
  if (semantic.length) throw new ConfigError(semantic);
  return { effective, layers: layers.map((l) => ({ name: l.name, source: l.source })), sources };
}

function semanticErrors(c) {
  const errors = [];
  const registered = Object.keys(c.adapters || {});
  const check = (path, id) => {
    if (id && !registered.includes(id)) errors.push(`${path}: harness "${id}" is not a registered adapter (${registered.join(', ')})`);
  };
  check('harness.default', c.harness?.default);
  for (const [step, id] of Object.entries(c.harness?.steps || {})) check(`harness.steps.${step}`, id);
  check('harness.review.reviewer', c.harness?.review?.reviewer);
  (c.harness?.review?.preferences || []).forEach((id, i) => check(`harness.review.preferences[${i}]`, id));
  if (c.harness?.fallback?.steps?.length && !c.harness.fallback.enabled)
    errors.push('harness.fallback.steps: listed steps have no effect while harness.fallback.enabled is false');
  return errors;
}

// Requirements that only Stroppers delivery operations need. A missing value
// blocks Stroppers work with a specific message; it never affects upstream skills.
export function deliveryBlockers(c) {
  const blockers = [];
  if (!c.linear?.workspace) blockers.push('linear.workspace is not set: bind this repository to one Linear workspace in .stroppers/config.yaml');
  if (!c.linear?.team) blockers.push('linear.team is not set');
  if (!c.linear?.credential_env) blockers.push('linear.credential_env is not set: name the environment variable that holds a read-only Linear API key');
  if (!c.authority?.owners?.length) blockers.push('authority.owners is empty: configure approval owners in private operator config');
  if (!c.authority?.repositories?.length) blockers.push('authority.repositories is empty: list the repositories delivery may change');
  return blockers;
}

// Effective configuration for display. Credential settings are names of
// environment variables, so they are shown with whether they are set, never
// with their values.
export function explain(resolved, env = process.env) {
  const c = structuredClone(resolved.effective);
  if (c.linear?.credential_env) c.linear.credential_env = `${c.linear.credential_env} (${env[c.linear.credential_env] ? 'set' : 'not set'})`;
  return { effective: c, layers: resolved.layers };
}
