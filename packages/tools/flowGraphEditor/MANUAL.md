# Flow Graph Editor — User Manual

When updating the manual you **must** update the `HelpTopics` array in `helpContent.ts` to reflect the changes.

## Overview

The Flow Graph Editor is a visual tool for building, debugging, and testing Babylon.js Flow Graphs. It provides a node-based interface where you wire together **execution blocks** (driven by signals) and **data blocks** (computing values) to define interactive behaviors.

---

## Getting Started

### Loading a Scene

The editor can load a Babylon.js Playground snippet as a live scene to test your flow graph against.

1. Open the **Scene Preview** panel.
2. Enter a Playground snippet ID (e.g. `ABC123`), a versioned ID (`ABC123#5`), or a full Playground URL.
3. Press **Enter** to load and run the scene.

The loaded scene's objects (meshes, lights, cameras, etc.) become available as references in flow graph block configuration fields.

### Saving and Loading Graphs

- **Save to file** — Downloads a `flowGraph.json` file to your machine.
- **Save to snippet server** — Uploads the graph to the Babylon.js snippet server and copies the snippet ID to your clipboard. The scene snippet ID is saved alongside the graph so the scene auto-loads on restore.
- **Load from file** — Import a previously saved JSON file.
- **Load from snippet** — Enter a snippet ID to restore a graph (and its associated scene, if any).

---

## Graph Controls

The toolbar at the top provides execution controls:

| Button | Label     | Description                                                                                                                                                     |
| ------ | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ▶     | **Start** | Starts executing the flow graph. Enabled when the graph is stopped or paused.                                                                                   |
| ⏸     | **Pause** | Pauses execution. The graph can be resumed with Start.                                                                                                          |
| ⏹     | **Stop**  | Stops execution and resets execution state.                                                                                                                     |
| ↺      | **Reset** | Stops execution and reloads the scene from its snippet (if one was loaded). If the reload fails, an error is logged and the graph returns to the Stopped state. |

The **state indicator** next to the controls shows the current graph state: `Stopped`, `Running`, `Paused`, or `Breakpoint`.

### Time Scale (Speed Control)

The **Speed** buttons in the toolbar let you slow down or speed up scene execution:

| Button    | Effect                                                                           |
| --------- | -------------------------------------------------------------------------------- |
| **0.1×**  | 10% speed — near frame-by-frame, useful for watching individual block executions |
| **0.25×** | 25% speed — slow motion                                                          |
| **0.5×**  | 50% speed — half speed                                                           |
| **1×**    | Normal speed (default)                                                           |
| **2×**    | Double speed — fast forward                                                      |

The time scale affects **everything**: scene animations, FlowGraph delta time, interpolation blocks, async waits, and timer-based logic. The active speed button is highlighted in orange. The selected speed persists when the scene is reloaded via Reset.

---

## Debug Mode

Debug Mode enables real-time visualization of graph execution so you can see what's happening as your graph runs.

### Enabling Debug Mode

Click the **Debug** toggle button (magnifying glass icon) in the toolbar. The button is highlighted when debug mode is active.

### What Debug Mode Shows

When enabled, you'll see:

- **Block execution highlighting** — Blocks flash with a green glow when they execute.
- **Port activity** — Input ports that received data and output ports that fired glow green.
- **Flow animation** — Traveling dots animate along connections when signals fire or data flows, showing the direction and timing of execution.

> Debug mode adds some overhead. It throttles visual updates to 100ms per node to keep the editor responsive.

### Breakpoints

Debug mode also enables **breakpoints** — you can pause execution at a specific block and step through the graph one block at a time.

---

## Debug Breakpoints

Breakpoints let you pause graph execution just before a specific execution block runs, so you can inspect state and step through logic.

### Prerequisites

- **Debug Mode must be enabled** — breakpoints only work when debug mode is active.
- Breakpoints can only be set on **execution blocks** (blocks that have signal connections, like event handlers, conditionals, and actions). Data-only blocks cannot have breakpoints.

### Setting a Breakpoint

1. **Select** the execution block you want to break on.
2. Press **F9** to toggle the breakpoint.

