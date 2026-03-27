---
applyTo: "packages/dev/**/*.ts"
---

# Unit Tests (Vitest)

Unit tests use **Vitest** and live under a `test/unit/` folder at each package's source root. In `packages/dev/core`, for example, unit tests are further organized into subfolders by area (such as `test/unit/Scene/`, `test/unit/Animations/`, etc.), and test files typically mirror the relevant source file or feature name with a `.test.ts` or `.test.tsx` extension (for example, tests for `packages/dev/core/src/scene.ts` live under `packages/dev/core/test/unit/Scene/` rather than as a single flat `scene.test.ts` at the root of `test/unit/`). Aim to keep a clear, discoverable mapping between source files and their corresponding tests, but it does not need to be a strict 1:1 filename match.

Vitest is configured with `globals: true`, so `describe`, `it`, `test`, and `expect` are available as globals; however, new or updated test files should prefer explicit imports from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`, `afterEach`, etc.). Use `vi.fn()` and `vi.spyOn()` for mocking, and `vi.useFakeTimers()` / `vi.useRealTimers()` for timer control.

Run unit tests with `npm test` or `npx vitest run --project=unit` from the repo root.

When reviewing code, check if new APIs are being introduced without unit tests. If they are missing and the APIs are well suited for unit tests, try to add new tests yourself, otherwise at least flag missing tests in the review comments.

# Integration, Performance, and Interaction Tests (Playwright)

Browser-dependent tests — integration, performance, and interaction — use **Playwright**. These live under `test/integration/`, `test/performance/`, or `test/interaction/` folders respectively, following the same per-package layout as unit tests.

Run them with:

```
npm run test:integration
npm run test:performance
npm run test:interactions
```

# Visualization (Playwright) Tests

Tests that validate a visual result in the browser use Playwright.

Babylon.js-specific guidance for where visualization tests live, how to add config entries,
how to generate reference images, how to run them locally, and how to handle devhost-based
visual tests lives in `.github/instructions/visual-tests.instructions.md`.
