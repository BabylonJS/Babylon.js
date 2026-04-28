# Refactor: Move ModularTool Framework from Inspector v2 to sharedUiComponents

## Problem Statement

Inspector v2 (`packages/dev/inspector-v2/src/`) contains two conceptual layers:

1. **ModularTool framework** — A general-purpose tool framework: service container, shell layout (toolbars, side panes, central content), theming, settings persistence, extensibility, and shared Fluent UI components. This is reusable by any Babylon.js tool.
2. **Inspector application** — The scene inspector built on top of the framework: scene explorer, properties panel, gizmos, watcher, picking, debug views, curve editor, texture editor, CLI, etc.

Currently, other tools (e.g. viewer-configurator) depend on inspector-v2 to access the ModularTool framework, creating a false dependency on the Inspector. The general-purpose framework should live in `packages/dev/sharedUiComponents/src/`, where it can be consumed by both Inspector and other tools without a dependency on Inspector.

Additionally, `sharedUiComponents/src/fluent/` already contains Fluent UI primitives, HOCs, and hooks that are part of the same shared component ecosystem. These should be merged into the new directory structure for a unified layout.

## Proposed Directory Structure

Create `packages/dev/sharedUiComponents/src/modularTool/` mirroring the inspector-v2 source tree for the subset of files that move. The existing `fluent/` contents are merged in, with `primitives/` and `hoc/` keeping their names and `hooks/` merging into the shared `hooks/` directory.

```
sharedUiComponents/src/modularTool/
├── modularTool.tsx                     ← from inspector-v2/src/modularTool.tsx
│
├── modularity/
│   ├── serviceDefinition.ts            ← from inspector-v2/src/modularity/
│   └── serviceContainer.ts             ← from inspector-v2/src/modularity/
│
├── services/
│   ├── shellService.tsx                ← from inspector-v2/src/services/
│   ├── settingsStore.ts                ← from inspector-v2/src/services/
│   ├── globalSettings.ts              ← CompactMode + DisableCopy descriptors (split from inspector-v2)
│   ├── themeService.ts                 ← from inspector-v2/src/services/
│   ├── themeSelectorService.tsx         ← from inspector-v2/src/services/
│   ├── reactContextService.ts          ← from inspector-v2/src/services/
│   ├── extensionsListService.tsx       ← from inspector-v2/src/services/
│   ├── settingsService.tsx             ← from inspector-v2/src/services/panes/ (framework only, see Splitting)
│   └── shellSettingsService.tsx        ← from inspector-v2/src/services/
│
├── hooks/
│   ├── observableHooks.ts              ← from inspector-v2/src/hooks/
│   ├── settingsHooks.ts                ← from inspector-v2/src/hooks/ (useSetting only, see Splitting)
│   ├── themeHooks.ts                   ← from inspector-v2/src/hooks/
│   ├── resourceHooks.ts                ← from inspector-v2/src/hooks/
│   ├── teachingMomentHooks.ts          ← from inspector-v2/src/hooks/
│   ├── useResizeHandle.ts              ← from inspector-v2/src/hooks/
│   ├── eventHooks.ts                   ← from fluent/hooks/
│   ├── keyboardHooks.ts                ← from fluent/hooks/
│   └── transientStateHooks.ts          ← from fluent/hooks/
│
├── contexts/
│   ├── settingsContext.ts              ← from inspector-v2/src/contexts/
│   └── extensionManagerContext.ts      ← from inspector-v2/src/contexts/
│
├── components/
│   ├── theme.tsx                       ← from inspector-v2/src/components/
│   ├── errorBoundary.tsx               ← from inspector-v2/src/components/
│   ├── teachingMoment.tsx              ← from inspector-v2/src/components/
│   ├── extensibleAccordion.tsx         ← from inspector-v2/src/components/
│   ├── pane.tsx                        ← from inspector-v2/src/components/
│   ├── uxContextProvider.tsx           ← from inspector-v2/src/components/
│   │
│   ├── primitives/                     ← from fluent/primitives/ (entire directory)
│   │   ├── accordion.tsx
│   │   ├── button.tsx
│   │   ├── checkbox.tsx
│   │   ├── ... (all existing files)
│   │   └── utils.ts
│   │
│   └── hoc/                            ← from fluent/hoc/ (entire directory)
│       ├── buttonLine.tsx
│       ├── fluentToolWrapper.tsx
│       ├── propertyLines/
│       │   ├── propertyLine.tsx
│       │   └── ... (all existing files)
│       └── ... (all existing files)
│
├── extensibility/
│   ├── extensionFeed.ts                ← from inspector-v2/src/extensibility/
│   ├── extensionManager.ts             ← from inspector-v2/src/extensibility/
│   └── builtInsExtensionFeed.ts        ← from inspector-v2/src/extensibility/
│
├── misc/
│   ├── observableCollection.ts         ← from inspector-v2/src/misc/
│   ├── graphUtils.ts                   ← from inspector-v2/src/misc/
│   └── assert.ts                       ← from inspector-v2/src/misc/
│
├── themes/
│   └── babylonTheme.ts                 ← from inspector-v2/src/themes/
│
├── icons.ts                            ← from fluent/icons.ts
└── readme.md                           ← from fluent/readme.md (updated)
```

