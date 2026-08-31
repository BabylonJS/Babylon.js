# Azure DevOps Variable Groups Setup

This document describes the variable groups required by the YAML pipelines.
All infrastructure-specific values (storage accounts, CDN endpoints, service
connections) are stored in variable groups to keep them out of source control.

## CI trust boundary

> **ACTION REQUIRED - rotate `DEPLOY_TOKEN`.**
> Between commit `c4f92c1` and the commit that added this notice, the literal
> value of the deployment API token was committed to the repository. It was
> pasted into 27 `Authorization:` headers across the pipeline files in place of
> the intended `$(DEPLOY_TOKEN)` reference, and it also reached
> `.build/changelog.json` by way of the originating pull request description.
> Those occurrences have been replaced with `$(DEPLOY_TOKEN)`, but **removing a
> secret from `HEAD` does not revoke it** - it remains readable in the git
> history and in every fork and clone taken while it was present. The token
> must be revoked and reissued in the `BabylonJS-Deployment` variable group.
>
> `DEPLOY_TOKEN` is expected to hold the _complete_ `Authorization` header
> value (the scheme included, exactly as the deployment server expects it),
> because that is how the original headers were written. Confirm this when
> reissuing it: the pipelines send `Authorization: $DEPLOY_TOKEN` verbatim.

### The problem this layout solves

Azure DevOps compiles a pull request build's YAML **from the pull request's own
branch**. A contributor who can open a pull request therefore controls:

- every step in every job,
- every `- template:` include,
- the root `extends:` target, when that template lives in the same repository,
- and every `condition:` that claims to gate a credentialed step.

No arrangement of jobs, conditions or templates inside those files can survive
an attacker who is allowed to rewrite them. A same-branch `extends:` is a
readability device, not a boundary, and an Azure DevOps **Required template**
check does not close the gap either: it can only pin a template that comes from
a separate protected repository or ref, which this repository does not have.

The only durable rule is therefore about **authorization, not YAML**:

> A pipeline definition that Azure DevOps compiles from pull request branches
> must not be authorized for any secret-bearing protected resource.

### Which pipeline holds what

| Pipeline                    | PR-compiled | Secret resources                                                                          |
| --------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `ci-monorepo.yml`           | **yes**     | none                                                                                      |
| `ci-graph-tools.yml`        | **yes**     | none                                                                                      |
| `ci-playground-sandbox.yml` | **yes**     | none                                                                                      |
| `cd-ci-snapshots.yml`       | no          | `BabylonJS-Deployment`, `GITHUB_SERVICE_CONNECTION`                                       |
| `ci-browser-testing.yml`    | no          | `Browserstack-Opensource`, `BabylonJS-Deployment`                                         |
| `cd-tools.yml`              | no          | `BabylonJS-Deployment`                                                                    |
| `cd-publish.yml`            | no          | `BabylonJS-Deployment`, `BabylonJS-Publish-GitHub`, `BabylonJS-Publish-Npm`, GitHub conn. |

**No pipeline in this repository has a secret variable defined on the pipeline
definition.** Every credential comes from a variable group. See "Why no
credential may be a pipeline variable" below - that rule is what makes the
per-pipeline authorization and branch-control checks in this document
enforceable at all.

`BabylonJS-CI-Infrastructure` holds **no secrets** (public CDN base URL,
deployment-server endpoint _names_, storage account names, service connection
IDs). It is the only group the pull request pipelines map, and it must stay
secret-free - adding a secret to it silently breaks the boundary.

### Why no credential may be a pipeline variable

A secret variable configured in **Pipeline → Edit → Variables** looks protected
because it is masked in the logs. It is not a protected resource:

- it has **no pipeline permissions** - it belongs to the definition, not to a
  library object that can be authorized per pipeline;
- it has **no approvals and checks** - no branch control, no required template,
  no business hours, nothing;
- it is therefore handed to **every run of the definition**.

Anyone with _Queue builds_ permission can start a `pr: none` pipeline **against
an arbitrary ref**, including the head of an unmerged pull request or a branch
pushed to a fork-turned-branch. Azure DevOps then compiles _that ref's_ YAML.
The attacker chooses:

- every job, step and `condition:` in the run,
- every `- template:` include, since they all resolve from the same ref,
- and therefore `templates/assert-trusted-source.yml` itself - the in-repository
  gate is part of the compiled document and can simply be deleted.

So a pipeline-scoped `GitHubPAT` or `NPM_TOKEN` was readable by anyone who could
queue `cd-publish`, no matter what the YAML in `master` said. Both now live in
dedicated variable groups:

| Credential          | Variable group             | Variable name          | Mapped on                                            |
| ------------------- | -------------------------- | ---------------------- | ---------------------------------------------------- |
| GitHub push / notes | `BabylonJS-Publish-GitHub` | `GITHUB_RELEASE_TOKEN` | `cd-publish` → `FetchReleaseNotes`, `PublishRelease` |
| npm registry        | `BabylonJS-Publish-Npm`    | `NPM_REGISTRY_TOKEN`   | `cd-publish` → `PublishNpm`                          |

A variable group **is** a protected resource: it has _Pipeline permissions_ and
_Approvals and checks_. With a branch control check pinned to
`refs/heads/master`, a run of `cd-publish` from any other ref fails the check on
the resource **before the job starts**, so none of the attacker's YAML ever
executes with the credential in scope.

