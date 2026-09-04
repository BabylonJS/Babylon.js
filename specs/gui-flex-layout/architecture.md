# Architecture

ValueAndUnit represents `em` and `rem` as distinct units. Its resolver accepts optional computed font sizes. Control supplies font context to resolve dimensions, padding, offsets, text spacing, and widget-specific values. Font-size declarations resolve against the parent or root without recursion.

Container calls `_beforeChildLayout` before measuring its children. The default implementation does nothing. FlexPanel uses the hook to calculate lines and layout boxes from current declarations and available space. Its item and line records are reused between layouts; boxes use a WeakMap keyed by child control.

Container also exposes the internal `_getLayoutMeasureForChild` hook. The default returns null. FlexPanel returns the allocated box. Control applies allocated dimensions before post-measure work, so text wrapping uses the flex width, then uses the box's position during alignment. Child properties remain unchanged.

Text inputs consult the allocated box when calculating clipping and wrapping widths. Pixel, percentage, and ordinary non-flex input behavior retains its prior path.

Serialization uses the existing control decorators and RegisterClass mechanism. The ordinary entry point registers FlexPanel. The pure entry point exports its implementation and explicit idempotent registration function. Package side-effect metadata and pure barrels include the new module.

Reference semantics: [CSS Flexible Box Layout](https://www.w3.org/TR/css-flexbox-1/) and [CSS Values and Units](https://www.w3.org/TR/css-values-4/). See requirements.md for the supported canvas-specific subset.