## What Stays in Inspector v2

Everything Inspector-specific remains in `packages/dev/inspector-v2/src/`:

### Services (stay)
- `sceneContext.ts` — Scene-specific
- `selectionService.tsx` — Scene entity selection
- `gizmoService.ts` — Gizmo management
- `gizmoToolbarService.tsx` — Gizmo toolbar UI
- `highlightService.ts` — Scene highlight
- `pickingService.tsx` — Scene picking
- `watcherService.tsx` — Property watching (depends on `InterceptProperty`)
- `miniStatsService.tsx` — Stats overlay
- `userFeedbackService.tsx` — User feedback
- `globalSettings.ts` — Inspector-specific setting descriptors (`UseDegreesSettingDescriptor`, `UseEulerSettingDescriptor`); general-purpose descriptors (`CompactModeSettingDescriptor`, `DisableCopySettingDescriptor`) move to shared
- `defaultToolbarMetadata.ts` — Inspector-specific toolbar ordering
- `cliConnectionStatusService.tsx` — CLI status
- `services/cli/` — CLI services
- `services/panes/` — Remaining pane services (properties, scene, debug, stats, tools) — `settingsService` moves to shared
- `services/textureEditor/` — Texture editor service

### Hooks (stay)
- `compoundPropertyHooks.ts` — Property panel hooks
- `instrumentationHooks.ts` — Property instrumentation
- `pollingHooks.ts` — Scene polling
- `useObservableArray.ts` — Observable array hook
- `settingsHooks.ts` — **Only `useAngleConverters`** stays (see Splitting section)

### Contexts (stay)
- `propertyContext.ts` — Property panel context
- `watcherContext.ts` — Watcher context (depends on `InterceptProperty`)

### Components (stay)
- `components/curveEditor/` — Curve editor
- `components/debug/` — Debug views
- `components/gizmoToolbar.tsx` — Gizmo toolbar
- `components/performanceViewer/` — Performance viewer
- `components/pickingToolbar.tsx` — Picking toolbar
- `components/properties/` — Property panel components
- `components/scene/` — Scene explorer
- `components/stats/` — Stats components
- `components/textureEditor/` — Texture editor
- `components/tools/` — Tool components

### Other (stay)
- `inspector.tsx` — Inspector entry point
- `inspectable.ts` — Inspectable interface
- `instrumentation/` — Property interception
- `legacy/` — Legacy compatibility
- `extensions/` — Built-in inspector extensions
- `extensibility/defaultInspectorExtensionFeed.ts` — Inspector-specific feed
- `cli/` — CLI tools
- `misc/` — Remaining misc files (`defaultPerfStrategies.ts`, `nodeMaterialEditor.ts`, `nodeGeometryEditor.ts`, `snippetUtils.ts`, `textureTools.ts`)

## Files That Need Splitting

### `hooks/settingsHooks.ts`
- **Move to shared:** `useSetting` (general-purpose, used by shellService, themeSelectorService, teachingMomentHooks)
- **Stays in inspector:** `useAngleConverters` (depends on `UseDegreesSettingDescriptor` from `globalSettings.ts`)

After splitting, inspector-v2's `settingsHooks.ts` retains only:
```ts
export function useAngleConverters() { ... }
```

Inspector-v2 files that need `useSetting` import it directly from `shared-ui-components/modularTool/hooks/settingsHooks`.

### `services/panes/settingsService.tsx`