The variable names inside the groups deliberately differ from the pipeline-UI
names they replace, so a leftover UI secret cannot silently satisfy a reference
and mask a missing group. Until an administrator creates and authorizes both
groups, `cd-publish` **fails closed**:
`templates/assert-protected-secret.yml` runs in each credentialed job and fails
the job when the macro expanded to nothing or was left unexpanded. A publish
pipeline that is broken pending secure setup is the intended outcome; retaining
an exploitable pipeline-scoped secret is not.

`.azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs` enforces the
table from inside the repository. It runs in the `FormatLint` job **before**
`npm ci`, so no dependency lifecycle script can subvert it. Run it locally with
`npm run check:pipeline-trust-boundary`. It fails the build when:

- a pull-request-compiled pipeline gains a secret group, a secret variable
  reference or a GitHub service connection;
- any pipeline references a **pipeline-scoped secret variable** (`GitHubPAT`,
  `GITHUBPAT`, `NPM_TOKEN`, `SEARCH_KEY`), or reads a secret whose owning
  variable group is never mapped anywhere in its template graph;
- a secret variable group is mapped at **pipeline scope**, where every job -
  including the ones running dependency lifecycle scripts - could expand it;
- `cd-ci-snapshots.yml` lets its `sourceRunId` or `buildName` parameter default
  to anything but an empty string, drops the `ValidatePublishRequest` gate,
  stops feeding that gate Azure's own resource metadata, or stops re-asserting
  the trigger inside the credentialed CDN job;
- any pipeline uses `Build.SourceBranchName`;
- a credential is passed on a command line or embedded in a URL;
- `npm publish` / `npm pack` runs without `--ignore-scripts`;
- any script body that runs where a credential is in scope interpolates a
  `${{ }}` expression or a `$( )` macro - **including Azure's own system and
  build variables**. Both are textual substitutions performed before the script
  runs, so a value containing a quote escapes the string it lands in and
  executes next to the credential, before any in-script validation could reject
  it. Build metadata is not exempt: git allows `"`, `;` and `$` in a ref name,
  so a branch pushed as

    ```text
    refs/heads/x";SOURCE_BRANCH="refs/heads/master
    ```

    turns `SOURCE_BRANCH="$(Build.SourceBranch)"` into two assignments and walks
    straight through a ref allow-list. Every such value must be passed through
    `env:` and dereferenced as a shell variable, where it can only be data.
    "In scope" means the whole graph of a credentialed pipeline, not only the
    step that maps the secret: a variable group is job-scoped, so any step of that
    job can expand `$(DEPLOY_TOKEN)`.

- the trust gate `templates/assert-trusted-source.yml` renders anything into its
  script body, or stops reading the full ref and the build reason from `env:`.

`npm run check:pipeline-trust-boundary` runs the script's own guard tests
(`--self-test`) before the scan. Two kinds of test run there:

- **Detector tests.** Each rejection above must still fire - a fixture
  reintroducing `SOURCE_BRANCH="$(Build.SourceBranch)"`, a `${{ }}` expression, a
  pipeline-variable macro, a single-line credentialed script, a pipeline-scoped
  secret, a pipeline-scoped secret group and a weakened gate must all be
  flagged, while values passed through `env:` and genuine bash command
  substitutions (`$(mktemp -d)`, `$(pwd)`) must not be.
- **Executable trust-boundary tests.** The publish gate in `cd-ci-snapshots.yml`
  and the resource gate in `templates/assert-trusted-resource-run.yml` are
  extracted from the YAML **as shipped** and executed with each known bypass as
  input: a manual queue that leaves `sourceRunId` empty while pointing the
  resource picker at a pull request run, a manual republish aimed at the master
  snapshot or the CDN, a resource trigger whose upstream run built a
  `refs/pull/...` ref or belongs to another definition, a non-numeric run ID and
  a snapshot name carrying an Azure logging command. Every one of them must be
  rejected, and no rejection may emit a live `##vso[task.setvariable]`. A
  structural check alone would not catch a gate that kept its inputs but lost a
  rule; these do.

### What moved, and what that costs

| Was                                                            | Is now                                                                 |
| -------------------------------------------------------------- | ---------------------------------------------------------------------- |
| PR snapshot upload + PR comments in `ci-monorepo`              | `cd-ci-snapshots.yml`, on master automatically, on demand for a PR run |
| CDN deploy job in `ci-monorepo`                                | `DeployCdn` in `cd-ci-snapshots.yml`                                   |
| BrowserStack vis/perf runs in `ci-monorepo`                    | `ci-browser-testing.yml` (nightly/weekly, `pr: none`)                  |
| Tool/playground/sandbox snapshot upload before tests           | `templates/serve-staged-artifacts.yml` serves the build on loopback    |
| Interaction / KHR / memory-leak tests reading the CDN snapshot | same template, serving the `buildSnapshot` artifact                    |

Two consequences are deliberate:

1. **Pull request runs no longer publish a snapshot or post comments
   automatically.** A pipeline completion trigger does not fire for a pull
   request validation build, and nothing else can publish without a credential.
   Builds still produce every artifact; a maintainer publishes one by queueing
   `cd-ci-snapshots` against `master` with **all three** of `sourceRunId`,
   `buildName` (`refs/pull/<n>/merge`) and `pullRequestId`. `sourceRunId` and
   `buildName` are now mandatory for a manual run - both default to empty, and
   the gate refuses a manual run that supplies neither, because leaving them
   empty would let the queue-time resource picker choose the payload. The YAML
   that runs is always master's, and the artifacts are immutable, so reviewing
   before publishing is a real control. `cd-ci-snapshots` refuses to publish a
   hand-picked run to `refs/heads/master`, `refs/heads/preview` or the
   production CDN. See "Which run `cd-ci-snapshots` is allowed to publish".
