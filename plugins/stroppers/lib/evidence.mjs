// Evidence publication. Videos and traces go to a dedicated prerelease's
// assets in the same GitHub repository (durable URLs, access follows the
// repository), and a result index is posted on the PR. Nothing here embeds a
// token, a local path or an expiring link.
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export const RELEASE_TAG = 'stroppers-evidence';

const FORBIDDEN = [
  [/[?&](token|sig|signature|X-Amz-[A-Za-z]+|access_token|expires)=/i, 'a signed or tokenized URL'],
  [/\b(gh[pousr]_[A-Za-z0-9]{20,}|lin_(api|oauth)_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9-]{20,})\b/, 'a credential'],
  [/(^|[\s(`])(\/Users\/|\/home\/|\/private\/|\/tmp\/|\/var\/folders\/|[A-Z]:\\|file:\/\/)/, 'a local filesystem path'],
];

export function checkPublishable(text) {
  return FORBIDDEN.filter(([re]) => re.test(text)).map(([, why]) => `evidence contains ${why}`);
}

function gh(args, opts = {}) {
  return execFileSync('gh', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...opts }).trim();
}

// REST only: Claude Code cloud sessions reject GitHub GraphQL, which several
// `gh` porcelain commands use.
function api(path, args = []) {
  return JSON.parse(gh(['api', path, ...args]) || 'null');
}

// owner/name of the repository's GitHub origin, read from git so it works
// offline and without GraphQL.
export function repoSlug(repoRoot) {
  const url = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const m = url.match(/github\.com[:/]([^/]+\/[^/]+?)(\.git)?$/);
  if (!m) throw new Error(`origin ${url} is not a GitHub repository`);
  return m[1];
}

export function assetName(runId, file) {
  return `${runId}--${file.split('/').map((p) => p.replace(/[^A-Za-z0-9._-]/g, '_')).join('--')}`.slice(0, 200);
}

function evidenceRelease(repo) {
  try {
    return api(`repos/${repo}/releases/tags/${RELEASE_TAG}`);
  } catch {
    return api(`repos/${repo}/releases`, ['-X', 'POST', '-f', `tag_name=${RELEASE_TAG}`, '-f', 'name=Stroppers verification evidence', '-F', 'prerelease=true', '-f', 'body=Videos, traces and results attached by Stroppers verification runs. Each asset name starts with its run id; the PR result index links to them.']);
  }
}

export function uploadAssets({ repo, runDir, files, runId }) {
  const release = evidenceRelease(repo);
  const uploaded = [];
  for (const f of files) {
    const name = assetName(runId, f);
    const asset = api(`https://uploads.github.com/repos/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(name)}`, ['-X', 'POST', '-H', 'Content-Type: application/octet-stream', '--input', join(runDir, f)]);
    uploaded.push({ file: f, name, url: asset?.browser_download_url || null });
  }
  return uploaded;
}

export function postComment(repo, pr, bodyFile) {
  return api(`repos/${repo}/issues/${pr}/comments`, ['-X', 'POST', '-F', `body=@${bodyFile}`]).html_url;
}

const ICON = { passed: 'passed', failed: 'FAILED', 'not-applicable': 'not applicable', unverified: 'UNVERIFIED' };

export function renderIndex({ record, criteria = [], assets = [], environment, skipped = [] }) {
  const lines = [
    `<!-- stroppers:evidence ${record.run_id} -->`,
    `### Stroppers verification · \`${record.status}\``,
    '',
    `- **Revision:** \`${record.revision}\`${record.worktree_clean ? '' : ' (working tree had uncommitted changes; result is not bound to a commit)'}`,
    `- **Executor:** ${record.executor.mode} · ${record.executor.harness || 'harness not recorded'} · ${record.executor.os} · ${record.executor.browser} ${record.executor.browser_version || ''} · Playwright ${record.executor.playwright || 'n/a'}`,
    `- **Environment under test:** ${environment || 'isolated app started inside this session'}`,
    `- **Run:** \`${record.run_id}\` · ${record.started_at} → ${record.finished_at}`,
    '',
  ];
  if (criteria.length) {
    lines.push('| Criterion | Method | Outcome | Notes |', '| --- | --- | --- | --- |');
    for (const c of criteria) lines.push(`| ${c.id}: ${c.criterion} | ${c.method} | ${ICON[c.status] || c.status} | ${c.reason || ''} |`);
    lines.push('');
  }
  if (record.tests?.length) {
    lines.push('<details><summary>Browser assertions</summary>', '', '| Test | Result |', '| --- | --- |');
    for (const t of record.tests) lines.push(`| ${t.title} | ${ICON[t.status]}${t.error ? `: ${t.error.replace(/\|/g, '\\|')}` : ''} |`);
    lines.push('', '</details>', '');
  }
  if (assets.length) {
    lines.push('**Recordings and traces** (supplement the assertions above; a video is not a verdict):', '');
    for (const a of assets) lines.push(`- [${a.file}](${a.url})`);
    lines.push('');
  }
  if (skipped.length) {
    lines.push('**Not run:**', '');
    for (const s of skipped) lines.push(`- ${s.id}: ${s.status} (${s.reason})`);
  }
  return lines.join('\n');
}
