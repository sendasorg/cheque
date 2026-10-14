// Read-only Linear access for approval verification and checkpoint recovery.
// Uses one credential named by config (`linear.credential_env`); a read-only
// key is recommended so this path can never author an approval. Agent writes
// (contract, checkpoint, evidence comments) go through the harness's Linear
// connector, which Linear attributes to an integration.

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
  return { workspace_id: data.organization.id, workspace_key: data.organization.urlKey };
}

const ISSUE = `query($id: String!) {
  issue(id: $id) {
    id identifier
    team { key }
    state { type name }
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
    issue: { id: data.issue.id, key: data.issue.identifier, workspace_id: binding.workspace_id, state_type: data.issue.state.type, state: data.issue.state.name },
    comments,
  };
}
