import { type ComponentType } from "react";

import { type IDisposable, type IReadonlyObservable } from "core/index";

import { UniqueIdGenerator } from "core/Misc/uniqueIdGenerator";

/**
 * The value used to uniquely identify a node within the Explorer tree (e.g. for expansion state).
 * This matches the Fluent `TreeItemValue` type.
 */
export type ExplorerNodeValue = string | number;

/**
 * Information about how to display a node in the Explorer tree.
 */
export type ExplorerDisplayInfo = Partial<IDisposable> &
    Readonly<{
        /**
         * The name of the node to display in the Explorer tree.
         */
        name: string;

        /**
         * An observable that notifies when the display info (such as the name) changes.
         */
        onChange?: IReadonlyObservable<void>;

        /**
         * An optional validation error message for this node. When present, the node's
         * icon is replaced with a warning icon whose tooltip displays this message.
         */
        validationError?: string;
    }>;

/**
 * Configuration for drag-and-drop behavior within a branch of the Explorer tree.
 * The configuration applies to the node it is specified on as well as all of its descendants.
 */
export type ExplorerDragDropConfig<T> = Readonly<{
    /**
     * Determines whether an entity can be dragged.
     * @param entity The entity to check.
     * @returns True if the entity can be dragged, false otherwise.
     */
    canDrag: (entity: T) => boolean;

    /**
     * Determines whether an entity can be dropped onto a target.
     * @param draggedEntity The entity being dragged.
     * @param targetEntity The potential drop target entity, or null if dropping onto the branch root.
     * @returns True if the drop is allowed, false otherwise.
     */
    canDrop: (draggedEntity: T, targetEntity: T | null) => boolean;

    /**
     * Called when a drag-and-drop operation completes.
     * @param draggedEntity The entity that was dragged.
     * @param targetEntity The entity it was dropped onto, or null if dropped onto the branch root.
     */
    onDrop: (draggedEntity: T, targetEntity: T | null) => void;
}>;

type InlineCommand = {
    /**
     * An icon component to render for the command. Required for inline commands.
     */
    icon: ComponentType;

    /**
     * The mode of the command. Inline commands are shown directly in the tree item layout. Inline by default.
     */
    mode?: "inline";
};

type ContextMenuCommand = {
    /**
     * An icon component to render for the command. Optional for context menu commands.
     */
    icon?: ComponentType;

    /**
     * The mode of the command. Context menu commands are shown in the context menu for the tree item.
     */
    mode: "contextMenu";
};

/**
 * The supported command modes (inline or context menu).
 */
export type ExplorerCommandMode = NonNullable<(InlineCommand | ContextMenuCommand)["mode"]>;

type ActionCommand = {
    readonly type: "action";

    /**
     * The function that executes the command.
     */
    execute(): unknown | Promise<unknown>;
};

type ToggleCommand = {
    readonly type: "toggle";

    /**
     * A boolean indicating if the command is enabled.
     */
    isEnabled: boolean;
};

/**
 * The supported command types (action or toggle).
 */
export type ExplorerCommandType = (ActionCommand | ToggleCommand)["type"];

/**
 * Describes a command that can be executed on a node in the Explorer.
 */
export type ExplorerCommand<ModeT extends ExplorerCommandMode = ExplorerCommandMode, TypeT extends ExplorerCommandType = ExplorerCommandType> = Partial<IDisposable> &
    Readonly<{
        /**
         * The display name of the command (e.g. "Delete", "Rename", etc.).
         */
        displayName: string;

        /**
         * An optional array of hotkeys that trigger the command.
         */
        hotKey?: {
            keyCode: string;
            control?: boolean;
            alt?: boolean;
            shift?: boolean;
            meta?: boolean;
        };

        /**
         * An observable that notifies when the command state changes.
         */
        onChange?: IReadonlyObservable<unknown>;
    }> &
    (ModeT extends "inline" ? InlineCommand : ContextMenuCommand) &
    (TypeT extends "action" ? ActionCommand : ToggleCommand);

/**
 * Provides a command for a specific context (an entity or a group name) in the Explorer.
 */
export type ExplorerCommandProvider<ContextT, ModeT extends ExplorerCommandMode = ExplorerCommandMode, TypeT extends ExplorerCommandType = ExplorerCommandType> = Readonly<{
    /**
     * An optional order for the command, relative to other commands.
     * Defaults to 0.
     */
    order?: number;

    /**
     * A predicate function that determines if the command is applicable to the given context.
     */
    predicate: (context: unknown) => context is ContextT;

    /**
     * Gets the command information for the given context.
     */
    getCommand: (context: ContextT) => ExplorerCommand<ModeT, TypeT>;
}>;