The current `SettingsServiceDefinition` consumes both `IShellService` (general) and `ISceneContext` (Inspector-specific), and its factory registers a side pane with hardcoded settings UI (CompactMode, UseDegrees, UseEuler, DisableCopy).

**Split into:**
- **Move to shared** (`modularTool/services/settingsService.tsx`): The `SettingsServiceIdentity`, `ISettingsService` interface, and a `SettingsServiceDefinition` that provides the extensible settings pane framework (addSection, addSectionContent) without any hardcoded settings. Remove the `ISceneContext` dependency — the settings pane doesn't inherently need a scene; Inspector-specific code that calls `addSectionContent` with a scene-dependent component can handle that in its own layer.
- **Stays in inspector** (new file, e.g. `services/inspectorSettingsService.ts`): A new service that consumes `ISettingsService` (and `ISceneContext` if needed) and calls `settingsService.addSectionContent(...)` to register the Inspector-specific setting toggles (UseDegrees, UseEuler) and the general setting toggles (CompactMode, DisableCopy). This is analogous to how `shellSettingsService.tsx` adds shell-specific settings via `addSectionContent`.

After splitting, the shared `SettingsServiceDefinition` consumes only `[IShellService]` and produces `[ISettingsService]`. Inspector registers `InspectorSettingsServiceDefinition` which consumes `[ISettingsService, ISceneContext]` and adds the setting toggles.

### `components/uxContextProvider.tsx`

Currently references `CompactModeSettingDescriptor` and `DisableCopySettingDescriptor` from `globalSettings.ts`.

**Decision:** Move `CompactModeSettingDescriptor` and `DisableCopySettingDescriptor` to the shared layer (e.g. `modularTool/services/globalSettings.ts`) since they are general UI settings used by the tool framework, not Inspector-specific. `UseDegreesSettingDescriptor` and `UseEulerSettingDescriptor` stay in Inspector's `globalSettings.ts`. Then `uxContextProvider.tsx` can move to shared with no splitting needed.

## Key Decisions

### 1. `extensionsListService.tsx` — Move or Stay?

`modularTool.tsx` dynamically imports `extensionsListService` to show an extension browser when extension feeds are provided. The service itself:
- Depends on `IShellService`, `IExtension`, `ExtensionMetadata` (all moving)
- Uses `useExtensionManager` from `extensionManagerContext` (moving)
- Uses shared Fluent components and `@fluentui/react-icons` directly
- Has **no Inspector-specific logic** — it's a generic extension browser UI

**Decision: Move it.** It's part of the modular tool extensibility system.

### 2. `extensibleAccordion.tsx` — Move or Stay?

- Depends on `useExtensionManager` from `extensionManagerContext` (moving)
- Used by Inspector to render extensible accordion sections
- The concept of "accordion with extension slots" is general-purpose

**Decision: Move it** to `modularTool/components/`. It's a general-purpose UI pattern for extensible side pane content.

### 3. `themes/babylonTheme.ts` — General or Inspector-specific?

- Contains Babylon.js brand colors (blue ramp), not Inspector-specific colors
- Used by `themeService.ts` to provide light/dark themes
- Any Babylon.js tool would want the same brand theme

**Decision: Move it.** It's the Babylon.js brand theme, not Inspector-specific.

### 4. How do consumers reference the moved files?

**For Inspector (which uses source paths via `shared-ui-components` alias):**
- Change internal imports from `./services/settingsStore` to `shared-ui-components/modularTool/services/settingsStore`
- OR keep re-exports in inspector-v2's `index.ts` pointing to the new locations

**For viewer-configurator (which uses `inspector` webpack alias):**
- Change the webpack alias from `inspector` → `inspector-v2/src` to instead point at the appropriate package
- OR change imports from `inspector/...` to `shared-ui-components/modularTool/...`

**Recommended approach:** Viewer-configurator and future tools import directly from `shared-ui-components/modularTool/...`. Inspector-v2's `index.ts` re-exports everything from the new location for backward compatibility with existing extension consumers.

### 5. Inspector v2's public API must not change

Inspector v2's `index.ts` is a public/bundle API surface consumed by extensions and by the `@babylonjs/inspector-v2` public package. **Every symbol currently exported from `index.ts` must continue to be exported** — just the import sources change from relative paths to `shared-ui-components/modularTool/...` paths. No exports should be removed. This ensures extensions and downstream consumers are unaffected.

