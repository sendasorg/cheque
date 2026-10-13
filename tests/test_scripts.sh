#!/usr/bin/env bash
# Tests for bin/stroppers-guard and bin/stroppers-finish against a fake gh and
# a real local git remote. Run: tests/test_scripts.sh
set -uo pipefail

here=$(cd "$(dirname "$0")" && pwd)
bin="$here/../bin"
failures=0

setup() {
  work=$(mktemp -d)
  mkdir "$work/fakebin" && cp "$here/fake-gh" "$work/fakebin/gh"
  export PATH="$work/fakebin:$PATH" CALLS="$work/calls"
  : > "$CALLS"
  git init -q --bare "$work/origin.git"
  git clone -q "$work/origin.git" "$work/repo" 2>/dev/null
  cd "$work/repo" || exit 1
  git -c user.email=t@t -c user.name=t commit -q --allow-empty -m init
  git push -q origin HEAD 2>/dev/null
  unset FAKE_ISSUE FAKE_PR FAKE_PR_LIST
}

check() {
  local name=$1; shift
  if "$@"; then echo "ok   $name"; else echo "FAIL $name"; failures=$((failures + 1)); fi
}
called() { grep -qF -- "$1" "$CALLS"; }
not_called() { ! called "$1"; }
rendered() { ! grep -qF '{{' <<<"$1"; }

guard() { "$bin/stroppers-guard" "$@" 5 https://run 2>/dev/null; }

# implement: happy path
setup
export FAKE_ISSUE='{"state":"OPEN","labels":[{"name":"ready-for-agent"}]}'
out=$(guard implement 7)
check "implement runs on a ready issue" grep -qx skip=false <<<"$out"
check "implement cuts agent/issue-7" test "$(git branch --show-current)" = agent/issue-7
check "implement moves the issue to agent-working" called "issue edit 7 --remove-label ready-for-agent --add-label agent-working"
check "implement prompt names the issue" grep -q 'issue #7 in acme/app' <<<"$out"
check "implement prompt is fully rendered" rendered "$out"

# implement: guards
setup
export FAKE_ISSUE='{"state":"OPEN","labels":[]}'
check "implement skips without ready-for-agent" grep -qx skip=true <<<"$(guard implement 7)"
setup
export FAKE_ISSUE='{"state":"OPEN","labels":[{"name":"ready-for-agent"},{"name":"needs-human"}]}'
check "implement skips needs-human" grep -qx skip=true <<<"$(guard implement 7)"
setup
export FAKE_ISSUE='{"state":"CLOSED","labels":[{"name":"ready-for-agent"}]}'
check "implement skips closed issues" grep -qx skip=true <<<"$(guard implement 7)"
setup
export FAKE_ISSUE='{"state":"OPEN","labels":[{"name":"ready-for-agent"}]}'
git push -q origin HEAD:agent/issue-7 2>/dev/null
check "implement skips when the branch exists" grep -qx skip=true <<<"$(guard implement 7)"
check "implement leaves labels alone when skipping" not_called "issue edit"

# respond: first round
setup
export FAKE_PR='{"state":"OPEN","isCrossRepository":false,"headRefName":"agent/issue-7","labels":[]}'
out=$(guard respond 12)
check "respond runs on an agent branch before the label lands" grep -qx skip=false <<<"$out"
check "respond records round 1" called "pr edit 12 --add-label agent-round-1"
check "respond does not remove a round-0 label" not_called "--remove-label agent-round-0"
check "respond prompt shows the round" grep -q 'round 1 of 5' <<<"$out"

# respond: later round swaps the counter
setup
export FAKE_PR='{"state":"OPEN","isCrossRepository":false,"headRefName":"agent/issue-7","labels":[{"name":"agent"},{"name":"agent-round-3"}]}'
guard respond 12 >/dev/null
check "respond advances 3 -> 4" called "pr edit 12 --add-label agent-round-4 --remove-label agent-round-3"

# respond: guards
setup
export FAKE_PR='{"state":"OPEN","isCrossRepository":false,"headRefName":"agent/issue-7","labels":[{"name":"agent"},{"name":"agent-round-5"}]}'
out=$(guard respond 12)
check "respond stops at max rounds" grep -qx skip=true <<<"$out"
check "respond hands off at max rounds" called "pr edit 12 --add-label needs-human"
setup
export FAKE_PR='{"state":"OPEN","isCrossRepository":false,"headRefName":"feature/x","labels":[]}'
check "respond ignores human PRs" grep -qx skip=true <<<"$(guard respond 12)"
setup
export FAKE_PR='{"state":"OPEN","isCrossRepository":true,"headRefName":"agent/issue-7","labels":[{"name":"agent"}]}'
check "respond ignores forks" grep -qx skip=true <<<"$(guard respond 12)"

# finish
finish() { MODE=$1 NUMBER=$2 BRANCH=agent/issue-7 CLAUDE_OUTCOME=$3 AUTO_MERGE=${4:-false} RUN_URL=https://run "$bin/stroppers-finish" 2>/dev/null; }
setup
export FAKE_PR_LIST='[{"number":31}]' FAKE_ISSUE='{"labels":[]}'
out=$(finish implement 7 success true)
check "finish labels the new PR" called "pr edit 31 --add-label agent"
check "finish enables auto-merge when asked" called "pr merge 31 --auto --squash"
check "finish reports the PR number" grep -qx pr_number=31 <<<"$out"
setup
export FAKE_ISSUE='{"labels":[{"name":"needs-info"}]}'
finish implement 7 success >/dev/null
check "finish accepts a question instead of a PR" not_called "needs-human"
setup
export FAKE_ISSUE='{"labels":[]}'
finish implement 7 failure >/dev/null
check "finish hands off when nothing came out" called "issue edit 7 --add-label needs-human"
setup
finish respond 12 failure >/dev/null
check "finish hands off a failed respond round" called "pr edit 12 --add-label needs-human"
setup
finish respond 12 success >/dev/null
check "finish stays quiet after a good round" not_called "needs-human"

# smoke
python3 -m http.server 18765 --directory "$here" >/dev/null 2>&1 &
server=$!
for _ in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null http://127.0.0.1:18765/ && break; sleep 0.3; done
check "smoke passes when every path answers" "$bin/stroppers-smoke" http://127.0.0.1:18765/ 1 / fake-gh
smoke_fails() { ! "$bin/stroppers-smoke" "$@" >/dev/null 2>&1; }
check "smoke fails on a 404" smoke_fails http://127.0.0.1:18765 1 /missing
kill "$server"

echo
if [ "$failures" -gt 0 ]; then echo "$failures failed"; exit 1; fi
echo "all passed"
