/**
 * Help topic identifier.
 */
export type HelpTopicId =
    | "getting-started"
    | "graph-controls"
    | "time-scale"
    | "connections-types"
    | "debug-mode"
    | "breakpoints"
    | "debug-blocks"
    | "validation"
    | "copy-paste"
    | "smart-groups"
    | "keyboard-shortcuts"
    | "block-properties";

/**
 * A single help topic section (sub-heading within a topic).
 */
export interface IHelpSection {
    /** Optional sub-heading displayed above the content. */
    heading?: string;
    /** HTML content for this section. */
    html: string;
}

/**
 * A help topic with a title and one or more sections.
 */
export interface IHelpTopic {
    /** Unique topic identifier. */
    id: HelpTopicId;
    /** Display title for the topic. */
    title: string;
    /** Content sections within this topic. */
    sections: IHelpSection[];
}

/**
 * All help topics, derived from MANUAL.md content.
 */
export const HelpTopics: IHelpTopic[] = [
    {
        id: "getting-started",
        title: "Getting Started",
        sections: [
            {
                heading: "Loading a Scene",
                html: `<p>The editor can load a Babylon.js Playground snippet as a live scene to test your flow graph against.</p>
<ol>
<li>Open the <b>Scene Preview</b> panel (bottom-right).</li>
<li>Enter a Playground snippet ID (e.g. <code>ABC123</code>), a versioned ID (<code>ABC123#5</code>), or a full Playground URL.</li>
<li>Press <b>Enter</b> to load and run the scene.</li>
</ol>
<p>The loaded scene's objects (meshes, lights, cameras, etc.) become available as references in flow graph block configuration fields.</p>`,
            },
            {
                heading: "Saving and Loading Graphs",
                html: `<ul>
<li><b>Save to file</b> — Downloads a <code>flowGraph.json</code> file to your machine.</li>
<li><b>Save to snippet server</b> — Uploads the graph to the Babylon.js snippet server and copies the snippet ID to your clipboard. The scene snippet ID is saved alongside the graph so the scene auto-loads on restore.</li>
<li><b>Load from file</b> — Import a previously saved JSON file.</li>
<li><b>Load from snippet</b> — Enter a snippet ID to restore a graph (and its associated scene, if any).</li>
</ul>`,
            },
        ],
    },
    {
        id: "graph-controls",
        title: "Graph Controls",
        sections: [
            {
                html: `<p>The toolbar at the top provides execution controls:</p>
<table>
<tr><th>Button</th><th>Label</th><th>Description</th></tr>
<tr><td>▶</td><td><b>Start</b></td><td>Starts executing the flow graph. Enabled when the graph is stopped or paused.</td></tr>
<tr><td>⏸</td><td><b>Pause</b></td><td>Pauses execution. The graph can be resumed with Start.</td></tr>
<tr><td>⏹</td><td><b>Stop</b></td><td>Stops execution and resets execution state.</td></tr>
<tr><td>↺</td><td><b>Reset</b></td><td>Stops execution and reloads the scene from its snippet (if one was loaded).</td></tr>
</table>
<p>The <b>state indicator</b> next to the controls shows the current graph state: <code>Stopped</code>, <code>Running</code>, <code>Paused</code>, or <code>Breakpoint</code>.</p>`,
            },
        ],
    },
    {
        id: "time-scale",
        title: "Time Scale (Speed Control)",
        sections: [
            {
                html: `<p>The <b>Speed</b> buttons in the toolbar let you slow down or speed up the entire scene execution:</p>
<table>
<tr><th>Button</th><th>Effect</th></tr>
<tr><td><b>0.1×</b></td><td>10% speed — near frame-by-frame, useful for watching individual block executions</td></tr>
<tr><td><b>0.25×</b></td><td>25% speed — slow motion</td></tr>
<tr><td><b>0.5×</b></td><td>50% speed — half speed</td></tr>
<tr><td><b>1×</b></td><td>Normal speed (default)</td></tr>
<tr><td><b>2×</b></td><td>Double speed — fast forward</td></tr>
</table>
<p>The time scale affects <b>everything</b>: scene animations, FlowGraph delta time, interpolation blocks, async waits, timer-based logic, and render-loop code that reads engine delta time.</p>
<p>The active speed button is highlighted in orange. The selected speed persists when the scene is reloaded via Reset.</p>`,
            },
        ],
    },
    {
        id: "connections-types",
        title: "Connections & Types",
        sections: [
            {
                html: `<p>The editor enforces data type compatibility when connecting ports. Each data port has a <b>rich type</b> (e.g., Number, Vector3, Boolean) shown by its color. When dragging a connection:</p>
<ul>
<li><b>Compatible ports</b> glow bright when hovered (brightness boost).</li>
<li><b>Incompatible ports</b> glow red and appear dimmed when hovered, indicating the connection will be rejected.</li>
</ul>
<p>If you release the mouse on an incompatible port, an error dialog explains the type mismatch (e.g., "Type mismatch: cannot connect Vector3 to number").</p>`,
            },
            {
                heading: "Compatibility Rules",
                html: `<table>
<tr><th>Source Type</th><th>Accepted By</th></tr>
<tr><td>Any</td><td>All types (wildcard)</td></tr>
<tr><td>Same type</td><td>Always compatible</td></tr>
<tr><td>Number ↔ Integer</td><td>Interchangeable</td></tr>
<tr><td>Vector3, Vector4, Matrix → Quaternion</td><td>Accepted via type transformer</td></tr>
</table>
<p>Signal ports (execution flow) have no type restrictions — any signal output can connect to any signal input.</p>`,
            },
        ],
    },
    {
        id: "debug-mode",
        title: "Debug Mode",
        sections: [
            {
                heading: "Enabling Debug Mode",
                html: `<p>Click the <b>Debug</b> toggle button (🔍) in the toolbar. The button is highlighted when debug mode is active.</p>`,
            },
            {
                heading: "What Debug Mode Shows",
                html: `<ul>
<li><b>Block execution highlighting</b> — Blocks flash with a green glow when they execute.</li>
<li><b>Port activity</b> — Input ports that received data and output ports that fired glow green.</li>
<li><b>Flow animation</b> — Traveling dots animate along connections when signals fire or data flows, showing the direction and timing of execution.</li>
</ul>
<p><em>Debug mode adds some overhead. It throttles visual updates to 100ms per node to keep the editor responsive.</em></p>`,
            },
        ],
    },
    {
        id: "breakpoints",
        title: "Breakpoints",
        sections: [
            {
                heading: "Prerequisites",
                html: `<ul>
<li><b>Debug Mode must be enabled</b> — breakpoints only work when debug mode is active.</li>
<li>Breakpoints can only be set on <b>execution blocks</b> (blocks that have signal connections).</li>
</ul>`,
            },
            {
                heading: "Setting a Breakpoint",
                html: `<ol>
<li><b>Select</b> the execution block you want to break on.</li>
<li>Press <b>F9</b> to toggle the breakpoint.</li>
</ol>
<p>A <b>red dot</b> appears on the left side of the block header when a breakpoint is active.</p>`,
            },
            {
                heading: "Hitting a Breakpoint",
                html: `<p>When execution reaches a block with a breakpoint, the graph pauses immediately <b>before</b> that block executes. You'll see:</p>
<ul>
<li>The state indicator changes to <b>Breakpoint</b> (with a pulsing animation).</li>
<li>The breakpoint badge on the paused block glows yellow.</li>
<li>The <b>Continue</b> and <b>Step</b> buttons become enabled in the toolbar.</li>
</ul>`,
            },
            {
                heading: "Continue and Step",
                html: `<table>
<tr><th>Button</th><th>Label</th><th>Description</th></tr>
<tr><td>▶▶</td><td><b>Continue</b></td><td>Resumes normal execution until the next breakpoint (or completion).</td></tr>
<tr><td>▶|</td><td><b>Step</b></td><td>Executes only the current block, then pauses at the next execution block.</td></tr>
</table>
<p>Press <b>F9</b> on a selected block to toggle its breakpoint off. Stopping the graph does <b>not</b> clear breakpoints.</p>`,
            },
        ],
    },
    {
        id: "debug-blocks",
        title: "Debug Blocks (Value Probes)",
        sections: [
            {
                heading: "Adding a Debug Block",
                html: `<ol>
<li>Open the <b>Node List</b> panel (left sidebar).</li>
<li>Find <b>FlowGraphDebugBlock</b> under the <b>Utility</b> category.</li>
<li>Drag it onto the canvas.</li>
<li>Connect its <b>input</b> port to the data connection you want to observe.</li>
<li>Connect its <b>output</b> port to wherever the data needs to continue flowing.</li>
</ol>
<p>The debug block is a pure passthrough — it doesn't modify the data, so it's safe to insert anywhere in a data chain.</p>`,
            },
            {
                heading: "Reading Values",
                html: `<ul>
<li>Before any data flows, the block displays <b><code>?</code></b>.</li>
<li>Once the graph runs and data passes through, the block displays the most recent value.</li>
<li>The block stores a <b>log of the last 100 values</b> for inspection.</li>
</ul>`,
            },
            {
                heading: "Supported Data Types",
                html: `<table>
<tr><th>Type</th><th>Display Format</th></tr>
<tr><td>Number (float)</td><td>4 decimal places</td></tr>
<tr><td>Number (integer)</td><td>As-is</td></tr>
<tr><td>Boolean</td><td><code>true</code> / <code>false</code></td></tr>
<tr><td>String</td><td>Quoted string</td></tr>
<tr><td>Vector2</td><td>(x, y) — 3 decimals</td></tr>
<tr><td>Vector3</td><td>(x, y, z) — 3 decimals</td></tr>
<tr><td>Vector4</td><td>(x, y, z, w) — 3 decimals</td></tr>
<tr><td>Color3</td><td>(r, g, b) — 3 decimals</td></tr>
<tr><td>Color4</td><td>(r, g, b, a) — 3 decimals</td></tr>
<tr><td>Object</td><td>JSON (truncated to 64 chars)</td></tr>
<tr><td>Null/Undefined</td><td><code>null</code> / <code>undefined</code></td></tr>
</table>
<p><em>Debug blocks can only be connected to data ports, not signal ports.</em></p>`,
            },
        ],
    },
    {
        id: "validation",
        title: "Validation",
        sections: [
            {
                heading: "Manual Validation",
                html: `<p>Click the <b>Validate</b> button (✓) in the toolbar. The button shows a count of errors and warnings found. Click it again to log individual issues to the console (up to 20 at a time). Clicking an issue navigates to the relevant block in the graph.</p>`,
            },
            {
                heading: "Live Validation",
                html: `<p>Click the <b>Live Validation</b> toggle (⚡) to enable automatic validation whenever the graph changes. Validation runs on a debounced schedule so it doesn't slow down editing.</p>
<p>Validation issues include the block name, severity (error/warning), and a descriptive message.</p>`,
            },
        ],
    },
    {
        id: "copy-paste",
        title: "Copy & Paste",
        sections: [
            {
                html: `<p>Select one or more blocks and press <b>Ctrl+C</b> (or <b>Cmd+C</b> on macOS) to copy them. Press <b>Ctrl+V</b> (or <b>Cmd+V</b>) to paste copies at the cursor position.</p>
<ul>
<li>Cloned blocks retain all <b>config values</b> and <b>data input defaults</b> from the originals.</li>
<li>Signal and data connections are <b>not</b> copied — only internal connections between pasted blocks are re-established.</li>
<li>Event blocks are automatically registered with the flow graph.</li>
</ul>
<p>You can also copy and paste entire <b>frames</b> (groups) — select a frame and use Ctrl+C/V to duplicate it along with all its contained blocks.</p>`,
            },
        ],
    },
    {
        id: "smart-groups",
        title: "Smart Groups (Ctrl+G)",
        sections: [
            {
                heading: "Creating a Smart Group",
                html: `<ol>
<li>Select 2 or more blocks on the canvas (Ctrl+click or drag-select).</li>
<li>Press <b>Ctrl+G</b> (or <b>Cmd+G</b> on macOS).</li>
</ol>
<p>The editor analyzes the selected blocks and creates a collapsed frame with exposed boundary ports.</p>`,
            },
            {
                heading: "Auto-Configuration",
                html: `<p>If your selection contains <b>exactly one execution block</b> plus any number of data blocks:</p>
<ul>
<li>The execution block's <b>signal input</b> ("in") is exposed as the group's entry point.</li>
<li>The execution block's <b>signal outputs</b> ("out", "done", "error") are exposed as group exit points.</li>
<li>Any <b>data input ports</b> that are unconnected or connected to blocks outside the group are exposed.</li>
<li>Any <b>data output ports</b> connected to blocks outside the group are exposed.</li>
</ul>`,
            },
            {
                heading: "Ungrouping",
                html: `<p>Deleting a frame (selecting the frame and pressing <b>Delete</b>) removes <b>only the frame</b>, not the blocks inside it. The blocks remain on the canvas with their connections intact.</p>
<p>To delete the frame <b>and</b> its contents, expand the frame first, select all blocks inside, then delete them.</p>`,
            },
        ],
    },
    {
        id: "keyboard-shortcuts",
        title: "Keyboard Shortcuts",
        sections: [
            {
                heading: "General",
                html: `<table>
<tr><th>Key</th><th>Action</th></tr>
<tr><td><b>Ctrl+Z</b> / <b>Cmd+Z</b></td><td>Undo</td></tr>
<tr><td><b>Ctrl+Shift+Z</b> / <b>Cmd+Shift+Z</b></td><td>Redo</td></tr>
<tr><td><b>Ctrl+Y</b> / <b>Cmd+Y</b></td><td>Redo (alternative)</td></tr>
<tr><td><b>Ctrl+C</b> / <b>Cmd+C</b></td><td>Copy selected blocks (or frames)</td></tr>
<tr><td><b>Ctrl+V</b> / <b>Cmd+V</b></td><td>Paste copied blocks at cursor position</td></tr>
<tr><td><b>Delete</b> / <b>Backspace</b></td><td>Delete selected blocks or frame</td></tr>
<tr><td><b>Space</b></td><td>Open block search box at cursor position</td></tr>
</table>`,
            },
            {
                heading: "Graph Editing",
                html: `<table>
<tr><th>Key</th><th>Action</th></tr>
<tr><td><b>Ctrl+G</b> / <b>Cmd+G</b></td><td>Create a smart group from selected blocks</td></tr>
<tr><td><b>F9</b></td><td>Toggle breakpoint on selected execution block</td></tr>
<tr><td><b>Enter</b> (in scene preview input)</td><td>Load the Playground snippet</td></tr>
</table>`,
            },
        ],
    },
    {
        id: "block-properties",
        title: "Block Property Panel",
        sections: [
            {
                html: `<p>Select a block on the canvas to view and edit its properties in the right-hand panel. The panel has up to four sections:</p>`,
            },
            {
                heading: "General",
                html: `<p>Name, type, and comments for the selected block.</p>`,
            },
            {
                heading: "Construction Variables",
                html: `<p>Shows constructor configuration fields that control how the block is created. These vary by block type.</p>
<p><em>Some construction variables (like key frames count) control the block's port structure. Changing them updates the saved config but may require re-creating the block for new ports to appear.</em></p>`,
            },
            {
                heading: "Input Values",
                html: `<p>Editable default values for unconnected data-input ports. Primitive types (number, boolean, string, FlowGraphInteger) are shown automatically. Connected inputs are displayed as read-only.</p>`,
            },
            {
                heading: "Specialized Property Panels",
                html: `<p>Some blocks have dedicated property panels with richer editing controls:</p>
<table>
<tr><th>Block(s)</th><th>Description</th></tr>
<tr><td>GetAsset</td><td>Type dropdown + named asset picker from the loaded scene.</td></tr>
<tr><td>Pointer events, MeshPick</td><td>Mesh dropdown picker from the loaded scene.</td></tr>
<tr><td>PlayAnimation</td><td>AnimationGroup dropdown from the loaded scene.</td></tr>
<tr><td>Constant</td><td>Type selector + matching value editor. Changing the type updates the output port's rich type.</td></tr>
<tr><td>Switch / DataSwitch</td><td>Dynamic list of numeric case values with add/remove buttons.</td></tr>
<tr><td>SetVariable (multi)</td><td>Dynamic list of variable names with add/remove.</td></tr>
<tr><td>Send/Receive Custom Event</td><td>Key-type list editor for event data ports.</td></tr>
</table>
<p><em>Scene-dependent pickers require a scene to be loaded in the Preview panel.</em></p>`,
            },
        ],
    },
];
