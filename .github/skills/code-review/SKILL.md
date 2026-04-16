---
name: code-review
description: "Thorough code review of all changes on the current branch. Flags issues by severity (Critical/Warning/Nit) and fixes them. Use when: review my code, review this branch, do a code review, review branch changes, check my changes."
---

# Code Review

You are performing a thorough code review of all changes on the current branch relative to the base branch.

A review has two jobs, in this order:

1. **Does the code actually solve the problem it is supposed to solve?** Passing automated checks (compiles, lints, existing tests pass) does not answer this question — those only confirm the code is internally consistent. You must separately verify that the implementation matches its stated intent.
2. **Does the code solve the problem the right way for this repository?** It must follow the repository's conventions (coding style, prohibited APIs, performance rules, documentation standards, test patterns, backward-compatibility rules) and the repo's quality tools (`lint:check`, `format:check`, `test:unit`) must pass.

Find every issue. Do not accept code just because it is already written, and do not accept your own first impressions — walk concrete inputs through the code and compare outputs against the stated intent.

## Inputs

- **Base branch**: Use `master` unless the user specifies a different base.
- **Mode**: The user may specify one of two modes:
    - **Automatic** (default): Find all issues, fix them, then present the summary table.
    - **Interactive**: Find all issues, present them to the user first, wait for the user to confirm which to fix, then fix the approved issues and present the summary table.

If the user says "interactive", "review first", "show me the issues first", or similar, use interactive mode. Otherwise, use automatic mode.

## Severity Categories

Every issue you flag must be assigned one of these severities.

| Severity     | Meaning                                                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | Bugs, runtime crashes, data loss, broken public API contracts, missing side-effect imports that will cause `undefined` at runtime. Must be fixed.                                                                                            |
| **Warning**  | Backward compatibility concerns, missing doc comments on public APIs, performance anti-patterns (render-loop allocations, unnecessary `notifyObservers`), missing tests for new APIs, use of deprecated or prohibited APIs. Should be fixed. |
| **Nit**      | Style, naming, minor readability improvements, non-essential suggestions. Fix if convenient.                                                                                                                                                 |

## Workflow

### Step 1: Gather the diff

Run the following git commands to collect all changes (committed, uncommitted, and untracked) relative to the base branch:

```
git diff <base>...HEAD --name-only
git diff --name-only
git diff --name-only --cached
git ls-files --others --exclude-standard
```

Combine the results into a deduplicated list of changed files. If there are no changes, inform the user and stop.

### Step 2: Read the changed files and the diff

- Read the full content of each changed file (not just the diff) to understand the surrounding context.
- For deleted files, use `git show <base>:<path>` to read the base version and review the deletion via the diff only.
- For renamed files, review both the old and new paths — read the new file from disk and the old file via `git show <base>:<old-path>`.
- Also get the actual diff hunks (`git diff <base>...HEAD` and `git diff`) to know exactly what changed.

**Files to exclude from review** (note them in the summary but do not apply the checklist to them):

