// Linear access. Reads (approval verification, checkpoint recovery) use the
// read-only key named by `linear.credential_env`. Writes (contract, checkpoint,
// evidence, status) use the Cheque OAuth app further below, never a
// connector or a personal key, so no agent write can pass as an owner's.

import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';

const ENDPOINT = 'https://api.linear.app/graphql';

export class LinearError extends Error {}

export async function gql(token, query, variables = {}, fetchImpl = fetch) {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401 || body.errors?.some((e) => e.extensions?.code === 'AUTHENTICATION_ERROR'))
    throw new LinearError('Linear rejected the credential; check the variable named by linear.credential_env');
  if (body.errors?.length) throw new LinearError(body.errors.map((e) => e.message).join('; '));
  return body.data;
}

export function credential(config, env = process.env) {
  const name = config.linear?.credential_env;
  if (!name) throw new LinearError('linear.credential_env is not configured');
  if (!env[name]) throw new LinearError(`${name} is not set in this session; provision a read-only Linear API key under that name`);
  return env[name];
}

// Confirms the credential authenticates into the bound workspace before any
// issue operation. Never falls back to whichever account is signed in.
export async function checkBinding(config, env, fetchImpl) {
  const data = await gql(credential(config, env), '{ viewer { id } organization { id urlKey name } }', {}, fetchImpl);
  const want = config.linear.workspace;
  if (data.organization.id !== want && data.organization.urlKey !== want)
    throw new LinearError(`credential authenticates to workspace ${data.organization.urlKey}, but this repository is bound to ${want}`);
  return { workspace_id: data.organization.id, workspace_key: data.organization.urlKey, viewer_id: data.viewer.id };
}

// Whether the verification key can write. Linear checks scopes before it
// resolves the target, so an update of a nonexistent issue answers "Invalid
// scope" for a read-only key and "Entity not found" for a writable one, with no
// side effect either way.
export async function keyCanWrite(config, env, fetchImpl = fetch) {
  const res = await fetchImpl(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: credential(config, env) },
    body: JSON.stringify({ query: 'mutation { issueUpdate(id: "00000000-0000-0000-0000-000000000000", input: { priority: 4 }) { success } }' }),
  });
  const message = ((await res.json().catch(() => ({}))).errors || []).map((e) => e.message).join(' ');
  if (/invalid scope/i.test(message)) return false;
  if (/not found/i.test(message)) return true;
  throw new LinearError(`could not determine whether the verification key is read-only (${message || res.status})`);
}

// A writable verification key that authenticates as an approval owner could
// write an approval as that owner with no integration attribution, so
// approvals cannot be trusted while such a key is in the session.
export async function credentialRisk(config, env, binding, owners, fetchImpl) {
  if (!owners.includes(binding.viewer_id)) return null;
  if (!(await keyCanWrite(config, env, fetchImpl))) return null;
  return `the Linear verification key (${config.linear.credential_env}) can write as an approval owner; replace it with a read-only key before relying on approvals`;
}

const ISSUE = `query($id: String!) {
  issue(id: $id) {
    id identifier title description url
    team { key }
    state { type name }
    project { name }
    comments(first: 250, orderBy: createdAt) {
      nodes { id body createdAt editedAt user { id } botActor { id name type } onBehalfOf { id } }
    }
  }
}`;

export async function fetchIssue(config, issueKey, env, fetchImpl) {
  const binding = await checkBinding(config, env, fetchImpl);
  const data = await gql(credential(config, env), ISSUE, { id: issueKey }, fetchImpl);
  if (!data.issue) throw new LinearError(`issue ${issueKey} was not found in workspace ${binding.workspace_key}`);
  if (config.linear.team && data.issue.team.key !== config.linear.team)
    throw new LinearError(`issue ${issueKey} belongs to team ${data.issue.team.key}, not the bound team ${config.linear.team}`);
  const comments = [...data.issue.comments.nodes].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return {
    issue: { id: data.issue.id, key: data.issue.identifier, title: data.issue.title, description: data.issue.description, url: data.issue.url, project: data.issue.project?.name || null, workspace_id: binding.workspace_id, state_type: data.issue.state.type, state: data.issue.state.name },
    comments,
  };
}

// Agent writes. Cheque writes to Linear only as its own OAuth application
// (client credentials, actor=app), so every agent-written comment is
// attributed to the app and can never pass as an owner's approval. The token
// is minted on demand, cached in ignored state and never printed.

const TOKEN_URL = 'https://api.linear.app/oauth/token';

