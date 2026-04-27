import { type GraphNode } from "shared-ui-components/nodeGraphSystem/graphNode";
import { type GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphExecutionBlock } from "core/FlowGraph/flowGraphExecutionBlock";
import { type NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import { type ConnectionPointPortData } from "./connectionPointPortData";
import { type IPortData } from "shared-ui-components/nodeGraphSystem/interfaces/portData";

/**
 * Gets the connection kind ("data" or "signal") from a port data.
 * ConnectionPointPortData carries a `connectionKind` property but IPortData does not,
 * so we cast safely.
 * @param portData - the port data to check
 * @returns the connection kind or undefined
 */
function GetConnectionKind(portData: IPortData): "data" | "signal" | undefined {
    return (portData as ConnectionPointPortData).connectionKind;
}

/**
 * Checks if a port has any connections to nodes outside the given set.
 * @param port - the port to check
 * @param groupNodes - the set of nodes in the group
 * @returns true if the port connects to a node outside the group
 */
function IsConnectedOutside(port: NodePort, groupNodes: Set<GraphNode>): boolean {
    const links = port.node.links;
    for (const link of links) {
        if (link.portA?.portData === port.portData || link.portB?.portData === port.portData) {
            if (link.nodeA && !groupNodes.has(link.nodeA) && link.portA?.portData !== port.portData) {
                return true;
            }
            if (link.nodeB && !groupNodes.has(link.nodeB) && link.portB?.portData !== port.portData) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Result of analyzing a group of blocks for smart port exposure.
 */
export interface ISmartGroupAnalysis {
    /** Whether the group can be auto-configured (single execution block + data blocks) */
    isAutoConfigurable: boolean;
    /** Execution blocks found in the group */
    executionBlocks: GraphNode[];
    /** Data-only blocks found in the group */
    dataBlocks: GraphNode[];
    /** Ports that should be exposed as inputs on the frame boundary */
    exposedInputPorts: NodePort[];
    /** Ports that should be exposed as outputs on the frame boundary */
    exposedOutputPorts: NodePort[];
}

/**
 * Analyzes a set of graph nodes to determine which ports should be exposed
 * on a frame boundary for a "smart group".
 *
 * Rules:
 * - If there is exactly one execution block and the rest are data blocks,
 *   auto-expose the execution block's signal "in" as the group input and
 *   its signal outputs ("out", "done", "error") as group outputs.
 * - Any data ports on blocks inside the group that connect to blocks
 *   OUTSIDE the group are also exposed.
 * - Any unconnected data INPUT ports on blocks inside the group are exposed
 *   (they represent parameters the group needs from outside).
 *
 * For groups with multiple execution blocks, `isAutoConfigurable` is false
 * and callers should let the user designate entry/exit blocks via
 * `ApplySmartGroupWithDesignation`.
 *
 * @param nodes - the graph nodes in the group
 * @returns the analysis result
 */
export function AnalyzeSmartGroup(nodes: GraphNode[]): ISmartGroupAnalysis {
    const nodeSet = new Set(nodes);
    const executionBlocks: GraphNode[] = [];
    const dataBlocks: GraphNode[] = [];

    // Classify blocks
    for (const node of nodes) {
        const block = node.content?.data as FlowGraphBlock | undefined;
        if (!block) {
            continue;
        }
        if (block instanceof FlowGraphExecutionBlock) {
            executionBlocks.push(node);
        } else {
            dataBlocks.push(node);
        }
    }

    const isAutoConfigurable = executionBlocks.length === 1;

    const exposedInputPorts: NodePort[] = [];
    const exposedOutputPorts: NodePort[] = [];

    if (isAutoConfigurable) {
        const execNode = executionBlocks[0];

        // Expose signal "in" port(s) — these are the group entry points
        for (const port of execNode.inputPorts) {
            if (GetConnectionKind(port.portData) === "signal") {
                exposedInputPorts.push(port);
            }
        }

        // Expose signal output ports (out, done, error) — these are the group exit points
        for (const port of execNode.outputPorts) {
            if (GetConnectionKind(port.portData) === "signal") {
                exposedOutputPorts.push(port);
            }
        }
    }

    // For ALL blocks in the group, expose data ports that:
    // 1. Connect to blocks outside the group, OR
    // 2. Are unconnected input ports (parameters needed from outside)
    for (const node of nodes) {
        for (const port of node.inputPorts) {
            const kind = GetConnectionKind(port.portData);
            if (kind !== "data") {
                // Signal ports for non-auto cases are handled separately
                if (!isAutoConfigurable && kind === "signal") {
                    if (IsConnectedOutside(port, nodeSet) || !port.portData.isConnected) {
                        exposedInputPorts.push(port);
                    }
                }
                continue;
            }
            if (IsConnectedOutside(port, nodeSet) || !port.portData.isConnected) {
                exposedInputPorts.push(port);
            }
        }
        for (const port of node.outputPorts) {
            const kind = GetConnectionKind(port.portData);
            if (kind !== "data") {
                if (!isAutoConfigurable && kind === "signal") {
                    if (IsConnectedOutside(port, nodeSet)) {
                        exposedOutputPorts.push(port);
                    }
                }
                continue;
            }
            if (IsConnectedOutside(port, nodeSet)) {
                exposedOutputPorts.push(port);
            }
        }
    }

    return {
        isAutoConfigurable,
        executionBlocks,
        dataBlocks,
        exposedInputPorts,
        exposedOutputPorts,
    };
}

/**
 * Applies smart group port exposure to a frame.
 * Sets `isExposedOnFrame` on the appropriate ports so the frame
 * shows them on its boundary when collapsed.
 *
 * @param frame - the graph frame to configure
 * @param analysis - the smart group analysis result
 */
export function ApplySmartGroupExposure(frame: GraphFrame, analysis: ISmartGroupAnalysis): void {
    for (let i = 0; i < analysis.exposedInputPorts.length; i++) {
        analysis.exposedInputPorts[i].exposedOnFrame = true;
        analysis.exposedInputPorts[i].exposedPortPosition = i;
    }
    for (let i = 0; i < analysis.exposedOutputPorts.length; i++) {
        analysis.exposedOutputPorts[i].exposedOnFrame = true;
        analysis.exposedOutputPorts[i].exposedPortPosition = i;
    }
    frame.adjustPorts();
}

/**
 * Applies smart group port exposure based on user-designated entry/exit blocks.
 * All signal ports on entry blocks are exposed as frame inputs.
 * All signal ports on exit blocks are exposed as frame outputs.
 * Data ports that cross the frame boundary or are unconnected inputs are also exposed.
 *
 * @param frame - the graph frame to configure
 * @param nodes - all nodes in the frame
 * @param entryNodes - nodes designated as entry points (their signal inputs are exposed)
 * @param exitNodes - nodes designated as exit points (their signal outputs are exposed)
 */
export function ApplySmartGroupWithDesignation(frame: GraphFrame, nodes: GraphNode[], entryNodes: GraphNode[], exitNodes: GraphNode[]): void {
    const nodeSet = new Set(nodes);
    let inPos = 0;
    let outPos = 0;

    // Expose signal inputs on entry nodes
    for (const node of entryNodes) {
        for (const port of node.inputPorts) {
            if (GetConnectionKind(port.portData) === "signal") {
                port.exposedOnFrame = true;
                port.exposedPortPosition = inPos++;
            }
        }
    }

    // Expose signal outputs on exit nodes
    for (const node of exitNodes) {
        for (const port of node.outputPorts) {
            if (GetConnectionKind(port.portData) === "signal") {
                port.exposedOnFrame = true;
                port.exposedPortPosition = outPos++;
            }
        }
    }

    // Expose boundary data ports and unconnected data inputs
    for (const node of nodes) {
        for (const port of node.inputPorts) {
            if (GetConnectionKind(port.portData) === "data") {
                if (IsConnectedOutside(port, nodeSet) || !port.portData.isConnected) {
                    port.exposedOnFrame = true;
                    port.exposedPortPosition = inPos++;
                }
            }
        }
        for (const port of node.outputPorts) {
            if (GetConnectionKind(port.portData) === "data") {
                if (IsConnectedOutside(port, nodeSet)) {
                    port.exposedOnFrame = true;
                    port.exposedPortPosition = outPos++;
                }
            }
        }
    }

    frame.adjustPorts();
}
