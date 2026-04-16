# Visual Tests Reference

Reference material for Babylon.js visualization tests. For the workflow and step-by-step guide, see [visual-tests.instructions.md](visual-tests.instructions.md).

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

Default to `renderCount: 1`. Make the scene fully ready before returning it instead of compensating with a higher `renderCount`.

Only raise `renderCount` when the screenshot genuinely depends on later frames (animation state, time-based effects, particle advancement). Use the smallest stable value. For particles, prefer `preWarmCycles` / `preWarmStepOffset` over large `renderCount`.

## Error ratio tuning

Keep the default unless you have a specific reason. Lower it for pixel-perfect output. Raise it only for understood variance. Never increase `errorRatio` just to make a flaky test pass.

## Updating an existing visual test

1. Run the test and confirm it fails against the old baseline.
2. Confirm the new visual output is correct.
3. Regenerate with `--update-snapshots`.
4. Review the new baseline before keeping it.
5. Commit code change and updated reference image together.

## Multi-engine testing

Tests usually run against both WebGL2 and WebGPU, sharing the `ReferenceImages/` directory. Use `excludedEngines` only when the feature genuinely doesn't apply to one engine. The WebGPU project uses Chrome channel (not generic Chromium); it may be skipped locally but must pass in CI.

## Devhost-based visual tests

For tool tests (not Playground snippets), use the appropriate devhost config (e.g. `config.lottie.json`) with `devHostQsps` instead of `playgroundId`. Use `readySelector` and `screenshotDelayMs` when the page needs explicit readiness handling.

## Common issues

- Flaky tests usually need a higher `renderCount`, not a rushed baseline update.
- Async loading often needs more frames than expected.
- Transparency, alpha-heavy scenes, and text rendering can produce larger diffs.
- Platform differences: use per-engine baselines first, tolerance changes second.
