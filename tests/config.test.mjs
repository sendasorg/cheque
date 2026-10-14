import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseYaml, stringifyYaml, YamlError } from '../plugins/stroppers/lib/yaml.mjs';
import { resolveConfig, deliveryBlockers, explain, ConfigError } from '../plugins/stroppers/lib/config.mjs';
import { git, isolatedEnv, tempRepo, write } from './helpers.mjs';

test('yaml subset parses nested maps, lists and scalars', () => {
  const doc = parseYaml(`
version: 1 # comment
harness:
  default: codex
  review:
    preferences:
      - codex
      - claude-code
authority:
  owners:
    - linear_user_id: "abc"
      label: Owner One
flag: false
empty: []
`);
  assert.deepEqual(doc, {
    version: 1,
    harness: { default: 'codex', review: { preferences: ['codex', 'claude-code'] } },
    authority: { owners: [{ linear_user_id: 'abc', label: 'Owner One' }] },
    flag: false,
    empty: [],
  });
  assert.deepEqual(parseYaml(stringifyYaml(doc)), doc);
});

test('yaml subset rejects syntax it does not support', () => {
  for (const bad of ['a: &x 1', 'a: [1, 2]', 'a: |\n  text', 'a: 1\na: 2', '\ta: 1', 'a:\n  b: 1\n    c: 2']) {
    assert.throws(() => parseYaml(bad), YamlError, bad);
  }
});

test('layers apply in documented precedence order', () => {
  const env = isolatedEnv();
  write(env.HOME, '.config/stroppers/operator.yaml', 'harness:\n  default: codex\n  review:\n    timeout_minutes: 10\n');
  const repo = tempRepo({ '.stroppers/config.yaml': 'harness:\n  review:\n    timeout_minutes: 20\n' });
  write(repo, '.stroppers/config.local.yaml', 'harness:\n  review:\n    timeout_minutes: 25\n');
  const { effective, layers } = resolveConfig({ repoRoot: repo, env, taskExceptions: { harness: { review: { reviewer: 'claude-code' } } } });
  assert.equal(effective.harness.default, 'codex');
  assert.equal(effective.harness.review.timeout_minutes, 25);
  assert.equal(effective.harness.review.reviewer, 'claude-code');
  assert.equal(effective.harness.review.policy, 'different-harness');
  assert.deepEqual(layers.map((l) => l.name), ['packaged', 'operator', 'repo', 'local', 'task']);
});

test('committed repository config cannot set authority', () => {
  const repo = tempRepo({ '.stroppers/config.yaml': 'authority:\n  owners:\n    - linear_user_id: attacker\n' });
  assert.throws(() => resolveConfig({ repoRoot: repo, env: isolatedEnv() }), (e) => e instanceof ConfigError && /authority: may only be set in private/.test(e.message));
});

test('task exceptions cannot change authority or the Linear binding', () => {
  const repo = tempRepo();
  for (const exc of [{ authority: { environments: ['production'] } }, { linear: { workspace: 'other' } }]) {
    assert.throws(() => resolveConfig({ repoRoot: repo, env: isolatedEnv(), taskExceptions: exc }), ConfigError);
  }
});

test('a committed config.local.yaml is not trusted as private config', () => {
  const repo = tempRepo({ '.stroppers/config.local.yaml': 'authority:\n  environments:\n    - production\n' });
  assert.throws(() => resolveConfig({ repoRoot: repo, env: isolatedEnv() }), /must stay untracked/);
});

test('unknown and invalid settings are rejected with their path', () => {
  const repo = tempRepo({ '.stroppers/config.yaml': 'harness:\n  defualt: codex\n  review:\n    policy: whatever\n' });
  assert.throws(
    () => resolveConfig({ repoRoot: repo, env: isolatedEnv() }),
    (e) => e.errors.some((m) => m.includes('harness.defualt: unknown setting')) && e.errors.some((m) => m.includes('harness.review.policy: must be one of')),
  );
});

test('a reviewer that is not a registered adapter is rejected', () => {
  const repo = tempRepo({ '.stroppers/config.yaml': 'harness:\n  review:\n    reviewer: grok\n' });
  assert.throws(() => resolveConfig({ repoRoot: repo, env: isolatedEnv() }), /not a registered adapter/);
});

test('missing Linear binding produces specific delivery blockers', () => {
  const { effective } = resolveConfig({ repoRoot: tempRepo(), env: isolatedEnv() });
  const blockers = deliveryBlockers(effective);
  assert.ok(blockers.some((b) => b.startsWith('linear.workspace is not set')));
  assert.ok(blockers.some((b) => b.startsWith('authority.owners is empty')));
});

test('explain names credential variables without revealing values', () => {
  const env = isolatedEnv({ STROPPERS_LINEAR_API_KEY: 'lin_api_secretvalue' });
  const out = JSON.stringify(explain(resolveConfig({ repoRoot: tempRepo(), env }), env));
  assert.ok(out.includes('STROPPERS_LINEAR_API_KEY (set)'));
  assert.ok(!out.includes('secretvalue'));
});

test('operator config can be provisioned from an environment variable for cloud sessions', () => {
  const env = isolatedEnv({ STROPPERS_OPERATOR_CONFIG_YAML: 'authority:\n  repositories:\n    - acme/app\n' });
  const { effective } = resolveConfig({ repoRoot: tempRepo(), env });
  assert.deepEqual(effective.authority.repositories, ['acme/app']);
});

test('second repository settings do not leak into the first', () => {
  const env = isolatedEnv();
  const a = tempRepo({ '.stroppers/config.yaml': 'linear:\n  workspace: ws-a\n  team: A\n' });
  const b = tempRepo({ '.stroppers/config.yaml': 'linear:\n  workspace: ws-b\n  team: B\n' });
  assert.equal(resolveConfig({ repoRoot: a, env }).effective.linear.workspace, 'ws-a');
  assert.equal(resolveConfig({ repoRoot: b, env }).effective.linear.workspace, 'ws-b');
  git(a, 'status');
});
