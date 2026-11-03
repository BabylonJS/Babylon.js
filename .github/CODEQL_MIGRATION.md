# CodeQL migration for fork pull requests

## Status and scope

This repository is **workflow prepared**, not yet migrated:

- `.github/workflows/codeql.yml` is an advanced CodeQL workflow prepared for review.
- GitHub default setup is still configured, so advanced CodeQL uploads are expected to remain blocked until an administrator performs the transition below.
- No fork pull request has been scanned by this workflow.
- No merge gate has been added or verified.

The workflow deliberately:

- uses `pull_request`, not `pull_request_target`, so checkout receives GitHub's pull request merge ref;
- scans `actions` and `javascript-typescript`, matching the current default-setup language coverage;
- uses `build-mode: none`, with no install, build, test, autobuild, repository script, or submitted executable step;
- runs on a disposable GitHub-hosted `ubuntu-latest` runner;
- grants only `contents: read` and `security-events: write` at job scope;
- disables checkout credential persistence;
- uses a trusted inline configuration with `security-extended`, so a pull request cannot select a repository CodeQL config file or add extension packs through that file;
- pins `actions/checkout` v7.0.1 and `github/codeql-action` v4.39.2 to reviewed full commit SHAs.

Static CodeQL extraction still parses submitted source and workflow files. It does not execute Babylon.js project code, package lifecycle scripts, tests, builds, or generators.

## Repository evidence captured on 2026-11-03

- Repository: `BabylonJS/Babylon.js`, public; actual default branch: `master`.
- Default setup API: `configured`; languages `actions`, `javascript`, `javascript-typescript`, and `typescript`; query suite `default`; threat model `remote`; weekly schedule; standard GitHub-hosted runner.
- Current effective default-setup analyses use the canonical categories `/language:actions` and `/language:javascript-typescript`. Current check names observed on `master` are `Analyze (actions)` and `Analyze (javascript-typescript)`.
- Current branch protection applies only to `master`. Its required checks are exactly `Viewer-Configurator`, `AudioEngineCI`, `Graph Tools CI`, `Playground Sandbox CI`, and `Monorepo CI`. It also requires two approvals and conversation resolution. No CodeQL check is currently required.
- Repository rulesets contain no code-scanning result rule. The active default-branch ruleset requires Copilot review and prevents deletion/non-fast-forward updates; it must remain intact.
- GitHub Actions allows all actions. The default workflow token permission is `write`, but this workflow overrides it with the minimum job permissions above. Fork workflow approval is required for first-time contributors.
- Organization-level Actions policy could not be inspected: `GET /orgs/BabylonJS/actions/permissions` returned HTTP 403 because the caller lacks organization administration/Actions-policy permission. Repository settings therefore do not prove that no inherited policy applies.
- The current fork approval policy is only `first_time_contributors`. Branch protection does not require code-owner review, dismiss stale approvals, or require approval after the last push, and no workflow-specific `CODEOWNERS` rule was found.
- The repository has no merge queue. Only `master` is protected. Current releases are tags from the active `master` line; the old unprotected `4.2.1` branch is not evidence of a maintained release branch.
- Recent fork pull requests #19108, #19109, and #19110 had no CodeQL check on their fork head. The code-scanning API returned no analyses for `refs/pull/19109/merge` or `refs/pull/19110/merge`, corroborating GitHub's documented default-setup fork exclusion.
- No `github-codeql-config-file` custom property, repository CodeQL configuration file, or extension-pack configuration was found. The default-setup REST response does not expose model packs selected in the GitHub UI, so trusted model-pack coverage is still unknown until the administrator completes the UI inventory below.

Evidence endpoints:

- `GET /repos/BabylonJS/Babylon.js/code-scanning/default-setup`
- `GET /repos/BabylonJS/Babylon.js/code-scanning/analyses`
- `GET /repos/BabylonJS/Babylon.js/branches/master/protection`
- `GET /repos/BabylonJS/Babylon.js/rulesets`
- `GET /repos/BabylonJS/Babylon.js/actions/permissions`
- `GET /repos/BabylonJS/Babylon.js/actions/permissions/workflow`
- `GET /repos/BabylonJS/Babylon.js/actions/permissions/fork-pr-contributor-approval`
- `GET /repos/BabylonJS/Babylon.js/properties/values`
- `GET /orgs/BabylonJS/actions/permissions` (HTTP 403; inherited policy remains unknown)

