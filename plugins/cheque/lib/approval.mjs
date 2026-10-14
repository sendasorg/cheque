// Approval verification against the bound Linear workspace. Authority comes
// only from an owner's own, unedited comment that names the exact contract
// revision, made after the contract was posted. Bot or integration authored
// writes (which is how agents write through connectors) never count.
import { contractHash, parseContract, CONTRACT_MARKER } from './checkpoint.mjs';

const APPROVE = /^\s*cheque approve (sha256:[0-9a-f]{64})\s*$/i;
const REVOKE = /^\s*cheque revoke\b/i;
const EXTEND = /^\s*cheque extend (sha256:[0-9a-f]{64})\s*$/i;

function authorIsOwner(comment, owners) {
  if (comment.botActor) return { ok: false, why: `written by an integration (${comment.botActor.name || comment.botActor.type || 'bot'}), not directly by a person` };
  if (comment.onBehalfOf) return { ok: false, why: 'written by an agent on behalf of a user' };
  if (!comment.user?.id) return { ok: false, why: 'no authenticated author' };
  if (!owners.includes(comment.user.id)) return { ok: false, why: `author ${comment.user.id} is not a configured approval owner` };
  return { ok: true };
}

// `comments` must come from the API for the bound workspace, oldest first, with
// id, body, createdAt, editedAt, user { id }, botActor and onBehalfOf.
export function verifyApproval({ issue, comments, owners, expectedRevision, workspace }) {
  const considered = [];
  if (!owners?.length) return { status: 'rejected', reason: 'no approval owners configured', considered };
  if (workspace && issue.workspace_id !== workspace)
    return { status: 'rejected', reason: `issue belongs to workspace ${issue.workspace_id}, not the bound workspace ${workspace}`, considered };
  if (issue.state_type === 'canceled') return { status: 'revoked', reason: 'issue is canceled', considered };

  const contracts = comments.filter((c) => c.body?.startsWith(CONTRACT_MARKER));
  const contractComment = contracts.at(-1);
  if (!contractComment) return { status: 'pending', reason: 'no delivery contract has been posted on the issue', considered };
  const contract = parseContract(contractComment.body);
  const revision = contractHash(contract);
  if (expectedRevision && revision !== expectedRevision)
    return { status: 'stale', reason: `posted contract is ${revision}, checkpoint expects ${expectedRevision}`, considered };

  let approval = null;
  let extensions = [];
  for (const c of comments) {
    if (new Date(c.createdAt) <= new Date(contractComment.createdAt) && c.id !== contractComment.id && !REVOKE.test(c.body || '')) continue;
    const approve = (c.body || '').match(APPROVE);
    const extend = (c.body || '').match(EXTEND);
    const revoke = REVOKE.test(c.body || '');
    if (!approve && !revoke && !extend) continue;
    const author = authorIsOwner(c, owners);
    if (!author.ok) {
      considered.push({ id: c.id, accepted: false, why: author.why });
      continue;
    }
    if (c.editedAt) {
      considered.push({ id: c.id, accepted: false, why: 'comment was edited after it was posted' });
      continue;
    }
    if (revoke && approval && new Date(c.createdAt) > new Date(approval.createdAt)) {
      considered.push({ id: c.id, accepted: true, why: 'revocation' });
      return { status: 'revoked', reason: `revoked by owner in comment ${c.id}`, event_id: c.id, considered };
    }
    if (approve) {
      if (approve[1] !== revision) {
        considered.push({ id: c.id, accepted: false, why: `approves ${approve[1]}, current contract is ${revision}` });
        continue;
      }
      considered.push({ id: c.id, accepted: true, why: 'owner approval of current revision' });
      approval = c; // the latest valid owner approval is the one reported
    }
    if (extend) {
      // An extension approves the widened revision now on the issue, with the
      // same authorship, ordering and edit checks as an approval.
      if (extend[1] !== revision) {
        considered.push({ id: c.id, accepted: false, why: `extends ${extend[1]}, current contract is ${revision}` });
        continue;
      }
      considered.push({ id: c.id, accepted: true, why: 'owner scope extension of current revision' });
      extensions.push(c.id);
      approval = c;
    }
  }

  if (contractComment.editedAt && approval && new Date(contractComment.editedAt) > new Date(approval.createdAt))
    return { status: 'stale', reason: 'the contract comment was edited after approval', considered };
  if (!approval) {
    const stale = considered.some((c) => /approves sha256/.test(c.why));
    return { status: stale ? 'stale' : 'pending', reason: stale ? 'approval names a different contract revision' : 'waiting for an owner to approve the posted contract', contract_revision: revision, considered };
  }
  return {
    status: 'approved',
    event_id: approval.id,
    actor_id: approval.user.id,
    approved_at: approval.createdAt,
    contract_revision: revision,
    scope: { repositories: contract.repositories, environments: contract.environments, exceptions: contract.exceptions },
    extensions,
    considered,
  };
}

