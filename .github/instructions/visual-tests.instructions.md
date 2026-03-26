# Visualization (Playwright) Tests

Babylon.js visualization tests are Playwright-based screenshot comparison tests against reference images. Use them for rendering work where the pixels matter: new rendering features, visual bug fixes, shader changes, materials, particles, post-processes, loading behavior, and other user-visible output.

This instruction file explains how to create, update, and debug Babylon visual tests.

Every major new rendering feature must have visualization coverage when applicable. Skipping visual coverage for rendering work is risky because many regressions are only obvious in the final image.

## Overview

Standard Babylon.js visualization tests are driven by config entries rather than custom Playwright wrapper files.

- Config file: `packages/tools/tests/test/visualization/config.json`
- Reference images for all Playwright visualization projects: `packages/tools/tests/test/visualization/ReferenceImages/`
- Helper scripts: `.github/scripts/visual-testing/read-snippet.js` and `.github/scripts/visual-testing/save-snippet.js`

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
1. Write the playground code as a file.
2. Start the local servers.
3. Save the playground to the snippet server via the helper script.
4. Verify the snippet in the local playground.
5. Add a `config.json` entry that points at the snippet.
6. Generate reference images.
7. Run the test to confirm it passes.
8. Clean up temporary files and any servers you started.

## Reading Existing Snippets

Use `.github/scripts/visual-testing/read-snippet.js` to fetch code from an existing Playground snippet. This is useful when you want to study a reference test or reuse an existing scene setup.

The snippet server uses a slash URL format such as `https://snippet.babylonjs.com/ABC123/5`. The `playgroundId` format used in config entries is hash-based, such as `#ABC123#5`. The helper script handles the conversion automatically.

```bash
# Print snippet code to stdout
node .github/scripts/visual-testing/read-snippet.js "#ABC123#5"

# Save snippet code to a file for easier reading
node .github/scripts/visual-testing/read-snippet.js "#ABC123#5" --save existing_test.js
```

The script handles both V2 manifest snippets and legacy raw-code snippets, and extracts the entry file's JavaScript source.

## Adding a New Visual Test (Automated Workflow)

### Step 0: Understand context

If the user points you to existing tests as reference, study those first:

1. Inspect related entries in `packages/tools/tests/test/visualization/config.json`.
2. Read their snippet code with `.github/scripts/visual-testing/read-snippet.js`.
3. Identify the setup patterns: camera, lighting, scene framing, timing, and the property or feature being validated.

If the user does not point to existing tests, read the relevant Babylon.js engine or tool code to understand the API and behavior you need to exercise.

### Step 1: Write the Playground code

Write the visual test scene as a normal Babylon Playground `createScene` function and save it to a temporary file. For AI-authored tests, default to a temporary `.js` file unless the user asks for TypeScript or a nearby reference test is already written in TypeScript. The helper script also supports `.ts` input when you intentionally want a TypeScript snippet. Working in a file avoids painful string escaping and makes iteration easier.

Do not seed `Math.random` manually in standard visualization snippets. The visualization harness already replaces `Math.random` with a deterministic seeded implementation before running the snippet.

```javascript
// Save as temp_pg_mytest.js
const createScene = function () {
    const scene = new BABYLON.Scene(engine);
    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 3, new BABYLON.Vector3(0, 0, 0), scene);
    camera.attachControl(canvas, true);
    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Feature-specific setup goes here.

    return scene;
};

export default createScene;
```

### Step 2: Start local servers

The visual test workflow needs a build plus two local servers:

- Babylon CDN server on `localhost:1337`
- Playground server on `localhost:1338`

The safest option is to use the VS Code tasks already defined in `.vscode/tasks.json`, because they already use the correct working directory:

- `CDN Serve and watch (Dev)`
- `Playground Serve for core (Dev)`

In multi-root workspaces, background terminals often start in the wrong folder, so VS Code tasks are more reliable than ad hoc background shells.

#### Step 2a: Check whether the servers are already running

In PowerShell:

```powershell
Test-NetConnection -ComputerName localhost -Port 1337 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
Test-NetConnection -ComputerName localhost -Port 1338 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
```

If both ports are already up, skip to Step 3. If only `1337` is up, start only the Playground server. If neither is up, continue below.

#### Step 2b: Start the CDN server

Preferred approach:

- Start the `.vscode` task `CDN Serve and watch (Dev)`.

Manual fallback from the Babylon.js repo root:

```bash
npm run build:dev
npx build-tools -c dw -wd -wa -sc
npm run serve -w @tools/babylon-server
```

#### Step 2c: Wait for the CDN server to be ready

Do not continue until `localhost:1337` accepts connections.

