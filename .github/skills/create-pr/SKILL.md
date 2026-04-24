---
name: create-pr
description: |
    Orchestrates the full PR lifecycle: merge upstream, create draft PR,
    self code review, mark ready, monitor, and iterate on fixes.
    Can also monitor and iterate on an existing PR.
    Input: [--push-remote <fork>] [--upstream-remote <remote>] [--base <branch>] [--merge] [--mode automatic|interactive] [--pr <number>]
argument-hint: "[--push-remote <fork>] [--upstream-remote <remote>] [--base <branch>] [--merge] [--mode automatic|interactive] [--pr <number>]"
---

# Create PR

Orchestrator skill that creates a PR and shepherds it through review. It
invokes other skills as sub-agents and does its own work between them.

## Input

Parse `$ARGUMENTS`:

| Argument                   | Description                                                                                                                 |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--push-remote <fork>`     | Git remote (user's fork) to push the branch to. If omitted, detect and prompt.                                              |
| `--upstream-remote <name>` | Git remote pointing at the PR target repo (e.g. `upstream`, `origin`). If omitted, detect and prompt.                       |
| `--base <branch>`          | Base branch the PR merges into (e.g. `master`). If omitted, use the upstream's default branch and prompt to confirm.        |
| `--merge`                  | Merge upstream base into the feature branch before creating the PR. If omitted, prompt.                                     |
| `--mode automatic`         | Fixes are applied, committed, pushed, and comments resolved automatically.                                                  |
| `--mode interactive`       | Fixes are staged; skill pauses before commit/push/resolve so the user can review.                                           |
| `--pr <number>`            | Monitor and iterate on an existing PR. Skips Steps 1–5 (no merge, no PR creation, no code review). Only `--mode` is needed. |

If `--mode` is not specified, ask the user.

If `--pr` is provided, skip directly to Step 6 (monitor) and Step 7
(iteration loop). Do not prompt for remote, merge, title, body, reviewers,
or labels — those only apply when creating a new PR.

## Prerequisites

1. Verify `gh` is installed and authenticated (`gh auth status`). If not,
   link to https://github.com/cli/cli#installation and stop.
2. Check if PowerShell is available for dialog notifications. If
   unavailable, fall back to text-only alerts.
3. The merge step in Step 2 requires the `babylon-skills:merge-and-resolve`
   skill. Do **not** try to pre-check its availability — the agent's
   available skills list may be truncated, which causes false negatives.
   Always offer the merge option in Step 1a; if invocation in Step 2
   fails because the skill isn't installed, warn the user and skip.

> ⚠️ **Always pass `--no-pager` to `git`** (e.g. `git --no-pager log`,
> `git --no-pager diff`, `git --no-pager show`). Without it, commands can
> launch an interactive pager (`less`) that blocks the shell. This
> applies to every `git` invocation in this skill, not just the examples
> shown below.

## Step 1: Gather all inputs up front

> **If `--pr` was provided**, skip this entire step and Steps 2–5. Only
> collect `--mode` (ask if not specified), then jump to Step 6.

> **Every user prompt in this skill MUST use the `ask_user` tool** — not
> plain chat text. Provide multiple-choice options where possible (e.g.
> yes/no, automatic/interactive, detected-remote/other). Ask one question
> at a time and wait for the answer before proceeding.
>
> **If the user replies with freeform feedback** (e.g. "also add reviewer X",
> "change the title to X"), apply the change and **re-ask the same
> question** with the updated options. Only continue once the user
> picks a final option without further changes.

Collect everything before starting the workflow so it doesn't stop midway.

### 1a. Remotes, base branch, and merge

1. Detect git remotes (`git remote -v`).
2. **Push remote (user's fork)** — the remote whose URL contains the user's
   GitHub login (`gh api user --jq ".login"`). If `--push-remote` is
   specified, use it; otherwise present the detected fork and ask the user
   to confirm or change it.
3. **Upstream remote (PR target)** — the remote pointing at
   `BabylonJS/Babylon.js` (often named `upstream` or `origin`). If
   `--upstream-remote` is specified, use it; otherwise present the
   detected remote and ask the user to confirm or change it.
4. **Base branch** — if `--base` is specified, use it; otherwise default
   to the upstream's default branch
   (`gh repo view BabylonJS/Babylon.js --json "defaultBranchRef" --jq ".defaultBranchRef.name"`,
   typically `master`) and prompt the user to confirm.
5. Once the upstream remote and base branch are confirmed, fetch so the
   base reference is current:
   `git fetch <upstream-remote> <base-branch>`.
6. **If `--merge` not specified**, ask:
   _"Would you like to merge and resolve before creating the PR?"_
   The `babylon-skills:merge-and-resolve` skill handles merging the
   upstream base into the feature branch.

Remember `<push-remote>`, `<upstream-remote>`, `<base-branch>`, and
`<self-login>` (from `gh api user --jq ".login"`) — they are reused in
1c, 1d, Step 2, and Step 3.

### 1b. Mode

**If `--mode` not specified**, ask:

- **Automatic** — everything happens without pausing.
- **Interactive** — pauses at key points so you can review before changes
  are committed/pushed.

### 1c. PR title and body

1. Analyze **only branch-specific changes** using three-dot diff against
   `<upstream-remote>/<base-branch>` (resolved in 1a):

    ```bash
    # Branch commits with full messages (not just --oneline) so you can
    # read author intent, not just code deltas
    git --no-pager log <upstream-remote>/<base-branch>...HEAD

    # Files changed by the branch only (excludes merged-in upstream changes)
    git --no-pager diff <upstream-remote>/<base-branch>...HEAD --stat
    ```

    > ⚠️ Do **not** use two-dot `..` or compare against local `master` —
    > either can include unrelated upstream commits or miss recent
    > upstream work, inflating the file count.

2. Generate a proposed title and body **using both the code diff and
   the commit messages** — the messages often describe intent,
   motivation, and linked issues that the diff alone doesn't convey.
   The body should start with:
   `> 🤖 *This PR was created by the create-pr skill.*`
   Include a clear explanation of the changes, motivation, and any
   behavioral changes. Include links to related PRs or issues if
   referenced in commit messages.
3. Present to the user — they can accept, modify, or provide their own.

### 1d. Reviewers

Suggest the top 1–2 upstream-org members who authored or reviewed
previous PRs touching the files/folders changed by this PR. Do the
whole pipeline non-interactively. Reuse `<upstream-remote>`,
`<upstream-owner>`, `<upstream-repo>`, `<base-branch>`, and
`<self-login>` from Step 1a.

1. **Collect recent commit SHAs** on the base that touched the PR's
   changed files:

    ```bash
    git --no-pager diff --name-only <upstream-remote>/<base-branch>...HEAD
    git --no-pager log <upstream-remote>/<base-branch> --format="%H" -n 30 -- <file1> <file2> ...
    ```

2. **For each SHA, map to its PR and collect author + review-submitters.**
   Each appearance = +1 score for that login. Skip commits with no
   associated PR.

    ```bash
    gh api "/repos/<upstream-owner>/<upstream-repo>/commits/<sha>/pulls" --jq ".[0].number"
    gh api "/repos/<upstream-owner>/<upstream-repo>/pulls/<pr>" --jq ".user.login"
    gh api "/repos/<upstream-owner>/<upstream-repo>/pulls/<pr>/reviews" --jq "[.[].user.login] | unique | .[]"
    ```

3. **Rank by score** (highest first).

4. **Walk the ranked list and filter.** Drop and continue for:
    - `<self-login>`
    - Bots (logins ending in `[bot]`)
    - Non-members of the upstream org:
      `gh api "/orgs/<upstream-owner>/members/<login>" --silent` (exit 0 = member).
      Fallback for user-owned repos:
      `gh api "/repos/<upstream-owner>/<upstream-repo>/collaborators/<login>" --silent`.

    Stop after the first 1–2 survivors.

5. **Present** the 1–2 candidates. Ask the user to confirm or change.
   If none survive, skip `--reviewer` on `gh pr create`.

Loop over commits explicitly — don't try to one-line the whole pipeline.

### 1e. Labels

Determine labels from the changed files using the rules in
[`.github/instructions/pr-labels.md`](../../instructions/pr-labels.md).

Present suggested labels and ask the user to confirm or change.

### 1f. Summary and plan

Present the summary and wait for confirmation:

```
Here's the plan:
- Push remote (fork):    <push-remote>
- Upstream remote:       <upstream-remote>
- Base branch:           <base-branch>
- Merge upstream first:  yes / skip
- Mode:                  automatic / interactive
- Title:                 <title>
- Reviewers:             <reviewers>
- Labels:                <labels>