/**
 * The visual treatment used for a node in the Explorer tree.
 * - "root": The single top level node representing the object being inspected (e.g. a Scene or an Engine).
 * - "group": A heading style node (e.g. "Nodes", "Materials", "Auxiliary Surfaces").
 * - "item": A standard node representing an entity within the tree (e.g. a mesh or a material).
 */
export type ExplorerNodeKind = "root" | "group" | "item";

/**
 * Describes a single node of the Explorer tree.
 *
 * This is the generic (product agnostic) model the Explorer renders. Each node describes its own
 * presentation and enumerates its own children, which means an Explorer hierarchy can be arbitrarily
 * deep and fully heterogeneous (nodes of different kinds, backed by unrelated entity types, can be
 * freely nested within each other).
 */
export type ExplorerNodeDescription = Readonly<{
    /**
     * An identifier for the node that is stable across rebuilds and unique among its siblings.
     */
    id: string;

    /**
     * The visual treatment used for this node. Defaults to "item".
     */
    kind?: ExplorerNodeKind;

    /**
     * The entity represented by this node, if any.
     * Nodes with an entity are selectable and are always displayed.
     * Nodes without an entity are purely structural, are not selectable, and are only displayed when they have visible children.
     */
    entity?: object;

    /**
     * Gets the display information for this node.
     * This is ideally "live" display info (e.g. updates to the display info are taken into account and communicated via the observable).
     * This means in many cases the display info will need to be disposed when it is no longer needed so observable registrations can be removed.
     */
    getDisplayInfo: () => ExplorerDisplayInfo;

    /**
     * An optional icon component to render for the node.
     */
    icon?: ComponentType<{ entity: object }>;

    /**
     * Enumerates the children of this node. Children may be of any kind and may describe entirely different entity types.
     */
    getChildren?: () => readonly ExplorerNodeDescription[];

    /**
     * Optional configuration for drag-and-drop behavior within this node.
     * Descendants inherit this configuration unless they specify their own.
     * If not provided (and not inherited), drag-and-drop is disabled for the node.
     */
    dragDropConfig?: ExplorerDragDropConfig<object>;

    /**
     * A function that returns observables that notify when descendants of this node are added.
     */
    getAddedObservables?: () => readonly IReadonlyObservable<unknown>[];

    /**
     * A function that returns observables that notify when descendants of this node are removed.
     */
    getRemovedObservables?: () => readonly IReadonlyObservable<object>[];

    /**
     * A function that returns observables that notify when descendants of this node are moved (e.g. re-parented).
     */
    getMovedObservables?: () => readonly IReadonlyObservable<unknown>[];
}>;

/**
 * A materialized node of the Explorer tree, produced by {@link BuildExplorerTree}.
 */
export type ExplorerNode = {
    /**
     * The visual treatment used for this node.
     */
    readonly kind: ExplorerNodeKind;

    /**
     * The value that uniquely identifies this node within the tree (e.g. for expansion state).
     */
    readonly value: ExplorerNodeValue;

    /**
     * The one based depth of this node within the tree (used for indentation and accessibility).
     */
    readonly depth: number;

    /**
     * The parent of this node, or undefined for top level nodes.
     */
    readonly parent?: ExplorerNode;

    /**
     * The visible children of this node.
     */
    readonly children: ExplorerNode[];

    /**
     * The entity represented by this node, or undefined if this node is purely structural.
     */
    readonly entity?: object;

    /**
     * An optional icon component to render for the node.
     */
    readonly icon?: ComponentType<{ entity: object }>;

    /**
     * Gets the (possibly live) display info for this node.
     */
    readonly getDisplayInfo: () => ExplorerDisplayInfo;

    /**
     * The drag-and-drop configuration that applies to this node (either its own or inherited from an ancestor).
     */
    readonly dragDropConfig?: ExplorerDragDropConfig<object>;
};

/**
 * The result of materializing a set of {@link ExplorerNodeDescription}s into a tree.
 */
export type ExplorerTree = {
    /**
     * The visible top level nodes, in the order they were described.
     */
    readonly nodes: readonly ExplorerNode[];

    /**
     * All visible nodes, keyed by their tree value.
     */
    readonly nodesByValue: ReadonlyMap<ExplorerNodeValue, ExplorerNode>;

    /**
     * All visible nodes that represent an entity, keyed by that entity.
     */
    readonly nodesByEntity: ReadonlyMap<object, ExplorerNode>;

    /**
     * The observables (gathered from every described node, including nodes that are not currently visible)
     * that notify when the topology of the tree changes.
     */
    readonly changeObservables: {
        readonly added: readonly IReadonlyObservable<unknown>[];
        readonly removed: readonly IReadonlyObservable<object>[];
        readonly moved: readonly IReadonlyObservable<unknown>[];
    };
};

