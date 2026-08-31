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

| Pipeline                    | PR-compiled | Secret resources                                              |
| --------------------------- | ----------- | ------------------------------------------------------------- |
| `ci-monorepo.yml`           | **yes**     | none                                                          |
| `ci-graph-tools.yml`        | **yes**     | none                                                          |
| `ci-playground-sandbox.yml` | **yes**     | none                                                          |
| `cd-ci-snapshots.yml`       | no          | `BabylonJS-Deployment`, `GITHUB_SERVICE_CONNECTION`           |
| `ci-browser-testing.yml`    | no          | `Browserstack-Opensource`, `BabylonJS-Deployment`             |
| `cd-tools.yml`              | no          | `BabylonJS-Deployment`                                        |
| `cd-publish.yml`            | no          | `BabylonJS-Deployment`, `GitHubPAT`, `NPM_TOKEN`, GitHub conn |

`BabylonJS-CI-Infrastructure` holds **no secrets** (public CDN base URL,
deployment-server endpoint _names_, storage account names, service connection
IDs). It is the only group the pull request pipelines map, and it must stay
secret-free - adding a secret to it silently breaks the boundary.

`.azure-pipelines/scripts/validate-pipeline-trust-boundary.mjs` enforces the
table from inside the repository. It runs in the `FormatLint` job **before**
`npm ci`, so no dependency lifecycle script can subvert it. Run it locally with
`npm run check:pipeline-trust-boundary`. It fails the build when:

- a pull-request-compiled pipeline gains a secret group, a secret variable
  reference or a GitHub service connection;
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
(`--self-test`) before the scan. They assert that each rejection above still
fires - a fixture reintroducing `SOURCE_BRANCH="$(Build.SourceBranch)"`, a
`${{ }}` expression, a pipeline-variable macro, a single-line credentialed
script and a weakened gate must all be flagged, while values passed through
`env:` and genuine bash command substitutions (`$(mktemp -d)`, `$(pwd)`) must
not be.

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
   `cd-ci-snapshots` against `master` with `sourceRunId`, `buildName`
   (`refs/pull/<n>/merge`) and `pullRequestId`. The YAML that runs is always
   master's, and the artifacts are immutable, so reviewing before publishing is
   a real control. `cd-ci-snapshots` refuses to publish a hand-picked run to
   `refs/heads/master`, `refs/heads/preview` or the production CDN.
2. **Per-commit BrowserStack coverage on master is replaced by the nightly full
   runs** already present in `ci-browser-testing`, plus the `ES6Visualization`
   job moved there. Nothing is only covered by the removed jobs.

### Azure DevOps settings that must be verified by an administrator

These cannot be expressed in YAML.

