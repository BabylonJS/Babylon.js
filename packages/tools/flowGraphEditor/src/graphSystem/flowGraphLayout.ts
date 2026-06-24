/**
 * Flow-aware automatic layout for the Flow Graph Editor.
 *
 * Unlike the generic dagre layout shared by the node editors (which treats every wire
 * equally), this layout understands flow-graph execution semantics:
 *  - Event / entry blocks anchor the start (left edge) of each independent flow.
 *  - Execution (signal) flow runs left-to-right; each downstream block sits in a later
 *    column than the block that triggers it.
 *  - When flow diverges, the branches are stacked vertically and the whole sub-tree of
 *    each branch occupies a contiguous vertical band below the previous branch.
 *  - Data-only provider blocks (constants, getters, ...) are parked one column to the left
 *    of the block they feed, as a secondary hint.
 *  - Unrelated flows (separate event chains) are laid out independently and then tiled into
 *    a roughly square grid, so a graph with many event chains never collapses into one tall
 *    column of blocks.
 *
 * The algorithm is deterministic, DOM-free and runs in O(V + E), so it can be unit-tested
 * in isolation and applied to very large generated graphs without the cost of dagre.
 */

/** A single node to be laid out. Connections reference other nodes by id. */
export interface IFlowLayoutNode {
    /** Unique numeric id of the node. */
    id: number;
    /** Rendered width of the node, in pixels. */
    width: number;
    /** Rendered height of the node, in pixels. */
    height: number;
    /** Whether the node is an event / entry block (anchored in the left-most column). */
    isEvent: boolean;
    /** Ids of nodes reached through execution (signal) output connections. */
    signalOut: number[];
    /** Ids of nodes reached through data output connections (used as a secondary hint). */
    dataOut: number[];
}

/** Options controlling spacing of the computed layout. */
export interface IFlowLayoutOptions {
    /** Horizontal gap between columns, in pixels. */
    horizontalGap?: number;
    /** Vertical gap between stacked nodes, in pixels. */
    verticalGap?: number;
    /** X coordinate of the left-most column. */
    startX?: number;
    /** Y coordinate of the top of every column. */
    startY?: number;
}

/** Computed top-left pixel position of a node. */
export interface IFlowLayoutPosition {
    /** X coordinate (left edge). */
    x: number;
    /** Y coordinate (top edge). */
    y: number;
}

const DefaultOptions: Required<IFlowLayoutOptions> = {
    horizontalGap: 80,
    verticalGap: 40,
    startX: 0,
    startY: 0,
};

/**
 * Maximum number of blocks stacked in a single column before the column is wrapped into a
 * compact block of sub-columns. Prevents a wide fan-out from becoming one very tall column.
 */
const MaxNodesPerColumn = 8;

/** Internal: a laid-out independent flow, positioned relative to its own (0, 0) origin. */
interface IComponentLayout {
    /** Positions of the component's nodes, relative to the component origin. */
    positions: Map<number, IFlowLayoutPosition>;
    /** Total width of the component's bounding box, in pixels. */
    width: number;
    /** Total height of the component's bounding box, in pixels. */
    height: number;
    /** Smallest node id contained in the component (used for deterministic tiling order). */
    minId: number;
}

/**
 * Computes a flow-aware layout for the supplied nodes.
 *
 * The graph is split into one flow per event / entry block (each event owns the blocks it
 * triggers), every flow is laid out left-to-right on its own, and the flows are then tiled
 * into a roughly square grid. This keeps execution flowing left-to-right while preventing a
 * single tall column of blocks when a graph contains many event chains.
 * @param nodes - The nodes to lay out.
 * @param options - Optional spacing overrides.
 * @returns A map from node id to its computed top-left pixel position.
 */