A **red dot** appears on the left side of the block header when a breakpoint is active.

### Hitting a Breakpoint

When execution reaches a block with a breakpoint, the graph pauses immediately **before** that block executes. You'll see:

- The state indicator changes to **Breakpoint** (with a pulsing animation).
- The breakpoint badge on the paused block glows yellow.
- All active port highlights are cleared to avoid visual clutter.
- The **Continue** and **Step** buttons become enabled in the toolbar.

### Continue and Step

| Button | Label        | Description                                                                                             |
| ------ | ------------ | ------------------------------------------------------------------------------------------------------- |
| ▶▶   | **Continue** | Resumes normal execution from the breakpoint. The graph runs until the next breakpoint (or completion). |
| ▶\|   | **Step**     | Executes only the current block, then pauses again at the next execution block.                         |

### Removing Breakpoints

- Press **F9** on a selected block to toggle its breakpoint off.
- Stopping the graph does **not** clear breakpoints — they persist until you remove them.

---

## Debug Blocks (Value Probes)

Debug blocks are passthrough data blocks that let you inspect values flowing through your graph at runtime.

### Adding a Debug Block

1. Open the **Node List** panel (left sidebar).
2. Find **FlowGraphDebugBlock** under the **Utility** category.
3. Drag it onto the canvas.
4. Connect its **input** port to the data connection you want to observe.
5. Connect its **output** port to wherever the data needs to continue flowing.

The debug block is a pure passthrough — it doesn't modify the data, so it's safe to insert anywhere in a data chain.

### Reading Values

- Before any data flows, the block displays **`?`**.
- Once the graph runs and data passes through, the block displays the most recent value.
- The block stores a **log of the last 100 values** for inspection.

### Supported Data Types

| Type             | Display Format               |
| ---------------- | ---------------------------- |
| Number (float)   | 4 decimal places             |
| Number (integer) | As-is                        |
| Boolean          | `true` / `false`             |
| String           | Quoted string                |
| Vector2          | `(x, y)` — 3 decimals        |
| Vector3          | `(x, y, z)` — 3 decimals     |
| Vector4          | `(x, y, z, w)` — 3 decimals  |
| Color3           | `(r, g, b)` — 3 decimals     |
| Color4           | `(r, g, b, a)` — 3 decimals  |
| Object           | JSON (truncated to 64 chars) |
| Null/Undefined   | `null` / `undefined`         |

> Debug blocks can only be connected to **data ports**, not signal ports.

---

## Validation

The editor can validate your graph for configuration errors and structural issues.

### Manual Validation

Click the **Validate** button (✓) in the toolbar. The button shows a count of errors and warnings found. Click it again to log individual issues to the console (up to 20 at a time). Clicking an issue navigates to the relevant block in the graph.

### Live Validation

Click the **Live Validation** toggle (⚡) to enable automatic validation whenever the graph changes. Validation runs on a debounced schedule so it doesn't slow down editing.

Validation issues include the block name, severity (error/warning), and a descriptive message.

### Connection Type Compatibility

The editor enforces data type compatibility when connecting ports. Each data port has a **rich type** (e.g., Number, Vector3, Boolean) shown by its color. When dragging a connection:

- **Compatible ports** glow bright when hovered (brightness boost).
- **Incompatible ports** glow red and appear dimmed when hovered, indicating the connection will be rejected.

If you release the mouse on an incompatible port, an error dialog explains the type mismatch (e.g., "Type mismatch: cannot connect Vector3 to number").

**Compatibility rules:**

| Source type                           | Accepted by                   |
| ------------------------------------- | ----------------------------- |
| Any                                   | All types (wildcard)          |
| Same type                             | Always compatible             |
| Number ↔ Integer                     | Interchangeable               |
| Vector3, Vector4, Matrix → Quaternion | Accepted via type transformer |

Signal ports (execution flow) have no type restrictions — any signal output can connect to any signal input.

---

## Keyboard Shortcuts