Steps:
1. Merge and resolve upstream changes (if selected)
2. Push branch and create draft PR
3. Run self code review (code-review skill)
4. Commit and push code review fixes, mark PR as ready for review
5. Monitor PR and apply fixes for review comments / CI failures

Ready to proceed?
```

## Step 2: Merge and resolve (optional)

If the user opted to merge, invoke as a sub-agent, passing the resolved
base branch and upstream remote from Step 1a:

```
/babylon-skills:merge-and-resolve <base-branch> <upstream-remote> --mode <automatic|interactive>
```

If invocation fails because the skill is not installed, warn the user
_"The babylon-skills:merge-and-resolve skill was not found — skipping
merge step."_ and continue.

## Step 3: Create the draft PR

Use `<push-remote>`, `<upstream-remote>`, and `<base-branch>` from 1a.

1. Push the branch:

    ```bash
    git push -u <push-remote> HEAD
    ```

2. Get the current branch name and user login:

    ```bash
    git rev-parse --abbrev-ref HEAD
    gh api user --jq ".login"
    ```

3. Determine the upstream owner/repo from the upstream remote URL (e.g.
   `git remote get-url <upstream-remote>` → parse `owner/repo`). For this
   repo that is `BabylonJS/Babylon.js`.

4. Create the draft PR. Write the title and body to temp files first
   so shell escaping doesn't mangle backticks, `$`, `!`, or backslashes
   in the markdown, then pass the single-line title with
   `--title "$(cat ...)"` and the multi-line body with `--body-file`:

    ```bash
    # Write files (exact markdown, no escaping needed)
    # ... create pr-title.txt and pr-body.md ...

    gh pr create \
      --repo "<upstream-owner>/<upstream-repo>" \
      --head "<user>:<branch>" \
      --base "<base-branch>" \
      --title "$(cat pr-title.txt)" \
      --body-file pr-body.md \
      --draft \
      --label "<label>" \
      --reviewer "<reviewer>"

    rm pr-title.txt pr-body.md
    ```

    > `gh pr create` does not accept `--title-file`, so a short
    > single-line title via `$(cat ...)` is fine; the multi-line body
    > must use `--body-file`.

    > `--label` and `--reviewer` can each be repeated (or take a
    > comma-separated list) — pass one flag per label/reviewer chosen
    > in 1d/1e.

5. `gh pr create` prints the new PR's full URL on success — surface it
   prominently in the chat (e.g. _"Draft PR created: <url>"_) so the
   user can click through to review it.

## Step 4: Self code review

1. Invoke the code-review skill, passing through the mode:

    ```
    /code-review --mode <automatic|interactive>
    ```

2. **If interactive:** pause after code-review completes and ask the user
   to review the changes before committing.

3. If code-review produced changes, commit:

    ```
    Code review fixes (automated by code-review skill)

    Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
    ```

4. Push: `git push <push-remote> HEAD`

## Step 5: Mark PR as ready for review

1. Mark ready:

    ```bash
    gh pr ready <pr-number> --repo "<upstream-owner>/<upstream-repo>"
    ```

2. Add a PR comment. If code-review produced changes, link to the commit
   and list the fixes as a bullet list on the next line:

    ```
    Self code review completed by the code-review skill. Review fixes: https://github.com/<owner>/<repo>/pull/<pr-number>/changes/<commit-sha>
    - <fix 1 — brief description>
    - <fix 2 — brief description>
    ```

    If no changes: _"Self code review completed by the code-review skill. No issues found."_

    > ⚠️ Post the comment with `--body-file`, never with `--body`.
    > Shells interpret backticks, `$`, `!`, and backslashes inside
    > double-quoted strings, which mangles markdown code spans and
    > special characters. Write the comment body to a temp file (e.g.
    > `pr-comment.md`) exactly as it should appear, then:
    >
    > ```bash
    > gh pr comment <pr-number> --repo "<upstream-owner>/<upstream-repo>" --body-file pr-comment.md
    > rm pr-comment.md
    > ```

## Step 6: Monitor the PR

Invoke the monitor-pr skill with the PR number (either from Step 3 or
from the `--pr` argument):

```
/monitor-pr <pr-number>
```

monitor-pr does not accept a `--mode` argument — it just polls and prints
status. The iteration loop below (Step 7) is what handles fixes in the
mode chosen back in Step 1b.

## Step 7: Iteration loop

Watch the monitor-pr output and react to actionable events.

### Handling events

1. **Unresolved review comments:** Enumerate them with a single
   GraphQL query that captures everything you need to react, reply, and
   resolve (so you don't re-query later):

    ```bash
    gh api graphql -f query='
    query {
      repository(owner: "<owner>", name: "<repo>") {
        pullRequest(number: <pr-number>) {
          reviewThreads(first: 100) {
            nodes {
              id                 # thread id (PRRT_...) — used to resolve the thread
              isResolved
              isOutdated
              path
              line
              comments(first: 5) {
                nodes {
                  databaseId     # numeric id — used to reply to the comment
                  author { login }
                  body
                  url            # also encodes the databaseId as #discussion_r<databaseId>
                }
              }
            }
          }
        }
      }
    }'
    ```

    For each unresolved thread, read the comment, analyze if it needs a
    code change and/or response. Make fixes. Prepare a response prefixed
    with `[Responded by Copilot on behalf of <user>]` (user from
    `gh api user --jq ".login"`). Carry the thread `id` and parent
    comment `databaseId` forward — they're needed when posting the
    reply and resolving the thread.

2. **Pipeline/CI failures (real, not flakes):** Read CI logs, identify root
   cause, make the fix.

3. **Test failures:** Same as pipeline failures — fix the code, not the
   test (unless the test is wrong).

### After making fixes

**Always run the Quality commands from `.github/copilot-instructions.md`
before pushing**, plus any tests relevant to the changed code (e.g.
integration/visualization tests for rendering changes). Iterate until
they pass — do not push broken code.

**Interactive mode** — gate on user approval first:

1. Stage changes: `git add -A`
2. **Do NOT commit, push, respond, or resolve yet.**
3. Present separate tables for each category (only include tables that
   apply):

    **Review comment fixes:**

    | #   | Comment                             | Proposed Response | Code Changes                |
    | --- | ----------------------------------- | ----------------- | --------------------------- |
    | 1   | [`<comment text>`](link-to-comment) | `<response>`      | `<fix description + files>` |

    Keep the table compact — it's for the human to review. Persist the
    thread `id` and parent comment `databaseId` for each row in
    session-local storage (e.g. a `review_threads` SQL table keyed by
    row `#`) so the reply/resolve step can look them up without
    re-querying or cluttering the table.

    **Pipeline failure fixes:**

    | #   | Pipeline Failure                      | Code Changes                |
    | --- | ------------------------------------- | --------------------------- |
    | 1   | [`<job — error>`](link-to-failed-run) | `<fix description + files>` |

    **Test failure fixes:**

    | #   | Test Failure                         | Code Changes                |
    | --- | ------------------------------------ | --------------------------- |
    | 1   | [`<test — error>`](link-to-test-log) | `<fix description + files>` |

