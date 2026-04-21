# Babylon.js Test Infrastructure

## Overview

This package contains the Playwright-based test suites for Babylon.js:

- **Visualization tests** — pixel-comparison screenshots for WebGL2 and WebGPU
- **Interaction tests** — user interaction scenarios (click, drag, etc.)
- **Performance tests** — rendering benchmark measurements
- **Integration tests** — end-to-end integration checks

## Running Tests Locally

### Visualization tests (local browser)

```bash
# All WebGL2 tests using local Chrome
npm run test:visualization -- --project=webgl2

# A single test
npm run test:visualization -- --project=webgl2 --grep "Particle system"

# WebGPU tests
npm run test:visualization -- --project=webgpu
```

### Visualization tests (BrowserStack)

Tests can run entirely on BrowserStack infrastructure using the BrowserStack
Automate SDK. This is what CI uses.

**Prerequisites:**

1. Add your credentials to `.env` at the repo root:
    ```
    BROWSERSTACK_USERNAME=your_username
    BROWSERSTACK_ACCESS_KEY=your_access_key
    ```
2. Run `npm install` (installs `browserstack-node-sdk`)

**Commands:**

```bash
# WebGL2 on BrowserStack (Chrome/macOS by default)
CDN_BASE_URL="https://cdn.babylonjs.com" BSTACK_TEST_TYPE=webgl2 \
  npx browserstack-node-sdk playwright test --config ./playwright.browserstack.config.ts

# Single test
CDN_BASE_URL="https://cdn.babylonjs.com" BSTACK_TEST_TYPE=webgl2 \
  npx browserstack-node-sdk playwright test --config ./playwright.browserstack.config.ts \
  --grep "Particle system"

# WebGPU on BrowserStack
CDN_BASE_URL="https://cdn.babylonjs.com" BSTACK_TEST_TYPE=webgpu \
  npx browserstack-node-sdk playwright test --config ./playwright.browserstack.config.ts

# Override browser (e.g. Firefox)
CDN_BASE_URL="https://cdn.babylonjs.com" BSTACK_TEST_TYPE=webgl2 \
  BSTACK_BROWSER=playwright-firefox BSTACK_OS="OS X" BSTACK_OS_VERSION=Sonoma \
  npx browserstack-node-sdk playwright test --config ./playwright.browserstack.config.ts

# Test against a local dev server (opens a BrowserStack Local tunnel)
CDN_BASE_URL="http://localhost:1337" BSTACK_TEST_TYPE=webgl2 BROWSERSTACK_LOCAL=true \
  npx browserstack-node-sdk playwright test --config ./playwright.browserstack.config.ts
```

### Environment Variables

| Variable               | Description                                                                    | Default                         |
| ---------------------- | ------------------------------------------------------------------------------ | ------------------------------- |
| `BSTACK_TEST_TYPE`     | Test suite to run: `webgl2`, `webgpu`, `performance`, `interaction`            | `webgl2`                        |
| `CDN_BASE_URL`         | Base URL where Babylon.js snapshot is served                                   | —                               |
| `CIWORKERS`            | Number of parallel Playwright workers / BrowserStack sessions                  | `5` (BrowserStack), `4` (local) |
| `BSTACK_BROWSER`       | Override BrowserStack browser (e.g. `playwright-firefox`, `playwright-webkit`) | `chrome`                        |
| `BSTACK_OS`            | Override BrowserStack OS                                                       | `OS X`                          |
| `BSTACK_OS_VERSION`    | Override BrowserStack OS version                                               | `Sonoma`                        |
| `BSTACK_BUILD_NAME`    | Override build name on BrowserStack dashboard                                  | Auto-generated from test type   |
| `BROWSERSTACK_LOCAL`   | Set to `true` to enable BrowserStack Local tunnel for localhost testing        | `false`                         |
| `EXCLUDE_REGEX_ARRAY`  | Comma-separated regex patterns to exclude tests                                | —                               |
| `TIMEOUT`              | Per-test timeout in milliseconds                                               | Playwright default              |
| `SCREENSHOT_THRESHOLD` | Pixel comparison threshold (0-1)                                               | `0.05`                          |
| `SCREENSHOT_MAX_PIXEL` | Maximum allowed pixel difference                                               | `5`                             |

### BrowserStack Dashboard

- **Automate sessions**: https://automate.browserstack.com
- **Test Observability** (per-test results): https://observability.browserstack.com

## Configuration Files

| File                                          | Purpose                                                      |
| --------------------------------------------- | ------------------------------------------------------------ |
| `playwright.config.ts`                        | Main config for local and legacy CDP-based BrowserStack runs |
| `playwright.browserstack.config.ts`           | Config for BrowserStack Automate SDK runs (used in CI)       |
| `playwright.devhost.config.ts`                | Config for dev host tests (lottie, etc.)                     |
| `browserstack.yml`                            | BrowserStack SDK platform and credential config              |
| `packages/tools/tests/playwright.utils.ts`    | Shared project definitions and browser setup                 |
| `packages/tools/tests/browserstack.config.ts` | Legacy CDP endpoint configuration                            |
