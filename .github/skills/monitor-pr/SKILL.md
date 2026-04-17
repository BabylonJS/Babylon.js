---
name: monitor-pr
description: |
    Monitor one or more GitHub PRs and maintain a live status table showing
    title, link, check status, resolved/total comments, and reviewer approval.
    Shows a Windows dialog when a PR is ready to merge.
    Input: a comma-separated list of PR numbers, "mine", or "all".
argument-hint: <pr-numbers | mine | all>
allowed-tools: shell
---

# Monitor PR

Poll GitHub PRs and print a live status table to the main chat. Alert when
a PR is ready to merge.

## Input

Parse `$ARGUMENTS`:

| Value                                      | Meaning                                   |
| ------------------------------------------ | ----------------------------------------- |
| Comma-separated numbers (e.g. `1234,5678`) | Monitor those specific PRs                |
| `mine`                                     | All open PRs authored by the current user |
| `all`                                      | All open PRs in the repo                  |

If `$ARGUMENTS` is empty, ask the user which PRs to monitor.

## Prerequisites

1. Verify `gh` is installed and authenticated (`gh auth status`). If not,
   link to https://github.com/cli/cli#installation and stop.
2. Check if PowerShell is available (`powershell -Command "echo ok"`). If
   unavailable, skip dialog notifications and use text-only alerts.

## Step 1: Resolve the PR list

```bash
# Specific PRs — validate each exists
gh pr view <number> --repo "BabylonJS/Babylon.js" --json "number"

# "mine"
gh pr list --repo "BabylonJS/Babylon.js" -A "@me" --json "number,title,url"

# "all" (defaults to open)
gh pr list --repo "BabylonJS/Babylon.js" --json "number,title,url"
```

## Step 2: Build and display the status table

For each PR, gather:

| Column   | Source                                                                                            |
| -------- | ------------------------------------------------------------------------------------------------- |
| PR       | `#<number>` linked to the PR URL                                                                  |
| Title    | `gh pr view --json "title"`                                                                       |
| Checks   | `gh pr view --json "statusCheckRollup"` — ✅ `all pass` / ❌ `N fail, M pending` / ⏳ `N pending` |
| Comments | GraphQL `reviewThreads` query — ✅ `all resolved` / ❌ `N/M resolved`                             |
| Approved | `gh pr view --json "reviewDecision"` — ✅ `N approvals` / ❌ `not approved`                       |
| Ready    | ✅ `ready` if all checks pass AND approved AND all comments resolved, ❌ `not ready` otherwise    |

Review threads require the GraphQL API since `gh pr view --json` does not
expose them:

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

Print the table to the main chat.

## Step 3: Distinguish real failures from flakes

When checks fail, read the CI logs. Source depends on which CI the
check is on — look at `statusCheckRollup[].detailsUrl` to tell:

- **GitHub Actions** (`detailsUrl` on `github.com`) — use GitHub MCP
  `get_job_logs`, or `gh run view <run-id> --log-failed`.
- **Azure DevOps Pipelines** (`detailsUrl` on `dev.azure.com`) — the
  Babylon.js ADO org (`babylonjs`) allows **anonymous** API access;
  no auth needed. The `detailsUrl` looks like
  `https://dev.azure.com/<org>/<project-guid>/_build/results?buildId=<id>&view=logs&jobId=<job-guid>`.
  Fetch the build timeline and then the failing record's log:

    ```bash
    # List all records (jobs/tasks) and their log URLs
    curl -s "https://dev.azure.com/<org>/<project-guid>/_apis/build/builds/<buildId>/timeline?api-version=7.0"

    # Fetch a specific record's log
    curl -s "<record.log.url>"
    ```

    Filter `timeline.records` to the failing entries (`result == "failed"`)
    and read each `.log.url`. If a `jobId` is present in `detailsUrl`,
    scope directly to that record's children.

Classification:

- **Real failure** — caused by changes in the PR. Show ❌ with a brief
  error summary.
- **Flake** — a test that failed on some iterations and passed on others,
  and is not a new test added in the PR. Show ⚠️ and note it as a
  suspected flake.

## Step 4: Poll loop

> **MANDATORY: You MUST implement a continuous polling loop.** Do not
> display the status once and stop. Do not suggest the user re-invoke the
> skill to refresh. You must keep running and re-checking every ~5 minutes
> until every monitored PR is merged or closed. Use `sleep 300` (or
> equivalent) between polls to wait 5 minutes, then re-fetch and print
> the updated table. This is the core purpose of this skill.

### How to poll

1. After printing the initial status table, sleep for 5 minutes:
    ```bash
    sleep 300
    ```
2. After sleeping, **re-fetch ALL PR data from scratch** using the same
   `gh` and GraphQL commands as Step 2. Every column — checks, comments,
   approval, state — must be queried fresh from the API. **Do not reuse
   or cache any data from a previous polling iteration.** New commits
   can restart all checks, so data from a previous poll may be stale.
3. Print the fully refreshed status table to the main chat.
4. Repeat from step 1.

### On each poll, also check

- If a PR becomes **ready to merge** (all checks pass, approved, all
  comments resolved):
    - Show a Windows dialog (if PowerShell is available):
        ```
        powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('PR #<number> — <title> — is ready to merge.', 'PR Ready', 'OK', 'Information')"
        ```
    - Always also print a prominent message in the chat.
- If a PR is merged or closed, remove it from the table and note it.

### When to stop

Stop polling **only** when:

- Every monitored PR has been merged or closed, OR
- The user explicitly tells you to stop.

**Do NOT stop for any other reason.** Do not stop because "polling isn't
practical in a chat session." Do not stop because "the user can re-invoke
the skill." The entire point of this skill is continuous, autonomous
monitoring.

## Retriggering CI

If the user asks to retrigger CI (e.g. for flakes), push an empty commit:

```bash
git commit --allow-empty -m "retrigger CI"
git push
```

**Never force push.** Always use new commits.

## Guidelines

- Always read CI logs on failures — don't guess at the cause.
- Print the status table to the main chat so the user can follow along.
- **You MUST keep polling until all PRs are merged/closed or the user
  tells you to stop.** Do not exit early. Do not suggest the user
  re-invoke the skill. This skill runs continuously.
