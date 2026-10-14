// Thin harness adapters. Each one knows how to invoke its CLI as a read-only
// reviewer with subscription authentication, and how to read its output.
// Nothing here starts a service; every call is a child process of the session.
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

// Child environment for a reviewer, built from an allowlist: only what the
// harness CLI needs to run and to find its own subscription sign-in. API-billing
// keys and every other credential in the parent (Linear, GitHub, cloud) stay
// out. The reviewer role marker stops it from delegating another review.
const REVIEWER_ENV_ALLOW = [
  'PATH', 'HOME', 'USER', 'LOGNAME', 'SHELL', 'LANG', 'LC_ALL', 'LC_CTYPE', 'TERM', 'TMPDIR', 'TZ',
  'XDG_CONFIG_HOME', 'XDG_CACHE_HOME', 'XDG_DATA_HOME', 'XDG_STATE_HOME', 'XDG_RUNTIME_DIR',
  'CODEX_HOME', 'CLAUDE_CONFIG_DIR', 'CLAUDE_CODE_OAUTH_TOKEN',
  'HTTPS_PROXY', 'HTTP_PROXY', 'NO_PROXY', 'https_proxy', 'http_proxy', 'no_proxy', 'NODE_EXTRA_CA_CERTS', 'SSL_CERT_FILE',
];

export function reviewerEnv(env = process.env) {
  const out = { CHEQUE_ROLE: 'reviewer' };
  for (const k of REVIEWER_ENV_ALLOW) if (env[k] !== undefined) out[k] = env[k];
  return out;
}

const EXHAUSTED = /usage limit|rate[ -]limit|quota|limit reached|exceeded your|too many requests|\b429\b/i;
const AUTH = /not logged in|log ?in required|please (run )?\/?login|authenticat(e|ion) (failed|required|error)|unauthori[sz]ed|\b401\b|invalid (api key|token)|expired token/i;

export function classifyFailure(text) {
  if (EXHAUSTED.test(text)) return 'exhausted';
  if (AUTH.test(text)) return 'auth-failed';
  return 'error';
}

export const ADAPTERS = {
  'claude-code': {
    id: 'claude-code',
    declares: {
      local: 'claude -p (non-interactive print mode)',
      cloud: 'available inside Claude Code cloud sessions; from another vendor cloud only with a provisioned CLAUDE_CODE_OAUTH_TOKEN',
      reviewOnly: 'Read, Grep and Glob only; no shell, no writes, no network tools; the diff is provided as a file',
      auth: 'claude.ai subscription login or CLAUDE_CODE_OAUTH_TOKEN from `claude setup-token`; API keys are stripped',
      results: 'JSON envelope with structured_output validated against the findings schema',
      checkpointInput: 'prompt carries contract, constraints path, base/head and scope',
      requires: 'Claude Code >= 2.1 with --json-schema',
      limits: 'counts toward the subscription usage window',
    },
    authCheck(env) {
      if (env.CLAUDE_CODE_OAUTH_TOKEN) return { ok: true, mode: 'subscription-token' };
      const r = spawnSync('claude', ['auth', 'status'], { env, encoding: 'utf8', timeout: 30000 });
      if (r.error) return { ok: false, unavailable: true, reason: `claude CLI not available: ${r.error.message}` };
      try {
        const s = JSON.parse(r.stdout);
        // claude.ai sign-in locally; cloud sessions and setup-token use an OAuth token.
        // Both are subscription auth. API keys and third-party providers are not.
        if (s.loggedIn && ['claude.ai', 'oauth_token'].includes(s.authMethod) && (s.apiProvider ?? 'firstParty') === 'firstParty')
          return { ok: true, mode: `${s.authMethod} subscription` };
        return { ok: false, reason: `claude is not signed in with a claude.ai subscription (authMethod: ${s.authMethod || 'none'})` };
      } catch {
        return { ok: false, reason: 'could not read `claude auth status`' };
      }
    },
    command({ schemaPath }) {
      const schema = readFileSync(schemaPath, 'utf8');
      return {
        bin: 'claude',
        args: [
          '-p',
          '--output-format', 'json',
          '--json-schema', schema,
          '--permission-mode', 'dontAsk',
          '--tools', 'Read,Grep,Glob',
          '--allowedTools', 'Read,Grep,Glob',
          '--disallowedTools', 'Bash,Edit,Write,NotebookEdit,WebFetch,WebSearch,Agent',
        ],
      };
    },
    parse({ stdout }) {
      let envelope;
      try {
        envelope = JSON.parse(stdout);
      } catch {
        return { status: classifyFailure(stdout), detail: 'unparseable claude output' };
      }
      const model = Object.keys(envelope.modelUsage || {}).join(', ') || null;
      if (envelope.is_error || envelope.subtype !== 'success' || !envelope.structured_output) {
        const text = `${envelope.result || ''} ${envelope.api_error_status || ''} ${envelope.terminal_reason || ''}`;
        return { status: classifyFailure(text), detail: text.trim() || envelope.subtype, model };
      }
      return { status: 'ok', output: envelope.structured_output, model };
    },
  },

  codex: {
    id: 'codex',
    declares: {
      local: 'codex exec --sandbox read-only',
      cloud: 'available inside Codex cloud tasks; from Claude cloud only with a ChatGPT Business/Enterprise access token or copied auth cache (not configured by default)',
      reviewOnly: 'read-only sandbox, ephemeral session',
      auth: 'ChatGPT sign-in (`codex login`) or workspace access token; API keys are stripped',
      results: '--output-schema with the findings schema, last message written to a file',
      checkpointInput: 'prompt carries contract, constraints path, base/head and scope',
      requires: 'Codex CLI >= 0.162 with --output-schema',
      limits: 'counts toward the ChatGPT plan usage window',
    },
    authCheck(env) {
      const r = spawnSync('codex', ['login', 'status'], { env, encoding: 'utf8', timeout: 30000 });
      if (r.error) return { ok: false, unavailable: true, reason: `codex CLI not available: ${r.error.message}` };
      const text = `${r.stdout}${r.stderr}`;
      if (/ChatGPT|access token/i.test(text) && r.status === 0) return { ok: true, mode: text.trim() };
      if (/API key/i.test(text)) return { ok: false, reason: 'codex is signed in with an API key; cheque only uses subscription sign-in' };
      return { ok: false, reason: `codex is not signed in: ${text.trim()}` };
    },
    command({ schemaPath, outputPath }) {
      return {
        bin: 'codex',
        args: ['exec', '--sandbox', 'read-only', '--ephemeral', '--skip-git-repo-check', '--output-schema', schemaPath, '-o', outputPath, '-'],
      };
    },
    parse({ stdout, stderr, outputPath, code }) {
      const model = (stderr.match(/^model: (.+)$/m) || stdout.match(/^model: (.+)$/m) || [])[1] || null;
      if (code !== 0 || !existsSync(outputPath)) return { status: classifyFailure(`${stdout}\n${stderr}`), detail: stderr.split('\n').slice(-5).join('\n'), model };
      try {
        return { status: 'ok', output: JSON.parse(readFileSync(outputPath, 'utf8')), model };
      } catch {
        return { status: 'error', detail: 'codex output was not valid JSON', model };
      }
    },
  },
};

