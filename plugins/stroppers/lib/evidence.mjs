// Evidence publication. Videos and traces go to a dedicated prerelease's
// assets in the same GitHub repository (durable URLs, access follows the
// repository), and a result index is posted on the PR. Nothing here embeds a
// token, a local path or an expiring link.
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

export function assetName(runId, file) {
  return `${runId}--${file.split('/').map((p) => p.replace(/[^A-Za-z0-9._-]/g, '_')).join('--')}`.slice(0, 200);
}

export function uploadAssets({ repo, runDir, files, runId }) {
  try {
    gh(['release', 'view', RELEASE_TAG, '--repo', repo, '--json', 'tagName']);
  } catch {
    gh(['release', 'create', RELEASE_TAG, '--repo', repo, '--prerelease', '--title', 'Stroppers verification evidence', '--notes', 'Videos, traces and results attached by Stroppers verification runs. Each asset name starts with its run id; the PR result index links to them.']);
  }
  // GitHub names an asset after the uploaded file, so each file is staged under
  // its unique run-scoped name first; runs never overwrite each other.
  const staging = mkdtempSync(join(tmpdir(), 'stroppers-evidence-'));
  const uploaded = [];
  try {
    for (const f of files) {
      const name = assetName(runId, f);
      copyFileSync(join(runDir, f), join(staging, name));
      gh(['release', 'upload', RELEASE_TAG, join(staging, name), '--repo', repo]);
      uploaded.push({ file: f, name });
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  // The download URL is read back from GitHub rather than constructed.
  const assets = JSON.parse(gh(['release', 'view', RELEASE_TAG, '--repo', repo, '--json', 'assets'])).assets;
  return uploaded.map((u) => ({ ...u, url: assets.find((a) => a.name === u.name)?.url || null }));
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
