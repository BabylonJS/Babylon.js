import { describe, expect, it } from "vitest";

import { Observable } from "core/Misc/observable";

import {
    type ExplorerDragDropConfig,
    type ExplorerNode,
    type ExplorerNodeDescription,
    BuildExplorerTree,
    ExpandOrCollapseAll,
    GetAncestorValues,
    GetEntityId,
    GetOrderedChildren,
    GetVisibleExplorerNodes,
    ShouldDisplayNode,
} from "../../src/components/explorer/explorerModel";

function MakeNode(id: string, overrides: Partial<ExplorerNodeDescription> = {}): ExplorerNodeDescription {
    return {
        id,
        getDisplayInfo: () => ({ name: id }),
        ...overrides,
    };
}

function GetNames(nodes: readonly ExplorerNode[]): string[] {
    return nodes.map((node) => node.getDisplayInfo().name);
}

describe("GetEntityId", () => {
    it("uses uniqueId when the entity has one", () => {
        expect(GetEntityId({ uniqueId: 42 })).toBe(42);
    });

    it("generates a stable synthetic id for entities without a uniqueId", () => {
        const entity = {};
        const other = {};
        expect(GetEntityId(entity)).toBe(GetEntityId(entity));
        expect(GetEntityId(entity)).not.toBe(GetEntityId(other));
    });
});

describe("BuildExplorerTree", () => {
    it("supports arbitrarily nested heterogeneous hierarchies", () => {
        const surface = { name: "Surface" };
        const context = { name: "Context" };
        const mesh = { uniqueId: 7 };

        const tree = BuildExplorerTree([
            MakeNode("group", {
                kind: "group",
                getChildren: () => [
                    MakeNode("surface", { kind: "group", entity: surface, getChildren: () => [MakeNode("context", { kind: "item", entity: context })] }),
                    MakeNode("mesh", { kind: "item", entity: mesh }),
                ],
            }),
        ]);

        expect(tree.nodes).toHaveLength(1);
        const group = tree.nodes[0];
        expect(group.kind).toBe("group");
        expect(group.depth).toBe(1);
        expect(group.parent).toBeUndefined();
        expect(group.value).toBe("group");

        const [surfaceNode, meshNode] = group.children;
        expect(surfaceNode.depth).toBe(2);
        expect(surfaceNode.parent).toBe(group);
        expect(surfaceNode.value).toBe(GetEntityId(surface));
        expect(meshNode.value).toBe(7);

        const contextNode = surfaceNode.children[0];
        expect(contextNode.depth).toBe(3);
        expect(contextNode.entity).toBe(context);

        expect(tree.nodesByEntity.get(context)).toEqual([contextNode]);
        expect(tree.nodesByValue.get("group")).toBe(group);
    });

    it("uses hierarchical paths for the values of structural nodes", () => {
        const tree = BuildExplorerTree([
            MakeNode("parent", { kind: "group", getChildren: () => [MakeNode("child", { kind: "group", getChildren: () => [MakeNode("leaf", { entity: {} })] })] }),
        ]);

        expect(tree.nodes[0].children[0].value).toBe("parent/child");
    });

    it("omits structural nodes with no visible children but keeps entity nodes", () => {
        const tree = BuildExplorerTree([
            MakeNode("empty", { kind: "group", getChildren: () => [] }),
            MakeNode("emptyNested", { kind: "group", getChildren: () => [MakeNode("alsoEmpty", { kind: "group" })] }),
            MakeNode("selectable", { kind: "group", entity: {} }),
        ]);

        expect(GetNames(tree.nodes)).toEqual(["selectable"]);
    });

    it("gathers change observables from nodes that are not visible", () => {
        const added = new Observable<void>();
        const removed = new Observable<object>();
        const moved = new Observable<void>();

        const tree = BuildExplorerTree([
            MakeNode("empty", {
                kind: "group",
                getChildren: () => [],
                getAddedObservables: () => [added],
                getRemovedObservables: () => [removed],
                getMovedObservables: () => [moved],
            }),
        ]);

        expect(tree.nodes).toHaveLength(0);
        expect(tree.changeObservables.added).toEqual([added]);
        expect(tree.changeObservables.removed).toEqual([removed]);
        expect(tree.changeObservables.moved).toEqual([moved]);
    });

    it("inherits the drag drop config from the closest ancestor that specifies one", () => {
        const dragDropConfig: ExplorerDragDropConfig<object> = {
            canDrag: () => true,
            canDrop: () => true,
            onDrop: () => {},
        };

        const tree = BuildExplorerTree([
            MakeNode("group", {
                kind: "group",
                dragDropConfig,
                getChildren: () => [MakeNode("child", { entity: {}, getChildren: () => [MakeNode("grandChild", { entity: {} })] })],
            }),
        ]);

        const child = tree.nodes[0].children[0];
        expect(child.dragDropConfig).toBe(dragDropConfig);
        expect(child.children[0].dragDropConfig).toBe(dragDropConfig);
    });

    it("keeps every occurrence of a shared entity addressable with a unique tree value", () => {
        const sharedEntity = {};
        const firstParent = {};
        const secondParent = {};
        const tree = BuildExplorerTree([
            MakeNode("first", {
                entity: firstParent,
                getChildren: () => [MakeNode("shared", { entity: sharedEntity })],
            }),
            MakeNode("second", {
                entity: secondParent,
                getChildren: () => [MakeNode("shared", { entity: sharedEntity })],
            }),
        ]);
        const firstOccurrence = tree.nodes[0].children[0];
        const secondOccurrence = tree.nodes[1].children[0];

        expect(firstOccurrence.value).not.toBe(secondOccurrence.value);
        expect(tree.nodesByValue.get(firstOccurrence.value)).toBe(firstOccurrence);
        expect(tree.nodesByValue.get(secondOccurrence.value)).toBe(secondOccurrence);
        expect(tree.nodesByEntity.get(sharedEntity)).toEqual([firstOccurrence, secondOccurrence]);
        expect(GetAncestorValues(tree, sharedEntity)).toEqual([GetEntityId(firstParent), GetEntityId(secondParent)]);
    });

    it("preserves an entity value when its only occurrence is reparented", () => {
        const entity = {};
        const firstTree = BuildExplorerTree([MakeNode("first", { entity: {}, getChildren: () => [MakeNode("entity", { entity })] })]);
        const secondTree = BuildExplorerTree([MakeNode("second", { entity: {}, getChildren: () => [MakeNode("entity", { entity })] })]);

        expect(firstTree.nodes[0].children[0].value).toBe(GetEntityId(entity));
        expect(secondTree.nodes[0].children[0].value).toBe(GetEntityId(entity));
    });
});