export function ComputeFlowGraphLayout(nodes: IFlowLayoutNode[], options?: IFlowLayoutOptions): Map<number, IFlowLayoutPosition> {
    const opts = { ...DefaultOptions, ...options };
    const positions = new Map<number, IFlowLayoutPosition>();
    if (nodes.length === 0) {
        return positions;
    }

    const byId = new Map<number, IFlowLayoutNode>();
    for (const node of nodes) {
        byId.set(node.id, node);
    }

    // Partition the graph into one flow per event / entry root: each root claims the blocks
    // reachable from it through execution (signal) wires. Shared downstream blocks are owned
    // by the first root that reaches them, data-only providers attach to a block they feed,
    // and anything left over forms its own flow. Keeping each flow anchored to a single event
    // lets many event chains tile into a grid instead of piling into one tall column.
    const hasSignalInGlobal = new Set<number>();
    for (const node of nodes) {
        for (const target of node.signalOut) {
            if (byId.has(target)) {
                hasSignalInGlobal.add(target);
            }
        }
    }

    const owner = new Map<number, number>();
    const claim = (rootId: number) => {
        if (owner.has(rootId)) {
            return;
        }
        const stack = [rootId];
        owner.set(rootId, rootId);
        while (stack.length > 0) {
            const current = stack.pop()!;
            for (const next of byId.get(current)!.signalOut) {
                if (byId.has(next) && !owner.has(next)) {
                    owner.set(next, rootId);
                    stack.push(next);
                }
            }
        }
    };

    // Roots in priority order: events, then signal-island entries (outgoing signal but no
    // incoming), then any remaining signal node (to break pure cycles deterministically).
    for (const node of nodes) {
        if (node.isEvent) {
            claim(node.id);
        }
    }
    for (const node of nodes) {
        if (!owner.has(node.id) && node.signalOut.length > 0 && !hasSignalInGlobal.has(node.id)) {
            claim(node.id);
        }
    }
    for (const node of nodes) {
        if (!owner.has(node.id) && node.signalOut.length > 0) {
            claim(node.id);
        }
    }

    // Attach data-only providers / isolated blocks to a flow they feed; iterate for chains.
    let attachChanged = true;
    while (attachChanged) {
        attachChanged = false;
        for (const node of nodes) {
            if (owner.has(node.id)) {
                continue;
            }
            let target: number | undefined;
            for (const id of [...node.signalOut, ...node.dataOut]) {
                if (owner.has(id)) {
                    target = owner.get(id);
                    break;
                }
            }
            if (target !== undefined) {
                owner.set(node.id, target);
                attachChanged = true;
            }
        }
    }
    // Anything still unowned (fully isolated) forms its own single-node flow.
    for (const node of nodes) {
        if (!owner.has(node.id)) {
            owner.set(node.id, node.id);
        }
    }

    const groupsById = new Map<number, IFlowLayoutNode[]>();
    for (const node of nodes) {
        const root = owner.get(node.id)!;
        let group = groupsById.get(root);
        if (!group) {
            group = [];
            groupsById.set(root, group);
        }
        group.push(node);
    }

    const laidOut = [...groupsById.values()].map((group) => LayoutComponent(group, opts));
    // Deterministic tiling order: by the smallest id each flow contains.
    laidOut.sort((a, b) => a.minId - b.minId);

    // Tile the independent flows into a roughly square grid (ceil(sqrt(n)) flows per row) so
    // the result never collapses into a single very tall column.
    const flowsPerRow = Math.max(1, Math.ceil(Math.sqrt(laidOut.length)));
    const componentGapX = opts.horizontalGap * 2;
    const componentGapY = opts.verticalGap * 2;
    let rowX = opts.startX;
    let rowY = opts.startY;
    let rowHeight = 0;
    for (let i = 0; i < laidOut.length; i++) {
        if (i > 0 && i % flowsPerRow === 0) {
            rowX = opts.startX;
            rowY += rowHeight + componentGapY;
            rowHeight = 0;
        }
        const component = laidOut[i];
        for (const [id, position] of component.positions) {
            positions.set(id, { x: position.x + rowX, y: position.y + rowY });
        }
        rowX += component.width + componentGapX;
        rowHeight = Math.max(rowHeight, component.height);
    }

    return positions;
}

