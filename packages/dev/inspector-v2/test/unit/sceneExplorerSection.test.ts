import { afterAll, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";

import { type ExplorerNodeDescription, BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { type SceneExplorerSection } from "../../src/components/scene/sceneExplorer";
import { type ExplorerPaneOptions } from "../../src/services/panes/explorer/explorerPane";
import { type ISceneContext, SceneContextIdentity } from "../../src/services/sceneContext";
import { type ISelectionService } from "../../src/services/selectionService";
import { SceneExplorerServiceDefinition } from "../../src/services/panes/scene/sceneExplorerService";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

// The pane is internal plumbing (not a service), so the options the Scene Explorer service passes to it
// represent the boundary being verified here.
const { PaneRegistrations } = vi.hoisted(() => ({ PaneRegistrations: [] as { options: ExplorerPaneOptions; isDisposed: boolean }[] }));

vi.mock("../../src/services/panes/explorer/explorerPane", () => ({
    CreateExplorerPaneRegistration: (_shellService: unknown, _selectionService: unknown, options: ExplorerPaneOptions) => {
        const registration = { options, isDisposed: false };
        PaneRegistrations.push(registration);
        return { dispose: () => (registration.isDisposed = true) };
    },
}));

type TestEntity = {
    name: string;
    children?: TestEntity[];
    reservedDataStore?: { hidden?: boolean };
};

function CreateTestSceneExplorerService() {
    const scene = { name: "TestScene" };
    const sceneContext = {
        currentScene: scene,
        currentSceneObservable: new Observable<unknown>(),
    } as unknown as ISceneContext;

    const sceneExplorerService = SceneExplorerServiceDefinition.factory(sceneContext, {} as unknown as IShellService, {} as unknown as ISelectionService)!;

    const registration = PaneRegistrations[PaneRegistrations.length - 1];

    return {
        sceneExplorerService,
        sceneContext,
        scene,
        registration,
        get itemCommands() {
            return [...(registration.options.itemCommandProviders?.items ?? [])];
        },
        get groupCommands() {
            return [...(registration.options.groupCommandProviders?.items ?? [])];
        },
        getNodes: () => registration.options.getNodes(),
        get onNodesChanged() {
            return registration.options.onNodesChanged;
        },
    };
}

function CreateTestSection(displayName: string, entities: TestEntity[], order?: number) {
    return {
        displayName,
        order,
        getRootEntities: () => entities,
        getEntityChildren: (entity) => entity.children ?? [],
        getEntityDisplayInfo: (entity) => ({ name: entity.name }),
        getEntityAddedObservables: () => [],
        getEntityRemovedObservables: () => [],
    } satisfies SceneExplorerSection<TestEntity>;
}

function GetNames(nodes: readonly { getDisplayInfo: () => { name: string } }[]): string[] {
    return nodes.map((node) => node.getDisplayInfo().name);
}

describe("SceneExplorerSection", () => {
    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it("preserves typed entity callbacks", () => {
        const section = CreateTestSection("Nodes", []);
        expect(section.displayName).toBe("Nodes");
        expectTypeOf(section.getEntityDisplayInfo).parameter(0).toEqualTypeOf<TestEntity>();
        expectTypeOf<SceneExplorerSection<TestEntity>["getRootEntities"]>().returns.toEqualTypeOf<readonly TestEntity[]>();
        expectTypeOf<SceneExplorerSection<TestEntity>>().not.toHaveProperty("getSubSections");
    });
});

describe("SceneExplorerService", () => {
    beforeEach(() => {
        PaneRegistrations.length = 0;
    });

    afterAll(() => {
        vi.unstubAllGlobals();
    });

    it("owns a single side pane titled Scene Explorer", () => {
        const service = CreateTestSceneExplorerService();

        expect(PaneRegistrations).toHaveLength(1);
        expect(service.registration.options.title).toBe("Scene Explorer");
        expect(service.registration.options.key).toBe("Scene Explorer");

        service.sceneExplorerService.dispose?.();
        expect(service.registration.isDisposed).toBe(true);
    });

    it("supplies the current scene and the Scene label as the explorer root", () => {
        const service = CreateTestSceneExplorerService();

        expect(service.registration.options.getRoot()).toBe(service.scene);
        expect(service.registration.options.rootLabel).toBe("Scene");
        expect(service.registration.options.onRootChanged).toBe(service.sceneContext.currentSceneObservable);
    });

    it("consumes the scene context (and not a generic target context)", () => {
        expect(SceneExplorerServiceDefinition.consumes?.[0]).toBe(SceneContextIdentity);
        expect(SceneExplorerServiceDefinition.consumes).toHaveLength(3);
    });

    it("adapts sections into explorer nodes ordered by section order", () => {
        const service = CreateTestSceneExplorerService();
        service.sceneExplorerService.addSection(CreateTestSection("Materials", [{ name: "Material" }], 2));
        service.sceneExplorerService.addSection(CreateTestSection("Nodes", [{ name: "Mesh" }], 1));

        expect(GetNames(service.getNodes())).toEqual(["Nodes", "Materials"]);
    });

    it("hides sections that contain no entities", () => {
        const service = CreateTestSceneExplorerService();
        service.sceneExplorerService.addSection(CreateTestSection("Empty", []));
        service.sceneExplorerService.addSection(CreateTestSection("Nodes", [{ name: "Mesh" }]));

        const tree = BuildExplorerTree(service.getNodes());
        expect(GetNames(tree.nodes)).toEqual(["Nodes"]);
        expect(tree.nodes[0].entity).toBeUndefined();
    });

    it("nests entity children recursively and omits hidden entities", () => {
        const service = CreateTestSceneExplorerService();
        service.sceneExplorerService.addSection(
            CreateTestSection("Nodes", [
                {
                    name: "Parent",
                    children: [
                        { name: "Child", children: [{ name: "GrandChild" }] },
                        { name: "Hidden", reservedDataStore: { hidden: true } },
                    ],
                },
                { name: "HiddenRoot", reservedDataStore: { hidden: true } },
            ])
        );

        const tree = BuildExplorerTree(service.getNodes());
        const section = tree.nodes[0];
        expect(GetNames(section.children)).toEqual(["Parent"]);
        expect(GetNames(section.children[0].children)).toEqual(["Child"]);
        expect(GetNames(section.children[0].children[0].children)).toEqual(["GrandChild"]);
        expect(section.children[0].entity).toBeDefined();
    });

    it("forwards the entity change observables of the section", () => {
        const service = CreateTestSceneExplorerService();
        const added = new Observable<TestEntity>();
        const removed = new Observable<TestEntity>();
        const moved = new Observable<TestEntity>();

        service.sceneExplorerService.addSection({
            displayName: "Nodes",
            getRootEntities: () => [{ name: "Mesh" }],
            getEntityDisplayInfo: (entity) => ({ name: entity.name }),
            getEntityAddedObservables: () => [added],
            getEntityRemovedObservables: () => [removed],
            getEntityMovedObservables: () => [moved],
        } satisfies SceneExplorerSection<TestEntity>);

        const tree = BuildExplorerTree(service.getNodes());
        expect(tree.changeObservables.added).toEqual([added]);
        expect(tree.changeObservables.removed).toEqual([removed]);
        expect(tree.changeObservables.moved).toEqual([moved]);
    });

    it("notifies the explorer when sections are added or removed", () => {
        const service = CreateTestSceneExplorerService();
        let notifications = 0;
        service.onNodesChanged?.add(() => notifications++);

        const registration = service.sceneExplorerService.addSection(CreateTestSection("Nodes", [{ name: "Mesh" }]));
        expect(notifications).toBe(1);

        registration.dispose();
        expect(notifications).toBe(2);
        expect(service.getNodes()).toEqual([] as ExplorerNodeDescription[]);
    });

    it("routes entity and section commands to the explorer", () => {
        const service = CreateTestSceneExplorerService();
        const entityCommand = { predicate: (context: unknown): context is TestEntity => true, getCommand: () => ({}) };
        const sectionCommand = { predicate: (context: unknown): context is "Nodes" => context === "Nodes", getCommand: () => ({}) };

        service.sceneExplorerService.addEntityCommand(entityCommand as never);
        service.sceneExplorerService.addSectionCommand(sectionCommand as never);

        expect(service.itemCommands).toEqual([entityCommand]);
        expect(service.groupCommands).toEqual([sectionCommand]);
    });
});
