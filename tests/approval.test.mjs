import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractHash, renderContract, newCheckpoint, render, parse, recordAttempt, intend, complete, pendingActions, setHead, recordOutcome, acceptanceSummary, acquireLease, taskKey, validateContract } from '../plugins/stroppers/lib/checkpoint.mjs';
import { verifyApproval, applyApproval, authorizeAction } from '../plugins/stroppers/lib/approval.mjs';
import { fetchIssue, LinearError } from '../plugins/stroppers/lib/linear.mjs';

const OWNER = 'owner-user-id';
const contract = {
  issue: 'ENG-1',
  outcome: 'Clamp discounts',
  acceptance_criteria: [{ id: 'AC1', criterion: 'percent above 100 is treated as 100' }],
  scope: 'discount.js only',
  repositories: ['acme/shop'],
  environments: ['preview'],
  deployment: 'merge to main deploys preview',
  recovery: 'revert the merge commit',
  exceptions: [],
};
const REV = contractHash(contract);
const issue = { id: 'issue-uuid', key: 'ENG-1', workspace_id: 'ws-1', state_type: 'started' };
let clock = 0;
const at = () => new Date(Date.UTC(2026, 9, 1) + ++clock * 60000).toISOString();
const agentContract = () => ({ id: 'c-contract', body: renderContract(contract), createdAt: at(), editedAt: null, user: { id: OWNER }, botActor: { id: 'app', name: 'Claude', type: 'oauthClient' } });
const ownerSays = (body, extra = {}) => ({ id: `c-${clock + 1}`, body, createdAt: at(), editedAt: null, user: { id: OWNER }, botActor: null, ...extra });

test('contract hash is stable across key order', () => {
  const reordered = Object.fromEntries(Object.entries(contract).reverse());
  assert.equal(contractHash(reordered), REV);
  assert.deepEqual(validateContract(contract), []);
  assert.ok(validateContract({ ...contract, extra: 1 }).includes('contract.extra is not a contract field'));
  assert.ok(validateContract({ ...contract, acceptance_criteria: [] }).some((e) => e.includes('at least one criterion')));
  assert.ok(validateContract({ ...contract, outcome: ' ' }).some((e) => e.includes('outcome')));
});

test('an owner comment naming the current revision approves', () => {
  const r = verifyApproval({ issue, comments: [agentContract(), ownerSays(`stroppers approve ${REV}`)], owners: [OWNER], expectedRevision: REV, workspace: 'ws-1' });
  assert.equal(r.status, 'approved');
  assert.equal(r.actor_id, OWNER);
  assert.deepEqual(r.scope.environments, ['preview']);
});

test('an agent-authored approval through a connector cannot self-authorize', () => {
  const posted = agentContract();
  const forged = ownerSays(`stroppers approve ${REV}`, { botActor: { id: 'app', name: 'Claude', type: 'oauthClient' } });
  const r = verifyApproval({ issue, comments: [posted, forged], owners: [OWNER], expectedRevision: REV });
  assert.equal(r.status, 'pending');
  assert.match(r.considered[0].why, /integration/);
  const behalf = ownerSays(`stroppers approve ${REV}`, { onBehalfOf: { id: OWNER } });
  assert.equal(verifyApproval({ issue, comments: [posted, behalf], owners: [OWNER] }).status, 'pending');
});

test('a non-owner, display-name lookalike or edited comment does not approve', () => {
  const posted = agentContract();
  const cases = [
    [ownerSays(`stroppers approve ${REV}`, { user: { id: 'someone-else', name: 'Owner' } }), /not a configured approval owner/],
    [ownerSays(`stroppers approve ${REV}`, { editedAt: at() }), /edited/],
  ];
  for (const [c, why] of cases) {
    const r = verifyApproval({ issue, comments: [posted, c], owners: [OWNER] });
    assert.equal(r.status, 'pending');
    assert.match(r.considered[0].why, why);
  }
});

test('approval of an older revision is stale and does not authorize the changed contract', () => {
  const old = contractHash({ ...contract, scope: 'smaller' });
  assert.equal(verifyApproval({ issue, comments: [agentContract(), ownerSays(`stroppers approve ${old}`)], owners: [OWNER] }).status, 'stale');
});

test('approval made before the contract was posted does not count', () => {
  const early = ownerSays(`stroppers approve ${REV}`);
  assert.equal(verifyApproval({ issue, comments: [early, agentContract()], owners: [OWNER] }).status, 'pending');
});

test('owner revocation and issue cancellation stop delivery', () => {
  const comments = [agentContract(), ownerSays(`stroppers approve ${REV}`), ownerSays('stroppers revoke')];
  assert.equal(verifyApproval({ issue, comments, owners: [OWNER] }).status, 'revoked');
  assert.equal(verifyApproval({ issue: { ...issue, state_type: 'canceled' }, comments: comments.slice(0, 2), owners: [OWNER] }).status, 'revoked');
});

