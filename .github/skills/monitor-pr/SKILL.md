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

| Column   | Source                                                                                       |
| -------- | -------------------------------------------------------------------------------------------- |
| PR       | `#<number>` linked to the PR URL                                                             |
| Title    | `gh pr view --json "title"`                                                                  |
| Checks   | `gh pr view --json "statusCheckRollup"` — summarize as ✅ pass / ❌ fail / ⏳ pending counts |
| Comments | GraphQL `reviewThreads` query — resolved/total (e.g. `4/7`)                                  |
| Approved | `gh pr view --json "reviewDecision"` — ✅ if `APPROVED`, ❌ otherwise                        |
| Ready    | ✅ if all checks pass AND approved AND all comments resolved                                 |

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

When checks fail, read the CI logs (GitHub MCP `get_job_logs` or similar).

- **Real failure** — caused by changes in the PR. Show ❌ with a brief
  error summary.
- **Flake** — a test that failed on some iterations and passed on others,
  and is not a new test added in the PR. Show ⚠️ and note it as a
  suspected flake.

## Step 4: Poll loop

Re-poll every **~5 minutes**. On each poll:

1. Re-fetch PR data and print the updated status table to the main chat.
2. If a PR becomes **ready to merge** (all checks pass, approved, all
   comments resolved):
    - Show a Windows dialog (if PowerShell is available):
        ```
        powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.MessageBox]::Show('PR #<number> — <title> — is ready to merge.', 'PR Ready', 'OK', 'Information')"
        ```
    - Always also print a prominent message in the chat.
3. If a PR is merged or closed, remove it from the table and note it.
4. When all monitored PRs are resolved, stop polling and report final
   status.

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
- Don't stop until explicitly told to or until all PRs are resolved.
