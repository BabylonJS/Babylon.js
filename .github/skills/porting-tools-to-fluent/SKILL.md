---
name: porting-tools-to-fluent
description: "Guide for porting Babylon.js tools from legacy shared-ui-components to Fluent UI using MakeModularTool. Use when: port to fluent, migrate to fluent, fluent migration, porting tool UI."
---

# Porting Babylon.js Tools to Fluent UI

Guide for porting Babylon.js tools (NME, NGE, NPE, NRGE, Playground, etc.) from the legacy shared-ui-components to Fluent UI using the `MakeModularTool` framework from `shared-ui-components/modularTool/`.

**Reference implementation:** `packages/tools/viewer-configurator/` (fully ported).

---

## Overview

A Fluent port replaces four layers:

1. **Bootstrapping** — from ad-hoc `createRoot` + `<App />` to `MakeModularTool` (provides theming, settings, shell layout)
2. **Layout** — from hand-rolled split containers / panes to `IShellService` (central content, side panes, toolbars)
3. **Components** — from legacy shared-ui-components to `shared-ui-components/fluent/` primitives and HOCs
4. **Styling** — from raw SCSS/CSS to `makeStyles` from `@fluentui/react-components`
5. **Icons** — from FontAwesome to `@fluentui/react-icons`

---

## 1. Dependencies

### Add

```jsonc
// package.json devDependencies
"@fluentui/react-components": "^9.x", // for makeStyles, tokens, low-level Fluent components
"@fluentui/react-icons": "^2.x"       // for all icons
```

Note: `@dev/shared-ui-components` should already be a dependency. It contains both the Fluent primitives (`fluent/`) and the ModularTool framework (`modularTool/`). No dependency on `@dev/inspector` is needed.

### Remove

```jsonc
"@fortawesome/fontawesome-svg-core": "...",
"@fortawesome/free-solid-svg-icons": "...",
"@fortawesome/free-regular-svg-icons": "...",
"@fortawesome/react-fontawesome": "...",
"sass": "...",
"sass-loader": "..."   // if no other SCSS remains
```

### Webpack config

Ensure the `shared-ui-components` alias is present and disable CSS loaders:

```js
resolve: {
    extensions: [".js", ".ts", ".tsx"],
    alias: {
        core: path.resolve("../../dev/core/dist"),
        "shared-ui-components": path.resolve("../../dev/sharedUiComponents/src"),
        // ... other aliases as needed
    },
},
module: {
    rules: webpackTools.getRules({
        includeAssets: true,
        includeCSS: false,    // no more SCSS
        sideEffects: true,
        tsOptions: { transpileOnly: true, compilerOptions: { declaration: false } },
    }),
},
```

### tsconfig.json

Ensure the `shared-ui-components` path mapping is present (no `inspector` mapping needed):

```jsonc
"paths": {
    "shared-ui-components/*": ["../../dev/sharedUiComponents/src/*"]
}
```

---

## 2. Bootstrapping with MakeModularTool

Replace the old entry point:

```tsx
// BEFORE
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// AFTER
import { MakeModularTool } from "shared-ui-components/modularTool/modularTool";
MakeModularTool({
    namespace: "MyToolName",
    containerElement: document.getElementById("root")!,
    serviceDefinitions: [/* your service definitions */],
    toolbarMode: "compact",      // "compact" for minimal toolbar, "full" for full toolbar
    showThemeSelector: true,     // adds theme toggle to toolbar
    // Do NOT pass extensionFeeds to disable the extensions dialog
});
```

`MakeModularTool` automatically provides:
- `FluentProvider` + theme (light/dark)
- `SettingsStore` (persisted user preferences)
- `ThemeService` + optional `ThemeSelectorService`
- `ShellService` (layout: central content, side panes, toolbars)
- `ToastProvider` for toast notifications

---

## 3. Service Architecture

Each tool should define its own services that populate the shell. A service is a `ServiceDefinition<Produces, Consumes>` with:
- `friendlyName` — human-readable name for debugging
- `produces` — array of service identity symbols this service provides
- `consumes` — array of service identity symbols this service depends on
- `factory(…consumedServices)` — returns an object satisfying the produced contracts + optional `IDisposable`

### Defining a service identity and contract

```tsx
export const MyServiceIdentity = Symbol("MyService");

export interface IMyService extends IService<typeof MyServiceIdentity> {
    readonly someData: SomeType | undefined;
    readonly onStateChanged: IReadonlyObservable<void>;
}
```