GitHub documents that default setup excludes pull requests from forks:
<https://docs.github.com/en/code-security/concepts/code-scanning/setup-types>

## Administrative transition

These steps require repository administration on `BabylonJS/Babylon.js`. They are intentionally not performed by this preparation.

1. Review and merge only `.github/workflows/codeql.yml` and this runbook to `master`. Preserve every existing branch protection, ruleset, contributor approval policy, Actions policy, and required check.
   - Consequence: the initial workflow run may fail to upload while default setup owns CodeQL.
   - Expected evidence: `master` contains `.github/workflows/codeql.yml`; no settings have changed.
   - Recovery: revert the workflow commit if review finds a problem. Do not change settings to make an unreviewed workflow pass.
2. Record a fresh baseline before changing setup.
   - Open **Security and quality** > **Code scanning** and retain the current alert list.
   - Open **Settings** > **Advanced Security**. In the **CodeQL analysis** row, open the current default-setup configuration and record every selected **Model packs** entry.
   - If the model-pack list cannot be inspected, or any trusted model pack is selected, stop the transition. Preserve that coverage by explicitly reviewing and adding an equivalent trusted advanced configuration before disabling default setup.
   - Call the default-setup and recent-analyses endpoints above and save the responses.
   - Expected evidence: default setup is `configured`, successful `master` analyses exist for both `/language:actions` and `/language:javascript-typescript`, and the UI model-pack inventory is recorded.
3. Switch from default to advanced setup using the current GitHub UI:
   - Open **Settings** > **Advanced Security**.
   - In **CodeQL analysis**, open the `...` menu, choose **Switch to advanced**, then choose **Disable CodeQL** in the confirmation dialog.
   - Required permission: repository administrator for `BabylonJS/Babylon.js`.
   - Consequence: **Disable CodeQL disables default setup so advanced-workflow uploads can replace it**. It is not approval to disable code scanning permanently, delete alerts, change alert state, or weaken any branch protection.
   - Expected evidence: the default-setup API is no longer `configured`, while historical alerts remain visible.
   - Recovery: if the advanced workflow cannot be made operational promptly, use **Settings** > **Advanced Security** > **CodeQL analysis** > **Set up** > **Default** to restore default setup, then verify fresh successful analyses for both languages before ending the incident.
4. Start the trusted workflow from `master`.
   - Open **Actions** > **CodeQL** > **Run workflow**, select `master`, and choose **Run workflow**.
   - Expected evidence: exactly two jobs named `Analyze (actions)` and `Analyze (javascript-typescript)` succeed; the code-scanning analyses endpoint shows both categories on `refs/heads/master`.
   - Verify the run uses `actions/checkout` commit `3d3c42e5aac5ba805825da76410c181273ba90b1` and `github/codeql-action` commit `1fc58d04a4d4374f921bdac573c3811c240f9c26`.
   - Recovery: leave merge protection unchanged, inspect only the CodeQL workflow/action logs, and restore default setup as in step 3 if coverage cannot be restored.
5. Validate a benign fork pull request before adding a gate.
   - Use a maintainer-authorized fork and a harmless source-only change. Do not modify `.github/workflows/**`, action definitions, package manifests, lockfiles, build scripts, generators, or executable fixtures in this validation pull request.
   - Do not create or approve a contributor workflow merely for this test without explicit authorization.
   - If GitHub asks to approve a fork workflow, open the pull request's **Files changed** tab and review **all** changed workflows and local/composite actions first. Approval releases every eligible workflow for that revision, not only CodeQL.
   - If authorized after that review, click **Awaiting approval** to open the **Merge status** panel, then click **Approve workflows to run**.
   - Expected Actions evidence: both CodeQL jobs succeed with event `pull_request`.
   - Expected ref evidence: the run and code-scanning analysis use `refs/pull/<number>/merge`; the analyzed SHA is GitHub's pull request merge SHA, not only the fork head SHA.
   - Expected coverage evidence: the pull request checks and code-scanning result UI report CodeQL results for both Actions and JavaScript/TypeScript.
