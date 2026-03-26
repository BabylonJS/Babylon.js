# Workflow Configuration

This file provides repo-specific settings consumed by workflow skills.

## Feature docs directory

Feature documentation lives at:

```
/specs/
```

Within this directory, each feature has its own folder named `<feature-name>/`, containing
`goals.md`, `requirements.md`, and `architecture.md` as applicable.
Within that `<feature-name>` directory should be a directory named `.temp/` with files that
do not need to be kept after feature development is complete, such as `mocks.html`, `mocks.context.md`,
and `implementation_plan/`.

## Quality commands

Run these commands to verify code quality. All must pass before committing.

- **Format**: `npm run format:check`
- **Check (lint + typecheck + ratchets)**: `npm run lint:check`
- **Unit tests**: `npm run test:unit`

## Product identity

This is not a product, but a platform which contains an API that's published via NPM and
several supporting tools. The platform is called Babylon.js, and the tools include several
deployed web-based tools, such as the playground, sandbox, and editors: Node Material
Editor (NME), GUI Editor, Node Geometry Editor (NGE), Node Render Graph Editor (NRGE),
Smart Filters Editor (SFE), Node Particle Editor (NPE), and the Viewer.

When creating HTML mocks, match the look and feel of the tool's existing UI. Don't guess at
what the tool looks like — read the UI code and create a close approximation.

## Manual testing

To manually test see the instructions in `.github/instructions/manual-testing.instructions.md`

## Test conventions

### Unit tests

Place unit tests in a `test` folder alongside the `src` folder of the code to test.
Unit tests must be in a `unit` subdirectory (e.g. `test/unit/`) to be picked up by the test runner. Test files must end with `.test.ts` and **must** end with `test.ts` to be recognized. For example:

```
/ src
  / MyFeature
    index.ts
    / test
      / unit
        myFeature.test.ts
```

### Visualization tests

Every major new rendering feature **must** have a visualization test. These are
Playwright-based screenshot comparison tests that run on both **WebGL2** and **WebGPU**.
Skipping this step is not acceptable — rendering regressions that slip through without
visual coverage are costly to diagnose.

**Do not** create new Playwright test files. **Do not** modify `visualization.webgl2.test.ts`
or `visualization.webgpu.test.ts` — they automatically pick up every entry in the config.
The only file you should touch is the config JSON and the reference image.

Follow these steps exactly:

1. Create (or reuse) a Playground snippet that exercises the feature. Record the snippet ID
   and version (e.g. `#RKKCHG#15`). The snippet **must** export a `createScene` function.
2. Add an entry to `packages/tools/tests/test/visualization/config.json`:

    ```json
    {
        "title": "My Feature Name",
        "playgroundId": "#SNIPPET_ID#VERSION",
        "renderCount": 15,
        "referenceImage": "my-feature-name.png"
    }
    ```

    All fields are required unless noted:
    - `title` — descriptive name for test output. Must be unique across the config.
    - `playgroundId` — snippet ID, optionally with `#VERSION`. Do not omit the `#` prefix.
    - `renderCount` — frames to render before the screenshot (default 1). Set a higher
      value if the feature needs multiple frames to stabilize (e.g. async loading, animations).
    - `referenceImage` — golden image filename in `ReferenceImages/`. Use lowercase kebab-case.
    - `errorRatio` (optional) — override the default pixel-diff tolerance (1.1 %).
      Only set this when there is a justified reason; do not use it to paper over flaky output.

3. Generate the reference image by running:

    ```bash
    npx playwright test --config playwright.config.ts --update-snapshots -g "My Feature Name"
    ```

    Verify the generated image visually before committing — do not blindly accept it.

4. Commit the reference image **together** with the config change. Never commit one without
   the other.

WebGPU tests require a real Chrome installation (not Chromium). If ChromeWebGPU is not
available locally, the WebGPU project will be skipped, but the test **must** still pass in
CI where Chrome is present.

To run visualization tests locally:

```bash
# Full suite (requires the CDN server on localhost:1337)
npm run test:playwright -w @tools/tests

# Single test by title
npx playwright test --config playwright.config.ts -g "My Feature Name"
```

Visualization tests require the CDN server to be running on `localhost:1337` because they load assets from the CDN.
If the server is not started, start it with:

```bash
npm start
```

If you started the server task you **must** stop it after running the tests to avoid leaving a long-running process.

## Related skills

These project-specific skills are referenced by the workflow skills. If a skill is not
available in your project, the instruction referencing it can be skipped.

- **Manual testing / screenshots**: `/manual-testing` — launch the app in a headless browser
  and interact with the UI via Playwright CLI to take screenshots or manually test features.