test('the most recent owner approval is the one reported', () => {
  const posted = agentContract();
  const first = ownerSays(`stroppers approve ${REV}`);
  const second = ownerSays(`stroppers approve ${REV}`);
  assert.equal(verifyApproval({ issue, comments: [posted, first, second], owners: [OWNER] }).event_id, second.id);
});

test('wrong workspace is rejected before approval is considered', () => {
  const r = verifyApproval({ issue: { ...issue, workspace_id: 'ws-2' }, comments: [agentContract(), ownerSays(`stroppers approve ${REV}`)], owners: [OWNER], workspace: 'ws-1' });
  assert.equal(r.status, 'rejected');
});

test('applying the same approval event twice is idempotent and revocation is not undone', () => {
  const cp = newCheckpoint({ binding: { workspace: 'ws-1', team: 'ENG' }, issue, repository: 'acme/shop', runId: 'r1', harness: 'claude-code', mode: 'local', contract });
  const r = verifyApproval({ issue, comments: [agentContract(), ownerSays(`stroppers approve ${REV}`)], owners: [OWNER] });
  assert.equal(applyApproval(cp, r).changed, true);
  assert.equal(applyApproval(cp, r).changed, false);
  applyApproval(cp, { status: 'revoked', reason: 'owner' });
  assert.equal(applyApproval(cp, r).changed, false);
  assert.equal(cp.approval.status, 'revoked');
});

test('delivery actions outside the approved repositories or environments need an extension', () => {
  const cp = newCheckpoint({ binding: { workspace: 'ws-1', team: 'ENG' }, issue, repository: 'acme/shop', runId: 'r1', harness: 'codex', mode: 'cloud', contract });
  const latest = verifyApproval({ issue, comments: [agentContract(), ownerSays(`stroppers approve ${REV}`)], owners: [OWNER] });
  assert.equal(authorizeAction(cp, latest, { action: 'deploy', repository: 'acme/shop', environment: 'preview' }).ok, true);
  assert.match(authorizeAction(cp, latest, { action: 'deploy', environment: 'production' }).reason, /scope extension/);
  assert.match(authorizeAction(cp, latest, { action: 'merge', repository: 'acme/other' }).reason, /outside the approved repositories/);
});

test('checkpoint survives render/parse and keeps counters across a harness switch', () => {
  const config = { recovery: { fix_cycles: 3, infra_retries: 2, infra_backoff_seconds: [10, 60] } };
  const cp = newCheckpoint({ binding: { workspace: 'ws-1', team: 'ENG' }, issue, repository: 'acme/shop', runId: 'r1', harness: 'claude-code', mode: 'local', contract });
  recordAttempt(cp, 'test-failure:checkout', 'fix', config);
  recordAttempt(cp, 'test-failure:checkout', 'fix', config);
  const resumed = parse(render(cp));
  resumed.execution.harness = 'codex';
  const third = recordAttempt(resumed, 'test-failure:checkout', 'fix', config);
  assert.equal(third.escalate, true);
  assert.equal(resumed.stage, 'blocked');
  assert.deepEqual(resumed.counters['test-failure:checkout'].attempts.map((a) => a.harness), ['claude-code', 'claude-code', 'codex']);
});

test('infrastructure retries back off and are budgeted separately from fix cycles', () => {
  const config = { recovery: { fix_cycles: 3, infra_retries: 2, infra_backoff_seconds: [10, 60] } };
  const cp = newCheckpoint({ binding: { workspace: 'w', team: 't' }, issue, repository: 'a/b', runId: 'r', harness: 'codex', mode: 'local', contract });
  assert.equal(recordAttempt(cp, 'npm-registry', 'infra', config).retry_after_seconds, 10);
  assert.equal(recordAttempt(cp, 'npm-registry', 'infra', config).retry_after_seconds, 60);
  assert.equal(recordAttempt(cp, 'npm-registry', 'infra', config).escalate, true);
  assert.equal(cp.counters['npm-registry'].fix, 0);
});

test('external actions are journaled; a completed action is a duplicate and an unknown one is reconciled', () => {
  const cp = newCheckpoint({ binding: { workspace: 'w', team: 't' }, issue, repository: 'a/b', runId: 'r', harness: 'codex', mode: 'local', contract });
  const merge = intend(cp, { kind: 'merge', key: 'pr-7@abc123' });
  assert.equal(merge.duplicate, false);
  const resumed = parse(render(cp));
  assert.deepEqual(pendingActions(resumed).map((a) => a.id), ['merge:pr-7@abc123']);
  assert.equal(intend(resumed, { kind: 'merge', key: 'pr-7@abc123' }).reconcile, true);
  complete(resumed, 'merge:pr-7@abc123', { merge_commit: 'def456' });
  assert.equal(intend(resumed, { kind: 'merge', key: 'pr-7@abc123' }).duplicate, true);
});

