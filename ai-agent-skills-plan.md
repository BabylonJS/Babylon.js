# AI Agent Skills Plan: `monitor-pr` and `create-pr`

Two new **project-level skills** that automate the PR lifecycle — from
creation through monitoring and iterative fixes.

The skills live in `.github/skills/` in this repository (the `Babylon.js`
repo), following the Agent Skills specification (SKILL.md frontmatter,
`$ARGUMENTS` for input, etc.).

The `code-review` skill already exists at `.github/skills/code-review/` and
is used by `create-pr` as a sub-agent.

---

## Skill 1: `monitor-pr`

### Directory

```
.github/skills/monitor-pr/
└── SKILL.md
```

No helper scripts — the AI agent determines the best polling approach using
`gh` commands directly.

### SKILL.md frontmatter

```yaml
name: monitor-pr
description: |
  Monitor one or more GitHub PRs and maintain a live status table showing
  title, link, check status, resolved/total comments, and reviewer approval.
  Shows a Windows dialog when a PR is ready to merge.
  Input: a comma-separated list of PR numbers, "mine", or "all".
argument-hint: <pr-numbers | mine | all>
allowed-tools: shell
```

### Input (`$ARGUMENTS`)

| Value | Meaning |
|-------|---------|
| Comma-separated numbers (e.g. `1234,5678`) | Monitor those specific PRs |
| `mine` | Monitor all open PRs authored by the current user |
| `all` | Monitor all open PRs in the repo |

If `$ARGUMENTS` is empty, ask the user which PRs to monitor.

### Prerequisites