```powershell
Start-Sleep -Seconds 15
Test-NetConnection -ComputerName localhost -Port 1337 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
```

Repeat the check until the port is ready.

#### Step 2d: Start the Playground server

Preferred approach:

- Start the `.vscode` task `Playground Serve for core (Dev)`.

Manual fallback from the Babylon.js repo root:

```bash
npm run serve -w @tools/playground
```

Start the Playground only after the CDN server is up.

#### Step 2e: Wait for the Playground server to be ready

```powershell
Start-Sleep -Seconds 15
Test-NetConnection -ComputerName localhost -Port 1338 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue | Select-Object TcpTestSucceeded
```

The Playground is only needed for visual preview in Step 4. Snapshot generation and normal visual test runs only require the CDN server.

The local Playground at `http://localhost:1338` uses the local engine build served from the CDN server, which is why it reflects local Babylon.js code changes immediately.

### Step 3: Save the snippet via the helper script

Use `.github/scripts/visual-testing/save-snippet.js` to post the temp playground file directly to the Babylon snippet server. This is usually more reliable than manually saving through the Playground UI. The helper infers the snippet language from the file extension: `.js` stays JavaScript, while `.ts` and `.tsx` are saved as TypeScript snippets.

```bash
node .github/scripts/visual-testing/save-snippet.js <code-file> "<Name>" "<Description>"
```

Example:

```bash
node .github/scripts/visual-testing/save-snippet.js temp_pg_mytest.js "My Test Name" "Description of test"
```

If you intentionally want a TypeScript snippet instead of the default JavaScript flow, save the file as `temp_pg_mytest.ts` and pass that path to `save-snippet.js`.

Expected output:

```text
Saved: #ABC123#0
```

Use that value as the `playgroundId` in `config.json`.

If saving the snippet fails because the snippet server is unavailable or blocked from the current environment, stop and ask the user for help. Do not switch a standard visualization test to `scriptToRun` or another local-only workaround unless the user explicitly asks for that.

### Step 4: Verify in the local Playground

Open the saved snippet in the local Playground:

```text
http://localhost:1338/#ABC123#0
```

Use your browser automation or manual browser workflow to confirm the scene renders as expected before creating baselines.

Note that the Playground editor covers part of the canvas. That is fine for this preview step. The actual visual tests capture the render canvas directly, not the visible editor layout.

If you need to revise the snippet, edit the temp file and run `save-snippet.js` again. The snippet server will create a new revision, such as `#ABC123#1`, and the `playgroundId` in `config.json` should be updated accordingly.

### Step 5: Add a config entry

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

### Step 6: Generate reference images

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

### Step 7: Run and verify

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

### Step 8: Clean up

Remove the temporary Playground source file you created (for example `temp_pg_mytest.js` or `temp_pg_mytest.ts`), remove any temporary files generated by `playwright-cli` for local inspection (typically under `.playwright-cli/`), and stop any long-running servers you started specifically for the task.

```bash
rm temp_pg_mytest.js
```

## Config fields

| Field | Required | Default | Description |
| --- | --- | --- | --- |
| `title` | Yes | - | Test name used by Playwright output and `--grep` |
| `playgroundId` | Yes | - | Playground snippet id, such as `#ABC123#0` |
| `referenceImage` | No | title-derived | Optional PNG filename in `ReferenceImages/`; when omitted, the harness falls back to `title` and Playwright may normalize some characters in the final filename |
| `renderCount` | No | `1` | Frames to render before capture |
| `errorRatio` | No | about `1.1` | Allowed pixel-diff percentage |
| `excludedEngines` | No | `[]` | Engines to skip, such as `["webgl1"]` |
| `replace` | No | - | Comma-separated replacement pairs for patching code |
| `replaceUrl` | No | - | Comma-separated replacement pairs for patching URLs |
| `excludeFromAutomaticTesting` | No | `false` | Exclude the test from the standard visualization harness entirely, including targeted `-g` runs |
| `useLargeWorldRendering`, `useReverseDepthBuffer`, `useNonCompatibilityMode` | No | - | Per-test engine flags |

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
- Existing reference snippet read with `.github/scripts/visual-testing/read-snippet.js` when applicable
- Temporary Playground file written
- CDN server started and ready on `localhost:1337`
- Playground server started and ready on `localhost:1338` when preview is needed
- Snippet saved with `.github/scripts/visual-testing/save-snippet.js`
- `config.json` entry uses `playgroundId` for standard visualization tests
- Snippet previewed locally before baselines are generated
- Config entry added or updated in `packages/tools/tests/test/visualization/config.json`
- WebGL2 baseline generated when applicable
- WebGPU baseline generated when applicable
- Targeted tests pass locally for the relevant engines
- Temporary files and long-running processes cleaned up
