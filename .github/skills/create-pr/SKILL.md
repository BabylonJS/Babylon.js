---
name: create-pr
description: |
    Orchestrates the full PR lifecycle: merge upstream, create draft PR,
    self code review, mark ready, monitor, and iterate on fixes.
    Can also monitor and iterate on an existing PR.
    Input: [--remote <fork>] [--merge [branch]] [--mode automatic|interactive] [--pr <number>]
argument-hint: "[--remote <fork>] [--merge [branch]] [--mode automatic|interactive] [--pr <number>]"
allowed-tools: shell
---

# Create PR

Orchestrator skill that creates a PR and shepherds it through review. It
invokes other skills as sub-agents and does its own work between them.

## Input

Parse `$ARGUMENTS`:

| Argument             | Description                                                                                                                 |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `--remote <fork>`    | Git remote (fork) to push to. If omitted, detect and prompt.                                                                |
| `--merge [branch]`   | Merge upstream before creating the PR. If omitted, prompt.                                                                  |
| `--mode automatic`   | Fixes are applied, committed, pushed, and comments resolved automatically.                                                  |
| `--mode interactive` | Fixes are staged; skill pauses before commit/push/resolve so the user can review.                                           |
| `--pr <number>`      | Monitor and iterate on an existing PR. Skips Steps 0–4 (no merge, no PR creation, no code review). Only `--mode` is needed. |

If `--mode` is not specified, ask the user.

If `--pr` is provided, skip directly to Step 5 (monitor) and Step 6
(iteration loop). Do not prompt for remote, merge, title, body, reviewers,
or labels — those only apply when creating a new PR.

## Prerequisites

1. Verify `gh` is installed and authenticated (`gh auth status`). If not,
   link to https://github.com/cli/cli#installation and stop.
2. Check if PowerShell is available for dialog notifications. If
   unavailable, fall back to text-only alerts.
3. The merge step in Step 1 requires the `babylon-skills:merge-and-resolve`
   skill. Do **not** try to pre-check its availability — the agent's
   available skills list may be truncated, which causes false negatives.
   Always offer the merge option in Step 0a; if invocation in Step 1
   fails because the skill isn't installed, warn the user and skip.

## Step 0: Gather all inputs up front

> **If `--pr` was provided**, skip this entire step and Steps 1–4. Only
> collect `--mode` (ask if not specified), then jump to Step 5.

Collect everything before starting the workflow so it doesn't stop midway.

### 0a. Remote and merge

1. Detect git remotes (`git remote -v`).
2. Identify the user's fork (remote URL containing the user's GitHub
   username from `gh api user --jq ".login"`).
3. **If `--remote` not specified**, present the detected fork and ask the
   user to confirm or change it.
4. **If `--merge` not specified**, ask:
   _"Would you like to merge and resolve before creating the PR?"_
   The `babylon-skills:merge-and-resolve` skill handles detecting the
   correct remote and branch. The user can optionally specify a different
   branch/remote.

### 0b. Mode

**If `--mode` not specified**, ask:

- **Automatic** — everything happens without pausing.
- **Interactive** — pauses at key points so you can review before changes
  are committed/pushed.

### 0c. PR title and body

1. Analyze the branch diff to understand changes:
    ```bash
    git log --oneline master..HEAD
    git diff master...HEAD --stat
    ```
2. Generate a proposed title and body. The body should start with:
   `> 🤖 *This PR was created by the create-pr skill.*`
   Include a clear explanation of the changes, motivation, and any
   behavioral changes. Include links to related PRs or issues if
   detectable from commit messages.
3. Present to the user — they can accept, modify, or provide their own.

### 0d. Reviewers

1. Suggest 1–2 reviewers by analyzing who recently touched the changed
   files:

    ```bash
    # Get changed files
    git diff --name-only master..HEAD

    # Find frequent authors of those files
    git log --format="%an" master..HEAD -- <changed-files> | sort | uniq -c | sort -rn
    ```

    Also consider reviewers from recent PRs on similar areas:

    ```bash
    gh pr list --repo "BabylonJS/Babylon.js" -s merged -L 10 --json "number,reviews" \
      --jq '.[].reviews[].author.login' | sort | uniq -c | sort -rn
    ```

2. Ask the user to confirm or change.

### 0e. Labels

Determine labels from the changed files using these rules:

