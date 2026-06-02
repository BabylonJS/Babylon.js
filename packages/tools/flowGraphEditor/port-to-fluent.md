# Flow Graph Editor — Port to Fluent UI / MakeModularTool

## Problem Statement

`packages/tools/flowGraphEditor/` is one of the last large node-graph editors still on the legacy stack:

- **Bootstrapping** — `FlowGraphEditor.Show()` calls `createRoot(hostElement).render(<GraphEditor />)`. `hostElement` is either a caller-supplied DOM element or a popup window created via `CreatePopup` (no Fluent setup, no Griffel renderer for the popup document, no theme).
- **Layout** — `graphEditor.tsx` hand-rolls a 3-column split with `SplitContainer` / `Splitter`:
    - **Left**: `NodeListComponent`
    - **Center top**: `GraphTabBarComponent` + `GraphControlsComponent` + `VariablesPanelComponent` + `GraphCanvasComponent`
    - **Center bottom**: `LogComponent`
    - **Right top**: `PropertyTabComponent`
    - **Right bottom**: `ScenePreviewComponent`
- **Components** — 14 component folders, each with its own `.scss`. Together: `propertyTab.scss` 23 KB, `scenePreview.scss` 4 KB, `graphControls.scss` 7.7 KB, `nodeList.scss` 5 KB, `variables.scss` 7 KB, `graphTabBar.scss` 2.9 KB, `helpDialog.scss` 3 KB, `howToUse.scss` 2.8 KB, `contextMenu.scss` 1.2 KB, `log.scss` 0.6 KB, `toast.scss` 1.4 KB, `main.scss` 2.4 KB, plus two `*.module.scss` files in `graphSystem/`.
- **Local legacy line components** in `src/sharedComponents/` (`autoCompleteInputComponent`, `checkBoxLineComponent`, `draggableLineComponent`, `fileButtonLineComponent`, `lineContainerComponent`).
- **Property panels** — 11 `*.tsx` files in `src/graphSystem/properties/` consume legacy `shared-ui-components/lines/*` (`TextInputLineComponent`, `OptionsLine`, `FloatLineComponent`, `Vector{2,3,4}LineComponent`, `Color{3,4}LineComponent`, `MatrixLineComponent`, `SliderLineComponent`, `ButtonLineComponent`, `LineContainerComponent`, `TextLineComponent`).
- **No FontAwesome** — icons are inline SVGs scattered across components (e.g. `nodeList`, `graphControls`).

`GraphCanvasComponent` itself lives in `shared-ui-components/nodeGraphSystem/` and is consumed as-is by every node-graph editor; it is **out of scope** for this port. We only port the surrounding shell, side panes, dialogs, and property panels.

## Approach

Single coherent change set, executed in 5 ordered phases. Reference: `packages/tools/viewer-configurator/`. The plan keeps the user-facing UX of today (same overall layout, same controls inside `GraphControls`/`Variables`); only the underlying primitives, theming and bootstrap change.

### Layout mapping

The overall app layout stays the same as today. We move it onto `IShellService` like so:

| Today's slot | Shell mapping |
|---|---|
| Root `SplitContainer` | `IShellService` (provided by `MakeModularTool`) |
| `NodeListComponent` (left) | `shellService.addSidePane({ horizontalLocation: "left", verticalLocation: "top", title: "Nodes" })` — implemented as an **`ExtensibleAccordion`** so future tools/extensions can register categories. |
| `GraphTabBarComponent` + `GraphControlsComponent` + `VariablesPanelComponent` + `GraphCanvasComponent` + **`LogComponent` at the bottom** | `shellService.addCentralContent(...)` rendering one `<GraphEditorCentral>` component. The Log stays inside the central column (vertical stack), preserving today's UX. |
| `PropertyTabComponent` (right) | `shellService.addSidePane({ horizontalLocation: "right", verticalLocation: "top", title: "Flow Graph Editor", icon: BabylonLogo })` — the shell renders the title + icon at the pane header (mirrors `viewer-configurator/configuratorService.tsx`). Implemented as an **`ExtensibleAccordion`**. |
| `ScenePreviewComponent` (right-bottom) | `shellService.addSidePane({ horizontalLocation: "right", verticalLocation: "bottom", title: "Scene Preview" })` |
| Help button + How-to-use button (currently in `GraphControlsComponent`) | `shellService.addToolbarItem({ horizontalLocation: "right", verticalLocation: "bottom" })` — moved into the bottom-right toolbar slot. |
| Reset button + Start/Pause/Stop + Speed presets + breakpoint controls + variables button | **Stay in `GraphControlsComponent`** in the central column. Just rewritten in Fluent. |
| `MessageDialog`, `HelpDialogComponent`, `HowToUseDialogComponent`, `ContextMenuComponent` | Overlays inside the central content (or Fluent `Dialog`). |
| `ToastContainerComponent` | **Deleted.** Use `IToastService` exposed by `MakeModularTool`'s built-in `ToastProvider`. |
| `main.scss` + per-component `.scss` + two `.module.scss` | `makeStyles` from `@fluentui/react-components`. |

The central content layout becomes a vertical flex container: `GraphTabBar` → `GraphControls` → `VariablesPanel` (collapsible, as today) → `GraphCanvas` → `Log` (collapsible / resizable, as today).

### `Show()` popup hosting — solve at the framework level

The user-facing `FlowGraphEditor.Show()` API stays unchanged. Internally it creates a host element either via `CreatePopup` (popup window) or uses the caller-supplied one, then calls `MakeModularTool({ containerElement: host, ... })`.

Today, `MakeModularTool` doesn't render Fluent styles into the popup's document, so a popup-hosted tool would see unstyled content. Fix at the framework level so any future tool with the same pattern works automatically:

- `MakeModularTool` derives `const targetDocument = containerElement.ownerDocument` (defaults to the main `document` when the host is in the main window — no behaviour change there).
- When `targetDocument !== document` (i.e. popup), wrap the tool tree with:
    - `RendererProvider` using `createDOMRenderer(targetDocument)`
    - `Theme` (`FluentProvider`) configured with `targetDocument={targetDocument}`
    - The existing `ToastProvider` (the `Toaster` inside it already calls `useFluent()` to inherit `targetDocument`).
- Factor a small helper out of `shared-ui-components/fluent/hoc/childWindow.tsx` (the renderer-creation + provider-wrapping logic) so both `ChildWindow` and `MakeModularTool` use the same code path. Suggested name: `withCrossWindowFluentProviders(targetDocument, children)` or a small `<FluentDocumentRoot targetDocument>` component.

When `targetDocument === document`, no extra wrappers are added (skip `RendererProvider`); `FluentProvider` keeps its current default behaviour.

This is a tightly-scoped change in `shared-ui-components/modularTool/modularTool.tsx` + a small helper in `shared-ui-components/fluent/hoc/`.

### Service decomposition

Define services in `src/services/`:

- `globalStateService.ts` — produces the existing `GlobalState`. Exposed via a **factory function** `MakeGlobalStateService(options): ServiceDefinition` so `Show()` can pass `options.flowGraph`, `options.hostScene`, `options.customSave`, `options.customLoadObservable`, and the host `Document`/`Window` straight into the service definition. This pattern matches what's used elsewhere in the repo. The service factory builds the `GlobalState`, wires the existing observables, and exposes the state through an `IGlobalStateService` contract.
- `nodeListService.tsx` — left side pane. Renders `NodeListComponent` inside an `ExtensibleAccordion`.
- `propertyTabService.tsx` — right-top side pane. Renders `PropertyTabComponent` inside an `ExtensibleAccordion`. The pane is registered with `title: "Flow Graph Editor"` + `icon: BabylonLogo` so the tool name/logo render in the pane header (same pattern as viewer-configurator).
- `scenePreviewService.tsx` — right-bottom side pane (`ScenePreviewComponent`).
- `centralGraphService.tsx` — central content: tab bar + controls + variables + `GraphCanvasComponent` + log + dialogs/overlays. Owns global keyboard handling, drag-drop, and the history stack (or delegates to a small `editorActionsService` if it gets too big).
- `toolbarService.tsx` — adds Help (bottom-right) and How-to-use (bottom-right) buttons via `shellService.addToolbarItem`. Theme selector is provided automatically by `showThemeSelector: true` in `MakeModularTool`.

