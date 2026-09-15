/**
 * Block type classification and associated colors for the flow graph editor.
 * Used on both the canvas node headers and the left-pane palette.
 */

/** The high-level block categories. */
export type FlowGraphBlockType = "event" | "execution" | "data" | "gltf";

/** Header/accent color per type. */
export const BlockTypeHeaderColor: Record<FlowGraphBlockType, string> = {
    event: "#B85C1F", // warm amber – entry points
    execution: "#2B579A", // steel blue – control flow & actions
    data: "#3B7A3C", // forest green – pure data
    gltf: "#7651A6", // purple – glTF/KHR import plumbing
};

/** Body background per type (header stays default black, matching other editors). */
export const BlockTypeBodyColor: Record<FlowGraphBlockType, string> = {
    event: "#B85C1F",
    execution: "#2B579A",
    data: "#3B7A3C",
    gltf: "#7651A6",
};

const _GltfBlockNames = new Set<string>(["FlowGraphGLTFDataProvider", "FlowGraphUnsupportedInteractivityBlock", "FlowGraphObjectReferenceBlock", "FlowGraphEventReferenceBlock"]);

/**
 * Event block class names (entry-point blocks that start execution).
 * Maintained separately because events ARE execution blocks but deserve
 * a distinct visual identity.
 */
const _EventBlockNames = new Set<string>([
    "FlowGraphSceneReadyEventBlock",
    "FlowGraphSceneTickEventBlock",
    "FlowGraphMeshPickEventBlock",
    "FlowGraphPointerEventBlock",
    "FlowGraphPointerDownEventBlock",
    "FlowGraphPointerUpEventBlock",
    "FlowGraphPointerMoveEventBlock",
    "FlowGraphPointerOverEventBlock",
    "FlowGraphPointerOutEventBlock",
    "FlowGraphReceiveCustomEventBlock",
    "FlowGraphKeyDownEventBlock",
    "FlowGraphKeyUpEventBlock",
]);

/**
 * Returns whether a block is an event source that starts an execution flow.
 * @param className block class name
 * @returns true for event-source blocks
 */
export function IsFlowGraphEventBlockName(className: string): boolean {
    return _EventBlockNames.has(className);
}

/**
 * Returns whether a block exists specifically to support glTF/KHR imports.
 * @param className block class name
 * @returns true for glTF-specific blocks
 */
export function IsGltfSpecificBlockName(className: string): boolean {
    return _GltfBlockNames.has(className);
}

/**
 * Determines the block type from a class name and optional runtime data.
 * @param className - the block's class name (e.g. "FlowGraphBranchBlock")
 * @param data - optional block instance; if provided and it has signalInputs it's treated as execution
 * @returns the block type
 */
export function GetBlockType(className: string, data?: any): FlowGraphBlockType {
    if (IsGltfSpecificBlockName(className)) {
        return "gltf";
    }
    if (IsFlowGraphEventBlockName(className)) {
        return "event";
    }
    // Runtime check: if the block instance has signalInputs it's an execution block
    if (data && data.signalInputs) {
        return "execution";
    }
    // Fallback: well-known execution categories by name pattern
    if (_IsExecutionByName(className)) {
        return "execution";
    }
    return "data";
}

/**
 * Names that are known execution blocks (have signal I/O) even without a runtime instance.
 * @param className - the block class name to check
 * @returns true if the block is an execution block
 */
function _IsExecutionByName(className: string): boolean {
    // Control flow
    if (/^FlowGraph(Branch|ForLoop|WhileLoop|Switch|Sequence|MultiGate|FlipFlop|DoN|WaitAll|SetDelay|CancelDelay|CallCounter|Debounce|Throttle)Block$/.test(className)) {
        return true;
    }
    // Animation
    if (/^FlowGraph(PlayAnimation|StopAnimation|PauseAnimation|Interpolation)Block$/.test(className)) {
        return true;
    }
    // Data access – only the mutating / action ones
    if (/^FlowGraph(SetProperty|SetVariable|SendCustomEvent|ConsoleLog|CodeExecution)Block$/.test(className)) {
        return true;
    }
    return false;
}