2. **Per-commit BrowserStack coverage on master is replaced by the nightly full
   runs** already present in `ci-browser-testing`, plus the `ES6Visualization`
   job moved there. Nothing is only covered by the removed jobs.

### Azure DevOps settings that must be verified by an administrator

These cannot be expressed in YAML.

**1. Create the two release credential groups.** In **Library → + Variable
group**, create:

| Group                      | Variable               | Type       | Value                                                             |
| -------------------------- | ---------------------- | ---------- | ----------------------------------------------------------------- |
| `BabylonJS-Publish-GitHub` | `GITHUB_RELEASE_TOKEN` | **secret** | GitHub PAT able to push to `BabylonJS/Babylon.js` and read issues |
| `BabylonJS-Publish-Npm`    | `NPM_REGISTRY_TOKEN`   | **secret** | granular npm automation token, publish-only                       |

Nothing else goes in either group. Both are consumed only by `cd-publish`.

**2. Delete every pipeline-scoped secret copy.** On `cd-publish` (and on any
pipeline that ever had them), open **Edit → Variables** and remove `GitHubPAT`,
`GITHUBPAT` and `NPM_TOKEN`. A pipeline variable is not a protected resource, so
leaving one in place re-opens the hole no matter how the groups are configured -
the run would receive the secret whatever ref it was queued from. **There must
be no secret variable on any pipeline definition in this project.** After the
move, rotate both credentials: they were reachable from every queued run of
`cd-publish` while they were pipeline variables.