// Applies a verification result to the checkpoint idempotently. A repeated
// event id is a no-op; a different approval for the same revision keeps the first.
export function applyApproval(cp, result) {
  if (result.status === 'approved') {
    if (cp.approval.status === 'approved' && cp.approval.event_id === result.event_id) return { changed: false };
    if (cp.approval.status === 'revoked') return { changed: false, reason: 'revoked approvals are not reinstated; post a new contract revision' };
    if (result.contract_revision !== cp.contract.revision) return { changed: false, reason: 'approval is for a different contract revision' };
    cp.approval = { status: 'approved', actor_id: result.actor_id, event_id: result.event_id, approved_at: result.approved_at, contract_revision: result.contract_revision, scope: result.scope };
    return { changed: true };
  }
  if (['revoked', 'stale'].includes(result.status) && cp.approval.status !== result.status) {
    cp.approval = { ...cp.approval, status: result.status, reason: result.reason };
    return { changed: true };
  }
  return { changed: false };
}

// Gate before any delivery action (PR, merge, deploy). Rechecked immediately
// before the action against the latest verification, never cached.
// Every delivery action names the target it touches. Unknown actions and
// missing targets are refused.
const ACTION_TARGETS = Object.assign(Object.create(null), { 'publish-pr': 'repository', merge: 'repository', deploy: 'environment', 'configure-environment': 'environment' });

export function authorizeAction(cp, latest, { action, repository, environment, authority = {} }) {
  const needs = Object.hasOwn(ACTION_TARGETS, action) ? ACTION_TARGETS[action] : null;
  if (!needs) return { ok: false, reason: `unknown action "${action}"; authorizable actions are ${Object.keys(ACTION_TARGETS).join(', ')}` };
  if (needs === 'repository' && !repository) return { ok: false, reason: `${action} needs --repository` };
  if (needs === 'environment' && !environment) return { ok: false, reason: `${action} needs --environment` };
  if (latest.status !== 'approved') return { ok: false, reason: `approval is ${latest.status}: ${latest.reason}` };
  if (latest.contract_revision !== cp.contract.revision) return { ok: false, reason: 'approval does not match the checkpoint contract' };
  // A target must be inside both the owner-approved contract and the
  // operator's private authority; approval never widens the operator's limits.
  if (repository && !latest.scope.repositories.includes(repository)) return { ok: false, reason: `${repository} is outside the approved repositories; request a scope extension` };
  if (repository && !(authority.repositories || []).includes(repository)) return { ok: false, reason: `${repository} is outside the operator's authority.repositories` };
  if (environment && !latest.scope.environments.includes(environment)) return { ok: false, reason: `${environment} is outside the approved environments; request a scope extension` };
  if (environment && !(authority.environments || []).includes(environment)) return { ok: false, reason: `${environment} is outside the operator's authority.environments` };
  return { ok: true, action };
}
