// Which harness and execution mode this helper is running under. Codex is
// checked first because a Codex session started from Claude Code inherits
// Claude's variables. Cloud mode comes from the harness (Claude sets
// CLAUDE_CODE_REMOTE) or an explicit CHEQUE_MODE in the cloud environment.
export function detectSession(env = process.env) {
  const harness = env.CHEQUE_HARNESS || (env.CODEX_THREAD_ID ? 'codex' : env.CLAUDECODE ? 'claude-code' : null);
  const session = env.CODEX_THREAD_ID || env.CLAUDE_CODE_SESSION_ID || null;
  const mode = env.CHEQUE_MODE || (env.CLAUDE_CODE_REMOTE === 'true' ? 'cloud' : 'local');
  return { harness, session, mode };
}
