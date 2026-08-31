# Azure DevOps Variable Groups Setup

This document describes the variable groups required by the YAML pipelines.
All infrastructure-specific values (storage accounts, CDN endpoints, service
connections) are stored in variable groups to keep them out of source control.

## CI trust boundary

Pull requests contribute executable code to CI: `npm ci` runs dependency
lifecycle scripts, `npm run build*` runs repository build scripts, and the
Playwright suites run spec files from the pull request. Anything reachable from
those steps must be treated as attacker-controlled for a fork PR.

### Azure DevOps settings that must be verified by an administrator

These cannot be expressed in YAML and must be configured per pipeline under
**Pipeline → Edit → Triggers → Pull request validation**:

| Setting                                                       | Required value | Applies to                                          |
| ------------------------------------------------------------- | -------------- | --------------------------------------------------- |
| Make secrets available to builds of forks                     | **Disabled**   | ci-monorepo, ci-playground-sandbox, ci-graph-tools  |
| Require a team member's comment before building a pull request| **Enabled**    | ci-monorepo, ci-playground-sandbox, ci-graph-tools  |
| Build pull requests from forks of this repository             | Enabled        | ci-monorepo, ci-playground-sandbox, ci-graph-tools  |

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

### Residual risk

`ci-monorepo.yml`, `ci-playground-sandbox.yml` and `ci-graph-tools.yml` build
and test PR-controlled code in the same jobs that upload snapshots and post
GitHub comments. This is deliberate - fork PRs need snapshot links - and is
contained by the fork-secret setting above: without it, a fork build simply has
no secrets to steal. Removing the residual risk entirely would require
splitting snapshot upload and comment posting into a separate pipeline that
consumes a build artifact and never checks out PR code.

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