- Lockfiles: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`.
- Generated files and build output: anything under `dist/`, `build/`, `coverage/`, `*.d.ts.map`, `*.js.map`, auto-generated declaration files, minified bundles.
- Vendored dependencies: anything under `vendor/`, `third_party/`, `node_modules/`.
- Test snapshots and binary assets: `__snapshots__/`, `*.snap`, reference images (`*.png`, `*.jpg`), fonts, models.
- Pure whitespace / formatting-only changes (flag as a Nit but don't trace them line by line).

If an excluded file contains meaningful hand-written changes (e.g. a hand-edited snapshot, or an intentional change to a lockfile beyond a version bump), note it and review it normally.

### Step 3: Semantic pass — does the code solve the problem?

Do this pass **before** the mechanical checklist. This is where most real bugs are caught; skipping it is the most common way a review misses a bug.

Record the output of this pass in your response, not just in internal reasoning. For each non-trivial new or changed function, produce a short bullet block in your working output containing the stated intent, the enumerated inputs, any input-to-output mismatches, and any missing test coverage. This record is what you'll draw from when compiling the issue table in Step 6.

For the branch as a whole, and then for each non-trivial new or changed function:

1. **Identify the stated intent.** Read the commit messages, PR description, any task/issue reference, and the function's name and doc comment. Write down in one sentence what the code claims to do. If no commit message, PR description, or doc comment explains the intent, derive it from the function name and surrounding call sites, and **flag the missing context as a Warning** — a reviewer should not have to guess what the code is for.
2. **Enumerate representative inputs.** List concrete input shapes the function must handle. Typical shapes to consider: empty, single element, two elements, boundary values at each end of a range, the symmetric counterpart of the obvious case (if the author handled A, did they handle not-A?), and any input that would take the code through a different branch or early return.
3. **Trace the output for each input.** Walk each input through the implementation and compare the result against the stated intent. If any input produces a result that doesn't match the intent, that is a Critical or Warning issue — even if the code compiles, lints, and every existing test passes.
4. **Check test coverage against the enumerated inputs.** If a particular input shape matters to the stated intent and no test exercises it, flag that as a Warning. Passing tests only prove the cases the author thought to test.
5. **For every branch, cache, or shortcut: state the precondition.** When the code takes a fast path, reads a cached value, or returns early for a subset of inputs, write down the precondition under which that path produces the same result as the general path, then check the surrounding code actually guarantees it. Common failure shapes: a cached value computed under different assumptions than when it is read; a memoization keyed on a subset of the real inputs; a length-based shortcut that skips a step the general path would have applied.

### Step 4: Mechanical checklist

Apply each item to every changed line that is not excluded under Step 2.

1. **Repository conventions.** Apply every rule from the instruction files in [instructions/index.md](../../instructions/index.md) that matches the changed files — coding conventions, prohibited APIs, performance rules for render-loop code, side-effect imports, backward-compatibility rules, documentation standards, test patterns, and any domain-specific rules (Inspector, glTF extensions, playgrounds, etc.). If an instruction file's content is already in your system prompt context, apply it directly; only read from disk when it is not.
2. **Correctness.** Logic errors, off-by-one, null/undefined access, race conditions, unhandled edge cases, incorrect operator precedence, wrong loop bounds. Verify that doc comments accurately describe the implementation's actual behavior.
3. **Error handling.** When code detects an error or invalid state (exceeding limits, missing data, unsupported configuration), it must handle it appropriately — bail out, fall back to a safe alternative, or properly resolve the condition. Flag cases that merely log a warning or swallow the error while continuing as if nothing happened.
4. **Security.** Prototype pollution, unsafe `eval` / `Function()`, unsafe deserialization of untrusted input (e.g. parsed scene files, glTF extensions, user-supplied JSON).
5. **General quality.** Dead code, unreachable branches, duplicated logic, overly complex control flow, poor or misleading naming.

#### Scaling the review to large diffs

For small branches (≲ 10 changed files, ≲ 500 changed lines), review every function yourself end-to-end.

For larger branches, protect your context window without losing rigor:

- **Prioritize by risk.** Review in this order: public API changes → core engine logic → shader code → tool/UI code → tests → documentation. Stop and ask the user if the diff is so large that a full review would be infeasible.
- **Batch trivial changes.** If a diff is a mechanical rename or a pure move across many files, verify correctness on a sample and flag the pattern once rather than repeating the same issue per file.
- **Delegate deep dives when available.** If an `Explore` / `explore` / similar read-only subagent is available in your environment, use it to investigate ancillary questions (e.g. "does any caller depend on the old behavior of X?") without consuming main-thread context. Don't delegate the core semantic pass — that stays on the main thread so you can trace inputs precisely.
- **Cap investigation depth.** If tracing a single input through the code is taking more than a few reads, the code is probably too complex and that itself is worth flagging as a Warning.

### Step 5: Run quality tools

Run the repo's quality commands **from the repo root**:

```
npm run format:check
npm run lint:check
npm run test:unit
```

Capture any failures and include them as issues in the review. If a command doesn't exist in this repo or workspace, note that in the summary and continue — do not invent alternative commands or skip the step silently. The branch is not reviewable as "passing" until all three (or their documented equivalents) are clean.

### Step 6: Compile the issue list

Compile every issue found into a single markdown table, sorted by severity (Critical → Warning → Nit). This is the table you will present in Step 8, so record issues in their final format now.

| #   | File                             | Line(s) | Severity | Issue                                                 | Fix Applied                                          |
| --- | -------------------------------- | ------- | -------- | ----------------------------------------------------- | ---------------------------------------------------- |
| 1   | [path/file.ts](path/file.ts#L42) | 42      | Critical | Clear description of the problem and how to fix it    | Filled in during Step 7 ("Skipped" / "N/A" allowed)  |

File paths should be markdown links. The **Fix Applied** column is left blank in Step 6 and filled in during Step 7 as each issue is resolved (or marked `Skipped` / `Needs confirmation` / `N/A`).

### Step 7: Present or fix

The two modes differ only in whether the user approves fixes before or after they are applied. Both modes finish by re-running the quality tools and moving to Step 8.

**If interactive mode:**

1. Present the issue table (with the **Fix Applied** column blank) to the user.
2. Ask the user which issues to fix (all, specific numbers, or skip). Use your environment's structured question mechanism (e.g. an `ask_user` tool) if available, so the user can reply with choices rather than free-form text.
3. Fix the approved issues, filling in the **Fix Applied** column as you go.
4. Re-run the quality tools (`format:check`, `lint:check`, `test:unit`) to verify the fixes don't introduce new problems.

**If automatic mode (default):**

1. Fix all Critical and Warning issues. Fix Nit issues as well unless they are purely subjective.
2. **Exception — design-impacting fixes**: If fixing a Warning or Nit would change the architectural approach or design intent of the code (e.g., restructuring data flow, changing when allocations happen, altering the public API shape), do NOT auto-fix. Mark those issues as `Needs confirmation` in the **Fix Applied** column and skip them during the fix pass.
3. Re-run the quality tools (`format:check`, `lint:check`, `test:unit`) to verify the fixes don't introduce new problems.
4. If any issues were marked `Needs confirmation`, present the current table to the user and ask which of those to fix (use a structured question mechanism like `ask_user` if available). Apply the approved fixes and re-run the quality tools again.

### Step 8: Present the summary

Present the completed issue table to the user. If no issues were found, skip the table and congratulate the user on clean code.

## Important Rules

- **Problem first, then conventions.** The first question is whether the code solves its stated problem; only after that do repo conventions and mechanical correctness matter. A lint-clean, test-passing branch can still ship a bug that defeats its own purpose.
- **Trace, don't trust.** Do not assume the implementation matches its doc comment, function name, or commit message. Walk concrete inputs through the code and compare the outputs against the stated intent.
- **Tests passing is a weak signal.** Existing tests usually cover only the cases the author thought of. When reviewing a new or changed function, explicitly note which enumerated input shapes have no test coverage and flag that as a Warning.
- **State preconditions for every shortcut.** Whenever code takes a branch, uses a cached value, or returns early for a subset of inputs, write down the precondition that makes the shortcut equivalent to the general path, then check the surrounding code guarantees it.
- **Be thorough.** Review every changed line. Do not skip files or gloss over changes.
- **Be critical.** Do not accept code just because it exists. Flag genuine issues regardless of whether the code was written by a human or AI.
- **Be precise.** Reference exact file paths and line numbers for every issue.
- **Be actionable.** Every issue must have a clear fix. Don't flag something unless you can explain what's wrong and how to fix it.
- **Don't over-fix.** Only fix what is genuinely wrong. Don't refactor working code, add unnecessary abstractions, or change style preferences that aren't covered by the repo's rules.
