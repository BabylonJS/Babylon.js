# Viewer Configurator — Port to Fluent UI Plan

## Problem Statement

The viewer-configurator currently uses:
- **Old shared-ui-components** (`LineContainerComponent`, `CheckBoxLineComponent`, `SliderLineComponent`, `OptionsLine`, `ButtonLineComponent`, `TextInputLineComponent`, `MessageLineComponent`, `Color4LineComponent`, `LockObject`)
- **FontAwesome icons** (`@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/free-regular-svg-icons`)
- **Raw SCSS/CSS** (`App.scss`, `configurator.scss`, `viewer.scss`, `scssDeclaration.d.ts`)
- **Ad-hoc React bootstrapping** (`createRoot` directly in `index.tsx`, no service framework)

It needs to be ported to:
- **Fluent shared components** from `shared-ui-components/fluent/` (`Accordion`, `AccordionSection`, property line HOCs like `SwitchPropertyLine`, `DropdownPropertyLine`, `SyncedSliderPropertyLine`, `Color4PropertyLine`, `TextInputPropertyLine`, `TextAreaPropertyLine`, `ButtonLine`)
- **`@fluentui/react-components`** for anything not covered by shared components (`makeStyles`, `tokens`, `Textarea`, `Button`, etc.)
- **`@fluentui/react-icons`** replacing all FontAwesome icons
- **`makeStyles` from Fluent** for all styling (zero raw CSS/SCSS)
- **`MakeModularTool` framework** from `shared-ui-components/modularTool/` for bootstrapping with a ServiceContainer, but with a **minimal set of services** and **no extensibility** (no extension feeds)
- **`IShellService`** from `shared-ui-components/modularTool/services/shellService` for the app shell (central content, side panes, toolbars).

Viewer Configurator takes a dependency on `@dev/shared-ui-components` (which already contains both the Fluent primitives and the ModularTool framework). No dependency on `@dev/inspector` is needed.

## Approach

Viewer Configurator will register a few services to populate the `IShellService` central content and side pane.

1. Use `MakeModularTool` for bootstrapping (theming, settings store).
2. Define the services for the central content and the side pane.
3. Replace all old shared-ui-components with the new Fluent components in shared-ui-components, and fall back to low level Fluent components from @fluentui/react-components when necessary.
4. Replace all FontAwesome icons with `@fluentui/react-icons`.
5. Replace all SCSS with `makeStyles`.
6. Remove FontAwesome and SCSS dependencies from `package.json`.

## Mapping — Old Components to Fluent Equivalents