| Key                                | Action                                        |
| ---------------------------------- | --------------------------------------------- |
| **Delete** / **Backspace**         | Delete selected blocks (removes from graph)   |
| **Alt+Delete** / **Alt+Backspace** | Delete and auto-reconnect surrounding nodes   |
| **Ctrl+C** / **Cmd+C**             | Copy selected blocks (or frames)              |
| **Ctrl+V** / **Cmd+V**             | Paste copied blocks at cursor position        |
| **Ctrl+G** / **Cmd+G**             | Create a smart group from selected blocks     |
| **F9**                             | Toggle breakpoint on selected execution block |
| **Ctrl+M** / **Cmd+M**             | Create a sticky note at cursor position       |
| **Ctrl+F** / **Cmd+F**             | Find in graph (search nodes/frames)           |
| **Enter** (in scene preview input) | Load the Playground snippet                   |

---

## Copy & Paste

Select one or more blocks and press **Ctrl+C** (or **Cmd+C** on macOS) to copy them. Press **Ctrl+V** (or **Cmd+V**) to paste copies at the cursor position.

- Cloned blocks retain all **config values** and **data input defaults** from the originals.
- Signal and data connections are **not** copied — only internal connections between pasted blocks are re-established.
- Event blocks are automatically registered with the flow graph.

You can also copy and paste entire **frames** (groups) — select a frame and use Ctrl+C/V to duplicate it along with all its contained blocks.

---

## Smart Groups (Ctrl+G)

Smart groups let you bundle multiple blocks into a collapsed frame with automatically exposed input/output ports, creating a reusable visual unit.

### Creating a Smart Group

1. Select 2 or more blocks on the canvas (Ctrl+click or drag-select).
2. Press **Ctrl+G** (or **Cmd+G** on macOS).

The editor analyzes the selected blocks and creates a collapsed frame with exposed boundary ports.

### Auto-Configuration (Single Execution Block)

If your selection contains **exactly one execution block** plus any number of data blocks:

- The execution block's **signal input** ("in") is exposed as the group's entry point.
- The execution block's **signal outputs** ("out", "done", "error") are exposed as group exit points.
- Any **data input ports** that are unconnected or connected to blocks outside the group are exposed.
- Any **data output ports** connected to blocks outside the group are exposed.

This is the most common case — e.g., a "Set Variable" block with a few constant/math blocks feeding its inputs.

### Multi-Execution-Block Groups

If the selection contains **multiple execution blocks**, all signal ports that cross the group boundary (or are unconnected) are exposed. You can then expand the frame and refine which ports are exposed by toggling them in the frame port settings.

### Ungrouping (Deleting a Smart Group)

Deleting a frame (selecting the frame and pressing **Delete**) removes **only the frame**, not the blocks inside it. This is the "ungroup" operation — the blocks remain on the canvas with their connections intact. To delete the frame and its contents, expand the frame first, select all blocks inside, then delete them.

### Copying a Smart Group

Select the frame and press **Ctrl+C** / **Cmd+C**, then **Ctrl+V** / **Cmd+V** to paste a copy. The copy includes all blocks, their internal connections, and the frame's collapse/port exposure state.

---

## Sticky Notes (Ctrl+M)

Sticky notes are free-floating annotations you can place anywhere on the canvas to document sections of your graph.

### Creating a Sticky Note

Press **Ctrl+M** (or **Cmd+M** on macOS) to create a new sticky note at the current cursor position.

### Editing

- **Title:** Double-click the title bar to edit.
- **Body:** Click the body area and type — it is always editable.

### Moving and Resizing

- **Drag** the title bar to reposition the note.
- **Resize** by dragging the handle at the bottom-right corner.

### Selection and Deletion

Click a note to select it. Selected notes have a highlighted border. Press **Delete** or **Backspace** to remove selected notes. Multi-select with Ctrl+click or Shift+click.

### Persistence

Sticky notes are saved with the graph and restored on load. They also appear as yellow rectangles on the minimap.

---

## Find in Graph (Ctrl+F)

Search for nodes and frames in the current graph by name or block type.

### Opening the Search

Press **Ctrl+F** (or **Cmd+F** on macOS) to open the search bar in the top-right corner of the canvas.

### Searching

Type a query to filter. Matches include:

