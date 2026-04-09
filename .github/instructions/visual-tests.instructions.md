# Visualization (Playwright) Tests

Babylon.js visualization tests are Playwright-based screenshot comparison tests against reference images. Use them for rendering work where the pixels matter: new rendering features, visual bug fixes, shader changes, materials, particles, post-processes, loading behavior, and other user-visible output.

This instruction file explains how to create, update, and debug Babylon visual tests.

Every major new rendering feature must have visualization coverage when applicable. Skipping visual coverage for rendering work is risky because many regressions are only obvious in the final image.

## Overview

Standard Babylon.js visualization tests are driven by config entries rather than custom Playwright wrapper files.

- Config file: `packages/tools/tests/test/visualization/config.json`
- Reference images for all Playwright visualization projects: `packages/tools/tests/test/visualization/ReferenceImages/`
- Helper scripts: `.github/scripts/visual-testing/read-snippet.js` and `.github/scripts/visual-testing/save-snippet.js`
- Playground workflow (writing code, managing snippets, local servers): [playground-workflow.instructions.md](playground-workflow.instructions.md)

Do not create new wrapper Playwright files for normal visualization tests. The existing wrappers such as `visualization.webgl2.test.ts` and `visualization.webgpu.test.ts` already load every entry from the config.

For a standard visualization test, the committed repo changes should normally be the config entry and the reference image files.

## Mandatory snippet workflow for standard visualization tests

For standard Babylon.js visualization tests, the agent **must** use Playground snippets and `playgroundId` entries in `config.json`.

- **Read existing reference snippets first** with `.github/scripts/visual-testing/read-snippet.js` when using an existing test as inspiration.
- **Create or update the test as a Playground snippet** and save it with `.github/scripts/visual-testing/save-snippet.js`.
- **Use the returned snippet ID as the `playgroundId`** in `packages/tools/tests/test/visualization/config.json`.
- **Do not substitute `scriptToRun`, local fixture scripts, or other non-snippet paths** for a standard visualization test unless the user explicitly asks for that approach.
- **Do not modify the visualization harness or infrastructure** for a standard visualization test unless the user explicitly asks for harness work.
- **If snippet read/save fails because of network, authentication, or environment limitations, stop and ask the user for help** instead of inventing a local workaround.

The main exceptions are non-standard test types that already have their own documented flow, such as devhost-based tool tests.

The full automated workflow for adding a playground-based visual test is:

0. Optionally study existing tests or the engine code for context.
1. Write, save, and verify the playground snippet (see [playground-workflow.instructions.md](playground-workflow.instructions.md)).
2. Add a `config.json` entry that points at the snippet.
3. Generate reference images.
4. Run the test to confirm it passes.
5. Clean up temporary files and any servers you started.

## Adding a New Visual Test (Automated Workflow)

### Step 0: Understand context

If the user points you to existing tests as reference, study those first:

1. Inspect related entries in `packages/tools/tests/test/visualization/config.json`.
2. Read their snippet code with `.github/scripts/visual-testing/read-snippet.js`.
3. Identify the setup patterns: camera, lighting, scene framing, timing, and the property or feature being validated.

If the user does not point to existing tests, read the relevant Babylon.js engine or tool code to understand the API and behavior you need to exercise.

### Step 1: Write code, save snippet, optionally start servers, verify

Follow the Playground workflow in [playground-workflow.instructions.md](playground-workflow.instructions.md). After completing those steps you will have a snippet ID (e.g. `#ABC123#0`) ready for the config entry.

### Step 2: Add a config entry

Append the new test to `packages/tools/tests/test/visualization/config.json`:

```json
{
    "title": "Your Test Title",
    "playgroundId": "#ABC123#0",
    "referenceImage": "your-test-title.png",
    "renderCount": 1,
    "errorRatio": 1.1
}
```

See the config field reference and `renderCount` heuristics below when choosing values.

If the user has not specified a naming convention, align with nearby entries in `config.json`. The `title` is used by Playwright `-g` filters, so it should be descriptive and unique.

### Step 3: Generate reference images

Run these from the repo root while the CDN server is running:

```bash
# WebGL2
npx playwright test --config playwright.config.ts --project=webgl2 --update-snapshots -g "Your Test Title"

# WebGPU
npx playwright test --config playwright.config.ts --project=webgpu --update-snapshots -g "Your Test Title"
```

Reference images are written to `packages/tools/tests/test/visualization/ReferenceImages/` using the screenshot name selected by the harness:

- If `referenceImage` is set, the harness uses that value as the screenshot name (for example `ReferenceImages/your-test-title.png`).
- Otherwise, the harness falls back to `title`, and Playwright may normalize some characters in the final snapshot filename. For example, a title such as `Loading glTF model with KTX2 textures` can produce `ReferenceImages/Loading-glTF-model-with-KTX2-textures.png`.
- If you need a deterministic committed filename, set `referenceImage` explicitly.

The current Playwright config uses a shared `snapshotPathTemplate`, so WebGL2 and WebGPU both read and write snapshots from `ReferenceImages/`.

For several related tests, prefer one regex with `-g` so Playwright can run them in parallel:

```bash
npx playwright test --config playwright.config.ts --project=webgl2 --update-snapshots -g "GPU Particles - Basic Properties - Emit Rate|GPU Particles - Basic Properties - Emission"
npx playwright test --config playwright.config.ts --project=webgpu --update-snapshots -g "GPU Particles - Basic Properties - Emit Rate|GPU Particles - Basic Properties - Emission"
```

### Step 4: Run and verify

