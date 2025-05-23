// eslint-disable-next-line import/no-internal-modules
import type { Nullable } from "core/index";

/**
 * Performs a topological sort on a graph.
 * @param graph The set of nodes that make up the graph.
 * @param getAdjacentNodes A function that returns the adjacent nodes for a given node.
 * @param onSortedNode A function that is called for each node in the sorted order.
 * @remarks
 * This function allocates. Do not use it in the hot path. Instead use an instance of GraphUtils.
 */
export function SortGraph<NodeT>(graph: Iterable<NodeT>, getAdjacentNodes: (node: NodeT) => Iterable<NodeT>, onSortedNode: (node: NodeT) => void) {
    const sorter = new GraphUtils<NodeT>();
    sorter.sort(graph, getAdjacentNodes, onSortedNode);
}

/**
 * Traverses a graph.
 * @param graph The set of nodes that make up the graph.
 * @param getAdjacentNodes A function that returns the adjacent nodes for a given node.
 * @param onBeforeTraverse A function that is called before traversing each node.
 * @param onAfterTraverse A function that is called after traversing each node.
 * @remarks
 * This function allocates. Do not use it in the hot path. Instead use an instance of GraphUtils.
 */
export function TraverseGraph<NodeT>(
    graph: Iterable<NodeT>,
    getAdjacentNodes: (node: NodeT) => Nullable<Iterable<NodeT>>,
    onBeforeTraverse?: (node: NodeT) => void,
    onAfterTraverse?: (node: NodeT) => void
) {
    const traverser = new GraphUtils<NodeT>();
    traverser.traverse(graph, getAdjacentNodes, onBeforeTraverse, onAfterTraverse);
}

/**
 * A utility class for performing graph operations.
 * @remarks
 * The class allocates new objects, but each operation (e.g. sort, traverse) is allocation free. This is useful when used in the hot path.
 */
export class GraphUtils<DefaultNodeT = unknown> {
    // Tracks three states:
    // 1. No entry for the node - this means the node has not been encountered yet during any traversal
    // 2. Entry with value false - this means the node is currently being traversed (needed to detect cycles)
    // 3. Entry with value true - this means the node has already been fully traversed (and cycles were not detected)
    private readonly _traversalState = new Map<DefaultNodeT, boolean>();
    private _isTraversing = false;

    /**
     * Performs a topological sort on a graph.
     * @param graph The set of nodes that make up the graph.
     * @param getAdjacentNodes A function that returns the adjacent nodes for a given node.
     * @param onSortedNode A function that is called for each node in the sorted order.
     */
    public sort<NodeT extends DefaultNodeT>(graph: Iterable<NodeT>, getAdjacentNodes: (node: NodeT) => Iterable<NodeT>, onSortedNode: (node: NodeT) => void) {
        this.traverse(graph, getAdjacentNodes, undefined, onSortedNode);
    }

    /**
     * Traverses a graph.
     * @param graph The set of nodes that make up the graph.
     * @param getAdjacentNodes A function that returns the adjacent nodes for a given node.
     * @param onBeforeTraverse A function that is called before traversing each node.
     * @param onAfterTraverse A function that is called after traversing each node.
     */
    public traverse<NodeT extends DefaultNodeT>(
        graph: Iterable<NodeT>,
        getAdjacentNodes: (node: NodeT) => Nullable<Iterable<NodeT>>,
        onBeforeTraverse?: (node: NodeT) => void,
        onAfterTraverse?: (node: NodeT) => void
    ) {
        // Since the traversal state is re-used, disallow re-entrancy through the getAdjacentNodes or onBeforeTraverse or onAfterTraverse callbacks.
        if (this._isTraversing) {
            throw new Error("This TopologicalSorter instance is already traversing.");
        }

        this._isTraversing = true;

        try {
            for (const node of graph) {
                this._traverseCore(node, getAdjacentNodes, onBeforeTraverse, onAfterTraverse);
            }
        } finally {
            this._isTraversing = false;
            this._traversalState.clear();
        }
    }

    private _traverseCore<NodeT extends DefaultNodeT>(
        node: NodeT,
        getAdjacentNodes: (node: NodeT) => Nullable<Iterable<NodeT>>,
        onBeforeTraverse?: (node: NodeT) => void,
        onAfterTraverse?: (node: NodeT) => void
    ) {
        if (this._traversalState.get(node) !== true) {
            if (this._traversalState.get(node) === false) {
                throw new Error("Graph has cycle.");
            }

            this._traversalState.set(node, false);
            onBeforeTraverse?.(node);

            const adjacentNodes = getAdjacentNodes(node);
            if (adjacentNodes) {
                for (const adjacentNode of adjacentNodes) {
                    this._traverseCore(adjacentNode, getAdjacentNodes, onBeforeTraverse, onAfterTraverse);
                }
            }

            this._traversalState.set(node, true);
            onAfterTraverse?.(node);
        }
    }
}