test('a changed head makes earlier pre-merge outcomes stale so they cannot count as passing', () => {
  const cp = newCheckpoint({ binding: { workspace: 'w', team: 't' }, issue, repository: 'a/b', runId: 'r', harness: 'codex', mode: 'local', contract });
  cp.verification_plan = [{ criterion_id: 'AC1', stage: 'pre-merge', method: 'unit test' }];
  setHead(cp, 'aaa');
  recordOutcome(cp, 'AC1', { status: 'passed', revision: 'aaa' });
  assert.equal(acceptanceSummary(cp, { phase: 'pre-merge' }).ok, true);
  setHead(cp, 'bbb');
  assert.deepEqual(acceptanceSummary(cp, { phase: 'pre-merge' }).missing, ['AC1']);
  assert.throws(() => recordOutcome(cp, 'AC1', { status: 'unverified', revision: 'bbb' }), /needs a reason/);
  recordOutcome(cp, 'AC1', { status: 'unverified', reason: 'browser unavailable', revision: 'bbb' });
  assert.deepEqual(acceptanceSummary(cp, { phase: 'pre-merge' }).unverified, ['AC1']);
});

test('a second session is refused while another holds the lease', () => {
  const cp = newCheckpoint({ binding: { workspace: 'w', team: 't' }, issue, repository: 'a/b', runId: 'r', harness: 'codex', mode: 'local', contract });
  assert.equal(acquireLease(cp, 'session-a').ok, true);
  assert.equal(acquireLease(cp, 'session-b').ok, false);
  assert.equal(acquireLease(cp, 'session-b', { at: new Date(Date.now() + 3 * 3600000) }).ok, true);
});

test('a session that stops gives up its lease so the next one can continue', async () => {
  const { setStage } = await import('../plugins/stroppers/lib/checkpoint.mjs');
  const cp = newCheckpoint({ binding: { workspace: 'w', team: 't' }, issue, repository: 'a/b', runId: 'r', harness: 'codex', mode: 'local', contract });
  acquireLease(cp, 'session-a');
  setStage(cp, 'blocked', 'waiting for owner');
  assert.equal(cp.execution.lease, null);
  const stale = parse(render(cp));
  stale.execution.lease = { holder: 'session-a', expires_at: new Date(Date.now() + 3600000).toISOString() };
  assert.equal(acquireLease(stale, 'session-b').ok, true, 'a lease on a stopped checkpoint is free');
});

test('equal issue keys in different workspaces or repositories have distinct task keys', () => {
  const mk = (workspace, repository) => newCheckpoint({ binding: { workspace, team: 'ENG' }, issue, repository, runId: 'r', harness: 'codex', mode: 'local', contract });
  assert.notEqual(taskKey(mk('ws-a', 'acme/a')), taskKey(mk('ws-b', 'acme/a')));
  assert.notEqual(taskKey(mk('ws-a', 'acme/a')), taskKey(mk('ws-a', 'acme/b')));
});

function fakeLinear(org, issueData) {
  return async (_url, req) => {
    const { query } = JSON.parse(req.body);
    const data = query.includes('organization') ? { viewer: { id: 'v' }, organization: org } : { issue: issueData };
    return { status: 200, json: async () => ({ data }) };
  };
}

test('fetchIssue refuses a credential that authenticates to a different workspace', async () => {
  const config = { linear: { workspace: 'acme', team: 'ENG', credential_env: 'K' } };
  await assert.rejects(fetchIssue(config, 'ENG-1', { K: 'x' }, fakeLinear({ id: 'o2', urlKey: 'other' }, null)), /bound to acme/);
  await assert.rejects(fetchIssue(config, 'ENG-1', {}, fakeLinear({ id: 'o1', urlKey: 'acme' }, null)), LinearError);
  const issueData = { id: 'i', identifier: 'OPS-1', team: { key: 'OPS' }, state: { type: 'started', name: 'In Progress' }, comments: { nodes: [] } };
  await assert.rejects(fetchIssue(config, 'OPS-1', { K: 'x' }, fakeLinear({ id: 'o1', urlKey: 'acme' }, issueData)), /not the bound team ENG/);
});

