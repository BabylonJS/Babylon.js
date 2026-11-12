# Azure DevOps Variable Groups Setup

This document describes the variable groups required by the YAML pipelines.
All infrastructure-specific values (storage accounts, CDN endpoints, service
connections) are stored in variable groups to keep them out of source control.

## Variable Group: `BabylonJS-CI-Infrastructure`

Create this variable group in **Azure DevOps → Pipelines → Library** and link
it to every pipeline that references it.

### Core Infrastructure

| Variable                    | Description                                                                  | Example                                |
| --------------------------- | ---------------------------------------------------------------------------- | -------------------------------------- |
| `SNAPSHOTS_STORAGE_ACCOUNT` | Azure Storage account for PR/branch snapshots                                | `mystorageaccount`                     |
| `TOOLS_STORAGE_ACCOUNT`     | Azure Storage account for production tool deployments                        | `mytoolsaccount`                       |
| `SNAPSHOT_CDN_URL`          | Base URL of the snapshot CDN (no trailing slash)                             | `https://my-cdn.example.net`           |
| `GITHUB_SERVICE_CONNECTION` | GitHub service connection ID for `GitHubComment` and `GitHubRelease` tasks   | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `DEVOPS_PROJECT_ID`         | Azure DevOps project GUID (used for cross-project artifact downloads)        | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `BOT_EMAIL`                 | Email address used for automated git commits in the retired publish pipeline | `bot@example.com`                      |

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
| `CDN_ENDPOINT_SFE`         | Smart Filters Editor endpoint     |
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

Linked by: ci-monorepo, ci-playground-sandbox, ci-graph-tools, cd-cdn-deploy, cd-publish (retired), cd-tools.

## Variable Group: `NPM_Publish`

npm registry credentials used to publish packages.

| Variable    | Description                            |
| ----------- | -------------------------------------- |
| `NPM_TOKEN` | npm registry auth token for publishing |

Linked by: cd-publish (retired; manual fallback only). Stable and preview npm
releases are published by the internal engine release pipeline, so
`cd-cdn-deploy` must not link this group.

### Secret Variables (per-pipeline)

These must be configured as **secret variables** on each pipeline (not in the
variable group) because they contain credentials:

| Variable          | Used By                  | Description                                                                      |
| ----------------- | ------------------------ | -------------------------------------------------------------------------------- |
| `GitHubPAT`       | cd-publish (retired)     | GitHub Personal Access Token for git push and version scripts                    |
| `GitHubReadToken` | cd-cdn-deploy (optional) | Read-only GitHub token for polling the release API without anonymous rate limits |
| `SEARCH_KEY`      | ci-documentation         | Search API key for documentation builds                                          |

### Manual YAML Configuration

These values must be edited directly in the YAML files because Azure DevOps
`resources.pipelines.source` does not support runtime variable expansion.

| Value                      | File                                     | Description                                                                   |
| -------------------------- | ---------------------------------------- | ----------------------------------------------------------------------------- |
| `CDN deploy pipeline`      | cd-tools.yml, ci-monorepo.yml            | Definition name of the cd-cdn-deploy YAML pipeline (build completion trigger) |
| `CDN deploy pipeline`      | templates/checkout-with-tag-override.yml | Default `triggeringPipeline` used for classic build completion triggers       |
| `BabylonNative Nightly CI` | ci-monorepo.yml                          | Name of the native tests pipeline (artifact download source)                  |

If a pipeline definition is renamed in Azure DevOps, update these values to
match.

## Stable Release Flow

1. The internal engine release pipeline publishes the npm packages, pushes the
   `Version update X` commit and annotated tag `X` to master, and creates the
   GitHub release `X` with the `cdnSnapshot.zip` asset. Preview releases create
   no tag or GitHub release.
2. The stable tag triggers `cd-cdn-deploy` ("CDN deploy pipeline"). It waits for
   the release asset, validates it, uploads it to `cdn/master/v<version>`, and
   verifies `https://cdn.babylonjs.com/v<version>/`. It can be rerun manually
   with the `version` parameter.
3. A successful deploy triggers `cd-tools` ("Tools CD"), which checks out the
   latest version tag and deploys the tools.

`cd-publish` ("Publish pipeline") has no automatic trigger and is kept only as
a manual emergency fallback.

## Linking the Variable Group

Each pipeline YAML references the variable group via:

```yaml
variables:
    - group: BabylonJS-CI-Infrastructure
    - name: BuildName
      value: $(Build.SourceBranch)
```

After creating a new YAML pipeline, go to **Pipeline → Edit → Variables →
Variable groups** and link every variable group referenced by its YAML. The
pipeline must be authorized to access each group. `cd-cdn-deploy` must link
and authorize `BabylonJS-CI-Infrastructure` and `BabylonJS-Deployment`; only
the retired `cd-publish` fallback uses `NPM_Publish`.

> **Note:** The `GITHUB_SERVICE_CONNECTION` variable is used in `GitHubComment@0`
> and `GitHubRelease@1` task inputs. After linking the variable group, you may
> need to manually authorize the service connection for each pipeline that
> uses it (Pipeline → Settings → Service connections).