export async function agentToken(config, env, stateDir, fetchImpl = fetch) {
  const id = env[config.linear?.agent_client_id_env];
  const secret = env[config.linear?.agent_client_secret_env];
  if (!id || !secret) throw new LinearError(`${config.linear?.agent_client_id_env} and ${config.linear?.agent_client_secret_env} must be set to write to Linear as the Cheque agent`);
  const cache = join(stateDir, 'linear-agent-token.json');
  if (existsSync(cache)) {
    const c = JSON.parse(readFileSync(cache, 'utf8'));
    if (c.client === id && c.expires_at > Date.now() + 3600000) return c.token;
  }
  const res = await fetchImpl(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret, scope: 'read,write' }).toString(),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.access_token) throw new LinearError(`Linear did not issue an agent token (${res.status} ${body.error || ''}); check the app's client credentials setting`);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(cache, JSON.stringify({ client: id, token: body.access_token, expires_at: Date.now() + (body.expires_in || 0) * 1000 }));
  chmodSync(cache, 0o600);
  return body.access_token;
}

// Confirms the agent token acts in the bound workspace and is not an owner.
export async function checkAgent(config, env, stateDir, owners = [], fetchImpl) {
  const token = await agentToken(config, env, stateDir, fetchImpl);
  const data = await gql(`Bearer ${token}`, '{ viewer { id app } organization { id urlKey } }', {}, fetchImpl);
  const want = config.linear.workspace;
  if (data.organization.id !== want && data.organization.urlKey !== want)
    throw new LinearError(`agent app is installed in workspace ${data.organization.urlKey}, but this repository is bound to ${want}`);
  if (owners.includes(data.viewer.id) || !data.viewer.app) throw new LinearError('the agent credential acts as a person, not as the Cheque app; recreate it with actor=app');
  return { token, agent_id: data.viewer.id };
}

// Creates a comment, or updates the agent's own earlier comment that starts
// with the same marker (checkpoint and evidence comments are kept in place).
export async function upsertComment(config, env, stateDir, issueKey, body, { marker = null, repository = null, fetchImpl } = {}) {
  const { token, agent_id } = await checkAgent(config, env, stateDir, (config.authority?.owners || []).map((o) => o.linear_user_id), fetchImpl);
  const auth = `Bearer ${token}`;
  const found = await gql(auth, `query($id: String!) { issue(id: $id) { id team { key } comments(first: 250) { nodes { id body user { id } } } } }`, { id: issueKey }, fetchImpl);
  if (!found.issue) throw new LinearError(`issue ${issueKey} not found in the bound workspace`);
  if (config.linear.team && found.issue.team.key !== config.linear.team) throw new LinearError(`issue ${issueKey} is not in the bound team ${config.linear.team}`);
  // Each repository keeps its own checkpoint comment on a shared issue.
  const mine = marker && found.issue.comments.nodes.find((c) => c.user?.id === agent_id && c.body.startsWith(marker) && (!repository || c.body.includes(`"repository": "${repository}"`)));
  if (mine) {
    const r = await gql(auth, 'mutation($id: String!, $body: String!) { commentUpdate(id: $id, input: { body: $body }) { success comment { id url } } }', { id: mine.id, body }, fetchImpl);
    return { action: 'updated', ...r.commentUpdate.comment };
  }
  const r = await gql(auth, 'mutation($issueId: String!, $body: String!) { commentCreate(input: { issueId: $issueId, body: $body }) { success comment { id url } } }', { issueId: found.issue.id, body }, fetchImpl);
  return { action: 'created', ...r.commentCreate.comment };
}

export async function setIssueState(config, env, stateDir, issueKey, stateName, fetchImpl) {
  const { token } = await checkAgent(config, env, stateDir, (config.authority?.owners || []).map((o) => o.linear_user_id), fetchImpl);
  const auth = `Bearer ${token}`;
  const found = await gql(auth, `query($id: String!) { issue(id: $id) { id team { key states { nodes { id name type } } } } }`, { id: issueKey }, fetchImpl);
  if (!found.issue) throw new LinearError(`issue ${issueKey} not found in the bound workspace`);
  if (config.linear.team && found.issue.team.key !== config.linear.team) throw new LinearError(`issue ${issueKey} is not in the bound team ${config.linear.team}`);
  const state = found.issue?.team.states.nodes.find((s) => s.name.toLowerCase() === stateName.toLowerCase());
  if (!state) throw new LinearError(`team ${found.issue?.team.key} has no status named "${stateName}" (available: ${found.issue?.team.states.nodes.map((s) => s.name).join(', ')})`);
  await gql(auth, 'mutation($id: String!, $stateId: String!) { issueUpdate(id: $id, input: { stateId: $stateId }) { success } }', { id: found.issue.id, stateId: state.id }, fetchImpl);
  return { state: state.name, type: state.type };
}

// The authoritative checkpoint for this repository: the latest checkpoint
// comment written by the Cheque app itself (not by a person or another
// integration) whose task names this repository.
export async function latestCheckpointComment(config, env, stateDir, issueKey, repository, fetchImpl) {
  const { agent_id } = await checkAgent(config, env, stateDir, (config.authority?.owners || []).map((o) => o.linear_user_id), fetchImpl);
  const { comments } = await fetchIssue(config, issueKey, env, fetchImpl);
  const mine = comments.filter((c) => c.user?.id === agent_id && c.body.startsWith('<!-- cheque:checkpoint v1 -->') && c.body.includes(`"repository": "${repository}"`));
  return mine.at(-1) || null;
}
