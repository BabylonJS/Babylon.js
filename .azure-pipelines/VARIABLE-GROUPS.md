# Azure DevOps Variable Groups Setup

This document describes the variable groups required by the YAML pipelines.
All infrastructure-specific values (storage accounts, CDN endpoints, service
connections) are stored in variable groups to keep them out of source control.

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

## Variable Group: `BabylonJS-BrowserStack`

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

| Variable                          | Description                                                                                    |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| `BSTACK_TEST_TYPE`                | Selects test suite and dashboard build name (`webgl2`, `webgpu`, `performance`, `interaction`) |
| `BSTACK_BROWSER`                  | Override browser for cross-browser runs (e.g. `playwright-firefox`, `playwright-webkit`)       |
| `BSTACK_OS` / `BSTACK_OS_VERSION` | Override OS/version (e.g. `OS X` / `Sonoma`)                                                   |
| `BSTACK_SESSIONS_REQUIRED`        | Preferred number of parallel sessions to reserve (default: 1)                                  |
| `BSTACK_MAX_SESSIONS`             | Max sessions on the BrowserStack plan; caps REQUIRED (default: 5)                              |
| `CIWORKERS`                       | Number of parallel BrowserStack sessions (default: set by browserstack-wait.sh)                |

## Variable Group: `BabylonJS-Deployment`

Deployment server credentials shared by pipelines that upload snapshots or
deploy tools.

| Variable            | Description                           |
| ------------------- | ------------------------------------- |
| `DEPLOY_TOKEN`        | Deployment server authorization token |
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
