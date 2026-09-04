# Responsive 2D GUI layout

This implements the flex layout and relative-unit concepts requested in [Babylon.js #13059](https://github.com/BabylonJS/Babylon.js/issues/13059), now tracked on the [feature forum](https://forum.babylonjs.com/t/add-flexbox-behavior-and-responsive-units-rem-em-to-gui/52141).

## Relative units

- `em` dimensions use the control's computed font size.
- `rem` dimensions use the AdvancedDynamicTexture root container's computed font size.
- In a `fontSize` declaration, `em` uses the parent font size and `rem` uses the GUI root font size.
- Root `fontSize` declarations in `em` or `rem` use Babylon's existing 18px default as the initial font size.
- Font-relative dimensions use already-scaled computed font sizes. They do not apply ideal-resolution scaling a second time.
- Percentages and pixels keep their existing meanings. Unsupported or non-finite strings do not change a ValueAndUnit.
- Relative strings survive serialization. The GUI root is the unit reference, not the HTML document root; no DOM access is required.

## FlexPanel

The panel has a declared width and height, as other GUI containers do. It arranges visible, renderable children using these properties:

| Property | Values / behavior | Default |
| --- | --- | --- |
| `flexDirection` | `row`, `row-reverse`, `column`, `column-reverse` | `row` |
| `flexWrap` | `nowrap`, `wrap`, `wrap-reverse` | `nowrap` |
| `justifyContent` | `flex-start`, `flex-end`, `center`, `space-between`, `space-around`, `space-evenly` | `flex-start` |
| `alignItems` | `flex-start`, `flex-end`, `center`, `stretch` | `flex-start` |
| `alignContent` | justification values plus `stretch`; distributes wrapped lines | `stretch` |
| `gap` | px, em, rem, or percent of available main-axis size; separates items and lines | `0px` |
| Child `flexGrow` | nonnegative share of extra main-axis space | `0` |
| Child `flexShrink` | nonnegative shrink factor, weighted by the main-axis basis | `1` |

The child's declared width (row) or height (column) supplies the flex basis. Cross-axis size comes from its other declared dimension. `alignItems = "stretch"` explicitly fills the line's cross-axis extent. The panel uses existing child order.

This is a canvas GUI layout container, not a complete CSS formatting engine. It does not add CSS intrinsic/min-content sizing, baseline alignment, CSS margins, `order`, `alignSelf`, or a separate `flexBasis` property. Existing GUI padding semantics still apply. Give flex children explicit dimensions; avoid child auto-size modes such as `resizeToFit` or `autoStretchWidth` when the panel controls that dimension.

FlexPanel controls child positions and final dimensions during layout. It preserves child width, height, left, top, and alignment properties. Removing a child restores its normal declared layout. The panel's `adaptWidthToChildren` / `adaptHeightToChildren` modes should remain disabled; panel size defines the available space.

## Example

```javascript
const ui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("ui");
ui.rootContainer.fontSize = "18px";
const panel = new BABYLON.GUI.FlexPanel("cards");
panel.flexWrap = "wrap";
panel.gap = "1rem";
panel.alignContent = "flex-start";
ui.addControl(panel);

for (const name of ["Explore", "Build", "Test", "Ship"]) {
    const card = new BABYLON.GUI.Rectangle(name);
    card.width = "12rem";
    card.height = "6rem";
    card.flexGrow = 1;
    panel.addControl(card);
}
```

Resize the texture to change the number of columns. Change `ui.rootContainer.fontSize` to scale rem-based card dimensions and spacing.