describe("ShouldDisplayNode", () => {
    it("always displays entity nodes and only displays structural nodes with children", () => {
        expect(ShouldDisplayNode({ entity: {}, children: [] })).toBe(true);
        expect(ShouldDisplayNode({ children: [] })).toBe(false);
        expect(ShouldDisplayNode({ children: [{}] })).toBe(true);
    });
});

describe("GetOrderedChildren", () => {
    it("preserves the declared child order when alphabetical sorting is disabled", () => {
        const tree = BuildExplorerTree([
            MakeNode("parent", {
                kind: "group",
                getChildren: () => [
                    MakeNode("scene", { kind: "item", entity: {} }),
                    MakeNode("auxiliarySurfaces", {
                        kind: "group",
                        getChildren: () => [MakeNode("surface", { kind: "item", entity: {} })],
                    }),
                    MakeNode("textRenderer", { kind: "item", entity: {} }),
                ],
            }),
        ]);

        expect(GetNames(GetOrderedChildren(tree.nodes[0], false) as ExplorerNode[])).toEqual(["scene", "auxiliarySurfaces", "textRenderer"]);
    });

    it("sorts item nodes without moving structural nodes", () => {
        const tree = BuildExplorerTree([
            MakeNode("root", {
                kind: "group",
                getChildren: () => [
                    MakeNode("zeta", { kind: "item", entity: {} }),
                    MakeNode("groupB", { kind: "group", entity: {} }),
                    MakeNode("alpha", { kind: "item", entity: {} }),
                    MakeNode("groupA", { kind: "group", entity: {} }),
                ],
            }),
        ]);

        expect(GetNames(GetOrderedChildren(tree.nodes[0], true) as ExplorerNode[])).toEqual(["alpha", "groupB", "zeta", "groupA"]);
    });
});

describe("GetVisibleExplorerNodes", () => {
    const buildTree = () =>
        BuildExplorerTree([
            MakeNode("engine", { kind: "root", entity: {} }),
            MakeNode("nodes", {
                kind: "group",
                getChildren: () => [MakeNode("parentMesh", { kind: "item", entity: {}, getChildren: () => [MakeNode("childMesh", { kind: "item", entity: {} })] })],
            }),
        ]);

    it("always shows the root and only shows children of expanded nodes", () => {
        const tree = buildTree();

        expect(GetNames(GetVisibleExplorerNodes(tree.nodes, { openItems: new Set(), filter: "", sortItems: false }))).toEqual(["engine", "nodes"]);

        const nodesGroup = tree.nodes[1];
        expect(GetNames(GetVisibleExplorerNodes(tree.nodes, { openItems: new Set([nodesGroup.value]), filter: "", sortItems: false }))).toEqual(["engine", "nodes", "parentMesh"]);
    });

    it("reveals matching entity nodes and their ancestors while filtering", () => {
        const tree = buildTree();

        expect(GetNames(GetVisibleExplorerNodes(tree.nodes, { openItems: new Set(), filter: "childmesh", sortItems: false }))).toEqual([
            "engine",
            "nodes",
            "parentMesh",
            "childMesh",
        ]);
    });

    it("does not match structural nodes by name while filtering", () => {
        const tree = buildTree();

        expect(GetNames(GetVisibleExplorerNodes(tree.nodes, { openItems: new Set(), filter: "nodes", sortItems: false }))).toEqual(["engine"]);
    });
});

describe("ExpandOrCollapseAll", () => {
    it("expands and collapses a node and all of its descendants", () => {
        const tree = BuildExplorerTree([
            MakeNode("root", { kind: "group", getChildren: () => [MakeNode("child", { entity: {}, getChildren: () => [MakeNode("grandChild", { entity: {} })] })] }),
        ]);

        const openItems = new Set<string | number>();
        ExpandOrCollapseAll(tree.nodes[0], true, openItems);
        expect(openItems.size).toBe(3);

        ExpandOrCollapseAll(tree.nodes[0], false, openItems);
        expect(openItems.size).toBe(0);
    });
});

describe("GetAncestorValues", () => {
    it("returns the values that must be expanded to reveal an entity", () => {
        const grandChild = {};
        const child = {};
        const tree = BuildExplorerTree([
            MakeNode("root", { kind: "group", getChildren: () => [MakeNode("child", { entity: child, getChildren: () => [MakeNode("grandChild", { entity: grandChild })] })] }),
        ]);

        expect(GetAncestorValues(tree, grandChild)).toEqual([GetEntityId(child), "root"]);
        expect(GetAncestorValues(tree, {})).toEqual([]);
    });
});