### Service factory pattern

```tsx
export const MyServiceDefinition: ServiceDefinition<[IMyService], [IShellService]> = {
    friendlyName: "My Service",
    produces: [MyServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const onStateChanged = new Observable<void>();
        let someData: SomeType | undefined;

        // Register shell content
        const registration = shellService.addCentralContent({
            key: "MyContent",
            component: () => <MyComponent />,
        });

        return {
            get someData() { return someData; },
            onStateChanged,
            dispose: () => {
                onStateChanged.clear();
                registration.dispose();
            },
        } satisfies IMyService & IDisposable;
    },
};
```

### Shell service APIs

- `shellService.addCentralContent({ key, component })` — main content area
- `shellService.addSidePane({ key, title, icon, horizontalLocation, verticalLocation, teachingMoment, content })` — side pane
- `shellService.addToolbarItem({ key, horizontalLocation, verticalLocation, teachingMoment, component })` — toolbar button

All return `IDisposable` — clean up in your service's `dispose()`.

### Reactive state with useObservableState

Use the `useObservableState` hook from `shared-ui-components/modularTool/` to subscribe to service state in React components:

```tsx
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

const myData = useObservableState(
    () => myService.someData,    // getter
    myService.onStateChanged     // observable to subscribe to
);
```

---

## 4. Component Mapping

### Legacy → Fluent shared component mapping