const SyntheticEntityIds = new WeakMap<object, number>();

/**
 * Gets a stable identifier for an entity. If the entity has a numeric `uniqueId` property it is used,
 * otherwise a synthetic id is generated and cached for the lifetime of the entity.
 * @param entity The entity to get an identifier for.
 * @returns A stable numeric identifier for the entity.
 */
export function GetEntityId(entity: object): number {
    if ("uniqueId" in entity && typeof entity.uniqueId === "number") {
        return entity.uniqueId;
    }

    let id = SyntheticEntityIds.get(entity);
    if (!id) {
        SyntheticEntityIds.set(entity, (id = UniqueIdGenerator.UniqueId));
    }
    return id;
}

/**
 * Determines whether a node should be displayed in the Explorer tree.
 * Nodes that represent an entity are always displayed (they are selectable and meaningful on their own),
 * while purely structural nodes are only displayed when they have at least one visible child.
 * @param node A node with an optional entity and a set of already filtered (visible) children.
 * @returns True if the node should be displayed, false otherwise.
 */
export function ShouldDisplayNode(node: { readonly entity?: object; readonly children: readonly unknown[] }): boolean {
    return node.entity !== undefined || node.children.length > 0;
}

/**
 * Gets the children of a node in display order. Group nodes always precede item nodes (and retain the
 * order in which they were described), while item nodes are optionally sorted alphabetically.
 * @param node The node whose children should be ordered.
 * @param sortItems Whether item nodes should be sorted alphabetically by display name.
 * @returns The ordered children of the node.
 */
export function GetOrderedChildren(node: ExplorerNode, sortItems: boolean): readonly ExplorerNode[] {
    const groups: ExplorerNode[] = [];
    const items: ExplorerNode[] = [];

    for (const child of node.children) {
        if (child.kind === "item") {
            items.push(child);
        } else {
            groups.push(child);
        }
    }

    if (sortItems) {
        items.sort((left, right) => {
            const leftDisplayInfo = left.getDisplayInfo();
            const rightDisplayInfo = right.getDisplayInfo();
            const comparison = leftDisplayInfo.name.localeCompare(rightDisplayInfo.name);
            leftDisplayInfo.dispose?.();
            rightDisplayInfo.dispose?.();
            return comparison;
        });
    }

    return groups.length === 0 ? items : [...groups, ...items];
}

/**
 * Materializes a set of node descriptions into an Explorer tree.
 *
 * Nodes are visited recursively so that arbitrarily nested, heterogeneous hierarchies are supported.
 * Structural nodes (nodes without an entity) that end up with no visible children are omitted from the
 * resulting tree, but their change observables are still gathered so the tree can be rebuilt when they
 * gain children.
 * @param descriptions The top level node descriptions.
 * @returns The materialized tree, along with lookup maps and the gathered change observables.
 */
export function BuildExplorerTree(descriptions: readonly ExplorerNodeDescription[]): ExplorerTree {
    const nodes: ExplorerNode[] = [];
    const nodesByValue = new Map<ExplorerNodeValue, ExplorerNode>();
    const nodesByEntity = new Map<object, ExplorerNode>();
    const added: IReadonlyObservable<unknown>[] = [];
    const removed: IReadonlyObservable<object>[] = [];
    const moved: IReadonlyObservable<unknown>[] = [];

    const buildNode = (description: ExplorerNodeDescription, parent: ExplorerNode | undefined, parentPath: string): ExplorerNode | undefined => {
        // Change observables are gathered even for nodes that end up hidden so that a hidden node
        // (e.g. an empty section) can become visible as soon as it gains a child.
        added.push(...(description.getAddedObservables?.() ?? []));
        removed.push(...(description.getRemovedObservables?.() ?? []));
        moved.push(...(description.getMovedObservables?.() ?? []));

        const path = parentPath ? `${parentPath}/${description.id}` : description.id;
        const node: ExplorerNode = {
            kind: description.kind ?? "item",
            // Entity backed nodes are keyed by entity identity so expansion state survives re-parenting and reordering.
            value: description.entity ? GetEntityId(description.entity) : path,
            depth: (parent?.depth ?? 0) + 1,
            parent,
            children: [],
            entity: description.entity,
            icon: description.icon,
            getDisplayInfo: description.getDisplayInfo,
            dragDropConfig: description.dragDropConfig ?? parent?.dragDropConfig,
        };

        for (const childDescription of description.getChildren?.() ?? []) {
            const child = buildNode(childDescription, node, path);
            if (child) {
                node.children.push(child);
            }
        }

        if (!ShouldDisplayNode(node)) {
            return undefined;
        }

        nodesByValue.set(node.value, node);
        if (node.entity) {
            nodesByEntity.set(node.entity, node);
        }

        return node;
    };

    for (const description of descriptions) {
        const node = buildNode(description, undefined, "");
        if (node) {
            nodes.push(node);
        }
    }

    return { nodes, nodesByValue, nodesByEntity, changeObservables: { added, removed, moved } };
}