After the baselines exist, run the targeted tests without updating snapshots:

```bash
npx playwright test --config playwright.config.ts --project=webgl2 -g "Your Test Title"
npx playwright test --config playwright.config.ts --project=webgpu -g "Your Test Title"
```

As with snapshot generation, you can use one regex with `-g` to validate several related tests together.

To run the full visualization suite locally instead of a targeted title:

```bash
npm run test:playwright -w @tools/tests
```

### Step 5: Clean up

Remove temporary files and stop servers per the cleanup section in [playground-workflow.instructions.md](playground-workflow.instructions.md). Also remove any temporary files generated by `playwright-cli` for local inspection (typically under `.playwright-cli/`).

## Config fields

| Field                                                                        | Required | Default       | Description                                                                                                                                                     |
| ---------------------------------------------------------------------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`                                                                      | Yes      | -             | Test name used by Playwright output and `--grep`                                                                                                                |
| `playgroundId`                                                               | Yes      | -             | Playground snippet id, such as `#ABC123#0`                                                                                                                      |
| `referenceImage`                                                             | No       | title-derived | Optional PNG filename in `ReferenceImages/`; when omitted, the harness falls back to `title` and Playwright may normalize some characters in the final filename |
| `renderCount`                                                                | No       | `1`           | Frames to render before capture                                                                                                                                 |
| `errorRatio`                                                                 | No       | about `1.1`   | Allowed pixel-diff percentage                                                                                                                                   |
| `excludedEngines`                                                            | No       | `[]`          | Engines to skip, such as `["webgl1"]`                                                                                                                           |
| `replace`                                                                    | No       | -             | Comma-separated replacement pairs for patching code                                                                                                             |
| `replaceUrl`                                                                 | No       | -             | Comma-separated replacement pairs for patching URLs                                                                                                             |
| `excludeFromAutomaticTesting`                                                | No       | `false`       | Exclude the test from the standard visualization harness entirely, including targeted `-g` runs                                                                 |
| `useLargeWorldRendering`, `useReverseDepthBuffer`, `useNonCompatibilityMode` | No       | -             | Per-test engine flags                                                                                                                                           |

## `renderCount` guidance

The `renderCount` controls how many frames are rendered before the screenshot is taken.

Default to `renderCount: 1`.

For standard Playground-based visual tests, first try to make the scene fully ready before returning it (or before resolving `createScene` if it is async) instead of compensating with a higher `renderCount`. Do not use a large `renderCount` to hide setup work that can be awaited or prepared before the scene is returned.

Only raise `renderCount` when the intended screenshot genuinely depends on later frames, such as:

- capturing a later animation or simulation state
- letting a time-based effect reach the intended look
- advancing particles when pre-warming is not a better fit

If `renderCount` must be greater than `1`, use the smallest value that produces a stable, correct capture. Higher values slow local runs and CI.

For particle systems, prefer `preWarmCycles` / `preWarmStepOffset` when they achieve the intended starting state more directly than a large `renderCount`.

## Error ratio tuning

The `errorRatio` is the percentage of differing pixels allowed before the test fails.

- Keep the default when it already handles normal anti-aliasing or backend differences.
- Lower it for output that should be close to pixel-perfect.
- Raise it only when you understand the acceptable variance for that specific scene.

Do not increase `errorRatio` just to make an unstable or incorrect test pass.

## Updating an existing visual test

When a rendering change intentionally changes output:

1. Run the test first and confirm it fails against the old baseline.
2. Confirm that the new visual output is correct.
3. Regenerate the reference image with `--update-snapshots`.
4. Review the new baseline before keeping it.
5. Commit the code change and updated reference image together.

Never bless a new reference image blindly.

## Multi-engine testing

Babylon visual tests usually run against both WebGL2 and WebGPU.

The current Playwright configuration stores snapshots for both projects in the shared `ReferenceImages/` directory.

Use `excludedEngines` only when the feature genuinely does not apply to one engine.

In this repo's Playwright setup, the WebGPU project launches the Chrome channel rather than generic Playwright Chromium. If that Chrome-based WebGPU setup is unavailable locally, the WebGPU project may be skipped locally, but the test still needs to pass in CI.

## Devhost-based visual tests

Some visual tests target Babylon tools rather than Playground snippets. In those cases, add an entry to the appropriate devhost config file, such as `config.lottie.json`, and use `devHostQsps` instead of `playgroundId`.

Example:

```json
{
    "title": "Tool Test Name",
    "devHostQsps": "tool=sandbox&scene=...",
    "readySelector": ".some-element",
    "screenshotDelayMs": 2000
}
```

Use `readySelector` and `screenshotDelayMs` when the page needs explicit readiness or delay handling.

## Common issues

- Flaky tests usually need a higher `renderCount`, not a rushed baseline update.
- Platform differences should be handled with the normal per-engine baselines, and only then with carefully chosen tolerance changes.
- Async loading often needs more frames than expected.
- Transparency, alpha-heavy scenes, and text rendering can produce larger diffs.
- If `1337` or `1338` are already in use, the server may already be running and that step can often be skipped.

## Checklist

- Context gathered from existing snippets or source code
- Playground snippet created and verified per [playground-workflow.instructions.md](playground-workflow.instructions.md)
- `config.json` entry uses `playgroundId` for standard visualization tests
- Config entry added or updated in `packages/tools/tests/test/visualization/config.json`
- WebGL2 baseline generated when applicable
- WebGPU baseline generated when applicable
- Targeted tests pass locally for the relevant engines
- Temporary files and long-running processes cleaned up