**3. Resource authorization (the control that actually binds the boundary).**
For each of `BabylonJS-Deployment`, `Browserstack-Opensource`,
`BabylonJS-Publish-GitHub`, `BabylonJS-Publish-Npm` and
`GITHUB_SERVICE_CONNECTION`, open **Library → the group → Pipeline
permissions** (or the service connection's **Security**) and turn **off** "Grant
access permission to all pipelines", then grant access to exactly:

| Resource                    | Authorized pipelines                                              |
| --------------------------- | ----------------------------------------------------------------- |
| `BabylonJS-Deployment`      | `cd-ci-snapshots`, `ci-browser-testing`, `cd-tools`, `cd-publish` |
| `Browserstack-Opensource`   | `ci-browser-testing`                                              |
| `BabylonJS-Publish-GitHub`  | `cd-publish`                                                      |
| `BabylonJS-Publish-Npm`     | `cd-publish`                                                      |
| `GITHUB_SERVICE_CONNECTION` | `cd-ci-snapshots`, `cd-publish`                                   |

`ci-monorepo`, `ci-graph-tools` and `ci-playground-sandbox` must not appear
against any of them. A pull request that adds `- group: BabylonJS-Deployment`
back to its own YAML then fails authorization instead of receiving the secret.

**4. Branch control on every secret resource.** On each group above, add
**Approvals and checks → Branch control** with:

| Field                                        | Value                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Allowed branches                             | `refs/heads/master` (add `refs/heads/preview` only where required) |
| Verify branch protection                     | **Enabled**                                                        |
| Ignore the check when the resource is unused | **Disabled**                                                       |

Enter the **exact full ref**, never a wildcard and never a bare branch name: a
tag can be called `master`, and a branch can be called `x/master`, so anything
that matches on the last path segment is not a control. This is what stops a
maintainer-queued run of a `pr: none` pipeline against an arbitrary ref from
receiving the credential. `templates/assert-trusted-source.yml` performs the
same comparison from inside the run as defence in depth, but a check on the
resource cannot be edited by the ref being checked, and the in-repository gate
can.

**5. Required template check (recommended, for the credential groups).** Azure
DevOps can additionally require that a run `extends:` a specific template from a
**protected repository resource pinned to an exact ref** before it may use a
resource. Configure it on `BabylonJS-Publish-GitHub`, `BabylonJS-Publish-Npm`
and `BabylonJS-Deployment` once a pinned template repository (or a
`resources.repositories` entry for this repository with
`ref: refs/heads/master`) exists. A same-branch `extends:` is _not_ a control -
the pull request that rewrites the root file rewrites the template with it.
Until then, branch control (step 4) is the binding check, and it is sufficient:
with it in place, no arbitrary-ref YAML can obtain any protected resource,
because the check is evaluated against the run's ref before the job starts.

**6. Default branch for manual and scheduled builds** must be
`refs/heads/master` on `cd-ci-snapshots`, `cd-publish`, `cd-tools` and
`ci-browser-testing`, so a pipeline-completion or manual run always compiles
master's YAML.

Per-pipeline pull request validation settings:

| Setting                                                        | Required value | Applies to                                         |
| -------------------------------------------------------------- | -------------- | -------------------------------------------------- |
| Make secrets available to builds of forks                      | **Disabled**   | ci-monorepo, ci-playground-sandbox, ci-graph-tools |
| Require a team member's comment before building a pull request | **Enabled**    | ci-monorepo, ci-playground-sandbox, ci-graph-tools |
| Build pull requests from forks of this repository              | Enabled        | ci-monorepo, ci-playground-sandbox, ci-graph-tools |

Additional administrator-side requirements:

- The `GITHUB_SERVICE_CONNECTION` service connection must **not** be marked as
  available to fork builds, and should be granted only `public_repo` /
  issue-comment scope so a leak cannot be used to push code.
- `DEPLOY_TOKEN` must only be able to write under the snapshot storage account
  and purge CDN endpoints.
- `BROWSERSTACK_ACCESS_KEY` must belong to the open-source plan account only,
  and must be a **restricted sub-account** - see "Residual risk" below, which
  also describes the short-lived credential broker this account needs.
- `GITHUB_RELEASE_TOKEN` and `NPM_REGISTRY_TOKEN` live **only** in
  `BabylonJS-Publish-GitHub` and `BabylonJS-Publish-Npm`, which are authorized
  for `cd-publish` alone. They must never be copied into a pipeline variable, a
  shared group, or a group authorized for a PR-compiled pipeline.
- `GITHUB_RELEASE_TOKEN` should be a fine-grained PAT limited to
  `BabylonJS/Babylon.js` with `contents: write` (for the tag/branch push) and
  `issues: read` (for the changelog); it needs nothing else.
- The npm publish token should be replaced by npm trusted publishing (OIDC) as
  soon as the Azure DevOps agent pool supports it for this account; until then
  it must be a granular, publish-only token scoped to the `@babylonjs` scope
  and the `babylonjs-*` packages.
- Pipelines must not enable "Allow scripts to access the OAuth token"; the YAML
  never references `System.AccessToken`, and every `checkout` sets
  `persistCredentials: false`.
- Restrict **Queue builds** permission on `cd-ci-snapshots`, `cd-publish`,
  `cd-tools` and `ci-browser-testing` to maintainers. Queue permission on a
  `pr: none` pipeline is what lets someone choose the ref that gets compiled and
  the upstream run that gets published, so it is a credential-adjacent
  permission even with every check above in place.
- Mark the deployment endpoint variables as **read-only** in the variable group
  UI. The YAML already declares `BuildName` `readonly: true`, but variables that
  come from a group can only be locked there.

### Which run `cd-ci-snapshots` is allowed to publish

`cd-ci-snapshots` takes its payload from a **different pipeline's run**, so
"which run" is a trust decision, not a convenience.

Azure DevOps resolves a `resources.pipelines` entry two ways, and they look
identical in the resource variables:

1. **A real completion trigger.** `Build.Reason` is `ResourceTrigger` and the
   upstream run is one the trigger's branch filter allowed.
2. **A hand-picked run.** Whoever queues the pipeline chooses a run in the
   **Resources** panel. `Build.Reason` is `Manual`, and the picker lists _every_
   run of the source pipeline - including pull request validation runs of
   unmerged code.

Reading "no `sourceRunId` was supplied" as "this is the trusted automatic
publish" therefore let a manual queue publish a pull request's artifacts to the
master snapshot and the production CDN. The rules now are:

| Publish                    | `sourceRunId` | Required `Build.Reason` | Destination                                             | CDN         |
| -------------------------- | ------------- | ----------------------- | ------------------------------------------------------- | ----------- |
| Automatic (master/preview) | **empty**     | `ResourceTrigger`       | the upstream run's own verified full ref                | allowed     |
| Manual republish           | **required**  | `Manual`                | `buildName`, never `refs/heads/master` or `.../preview` | **refused** |

- For an automatic publish the gate additionally requires that the upstream run
  belongs to the expected definition (`SourceDefinitionId`), that its full ref
  is exactly `refs/heads/master` or `refs/heads/preview`, and that the run ID it
  resolved matches the triggering run. All three come from Azure's own resource
  metadata (`resources.pipeline.ciMonorepo.pipelineID`, `.sourceBranch`,
  `.runID`), passed in through `env:`; none of them is a queue-time parameter.
- The destination of an automatic publish is **not** a parameter either. Both
  `sourceRunId` and `buildName` default to the empty string, and `BuildName` is
  taken from the verified upstream ref. The production CDN path is chosen by the
  gate from the literals `cdn/master` and `cdn/preview` and handed to `DeployCdn`
  as an output variable.
- `DeployCdn` is only compiled for a run that supplied no `sourceRunId`, depends
  on the gate, runs only when the gate resolved a CDN destination, **and**
  re-asserts the whole thing on its own credentialed agent through
  `templates/assert-trusted-resource-run.yml`. A weakened `dependsOn` or
  `condition` therefore cannot open a path to production on its own.
- Every value the gate judges arrives through `env:`, and every value it echoes
  is stripped of `##vso[...]` sequences first, so a queued string can neither
  break out of the script nor inject an Azure Pipelines logging command into a
  job that holds `DEPLOY_TOKEN`.

`cd-tools` also declares a pipeline resource, but only for its completion
trigger: it downloads no artifact from that run, so there is nothing for a
resource picker to redirect. Its production deployment is still gated by
`templates/assert-trusted-source.yml`, which requires an exact trusted full ref.

### Guarantees enforced by the YAML in this repository

- Every `checkout` sets `persistCredentials: false`, so the pipeline OAuth
  token is never written to `.git/config` where PR-controlled code could read
  it.
- Secrets are mapped at job scope at the widest (`variables: - group:` on the
  single job that needs them) and into individual steps (`env:`) where possible.
  No secret group is mapped at pipeline level in any pipeline that also runs
  `npm ci`.
- No branch decision uses `Build.SourceBranchName`. That variable is only the
  last segment of the ref, so a tag named `master` (`refs/tags/master`) reports
  `master` and would pass. Credentialed pipelines compare the full
  `Build.SourceBranch`, or use `TrustedBranchName`, which
  `templates/assert-trusted-source.yml` derives from the full ref _after_
  matching it against an allow-list.
- Every job that holds a credential runs `templates/assert-trusted-source.yml`
  as its first step. It is a step, not a `condition:`, because a false condition
  marks a job "skipped", which reads as success downstream, whereas an untrusted
  ref must be a hard failure.
- Every credential a job maps is then checked by
  `templates/assert-protected-secret.yml`, which fails the job when the value is
  empty or when the macro was left unexpanded because the variable group is not
  linked. A missing protected resource stops the release; it never degrades into
  a step that quietly ran with no token.
- No credential is ever placed on a command line or in a URL. `DEPLOY_TOKEN` is
  handed to `curl` on stdin (`--config -`) from an `env:`-mapped shell variable;
  `GITHUB_RELEASE_TOKEN` is consumed by an inline git credential helper that is
  removed before the step ends.
- `cd-publish.yml` writes `NPM_REGISTRY_TOKEN` to an ephemeral user config in
  the agent temp directory (mode `0600`) that is deleted in an `always()` step,
  instead of overwriting the repository `.npmrc`. The config also sets
  `ignore-scripts=true` and publishing runs with `--ignore-scripts`, so no
  package lifecycle script executes while the registry token is reachable.
- `scripts/generateChangelog.js` sends the PAT in an HTTP `Authorization`
  header instead of interpolating it into a `curl` command line.
- `scripts/versionUtils.js` and `scripts/generateChangelog.js` strip
  `GITHUBPAT`, `NPM_TOKEN`, `DEPLOY_TOKEN` and related keys from the
  environment of every child process they spawn. Those are the _process
  environment_ names the Node scripts read; the Azure variables that populate
  them are `GITHUB_RELEASE_TOKEN` and `NPM_REGISTRY_TOKEN`.

#### Artifact-mediated trust boundary

Every pipeline is split into jobs that run repository or dependency code and
jobs that hold a credential. They never overlap, and they never share an agent:

|              | Jobs that run repository/dependency code      | Credentialed jobs                                          |
| ------------ | --------------------------------------------- | ---------------------------------------------------------- |
| Checkout     | `checkout: self`                              | `checkout: none`                                           |
| Credentials  | none                                          | `DEPLOY_TOKEN`, `GITHUB_SERVICE_CONNECTION`                |
| Steps        | build, test, and `templates/stage-upload.yml` | only steps declared in `templates/publish-uploads-job.yml` |
| Destinations | not known to the job                          | literals in trusted YAML                                   |

| Pipeline                | Credential-free jobs                                 | Credentialed job (`checkout: none`)                                                  |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `ci-monorepo`           | all jobs                                             | none                                                                                 |
| `ci-graph-tools`        | all jobs                                             | none                                                                                 |
| `ci-playground-sandbox` | all jobs                                             | none                                                                                 |
| `cd-ci-snapshots`       | none (no job checks anything out)                    | `PublishSnapshot`, `PublishTestReports`, `DeployCdn`                                 |
| `cd-tools`              | `BuildTools` (npm ci, tool builds, artifact staging) | `DeployTools` (`DEPLOY_TOKEN` only)                                                  |
| `ci-browser-testing`    | `ClosureCompile`, `ResolvePerfVersions`              | test jobs (BrowserStack), `PublishReports` (`DEPLOY_TOKEN`)                          |
| `cd-publish`            | `BuildRelease` (npm ci, build, pack, bundle)         | `FetchReleaseNotes` (GitHub), `PublishNpm` (npm), `PublishRelease` (GitHub + deploy) |

- Because each Azure Pipelines job runs on a freshly provisioned agent, a
  background process left behind by `npm ci` or a Playwright spec cannot
  observe a credentialed job's process table, environment or filesystem. Job
  separation - not step ordering - is what contains a compromised dependency.
- Upload destinations are literal strings in the calling YAML and are
  re-validated in the publish job (no `..`, no absolute paths, no spaces,
  `[A-Za-z0-9._/-]` only). They are never read out of the downloaded artifact,
  so a build job cannot redirect an upload by writing a manifest.
- `BuildName` is `readonly`, and `##vso[task.setvariable]` does not cross job
  boundaries, so the destination prefix cannot be rewritten by a build job. In
  `cd-ci-snapshots` it is either a compile-time parameter (manual republish) or
  Azure's own record of the triggering run's full ref (automatic publish); the
  `Gate` job validates whichever one applies before any credentialed job runs,
  and no job can change it afterwards.
- The production CDN destination in `cd-ci-snapshots` is never a parameter and
  never comes from an artifact: the `Gate` picks it from the literals
  `cdn/master` and `cdn/preview`, and only for a verified automatic publish.
- Comment bodies that are fixed text live in trusted YAML; bodies generated by
  test code (memory-leak reports) travel as artifacts and have Azure Pipelines
  logging commands stripped before use.

#### `cd-publish.yml` job separation

`cd-publish.yml` is split into four jobs so that no credential is present while
package code executes. No secret is a pipeline variable; each job maps only the
protected group it needs:

1. `FetchReleaseNotes` - maps `BabylonJS-Publish-GitHub`. Checks the repository
   out but never runs `npm ci`, fetches the release notes with Node built-ins,
   scans the result for token-shaped strings and publishes it as an artifact.
2. `BuildRelease` - runs `npm ci`, `npm install`, the tests and the full build,
   then `npm pack -ws --ignore-scripts`. It maps **no** variable group, so it
   holds no registry token, no deployment token and no GitHub service
   connection, and emits the tarballs, a git bundle and the release assets as
   immutable pipeline artifacts.
3. `PublishNpm` - `checkout: none`, maps `BabylonJS-Publish-Npm`. Downloads the
   tarballs and uploads them with `--ignore-scripts` using an ephemeral `0600`
   npm user config that also sets `ignore-scripts=true`. No repository code is
   on the agent.
4. `PublishRelease` - `checkout: none`, maps `BabylonJS-Deployment` and
   `BabylonJS-Publish-GitHub`. Rebuilds the branch from the git bundle, pushes
   with an inline credential helper under `git -c core.hooksPath=/dev/null`,
   creates the GitHub release and updates the CDN.

Each credentialed job runs `templates/assert-trusted-source.yml` and then
`templates/assert-protected-secret.yml` for every secret it maps, so a missing
or unauthorized group fails the job instead of silently degrading to an empty
token.

Workspace publish order is preserved by recording the `npm pack -ws --json`
order in `order.txt` and republishing in that sequence.

### Residual risk

- **BrowserStack executes repository test code, and the CDP protocol carries the
  credentials.** The Playwright BrowserStack config, the spec files and
  `browserstack-wait.sh` all come from the checkout, and Playwright reaches
  BrowserStack by putting the username and access key into the
  `connectOptions.wsEndpoint` WebSocket URL. Any code running in that job can
  therefore read a long-lived account credential out of its own environment.
  This cannot be fixed in the pipeline YAML - the protocol requires the
  credential in the client process - so it is contained instead:

    - the credentials are only ever reachable from **merged master** code:
      `ci-browser-testing` has no pull request trigger, every BrowserStack job
      asserts a trusted full ref before it starts, and no artifact from a pull
      request run is consumed there;
    - **the account must be a restricted sub-account.** Create a dedicated
      BrowserStack user on the open-source plan whose only capability is
      starting Automate sessions. It must not be able to manage billing, invite
      or remove users, read other users' sessions, rotate or read API keys, or
      change plan settings. A leak of the CI key must not be a leak of the
      organisation's BrowserStack account.
    - **the key should be brokered, not stored.** The durable fix is to stop
      putting a standing credential in the job at all: an external broker
      service (outside this repository and outside the agent's trust boundary)
      holds the BrowserStack account credential, authenticates the pipeline run,
      and returns a **short-lived, session-scoped** credential valid only for
      the duration of that run. The job then never holds anything worth stealing
      beyond the run it is already executing, and a leak expires by itself. Until
      such a broker exists, the sub-account restriction above and a scheduled
      rotation of `BROWSERSTACK_ACCESS_KEY` are the compensating controls, and a
      leak must be assumed to last until the next rotation.

- **`npm ci` runs before the release credentials in `cd-publish`, in a
  different job.** A dependency that compromises `BuildRelease` cannot read a
  credential, but it can tamper with the tarballs that `PublishNpm` uploads.
  Lockfile review and `--ignore-scripts` reduce, but do not remove, this.
- **Queue-time parameters are substituted into the YAML before it is parsed.**
  `${{ parameters.x }}` is a textual substitution, so a queued value is
  compile-time input to the document itself. Every parameter this repository
  interpolates at compile time is either compared against literals
  (`eq(parameters.sourceRunId, '')`) or lands in a variable that a runtime gate
  re-validates before use, and the GitHub comment target is passed as a runtime
  macro resolved from the gate's validated output rather than as the raw
  parameter. Restricting **Queue builds** on the `pr: none` pipelines to
  maintainers remains part of this control.
- **Pipeline YAML remains pull-request-controlled.** That is why the boundary is
  expressed as resource authorization rather than as YAML structure. Until the
  authorization and branch-control checks listed above are configured, the YAML
  in this repository documents the boundary but Azure DevOps does not enforce
  it.

## Variable Group: `BabylonJS-CI-Infrastructure`

Create this variable group in **Azure DevOps → Pipelines → Library** and link
it to every pipeline that references it.

> **This group must never contain a secret.** It is the only group linked to the
> pull-request-compiled pipelines (`ci-monorepo`, `ci-graph-tools`,
> `ci-playground-sandbox`), so anything added here is readable by any pull
> request. Every value below is public information or a non-credential
> identifier.

### Core Infrastructure

| Variable                    | Description                                                                | Example                                |
| --------------------------- | -------------------------------------------------------------------------- | -------------------------------------- |
| `SNAPSHOTS_STORAGE_ACCOUNT` | Azure Storage account for PR/branch snapshots                              | `mystorageaccount`                     |
| `TOOLS_STORAGE_ACCOUNT`     | Azure Storage account for production tool deployments                      | `mytoolsaccount`                       |
| `SNAPSHOT_CDN_URL`          | Base URL of the snapshot CDN (no trailing slash)                           | `https://my-cdn.example.net`           |
| `GITHUB_SERVICE_CONNECTION` | GitHub service connection ID for `GitHubComment` and `GitHubRelease` tasks | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `DEVOPS_PROJECT_ID`         | Azure DevOps project GUID (used for cross-project artifact downloads)      | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `BOT_EMAIL`                 | Email address used for automated git commits in the publish pipeline       | `bot@example.com`                      |

### Deployment Server API Endpoints

These are the API endpoint paths on the deployment server. Storing them as
variables hides the server's API surface from public source code.

| Variable                         | Description                              |
| -------------------------------- | ---------------------------------------- |
| `DEPLOY_ENDPOINT_UPLOAD`         | File upload endpoint path                |
| `DEPLOY_ENDPOINT_DELETE`         | Snapshot/path deletion endpoint path     |
| `DEPLOY_ENDPOINT_PURGE`          | CDN cache purge endpoint path            |
| `DEPLOY_ENDPOINT_SNAPSHOT_CHECK` | Check if a snapshot exists endpoint path |

### CDN Purge Endpoints

These are Azure Front Door endpoint names used in CDN cache purge calls.

| Variable                   | Description                       |
| -------------------------- | --------------------------------- |
| `CDN_ENDPOINT_CDN`         | Main CDN endpoint                 |
| `CDN_ENDPOINT_PREVIEW_CDN` | Preview CDN endpoint              |
| `CDN_ENDPOINT_SANDBOX`     | Sandbox tool endpoint             |
| `CDN_ENDPOINT_PLAYGROUND`  | Playground tool endpoint          |
| `CDN_ENDPOINT_NME`         | Node Material Editor endpoint     |
| `CDN_ENDPOINT_NGE`         | Node Geometry Editor endpoint     |
| `CDN_ENDPOINT_NRGE`        | Node Render Graph Editor endpoint |
| `CDN_ENDPOINT_GUIEDITOR`   | GUI Editor endpoint               |
| `CDN_ENDPOINT_NPE`         | Node Particle Editor endpoint     |
| `CDN_ENDPOINT_FGE`         | Flow Graph Editor endpoint        |
| `CDN_ENDPOINT_DOCS`        | Documentation site endpoint       |

### CDN Purge Profiles

Azure Front Door profile names used alongside the endpoints above.

| Variable                 | Description                                             |
| ------------------------ | ------------------------------------------------------- |
| `CDN_PROFILE_CDN`        | Profile for main CDN and preview CDN endpoints          |
| `CDN_PROFILE_SANDBOX`    | Profile for the sandbox endpoint                        |
| `CDN_PROFILE_PLAYGROUND` | Profile for the playground endpoint                     |
| `CDN_PROFILE_TOOLS`      | Profile for all editor tool and documentation endpoints |

## Variable Group: `Browserstack-Opensource`

BrowserStack credentials shared by pipelines that run browser tests.

| Variable                  | Description             |
| ------------------------- | ----------------------- |
| `BROWSERSTACK_ACCESS_KEY` | BrowserStack access key |
| `BROWSERSTACK_USERNAME`   | BrowserStack username   |

Linked by: ci-browser-testing only.

**This group must never be authorized for `ci-monorepo`,
`ci-playground-sandbox` or `ci-graph-tools`.** Those definitions are compiled
from pull request branches, so a `${{ if ne(variables['Build.Reason'],
'PullRequest') }}` guard around the group mapping is not a control - a pull
request simply deletes the guard. `ci-browser-testing` has `pr: none`, maps the
group at job scope on the BrowserStack jobs only, and asserts a trusted full ref
before any of them starts.

### BrowserStack connection

All pipelines connect to BrowserStack directly over CDP using Playwright's
`connectOptions.wsEndpoint` (configured in `playwright.browserstack.config.ts`).
The browser, OS, and credentials are passed as capabilities in the WebSocket URL.

**CI invocation (in YAML pipelines):**

```yaml
- script: npx playwright test --config ./playwright.browserstack.config.ts
  env:
      BSTACK_TEST_TYPE: "webgl2" # or webgpu, performance, interaction
      CDN_BASE_URL: "$(SNAPSHOT_CDN_URL)/$(BuildName)"
      BROWSERSTACK_USERNAME: $(BROWSERSTACK_USERNAME)
      BROWSERSTACK_ACCESS_KEY: $(BROWSERSTACK_ACCESS_KEY)
```

**Key environment variables for CI:**

| Variable                          | Description                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `BSTACK_TEST_TYPE`                | Selects test suite and dashboard build name (`webgl2`, `webgpu`, `performance`, `interaction`, `es6vis`) |
| `BSTACK_BROWSER`                  | Override browser for cross-browser runs (e.g. `playwright-firefox`, `playwright-webkit`)                 |
| `BSTACK_OS` / `BSTACK_OS_VERSION` | Override OS/version (e.g. `OS X` / `Sonoma`)                                                             |
| `BSTACK_SESSIONS_REQUIRED`        | Preferred number of parallel sessions to reserve (default: 1)                                            |
| `BSTACK_MAX_SESSIONS`             | Max sessions on the BrowserStack plan; caps REQUIRED (default: 5)                                        |
| `BROWSERSTACK_LOCAL`              | Enables BrowserStack Local tunnel startup for suites that need a local dev server                        |
| `BROWSERSTACK_LOCAL_IDENTIFIER`   | Unique BrowserStack Local tunnel identifier for local-tunnel suites such as ES6 vis                      |
| `CIWORKERS`                       | Number of parallel BrowserStack sessions (default: set by browserstack-wait.sh)                          |

## Variable Group: `BabylonJS-Deployment`

Deployment server credentials shared by pipelines that upload snapshots or
deploy tools.

| Variable            | Description                           |
| ------------------- | ------------------------------------- |
| `DEPLOY_TOKEN`      | Deployment server authorization token |
| `DEPLOYMENT_SERVER` | Deployment server base URL            |

**Authorized pipelines: `cd-ci-snapshots`, `ci-browser-testing`, `cd-tools`,
`cd-publish` only.** This group carries a credential, so it must never be
authorized for `ci-monorepo`, `ci-playground-sandbox` or `ci-graph-tools`, which
Azure DevOps compiles from pull request branches. See "CI trust boundary" above.
Every pipeline that uses it maps it at **job** scope, never at pipeline scope,
so the jobs that run `npm ci` never have it in their variable scope.

### Secret variables must never be configured on a pipeline

Azure DevOps lets a secret be defined on the pipeline definition itself
(**Pipeline → Edit → Variables → keep this value secret**). **Do not use it for
anything in this project.** A pipeline variable is not a protected resource: it
has no pipeline permissions, no branch control and no required-template check,
so it is handed to every run of the definition, including a run queued against
an arbitrary ref whose YAML - gates included - the queuer wrote.

Credentials that used to be configured that way, and where they live now:

| Was (pipeline variable) | Now (protected group)      | Variable               | Used by      |
| ----------------------- | -------------------------- | ---------------------- | ------------ |
| `GitHubPAT`             | `BabylonJS-Publish-GitHub` | `GITHUB_RELEASE_TOKEN` | `cd-publish` |
| `NPM_TOKEN`             | `BabylonJS-Publish-Npm`    | `NPM_REGISTRY_TOKEN`   | `cd-publish` |

A `SEARCH_KEY` for a documentation build, if that pipeline is ever added here,
must follow the same rule: its own variable group, authorized for that pipeline
only, mapped at job scope.

`validate-pipeline-trust-boundary.mjs` fails the build if `$(GitHubPAT)`,
`$(GITHUBPAT)`, `$(NPM_TOKEN)` or `$(SEARCH_KEY)` reappears in any pipeline, and
if a secret is read without its owning group being mapped somewhere in that
pipeline's template graph.

## Variable Group: `BabylonJS-Publish-GitHub`

GitHub credential used by the release pipeline. **Authorized pipelines:
`cd-publish` only.** Branch control: `refs/heads/master` (exact full ref).

| Variable               | Type   | Description                                                                               |
| ---------------------- | ------ | ----------------------------------------------------------------------------------------- |
| `GITHUB_RELEASE_TOKEN` | secret | GitHub PAT used to push the release branch and tags, and to read issues for the changelog |

Mapped at **job** scope on `FetchReleaseNotes` and `PublishRelease`, both of
which run `templates/assert-trusted-source.yml` and then
`templates/assert-protected-secret.yml` before touching it. `BuildRelease`, the
job that runs `npm ci` and the full build, never maps it.

## Variable Group: `BabylonJS-Publish-Npm`

npm registry credential used by the release pipeline. **Authorized pipelines:
`cd-publish` only.** Branch control: `refs/heads/master` (exact full ref).

| Variable             | Type   | Description                                            |
| -------------------- | ------ | ------------------------------------------------------ |
| `NPM_REGISTRY_TOKEN` | secret | npm automation token, publish-only, `@babylonjs` scope |

Mapped at **job** scope on `PublishNpm`, which runs with `checkout: none` and
uploads only the immutable tarballs produced by `BuildRelease`, with
`--ignore-scripts`.

### Manual YAML Configuration

These values must be edited directly in the YAML files because Azure DevOps
`resources.pipelines.source` does not support runtime variable expansion.

| Value                          | File                | Description                                                     |
| ------------------------------ | ------------------- | --------------------------------------------------------------- |
| `<PUBLISH_PIPELINE_NAME>`      | ci-monorepo.yml     | Name of the cd-publish YAML pipeline (build completion trigger) |
| `<NATIVE_TESTS_PIPELINE_NAME>` | ci-monorepo.yml     | Name of the native tests pipeline (artifact download source)    |
| `<CI_MONOREPO_PIPELINE_NAME>`  | cd-ci-snapshots.yml | Name of the ci-monorepo pipeline (completion trigger + source)  |

Replace the `<...>` placeholders with the actual pipeline names after creating
them in Azure DevOps. `cd-ci-snapshots.yml` additionally hard-codes the
ci-monorepo **definition ID** (`SourceDefinitionId`, currently `14`) so it can
only ever download artifacts from that one definition; update it if the
definition is recreated.

## Linking the Variable Group

Each pipeline YAML references the variable group via:

```yaml
variables:
    - group: BabylonJS-CI-Infrastructure
    - name: BuildName
      value: $(Build.SourceBranch)
```

After creating a new YAML pipeline, go to **Pipeline → Edit → Variables →
Variable groups** and link `BabylonJS-CI-Infrastructure`. The pipeline must be
authorized to access the group.

Secret-bearing groups (`BabylonJS-Deployment`, `Browserstack-Opensource`,
`BabylonJS-Publish-GitHub`, `BabylonJS-Publish-Npm`) are mapped at **job** scope
instead, so that only the jobs that need them can see them, and each such job
proves its source ref and then proves the secret really arrived:

```yaml
- job: DeploySomething
  variables:
      - group: BabylonJS-Deployment
  steps:
      - checkout: none
      - template: templates/assert-trusted-source.yml
      - template: templates/assert-protected-secret.yml
        parameters:
            variableName: DEPLOY_TOKEN
            variableGroup: BabylonJS-Deployment
            value: $(DEPLOY_TOKEN)
```

`validate-pipeline-trust-boundary.mjs` fails the build if any of them is mapped
in the pipeline-level `variables:` block instead.

> **Note:** The `GITHUB_SERVICE_CONNECTION` variable is used in `GitHubComment@0`
> and `GitHubRelease@1` task inputs. After linking the variable group, you may
> need to manually authorize the service connection for each pipeline that
> uses it (Pipeline → Settings → Service connections).
