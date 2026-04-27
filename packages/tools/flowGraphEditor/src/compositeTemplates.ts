/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Composite template definitions for the flow graph editor.
 * Each template describes a multi-block pattern that is instantiated as a group
 * when dropped onto the canvas from the palette.
 */

/**
 * A connection between two blocks within a template.
 */
export interface ITemplateConnection {
    /** Index of the source block in the template's blocks array */
    fromBlock: number;
    /** Name of the output port on the source block */
    fromPort: string;
    /** Index of the target block in the template's blocks array */
    toBlock: number;
    /** Name of the input port on the target block */
    toPort: string;
    /** Whether this is a signal (flow) connection vs. a data connection */
    isSignal: boolean;
}

/**
 * Configuration override for a block within a template.
 */
export interface ITemplateBlockConfig {
    /** The flow graph block class name */
    className: string;
    /** Optional config overrides passed to the block constructor */
    config?: Record<string, any>;
    /** X offset from the drop position */
    offsetX: number;
    /** Y offset from the drop position */
    offsetY: number;
}

/**
 * A composite template definition.
 */
export interface ICompositeTemplate {
    /** Display name in the palette */
    name: string;
    /** Description shown as a tooltip */
    description: string;
    /** Category within the Templates section */
    category: string;
    /** The blocks that make up this template */
    blocks: ITemplateBlockConfig[];
    /** Connections to wire up between the blocks after creation */
    connections: ITemplateConnection[];
}

// ─── Curated Templates ──────────────────────────────────────────────────────

const ClickToLog: ICompositeTemplate = {
    name: "Click → Log",
    description: "Log a message when a mesh is clicked",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphMeshPickEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 300, offsetY: 0 },
    ],
    connections: [{ fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true }],
};

const TimerLoop: ICompositeTemplate = {
    name: "Timer Loop",
    description: "Execute an action every N milliseconds using a tick + counter pattern",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphSceneTickEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphThrottleBlock", config: {}, offsetX: 300, offsetY: 0 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 600, offsetY: 0 },
    ],
    connections: [
        { fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true },
        { fromBlock: 1, fromPort: "out", toBlock: 2, toPort: "in", isSignal: true },
    ],
};

const ToggleBoolean: ICompositeTemplate = {
    name: "Toggle Boolean",
    description: "Toggle a boolean value on pointer down",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphPointerDownEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphFlipFlopBlock", config: {}, offsetX: 300, offsetY: 0 },
    ],
    connections: [{ fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true }],
};

const BranchOnCondition: ICompositeTemplate = {
    name: "Branch on Condition",
    description: "SceneReady → Branch into two flow paths",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphSceneReadyEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphBranchBlock", config: {}, offsetX: 300, offsetY: 0 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 600, offsetY: -60 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 600, offsetY: 100 },
    ],
    connections: [
        { fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true },
        { fromBlock: 1, fromPort: "true", toBlock: 2, toPort: "in", isSignal: true },
        { fromBlock: 1, fromPort: "false", toBlock: 3, toPort: "in", isSignal: true },
    ],
};

const SequenceChain: ICompositeTemplate = {
    name: "Sequence Chain",
    description: "Execute multiple actions in order from a single trigger",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphSceneReadyEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphSequenceBlock", config: {}, offsetX: 300, offsetY: 0 },
    ],
    connections: [{ fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true }],
};

const LerpAnimation: ICompositeTemplate = {
    name: "Lerp Animation",
    description: "Smoothly interpolate a value over time using scene tick",
    category: "Animation Patterns",
    blocks: [
        { className: "FlowGraphSceneTickEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphMathInterpolationBlock", config: {}, offsetX: 300, offsetY: 0 },
    ],
    connections: [{ fromBlock: 0, fromPort: "deltaTime", toBlock: 1, toPort: "b", isSignal: false }],
};

const DelayedAction: ICompositeTemplate = {
    name: "Delayed Action",
    description: "Start a delay, then execute an action when it completes",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphSceneReadyEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphSetDelayBlock", config: {}, offsetX: 300, offsetY: 0 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 600, offsetY: 0 },
    ],
    connections: [
        { fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true },
        { fromBlock: 1, fromPort: "done", toBlock: 2, toPort: "in", isSignal: true },
    ],
};

const CustomEventBridge: ICompositeTemplate = {
    name: "Custom Event Bridge",
    description: "Send and receive a custom event to decouple graph sections",
    category: "Communication",
    blocks: [
        { className: "FlowGraphSendCustomEventBlock", config: { eventId: "myEvent" }, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphReceiveCustomEventBlock", config: { eventId: "myEvent" }, offsetX: 400, offsetY: 0 },
    ],
    connections: [],
};

const GetSetProperty: ICompositeTemplate = {
    name: "Get → Set Property",
    description: "Read a property and write it back (use with a transform in between)",
    category: "glTF Interactivity",
    blocks: [
        { className: "FlowGraphGetPropertyBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphSetPropertyBlock", config: {}, offsetX: 350, offsetY: 0 },
    ],
    connections: [
        { fromBlock: 0, fromPort: "value", toBlock: 1, toPort: "value", isSignal: false },
        { fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true },
    ],
};

const GetSetVariable: ICompositeTemplate = {
    name: "Get → Set Variable",
    description: "Read a variable and write it back (use with a transform in between)",
    category: "glTF Interactivity",
    blocks: [
        { className: "FlowGraphGetVariableBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphSetVariableBlock", config: {}, offsetX: 350, offsetY: 0 },
    ],
    connections: [{ fromBlock: 0, fromPort: "value", toBlock: 1, toPort: "value", isSignal: false }],
};

const PointerInteraction: ICompositeTemplate = {
    name: "Pointer Interaction",
    description: "Pointer down + up events wired to separate actions",
    category: "Common Patterns",
    blocks: [
        { className: "FlowGraphPointerDownEventBlock", config: {}, offsetX: 0, offsetY: 0 },
        { className: "FlowGraphPointerUpEventBlock", config: {}, offsetX: 0, offsetY: 150 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 350, offsetY: 0 },
        { className: "FlowGraphConsoleLogBlock", config: {}, offsetX: 350, offsetY: 150 },
    ],
    connections: [
        { fromBlock: 0, fromPort: "out", toBlock: 2, toPort: "in", isSignal: true },
        { fromBlock: 1, fromPort: "out", toBlock: 3, toPort: "in", isSignal: true },
    ],
};

/**
 * All available composite templates, keyed by their display name.
 */
export const AllCompositeTemplates: Record<string, ICompositeTemplate> = {
    "Click → Log": ClickToLog,
    "Timer Loop": TimerLoop,
    "Toggle Boolean": ToggleBoolean,
    "Branch on Condition": BranchOnCondition,
    "Sequence Chain": SequenceChain,
    "Lerp Animation": LerpAnimation,
    "Delayed Action": DelayedAction,
    "Custom Event Bridge": CustomEventBridge,
    "Get → Set Property": GetSetProperty,
    "Get → Set Variable": GetSetVariable,
    "Pointer Interaction": PointerInteraction,
};

/**
 * Get templates organized by category for the palette.
 * @returns a map of category name → template names
 */
export function GetTemplatesByCategory(): Record<string, string[]> {
    const categories: Record<string, string[]> = {};
    for (const [name, template] of Object.entries(AllCompositeTemplates)) {
        if (!categories[template.category]) {
            categories[template.category] = [];
        }
        categories[template.category].push(name);
    }
    return categories;
}