4. Show a dialog (if PowerShell available):
    ```
    powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Fixes are staged and ready for review.', 'Fixes Ready', 'OK', 'Information')"
    ```
5. Wait for user approval, then proceed with the Automatic mode steps
   below.

**Automatic mode:** Commit (new commit, never amend), push, respond to
comments, resolve threads (see "Posting responses to review comments"
below for how to reply correctly). The monitor picks up new checks
automatically.

### Posting responses to review comments

When responding (in either mode), **post the response as a reply to the
review comment, not a top-level PR comment.** Do **not** use
`gh pr comment` — it creates an unlinked PR-level comment.

Use the parent `databaseId` and thread `id` persisted for this row in
session-local storage (populated from the GraphQL query at the top of
Step 7). Do **not** re-query — the IDs are already in hand. As a
fallback, the parent `databaseId` is also encoded in the comment's URL
as `#discussion_r<databaseId>`.

Post the reply via REST:

```bash
gh api -X POST \
  "/repos/<owner>/<repo>/pulls/<pr-number>/comments/<parent-id>/replies" \
  -F body=@reply.md
rm reply.md
```

Then resolve the thread via the `resolveReviewThread` GraphQL mutation
using the captured thread `id`.

### Exit conditions

- All checks pass, PR approved, all comments resolved → monitor-pr handles
  the "ready to merge" notification.
- User explicitly asks to stop.
- Same issue fails 3 times → stop and ask the user for help.

## Guidelines

- **Never force push.** Never amend previous commits. Always create new
  commits.
- **Always use the user's fork.** Never push to upstream org repos.
- **Never merge without explicit user approval.**
- **Prefix review responses** with `[Responded by Copilot on behalf of <user>]`.
- **Keep PRs focused.** Don't mix fixes with refactors.
- **Update PR descriptions** when the approach changes.
- **`gh pr merge --auto`** merges immediately if the repo has no branch
  protection — ask before using it.
