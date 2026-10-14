// Specialist applicability from the actual change. Each specialist gets
// `applicable` with the files and signals that triggered it, or a reason it
// does not apply. The planning step records this and may override it with a
// written reason; specialists never run on every task by default.
import { execFileSync } from 'node:child_process';

const DOCS = /(^|\/)(docs?|adr)\/|\.(md|mdx|txt|rst)$|^LICENSE|^CHANGELOG/i;
const TESTS = /(^|\/)(__tests__|tests?|spec|e2e)\/|\.(test|spec)\.[a-z]+$/i;
const DEP_MANIFESTS = /(^|\/)(package\.json|package-lock\.json|pnpm-lock\.yaml|yarn\.lock|bun\.lockb?|Gemfile(\.lock)?|requirements[^/]*\.txt|pyproject\.toml|poetry\.lock|uv\.lock|go\.(mod|sum)|Cargo\.(toml|lock)|composer\.(json|lock))$/;
const UI = /\.(tsx|jsx|vue|svelte|astro|html|css|scss)$|(^|\/)(components|pages|app|views|routes)\//;

const SECURITY_PATH = /auth|login|logout|session|oauth|sso|jwt|password|permission|rbac|acl|policy|middleware|webhook|upload|crypto|secret|token|cors|csrf|billing|payment/i;
const SECURITY_TEXT = /\b(authorize|authenticate|getSession|cookies?\(|setCookie|jwt|bcrypt|argon2|signature|hmac|verify(Webhook|Signature)|createHmac|multipart|upload|process\.env\.[A-Z_]*(KEY|TOKEN|SECRET)|dangerouslySetInnerHTML|eval\(|exec\(|child_process|\.raw\(|sql`)\b/;
const EXTERNAL_TEXT = /\b(fetch\(|axios|got\(|request\(|new URL\(|https?:\/\/(?!localhost|127\.0\.0\.1|example\.(com|invalid)))/;

const OBS_PATH = /(^|\/)(jobs?|workers?|queues?|cron|schedul\w*|consumers?|services?|server|api|handlers?|integrations?|webhooks?|functions)(\/|\.)/i;
const OBS_TEXT = /\b(setInterval|cron|schedule|queue|enqueue|retry|backoff|webhook|listen\(|createServer|export (async )?function (GET|POST|PUT|PATCH|DELETE)\b)/;

const DEPLOY_CONFIG = /(^|\/)(vercel\.json|netlify\.toml|wrangler\.(toml|jsonc?)|Dockerfile|docker-compose[^/]*\.ya?ml|fly\.toml|render\.yaml|Procfile|next\.config\.[cm]?[jt]s|middleware\.[jt]s|\.github\/workflows\/[^/]+|migrations?\/)/;

export function changedFiles(repoRoot, base, head = 'HEAD') {
  const out = execFileSync('git', ['diff', '--name-status', '--find-renames', `${base}...${head}`], { cwd: repoRoot, encoding: 'utf8' });
  return out
    .split('\n')
    .filter(Boolean)
    .map((l) => {
      const [status, ...paths] = l.split('\t');
      return { status: status[0], path: paths.at(-1) };
    });
}

export function addedText(repoRoot, base, head, path) {
  const diff = execFileSync('git', ['diff', '--unified=0', `${base}...${head}`, '--', path], { cwd: repoRoot, encoding: 'utf8' });
  return diff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++'))
    .map((l) => l.slice(1))
    .join('\n');
}

function hits(files, test) {
  return files.filter(test).map((f) => f.path);
}

export function classify(files, textFor) {
  const code = files.filter((f) => !DOCS.test(f.path) && !TESTS.test(f.path));
  const docsOnly = files.length > 0 && files.every((f) => DOCS.test(f.path));
  const result = {};

  const deps = hits(files, (f) => DEP_MANIFESTS.test(f.path));
  const secPaths = hits(code, (f) => SECURITY_PATH.test(f.path));
  const secText = hits(code, (f) => SECURITY_TEXT.test(textFor(f.path)));
  const external = hits(code, (f) => EXTERNAL_TEXT.test(textFor(f.path)));
  const securitySignals = [
    ...secPaths.map((p) => `${p}: security-sensitive path`),
    ...secText.map((p) => `${p}: auth, secret, upload or injection-prone code`),
    ...deps.map((p) => `${p}: dependency change`),
    ...external.map((p) => `${p}: external integration call`),
  ];
  result.security = securitySignals.length
    ? { applicable: true, signals: [...new Set(securitySignals)] }
    : { applicable: false, reason: docsOnly ? 'documentation-only change' : 'no auth, trust-boundary, secret, upload, webhook, dependency or external-integration changes detected' };

  const obsPaths = hits(code, (f) => OBS_PATH.test(f.path));
  const obsText = hits(code, (f) => OBS_TEXT.test(textFor(f.path)));
  const obsSignals = [...obsPaths.map((p) => `${p}: service, job or integration path`), ...obsText.map((p) => `${p}: scheduling, queue, server or handler code`)];
  result.observability = obsSignals.length
    ? { applicable: true, signals: [...new Set(obsSignals)] }
    : { applicable: false, reason: docsOnly ? 'documentation-only change' : 'no service, background job, integration or request-handler changes detected' };

  const deployable = code.length > 0;
  result.release = deployable
    ? { applicable: true, signals: [...hits(files, (f) => DEPLOY_CONFIG.test(f.path)).map((p) => `${p}: deployment configuration`), `${code.length} deployable source file(s) changed`] }
    : { applicable: false, reason: docsOnly ? 'documentation-only change; use artifact acceptance' : 'only tests changed; nothing is deployed' };

  const ui = hits(code, (f) => UI.test(f.path));
  result.browser = ui.length
    ? { applicable: true, signals: ui.map((p) => `${p}: user-facing UI`) }
    : { applicable: false, reason: 'no browser-rendered files changed; verify through API, data, job or CLI checks instead' };

  result.quality_contract = { applicable: files.length > 0, signals: ['floor guard runs on every non-empty change'] };
  return result;
}

export function triggersFor(repoRoot, base, head = 'HEAD') {
  const files = changedFiles(repoRoot, base, head);
  return { base, head, files: files.map((f) => `${f.status} ${f.path}`), specialists: classify(files, (p) => (files.find((f) => f.path === p)?.status === 'D' ? '' : addedText(repoRoot, base, head, p))) };
}
