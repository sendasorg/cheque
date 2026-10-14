// Harness routing: which harness runs each step and which one reviews.
// The registry is the `adapters` config map; each entry names a built-in
// adapter or, for tests and future harnesses, a command adapter.

export const STEPS = ['implement', 'review', 'feedback', 'live_verification'];

// The harness that runs a non-review step: an explicit step override, else the
// global default.
export function harnessForStep(config, step) {
  if (step === 'review') throw new Error('use selectReviewer for the review step');
  return config.harness?.steps?.[step] || config.harness.default;
}

function enabled(config, id) {
  return config.adapters?.[id]?.enabled !== false && Boolean(config.adapters?.[id]);
}

// Selects the reviewer for a change. `implementer` is the harness that actually
// implemented this change (recorded in the checkpoint), not the configured
// default. `available` lists harness ids whose adapters can run in the current
// environment; unavailable candidates are excluded, never silently replaced.
export function selectReviewer({ config, implementer, available }) {
  const review = config.harness.review || {};
  const isAvailable = (id) => enabled(config, id) && (!available || available.includes(id));

  if (review.reviewer) {
    if (!isAvailable(review.reviewer))
      return { blocked: true, reason: `configured reviewer ${review.reviewer} is not available in this environment` };
    if (review.reviewer === implementer && review.policy !== 'same-harness')
      return { blocked: true, reason: `configured reviewer ${review.reviewer} is also the implementer; set harness.review.policy: same-harness to allow a fresh-context same-harness review` };
    return { harness: review.reviewer, reason: 'explicit reviewer override' };
  }

  if (review.policy === 'same-harness') {
    if (!isAvailable(implementer)) return { blocked: true, reason: `same-harness reviewer ${implementer} is not available` };
    return { harness: implementer, reason: 'same-harness policy (fresh context)' };
  }

  const order = review.preferences?.length ? review.preferences : Object.keys(config.adapters || {});
  const candidates = order.filter((id) => id !== implementer);
  const chosen = candidates.find(isAvailable);
  if (chosen) return { harness: chosen, reason: `different-harness policy: first available preference other than ${implementer}` };
  return {
    blocked: true,
    reason: `no different-harness reviewer is available (checked ${candidates.join(', ') || 'none'}); checkpoint and continue where one can run, or set an explicit reviewer`,
  };
}

// Fallback to another subscription when the selected harness is exhausted.
// Only explicit opt-in, globally or for the specific step.
export function fallbackAllowed(config, step) {
  const f = config.harness?.fallback;
  return Boolean(f?.enabled && (!f.steps?.length || f.steps.includes(step)));
}