/**
 * Lays out a single independent flow relative to its own (0, 0) origin.
 * @param nodes - The nodes belonging to one connected flow.
 * @param opts - Resolved spacing options.
 * @returns The component's node positions and bounding-box size.
 */
function LayoutComponent(nodes: IFlowLayoutNode[], opts: Required<IFlowLayoutOptions>): IComponentLayout {
    const positions = new Map<number, IFlowLayoutPosition>();
    const byId = new Map<number, IFlowLayoutNode>();
    let minId = Number.POSITIVE_INFINITY;
    for (const node of nodes) {
        byId.set(node.id, node);
        minId = Math.min(minId, node.id);
    }

    // Forward signal edges kept for layering. Back-edges (e.g. loop bodies) are dropped
    // during the DFS so the loop body still flows rightward instead of running away.
    const forwardSucc = new Map<number, number[]>();
    for (const node of nodes) {
        forwardSucc.set(node.id, []);
    }

    const hasSignalIn = new Set<number>();
    for (const node of nodes) {
        for (const target of node.signalOut) {
            if (byId.has(target)) {
                hasSignalIn.add(target);
            }
        }
    }

    const visited = new Set<number>();
    const onStack = new Set<number>();
    const orderIndex = new Map<number, number>();
    let orderCounter = 0;

    // Iterative DFS that records a pre-order index (used to keep branch sub-trees grouped)
    // and classifies signal edges into forward (kept) vs back (dropped) edges.
    const dfs = (rootId: number) => {
        if (visited.has(rootId)) {
            return;
        }
        const stack: { id: number; i: number }[] = [{ id: rootId, i: 0 }];
        visited.add(rootId);
        onStack.add(rootId);
        orderIndex.set(rootId, orderCounter++);
        while (stack.length > 0) {
            const frame = stack[stack.length - 1];
            const node = byId.get(frame.id)!;
            if (frame.i < node.signalOut.length) {
                const childId = node.signalOut[frame.i++];
                if (!byId.has(childId) || onStack.has(childId)) {
                    // Missing target or a back-edge to an ancestor: skip.
                    continue;
                }
                forwardSucc.get(frame.id)!.push(childId);
                if (!visited.has(childId)) {
                    visited.add(childId);
                    onStack.add(childId);
                    orderIndex.set(childId, orderCounter++);
                    stack.push({ id: childId, i: 0 });
                }
            } else {
                onStack.delete(frame.id);
                stack.pop();
            }
        }
    };

    // Roots, in priority order: events first, then signal-island entries (a block with
    // outgoing signal flow but no incoming signal), then any remaining signal node (to
    // break pure cycles). Keeping the supplied order makes the result deterministic.
    for (const node of nodes) {
        if (node.isEvent) {
            dfs(node.id);
        }
    }
    for (const node of nodes) {
        if (!visited.has(node.id) && node.signalOut.length > 0 && !hasSignalIn.has(node.id)) {
            dfs(node.id);
        }
    }
    for (const node of nodes) {
        if (!visited.has(node.id) && node.signalOut.length > 0) {
            dfs(node.id);
        }
    }

    // Longest-path column assignment over the forward (acyclic) signal graph.
    const column = new Map<number, number>();
    const indegree = new Map<number, number>();
    for (const id of visited) {
        indegree.set(id, 0);
    }
    for (const [, succs] of forwardSucc) {
        for (const v of succs) {
            indegree.set(v, (indegree.get(v) ?? 0) + 1);
        }
    }
    const queue: number[] = [];
    for (const id of visited) {
        if ((indegree.get(id) ?? 0) === 0) {
            column.set(id, 0);
            queue.push(id);
        }
    }
    let head = 0;
    while (head < queue.length) {
        const u = queue[head++];
        const cu = column.get(u) ?? 0;
        for (const v of forwardSucc.get(u) ?? []) {
            const cv = Math.max(column.get(v) ?? 0, cu + 1);
            column.set(v, cv);
            const remaining = (indegree.get(v) ?? 0) - 1;
            indegree.set(v, remaining);
            if (remaining === 0) {
                queue.push(v);
            }
        }
    }

    // Sort key drives vertical order inside a column. Visited nodes use their DFS pre-order
    // so that branch sub-trees stay grouped and diverging branches stack top-to-bottom.
    const sortKey = new Map<number, number>();
    for (const [id, idx] of orderIndex) {
        sortKey.set(id, idx);
    }

    // Place data-only / isolated nodes that never participate in signal flow. A provider is
    // parked one column to the left of the earliest block it feeds, just above that block.
    // Iterate to resolve short provider chains; anything left over is parked in column 0.
    let changed = true;
    let guard = 0;
    while (changed && guard <= nodes.length) {
        changed = false;
        guard++;
        for (const node of nodes) {
            if (column.has(node.id)) {
                continue;
            }
            const consumers = [...node.signalOut, ...node.dataOut].filter((id) => byId.has(id) && column.has(id));
            if (consumers.length === 0) {
                continue;
            }
            let minColumn = Number.POSITIVE_INFINITY;
            let minKey = Number.POSITIVE_INFINITY;
            for (const id of consumers) {
                minColumn = Math.min(minColumn, column.get(id)!);
                minKey = Math.min(minKey, sortKey.get(id) ?? 0);
            }
            column.set(node.id, Math.max(0, minColumn - 1));
            sortKey.set(node.id, minKey - 0.5);
            changed = true;
        }
    }
    for (const node of nodes) {
        if (!column.has(node.id)) {
            column.set(node.id, 0);
            sortKey.set(node.id, orderCounter++);
        }
    }

    // Group nodes by column, compute per-column widths, then stack nodes vertically inside
    // each column in sort-key order. Stacking with real heights guarantees no overlap.
    const columns = new Map<number, IFlowLayoutNode[]>();
    for (const node of nodes) {
        const c = column.get(node.id)!;
        let bucket = columns.get(c);
        if (!bucket) {
            bucket = [];
            columns.set(c, bucket);
        }
        bucket.push(node);
    }

    const sortedColumns = [...columns.keys()].sort((a, b) => a - b);
    let cursorX = 0;
    let width = 0;
    let height = 0;
    for (const c of sortedColumns) {
        const bucket = columns.get(c)!;
        // Events always lead their column so they read as the start of every flow; the rest
        // keep their DFS / consumer-relative order.
        bucket.sort((a, b) => {
            if (a.isEvent !== b.isEvent) {
                return a.isEvent ? -1 : 1;
            }
            return sortKey.get(a.id)! - sortKey.get(b.id)! || a.id - b.id;
        });
        // A wide fan-out would otherwise become one very tall column; wrap large columns into
        // a compact block of sub-columns (kept roughly square) instead.
        const count = bucket.length;
        const rowsPerColumn = count > MaxNodesPerColumn ? Math.ceil(Math.sqrt(count)) : count;
        let subCursorX = cursorX;
        for (let start = 0; start < count; start += rowsPerColumn) {
            let subWidth = 0;
            let subCursorY = 0;
            for (let r = 0; r < rowsPerColumn && start + r < count; r++) {
                const node = bucket[start + r];
                positions.set(node.id, { x: subCursorX, y: subCursorY });
                subCursorY += node.height + opts.verticalGap;
                subWidth = Math.max(subWidth, node.width);
                height = Math.max(height, subCursorY - opts.verticalGap);
            }
            subCursorX += subWidth + opts.horizontalGap;
        }
        cursorX = subCursorX;
        width = cursorX - opts.horizontalGap;
    }

    return { positions, width, height, minId };
}