### 5. `pane.tsx` (SidePaneContainer) — Move or Stay?

- `SidePaneContainer` is exported from inspector-v2's index.ts
- Used by inspector components to wrap pane content
- It's a thin wrapper, general-purpose

**Decision: Move it** to `modularTool/components/`.

## Import Path Updates

### Viewer-configurator
| Current import | New import |
|---|---|
| `inspector/modularTool` | `shared-ui-components/modularTool/modularTool` |
| `inspector/modularity/serviceDefinition` | `shared-ui-components/modularTool/modularity/serviceDefinition` |
| `inspector/services/shellService` | `shared-ui-components/modularTool/services/shellService` |
| `inspector/hooks/observableHooks` | `shared-ui-components/modularTool/hooks/observableHooks` |

The `inspector` webpack alias can be removed from viewer-configurator's `webpack.config.js` since it already has a `shared-ui-components` alias.

### Inspector v2 internal imports
All files that moved will need their relative imports updated to reflect the new directory structure. Files that stayed will need imports updated from relative paths to `shared-ui-components/modularTool/...` paths.

### Fluent component imports
Currently: `shared-ui-components/fluent/primitives/button`
After: `shared-ui-components/modularTool/components/primitives/button`

Currently: `shared-ui-components/fluent/hoc/propertyLines/propertyLine`
After: `shared-ui-components/modularTool/components/hoc/propertyLines/propertyLine`

This affects both inspector-v2 and viewer-configurator. All existing Fluent component imports need updating.

## sharedUiComponents Package Changes

### package.json
- Add peer/dev dependencies that the moved files need:
  - `@fluentui/react-motion-components-preview` (used by shellService)
  - Verify `@fluentui/react-components` and `@fluentui/react-icons` versions are sufficient

### tsconfig.json
- Ensure the new `modularTool/` directory is included in the compilation

### Existing `fluent/` directory
After merging into `modularTool/`, the `fluent/` directory is deleted entirely. A temporary re-export shim could ease migration for other consumers, but ideally all import paths are updated at once.

## Migration Strategy for Fluent Imports

The `fluent/` directory is imported by many files across the repo. Options:

**Option A — Big Bang:** Update all import paths in one commit. Clean but large diff.

**Option B — Re-export Shim:** Keep `fluent/` as a directory of re-exports pointing to `modularTool/`. Migrate consumers incrementally, then delete shims.

**Recommended: Option A** — The paths are mechanical and searchable. A single find-and-replace pass handles it. The `fluent/` directory is only imported within `inspector-v2` and the tools, not by external packages.

## Detailed Todos

### 1. `create-modular-tool-dir` — Create directory structure
Create the `modularTool/` directory and all subdirectories under `packages/dev/sharedUiComponents/src/`.

### 2. `move-core-framework` — Move core framework files
Move from `inspector-v2/src/` to `sharedUiComponents/src/modularTool/`:
- `modularTool.tsx`
- `modularity/serviceDefinition.ts`
- `modularity/serviceContainer.ts`
- `misc/observableCollection.ts`
- `misc/graphUtils.ts`
- `misc/assert.ts`
- `themes/babylonTheme.ts`

### 3. `move-services` — Move general-purpose services
Move:
- `services/settingsStore.ts`
- `services/shellService.tsx`
- `services/themeService.ts`
- `services/themeSelectorService.tsx`
- `services/reactContextService.ts`
- `services/extensionsListService.tsx`
- `services/panes/settingsService.tsx` → `services/settingsService.tsx`
- `services/shellSettingsService.tsx`

### 4. `move-hooks` — Move hooks and split settingsHooks
Move:
- `hooks/observableHooks.ts`
- `hooks/themeHooks.ts`
- `hooks/resourceHooks.ts`
- `hooks/teachingMomentHooks.ts`
- `hooks/useResizeHandle.ts`

Split `hooks/settingsHooks.ts`:
- Move `useSetting` to `modularTool/hooks/settingsHooks.ts`
- Keep `useAngleConverters` in inspector-v2 (import `useSetting` from new location)

### 5. `move-contexts` — Move contexts
Move:
- `contexts/settingsContext.ts`
- `contexts/extensionManagerContext.ts`

