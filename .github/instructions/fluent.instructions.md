---
applyTo: "packages/dev/**/*.{ts,tsx},packages/tools/**/*.{ts,tsx}"
---

# Fluent UI Conventions

## Use Shared UI Components

Prefer using the wrapper components from `shared-ui-components/fluent/` for property controls and form elements instead of raw Fluent UI components (e.g. `Button`, `Input`, `Checkbox`, `Dropdown` from `@fluentui/react-components`). These wrappers apply consistent sizing, density, and theming that raw Fluent components miss (e.g. the `ToolContext` size context for compact mode). Use raw Fluent form controls only when a suitable wrapper does not exist or is insufficient for the scenario, and add a brief comment/TODO explaining why.

When reviewing code, encourage the use of shared-ui-components wrappers for property controls, and only accept direct use of raw Fluent form controls when wrappers are missing or inadequate and the code includes a short justification/TODO near the usage.

## Styling

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

## Icon Imports

### Use unsized icon variants

Import **unsized** icon variants (e.g. `AddRegular`, `DeleteRegular`) rather than **sized** variants (e.g. `Add20Regular`, `Delete24Regular`). Sized icons increase bundle size because each size is a separate SVG path. Use `fontSize` on the icon or its container to control size when needed.

```tsx
// ✅ Good
import { AddRegular, DeleteRegular } from "@fluentui/react-icons";

// ❌ Bad — each sized variant adds to bundle size
import { Add20Regular, Delete24Regular } from "@fluentui/react-icons";
```

## Collapse for Conditional Visibility

When a block of UI should show/hide based on a boolean condition, use the `Collapse` component from `shared-ui-components/fluent/primitives/collapse` instead of `{condition && (...)}`. `Collapse` provides a smooth animated transition and avoids abrupt mount/unmount churn.

```tsx
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

// ✅ Good — animated show/hide
<Collapse visible={showAdvancedOptions}>
    <PropertyLine label="Detail Level" uniqueId="detail-level">
        <SyncedSliderInput value={detailLevel} onChange={setDetailLevel} />
    </PropertyLine>
</Collapse>

// ❌ Avoid — abrupt mount/unmount, no animation
{showAdvancedOptions && (
    <PropertyLine label="Detail Level" uniqueId="detail-level">
        <SyncedSliderInput value={detailLevel} onChange={setDetailLevel} />
    </PropertyLine>
)}
```

Note: `Collapse` uses `unmountOnExit`, so children are not rendered when hidden. This is fine for UI controls but should be considered if the children have side effects on mount.

For conditionally rendering entirely separate components (e.g. an error state vs a success state), `{condition && (...)}` or ternaries are still appropriate since there's no meaningful "collapse" animation between unrelated content.

## ToggleButton for Stateful Actions

When a button represents a toggleable state (e.g. picking mode on/off, recording on/off), use `ToggleButton` from `shared-ui-components/fluent/primitives/toggleButton` instead of a `Button` with manual styling for the active state. `ToggleButton` provides Fluent's built-in checked visual treatment.

```tsx
import { ToggleButton } from "shared-ui-components/fluent/primitives/toggleButton";

// ✅ Good — Fluent handles the checked visual state
<ToggleButton
    title="Pick from model"
    appearance="transparent"
    checkedIcon={TargetRegular}
    value={isPicking}
    onChange={setIsPicking}
/>

// ❌ Bad — manual color styling for active state
<Button
    icon={TargetRegular}
    className={isPicking ? classes.active : undefined}
    onClick={togglePicking}
/>
```