test('an owner verification key is a blocker only when it can write', async () => {
  const { credentialRisk } = await import('../plugins/stroppers/lib/linear.mjs');
  const reply = (message) => async () => ({ status: 200, json: async () => ({ errors: [{ message }] }) });
  const config = { linear: { credential_env: 'K' } };
  const env = { K: 'x' };
  assert.equal(await credentialRisk(config, env, { viewer_id: OWNER }, [OWNER], reply('Invalid scope: `write` or `issues:create` required')), null);
  assert.match(await credentialRisk(config, env, { viewer_id: OWNER }, [OWNER], reply('Entity not found: Issue')), /can write as an approval owner/);
  assert.equal(await credentialRisk(config, env, { viewer_id: 'service' }, [OWNER], reply('Entity not found: Issue')), null);
});

function fakeLinearApi({ viewer = { id: 'agent-app', app: true }, org = { id: 'o1', urlKey: 'acme' }, comments = [] } = {}) {
  const calls = [];
  const fn = async (url, req) => {
    calls.push({ url, auth: req.headers?.Authorization, body: req.body });
    if (url.endsWith('/oauth/token')) return { ok: true, status: 200, json: async () => ({ access_token: 'app-token', expires_in: 2592000 }) };
    const { query, variables } = JSON.parse(req.body);
    let data;
    if (query.includes('organization')) data = { viewer, organization: org };
    else if (query.includes('commentUpdate')) data = { commentUpdate: { success: true, comment: { id: variables.id, url: 'u' } } };
    else if (query.includes('commentCreate')) data = { commentCreate: { success: true, comment: { id: 'new', url: 'u' } } };
    else data = { issue: { id: 'i1', team: { key: 'ENG' }, comments: { nodes: comments } } };
    return { ok: true, status: 200, json: async () => ({ data }) };
  };
  return { fn, calls };
}

test('agent writes use an app token minted from client credentials and cached privately', async () => {
  const { agentToken } = await import('../plugins/stroppers/lib/linear.mjs');
  const { tempDir } = await import('./helpers.mjs');
  const { statSync } = await import('node:fs');
  const config = { linear: { agent_client_id_env: 'CID', agent_client_secret_env: 'CSEC' } };
  const dir = tempDir();
  const api = fakeLinearApi();
  assert.equal(await agentToken(config, { CID: 'id', CSEC: 's' }, dir, api.fn), 'app-token');
  assert.equal(await agentToken(config, { CID: 'id', CSEC: 's' }, dir, api.fn), 'app-token');
  assert.equal(api.calls.filter((c) => c.url.endsWith('/oauth/token')).length, 1, 'second call uses the cache');
  assert.match(api.calls[0].body, /grant_type=client_credentials/);
  assert.equal(statSync(`${dir}/linear-agent-token.json`).mode & 0o777, 0o600);
});

test('an agent credential that acts as a person or an owner is refused', async () => {
  const { checkAgent } = await import('../plugins/stroppers/lib/linear.mjs');
  const { tempDir } = await import('./helpers.mjs');
  const config = { linear: { workspace: 'acme', agent_client_id_env: 'CID', agent_client_secret_env: 'CSEC' } };
  await assert.rejects(checkAgent(config, { CID: 'id', CSEC: 's' }, tempDir(), [], fakeLinearApi({ viewer: { id: 'u', app: false } }).fn), /acts as a person/);
  await assert.rejects(checkAgent(config, { CID: 'id', CSEC: 's' }, tempDir(), [], fakeLinearApi({ org: { id: 'o2', urlKey: 'other' } }).fn), /bound to acme/);
});

test('the checkpoint comment is updated in place; other comments are new', async () => {
  const { upsertComment } = await import('../plugins/stroppers/lib/linear.mjs');
  const { tempDir } = await import('./helpers.mjs');
  const config = { linear: { workspace: 'acme', team: 'ENG', agent_client_id_env: 'CID', agent_client_secret_env: 'CSEC' }, authority: { owners: [{ linear_user_id: OWNER }] } };
  const comments = [{ id: 'cp1', body: '<!-- stroppers:checkpoint v1 -->\nold', user: { id: 'agent-app' } }, { id: 'h1', body: '<!-- stroppers:checkpoint v1 -->\nforged by a person', user: { id: OWNER } }];
  const api = fakeLinearApi({ comments });
  const r = await upsertComment(config, { CID: 'id', CSEC: 's' }, tempDir(), 'ENG-1', '<!-- stroppers:checkpoint v1 -->\nnew', { marker: '<!-- stroppers:checkpoint v1 -->', fetchImpl: api.fn });
  assert.deepEqual([r.action, r.id], ['updated', 'cp1']);
  assert.ok(api.calls.every((c) => c.url.endsWith('/oauth/token') || c.auth === 'Bearer app-token'));
  const created = await upsertComment(config, { CID: 'id', CSEC: 's' }, tempDir(), 'ENG-1', 'evidence', { fetchImpl: api.fn });
  assert.equal(created.action, 'created');
});
