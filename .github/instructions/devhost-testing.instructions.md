# DevHost Testing for Core Changes

Babylon devhost is the recommended development-time validation loop for `@babylonjs/core` changes in a small browser app. While AI agents are making core changes, they should use devhost to build a focused validation app and confirm that the current work behaves correctly in the browser.

Do not redirect core validation to the Playground by default. Devhost is an accepted path for engine testing in this repository and should be used during implementation, not only after the code is finished.

## When to use devhost

Use devhost throughout development for core changes. As you implement a change, keep a focused devhost scene available and use it to check that the behavior still works after each meaningful iteration.

This is especially useful when the change:

- affects runtime behavior that is easier to verify in a real scene than in a unit test
- depends on ES module wiring, side-effect imports, scene startup, browser events, or frame-by-frame behavior
- needs a focused app to reproduce a bug or confirm an engine fix before the permanent automated tests are in place

Do not treat devhost as a replacement for unit tests, Playwright integration tests, or Playground-based visualization tests. Unit tests remain useful for focused logic and API coverage, and visualization tests remain the permanent regression coverage for rendering work when applicable. Devhost is the inner-loop app that should be used while the implementation is in progress.

## Default devhost scenario for core work

For core changes, use the `testScene` devhost experience.

- Entry URL: `http://localhost:1338/?exp=testScene`
- Main bootstrap: `packages/tools/devHost/src/testScene/main.ts`
- Default test app: `packages/tools/devHost/src/testScene/createScene.ts`
- JS fallback entry: `packages/tools/devHost/src/testScene/createSceneJS.js`
- Use `?exp=testScene&useTS=false` only when you intentionally need the JS entry

Prefer `createScene.ts` for AI-authored validation apps.

## Reusing running processes

Before starting devhost, check whether it is already running. Devhost serves on port `1338` by default, and that port may also be used by other local workflows in this repo. Reuse an existing healthy devhost session when it is actually serving devhost; otherwise start a new one.

You can check the port with:

```powershell
Get-NetTCPConnection -LocalPort 1338 -State Listen -ErrorAction SilentlyContinue
```

If `1338` is already in use, verify that the running process is devhost rather than assuming it is safe to reuse.

## Starting devhost

Preferred VS Code tasks:

- `Run Dev host (Dev)` for a one-off validation build
- `Run and Watch Dev host (Dev)` for iterative work

CLI fallback from the repo root:

```bash
npm run build:dev
npm run serve -w @tools/dev-host
```

Wait for the dev server to compile successfully, then open the `testScene` URL above.

If the change depends on generated assets, shaders, or other prebuilt outputs, run the relevant package build or watch steps first. Use the same prerequisite commands you would normally use for the package you changed.

## Writing the validation app

Edit `packages/tools/devHost/src/testScene/createScene.ts` and turn it into the smallest app that proves the behavior under test.

Guidelines:

- Keep the scene minimal and focused on the changed behavior.
- Exercise the actual API or runtime path that changed.
- Make success or failure obvious in the rendered result, page text, console output, or a deterministic window flag.
- Prefer deterministic setup over manual interaction when possible.
- If testing a prototype-augmented API, add the required side-effect import in the devhost scene file just as you would in production code.
- If the scenario needs async setup, `createScene` can stay async and return a `Promise<Scene>`.

## Validating the change

Use the devhost scene as you develop, not only at the end. After each meaningful change:

1. Load or reload the devhost URL in a browser.
2. Confirm the changed behavior directly in the running app.
3. If helpful, use browser automation or screenshots to capture evidence.
4. Report what the devhost app exercised and how it confirmed the fix or feature.

For visual regressions that should become committed screenshot coverage, follow `.github/instructions/visual-tests.instructions.md` after the devhost repro is working.

## Cleanup

Devhost validation apps are usually temporary inner-loop artifacts. Before finalizing:

- Remove temporary debugging code, logs, flags, and one-off scene setup.
- Revert temporary devhost scene changes unless the user explicitly wants them kept.
- Do not leave unrelated devhost edits in the final diff.
- Stop the devhost dev server if you started it. If it is running as a background process, find its process ID and stop it so port `1338` is freed for other workflows.

If the devhost scene should be kept as a permanent sample or automated test asset, keep it only when that is an intentional part of the task.