All services consume `ShellServiceIdentity`, `GlobalStateServiceIdentity`, and (for actions that surface notifications) `ToastServiceIdentity`.

The toast container is **not** something we need to add — `MakeModularTool` already wraps the tool in `ToastProvider` and exposes `IToastService`. Replace `ShowToast(...)` call sites with `toastService.showToast(...)`.

### Component-level work

For each component:

1. Rewrite as functional component, using `useObservableState` from `shared-ui-components/modularTool/hooks/observableHooks` for any `globalState.on*Observable` subscriptions.
2. Replace SCSS with `makeStyles` (delete the `.scss`).
3. Replace local `sharedComponents/*` with the appropriate Fluent primitive.
4. Replace inline SVG icons with **Fluent icons first**; only fall back to `createFluentIcon` for genuinely Babylon-specific glyphs (e.g. the Babylon logo, signal/data port markers if no Fluent equivalent fits).

Property panels (`src/graphSystem/properties/*.tsx`):

| Legacy line | Fluent replacement |
|---|---|
| `TextInputLineComponent` | `TextInputPropertyLine` |
| `OptionsLine` | `StringDropdownPropertyLine` |
| `FloatLineComponent` | `NumberInputPropertyLine` (or `SyncedSliderPropertyLine` when min/max are known) |
| `SliderLineComponent` | `SyncedSliderPropertyLine` |
| `Vector2LineComponent` / `Vector3LineComponent` / `Vector4LineComponent` | `Vector2PropertyLine` / `Vector3PropertyLine` / `Vector4PropertyLine` |
| `Color3LineComponent` / `Color4LineComponent` | `Color3PropertyLine` / `Color4PropertyLine` |
| `MatrixLineComponent` | `MatrixPropertyLine` (verify it exists; if not, build one ad-hoc) |
| `ButtonLineComponent` | `Button` primitive (do **not** nest `ButtonLine` inside `PropertyLine`) |
| `LineContainerComponent` | `AccordionSection` inside an `Accordion` |
| `TextLineComponent` | `PropertyLine` with `<Body1>` child or `LineContainer` with text |

### Local `sharedComponents/*` mapping

