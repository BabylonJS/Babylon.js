import { describe, expect, it } from "vitest";

import { BuildExplorerTree, type ExplorerCommandProvider } from "../../src/components/explorer/explorerModel";
import { CreateExplorerService, GetExplorerNodeChildren } from "../../src/services/panes/explorer/explorerService";

type TestEntity = {
    name: string;
};

const ItemCommand = {
    predicate: (context: unknown): context is TestEntity => typeof context === "object" && context !== null && "name" in context,
    getCommand: () => ({
        type: "action",
        displayName: "Inspect",
        icon: () => null,
        execute: () => {},
    }),
} satisfies ExplorerCommandProvider<TestEntity>;

const GroupCommand = {
    predicate: (context: unknown): context is "Resources" => context === "Resources",
    getCommand: () => ({
        type: "action",
        mode: "contextMenu",
        displayName: "Create",
        execute: () => {},
    }),
} satisfies ExplorerCommandProvider<"Resources", "contextMenu">;

describe("Explorer service", () => {
    it("attaches nested node contributions beneath compatible parent entities", () => {
        const service = CreateExplorerService();
        const root = {};
        const branch = {};
        const leaf = {};
        const later = {};

        const laterRegistration = service.addNodeProvider({
            order: 10,
            predicate: (parent): parent is object => parent === root,
            getNodes: () => [{ id: "later", entity: later, getDisplayInfo: () => ({ name: "Later" }) }],
        });
        service.addNodeProvider({
            predicate: (parent): parent is object => parent === root,
            getNodes: () => [
                {
                    id: "group",
                    kind: "group",
                    getDisplayInfo: () => ({ name: "Group" }),
                    getChildren: () => [{ id: "branch", entity: branch, getDisplayInfo: () => ({ name: "Branch" }) }],
                },
            ],
        });
        service.addNodeProvider({
            predicate: (parent): parent is object => parent === branch,
            getNodes: () => [{ id: "leaf", entity: leaf, getDisplayInfo: () => ({ name: "Leaf" }) }],
        });

        const tree = BuildExplorerTree(GetExplorerNodeChildren(root, [], service.nodeProviders.items));
        expect(tree.nodes.map((node) => node.getDisplayInfo().name)).toEqual(["Group", "Later"]);
        expect(tree.nodes[0].kind).toBe("group");
        expect(tree.nodes[0].children[0].entity).toBe(branch);
        expect(tree.nodes[0].children[0].children[0].entity).toBe(leaf);

        laterRegistration.dispose();
        laterRegistration.dispose();
        expect(BuildExplorerTree(GetExplorerNodeChildren(root, [], service.nodeProviders.items)).nodes.map((node) => node.getDisplayInfo().name)).toEqual(["Group"]);
    });

    it("registers and unregisters item and group commands idempotently", () => {
        const service = CreateExplorerService();
        const itemRegistration = service.addItemCommand(ItemCommand);
        const groupRegistration = service.addGroupCommand(GroupCommand);

        expect(service.itemCommandProviders.items).toEqual([ItemCommand]);
        expect(service.groupCommandProviders.items).toEqual([GroupCommand]);

        itemRegistration.dispose();
        itemRegistration.dispose();
        groupRegistration.dispose();
        groupRegistration.dispose();

        expect(service.itemCommandProviders.items).toEqual([]);
        expect(service.groupCommandProviders.items).toEqual([]);
    });

    it("owns outstanding registrations and rejects additions after disposal", () => {
        const service = CreateExplorerService();
        const nodeProvider = { predicate: (parent: unknown): parent is object => true, getNodes: () => [] };
        const nodeRegistration = service.addNodeProvider(nodeProvider);
        const itemRegistration = service.addItemCommand(ItemCommand);
        const groupRegistration = service.addGroupCommand(GroupCommand);

        service.dispose();
        service.dispose();
        nodeRegistration.dispose();
        itemRegistration.dispose();
        groupRegistration.dispose();

        expect(service.nodeProviders.items).toEqual([]);
        expect(service.itemCommandProviders.items).toEqual([]);
        expect(service.groupCommandProviders.items).toEqual([]);
        expect(() => service.addNodeProvider(nodeProvider)).toThrow("Observable collection is disposed.");
        expect(() => service.addItemCommand(ItemCommand)).toThrow("Observable collection is disposed.");
        expect(() => service.addGroupCommand(GroupCommand)).toThrow("Observable collection is disposed.");
    });
});
