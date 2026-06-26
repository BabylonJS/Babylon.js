# Babylon.js Tools Design Guidelines

These are the shared design guidelines for **Babylon.js tools** — the Inspector, the node-based editors (NME, NGE, NPE, NRGE), the GUI Editor, the Smart Filters Editor, the Viewer/Viewer Configurator, the Playground, and any new tool built across the Babylon.js repositories.

They exist so that every tool looks, feels, and behaves like part of the same family. The reference implementations are the **Inspector (inspector-v2)** and the **Flow Graph Editor**, which are fully built on Fluent UI and the `MakeModularTool` framework. New tools should match them; existing tools should converge toward them.

This document is intentionally self-contained so it can be copied into other Babylon.js repositories. Where it references source paths, those paths are in the [`BabylonJS/Babylon.js`](https://github.com/BabylonJS/Babylon.js) monorepo under `packages/dev/sharedUiComponents/src/`.

---

## 1. Core principles

1. **Fluent first.** All tool UI is built on [Fluent UI v9](https://react.fluentui.dev/) (`@fluentui/react-components` + `@fluentui/react-icons`). Do not hand-roll buttons, inputs, dropdowns, dialogs, or layout primitives.
2. **Theme-token driven.** Never hard-code colors, font sizes, line heights, font families, or spacing. Everything comes from theme tokens so light/dark themes and future re-skins "just work."
3. **Shared wrappers over raw Fluent.** Prefer the wrappers in `shared-ui-components/fluent/` over raw Fluent components. They apply Babylon's consistent sizing, density, copy affordances, and `ToolContext` behavior.
4. **One shell, consistent structure.** Tools are composed from a single shell (`MakeModularTool` + `IShellService`): central content, dockable side panes, and toolbars. Do not invent bespoke layout containers.
5. **Modular services.** Functionality is delivered as services that declare what they `produce` and `consume`. This keeps tools extensible (including by third-party extensions) and consistent.
6. **Accessible and discoverable.** Use semantic Fluent components, real labels, tooltips, and teaching moments rather than visual-only cues.

If a guideline here conflicts with a one-off visual request, the guideline wins unless there is an explicit, documented reason to deviate.

---

## 2. Color schema

Babylon tools use a **single brand color ramp** fed into Fluent's theme generator. This produces the strict, shared color schema used across all tools — you never pick colors by hand.

### Brand ramp

The brand key color is **`#3A94FC`**. The full 16-step brand ramp:

```ts
// Generated from https://react.fluentui.dev/?path=/docs/theme-theme-designer--docs
// Key color: #3A94FC
const BabylonRamp: BrandVariants = {
    10:  "#020305",
    20:  "#121721",
    30:  "#1A263A",
    40:  "#1F314F",
    50:  "#243E64",
    60:  "#294B7B",
    70:  "#2D5892",
    80:  "#3166AA",
    90:  "#3473C3",
    100: "#3782DC",
    110: "#3990F6",
    120: "#5A9EFD",
    130: "#7BACFE",
    140: "#96BAFF",
    150: "#AFC9FF",
    160: "#C6D8FF",
};
```

### Light and dark themes

Both themes are generated from the same ramp via Fluent's `createLightTheme` / `createDarkTheme`. The only deliberate Babylon customization is **reducing maximum contrast** by mapping the most intense foreground to the second-most intense one:

```ts
import { createDarkTheme, createLightTheme } from "@fluentui/react-components";

const BaseLightTheme = createLightTheme(BabylonRamp);
export const LightTheme = {
    ...BaseLightTheme,
    colorNeutralForeground1: BaseLightTheme.colorNeutralForeground2,
};

const BaseDarkTheme = createDarkTheme(BabylonRamp);
export const DarkTheme = {
    ...BaseDarkTheme,
    colorNeutralForeground1: BaseDarkTheme.colorNeutralForeground2,
};
```

The canonical source lives at `packages/dev/sharedUiComponents/src/modularTool/themes/babylonTheme.ts`.

### Rules for color

- **Always use semantic tokens** from `tokens` (`@fluentui/react-components`): `tokens.colorNeutralBackground1`, `tokens.colorNeutralForeground2`, `tokens.colorBrandBackground`, `tokens.colorNeutralStroke1`, etc.
- **Never** write hex/rgb/hsl literals in component styles. The only place raw colors belong is the brand ramp definition itself.
- **Dark theme is the default** for embedded tool surfaces (e.g. the legacy `FluentToolWrapper` defaults to `webDarkTheme`), but every tool must render correctly in **both** light and dark. Always verify both.
- Brand color is reserved for primary actions, selection, and focus emphasis — not for decorative fills. Let Fluent decide brand usage via component `appearance` props.

---

## 3. Layout & shell structure

Every tool is hosted by one shell, created via `MakeModularTool`, which provides a strict, predictable structure. Do not build custom split-pane/overlay layouts; register into the shell instead.

### Shell anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  Top toolbar (full mode)  ·  or compact toolbars per side     │
├───────────────┬──────────────────────────────┬───────────────┤
│  Left side    │                              │  Right side   │
│  panes        │        Central content       │  panes        │
│  (top/bottom) │      (viewport / canvas)     │  (top/bottom) │
│               │                              │               │
├───────────────┴──────────────────────────────┴───────────────┤
│  Bottom toolbar (full mode)  ·  or compact toolbars per side  │
└──────────────────────────────────────────────────────────────┘
```

The shell exposes exactly three insertion points via `IShellService`:

| API | Purpose |
| --- | --- |
| `addCentralContent({ key, component, order? })` | The main area — viewport, graph canvas, preview. |
| `addSidePane({ key, title, icon, horizontalLocation, verticalLocation, content, teachingMoment?, keepMounted? })` | A dockable, collapsible side pane. |
| `addToolbarItem({ key, component, horizontalLocation, verticalLocation, order?, teachingMoment? })` | A toolbar button / control. |

All three return an `IDisposable` — dispose them in your service's `dispose()`.

### Positioning model

- **`horizontalLocation`**: `"left"` | `"right"`.
- **`verticalLocation`**: `"top"` | `"bottom"`.
- Side panes are **dockable and collapsible**; users can re-dock panes, and their layout choices persist via the settings store. Don't fight this — design panes that work in any valid dock.

### Toolbar modes

- **`compact`** — minimal toolbars sitting at the top/bottom of the left/right side panes. Use for focused tools with few global actions.
- **`full`** — full-width toolbars above/below the side panes, with left/right alignment. Use for tools with richer global action sets.

Choose one mode per tool and stay consistent. Place global, document-level actions (save, load, theme, settings) in the toolbar; place contextual/property controls in side panes.

### Side panes

- Give every pane a **`title`** (rendered as a standardized header) and an **`icon`** (unsized Fluent icon).
- Use `keepMounted: true` only when losing a pane's internal visual state on tab switch would be costly.
- Build pane bodies from **Accordion sections + property lines** (see §5) for consistency with the Inspector's Properties pane.

---

## 4. Bootstrapping a tool

Tools are bootstrapped with `MakeModularTool`, not ad-hoc `createRoot(<App/>)`. The framework wires up theming, settings, the shell, toasts, and dialogs for you.

```ts
import { MakeModularTool } from "shared-ui-components/modularTool/modularTool";

MakeModularTool({
    namespace: "MyToolName",
    containerElement: document.getElementById("root")!,
    serviceDefinitions: [
        /* your service definitions */
    ],
    toolbarMode: "compact", // or "full"
    showThemeSelector: true, // adds the light/dark toggle to the toolbar
});
```

`MakeModularTool` automatically provides:

- `FluentProvider` + the Babylon light/dark theme.
- `SettingsStore` — persisted, namespaced user preferences.
- `ThemeService` (+ optional `ThemeSelectorService`).
- `ShellService` — the layout described in §3.
- `ToastProvider` + `IToastService` — use this for toasts; do not roll your own container.
- `IDialogService` — use this for modal alert/confirm dialogs instead of bespoke dialog components.

### Services

Functionality is delivered as `ServiceDefinition<Produces, Consumes>` objects:

```ts
export const MyServiceDefinition: ServiceDefinition<[IMyService], [IShellService]> = {
    friendlyName: "My Service",
    produces: [MyServiceIdentity],
    consumes: [ShellServiceIdentity],
    factory: (shellService) => {
        const registration = shellService.addSidePane({
            key: "MyPane",
            title: "My Pane",
            icon: SettingsRegular,
            horizontalLocation: "right",
            verticalLocation: "top",
            content: () => <MyPaneContent />,
        });
        return { /* contract */, dispose: () => registration.dispose() };
    },
};
```

For instance-scoped inputs (e.g. a `Show(options)` entry point), export a `MakeXService(options)` factory that returns a `ServiceDefinition`, rather than relying on globals.

### Reactive state

Subscribe to service state in components with the shared hooks, not custom event plumbing:

```ts
import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";

const value = useObservableState(() => myService.someData, myService.onStateChanged);
const [enabled, setEnabled, resetEnabled] = useSetting(MySettingDescriptor);
```

Persist user preferences through `ISettingsStore` / `useSetting` (keys are namespaced under `Babylon/` automatically) — never read or write `localStorage` directly.

---

## 5. Components

### Use shared wrappers

Prefer the wrappers in `shared-ui-components/fluent/` over raw Fluent components for property controls and form elements. They apply consistent sizing/density and the `ToolContext` size context (compact mode). Use raw Fluent form controls only when no suitable wrapper exists — and add a short comment/TODO explaining why.

### Property lines vs primitives

- **`PropertyLine`** — a labeled row. Renders an `InfoLabel` + child content in the standardized layout with a hover border and (optional) copy affordance. Use for any labeled property.
- **`LineContainer`** — an unlabeled row with the same hover-border treatment.
- **Primitives directly** — for custom/compound layouts (button groups, multi-control rows). When composing multiple children inside a `PropertyLine`, wrap them in a flex container (`PropertyLine` clips overflow on a single child).

Both import from `shared-ui-components/fluent/hoc/propertyLines/propertyLine`.

### Common mappings (legacy → Fluent shared)

| Legacy component | Fluent replacement |
| --- | --- |
| `LineContainerComponent` | `AccordionSection` |
| `CheckBoxLineComponent` | `Switch` / `SwitchPropertyLine` |
| `SliderLineComponent` | `SyncedSliderInput` / `SyncedSliderPropertyLine` |
| `OptionsLine` | `Dropdown` / `StringDropdownPropertyLine` |
| `ButtonLineComponent` | `Button` |
| `TextInputLineComponent` | `TextInput` / `TextInputPropertyLine` (or Fluent `Textarea` for multiline) |
| `MessageLineComponent` | `MessageBar` |
| `Color4LineComponent` | `ColorPickerPopup` / `Color4PropertyLine` |
| `SplitContainer` / `Splitter` | Shell side panes (handled by the shell) |

### Stateful and conditional UI

- **`ToggleButton`** (from `shared-ui-components/fluent/primitives/toggleButton`) for toggleable actions (picking on/off, recording on/off) — let Fluent render the checked state; don't hand-style an "active" button.
- **`Collapse`** (from `shared-ui-components/fluent/primitives/collapse`) for animated show/hide of a UI block based on a boolean, instead of `{condition && (...)}`. For switching between entirely separate components (error vs success), conditional rendering / ternaries are still fine.

---

## 6. Styling

### makeStyles, not inline styles

Use Fluent's `makeStyles` + `className`. Reserve inline `style={}` for values that are genuinely dynamic per render (e.g. drag transforms).

```tsx
const useStyles = makeStyles({
    toolbar: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingVerticalS,
    },
});
```

### Spacing tokens

Use `tokens.spacingHorizontal*` / `tokens.spacingVertical*` (XS, S, M, L, …) for padding, margin, and gap. Never hard-code pixel strings for spacing.

### Zero raw CSS/SCSS

Ported and new tools should contain **no `.scss`/`.css`** files and no SCSS module declarations. All styling is `makeStyles`.

---

## 7. Typography

Never use raw HTML text elements (`<span>`, `<p>`, `<h1>`, …) and never hard-code `fontSize`, `lineHeight`, or `fontFamily`. Use Fluent's typography system, in this order:

1. **Text preset components** (preferred): `<Body1>`, `<Caption1>`, `<Subtitle1>`, `<Title3>`, … from `@fluentui/react-components`.
2. **`typographyStyles`**: spread a preset into `makeStyles` when styling a non-text element.
3. **Font tokens**: `tokens.fontFamilyMonospace`, `tokens.fontSizeBase300`, … for a single specific override.

```tsx
import { Body1, Caption1, makeStyles, typographyStyles, tokens } from "@fluentui/react-components";

<Body1>Status message</Body1>
<Caption1>Secondary info</Caption1>

const useStyles = makeStyles({
    header: { ...typographyStyles.subtitle1 },
    code: { fontFamily: tokens.fontFamilyMonospace },
});
```

---

## 8. Icons

- Use `@fluentui/react-icons` for all icons. Replace FontAwesome and other icon sets.
- Import **unsized** variants (`AddRegular`, `DeleteRegular`) — not sized ones (`Add20Regular`). Sized icons bloat the bundle. Control size with `fontSize` on the icon/container.
- For custom brand icons (e.g. the Babylon logo), use `createFluentIcon` with a `0 0 20 20` viewBox (transform your source SVG into that box).

Common mappings: `faQuestionCircle → QuestionCircleRegular`, `faSave → SaveRegular`, `faTrashCan → DeleteRegular`, `faGear → SettingsRegular`, `faSearch → SearchRegular`, `faClose → DismissRegular`, `faPlus → AddRegular`, `faPencil → EditRegular`.

---

## 9. Sizing & density

- Wrap a tool's content in `ToolContext` with a consistent `size` so all controls scale together:

```tsx
<ToolContext.Provider value={{ useFluent: true, disableCopy: false, toolName: "MyTool", size: "medium" }}>
    {/* tool content */}
</ToolContext.Provider>
```

- Dense property panels may override to `size: "small"` **inside the pane's content function**, spreading the parent context first so other fields are inherited.
- Keep density consistent within a surface — don't mix sizes arbitrarily in the same pane.

---

## 10. Feedback: toasts and dialogs

- **Toasts** for transient, non-blocking feedback — consume `IToastService` (`ToastServiceIdentity`). Don't build a custom toast container.
- **Dialogs** for modal alerts/confirms — consume `IDialogService` (`DialogServiceIdentity`). Don't build ad-hoc modal components.
- **Teaching moments** for discoverability of newly added panes/toolbar items (especially from extensions) — provide a `teachingMoment` with a clear title/description, or set it to `false` for built-in, non-dynamic items.
- **`MessageBar`** for inline, in-context status/warnings within a pane.

---

## 11. Consuming from npm (other repositories)

Everything these guidelines depend on is published to npm, so a tool in another repository can adopt the same design system. The Fluent primitives and the `MakeModularTool` shell (including the Babylon brand theme) ship inside **`@babylonjs/shared-ui-components`** — the entire source tree is transpiled into the package, so deep imports resolve:

```ts
import { MakeModularTool } from "@babylonjs/shared-ui-components/modularTool/modularTool";
import { Button } from "@babylonjs/shared-ui-components/fluent/primitives/button";
import { LightTheme, DarkTheme } from "@babylonjs/shared-ui-components/modularTool/themes/babylonTheme";
```

> Note: inside the Babylon.js monorepo these import from the bare `shared-ui-components/...` alias. In an external repo, use the published `@babylonjs/shared-ui-components/...` specifier.

### Install

None of these are bundled, so the consuming repo must install them explicitly. They fall into two groups:

- **Declared peer dependencies** of the published `@babylonjs/shared-ui-components` package — `react`, `react-dom`, `react-dnd`, `react-dnd-touch-backend`, `dagre` (+ `@types/dagre`). npm warns if these are missing.
- **Required-but-not-declared** — `@fluentui/react-components`, `@fluentui/react-icons`, and `@babylonjs/core`. The Fluent/`modularTool` entrypoints import these at runtime (e.g. `Observable`, `Logger` from core), but the published package does **not** list them in `peerDependencies`, so npm won't warn — you must add them yourself.

```bash
npm install @babylonjs/shared-ui-components @babylonjs/core \
    @fluentui/react-components @fluentui/react-icons \
    react react-dom react-dnd react-dnd-touch-backend dagre
```

Versions to match — for the declared peer deps, the published package's `peerDependencies` is authoritative; for the undeclared Fluent/core deps, match the versions `shared-ui-components` is built against (Babylon's `@dev/shared-ui-components` dependencies) and keep `@babylonjs/core` on the same major as `shared-ui-components`:

| Package | Range | Declared as peer dep? |
| --- | --- | --- |
| `react` / `react-dom` | `^18.2.0` | Yes |
| `react-dnd` / `react-dnd-touch-backend` | `15.0.1` | Yes |
| `dagre` | `^0.8.5` (node-graph features) | Yes |
| `@fluentui/react-components` | `^9.70.0` | No — install explicitly |
| `@fluentui/react-icons` | `^2.0.310` | No — install explicitly |
| `@babylonjs/core` | match `shared-ui-components` major | No — install explicitly |

### Stability caveat

`@babylonjs/shared-ui-components` is published primarily to serve Babylon's own editors. The Fluent and `modularTool` modules are comparatively new and are **not** covered by the same strict semver-stable API contract as `@babylonjs/core` — minor releases may move or rename things. Pin a version you've validated and review changes when upgrading. If you only need the *patterns* (color schema, layout, token usage) rather than the exact components, you can also re-implement them on top of raw `@fluentui/react-components` using the brand ramp in §2.

---

## 12. Checklist for a new or ported tool

- [ ] Bootstrapped with `MakeModularTool` (no ad-hoc `createRoot`).
- [ ] Layout is composed from `IShellService` (central content, side panes, toolbars) — no custom split containers.
- [ ] One consistent `toolbarMode` (`compact` or `full`).
- [ ] Theme comes from the Babylon brand ramp; **no hard-coded colors** anywhere except the ramp.
- [ ] Renders correctly in **both light and dark** themes.
- [ ] Controls use `shared-ui-components/fluent/` wrappers; raw Fluent only where justified.
- [ ] Labeled rows use `PropertyLine`; panes use `Accordion` sections.
- [ ] `ToggleButton` for toggle state; `Collapse` for animated show/hide.
- [ ] Styling via `makeStyles` + spacing/typography tokens; **no `.scss`/`.css`**, no inline styles except dynamic values.
- [ ] Typography via text presets / `typographyStyles` / font tokens; no raw text elements or hard-coded font values.
- [ ] Icons from `@fluentui/react-icons`, **unsized** variants.
- [ ] Consistent sizing via `ToolContext`.
- [ ] Settings persisted via `ISettingsStore` / `useSetting` — no direct `localStorage`.
- [ ] Feedback via `IToastService` / `IDialogService` / `MessageBar`; discoverability via teaching moments.

---

## 13. References

- **Reference tools:** Inspector (`packages/dev/inspector-v2/`), Flow Graph Editor (`packages/tools/flowGraphEditor/`), Viewer Configurator (`packages/tools/viewer-configurator/`).
- **Framework:** `packages/dev/sharedUiComponents/src/modularTool/` (shell, services, theme, hooks).
- **Fluent primitives & HOCs:** `packages/dev/sharedUiComponents/src/fluent/`.
- **Brand theme:** `packages/dev/sharedUiComponents/src/modularTool/themes/babylonTheme.ts`.
- **Related instructions (Babylon.js repo):** `.github/instructions/fluent.instructions.md`, `.github/instructions/inspector.instructions.md`, `.github/instructions/react.instructions.md`, and the `porting-tools-to-fluent` skill.
- **Fluent UI:** https://react.fluentui.dev/ · **Theme designer:** https://react.fluentui.dev/?path=/docs/theme-theme-designer--docs
