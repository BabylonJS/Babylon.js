---
name: review-branch
description: "Thorough code review of all changes on the current branch. Flags issues by severity (Critical/Warning/Nit) and fixes them. Use when: review my code, review this branch, do a code review, review branch changes, check my changes."
---

# Branch Code Review

You are performing a thorough code review of all changes on the current branch relative to the base branch. Your goal is to find every issue — do not accept code just because it is already written.

## Inputs

- **Base branch**: Use `master` unless the user specifies a different base.
- **Mode**: The user may specify one of two modes:
    - **Automatic** (default): Find all issues, fix them, then present the summary table.
    - **Interactive**: Find all issues, present them to the user first, wait for the user to confirm which to fix, then fix the approved issues and present the summary table.

If the user says "interactive", "review first", "show me the issues first", or similar, use interactive mode. Otherwise, use automatic mode.

## Workflow

### Step 1: Gather the diff

Run the following git commands to collect all changes (committed and uncommitted) relative to the base branch:

```
git diff <base>...HEAD --name-only
git diff --name-only
git diff --name-only --cached
```

Combine the results into a deduplicated list of changed files. If there are no changes, inform the user and stop.

### Step 2: Read the changed files and the diff

- Read the full content of each changed file (not just the diff) to understand the surrounding context.
- Also get the actual diff hunks (`git diff <base>...HEAD` and `git diff`) to know exactly what changed.

### Step 3: Trace impact

For any changed public API, exported function, class, type, or interface:

- Use workspace search to find all callers and consumers of the changed code.
- Verify the changes don't break or degrade those call sites.
- Check if the changes introduce inconsistencies with how the code is used elsewhere.

### Step 4: Review against the checklist

Read `.github/instructions/branch-review.instructions.md` for the full review checklist and severity categories. Apply every check from that file to the changed code.

In particular, for files under `packages/dev/`:

- Read and enforce `.github/instructions/backcompat.instructions.md`
- Read and enforce `.github/instructions/comments.instructions.md`
- Read and enforce `.github/instructions/side-effect-imports.instructions.md` (for `packages/dev/core/src/`)
- Read and enforce `.github/instructions/prohibited-apis.instructions.md`
- Read and enforce `.github/instructions/performance.instructions.md`
- Read and enforce `.github/instructions/tests.instructions.md`
- Read and enforce `.github/instructions/entities.instructions.md`
- Read and enforce `.github/instructions/gltf-extensions.instructions.md` (for glTF extension files)
- Read and enforce `.github/instructions/inspector.instructions.md` (for inspector-v2 files)

### Step 5: Run quality tools

Run the repo's quality commands and capture any failures:

```
npm run format:check
npm run lint:check
npm run test:unit
```

Include any failures from these tools as additional issues in the review.

### Step 6: Compile the issue list

Create a numbered list of all issues found. For each issue, record:

- **#**: Sequential number
- **File**: File path (as a markdown link)
- **Line(s)**: Line number or range
- **Severity**: Critical, Warning, or Nit
- **Issue**: Clear description of the problem

Sort by severity: Critical first, then Warning, then Nit.

### Step 7: Present or fix

**If interactive mode:**

1. Present the full issue list as a table to the user.
2. Ask the user which issues to fix (all, specific numbers, or skip).
3. Fix the approved issues.

**If automatic mode (default):**

1. Fix all Critical and Warning issues. Fix Nit issues as well unless they are purely subjective.
2. After fixing, re-run the quality tools (`format:check`, `lint:check`, `test:unit`) to verify the fixes don't introduce new problems.

### Step 8: Present the summary table

After all fixes are applied, present the final summary as a markdown table:

| #   | File                             | Line(s) | Severity | Issue                    | Fix Applied                                          |
| --- | -------------------------------- | ------- | -------- | ------------------------ | ---------------------------------------------------- |
| 1   | [path/file.ts](path/file.ts#L42) | 42      | Critical | Description of the issue | Description of the fix applied, or "Skipped" / "N/A" |

If no issues were found, congratulate the user on clean code.

## Important Rules

- **Be thorough**: Review every changed line. Do not skip files or gloss over changes.
- **Be critical**: Do not accept code just because it exists. Flag genuine issues regardless of whether the code was written by a human or AI.
- **Be precise**: Reference exact file paths and line numbers for every issue.
- **Be actionable**: Every issue must have a clear fix. Don't flag something unless you can explain what's wrong and how to fix it.
- **Don't over-fix**: Only fix what is genuinely wrong. Don't refactor working code, add unnecessary abstractions, or change style preferences that aren't covered by the repo's rules.