### 6. `move-components` — Move general-purpose components
Move:
- `components/theme.tsx`
- `components/errorBoundary.tsx`
- `components/teachingMoment.tsx`
- `components/extensibleAccordion.tsx`
- `components/pane.tsx`
- `components/uxContextProvider.tsx`

### 7. `move-extensibility` — Move extensibility system
Move:
- `extensibility/extensionFeed.ts`
- `extensibility/extensionManager.ts`
- `extensibility/builtInsExtensionFeed.ts`

### 8. `merge-fluent` — Merge existing fluent directory
Move all contents of `sharedUiComponents/src/fluent/` into `modularTool/`:
- `fluent/primitives/` → `modularTool/components/primitives/`
- `fluent/hoc/` → `modularTool/components/hoc/`
- `fluent/hooks/` → `modularTool/hooks/` (merge with hooks from step 4)
- `fluent/icons.ts` → `modularTool/icons.ts`
- `fluent/readme.md` → `modularTool/readme.md`

Delete `sharedUiComponents/src/fluent/` after moving.

### 9. `update-internal-imports` — Fix imports within moved files
Update all relative imports within the moved files to reflect the new directory structure. The internal relative paths between files in the same directory don't change, but any cross-reference to files that stayed in inspector-v2 needs updating.

### 10. `update-inspector-imports` — Fix inspector-v2 imports
Update all imports within inspector-v2 that reference moved files:
- Change from relative paths (e.g. `./services/settingsStore`) to `shared-ui-components/modularTool/services/settingsStore`
- Update `inspector-v2/src/index.ts` to re-export from new locations — **every symbol currently exported must continue to be exported** to preserve the public API for extensions and the `@babylonjs/inspector-v2` bundle

### 11. `update-fluent-imports-repo-wide` — Fix all fluent import paths
Search and replace across the repo:
- `shared-ui-components/fluent/primitives/` → `shared-ui-components/modularTool/components/primitives/`
- `shared-ui-components/fluent/hoc/` → `shared-ui-components/modularTool/components/hoc/`
- `shared-ui-components/fluent/hooks/` → `shared-ui-components/modularTool/hooks/`
- `shared-ui-components/fluent/icons` → `shared-ui-components/modularTool/icons`

### 12. `update-viewer-configurator` — Update viewer-configurator
- Change imports from `inspector/...` to `shared-ui-components/modularTool/...`
- Remove `inspector` alias from `webpack.config.js`
- Remove `inspector` path mapping from `tsconfig.json`
- Remove `@dev/inspector` from `package.json` devDependencies (if no longer needed)

### 13. `update-shared-ui-package` — Update sharedUiComponents package
- Add any missing peer/dev dependencies
- Verify tsconfig includes the new directory

### 14. `verify-build` — Build and verify
- Build sharedUiComponents
- Build inspector-v2
- Build viewer-configurator
- Build any other affected tools
- Run tests

## Dependency Flow After Refactoring

```
┌───────────────────────────────────────┐
│        sharedUiComponents             │
│  ┌─────────────────────────────────┐  │
│  │     modularTool/                │  │
│  │  ┌─────────┐  ┌──────────────┐ │  │
│  │  │modularity│  │  services    │ │  │
│  │  │  hooks   │  │  components  │ │  │
│  │  │ contexts │  │  themes      │ │  │
│  │  │  misc    │  │extensibility │ │  │
│  │  │primitives│  │     hoc      │ │  │
│  │  └─────────┘  └──────────────┘ │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  (legacy non-fluent components) │  │
│  │  colorPicker, lines, tabs, etc. │  │
│  └─────────────────────────────────┘  │
└───────────────┬───────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
    ▼                       ▼
┌──────────┐     ┌───────────────────┐
│inspector │     │viewer-configurator│
│   v2     │     │  (and future NME, │
│          │     │   NGE, NPE, etc.) │
└──────────┘     └───────────────────┘
```

## Risk Mitigation

1. **Large diff** — The move is mechanical (file moves + import path updates) but affects many files. Use git-mv where possible to preserve history.
2. **Fluent import paths** — Many files reference `shared-ui-components/fluent/...`. A repo-wide search-and-replace handles this, but we should verify no imports are missed.
3. **Inspector extensions** — Extensions import from inspector-v2's public API. The re-exports in `inspector-v2/src/index.ts` ensure backward compatibility.
4. **Build order** — sharedUiComponents must build before inspector-v2. This is already the case in the dependency graph.