- Not under `packages/dev` or `packages/tools` → **"skip changelog"**
- Accessibility improvements → **"accessibility"**
- `packages/dev/inspector-v2/src/components/curveEditor` → **"ace"**
- `packages/dev/core` + animation → **"animations"**
- `packages/dev/core` + audio → **"audio"**
- `packages/dev/core` + bones/skeletal → **"bones"**
- Breaking public API changes (non-underscore-prefixed) → **"breaking change"**
- Bug fixes → **"bug"**
- Build scripts/pipelines → **"build"**
- Documentation/doc comments only → **"documentation"**
- Improvements to existing features → **"enhancement"**
- `packages/dev/core/FrameGraph` → **"frame graph"**
- `packages/dev/core` + gaussian splats → **"gaussian splats"**
- `packages/tools/guiEditor` → **"gui editor"**
- `packages/dev/inspector-v2` → **"inspector"**
- `packages/dev/loaders` → **"loaders"**
- `packages/dev/materials` → **"materials"**
- `nativeEngine.ts` or `packages/dev/core/src/Engines/Native` → **"native"**
- New features → **"new feature"**
- `packages/tools/nodeGeometryEditor` → **"nge"**
- `packages/tools/nodeEditor` → **"nme"**
- `packages/tools/nodeRenderGraphEditor` → **"nrge"**
- Performance optimizations → **"optimizations"**
- Particles → **"particles"**
- Physics → **"physics"**
- `packages/tools/playground` → **"playground"**
- `packages/tools/sandbox` → **"sandbox"**
- `packages/tools/viewer` or `packages/tools/viewer-configurator` → **"viewer"**

Present suggested labels and ask the user to confirm or change.

### 0f. Summary and plan

Present the summary and wait for confirmation:

```
Here's the plan:
- Remote: <remote>
- Merge: yes / skip
- Mode: automatic / interactive
- Title: <title>
- Reviewers: <reviewers>
- Labels: <labels>

Steps:
1. Merge and resolve upstream changes (if selected)
2. Push branch and create draft PR
3. Run self code review (code-review skill)
4. Commit and push code review fixes, mark PR as ready for review
5. Monitor PR and apply fixes for review comments / CI failures

Ready to proceed?
```

## Step 1: Merge and resolve (optional)

If the user opted to merge, invoke as a sub-agent:

```
/babylon-skills:merge-and-resolve [branch] [remote] --mode <automatic|interactive>
```

Only pass explicit branch/remote if the user specified them in Step 0.
If invocation fails because the skill is not installed, warn the user
_"The babylon-skills:merge-and-resolve skill was not found — skipping
merge step."_ and continue.

## Step 2: Create the draft PR

1. Push the branch:

    ```bash
    git push -u <remote> HEAD
    ```

2. Determine the upstream repo and default branch:

    ```bash
    # Find upstream remote URL
    git remote -v | grep -E "BabylonJS|microsoft"

    # Get default branch
    gh repo view "<upstream-owner>/<upstream-repo>" --json "defaultBranchRef" --jq ".defaultBranchRef.name"
    ```

3. Get the current branch name and user:

    ```bash
    git rev-parse --abbrev-ref HEAD
    gh api user --jq ".login"
    ```

4. Create the draft PR:
    ```bash
    gh pr create \
      --repo "<upstream-owner>/<upstream-repo>" \
      --head "<user>:<branch>" \
      --base "<default-branch>" \
      --title "<title>" \
      --body "<body>" \
      --draft \
      --label "<label>" \
      --reviewer "<reviewer>"
    ```

## Step 3: Self code review

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

4. Push: `git push <remote> HEAD`

## Step 4: Mark PR as ready for review

1. Mark ready:

    ```bash
    gh pr ready <pr-number> --repo "<upstream-owner>/<upstream-repo>"
    ```

2. Add a PR comment. If code-review produced changes, link to the commit
   within the PR context:
    ```
    Self code review completed. Review fixes: https://github.com/<owner>/<repo>/pull/<pr-number>/changes/<commit-sha>
    ```
    If no changes: _"Self code review completed. No issues found."_

## Step 5: Monitor the PR

Invoke the monitor-pr skill with the PR number (either from Step 2 or
from the `--pr` argument):

```
/monitor-pr <pr-number>
```

The mode is always `automatic` or `interactive` here (never `none`).

## Step 6: Iteration loop

Watch the monitor-pr output and react to actionable events.

### Handling events

1. **Unresolved review comments:** Read the comment, analyze if it needs a
   code change and/or response. Make fixes. Prepare a response prefixed
   with `[Responded by Copilot on behalf of <user>]` (user from
   `gh api user --jq ".login"`).

2. **Pipeline/CI failures (real, not flakes):** Read CI logs, identify root
   cause, make the fix.

3. **Test failures:** Same as pipeline failures — fix the code, not the
   test (unless the test is wrong).

### After making fixes

**Automatic mode:** Commit (new commit, never amend), push, respond to
comments, resolve threads. The monitor picks up new checks automatically.

**Interactive mode:**

1. Stage changes: `git add -A`
2. **Do NOT commit, push, respond, or resolve yet.**
3. Present separate tables for each category (only include tables that
   apply):

    **Review comment fixes:**

    | #   | Comment                             | Proposed Response | Code Changes                |
    | --- | ----------------------------------- | ----------------- | --------------------------- |
    | 1   | [`<comment text>`](link-to-comment) | `<response>`      | `<fix description + files>` |

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
5. Wait for user approval, then commit, push, respond, and resolve.

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
