# Azure DevOps Variable Groups Setup

This document describes the variable groups required by the YAML pipelines.
All infrastructure-specific values (storage accounts, CDN endpoints, service
connections) are stored in variable groups to keep them out of source control.

## CI trust boundary

> **ACTION REQUIRED - rotate `DEPLOY_TOKEN`.**
> Between commit `c4f92c1` and the commit that added this notice, the literal
> value of the deployment API token was committed to the repository. It was
> pasted into 27 `Authorization:` headers across `ci-monorepo.yml`,
> `ci-browser-testing.yml`, `cd-tools.yml`, `cd-publish.yml`,
> `templates/deploy-tool.yml`, `templates/check-snapshot-exists.yml` and
> `templates/upload-test-results.yml` in place of the intended
> `$(DEPLOY_TOKEN)` reference, and it also reached `.build/changelog.json` by
> way of the originating pull request description.
> Those occurrences have been replaced with `$(DEPLOY_TOKEN)`, but **removing a
> secret from `HEAD` does not revoke it** - it remains readable in the git
> history and in every fork and clone taken while it was present. The token
> must be revoked and reissued in the `BabylonJS-Deployment` variable group.
>
> `DEPLOY_TOKEN` is expected to hold the _complete_ `Authorization` header
> value (the scheme included, exactly as the deployment server expects it),
> because that is how the original headers were written. Confirm this when
> reissuing it: the pipelines send `Authorization: $DEPLOY_TOKEN` verbatim.

Pull requests contribute executable code to CI: `npm ci` runs dependency
lifecycle scripts, `npm run build*` runs repository build scripts, and the
Playwright suites run spec files from the pull request. Anything reachable from
those steps must be treated as attacker-controlled for a fork PR.

### Azure DevOps settings that must be verified by an administrator

These cannot be expressed in YAML and must be configured per pipeline under
**Pipeline → Edit → Triggers → Pull request validation**:

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
  and purge CDN endpoints. It must not grant access to the production `cdn/`
  release paths beyond what the trusted `Deploy` job needs.
- `BROWSERSTACK_ACCESS_KEY` must belong to the open-source plan account only.
- `GitHubPAT` and `NPM_TOKEN` must be defined **only** on `cd-publish`, which
  has `pr: none`, and must never be added to a variable group shared with a
  PR-triggered pipeline.
- The npm publish token should be replaced by npm trusted publishing (OIDC) as
  soon as the Azure DevOps agent pool supports it for this account; until then
  it must be a granular, publish-only token scoped to the `@babylonjs` scope
  and the `babylonjs-*` packages.
- Pipelines must not enable "Allow scripts to access the OAuth token"; the YAML
  never references `System.AccessToken`, and every `checkout` sets
  `persistCredentials: false`.
- **Required template check (the control that binds all of the above).** On
  each protected resource - the `BabylonJS-Deployment` and
  `Browserstack-Opensource` variable groups, and the
  `GITHUB_SERVICE_CONNECTION` service connection - add
  **Approvals and checks → Required template** pointing at
  `.azure-pipelines/templates/publish-uploads-job.yml` in this repository at
  `refs/heads/master`. Azure DevOps then refuses to release those resources to
  any run whose YAML does not extend the trusted template, which is what stops
  a pull request from granting itself credentials by editing the pipeline
  definition in its own branch.
- Mark `BuildName` and the deployment endpoint variables as **read-only** in the
  variable group UI. The YAML already declares `BuildName` `readonly: true`, but
  variables that come from a group can only be locked there.

### Guarantees enforced by the YAML in this repository

- Every `checkout` sets `persistCredentials: false`, so the pipeline OAuth
  token is never written to `.git/config` where PR-controlled code could read
  it.
- Secrets are mapped into individual steps (`env:`) rather than being exposed
  job-wide, and steps that do not need a secret do not receive it.
- The privileged `Deploy` job in `ci-monorepo.yml` is gated on both a trusted
  branch (`master`/`preview`) and a trusted build reason (`Manual`,
  `Schedule`, `ResourceTrigger`, `BuildCompletion`), so it can never run for a
  pull request.
- `cd-publish.yml` and `cd-tools.yml` declare `pr: none`, so PR-controlled code
  is never built by a pipeline holding publish credentials.
- `cd-publish.yml` keeps the GitHub PAT out of the git remote URL and out of
  every command line: it is passed through the environment of a single step,
  consumed by an inline git credential helper, and the helper is removed before
  the step ends.
- `cd-publish.yml` writes the npm registry token to an ephemeral user config in
  the agent temp directory (mode `0600`) that is deleted in an `always()` step,
  instead of overwriting the repository `.npmrc`. The config also sets
  `ignore-scripts=true` and publishing runs with `--ignore-scripts`, so no
  package lifecycle script executes while the registry token is reachable.
- `scripts/generateChangelog.js` sends the PAT in an HTTP `Authorization`
  header instead of interpolating it into a `curl` command line.
- `scripts/versionUtils.js` and `scripts/generateChangelog.js` strip
  `GITHUBPAT`, `NPM_TOKEN`, `DEPLOY_TOKEN` and related keys from the
  environment of every child process they spawn, so the git and npm
  subprocesses the updater runs never inherit a publish credential.

#### Artifact-mediated trust boundary

`ci-monorepo.yml`, `ci-graph-tools.yml` and `ci-playground-sandbox.yml` are
split into two classes of job:

|              | Jobs that run pull-request code               | Trusted publish jobs                                       |
| ------------ | --------------------------------------------- | ---------------------------------------------------------- |
| Checkout     | `checkout: self`                              | `checkout: none`                                           |
| Credentials  | none                                          | `DEPLOY_TOKEN`, `GITHUB_SERVICE_CONNECTION`                |
| Steps        | build, test, and `templates/stage-upload.yml` | only steps declared in `templates/publish-uploads-job.yml` |
| Destinations | not known to the job                          | literals in trusted YAML                                   |

- Jobs that execute pull-request code hold **no** deployment token and **no**
  GitHub service connection. They archive their output with
  `templates/stage-upload.yml` and publish it as a pipeline artifact.
- `templates/publish-uploads-job.yml` creates the only jobs that hold CI
  credentials. They start with `checkout: none`, so no pull-request file is
  ever placed on the agent, and they run only steps declared in that template.
- Upload destinations are literal strings in the calling YAML and are
  re-validated in the publish job (no `..`, no absolute paths, no spaces,
  `[A-Za-z0-9._/-]` only). They are never read out of the downloaded artifact,
  so a pull request cannot redirect an upload by writing a manifest.
- `BuildName` is declared `readonly: true`, and `##vso[task.setvariable]` does
  not cross job boundaries, so the destination prefix cannot be rewritten by a
  build or test job either.
- Pull-request comments are posted from the trusted jobs. Bodies that are
  fixed text live in trusted YAML; bodies generated by test code (performance
  and memory-leak reports) travel as artifacts and have logging commands
  stripped before use.
- Because each Azure Pipelines job runs on a freshly provisioned agent, a
  background process left behind by `npm ci` or a Playwright spec cannot
  observe the publish job's process table, environment or filesystem. Job
  separation - not step ordering - is what contains a compromised pull request.
- The deployment token is handed to `curl` on stdin (`--config -`) from an
  `env:`-mapped shell variable, so it never appears on a command line, in the
  process table, or in the rendered script body.

#### `cd-publish.yml` job separation

`cd-publish.yml` is split into three jobs so that no credential is present
while package code executes:

1. `BuildRelease` - runs `npm ci`, `npm install`, the tests and the full build,
   then `npm pack -ws --ignore-scripts`. It holds no registry token, no
   deployment token and no GitHub service connection, and emits the tarballs, a
   git bundle and the release assets as immutable pipeline artifacts.
   `GitHubPAT` is mapped into the single changelog step only.
2. `PublishNpm` - `checkout: none`. Downloads the tarballs and uploads them with
   `--ignore-scripts` using an ephemeral `0600` npm user config that also sets
   `ignore-scripts=true`. No repository code is on the agent.
3. `PublishRelease` - `checkout: none`. Rebuilds the branch from the git bundle,
   pushes with an inline credential helper under
   `git -c core.hooksPath=/dev/null`, creates the GitHub release and updates the
   CDN. No `package.json`, npm hook or git hook from the built tree is present
   while these credentials are in the environment.

Workspace publish order is preserved by recording the `npm pack -ws --json`
order in `order.txt` and republishing in that sequence.

### Residual risk

**BrowserStack is the only credential still reachable from pull-request code.**
The Playwright BrowserStack config, the spec files and `browserstack-wait.sh`
are all part of the pull request, so the account cannot be moved behind the
trust boundary without deleting cross-browser coverage on pull requests. Two
mitigations apply:

- `ci-monorepo.yml` exposes a `runBrowserStackOnPullRequests` pipeline
  parameter (default `true`). Setting it to `false` removes the credentials
  from pull-request builds while keeping them for scheduled and branch builds.
- The account used by `Browserstack-Opensource` should be a **restricted
  sub-account** that can only start automate sessions, with no billing, user
  administration or API-key management rights, so a leak cannot be escalated.

**Pipeline YAML is itself pull-request-controlled.** Azure DevOps reads a pull
request build's YAML from the pull request's own branch, so a same-repo pull
request can edit these files - including adding a step to a trusted job. No
amount of YAML restructuring can prevent that on its own. The binding control
is administrator-side and is listed above: a **required template** check on the
`BabylonJS-Deployment` and `Browserstack-Opensource` variable groups and on
`GITHUB_SERVICE_CONNECTION`, so those resources are only released to a run
whose YAML extends a template pinned to `refs/heads/master`. Until that check
is in place, the separation described here protects against a compromised
dependency or a malicious test payload, but not against a malicious
collaborator rewriting the pipeline in their pull request.

## Variable Group: `BabylonJS-CI-Infrastructure`

Create this variable group in **Azure DevOps → Pipelines → Library** and link
it to every pipeline that references it.

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

Linked by: ci-monorepo, ci-browser-testing.

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

Linked by: ci-monorepo, ci-playground-sandbox, ci-graph-tools, cd-publish, cd-tools.

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

| Value                          | File            | Description                                                     |
| ------------------------------ | --------------- | --------------------------------------------------------------- |
| `<PUBLISH_PIPELINE_NAME>`      | ci-monorepo.yml | Name of the cd-publish YAML pipeline (build completion trigger) |
| `<NATIVE_TESTS_PIPELINE_NAME>` | ci-monorepo.yml | Name of the native tests pipeline (artifact download source)    |

Replace the `<...>` placeholders with the actual pipeline names after creating
them in Azure DevOps.

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

> **Note:** The `GITHUB_SERVICE_CONNECTION` variable is used in `GitHubComment@0`
> and `GitHubRelease@1` task inputs. After linking the variable group, you may
> need to manually authorize the service connection for each pipeline that
> uses it (Pipeline → Settings → Service connections).
