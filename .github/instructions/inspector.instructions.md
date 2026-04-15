---
applyTo: "packages/dev/inspector-v2/**/*.{ts,tsx}"
---

# Inspector v2 Development Guidelines

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
import { useSetting } from "shared-ui-components/modularTool/hooks/settingsHooks";

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
