# Performance Tests

Automated performance regression tests for Babylon.js. These tests compare render times between a **baseline** build (CDN production) and a **candidate** build (local dev or another CDN version) using statistical analysis.

## Prerequisites

The babylon-server must be running on `localhost:1337`:

```bash
npm run serve -w @tools/babylon-server
```

Playwright browsers must be installed:

```bash
npx playwright install --with-deps
```

## Running

```bash
# All performance tests
npm run test:performance

# Only scene tests
npx playwright test --project=performance --config playwright.config.ts packages/tools/tests/test/performance/scene.test.ts

# Only playground tests
npx playwright test --project=performance --config playwright.config.ts packages/tools/tests/test/performance/playgrounds.test.ts

# A single test
npx playwright test --project=performance --config playwright.config.ts packages/tools/tests/test/performance/scene.test.ts --grep "default scene"
```

## Comparing Specific CDN Versions

Use environment variables to pin the baseline and/or candidate to specific CDN versions:

```bash
# Baseline = CDN v7.0.0, Candidate = local dev build
CDN_VERSION=7.0.0 npm run test:performance

# Baseline = CDN v7.0.0, Candidate = CDN v8.0.0 (no local build needed)
CDN_VERSION=7.0.0 CDN_VERSION_B=8.0.0 npm run test:performance

# Baseline = CDN v8.0.0, Candidate = latest (unversioned) CDN
CDN_VERSION=8.0.0 CDN_VERSION_B=latest npm run test:performance
```

| Environment Variable | Description                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `CDN_VERSION`        | Pins the baseline (stable) build to a specific CDN version (e.g. `7.0.0`). Use `latest` for the unversioned CDN. Omit to use the latest CDN. |
| `CDN_VERSION_B`      | When set, replaces the dev build with a second CDN version. Enables CDN-vs-CDN comparison. Use `latest` for the unversioned CDN.             |

## How It Works

Each test scenario goes through this flow:

1. **Warmup** — 2 passes (discarded), lets the browser JIT-compile and stabilize.
2. **Measurement** — 10 passes per build. Each pass initializes the engine, creates the scene, calls `scene.render()` in a tight loop `framesToRender` times (default 2500), records the total wall-clock time, then disposes the scene and engine.
3. **Trimming** — Removes 2 highest and 2 lowest values from each side, leaving 6 samples.
4. **Statistical analysis**:
    - **Welch's t-test** (one-tailed) checks if the difference is statistically significant (p < 0.05).
    - **Ratio check** verifies the candidate is more than 15% slower.
    - Both must be true to flag a regression.
5. **Noise detection** — If either side's coefficient of variation exceeds 10%, the result is marked INCONCLUSIVE and the test passes (noisy data cannot reliably detect regressions).
6. **Confirmation** — If a regression is detected, 6 additional passes per build are run and merged with the initial data before making a final determination.

## Configuration

Tests override defaults via `perfOptions`. All fields are optional:

| Option               | Default    | Description                                                   |
| -------------------- | ---------- | ------------------------------------------------------------- |
| `numberOfPasses`     | 10         | Measured passes per build                                     |
| `framesToRender`     | 2500       | Frames rendered per pass                                      |
| `warmupPasses`       | 2          | Warmup passes (discarded)                                     |
| `acceptedThreshold`  | 0.15       | Max allowed ratio above 1.0 (15%)                             |
| `maxCov`             | 0.10       | Coefficient of variation above which results are inconclusive |
| `trimCount`          | 2          | Outliers removed from each end                                |
| `pValueThreshold`    | 0.05       | Statistical significance threshold                            |
| `confirmationPasses` | 6          | Extra passes on suspected regression                          |
| `cdnVersion`         | `""`       | Pin baseline to a CDN version                                 |
| `cdnVersionB`        | `""`       | Pin candidate to a CDN version (skips dev)                    |
| `engineName`         | `"webgl2"` | Engine to use: `"webgl2"` or `"webgpu"`                       |

## Test Output

Each test logs a summary line:

```
[PERF] Default scene: Stable: 19.6ms, Dev: 20.8ms, Dev is 6.1% slower, p-value: 0.0013
```

When comparing CDN versions, labels reflect the versions:

```
[PERF] Default scene: v7.0.0: 19.6ms, v8.0.0: 18.2ms, v8.0.0 is 7.1% faster, p-value: 0.0023
```

## Test Files

