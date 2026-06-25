# Tree-Shaking Scripts

This folder contains the supported maintenance scripts for the `@babylonjs/core` tree-shaking split. These scripts keep the pure import surface, side-effect metadata, generated barrels, generated warning stubs, and bundle smoke tests in sync.

Most contributors should use the `npm run ...` commands from the repository root instead of invoking the `.mjs` files directly. Direct script invocation is useful when debugging a single tool, running with `--verbose`, or using `--dry-run` before writing generated output.

The one-off migration helpers used to create the split live in [migration/](migration/README.md). They are kept for reference and follow-up migration work, but they are not part of the normal contributor workflow.

## Quick Reference

| Command                              | Writes files | Purpose                                                                                                    |
| ------------------------------------ | ------------ | ---------------------------------------------------------------------------------------------------------- |
| `npm run check:treeshaking-all`      | No           | Runs the full supported verification set: generated invariants, side-effects sync, and bundle smoke tests. |
| `npm run check:treeshaking`          | No           | Runs manifest drift, side-effect import closure, pure barrel, and side-effect stub checks.                 |
| `npm run test:treeshaking`           | No           | Bundles representative entry points with Rollup and Webpack and checks expected bundle sizes.              |
| `npm run update:manifest`            | Yes          | Regenerates sharded files under `side-effects-manifest/core/` from source analysis.                        |
| `npm run generate:pure-barrels`      | Yes          | Regenerates generated `pure.ts` barrels under `packages/dev/core/src`.                                     |
| `npm run generate:side-effect-stubs` | Yes          | Regenerates generated missing-side-effect warning stubs in target class files.                             |
| `npm run check:side-effects-sync`    | No           | Checks that the public package `sideEffects` field matches the manifest.                                   |
| `npm run inject:pure-annotations`    | Yes          | Adds missing `/*#__PURE__*/` annotations to compiled `.pure.js` output.                                    |

Run this after changing files that affect tree-shaking behavior:

```sh
npm run check:treeshaking-all
```

Run this when source changes intentionally alter generated tree-shaking metadata:

```sh
npm run update:manifest
npm run generate:pure-barrels
npm run generate:side-effect-stubs
npm run check:treeshaking-all
```

## How The Scripts Fit Together

Tree-shaking support is maintained through three related data sets:

1. `scripts/treeshaking/side-effects-manifest/core/` records which `@babylonjs/core` source files have module-level side effects and the stable reason types for each file.
2. Generated `pure.ts` barrels expose side-effect-free import paths by re-exporting `.pure.ts` files, side-effect-free plain `.ts` files, and child `pure.ts` barrels.
3. Generated side-effect stubs add helpful missing-import warnings for methods and properties declared through `.types.ts` module augmentations.

The manifest is the input for both pure barrel generation and the public package `sideEffects` field. The committed shards intentionally omit line numbers, source snippets, and global stats so unrelated PRs are less likely to conflict when source lines move. The diagnostic report still records real line numbers for hand-authored files, but generated shader files under `Shaders/` and `ShadersWGSL/` use a stable `line: 0` for `shader-store-write` entries because regenerated shader text can move the `ShaderStore` assignment without changing the side-effect classification. The core shards live under their package subdirectory and are grouped by the top-level `packages/dev/core/src` directory, so PRs changing different areas usually edit different manifest files. If a source file gains or loses module-level side effects, regenerate the manifest first, then regenerate or check the consumers of that manifest.

## Package Wiring

The supported scripts are wired into the repository in a few places:

| Location                                        | Wiring                                                                                                             |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Root `lint:check`                               | Runs ESLint, then `check:treeshaking`, then `check:side-effects-sync`.                                             |
| Root `lint:check-ci`                            | Runs ESLint, `lint:cycles`, `check:treeshaking`, and `check:side-effects-sync`.                                    |
| Root `build:es6`                                | Runs the normal ES6 build and then `check:treeshaking-all`.                                                        |
| Root `check:treeshaking-all`                    | Runs `check:treeshaking`, `check:side-effects-sync`, and `test:treeshaking`.                                       |
| `packages/dev/core` `precompile`                | Regenerates the side-effects manifest, syncs package `sideEffects`, and regenerates pure barrels before compiling. |
| `packages/dev/core` `compile:source`            | Runs TypeScript and then `injectPureAnnotations.mjs` against compiled output.                                      |
| `packages/public/@babylonjs/core` `postcompile` | Runs `injectPureAnnotations.mjs` against the public package output.                                                |

## Supported Scripts

### `auditSideEffects.mjs`

Scans `packages/dev/core/src` and reports files with module-level side effects. The scanner recognizes patterns such as `RegisterClass(...)`, prototype assignments, shader store registration, node constructor registration, bare top-level calls, static class property assignments, and `declare module` augmentations.

Common commands:

```sh
npm run audit:side-effects
npm run update:manifest
node scripts/treeshaking/auditSideEffects.mjs --json
node scripts/treeshaking/auditSideEffects.mjs --out /tmp/side-effects-details.json --details
node scripts/treeshaking/auditSideEffects.mjs --out scripts/treeshaking/side-effects-manifest/core
```

Use `npm run update:manifest` when intentional source changes alter which files are side-effectful. The generated compact manifest shards should be committed when they change. Use `--json` or `--details` when you need the diagnostic report with line numbers and source snippets for debugging.

### `checkManifestDrift.mjs`

Regenerates the side-effects manifest into a temporary directory and compares it to the committed `side-effects-manifest/core/` shards. It exits nonzero when the committed manifest is stale.

Common command:

```sh
npm run check:manifest-drift
```

If this check fails, run `npm run update:manifest`, review the manifest diff, and then run `npm run check:treeshaking-all`.

### `syncSideEffects.mjs`

Reads `side-effects-manifest/core/` and synchronizes the public `@babylonjs/core` package `sideEffects` array. This tells bundlers which compiled package files must be retained for module-level side effects.

Common commands:

```sh
node scripts/treeshaking/syncSideEffects.mjs
npm run check:side-effects-sync
node scripts/treeshaking/syncSideEffects.mjs --dry-run --verbose
```

Normal mode writes `packages/public/@babylonjs/core/package.json`. `--check` mode validates the package file without writing.

### `checkSideEffectImportClosure.mjs`

Checks that files omitted from the side-effects manifest do not statically value-import or value-re-export files included in the manifest. This protects the side-effect-free import surface used by pure barrels and public package metadata.

Any violation fails the check. There is intentionally **no** baseline or allow-list: a side-effect-free file must never statically value-import or re-export a side-effectful file. Fix violations by importing the dependency's `.pure` module, or by splitting the importer — never by suppressing the check.

Common commands:

```sh
node scripts/treeshaking/checkSideEffectImportClosure.mjs
node scripts/treeshaking/checkSideEffectImportClosure.mjs --package gui --verbose
```

### `generatePureBarrels.mjs`

Generates `pure.ts` barrels beside `index.ts` files under `packages/dev/core/src`. Each generated barrel starts with the standard generated header and re-exports only side-effect-free modules.

Inputs include:

- Existing `.pure.ts` files.
- The side-effects manifest.
- Existing `index.ts` export structure.
- Child directory `pure.ts` barrels.

Common commands:

```sh
npm run generate:pure-barrels
npm run generate:pure-barrels -- --format
npm run check:pure-barrels
node scripts/treeshaking/generatePureBarrels.mjs --dry-run --verbose
```

Normal mode writes generated `pure.ts` barrels. Formatting is skipped by default;
pass `--format` to format written files with Prettier. `--check` mode compares
on-disk generated barrels with expected content and also reports stale generated
barrels that are no longer expected.

### `generateSideEffectStubs.mjs`

Generates missing-side-effect warning stubs for public methods and properties declared by `.types.ts` module augmentations. These stubs make an unregistered augmented API fail with a helpful warning instead of a plain `TypeError`.

The script:

- Scans every `.types.ts` file under `packages/dev/core/src`.
- Parses `declare module` blocks and their exported interfaces.
- Resolves each augmentation target to a `.pure.ts` or `.ts` file.
- Injects generated regions between `GENERATED_SIDE_EFFECT_STUBS` markers.
- Prunes child-class stubs when an ancestor prototype already provides the same warning stub.

Common commands:

```sh
npm run generate:side-effect-stubs
npm run generate:side-effect-stubs -- --format
node scripts/treeshaking/generateSideEffectStubs.mjs --check
node scripts/treeshaking/generateSideEffectStubs.mjs --dry-run --verbose
```

Normal mode writes generated regions and removes stale generated regions.
Formatting is skipped by default; pass `--format` to format written files with
Prettier. `--check` mode validates existing regions without writing and reports
stale generated regions that should be removed.

### `verifyTreeShaking.mjs`

Runs the core generated-invariant checks in sequence:

1. Manifest drift.
2. Side-effect import closure.
3. Pure barrels.
4. Side-effect stubs.

Common command:

```sh
npm run check:treeshaking
```

This is the check used by root `lint:check` and `lint:check-ci`. It does not run the bundle smoke tests or the public package `sideEffects` sync check; use `npm run check:treeshaking-all` for the larger verification set.

### `bundleSmokeTest.mjs`

Builds representative entry points with Rollup and Webpack and checks that bundle sizes stay within expected bounds. The tests cover cases such as pure utility imports, pure package barrels, side-effectful wrapper imports, pure registration imports, and explicit registration calls.

Common command:

```sh
npm run test:treeshaking
```

Prerequisites:

- `packages/dev/core/dist` must exist.
- Rollup and Webpack must be available from the repository dependencies.