- Verify `gh` (GitHub CLI) is installed and authenticated (`gh auth status`).
  If not, tell the user to install it (link to
  https://github.com/cli/cli#installation) and authenticate.
- Verify `powershell` is available on the system (for the MessageBox dialog).
  If not, skip the dialog notification and fall back to a plain text message
  in the conversation.

### Core behavior

#### 1. Resolve the PR list

- **Numbers:** validate each PR exists with
  `gh pr view <number> --repo "BabylonJS/Babylon.js" --json "number"`.
- **`mine`:**
  `gh pr list --repo "BabylonJS/Babylon.js" -A "@me" --json "number,title,url"`.
- **`all`:**
  `gh pr list --repo "BabylonJS/Babylon.js" --json "number,title,url"`.

Note: `gh pr list` defaults to open PRs, so no `--state` flag is needed.

#### 2. Build and display the status table

For each PR, gather data using these commands:

| Column | Source |
|--------|--------|
| PR | `#<number>` linked to the PR URL |
| Title | From `gh pr view --json "title"` |
| Checks | From `gh pr view --json "statusCheckRollup"` — summarize as ✅ pass / ❌ fail / ⏳ pending counts |
| Comments | From GraphQL `reviewThreads` query (see below) — show resolved/total (e.g. `4/7`) |
| Approved | From `gh pr view --json "reviewDecision"` — ✅ if `APPROVED`, ❌ otherwise |
| Ready | ✅ if all checks pass AND approved AND all comments resolved, otherwise ❌ |

**Review threads** (resolved vs total comments) require the GraphQL API
since `gh pr view --json` does not expose `reviewThreads`:

```bash
gh api graphql -f query='
query {
  repository(owner: "BabylonJS", name: "Babylon.js") {
    pullRequest(number: <NUMBER>) {
      reviewThreads(first: 100) {
        totalCount
        nodes { isResolved }
      }
    }
  }
}' --jq '.data.repository.pullRequest.reviewThreads | {total: .totalCount, resolved: ([.nodes[] | select(.isResolved)] | length)}'
```

**Print the table to the main chat** so the user can see the current status
at all times.

#### 3. Distinguish real failures from flakes

When checks fail, read the CI logs (using GitHub MCP `get_job_logs` tool or
similar). Classify failures using ad-hoc analysis:

- **Real failure** — caused by changes in the PR. Show ❌ and a brief
  summary of the error.
- **Flake** — a pre-existing issue. A test that failed on some PR iterations
  and succeeded on others, and is not a new test added in the PR, is a
  suspected flake. Show ⚠️ and note it.

#### 4. Poll loop

Re-poll every **~5 minutes**. On each poll:

1. Re-fetch PR data via `gh`.
2. Print the updated status table to the main chat.
3. If a PR transitions to **ready to merge** (all checks pass, approved, all
   comments resolved):
   - If PowerShell is available, show a Windows dialog:
     ```
     powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('PR #<number> — <title> — is ready to merge.', 'PR Ready', 'OK', 'Information')"
     ```
   - Always also print a prominent message in the conversation.
4. If a PR is merged or closed, remove it from the table and note it.
5. When all monitored PRs are merged/closed, stop polling and report final
   status.

#### 5. Retriggering CI

If the user asks to retrigger CI (e.g. for flakes):

- Push an empty commit: `git commit --allow-empty -m "retrigger CI"` then
  `git push`.
- **Never force push.** This is a hard rule from the workflow conventions.

### Guidelines (from workflow instructions)

- Always check CI logs on failures — don't guess at the cause.
- Distinguish real failures from flakes.
- Monitor for new review comments as well as check status.
- Include pass/fail/pending counts and unresolved comment count.
- Print the status table to the main chat so the user can follow along.
- Run in the foreground with periodic status tables.
- Don't stop until explicitly told to or until all PRs are resolved.

---

## Skill 2: `create-pr`

### Directory

```
.github/skills/create-pr/
└── SKILL.md
```

No separate reference files — PR label rules are embedded directly in the
SKILL.md (moved from `.github/instructions/pr-labels.instructions.md`).

### SKILL.md frontmatter

```yaml
name: create-pr
description: |
  Super skill that orchestrates the full PR creation lifecycle: merge upstream,
  self-review, create the PR as a draft, monitor it, and optionally apply AI
  fixes in an iteration loop.
  Input: [--remote <fork>] [--merge [branch]] [--mode automatic|interactive]
argument-hint: "[--remote <fork>] [--merge [branch]] [--mode automatic|interactive]"
allowed-tools: shell
```

### Input (`$ARGUMENTS`)

| Argument | Description |
|----------|-------------|
| `--remote <fork>` | The git remote (fork) to push to and create the PR from. If omitted, auto-detect a default and prompt the user to confirm or change it (see Step 0). |
| `--merge [branch]` | Merge upstream before creating the PR. Optional branch name (defaults to the upstream default branch). If omitted, prompt the user (see Step 0). |
| `--mode automatic` | Automatically apply AI fixes and push them without pausing. |
| `--mode interactive` | Apply AI fixes but pause before pushing/resolving so the user can review each iteration. |

When `--mode` is not specified, the skill asks the user during Step 0.

### Orchestration steps

This is a **super skill** — an orchestrator that invokes other skills as
sub-agents and does its own unique work between them.

#### Step 0: Gather all inputs up front

**Goal:** Collect every piece of information needed so the workflow doesn't
have to stop and ask the user part way through.

##### 0a. Remote and merge

1. Detect available git remotes from `git remote -v`.
2. Identify the user's fork (the remote whose URL contains the current
   user's GitHub username from `gh api user --jq ".login"`).
3. Identify the upstream remote (the one pointing to `BabylonJS/Babylon.js`
   or similar org repo).
4. **If `--remote` was not specified**, present the detected default fork
   remote and ask the user to confirm or specify a different one.
5. **If `--merge` was not specified**, ask the user:
   *"Would you like to merge and resolve before creating the PR? This helps
   avoid merge conflicts."*
   If yes, the `merge-and-resolve` skill will handle determining the
   correct remote and branch automatically. The user can optionally
   specify a different branch or remote at this point if they want.

##### 0b. Mode

**If `--mode` was not specified**, ask the user:
*"How would you like to handle the workflow?"*
- **Automatic** — code review fixes, iteration loop fixes, comment
  responses, and pushes all happen automatically without pausing.
- **Interactive** — the skill pauses at key points (after code review,
  after each iteration fix) so you can review changes before they are
  committed, pushed, or comments are responded to.

##### 0c. PR title and body

1. Analyze the branch diff (`git log --oneline master..HEAD`,
   `git diff master...HEAD --stat`) to understand what changed.
2. Generate a proposed PR title and body:
   - The first line of the body should be a header clearly indicating the
     PR was created by this skill
     (e.g. `> 🤖 *This PR was created by the create-pr skill.*`).
   - Include a clear explanation of the changes, the motivation, and any
     behavioral changes.
   - Include links to related PRs or issues if detectable from commit
     messages.
3. Present the proposed title and body to the user and ask:
   *"Here's the proposed PR title and description. You can accept it,
   ask for changes, or provide your own."*
4. Iterate until the user is satisfied.

##### 0d. Reviewers

1. Determine 1–2 default reviewers by analyzing who has recently touched
   the files in the PR:
   ```bash
   git log --format="%an" master..HEAD -- <changed-files> | sort | uniq -c | sort -rn
   ```
   Also consider reviewers from recent PRs on similar areas.
2. Present the suggested reviewers to the user and ask:
   *"I'd suggest requesting reviews from <reviewer1> and <reviewer2>.
   Would you like to change or add reviewers?"*
3. Finalize the reviewer list.

##### 0e. Labels

Apply labels based on the following rules (moved from
`pr-labels.instructions.md`):

- Changes to documentation, instructions, build scripts, or anything not
  under `packages/dev` or `packages/tools` → **"skip changelog"**
- Accessibility improvements → **"accessibility"**
- Changes under `packages/dev/inspector-v2/src/components/curveEditor` → **"ace"**
- Changes under `packages/dev/core` related to animation → **"animations"**
- Changes under `packages/dev/core` related to audio → **"audio"**
- Changes under `packages/dev/core` related to bones or skeletal animation → **"bones"**
- Breaking changes to public APIs (except underscore-prefixed) → **"breaking change"**
- Bug fixes → **"bug"**
- Changes to build scripts or pipelines → **"build"**
- Changes to documentation files or doc comments only → **"documentation"**
- Improvements to existing features → **"enhancement"**
- Changes under `packages/dev/core/FrameGraph` → **"frame graph"**
- Changes under `packages/dev/core` related to gaussian splats → **"gaussian splats"**
- Changes under `packages/tools/guiEditor` → **"gui editor"**
- Changes under `packages/dev/inspector-v2` → **"inspector"**
- Changes under `packages/dev/loaders` → **"loaders"**
- Changes under `packages/dev/materials` → **"materials"**
- Changes to `nativeEngine.ts` or under `packages/dev/core/src/Engines/Native` → **"native"**
- New features → **"new feature"**
- Changes under `packages/tools/nodeGeometryEditor` → **"nge"**
- Changes under `packages/tools/nodeEditor` → **"nme"**
- Changes under `packages/tools/nodeRenderGraphEditor` → **"nrge"**
- Performance optimizations → **"optimizations"**
- Changes related to particles → **"particles"**
- Changes related to physics → **"physics"**
- Changes under `packages/tools/playground` → **"playground"**
- Changes under `packages/tools/sandbox` → **"sandbox"**
- Changes under `packages/tools/viewer` or `packages/tools/viewer-configurator` → **"viewer"**

1. Analyze the changed files and determine which labels apply.
2. Present the suggested labels to the user and ask:
   *"Based on the changes, I'd apply these labels: <labels>. Would you
   like to change them?"*
3. Finalize the label list.

##### Summary

After gathering all inputs, present a summary and numbered step list to the
user:

```
Here's the plan:
- Remote: <remote>
- Merge: yes (merge-and-resolve will determine branch/remote) or "skip"
- Mode: automatic / interactive
- Title: <title>
- Reviewers: <reviewers>
- Labels: <labels>

Steps:
1. Merge and resolve upstream changes (if selected)
2. Push branch and create draft PR
3. Run self code review (code-review skill)
4. Commit and push code review fixes, mark PR as ready for review
5. Monitor PR and apply fixes for review comments / CI failures (mode: <mode>)

Ready to proceed?
```

Wait for confirmation before continuing.

#### Step 1: Merge and resolve (optional)

If the user opted to merge in Step 0:

1. Invoke the `merge-and-resolve` skill as a sub-agent, passing through the
   mode:
   ```
   /babylon-skills:merge-and-resolve [branch] [remote] --mode <automatic|interactive>
   ```
   The `merge-and-resolve` skill handles determining the correct remote and
   branch automatically. Only pass explicit branch/remote if the user
   specified them in Step 0.

If the user opted to skip merging, skip this step.

#### Step 2: Create the draft PR

1. **Push the branch:**
   ```bash
   git push -u <remote> HEAD
   ```

2. **Create the PR as a draft with `gh`:**
   ```bash
   gh pr create \
     --repo "<upstream-owner>/<upstream-repo>" \
     --head "<user>:<branch>" \
     --base "<default-branch>" \
     --title "<title>" \
     --body "<body>" \
     --draft \
     --label "<label1>" --label "<label2>" \
     --reviewer "<reviewer1>" --reviewer "<reviewer2>"
   ```

#### Step 3: Self code review

1. Invoke the `code-review` skill as a sub-agent, passing through the mode:
   ```
   /code-review --mode <automatic|interactive>
   ```
   The `code-review` skill reviews the current branch's changes against all
   repo coding practices, flags issues by severity, and fixes them (or
   presents them for approval in interactive mode).

2. **If mode is `interactive`:** pause after code-review completes and ask
   the user to review the changes before proceeding:
   *"The code review is complete. Please review the changes before I commit
   and push them. Let me know when you're ready to proceed."*
   Wait for the user to confirm.

3. **If mode is `automatic`:** proceed immediately.

4. If code-review produced any changes, commit them with a clear message:
   ```
   Code review fixes (automated by code-review skill)

   Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>
   ```
   **Always create a new commit — never amend previous commits.**

5. Push the commit: `git push <remote> HEAD`

#### Step 4: Mark PR as ready for review

1. **Mark the PR as ready:**
   ```bash
   gh pr ready <pr-number> --repo "<upstream-owner>/<upstream-repo>"
   ```

2. **Add a comment** to the PR indicating the self code review was completed.
   If the code-review step produced changes, include a link to the commit
   within the context of the PR (not just a bare commit URL):
   ```bash
   gh pr comment <pr-number> --repo "<upstream-owner>/<upstream-repo>" \
     --body "Self code review completed. Review fixes: https://github.com/<upstream-owner>/<upstream-repo>/pull/<pr-number>/changes/<commit-sha>"
   ```
   If there were no code-review changes, the comment should say:
   *"Self code review completed. No issues found."*

#### Step 5: Monitor the PR

Invoke the `monitor-pr` skill as a sub-agent, passing the newly created PR
number:
```
/monitor-pr <pr-number>
```

This starts the monitoring loop from Skill 1. The status table is printed
to the main chat.

Note: when invoked from `create-pr`, the mode is always `automatic` or
`interactive` — never `none`. (`none` is only valid when users invoke
`monitor-pr` directly.)

#### Step 6: Iteration loop (based on mode)

This step watches the output of the `monitor-pr` skill and reacts to it.

- **If mode is `automatic`:** apply fixes, commit, push, respond to and
  resolve comments — all without pausing.
- **If mode is `interactive`:** apply fixes and stage them, but pause before
  committing, pushing, responding to comments, or resolving threads so the
  user can review each iteration.

##### The iteration loop

When the monitor detects an actionable event, react:

1. **Review comment (unresolved):**
   - Read the comment using the GraphQL API or GitHub MCP tools.
   - Analyze whether it requires a code change, a response, or both.
   - If it requires a code change, make the fix.
   - Prepare a response (prefixed with
     `[Responded by Copilot on behalf of <user>]` where `<user>` comes from
     `gh api user --jq ".login"`).

2. **Pipeline / CI failure (real, not a flake):**
   - Read the CI logs using GitHub MCP tools.
   - Analyze the failure, identify the root cause.
   - Make the fix.

3. **Test failure:**
   - Same as pipeline failure — read logs, identify the failing test, fix
     the code (not the test, unless the test itself is wrong).

##### After making fixes

- **If mode is `automatic`:**
  - Commit with a descriptive message. **Always create new commits — never
    amend previous commits or force push.**
  - Push: `git push <remote> HEAD`
  - Respond to review comments and resolve addressed threads.
  - The monitor will pick up the new checks automatically.

- **If mode is `interactive`:**
  - Stage the changes: `git add -A`
  - **Do NOT commit, push, respond to comments, or resolve threads yet.**
  - Present separate review tables for each category of change. Only
    include tables that apply to the current batch of fixes.

    **Review comment fixes** (if any):

    | # | Comment | Proposed Response | Code Changes |
    |---|---------|-------------------|--------------|
    | 1 | [`<reviewer comment text>`](<link-to-comment>) | `<proposed response>` | `<description of fix + files changed>` |

    **Pipeline failure fixes** (if any):

    | # | Pipeline Failure | Code Changes |
    |---|------------------|--------------|
    | 1 | [`<pipeline/job name — error summary>`](<link-to-failed-run-or-job>) | `<description of fix + files changed>` |

    **Test failure fixes** (if any):

    | # | Test Failure | Code Changes |
    |---|--------------|--------------|
    | 1 | [`<test name — error summary>`](<link-to-failed-test-log>) | `<description of fix + files changed>` |

  - Show a dialog (if PowerShell is available):
    ```
    powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('Fixes are staged and ready for review. Please review the changes and approve when ready.', 'Fixes Ready', 'OK', 'Information')"
    ```
  - Wait for the user to review the staged changes and the proposed
    responses.
  - Only when the user approves:
    - Commit the changes with a descriptive message (new commit, never
      amend).
    - Push: `git push <remote> HEAD`
    - Respond to review comments and resolve addressed threads.
  - Resume monitoring.

##### Iteration loop exit conditions

- All checks pass, PR is approved, all comments resolved → the monitor-pr
  skill handles the "ready to merge" notification.
- User explicitly asks to stop.
- A fix attempt fails repeatedly (3 attempts for the same issue) → stop and
  ask the user for help.

### Guidelines (from workflow instructions)

- **Never force push.** Always use new commits.
- **Never amend previous commits.** Always create new commits so the user
  can see incremental changes.
- **Always use the user's fork** for PR creation. Never push to upstream org
  repos directly.
- **Never merge without explicit user approval**, even if CI is green and
  reviews are approved.
- **Prefix all review responses** with `[Responded by Copilot on behalf of <user>]`.
- **Keep PRs focused.** Don't mix fixes with refactors.
- **Update PR descriptions** when the approach changes.
- **Be aware that `gh pr merge --auto`** merges immediately if the repo has
  no branch protection. Ask before using it.

---

## Shared considerations

### GitHub CLI (`gh`) dependency

Both skills depend on `gh`. The very first thing each skill should do is
verify `gh` is installed and authenticated:

```bash
gh auth status
```

If `gh` is not installed, provide the installation link
(https://github.com/cli/cli#installation) and stop.
If `gh` is not authenticated, instruct the user to run `gh auth login`.

### PowerShell dependency (Windows dialogs)

The MessageBox dialogs require PowerShell with `System.Windows.Forms`. Both
skills should check for PowerShell availability at startup:

```bash
powershell -Command "echo ok"
```

If unavailable, fall back to text-only notifications in the conversation.

### Relationship between skills

```
create-pr (orchestrator)
  ├── Step 0: [own work — gather all inputs up front, present plan]
  ├── Step 1: merge-and-resolve (existing babylon-skills plugin skill, mode passed through)
  ├── Step 2: [own work — push branch + gh pr create --draft]
  ├── Step 3: code-review (project skill at .github/skills/code-review/, mode passed through)
  ├── Step 4: [own work — commit/push review fixes, gh pr ready, add comment with commit link]
  ├── Step 5: monitor-pr (new project skill)
  └── Step 6: [own work — iteration loop using monitor-pr output]
```

`monitor-pr` is independently useful (users can invoke it standalone to
watch any set of PRs), but it is also consumed by `create-pr` as a
sub-agent.

### Verified `gh` commands

All commands below have been tested and confirmed working:

```bash
# Check auth
gh auth status

# Get current user
gh api user --jq ".login"

# List open PRs by current user
gh pr list --repo "BabylonJS/Babylon.js" -A "@me" --json "number,title,url"

# List all open PRs (default is open, no --state needed)
gh pr list --repo "BabylonJS/Babylon.js" --json "number,title,url"

# View PR details (checks, reviews, approval)
gh pr view <number> --repo "BabylonJS/Babylon.js" --json "number,title,url,reviewDecision,reviews,statusCheckRollup,isDraft,labels,state"

# Get review threads (resolved/total) via GraphQL
gh api graphql -f query='query { repository(owner: "BabylonJS", name: "Babylon.js") { pullRequest(number: <NUMBER>) { reviewThreads(first: 100) { totalCount nodes { isResolved } } } } }' --jq '.data.repository.pullRequest.reviewThreads | {total: .totalCount, resolved: ([.nodes[] | select(.isResolved)] | length)}'

# Get check status (human-readable)
gh pr checks <number> --repo "BabylonJS/Babylon.js"

# Create a draft PR
gh pr create --repo "<owner>/<repo>" --head "<user>:<branch>" --base "<base>" --title "<title>" --body "<body>" --draft --label "<label>" --reviewer "<reviewer>"

# Mark draft as ready for review
gh pr ready <number> --repo "<owner>/<repo>"
```

---

## Implementation tasks

### Task 1: Create `monitor-pr` skill

1. Create directory: `.github/skills/monitor-pr/`
2. Write `SKILL.md` with the full specification above

### Task 2: Create `create-pr` skill

1. Create directory: `.github/skills/create-pr/`
2. Write `SKILL.md` with the full specification above (including the PR
   label rules moved from `pr-labels.instructions.md`)

### Task 3: Test both skills

1. Test `monitor-pr` standalone with a real PR number
2. Test `monitor-pr` with `mine` and `all`
3. Test `create-pr` end-to-end on a test branch
4. Verify the MessageBox dialogs work on Windows
5. Verify graceful fallback when PowerShell is unavailable