/**
 * Options that control which nodes of an Explorer tree are visible.
 */
export type ExplorerVisibilityOptions = Readonly<{
    /**
     * The values of the nodes that are currently expanded.
     */
    openItems: ReadonlySet<ExplorerNodeValue>;

    /**
     * A lower case filter string. When non-empty, the expansion state is ignored and only matching
     * nodes (and their ancestors) are visible.
     */
    filter: string;

    /**
     * Whether item nodes should be sorted alphabetically by display name.
     */
    sortItems: boolean;
}>;

/**
 * Computes the flattened, ordered list of nodes that should currently be rendered.
 *
 * Only nodes that represent an entity participate in filter matching. Purely structural nodes
 * (e.g. the "Nodes" or "Materials" sections) become visible when one of their descendants matches.
 * The root node is always visible.
 * @param nodes The top level nodes of the tree.
 * @param options Options controlling expansion, filtering, and sorting.
 * @returns The nodes to render, in tree order.
 */
export function GetVisibleExplorerNodes(nodes: readonly ExplorerNode[], options: ExplorerVisibilityOptions): readonly ExplorerNode[] {
    const { openItems, filter, sortItems } = options;

    // Tracks the nodes in the order they were traversed (which is what the flat tree expects).
    const traversedNodes: ExplorerNode[] = [];
    // Tracks the nodes that are visible based on either the open state or the filter.
    const visibleNodes = new Set<ExplorerNode>();

    const traverse = (node: ExplorerNode) => {
        traversedNodes.push(node);

        if (node.kind === "root") {
            // The root node is always visible, even while filtering.
            visibleNodes.add(node);
        } else if (!filter) {
            // If there is no filter and we made it this far, then the node's parent is in an open state and this node is visible.
            visibleNodes.add(node);
        } else if (node.entity) {
            // Only selectable (entity backed) nodes participate in filter matching. Structural nodes
            // become visible via the ancestor walk below when one of their descendants matches.
            const displayInfo = node.getDisplayInfo();
            const isMatch = displayInfo.name.toLocaleLowerCase().includes(filter);
            displayInfo.dispose?.();

            if (isMatch) {
                // Include the matching node and its ancestors so the matching branch remains visible.
                for (let current: ExplorerNode | undefined = node; current && !visibleNodes.has(current); current = current.parent) {
                    visibleNodes.add(current);
                }
            }
        }

        // When a filter is present, always traverse the full tree (e.g. ignore the open item state).
        if (filter || openItems.has(node.value)) {
            for (const child of GetOrderedChildren(node, sortItems)) {
                traverse(child);
            }
        }
    };

    for (const node of nodes) {
        traverse(node);
    }

    // Filter the traversal ordered nodes by those that should actually be visible.
    return traversedNodes.filter((node) => visibleNodes.has(node));
}

/**
 * Expands or collapses a node and all of its descendants.
 * @param node The node to expand or collapse.
 * @param open True to expand, false to collapse.
 * @param openItems The mutable set of expanded node values to update.
 */
export function ExpandOrCollapseAll(node: ExplorerNode, open: boolean, openItems: Set<ExplorerNodeValue>) {
    if (open) {
        openItems.add(node.value);
    } else {
        openItems.delete(node.value);
    }

    for (const child of node.children) {
        ExpandOrCollapseAll(child, open, openItems);
    }
}

/**
 * Gets the values of all ancestors of the node representing the specified entity, which is what must be
 * expanded for that entity to be revealed.
 * @param tree The tree to search.
 * @param entity The entity to reveal.
 * @returns The values of the ancestor nodes, or an empty array if the entity is not present in the tree.
 */
export function GetAncestorValues(tree: ExplorerTree, entity: object): readonly ExplorerNodeValue[] {
    const values: ExplorerNodeValue[] = [];
    for (let node = tree.nodesByEntity.get(entity)?.parent; node; node = node.parent) {
        values.push(node.value);
    }
    return values;
}