- **scene.test.ts** — Tests with programmatic scenes (default scene, particle system, follow camera).
- **playgrounds.test.ts** — Tests against live playground snippets fetched from the snippet server.
- **visualization.test.ts** — Runs every visualization test case from `config.json` as a performance test for both WebGL2 and WebGPU. Disabled by default; enable with `VISUALIZATION_PERF=true`.
- **config.json** — Legacy configuration (used by the older `performance.test.ts` in the playwright directory).

## Visualization Performance Tests

The `visualization.test.ts` file generates performance tests from the full visualization test suite (`../visualization/config.json`). It reads all ~680 test cases and creates a performance comparison test for each one, for **both WebGL2 and WebGPU** engines, yielding ~1330 total tests.

Each test uses `evaluatePrepareScene` to load the scene (playground snippet, scene file, or script), then runs `comparePerformance` to measure stable-vs-dev render times with full statistical analysis — identical to the curated scene and playground tests.

Tests respect the `excludedEngines` field from `config.json`. For example, a test with `"excludedEngines": ["webgpu"]` will only run under WebGL2. The current breakdown is approximately:

- **~669 WebGL2 tests** (680 minus those excluding webgl2)
- **~661 WebGPU tests** (680 minus those excluding webgpu)

### Why the Environment Variable Gate

Running all ~1330 tests takes a long time (each test involves multiple warmup + measurement passes on two builds). To keep `npm run test:performance` fast for day-to-day work (only the ~15 curated tests), the visualization tests are **disabled by default** and require `VISUALIZATION_PERF=true` to activate.

Without the env var set, `visualization.test.ts` calls `test.skip()` at the describe level, so the tests don't appear in Playwright's test list at all and add zero overhead.

### Running Visualization Performance Tests

Enable the tests by setting the environment variable, then use Playwright's `--grep` (`-g`) flag to narrow down which tests run:

```bash
# Enable and run ALL visualization perf tests (both engines, ~1330 tests)
VISUALIZATION_PERF=true npx playwright test --project performance -g "Visualization"

# Only WebGPU visualization tests (~661 tests)
VISUALIZATION_PERF=true npx playwright test --project performance -g "Visualization Performance (webgpu)"

# Only WebGL2 visualization tests (~669 tests)
VISUALIZATION_PERF=true npx playwright test --project performance -g "Visualization Performance (webgl2)"

# A specific test by title — matches across both engines
VISUALIZATION_PERF=true npx playwright test --project performance -g "Shadows"

# Multiple specific tests using regex
VISUALIZATION_PERF=true npx playwright test --project performance -g "Shadows|PBR|Particles"

# A specific test on a specific engine
VISUALIZATION_PERF=true npx playwright test --project performance -g "Shadows.*webgpu"
```

### Combining with CDN Version Comparison

All standard environment variables work with visualization tests:

```bash
# Compare CDN v7 vs v8 for all visualization tests on WebGPU
CDN_VERSION=7.0.0 CDN_VERSION_B=8.0.0 VISUALIZATION_PERF=true npx playwright test --project performance -g "webgpu"

# Compare CDN v7 vs local dev for shadow-related tests
CDN_VERSION=7.0.0 VISUALIZATION_PERF=true npx playwright test --project performance -g "Shadows"
```

### Listing Available Tests

To see which tests would run without actually executing them, use `--list`:

```bash
# List all visualization perf tests
VISUALIZATION_PERF=true npx playwright test --project performance --list

# List only WebGPU tests matching "PBR"
VISUALIZATION_PERF=true npx playwright test --project performance --list -g "PBR.*webgpu"
```

### Using `engineName` in Custom Tests

The `engineName` option added for visualization tests is available to any performance test via `PerformanceTestOptions`:

```ts
const result = await comparePerformance(page, baseUrl, mySceneSetup, {
    engineName: "webgpu", // or "webgl2" (default)
});
```

| Environment Variable | Description                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `VISUALIZATION_PERF` | Set to `"true"` to enable the visualization performance test suite. Omit or set to anything else to skip.         |
| `CDN_VERSION`        | Pins the baseline (stable) build to a specific CDN version (e.g. `7.0.0`). Use `latest` for the unversioned CDN.  |
| `CDN_VERSION_B`      | Replaces the dev build with a second CDN version for CDN-vs-CDN comparison. Use `latest` for the unversioned CDN. |

## CI

Performance tests run in Azure Pipelines as the `PerformanceTests` job. Results are published as JUnit XML and visible in the Azure DevOps test tab. The job uses `continueOnError: true` during the monitoring period.