- **Node display name** (e.g., "Branch", "GetVariable")
- **Block class name** (e.g., "FlowGraphBranchBlock")
- **Frame name**

All matching items are outlined in yellow. The current match is highlighted in blue and the viewport pans to center on it.

### Navigating Results

- **Enter** or **Down Arrow** — go to the next match
- **Shift+Enter** or **Up Arrow** — go to the previous match
- Use the **up/down buttons** in the search bar
- Results wrap around (last → first and vice versa)

### Closing

Press **Escape** or click the **X** button to close the search bar. All highlights are removed.

---

## Tips

- **Use debug blocks liberally** — they're zero-cost when the graph isn't running and give you visibility into data flow.
- **Step through unfamiliar graphs** — set a breakpoint on the first block and use Step to trace the execution path.
- **Watch the flow animation** — in debug mode, the animated dots show you the actual order of execution, which can reveal unexpected paths.
- **Reset vs. Stop** — use Reset when you've modified the scene's state and need a clean slate; use Stop when you just want to halt execution.
- **Minimap** — when you zoom or pan, a minimap appears in the bottom-right corner showing all nodes, frames, and your current viewport. Click or drag on the minimap to navigate directly to that area. It auto-hides after 1.5 seconds of inactivity.

---

## Block Property Panel

Select a block on the canvas to view and edit its properties in the right-hand panel. The panel has up to four sections:

### General

Name, type, and comments for the selected block.

### Construction Variables

Shows constructor configuration fields that control how the block is created. These vary by block type. Examples:

| Block                          | Fields                                                   |
| ------------------------------ | -------------------------------------------------------- |
| Math blocks (Add, Subtract, …) | Type, Matrix per component, Prevent int/float arithmetic |
| Interpolation                  | Key frames count, Animation type                         |
| Custom event (Send/Receive)    | Event ID                                                 |
| ForLoop                        | Initial index, Increment when done                       |
| DoN                            | Start index                                              |
| Bitwise blocks                 | Value type                                               |
| GetProperty                    | Reset to default when undefined                          |
| Pointer/Pick events            | Stop propagation                                         |

> **Note:** Some construction variables (like key frames count) control the block's port structure. Changing them updates the saved config but may require re-creating the block for new ports to appear.

### Input Values

Editable default values for unconnected data-input ports. The following types are supported automatically: number, boolean, string, FlowGraphInteger, Vector2, Vector3, Vector4, Color3, Color4, and Matrix. Connected inputs are displayed as read-only.

### Properties

Additional properties registered with the `editableInPropertyPage` decorator on the block class.

### Specialized Property Panels

Some blocks have dedicated property panels that replace the generic panel with richer editing controls:

| Block(s)                                | Special Section           | Description                                                                                                                                                   |
| --------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GetAsset                                | Asset Configuration       | Type dropdown + named asset picker from the loaded scene.                                                                                                     |
| Pointer Down/Up/Move/Over/Out, MeshPick | Target Mesh               | Mesh dropdown picker from the loaded scene. Filters which mesh triggers the event.                                                                            |
| PlayAnimation                           | Animation Group           | AnimationGroup dropdown from the loaded scene. Sets the default animation group to play.                                                                      |
| Constant                                | Constant Value            | Type selector (Number, Integer, Boolean, String, Vector2/3, Color3/4, Matrix) + matching value editor. Changing the type updates the output port's rich type. |
| Switch                                  | Cases                     | Dynamic list of numeric case values with add/remove buttons. Each case creates a signal output.                                                               |
| DataSwitch                              | Cases                     | Numeric case list like Switch; also shows the `treatCasesAsIntegers` toggle. Each case creates a data input.                                                  |
| SetVariable (multi mode)                | Variables                 | Dynamic list of variable names with add/remove. Each variable creates a data input.                                                                           |
| Send/Receive Custom Event               | Event Data Inputs/Outputs | Key-type list editor. Add entries by name + FlowGraph-type dropdown. Each entry creates a data input (Send) or output (Receive).                              |

> **Scene-dependent pickers:** The mesh and animation-group pickers require a scene to be loaded in the Preview panel. Without a loaded scene, an info message is shown instead.