This script writes temporary files under `scripts/treeshaking/.tmp` while running and removes them afterward.

### `injectPureAnnotations.mjs`

Post-processes compiled `.pure.js` files and injects missing `/*#__PURE__*/` annotations for top-level call expressions where TypeScript dropped the annotation during emit. This is especially important for static class field initializers that compile into top-level assignments.

Common commands:

```sh
npm run inject:pure-annotations
npm run inject:pure-annotations -- --format
node scripts/treeshaking/injectPureAnnotations.mjs --dry-run --verbose
```

Formatting is skipped by default; pass `--format` to format written files with
Prettier. The script intentionally does not annotate decorator helper calls such
as `__decorate(...)`, because those calls mutate prototypes and must not be
removed as pure work.

### `splitRegisterClass.mjs`

Transforms files whose only module-level side effect is `RegisterClass(...)` into the tree-shaking split shape:

- `file.pure.ts` contains the implementation.
- `file.ts` is the compatibility wrapper that re-exports the pure implementation and performs `RegisterClass(...)`.

Common commands:

```sh
npm run split:register-class
npm run split:register-class -- --format
node scripts/treeshaking/splitRegisterClass.mjs --dry-run --file Maths/math.color.ts --verbose
```

This is a source-modifying maintenance script. Formatting is skipped by default;
pass `--format` to format written files with Prettier. Use `--dry-run` first,
review the diff carefully, and run the generated checks afterward.

### `catalogStaticHelpers.mjs`

Reports static helper coverage for selected high-priority classes by comparing class static methods and properties against exported free functions in related `*.functions.ts` files.

Common commands:

```sh
npm run catalog:static-helpers
node scripts/treeshaking/catalogStaticHelpers.mjs --verbose
```

This is an analysis/reporting tool. It does not write files and is not part of the normal lint or build verification path.

## Generated Files And Artifacts

| Artifact                                                     | Owner script                  | Commit it?                                                                                             |
| ------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------------------------------------------ |
| `scripts/treeshaking/side-effects-manifest/core/*.json`      | `auditSideEffects.mjs --out`  | Yes, when source side-effect classification intentionally changes. Compact file-to-reason shards only. |
| `packages/public/@babylonjs/core/package.json` `sideEffects` | `syncSideEffects.mjs`         | Yes, when the synced `sideEffects` array changes.                                                      |
| `packages/dev/core/src/**/pure.ts` generated barrels         | `generatePureBarrels.mjs`     | Yes, when generated barrel content changes.                                                            |
| `GENERATED_SIDE_EFFECT_STUBS` regions                        | `generateSideEffectStubs.mjs` | Yes, when generated stubs change.                                                                      |
| `packages/dev/core/dist/**/*.pure.js` annotations            | `injectPureAnnotations.mjs`   | No for normal source PRs, because `dist` is build output.                                              |
| `scripts/treeshaking/.tmp`                                   | `bundleSmokeTest.mjs`         | No. Temporary test workspace only.                                                                     |

## Common Workflows

### After Adding Or Removing A `.pure.ts` File

```sh
npm run generate:pure-barrels
npm run check:treeshaking-all
```

Review and commit any generated `pure.ts` barrel changes.

### After Adding Or Removing A Module-Level Side Effect

```sh
npm run update:manifest
node scripts/treeshaking/syncSideEffects.mjs
npm run generate:pure-barrels
npm run check:treeshaking-all
```

Review and commit manifest, package `sideEffects`, and generated barrel changes as appropriate.

### After Adding A `.types.ts` Module Augmentation

```sh
npm run generate:side-effect-stubs
npm run check:treeshaking-all
```

Review and commit any generated stub region changes.

### Before Opening Or Updating A Tree-Shaking PR

```sh
npm run check:treeshaking-all
```

For broader repository confidence, also run the standard repo checks documented at the root of the project.

## Check Modes And Write Modes

Several scripts support both write mode and check mode:

| Script                        | Write mode                                 | Check mode                                                       |
| ----------------------------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `generatePureBarrels.mjs`     | Writes generated `pure.ts` barrels.        | `--check` verifies expected content and stale generated barrels. |
| `generateSideEffectStubs.mjs` | Writes and removes generated stub regions. | `--check` verifies expected regions and stale generated regions. |
| `syncSideEffects.mjs`         | Writes public package `sideEffects`.       | `--check` verifies the package file is in sync.                  |

Prefer check mode in CI and write mode during local maintenance. When a check fails, run the matching write command, review the diff, and rerun `npm run check:treeshaking-all`.

## Migration Scripts

The scripts in [migration/](migration/README.md) were created for one-time migration phases while building the tree-shaking split. They may still be useful for investigation or future large migrations, but they are not CI-supported maintenance commands. Do not add new lint, build, or test dependencies on migration scripts without first promoting and documenting the script as supported tooling in this README.
