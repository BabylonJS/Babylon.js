---
applyTo: "packages/dev/inspector-v2/**/*.{ts,tsx}"
---

# Inspector v2 Development Guidelines

## Use Shared UI Components

Prefer using the wrapper components from `shared-ui-components/fluent/` for property controls and form elements instead of raw Fluent UI components (e.g. `Button`, `Input`, `Checkbox`, `Dropdown` from `@fluentui/react-components`). These wrappers apply consistent sizing, density, and theming that raw Fluent components miss (e.g. the `ToolContext` size context for compact mode). Use raw Fluent form controls only when a suitable wrapper does not exist or is insufficient for the scenario, and add a brief comment/TODO explaining why.

When reviewing code, encourage the use of shared-ui-components wrappers for property controls, and only accept direct use of raw Fluent form controls when wrappers are missing or inadequate and the code includes a short justification/TODO near the usage.

## Styling Conventions

### Prefer makeStyles over inline styles

Use Fluent UI's `makeStyles` with `className` instead of the `style` attribute on JSX elements. Inline styles bypass Griffel's CSS-in-JS optimizations and are less efficient in React. Only use `style` when the values are truly dynamic at runtime (e.g. computed from props/state each render).

```tsx
// ✅ Good
const useStyles = makeStyles({
    toolbar: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        padding: tokens.spacingVerticalS,
    },
});

// ❌ Bad
<div style={{ display: "flex", gap: "4px", padding: "4px" }}>
```

### Use Fluent spacing tokens

Use `tokens.spacingVerticalXS`, `tokens.spacingHorizontalM`, etc. from `@fluentui/react-components` for padding, margin, and gap values instead of hard-coded pixel strings. This ensures consistency across themes. See: https://storybooks.fluentui.dev/react/?path=/docs/theme-spacing--docs

## Fluent Icon Imports

### Use unsized icon variants

Import **unsized** icon variants (e.g. `AddRegular`, `DeleteRegular`) rather than **sized** variants (e.g. `Add20Regular`, `Delete24Regular`). Sized icons increase bundle size because each size is a separate SVG path. Use `fontSize` on the icon or its container to control size when needed.

```tsx
// ✅ Good
import { AddRegular, DeleteRegular } from "@fluentui/react-icons";

// ❌ Bad — each sized variant adds to bundle size
import { Add20Regular, Delete24Regular } from "@fluentui/react-icons";
```

## Persist Settings via ISettingsStore

Extensions should persist user settings through the `ISettingsStore` service (identity: `SettingsStoreIdentity`) rather than reading/writing `localStorage` directly. `ISettingsStore` namespaces keys under `Babylon/` automatically and provides change notifications via `onChanged`.

```tsx
import { SettingsStoreIdentity } from "./settingsStore";

// Define a setting descriptor
const MySetting: SettingDescriptor<boolean> = { key: "MyExtension/enabled", defaultValue: false };

// In your service factory (consuming SettingsStoreIdentity):
const value = settingsStore.readSetting(MySetting);
settingsStore.writeSetting(MySetting, true);
```

Within React components, use the `useSetting` hook instead of calling `ISettingsStore` directly. It returns a `[value, setValue, resetValue]` tuple (like `useState`) and automatically re-renders when the setting changes.

```tsx
import { useSetting } from "../../hooks/settingsHooks";

const MySettingDescriptor: SettingDescriptor<boolean> = { key: "MyExtension/enabled", defaultValue: false };

function MyComponent() {
    const [enabled, setEnabled, resetEnabled] = useSetting(MySettingDescriptor);
    // enabled is reactive — component re-renders when this setting changes
    // setEnabled persists the new value and triggers re-renders
    // resetEnabled restores the default value
}
```

## Extension Architecture

### Service definitions

Extensions expose functionality through `ServiceDefinition` objects that declare their dependencies (`consumes`) and what they provide (`produces`). Export a default object with a `serviceDefinitions` array:

```tsx
export default {
    serviceDefinitions: [MyExtensionServiceDefinition],
} as const;
```

### Side panes

Register side panes via `IShellService.addSidePane()`. The `content` property should return a React component. Use the shared accordion and property line components for consistency with built-in panes like Properties.

### Central content

Register viewport/canvas content via `IShellService.addCentralContent()`.