| Old Component                          | Fluent Replacement                                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Side pane container div                | `Accordion` from `shared-ui-components/fluent/primitives/accordion`                                          |
| `LineContainerComponent`               | `AccordionSection` from `shared-ui-components/fluent/primitives/accordion`                                   |
| `CheckBoxLineComponent`                | `SwitchPropertyLine` from `shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine`                 |
| `SliderLineComponent`                  | `SyncedSliderPropertyLine` from `shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine`     |
| `OptionsLine`                          | `StringDropdownPropertyLine` from `shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine`       |
| `ButtonLineComponent`                  | `ButtonLine` from `shared-ui-components/fluent/hoc/buttonLine`                                               |
| `TextInputLineComponent` (single-line) | `TextInputPropertyLine` from `shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine`               |
| `TextInputLineComponent` (multiline)   | `TextAreaPropertyLine` from `shared-ui-components/fluent/hoc/propertyLines/textAreaPropertyLine`             |
| `MessageLineComponent`                 | `MessageBar` from `shared-ui-components/fluent/primitives/messageBar`                                        |
| `ExpandableMessageLineComponent`       | `MessageBar` from `shared-ui-components/fluent/primitives/messageBar`                                        |
| `Color4LineComponent`                  | `Color4PropertyLine` from `shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine`                  |
| `LockObject`                           | Not needed (Fluent property lines don't use it)                                                              |
| `FontAwesomeIconButton`                | `Button` from `shared-ui-components/fluent/primitives/button` with `icon` prop using `@fluentui/react-icons` |
| `FontAwesomeIcon`                      | Direct icon component from `@fluentui/react-icons`                                                           |
| `SplitContainer` / `Splitter`          | Not needed (this functionality is part of `IShellService`)                                                   |

## Icon Mapping (FontAwesome → Fluent)

| FontAwesome        | Fluent Icon                  |
| ------------------ | ---------------------------- |
| `faQuestionCircle` | `QuestionCircleRegular`      |
| `faBullseye`       | `TargetRegular`              |
| `faCamera`         | `CameraRegular`              |
| `faCheck`          | `CheckmarkRegular`           |
| `faCopy`           | `CopyRegular`                |
| `faGripVertical`   | `ReOrderDotsVerticalRegular` |
| `faRotateLeft`     | `ArrowResetRegular`          |
| `faSave`           | `SaveRegular`                |
| `faSquarePlus`     | `AddSquareRegular`           |
| `faTrashCan`       | `DeleteRegular`              |
| `faUpload`         | `ArrowUploadRegular`         |
| `faChevronDown`    | `ChevronDownRegular`         |
| `faChevronUp`      | `ChevronUpRegular`           |

## Service Architecture (Minimal)

The viewer-configurator will use `MakeModularTool` with these services only:

1. **SettingsStore** (built-in to `MakeModularTool`) — persists user preferences
2. **ThemeService** (built-in to `MakeModularTool`) — light/dark theme support
3. **ThemeSelectorService** (built-in, optional) — theme toggle in toolbar
4. **ShellService** (built-in to `MakeModularTool`) — provides the root layout container
5. **ViewerService** (new, custom) - a service that exposes the underlying Babylon `ViewerElement` and `ViewerOptions`, and calls `IShellService.addCentralContent` to populate the central content.
6. **ConfiguratorService** (new, custom) - a service that consumes the ViewerService to get the `ViewerElement` and `ViewerOptions`, and calls `IShellService.addSidePane` to add the right side pane and `IShellService.addToolbarItem` to add toolbar buttons.

No extension feeds should be passed to `MakeModularTool` to disable the extensions dialog.

## Entry Point Changes

**Before** (`index.tsx`):
```tsx
const Root = createRoot(document.getElementById("root"));
Root.render(<App />);
```

**After** (`index.tsx`):
```tsx
import { MakeModularTool } from "shared-ui-components/modularTool/modularTool";

MakeModularTool({
    namespace: "ViewerConfigurator",
    containerElement: document.getElementById("root")!,
    serviceDefinitions: [ViewerServiceDefinition, ConfiguratorServiceDefinition],
    toolbarMode: "compact",
    showThemeSelector: true,
    rightPaneDefaultWidth: 400,
    rightPaneMinWidth: 300,
});
```

## File-Level Changes

### Files to DELETE
- `src/App.tsx` — replaced by `MakeModularTool` shell + services
- `src/App.scss` — replaced by `makeStyles`
- `src/components/configurator/configurator.scss` — replaced by `makeStyles`
- `src/components/babylonViewer/viewer.scss` — replaced by `makeStyles`
- `src/scssDeclaration.d.ts` — no longer needed
- `src/components/misc/FontAwesomeIconButton.tsx` — replaced by Fluent `Button` with icon
- `src/components/misc/ExpandableMessageLineComponent.tsx` — replaced by `MessageBar`
- `src/hooks/observableHooks.ts` — replaced by shared-ui-components hooks

### Files to CREATE
- `src/viewerService.tsx` — service definition that populates the shell central content and exposes the underlying viewer.
- `src/configuratorService.tsx` — service definition that consumes the viewer service, populates the shell right pane, and adds toolbar items.
- `src/components/icons.ts` — custom Fluent icons (e.g. Babylon logo via `createFluentIcon`).

### Files to MODIFY
- `src/index.tsx` — switch from `createRoot` + `<App />` to `MakeModularTool(…)`
- `src/components/configurator/configurator.tsx` — major rewrite:
  - Replace all old shared-ui-component imports with Fluent equivalents
  - Replace all FontAwesome imports with `@fluentui/react-icons`
  - Replace class-name-based styling with `makeStyles`
  - Use `Accordion` to contain most of the right pane content, except the very top part with the snippet, which should be outside of the scrolling area and always visible.
  - Update `OptionsLine` → `StringDropdownPropertyLine` (different API)
  - Update `CheckBoxLineComponent` → `SwitchPropertyLine`
  - Update `SliderLineComponent` → `SyncedSliderPropertyLine`
  - Update `Color4LineComponent` → `Color4PropertyLine`
  - Update `ButtonLineComponent` → use `Button` primitive directly (not `ButtonLine`, to avoid nested border issues inside `PropertyLine`)
  - Update `TextInputLineComponent` → `TextInputPropertyLine` / `TextAreaPropertyLine`
  - Update `MessageLineComponent` → `MessageBar`
  - Replace `FontAwesomeIconButton` with Fluent `Button` with `icon` prop
  - Wrap sections in `Accordion` + `AccordionSection` instead of `LineContainerComponent`
  - Use `PropertyLine` for labeled rows, `LineContainer` for unlabeled rows
  - Wrap `ToolContext.Provider` with `size: "medium"` around the root content for consistent control sizing
  - Keep `@dnd-kit` for hotspot reordering (UI-framework-agnostic)
- `src/components/babylonViewer/viewer.tsx` — remove SCSS import, use `makeStyles`, use `class=` not `className=` for custom elements
- `package.json` — update dependencies (add Fluent, remove FontAwesome/SCSS tooling if safe)
- `webpack.config.js` — set `includeCSS: false` in `getRules`, update aliases
- `src/hooks/observableHooks.ts` — use the hooks from `shared-ui-components/modularTool/hooks/observableHooks`

### Files UNCHANGED
- `src/modelLoader.ts` — pure business logic

## Detailed Todos

### 1. `setup-dependencies` — Update package.json and install dependencies
Add `@fluentui/react-components`, `@fluentui/react-icons`. Remove FontAwesome direct deps. Update webpack config aliases if needed. The `MakeModularTool`, `IShellService`, `ShellServiceIdentity`, and service definition types are all available from `shared-ui-components/modularTool/`.

### 2. `export-inspector-v2` — *(No longer needed)*
All required symbols (`MakeModularTool`, `IShellService`, `ShellServiceIdentity`, `ServiceDefinition`, etc.) are now exported from `shared-ui-components/modularTool/`. No inspector-v2 dependency is needed.

### 3. `create-viewer-service` — Create ViewerService
Create `src/viewerService.ts`. This service:
- Consumes `IShellService` (via `ShellServiceIdentity`)
- Produces a `IViewerService` contract (exposes `ViewerElement`, `ViewerOptions`, `ViewerDetails`, `Viewer`)
- Calls `shellService.addCentralContent(...)` to populate the central content with the `<configured-babylon-viewer>` element (logic currently in `viewer.tsx`)
- Handles snippet loading from URL hash, engine selection from query params
- Handles drag-and-drop model loading onto the viewer element

### 4. `create-configurator-service` — Create ConfiguratorService
Create `src/configuratorService.ts`. This service:
- Consumes `IViewerService` (to get `ViewerElement`, `ViewerOptions`, etc.) and `IShellService`
- Calls `shellService.addSidePane(...)` to add the configurator as the right side pane
- The side pane component is the configurator UI (the rewritten `configurator.tsx`)

### 5. `rewrite-entry` — Rewrite index.tsx to use MakeModularTool
Replace `createRoot` + `<App />` with `MakeModularTool(…)`, passing `[ViewerServiceDefinition, ConfiguratorServiceDefinition]` as `serviceDefinitions`. Set `toolbarMode: "compact"`, `namespace: "ViewerConfigurator"`. No extension feeds.

### 6. `rewrite-configurator` — Rewrite configurator.tsx (largest task)
Subtasks:
- a. Replace all old shared-ui-component imports with Fluent equivalents
- b. Replace all FontAwesome imports with `@fluentui/react-icons`
- c. Convert all SCSS class-based styling to `makeStyles`
- d. Wrap the side pane in `Accordion` with `AccordionSection` children — **except** the snippet section at the top, which should be outside the scrolling area and always visible
- e. Update each UI control to the Fluent equivalent API:
  - `OptionsLine` → `StringDropdownPropertyLine`
  - `CheckBoxLineComponent` → `SwitchPropertyLine`
  - `SliderLineComponent` → `SyncedSliderPropertyLine`
  - `Color4LineComponent` → `Color4PropertyLine`
  - `ButtonLineComponent` → `ButtonLine`
  - `TextInputLineComponent` → `TextInputPropertyLine` / `TextAreaPropertyLine`
  - `MessageLineComponent` / `ExpandableMessageLineComponent` → `MessageBar`
- f. Replace `FontAwesomeIconButton` usages with Fluent `Button` with `icon` prop
- g. Keep `useConfiguration` hook, `@dnd-kit`, and all business logic unchanged

### 7. `rewrite-viewer-component` — Rewrite viewer.tsx
Remove SCSS import. Add `makeStyles` for the viewer element background pattern. This component becomes the central content rendered by `ViewerService`.

### 8. `switch-observable-hooks` — Switch to shared-ui-components observable hooks
Replace `src/hooks/observableHooks.ts` with imports from `shared-ui-components/modularTool/hooks/observableHooks`. Remove the local file if the shared hooks are a full replacement.

### 9. `delete-obsolete-files` — Clean up deleted files
Remove all files listed in the "Files to DELETE" section above.

### 10. `update-webpack` — Update webpack config
Remove `.scss` from resolve extensions. Remove SCSS-related webpack loaders/plugins if no longer needed. Verify build works.

### 11. `verify-build` — Build and verify
Run the build to verify everything compiles and renders correctly.

## Dependencies Between Todos

```
setup-dependencies
  ├─► create-viewer-service
  │     └─► create-configurator-service
  │           └─► rewrite-entry
  │                 └─► rewrite-configurator ──────────┐
  │                       └─► rewrite-viewer-component │
  │                                                    │
  └─► switch-observable-hooks ─────────────────────────┘
                                                       │
                                                       ▼
                                             delete-obsolete-files
                                                       │
                                                       ▼
                                                 update-webpack
                                                       │
                                                       ▼
                                                  verify-build
```

## Key Decisions

1. **IShellService for layout** — The shell service from `shared-ui-components/modularTool/` handles central content + side panes, replacing the old `SplitContainer`/`Splitter`.

2. **Toolbar** — Use `toolbarMode: "compact"` for a minimal toolbar. The theme selector can be part of the toolbar. The logo custom header (logo, title, docs link) moves into the side pane.

3. **Theme** — Enable theme support via `MakeModularTool` with `showThemeSelector: true` for a theme toggle in the compact toolbar.

4. **Accordion** — Use `Accordion` from shared Fluent components for the side pane's collapsible sections, with the snippet section **pinned above** the scrolling area.

5. **Property Line model** — Use the new `value + onChange` pattern directly, which aligns with `useConfiguration`.

6. **@dnd-kit** — Keep as-is (UI-framework-agnostic).

7. **MessageBar** — Use `MessageBar` for both informational messages and expandable messages, replacing both `MessageLineComponent` and `ExpandableMessageLineComponent`.

## Notes

- The `useConfiguration` hook is valuable custom logic — preserve it unchanged.
- The `observableHooks.ts` local hooks should be replaced with `shared-ui-components/modularTool/hooks/observableHooks`.
- The `modelLoader.ts` is purely business logic — no changes needed.
- The snippet generation logic (HTML/JSON) is pure string construction — no changes needed.
- `MakeModularTool` already provides `FluentProvider` and `Theme`, so no need for `FluentToolWrapper`.
- No dependency on `@dev/inspector` is needed — all framework symbols come from `@dev/shared-ui-components`.

## Lessons Learned / Gotchas

These are issues discovered during implementation that would apply to porting other tools:

1. **PropertyLine vs LineContainer** — Use `PropertyLine` (label required) for rows with a label. Use `LineContainer` (no label) for rows without. `PropertyLine`'s internal `childWrapper` has `overflow: hidden` and `whiteSpace: nowrap`, so multi-element children need a flex wrapper div.

2. **Use Button directly, not ButtonLine inside PropertyLine** — Nesting `ButtonLine` inside `PropertyLine` creates a `LineContainer` inside a `PropertyLine`, producing double borders. Use the `Button` primitive directly.

3. **TextInput width override** — `TextInput` has a hardcoded `width: 150px` from Fluent's `UniformWidthStyling`. To make it fill: wrap in a `div` with `flex: 1; minWidth: 0`, and pass `className` with `width: 100%` to `TextInput` (Griffel deduplication overrides the internal 150px).

4. **Textarea slot styling** — `className` on Fluent's `Textarea` applies to the outer wrapper, not the inner `<textarea>`. Use `textarea={{ className: ... }}` slot prop for inner styling (e.g. monospace font, no-wrap).

5. **Custom element `class=`** — React's `className` doesn't work on HTML custom elements (e.g. `<babylon-viewer>`). Use `class=` and add a JSX `IntrinsicElements` declaration.

6. **className forwarding** — Not all shared primitives forward `className`. `Button` and `Dropdown` do; `SyncedSliderInput` and `ColorPickerPopup` do not. Wrap non-forwarding primitives in a `<div>` when custom classes are needed.

7. **Button group spacing** — When multiple action buttons appear together, wrap them in a gapless flex row. The gap should be between the left content and the button group, not between individual buttons.

8. **Custom SVG icons** — Use `createFluentIcon` with `width="1em"` (viewBox defaults to `0 0 20 20`). For SVGs with different source viewBoxes, compute a transform to map content bounds into 20×20 space.

9. **MessageBar outside accordion** — `MessageBar` wraps in `AccordionSectionItem` which registers with a parent accordion context. When used outside an accordion, it renders as a passthrough (no-op). Dynamic message text is fine outside accordion since the stability warning only fires when an accordion context is present.

See also: `.github/instructions/porting-tools-to-fluent.instructions.md` for the general porting guide.