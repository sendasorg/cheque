// Portable delivery checkpoint (schema stroppers.checkpoint/v1). The
// authoritative copy lives in a marked comment on the bound Linear issue; the
// ignored `.stroppers/state/` copy is a cache rebuilt from it on continuation.
import { createHash } from 'node:crypto';

export const SCHEMA = 'stroppers.checkpoint/v1';
export const MARKER = '<!-- stroppers:checkpoint v1 -->';
export const CONTRACT_MARKER = '<!-- stroppers:contract v1 -->';
export const OUTCOMES = ['passed', 'failed', 'not-applicable', 'unverified'];
export const STAGES = ['contract', 'awaiting-approval', 'planning', 'implementing', 'reviewing', 'pull-request', 'merging', 'deploying', 'live-acceptance', 'delivered', 'blocked', 'revoked'];

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(',')}}`;
  return JSON.stringify(value);
}

export function contractHash(contract) {
  return `sha256:${createHash('sha256').update(canonical(contract)).digest('hex')}`;
}

const CONTRACT_KEYS = ['issue', 'outcome', 'acceptance_criteria', 'scope', 'repositories', 'environments', 'deployment', 'recovery', 'exceptions'];

export function validateContract(c) {
  const errors = [];
  for (const k of CONTRACT_KEYS) if (!(k in (c || {}))) errors.push(`contract.${k} is missing`);
  if (c && !Array.isArray(c.acceptance_criteria)) errors.push('contract.acceptance_criteria must be a list');
  else c?.acceptance_criteria?.forEach((a, i) => {
    if (!a.id || !a.criterion) errors.push(`contract.acceptance_criteria[${i}] needs id and criterion`);
  });
  for (const k of Object.keys(c || {})) if (!CONTRACT_KEYS.includes(k)) errors.push(`contract.${k} is not a contract field`);
  return errors;
}

export function newCheckpoint({ binding, issue, repository, runId, harness, mode, contract }) {
  return {
    schema: SCHEMA,
    task: { workspace_id: binding.workspace, team: binding.team, issue_id: issue.id, issue_key: issue.key, repository },
    run_id: runId,
    contract: { revision: contractHash(contract), snapshot: contract },
    approval: { status: 'pending', actor_id: null, event_id: null, approved_at: null, contract_revision: null, scope: null },
    stage: 'contract',
    blocked_reason: null,
    revision: { base: null, head: null, pr: null, deployed_artifact: null },
    execution: { harness, mode, implementer: null, lease: null },
    verification_plan: [],
    outcomes: {},
    reviews: [],
    findings: [],
    counters: {},
    evidence: [],
    actions: [],
    history: [{ at: now(), event: 'created', harness, mode }],
  };
}

function now() {
  return new Date().toISOString();
}

// Task identity includes the workspace, so equal issue keys in different
// workspaces or repositories never resolve to the same record.
export function taskKey(cp) {
  return `${cp.task.workspace_id}/${cp.task.issue_id}@${cp.task.repository}`;
}

export function render(cp) {
  return `${MARKER}\n**Stroppers checkpoint** · stage \`${cp.stage}\`${cp.blocked_reason ? ` · blocked: ${cp.blocked_reason}` : ''} · head \`${cp.revision.head?.slice(0, 12) || 'none'}\`\n\n\`\`\`json\n${JSON.stringify(cp, null, 2)}\n\`\`\`\n`;
}

export function renderContract(contract) {
  return `${CONTRACT_MARKER}\n**Stroppers delivery contract** · revision \`${contractHash(contract)}\`\n\nTo approve autonomous delivery of exactly this contract, the approval owner comments:\n\n    stroppers approve ${contractHash(contract)}\n\nTo revoke later: \`stroppers revoke\`.\n\n\`\`\`json\n${JSON.stringify(contract, null, 2)}\n\`\`\`\n`;
}

function fencedJson(body) {
  const m = body.match(/```json\n([\s\S]*?)\n```/);
  return m ? JSON.parse(m[1]) : null;
}

export function parse(body) {
  if (!body.startsWith(MARKER)) return null;
  const cp = fencedJson(body);
  if (cp?.schema !== SCHEMA) throw new Error(`unsupported checkpoint schema ${cp?.schema}; checkpoint the run and migrate before continuing`);
  return cp;
}

export function parseContract(body) {
  if (!body.startsWith(CONTRACT_MARKER)) return null;
  return fencedJson(body);
}

export function setStage(cp, stage, blockedReason = null) {
  if (!STAGES.includes(stage)) throw new Error(`unknown stage ${stage}`);
  cp.stage = stage;
  cp.blocked_reason = stage === 'blocked' ? blockedReason || 'unspecified' : null;
  cp.history.push({ at: now(), event: 'stage', stage, reason: cp.blocked_reason });
  return cp;
}