| Legacy Component | Fluent Replacement | Import Path |
|---|---|---|
| `LineContainerComponent` | `AccordionSection` | `shared-ui-components/fluent/primitives/accordion` |
| Side pane container | `Accordion` (or `ExtensibleAccordion`) | `shared-ui-components/fluent/primitives/accordion` |
| `CheckBoxLineComponent` | `Switch` (primitive) or `SwitchPropertyLine` (with label) | `shared-ui-components/fluent/primitives/switch` or `.../hoc/propertyLines/switchPropertyLine` |
| `SliderLineComponent` | `SyncedSliderInput` (primitive) or `SyncedSliderPropertyLine` (with label) | `shared-ui-components/fluent/primitives/syncedSlider` or `.../hoc/propertyLines/syncedSliderPropertyLine` |
| `OptionsLine` | `Dropdown` (primitive) or `StringDropdownPropertyLine` (with label) | `shared-ui-components/fluent/primitives/dropdown` or `.../hoc/propertyLines/dropdownPropertyLine` |
| `ButtonLineComponent` | `Button` (primitive) | `shared-ui-components/fluent/primitives/button` |
| `TextInputLineComponent` (single-line) | `TextInput` (primitive) or `TextInputPropertyLine` (with label) | `shared-ui-components/fluent/primitives/textInput` or `.../hoc/propertyLines/inputPropertyLine` |
| `TextInputLineComponent` (multiline) | Fluent `Textarea` + slot props | `@fluentui/react-components` |
| `MessageLineComponent` | `MessageBar` | `shared-ui-components/fluent/primitives/messageBar` |
| `Color4LineComponent` | `ColorPickerPopup` (primitive) or `Color4PropertyLine` (with label) | `shared-ui-components/fluent/primitives/colorPicker` or `.../hoc/propertyLines/colorPropertyLine` |
| `LockObject` | Not needed (Fluent property lines don't use it) | — |
| `FontAwesomeIconButton` | `Button` with `icon` prop | `shared-ui-components/fluent/primitives/button` |
| `SplitContainer` / `Splitter` | Shell service layout (side panes) | Handled by `MakeModularTool` |

### When to use PropertyLine vs primitives

- **`PropertyLine`** — Use when a row has a label. Renders `InfoLabel` + child content in a standardized layout with hover border. Import from `shared-ui-components/fluent/hoc/propertyLines/propertyLine`.
- **`LineContainer`** — Use for rows without a label. Simple wrapper with hover border. Same import path.
- **Primitives directly** — Use when you need custom layout, e.g. button groups or compound rows.

### Composing controls within PropertyLine

`PropertyLine` constrains its children via an internal `childWrapper` div with `overflow: hidden` and `whiteSpace: nowrap`. For multi-element children, wrap them in a flex container:

```tsx
const useStyles = makeStyles({
    propertyContent: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        width: "100%",
    },
    fillControl: { flex: 1, minWidth: 0 },
    buttonGroup: { display: "flex", flexDirection: "row", alignItems: "center" },
});

// Example: TextInput + action buttons
<PropertyLine label="Model URL">
    <div className={classes.propertyContent}>
        <div className={classes.fillControl}>
            <TextInput value={url} onChange={setUrl} className={classes.fullWidth} />
        </div>
        <div className={classes.buttonGroup}>
            <Button icon={ArrowUploadRegular} onClick={onUpload} />
            <Button icon={ArrowResetRegular} onClick={onReset} />
        </div>
    </div>
</PropertyLine>
```

---

## 5. Icons

Replace all FontAwesome icons with `@fluentui/react-icons`. For general icon conventions (unsized variants, `fontSize` sizing), see [fluent.instructions.md](fluent.instructions.md).

Common FontAwesome → Fluent mappings:

| FontAwesome | Fluent Icon |
|---|---|
| `faQuestionCircle` | `QuestionCircleRegular` |
| `faBullseye` | `TargetRegular` |
| `faCamera` | `CameraRegular` |
| `faCheck` | `CheckmarkRegular` |
| `faCopy` | `CopyRegular` |
| `faGripVertical` | `ReOrderDotsVerticalRegular` |
| `faRotateLeft` | `ArrowResetRegular` |
| `faSave` | `SaveRegular` |
| `faSquarePlus` | `AddSquareRegular` |
| `faTrashCan` | `DeleteRegular` |
| `faUpload` | `ArrowUploadRegular` |
| `faChevronDown` | `ChevronDownRegular` |
| `faChevronUp` | `ChevronUpRegular` |
| `faGear` / `faCog` | `SettingsRegular` |
| `faEye` | `EyeRegular` |
| `faEyeSlash` | `EyeOffRegular` |
| `faPlus` | `AddRegular` |
| `faMinus` | `SubtractRegular` |
| `faPencil` / `faEdit` | `EditRegular` |
| `faClose` / `faTimes` | `DismissRegular` |
| `faSearch` | `SearchRegular` |
| `faLink` | `LinkRegular` |

### Custom SVG icons

Use `createFluentIcon` for custom icons (e.g. Babylon logo):

```tsx
import { createFluentIcon } from "@fluentui/react-icons";

export const MyIcon = createFluentIcon(
    "MyIcon",
    "1em",  // width — "1em" sizes with font-size
    // Single string for complex SVG (supports fill colors):
    '<g transform="...">' +
        '<path fill="#e0684b" d="..."/>' +
    '</g>'
);
```

The default viewBox is `0 0 20 20`. If your SVG source has a different viewBox, compute a transform to map the content bounds into 20×20 space:

1. Find the actual content bounding box (min/max of all coordinates)
2. Compute scale: `min(20 / contentWidth, 20 / contentHeight)`
3. Center: `translate((20 - scaledWidth) / 2, (20 - scaledHeight) / 2)`
4. Apply: `translate(centerX, centerY) scale(s) translate(-minX, -minY)`

---

## 6. Styling Migration (SCSS → makeStyles)

For general `makeStyles`, spacing tokens, and inline style rules, see [fluent.instructions.md](fluent.instructions.md). This section covers migration-specific steps.

### Rules

- **Zero raw CSS/SCSS** after the port. Delete all `.scss` files and `scssDeclaration.d.ts`.
- Only use inline `style={}` for truly dynamic values (e.g. drag-and-drop transforms).

### Example

```tsx
import { makeStyles, tokens } from "@fluentui/react-components";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
    },
    header: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
});

const MyComponent = () => {
    const classes = useStyles();
    return <div className={classes.root}>...</div>;
};
```

### ToolContext for consistent sizing

Wrap your tool's root content in a `ToolContext.Provider` with `size: "medium"` to ensure consistent control sizing:

```tsx
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";

<ToolContext.Provider value={{ useFluent: true, disableCopy: false, toolName: "MyTool", size: "medium" }}>
    {/* tool content */}
</ToolContext.Provider>
```

---

## 7. Known Gotchas

### className forwarding on shared primitives

Not all shared primitives forward `className` to the outermost DOM element. When a primitive does NOT forward className, wrap it in a `<div>`:

| Primitive | Forwards `className`? | Workaround |
|---|---|---|
| `Button` | ✅ Yes | — |
| `Dropdown` | ✅ Yes | — |
| `TextInput` | ✅ Yes (via `mergeClasses`) | — |
| `SyncedSliderInput` | ❌ No | Wrap in `<div className={...}>` |
| `ColorPickerPopup` | ❌ No | Wrap in `<div className={...}>` |

### TextInput width override

`TextInput` has a hardcoded `width: 150px` from Fluent's `UniformWidthStyling`. To make it fill available space:

1. Wrap in a `<div>` with `flex: 1; minWidth: 0` (the `fillControl` pattern)
2. Pass `className={classes.fullWidth}` (with `fullWidth: { width: "100%" }`) to the `TextInput` — Griffel's deduplication ensures the external className wins over the internal 150px

### Textarea slot styling

`className` on Fluent's `Textarea` applies to the outer wrapper span, **not** the inner `<textarea>` element. To style the actual textarea (e.g. monospace font, no-wrap):

```tsx
<Textarea
    className={classes.outerStyles}
    textarea={{ className: classes.innerStyles }}
/>
```

Where:
```tsx
outerStyles: { minHeight: "160px" },
innerStyles: { fontFamily: "monospace", whiteSpace: "pre", overflowX: "auto" },
```

### HTML custom elements

React's `className` doesn't work on HTML custom elements (e.g. `<babylon-viewer>`). Use `class=` instead:

```tsx
<babylon-viewer class={classes.myViewer} />
```

You'll need a JSX `IntrinsicElements` declaration with `class?: string`.

### ButtonLine nesting

Do not nest `ButtonLine` inside `PropertyLine` — this creates a `LineContainer` inside `PropertyLine` resulting in double borders. Use the `Button` primitive directly instead.

### Button groups

When multiple action buttons appear together (e.g. upload + reset), wrap them in a gapless flex row to avoid unwanted spacing between buttons:

```tsx
buttonGroup: { display: "flex", flexDirection: "row", alignItems: "center" },
```

The gap should be between the left content (e.g. a text input) and the button group, not between individual buttons.

---

## 8. Import Paths

The ModularTool framework and Fluent components live in `shared-ui-components`:

```ts
// Service framework
import { MakeModularTool } from "shared-ui-components/modularTool/modularTool";
import { type ServiceDefinition, type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type WeaklyTypedServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceContainer";

// Shell service
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";

// Hooks
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

// Fluent primitives and HOCs
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
// ... etc.
```

No `inspector/` imports are needed for tools — everything comes from `shared-ui-components/`.

---

## 9. File Cleanup Checklist

After porting, delete:

- [ ] All `.scss` / `.css` files
- [ ] `scssDeclaration.d.ts` (SCSS module type declarations)
- [ ] `FontAwesomeIconButton.tsx` or similar FA wrapper components
- [ ] `ExpandableMessageLineComponent.tsx` or similar legacy message components
- [ ] Local `observableHooks.ts` (use `shared-ui-components/modularTool/hooks/observableHooks` instead)
- [ ] `App.tsx` / `App.scss` if the root component is replaced by shell service content

### Verify

- Webpack builds cleanly with `npx webpack --mode development --no-devtool`
- No remaining imports of `sass`, `scss`, `fontawesome`, or legacy shared-ui-components
- All controls render correctly in both light and dark themes
- Dynamic functionality (drag-and-drop, modals, etc.) still works

---

## 10. Dropdown Options Pattern

The Fluent `Dropdown` uses `DropdownOption<T>` instead of the old `IInspectableOptions`:

```tsx
import type { DropdownOption } from "shared-ui-components/fluent/primitives/dropdown";

const options: DropdownOption<string>[] = [
    { key: "option1", text: "Option 1" },
    { key: "option2", text: "Option 2" },
];

<Dropdown options={options} value={currentValue} onChange={onValueChanged} />
```

For `satisfies` clauses in const option arrays, use `satisfies DropdownOption<string>[]` instead of the old `satisfies IInspectableOptions[]`.

---

## Summary: Step-by-Step Porting Order

1. **Update dependencies** — add Fluent + inspector, remove FontAwesome + SCSS
2. **Update webpack** — add `inspector` alias, set `includeCSS: false`
3. **Update tsconfig** — add `inspector` path mapping
4. **Create services** — define service identities, contracts, and factory functions
5. **Rewrite entry point** — replace `createRoot` with `MakeModularTool`
6. **Port components** — replace legacy components with Fluent equivalents, convert SCSS to `makeStyles`
7. **Replace icons** — swap FontAwesome for `@fluentui/react-icons`
8. **Switch hooks** — use `useObservableState` from `shared-ui-components/modularTool/` instead of local hooks
9. **Delete obsolete files** — remove SCSS, FA wrappers, legacy components
10. **Build & verify** — ensure clean build and correct rendering in both themes