| Local component | Fluent replacement |
|---|---|
| `CheckBoxLineComponent` | `SwitchPropertyLine` |
| `LineContainerComponent` | `Accordion` + `AccordionSection` |
| `FileButtonLineComponent` | **`FileUploadLine`** from `shared-ui-components/fluent/hoc/fileUploadLine`. The shapes match (`label` + `accept` + `onClick(files)`). The local component currently calls `onClick(files[0])` whereas `FileUploadLine` exposes the full `FileList`; adapt the two existing call sites in `propertyTabComponent.tsx` to read `files[0]`. |
| `AutoCompleteInputComponent` | Fluent **`Combobox`** from `@fluentui/react-components` (free-text + dropdown suggestions). Used by `genericNodePropertyComponent` and `setVariablePropertyComponent` — preserve their current "type to filter, click to pick" UX. |
| `DraggableLineComponent` | Keep as a small **local component** (it's trivial — a `<div draggable>` with `makeStyles` + a left-border accent strip). No need to take a `dnd-kit` dependency for this. |

### Files to DELETE after port

- `src/main.scss`
- `src/sharedComponents/*` (entire directory: `autoComplete.scss`, `autoCompleteInputComponent.tsx`, `checkBoxLineComponent.tsx`, `fileButtonLineComponent.tsx`, `lineContainerComponent.tsx`)
- All `*.scss` under `src/components/**` and `src/graphSystem/**/*.module.scss`
- `src/portal.tsx` (if dialogs no longer need it — Fluent `Dialog` portals to `document.body` itself)
- `src/custom.d.ts` (if it only declared SCSS modules — verify before removing)
- `src/imgs/downArrow.svg` (used only by local `lineContainerComponent`)
- `src/components/toast/` (directory) — replaced by `IToastService`

### Files to CREATE

- `src/services/globalStateService.ts` — exports `MakeGlobalStateService(options)` factory + `IGlobalStateService` contract + `GlobalStateServiceIdentity`.
- `src/services/nodeListService.tsx`
- `src/services/propertyTabService.tsx`
- `src/services/scenePreviewService.tsx`
- `src/services/centralGraphService.tsx`
- `src/services/toolbarService.tsx`
- `src/icons.ts` — `createFluentIcon` wrappers for any custom SVGs that survive (Babylon logo + any port-design glyphs that don't have a Fluent equivalent).
- `src/components/draggableLine.tsx` — small local Fluent-styled replacement for `DraggableLineComponent`.

### Files to MODIFY

- `src/flowGraphEditor.ts` — replace `createRoot(...).render(<GraphEditor />)` with `MakeModularTool({ namespace: "FlowGraphEditor", containerElement, serviceDefinitions: [MakeGlobalStateService(options), CentralGraphServiceDefinition, NodeListServiceDefinition, PropertyTabServiceDefinition, ScenePreviewServiceDefinition, ToolbarServiceDefinition], toolbarMode: "compact", showThemeSelector: true })`. Popup hosting works automatically once `MakeModularTool` derives `targetDocument` from `containerElement.ownerDocument` (framework change).
- `src/graphEditor.tsx` — gutted: most of it dissolves into services. The class-component shape becomes hooks + service factories. Keyboard handler, drag-drop, history stack, smart-group/sticky-note/breakpoint actions migrate to `centralGraphService.tsx`.
- `src/components/**` — each rewritten in Fluent + `makeStyles`.
- `src/graphSystem/properties/*.tsx` — rewritten to use Fluent property lines.
- `src/graphSystem/display/debugDisplayManager.ts` — replace `.module.scss` import with `makeStyles` (or inline class strings).
- `src/graphSystem/blockNodeData.ts` — same treatment for `.module.scss`.
- `package.json` — add `@fluentui/react-components` and `@fluentui/react-icons`; remove `sass-loader`, `style-loader`, `mini-css-extract-plugin`, `css-loader`, `webpack`, `webpack-cli`, `webpack-merge`, `html-webpack-plugin`, `copy-webpack-plugin`, `@svgr/webpack`, `split.js` (verify each is unused before removing).
- `tsconfig.json` — confirm `shared-ui-components/*` path alias is present.
- `vite.config.ts` — no change expected; `cdnExternals` already wires `core` → `BABYLON`.

Plus framework changes (out-of-package, but in scope for this work):

- `packages/dev/sharedUiComponents/src/modularTool/modularTool.tsx` — derive `targetDocument` from `containerElement.ownerDocument`; conditionally wrap in `RendererProvider` + pass `targetDocument` through to `Theme/FluentProvider` when `targetDocument !== document`.
- `packages/dev/sharedUiComponents/src/fluent/hoc/childWindow.tsx` — extract the renderer/provider-wrapping logic into a small reusable helper that both `ChildWindow` and `MakeModularTool` import.

### Files UNCHANGED

- `src/legacy/legacy.ts`
- `src/main.ts`, `src/index.ts`, `src/index.html`, `src/public/`, `src/test/`
- `src/serializationTools.ts`, `src/variableUtils.ts`, `src/sceneContext.ts`, `src/blockTools.ts`, `src/allBlockNames.ts`, `src/compositeTemplates.ts`
- `src/graphSystem/registerToDisplayLedger.ts`, `registerToPropertyLedger.ts`, `registerToTypeLedger.ts`, `registerDebugSupport.ts`, `registerDefaultInput.ts`, `registerElbowSupport.ts`, `registerExportData.ts`, `registerNodePortDesign.ts`, `connectionPointPortData.ts`, `blockTypeColors.ts`, `blockDisplayUtils.ts`, `smartGroup.ts`

### Verification

After each phase:

1. `npm run lint:check` (root) — ratchets must not regress.
2. `npm run format:check` (root).
3. `npm run build -w @tools/flow-graph-editor`.
4. `npm run serve -w @tools/flow-graph-editor` and exercise the editor at `http://localhost:1347` — verify all panels render in light AND dark themes.
5. `npm run test:e2e -w @tools/flow-graph-editor` — Playwright smoke tests must still pass.

## Phased Execution

The phases are ordered for buildability — `npm run build -w @tools/flow-graph-editor` should succeed at the end of each phase.

### Phase 1 — Bootstrap & Shell

1. Add `@fluentui/react-components` + `@fluentui/react-icons` to `package.json`; install.
2. Framework change: extend `MakeModularTool` to derive `targetDocument` from `containerElement.ownerDocument` and wire cross-window Fluent providers. Factor a small helper out of `ChildWindow.tsx`.
3. Create `src/services/globalStateService.ts` with `MakeGlobalStateService(options)` factory. The factory builds and owns a `GlobalState`; the service exposes the state and observables through `IGlobalStateService`.
4. Create `src/services/centralGraphService.tsx` that registers central content rendering the **existing** `<GraphEditor>` class component as-is (still wired to the same `GlobalState`).
5. Rewrite `src/flowGraphEditor.ts` to call `MakeModularTool` with `[MakeGlobalStateService(options), CentralGraphServiceDefinition]`. Popup hosting now works through the framework. Verify the editor still loads end-to-end (functionally identical to today).

### Phase 2 — Decompose layout into services

1. Create `nodeListService.tsx`, `propertyTabService.tsx`, `scenePreviewService.tsx` that each register a side pane wrapping the existing legacy component (no rewrite yet). The right-top pane registration uses `title: "Flow Graph Editor"` + `icon: BabylonLogo` (icon stub in `src/icons.ts`).
2. Trim the central content: `centralGraphService.tsx` renders only `GraphTabBar` + `GraphControls` + `VariablesPanel` + `GraphCanvasComponent` + `LogComponent` at the bottom + dialogs/overlays. NodeList, PropertyTab, ScenePreview move into their respective side panes.
3. Move global keyboard handling, drag-drop, history stack, and helper methods from `graphEditor.tsx` into `centralGraphService.tsx` (or a small `editorActionsService` if it gets too big). Delete `SplitContainer`/`Splitter` usage from `graphEditor.tsx`.
4. Verify layout parity (panes resizable, persisted widths sensible, log + variables panels still collapse/expand as today).

### Phase 3 — Port surrounding components to Fluent

For each of `GraphTabBarComponent`, `GraphControlsComponent` (preserving current UX — Reset, Start/Pause/Stop, speed presets, breakpoint controls all stay), `VariablesPanelComponent` (preserving current UX), `LogComponent`, `NodeListComponent` (rebuilt around `ExtensibleAccordion`), `PropertyTabComponent` (rebuilt around `ExtensibleAccordion`), `ScenePreviewComponent`, `ContextMenuComponent`, `HelpDialogComponent`, `HowToUseDialogComponent`:

1. Rewrite as functional component (where applicable).
2. Replace local `sharedComponents/*` and any inline DOM with Fluent primitives (`TextInput`, `Switch`, `Dropdown`, `Combobox`, `MessageBar`, `Accordion`, `Button`, `Dialog`, `Toolbar`).
3. Convert SCSS → `makeStyles`. Delete the `.scss` file once the component's last consumer no longer references it.
4. Replace inline SVG icons with Fluent icons first; only use `createFluentIcon` for Babylon-specific glyphs.
5. Use `useObservableState` for any `globalState.on*Observable` subscriptions.

For toast: delete `src/components/toast/`, replace `ShowToast(...)` call sites with `toastService.showToast(...)` consumed via `IToastService`.

For Help and How-to-use buttons: remove from `GraphControls`, register via `toolbarService.tsx` at `horizontalLocation: "right"`, `verticalLocation: "bottom"`. The dialogs themselves stay; toolbar buttons just toggle them.

For `ExtensibleAccordion` consumers (NodeList, PropertyTab): wire each existing section as an `addSection`/`addSectionContent` call so the editor gets the filtering/pinning UX for free.

### Phase 4 — Port property panels

For each `src/graphSystem/properties/*.tsx`:

1. Replace `shared-ui-components/lines/*` imports with Fluent property lines (mapping table above).
2. Replace `LineContainerComponent` with `AccordionSection` inside an `Accordion` (or just stack sections directly inside the `ExtensibleAccordion` that hosts the panel — verify what fits the pinning UX best).
3. Convert any local SCSS / className strings to `makeStyles`.
4. Verify each block still renders its panel correctly when selected. Special focus: `genericNodePropertyComponent.tsx` (34 KB) and the dynamic-port mutators `dataSwitchPropertyComponent`, `customEventPropertyComponent`, `setVariablePropertyComponent`, `switchBlockPropertyComponent`.
5. Migrate `genericNodePropertyComponent`'s `_EDITABLE_TYPE_NAMES` rendering (Vector2/3/4, Color3/4, Matrix) to the corresponding Fluent property lines.
6. Replace `AutoCompleteInputComponent` usages with Fluent `Combobox` (used by `genericNodePropertyComponent` for variable-name input and by `setVariablePropertyComponent`).

### Phase 5 — Cleanup

1. Delete `src/sharedComponents/` entirely.
2. Delete every remaining `.scss` and `.module.scss` file (and `src/main.scss`); delete `src/imgs/downArrow.svg` if unused.
3. Delete `src/portal.tsx` if dialogs no longer need it.
4. Delete `src/custom.d.ts` if it only declared SCSS modules.
5. Delete `src/components/toast/`.
6. Remove obsolete devDependencies from `package.json` (`sass-loader`, `style-loader`, `mini-css-extract-plugin`, `css-loader`, `webpack*`, `html-webpack-plugin`, `copy-webpack-plugin`, `@svgr/webpack`, `split.js`). Keep anything still referenced by `vite.config.ts` or test harnesses (verify).
7. Run `npm run format:check`, `npm run lint:check`, `npm run build -w @tools/flow-graph-editor`, `npm run test:e2e -w @tools/flow-graph-editor`.
8. Manually exercise: light/dark themes, popup hosting, all 11 property panels, drag-drop of `.glb` onto editor, snippet save/load, undo/redo, Ctrl+F search, sticky notes, breakpoints, all toolbar actions.

## Notes / Risks

- `globalState.ts` (67 KB) and `graphEditor.tsx` (59 KB) are large but mostly observable wiring + event handlers; neither is Fluent-coupled. Decomposition into services will mostly be a relocation exercise.
- `GraphCanvasComponent` (in `shared-ui-components/nodeGraphSystem/`) is shared across all node-graph editors and is **out of scope**.
- The framework-level `targetDocument` plumbing in `MakeModularTool` is small but cross-cutting — every other tool that uses `MakeModularTool` benefits but must also be sanity-checked once for regressions.
- Property line HOCs (`MatrixPropertyLine`, `Vector4PropertyLine`, etc.) — verify they all exist in `shared-ui-components/fluent/hoc/propertyLines/` before relying on them; if any are missing, build a small ad-hoc replacement rather than blocking this port.
- The two `*.module.scss` files (`debugDisplayManager.module.scss`, `blockNodeData.module.scss`) feed CSS-Module class names into the `GraphCanvasComponent` DOM. `makeStyles` produces stable class strings that work the same way; convert in place.
- `ExtensibleAccordion` brings filtering and pinning for free, but the `NodeListComponent` today has bespoke search + collapse-by-category UX. Verify the `ExtensibleAccordion`'s built-in filter is functionally equivalent (it is — it's the same UX inspector-v2 uses), or fall back to a plain `Accordion` if a behaviour gap shows up during Phase 3.