// Moving to a new head invalidates review and pre-merge evidence for the old one.
export function setHead(cp, head) {
  if (cp.revision.head && cp.revision.head !== head) {
    for (const o of Object.values(cp.outcomes)) if (o.revision && o.revision !== head && o.stage !== 'post-deploy') o.stale = true;
    cp.history.push({ at: now(), event: 'head-changed', from: cp.revision.head, to: head });
  }
  cp.revision.head = head;
  return cp;
}

export function recordOutcome(cp, criterionId, { status, reason = null, revision, evidence = [], stage = 'pre-merge' }) {
  if (!OUTCOMES.includes(status)) throw new Error(`outcome must be one of ${OUTCOMES.join(', ')}`);
  if (status !== 'passed' && !reason) throw new Error(`a ${status} outcome needs a reason`);
  if (!cp.verification_plan.some((p) => p.criterion_id === criterionId)) throw new Error(`criterion ${criterionId} is not in the verification plan`);
  cp.outcomes[criterionId] = { status, reason, revision, evidence, stage, at: now() };
  return cp;
}

// Readiness and completion are computed, never asserted: an unverified or
// stale required criterion cannot be reported as passing.
export function acceptanceSummary(cp, { phase }) {
  const relevant = cp.verification_plan.filter((p) => (phase === 'pre-merge' ? p.stage === 'pre-merge' : true));
  const missing = [];
  const failed = [];
  const unverified = [];
  for (const p of relevant) {
    const o = cp.outcomes[p.criterion_id];
    if (!o || o.stale) missing.push(p.criterion_id);
    else if (o.status === 'failed') failed.push(p.criterion_id);
    else if (o.status === 'unverified') unverified.push(p.criterion_id);
  }
  const ok = !missing.length && !failed.length && !unverified.length;
  return { phase, ok, missing, failed, unverified };
}

// External actions are journaled before they run and completed with the
// identifier the provider returned. A resumed run reconciles every action that
// is still `intended` before retrying it.
export function intend(cp, { kind, key, detail = {} }) {
  const id = `${kind}:${key}`;
  const existing = cp.actions.find((a) => a.id === id);
  if (existing?.status === 'completed') return { duplicate: true, action: existing };
  if (existing) return { duplicate: false, reconcile: true, action: existing };
  const action = { id, kind, detail, status: 'intended', intended_at: now(), result: null };
  cp.actions.push(action);
  return { duplicate: false, action };
}

export function complete(cp, id, result) {
  const a = cp.actions.find((x) => x.id === id);
  if (!a) throw new Error(`no intended action ${id}`);
  Object.assign(a, { status: 'completed', completed_at: now(), result });
  return a;
}

export function pendingActions(cp) {
  return cp.actions.filter((a) => a.status === 'intended');
}

// Retry budgets per blocker. Fix cycles (a proposed fix plus its verification)
// and infrastructure retries are counted separately; both survive serialization,
// harness switches and restarts because they live in the checkpoint.
export function recordAttempt(cp, blockerId, kind, config, note = '') {
  if (!['fix', 'infra'].includes(kind)) throw new Error('kind must be fix or infra');
  const c = (cp.counters[blockerId] ||= { fix: 0, infra: 0, attempts: [] });
  c[kind] += 1;
  c.attempts.push({ at: now(), kind, note, harness: cp.execution.harness });
  const limit = kind === 'fix' ? config.recovery.fix_cycles : config.recovery.infra_retries;
  const backoff = config.recovery.infra_backoff_seconds;
  if (c[kind] >= limit + (kind === 'infra' ? 1 : 0)) {
    setStage(cp, 'blocked', `${blockerId}: ${c[kind]} unsuccessful ${kind === 'fix' ? 'fix-and-verify cycles' : 'infrastructure retries'}; escalate`);
    return { escalate: true, count: c[kind] };
  }
  return { escalate: false, count: c[kind], retry_after_seconds: kind === 'infra' ? backoff[Math.min(c.infra - 1, backoff.length - 1)] : 0 };
}

// Single-active-session mode. Linear comments are not an atomic lock, so this
// lease detects competing sessions and refuses to proceed; it does not claim
// distributed mutual exclusion.
export function acquireLease(cp, holder, { ttlMinutes = 120, at = new Date() } = {}) {
  const lease = cp.execution.lease;
  if (lease && lease.holder !== holder && new Date(lease.expires_at) > at)
    return { ok: false, reason: `another session (${lease.holder}) holds this delivery until ${lease.expires_at}` };
  cp.execution.lease = { holder, acquired_at: at.toISOString(), expires_at: new Date(at.getTime() + ttlMinutes * 60000).toISOString() };
  return { ok: true };
}