6. Only after step 5 succeeds, configure vulnerability-based merge protection without changing security policy implicitly:
   - Open **Settings**. In the left sidebar under **Code, planning, and automation**, choose **Rulesets**, then **Rulesets**.
   - Choose **New ruleset** > **New branch ruleset**.
   - Target the default branch (`master`) and initially keep enforcement **Disabled** while reviewing the proposed rule.
   - Under **Branch protections**, select **Require code scanning results**.
   - Add tool **CodeQL**.
   - Select **Alerts** and **Security alerts** thresholds through an explicit repository-owner policy decision. Do not infer or lower thresholds during this migration.
   - Confirm the rule does not replace or relax the five existing required checks, two-review requirement, conversation resolution, active Copilot-review ruleset, contributor approval policy, or any other protection.
   - After successful `master` and benign fork scans, obtain explicit repository-owner authorization for the selected thresholds and for activating the rule, then change enforcement to **Active**.
   - Expected baseline evidence: a clean benign fork PR receives both analyses and is not incorrectly blocked. This proves scan delivery and the clean path only; it cannot prove vulnerability-threshold enforcement.
   - Inspect threshold enforcement separately after activation. Use an existing genuine finding at the selected threshold only if the repository owner separately authorizes that validation. Do not introduce a known vulnerability, malicious payload, or synthetic insecure code for this test. If no suitable authorized existing finding is available, record threshold blocking as unverified.
   - Recovery: set only the new code-scanning ruleset to **Disabled**. Do not delete or weaken existing protections. Keep advanced scanning running while investigating.

GitHub's current setup transition instructions:
<https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/configure-code-scanning/configuring-advanced-setup-for-code-scanning>

GitHub's current merge-protection UI and threshold choices:
<https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/manage-your-configuration/set-merge-protection>

## Gate interpretation and remaining gaps

- GitHub executes a `pull_request` workflow from the pull request merge commit. A contributor can therefore propose changes to this workflow or add another workflow that executes submitted code. The checked-in workflow is non-executing only while its reviewed definition remains unchanged.
- The current `first_time_contributors` approval policy means returning outside contributors may run changed workflows without a new maintainer approval. Before treating this design as a repository-wide "no submitted code execution" boundary, obtain explicit authorization to review the stronger setting at **Settings** > **Actions** > **General** > **Approval for running fork pull request workflows from contributors** (for example, **Require approval for all outside collaborators**) and add workflow ownership/review controls. This preparation does not change those settings.
- Even with approval required, approving a run authorizes all eligible workflows at that revision. Review the complete workflow and local-action diff immediately before approval; a previous review can be stale after a new push under the current branch settings.
- A successful `Analyze (...)` check proves the workflow completed and uploaded results; it does **not** prove that no vulnerability was found. Vulnerability-based enforcement requires the separate **Require code scanning results** ruleset.
- A clean benign pull request cannot prove that the configured alert threshold blocks a pull request. Threshold enforcement remains unverified until an active rule encounters a separately authorized existing genuine finding at the selected threshold.
- Do not remove any existing required check. There are currently no required CodeQL checks to remove or rename. If job completion itself should also be mandatory, add both exact names, `Analyze (actions)` and `Analyze (javascript-typescript)`, as required status checks only after they have completed on a real fork PR.
- GitHub documents that code-scanning merge-protection rules do not apply to merge queue groups or to Dependabot pull requests analyzed by default setup. All alert locations must also exist in the pull request diff. These are platform limitations, not workflow success.
- This repository has no merge queue. If one is enabled later, add `merge_group: { types: [checks_requested] }` to the workflow and require both CodeQL job status checks for queue execution. Do not claim vulnerability-based queue gating: GitHub's code-scanning results ruleset does not apply to merge queue groups.
- Dependabot behavior must be validated separately after migration. Do not weaken the ruleset or contributor controls to accommodate it.
- The workflow intentionally does not scan HLSL, SCSS, FLUX, GLSL, shell, Roff, or batch files because CodeQL has no applicable supported language extractor for those repository languages. JavaScript and TypeScript share one CodeQL extractor, which also analyzes JavaScript embedded in HTML files.
- No live advanced upload, fork scan, threshold-enforcement observation, Dependabot path, or recovery drill has been performed by this preparation.
- Do not disable the existing `js/polynomial-redos` alert or exclude its code to work around a separate SARIF supporting-location warning. Triage the warning independently and retain the security finding unless normal alert review proves it incorrect.
