# How to Interact with Babylon Editors

Babylon editors (Smart Filter Editor, Node Material Editor, etc.) share a common layout: a **block list** on the left, a **node graph canvas** in the center, **properties panel** on the right, and a **preview** at the bottom right.

They all use a visual wiring system that relies on dragging with the mouse. Two blocks can be connected by dragging from one connection point to the other. Input connection points are on the left of blocks, and outputs on the right. An input connection point can only have one connection, but an output connection point can wire up to multiple other inputs.

Blocks can be selected by clicking on them, as can connection wires.

---

## Interacting with Editors via playwright-cli

### Opening the Editor

By default, run in **headless** mode so the user isn't distracted and can continue other work:

```bash
playwright-cli open <url>
```

If the user explicitly asks to watch or see the browser (e.g. "show me", "visible", "headed"), use `--headed`:

```bash
playwright-cli open --headed <url>
```

> **Note:** `open` may land on `about:blank`. If so, follow up with `playwright-cli goto <url>`.

After the page loads, take a snapshot to confirm it rendered and to get element refs:

```bash
playwright-cli snapshot
```

### Adding a Block to the Canvas

Single-click and double-click on left-panel block items do **not** add them to the canvas. You must **drag** from the panel onto the canvas using raw mouse events:

```bash
# 1. Move mouse to the block item in the left panel
playwright-cli mousemove <panelItemCenterX> <panelItemCenterY>

# 2. Press mouse down
playwright-cli mousedown

# 3. Move to a location on the canvas
playwright-cli mousemove <canvasCenterX> <canvasCenterY>

# 4. Release to drop the block
playwright-cli mouseup
```

To find the panel item coordinates, take a snapshot and use `grep` to find the block name (e.g., "Contrast"). Then estimate the center from the panel layout — block list items are roughly 185px wide starting at x=0, stacked vertically at ~30px height each.

### Wiring Blocks Together

Connection ports are small `img` elements (class `port-icon`) next to the port label text. Each has a unique `ref` in the snapshot (e.g., `e102` for Pixelate's output port, `e296` for Contrast's input port).

**Use `hover` + `mousedown`/`mouseup` to drag between ports:**

```bash
# 1. Hover on the source port (moves mouse to its center)
playwright-cli hover <sourcePortRef>

# 2. Press mouse down to start dragging
playwright-cli mousedown

# 3. Hover on the target port (moves mouse to its center)
playwright-cli hover <targetPortRef>

# 4. Release to complete the wire
playwright-cli mouseup
```

This is the most reliable wiring method — `hover` resolves the element's center position automatically, avoiding the need to manually calculate coordinates.

> **Important:** Connecting to an input that already has a wire will **replace** the existing connection (inputs accept only one wire).

### Finding Element Refs

After any interaction that changes the DOM, take a fresh snapshot:

```bash
playwright-cli snapshot
```

Then search the snapshot YAML for the element you need:

```bash
# Find port refs for a specific block
Select-String -Path ".playwright-cli\<snapshot>.yml" -Pattern "e102|e296|e305|e135"

# Find a button ref
grep -n "Reorganize" .playwright-cli/<snapshot>.yml
```

Port icons (`img` elements) are nested inside the block's connection structure. Look for the `img [ref=eXXX]` lines near the port label text (e.g., "output", "input", "intensity").

### Clicking Buttons and UI Elements

Use refs from the snapshot:

```bash
playwright-cli click <ref>
```

For toolbar buttons like "Reorganize", find the ref in the snapshot first.

### Taking Screenshots

```bash
playwright-cli screenshot --filename=<descriptive-name>.png
```

Always take screenshots after significant interactions so the user can visually verify the result.

### Evaluating JavaScript

Page-level eval works but has quoting challenges on Windows/PowerShell:

```bash
# Use double-double-quotes for inner strings on Windows
playwright-cli eval "document.title"
```

> **Limitation:** `eval` with element refs (e.g., `eval "e.getBoundingClientRect()" e102`) does **not** work — the variable `e` is not available. Use page-level `document.querySelector(...)` instead, or prefer the `hover` approach for positioning.

### The `drag` Command

`playwright-cli drag` with element refs may fail with validation errors. **Prefer raw mouse events** (`mousemove`, `mousedown`, `hover`, `mouseup`) for all drag operations.

---

## Quick Reference: Common Workflows

| Task | Method |
|---|---|
| Add block to canvas | `mousemove` → `mousedown` → `mousemove` → `mouseup` (panel to canvas) |
| Wire two ports | `hover srcPort` → `mousedown` → `hover destPort` → `mouseup` |
| Click a button | `click <ref>` (take snapshot first to find ref) |
| Select a block | `click <blockRef>` |
| Clean up layout | Click the "Reorganize" button |
| Verify state | `screenshot --filename=<name>.png` |

---

## Gotchas

- **`open` lands on about:blank**: Follow up with `goto <url>`.
- **`drag` command fails**: Use raw mouse events instead.
- **`eval` with refs**: `e` variable is not available. Use `document.querySelector` or `hover` for positioning.
- **Stale refs**: After DOM changes (adding blocks, wiring), always take a fresh `snapshot` before referencing elements.
- **Windows quoting**: Nested quotes in PowerShell need `""` escaping inside outer double quotes.
- **Headless by default**: Run headless unless the user explicitly asks to see the browser. Use `--headed` only when requested.