// Command adapter for a harness configured by command line. Used for test
// fixtures and as the extension point for future harnesses; the command reads
// the prompt on stdin and writes findings JSON to $CHEQUE_REVIEW_OUTPUT.
export function commandAdapter(id, spec) {
  return {
    id,
    declares: { local: spec.command.join(' '), cloud: 'not declared', reviewOnly: 'trusted to the command', auth: 'command-defined', results: 'JSON file', checkpointInput: 'prompt', requires: 'command on PATH', limits: 'unknown' },
    authCheck: () => ({ ok: true, mode: spec.fake ? 'fake fixture' : 'command-defined' }),
    command: () => ({ bin: spec.command[0], args: spec.command.slice(1) }),
    parse({ outputPath, code, stdout, stderr }) {
      if (code !== 0 || !existsSync(outputPath)) return { status: classifyFailure(`${stdout}\n${stderr}`), detail: stderr.trim() };
      return { status: 'ok', output: JSON.parse(readFileSync(outputPath, 'utf8')), model: null };
    },
  };
}

export function adapterFor(config, id) {
  const spec = config.adapters?.[id];
  if (!spec) throw new Error(`no adapter registered for ${id}`);
  if (spec.command) return commandAdapter(id, spec);
  if (!ADAPTERS[id]) throw new Error(`adapter ${id} has no built-in implementation and no command`);
  return ADAPTERS[id];
}

export function runProcess({ bin, args, cwd, env, input, timeoutMs }) {
  return new Promise((resolve) => {
    // Own process group, so a timeout stops the reviewer and anything it started.
    const child = spawn(bin, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'], detached: true });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const killGroup = (signal) => {
      try {
        process.kill(-child.pid, signal);
      } catch {}
    };
    const timer = setTimeout(() => {
      timedOut = true;
      killGroup('SIGTERM');
      setTimeout(() => killGroup('SIGKILL'), 5000).unref();
      resolve({ code: null, stdout, stderr, timedOut });
    }, timeoutMs);
    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      resolve({ code: 127, stdout, stderr: `${stderr}${e.message}`, timedOut });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr, timedOut });
    });
    child.stdin.on('error', () => {});
    child.stdin.end(input);
  });
}