**Resource authorization (the control that actually binds the boundary).** For
each of `BabylonJS-Deployment`, `Browserstack-Opensource` and
`GITHUB_SERVICE_CONNECTION`, open **Library → the group → Pipeline
permissions** (or the service connection's **Security**) and grant access to
`cd-ci-snapshots`, `ci-browser-testing`, `cd-tools` and `cd-publish` **only**.
`ci-monorepo`, `ci-graph-tools` and `ci-playground-sandbox` must not appear
there, and "Grant access permission to all pipelines" must be off. A pull
request that adds `- group: BabylonJS-Deployment` back to its own YAML then
fails authorization instead of receiving the secret.

**Branch control on every secret resource.** Add **Approvals and checks →
Branch control** allowing `refs/heads/master` (and `refs/heads/preview` where
releases need it), with "Verify branch protection" enabled. This is what stops
a maintainer-queued run of a `pr: none` pipeline against an arbitrary ref from
receiving the credential; `templates/assert-trusted-source.yml` performs the
same check from inside the run as defence in depth, but a check on the resource
cannot be edited by the ref being checked.

**Default branch for manual and scheduled builds** must be `refs/heads/master`
on `cd-ci-snapshots`, so a pipeline-completion or manual run always compiles
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
  and should be a **restricted sub-account** that can start automate sessions
  but cannot manage billing, users or API keys.
- `GitHubPAT` and `NPM_TOKEN` must be defined **only** on `cd-publish`, which
  has `pr: none`, and must never be added to a variable group shared with a
  PR-compiled pipeline.
- The npm publish token should be replaced by npm trusted publishing (OIDC) as
  soon as the Azure DevOps agent pool supports it for this account; until then
  it must be a granular, publish-only token scoped to the `@babylonjs` scope
  and the `babylonjs-*` packages.
- Pipelines must not enable "Allow scripts to access the OAuth token"; the YAML
  never references `System.AccessToken`, and every `checkout` sets
  `persistCredentials: false`.
- Restrict **Queue builds** permission on `cd-ci-snapshots`, `cd-publish`,
  `cd-tools` and `ci-browser-testing` to maintainers.
- Mark the deployment endpoint variables as **read-only** in the variable group
  UI. The YAML already declares `BuildName` `readonly: true`, but variables that
  come from a group can only be locked there.

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
- No credential is ever placed on a command line or in a URL. `DEPLOY_TOKEN` is
  handed to `curl` on stdin (`--config -`) from an `env:`-mapped shell variable;
  the GitHub PAT is consumed by an inline git credential helper that is removed
  before the step ends.
- `cd-publish.yml` writes the npm registry token to an ephemeral user config in
  the agent temp directory (mode `0600`) that is deleted in an `always()` step,
  instead of overwriting the repository `.npmrc`. The config also sets
  `ignore-scripts=true` and publishing runs with `--ignore-scripts`, so no
  package lifecycle script executes while the registry token is reachable.
- `scripts/generateChangelog.js` sends the PAT in an HTTP `Authorization`
  header instead of interpolating it into a `curl` command line.
- `scripts/versionUtils.js` and `scripts/generateChangelog.js` strip
  `GITHUBPAT`, `NPM_TOKEN`, `DEPLOY_TOKEN` and related keys from the
  environment of every child process they spawn.

#### Artifact-mediated trust boundary

Every pipeline is split into jobs that run repository or dependency code and
jobs that hold a credential. They never overlap, and they never share an agent:

|              | Jobs that run repository/dependency code      | Credentialed jobs                                          |
| ------------ | --------------------------------------------- | ---------------------------------------------------------- |
| Checkout     | `checkout: self`                              | `checkout: none`                                           |
| Credentials  | none                                          | `DEPLOY_TOKEN`, `GITHUB_SERVICE_CONNECTION`                |
| Steps        | build, test, and `templates/stage-upload.yml` | only steps declared in `templates/publish-uploads-job.yml` |
| Destinations | not known to the job                          | literals in trusted YAML                                   |

| Pipeline                | Credential-free jobs                                 | Credentialed job (`checkout: none`)                         |
| ----------------------- | ---------------------------------------------------- | ----------------------------------------------------------- |
| `ci-monorepo`           | all jobs                                             | none                                                        |
| `ci-graph-tools`        | all jobs                                             | none                                                        |
| `ci-playground-sandbox` | all jobs                                             | none                                                        |
| `cd-ci-snapshots`       | none (no job checks anything out)                    | `PublishSnapshot`, `PublishTestReports`, `DeployCdn`        |
| `cd-tools`              | `BuildTools` (npm ci, tool builds, artifact staging) | `DeployTools` (`DEPLOY_TOKEN` only)                         |
| `ci-browser-testing`    | `ClosureCompile`, `ResolvePerfVersions`              | test jobs (BrowserStack), `PublishReports` (`DEPLOY_TOKEN`) |
| `cd-publish`            | `BuildRelease` (npm ci, build, pack, bundle)         | `FetchReleaseNotes`, `PublishNpm`, `PublishRelease`         |

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
  `cd-ci-snapshots` it is a compile-time parameter, so it cannot change at all
  once the run starts.
- Comment bodies that are fixed text live in trusted YAML; bodies generated by
  test code (memory-leak reports) travel as artifacts and have Azure Pipelines
  logging commands stripped before use.

#### `cd-publish.yml` job separation

`cd-publish.yml` is split into four jobs so that no credential is present while
package code executes:

1. `FetchReleaseNotes` - the only job that holds `GitHubPAT`. Checks the
   repository out but never runs `npm ci`, fetches the release notes with Node
   built-ins, scans the result for token-shaped strings and publishes it as an
   artifact.
2. `BuildRelease` - runs `npm ci`, `npm install`, the tests and the full build,
   then `npm pack -ws --ignore-scripts`. It holds no registry token, no
   deployment token and no GitHub service connection, and emits the tarballs, a
   git bundle and the release assets as immutable pipeline artifacts.
3. `PublishNpm` - `checkout: none`. Downloads the tarballs and uploads them with
   `--ignore-scripts` using an ephemeral `0600` npm user config that also sets
   `ignore-scripts=true`. No repository code is on the agent.
4. `PublishRelease` - `checkout: none`, and the only job mapping
   `BabylonJS-Deployment`. Rebuilds the branch from the git bundle, pushes with
   an inline credential helper under `git -c core.hooksPath=/dev/null`, creates
   the GitHub release and updates the CDN.

Workspace publish order is preserved by recording the `npm pack -ws --json`
order in `order.txt` and republishing in that sequence.

### Residual risk

- **BrowserStack executes repository test code.** The Playwright BrowserStack
  config, the spec files and `browserstack-wait.sh` all come from the checkout,
  so the credentials are reachable from repository code by construction. They
  are now only ever reachable from **merged master** code: `ci-browser-testing`
  has no pull request trigger, every BrowserStack job asserts a trusted full ref
  before it starts, and no artifact from a pull request run is consumed there.
  A malicious commit that reaches master could still exfiltrate the account, so
  the sub-account restriction above matters.
- **`npm ci` runs before the release credentials in `cd-publish`, in a
  different job.** A dependency that compromises `BuildRelease` cannot read a
  credential, but it can tamper with the tarballs that `PublishNpm` uploads.
  Lockfile review and `--ignore-scripts` reduce, but do not remove, this.
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

### Secret Variables (per-pipeline)

These must be configured as **secret variables** on each pipeline (not in the
variable group) because they contain credentials:

| Variable     | Used By          | Description                                                   |
| ------------ | ---------------- | ------------------------------------------------------------- |
| `GitHubPAT`  | cd-publish       | GitHub Personal Access Token for git push and version scripts |
| `NPM_TOKEN`  | cd-publish       | npm registry auth token for publishing                        |
| `SEARCH_KEY` | ci-documentation | Search API key for documentation builds                       |

> **Never** add `GitHubPAT` or `NPM_TOKEN` to a variable group or to any
> pipeline that builds pull requests. Both are only valid on `cd-publish`,
> which is declared `pr: none`. See "CI trust boundary" above.

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

Secret-bearing groups (`BabylonJS-Deployment`, `Browserstack-Opensource`) are
mapped at **job** scope instead, so that only the jobs that need them can see
them:

```yaml
- job: DeploySomething
  variables:
      - group: BabylonJS-Deployment
  steps:
      - checkout: none
      - template: templates/assert-trusted-source.yml
```

> **Note:** The `GITHUB_SERVICE_CONNECTION` variable is used in `GitHubComment@0`
> and `GitHubRelease@1` task inputs. After linking the variable group, you may
> need to manually authorize the service connection for each pipeline that
> uses it (Pipeline → Settings → Service connections).
