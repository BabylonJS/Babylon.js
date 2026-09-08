import {
    type EngineContext,
    type Material,
    type Mesh,
    type RenderingContext,
    type SceneContext,
    type SurfaceContext,
    type TextLayer,
    type TextRenderer,
    type Texture2D,
} from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

const { PaneRegistrations } = vi.hoisted(() => ({
    PaneRegistrations: [] as { options: import("../../src/services/panes/explorer/explorerPane").ExplorerPaneOptions; dispose: ReturnType<typeof vi.fn> }[],
}));

vi.mock("../../src/services/panes/explorer/explorerPane", () => ({
    CreateExplorerPaneRegistration: (_shellService: unknown, _selectionService: unknown, options: import("../../src/services/panes/explorer/explorerPane").ExplorerPaneOptions) => {
        const dispose = vi.fn();
        PaneRegistrations.push({ options, dispose });
        return { dispose };
    },
}));

import { BuildExplorerTree, type ExplorerNode } from "../../src/components/explorer/explorerModel";
import { type IEngineContext } from "../../src/lite/engineContext";
import {
    type IEngineExplorerService,
    EngineExplorerServiceDefinition,
    EngineExplorerServiceIdentity,
    type RenderingContextNodeProvider,
} from "../../src/lite/engineExplorerService";
import { MaterialExplorerServiceDefinition } from "../../src/lite/services/panes/scene/materialExplorerService";
import { MeshExplorerServiceDefinition } from "../../src/lite/services/panes/scene/meshExplorerService";
import { TextLayerExplorerServiceDefinition } from "../../src/lite/services/panes/scene/textLayerExplorerService";
import { TextureExplorerServiceDefinition } from "../../src/lite/services/panes/scene/textureExplorerService";
import { type IWatcherService, WatcherServiceIdentity } from "../../src/services/watcherService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IShellService } from "shared-ui-components/modularTool/services/shellService";

function CreateMaterial(family: string, name: string, texture?: Texture2D): Material {
    return Object.assign(
        {
            name,
            ...(family === "standard" ? { diffuseTexture: texture ?? null } : { baseColorTexture: texture }),
        } as Material,
        {
            _buildGroup: { _materialFamily: family },
            _uboVersion: 0,
        }
    );
}

function CreateMesh(name: string, material: Material): Mesh {
    return { name, material } as Mesh;
}

function GetNames(nodes: readonly ExplorerNode[]): string[] {
    return nodes.map((node) => {
        const displayInfo = node.getDisplayInfo();
        const name = displayInfo.name;
        displayInfo.dispose?.();
        return name;
    });
}

describe("Babylon Lite engine explorer service", () => {
    it("uses scene names with fallback and updates them live", () => {
        PaneRegistrations.length = 0;
        const unnamedScene = { _kind: "scene", name: "" } as SceneContext;
        const utilityScene = { _kind: "scene", name: "UtilityLayer" } as SceneContext;
        const effectRenderer = { _kind: "effect-renderer" } as RenderingContext;
        const auxiliarySurface = { _renderingContexts: [] } as unknown as SurfaceContext;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [unnamedScene, utilityScene, effectRenderer],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine, auxiliarySurface];

        const nameChangedCallbacks = new Map<object, () => void>();
        const nameWatcherDisposals = new Map<object, ReturnType<typeof vi.fn>>();
        const topologyWatcherDispose = vi.fn();
        const watcherService = {
            watchProperty: vi.fn((entity: { name?: string }, propertyKey: "name", onChanged: () => void) => {
                const dispose = vi.fn();
                expect(propertyKey).toBe("name");
                nameChangedCallbacks.set(entity, onChanged);
                nameWatcherDisposals.set(entity, dispose);
                return { dispose };
            }),
            watchValue: vi.fn(() => ({ dispose: topologyWatcherDispose })),
        } as unknown as IWatcherService;

        const service = EngineExplorerServiceDefinition.factory({ engine } as IEngineContext, {} as IShellService, {} as ISelectionService, watcherService)!;
        const registration = PaneRegistrations.at(-1)!;
        const nodes = registration.options.getNodes();
        const unnamedDisplayInfo = nodes[0].getDisplayInfo();
        const utilityDisplayInfo = nodes[1].getDisplayInfo();
        const effectDisplayInfo = nodes[2].getDisplayInfo();
        const auxiliarySurfacesNode = nodes[3];
        const auxiliarySurfaceNode = auxiliarySurfacesNode.getChildren!()[0];

        expect(unnamedDisplayInfo.name).toBe("Scene");
        expect(utilityDisplayInfo.name).toBe("UtilityLayer");
        expect(effectDisplayInfo.name).toBe("Effect Renderer");
        expect(auxiliarySurfacesNode.kind).toBe("group");
        expect(auxiliarySurfaceNode.kind).toBe("item");
        expect(auxiliarySurfaceNode.entity).toBe(auxiliarySurface);
        expect(auxiliarySurfaceNode.getDisplayInfo().name).toBe("Surface 2");
        expect(watcherService.watchProperty).toHaveBeenCalledTimes(2);

        const onUnnamedDisplayChanged = vi.fn();
        unnamedDisplayInfo.onChange?.add(onUnnamedDisplayChanged);
        unnamedScene.name = "Main Scene";
        nameChangedCallbacks.get(unnamedScene)?.();

        expect(unnamedDisplayInfo.name).toBe("Main Scene");
        expect(onUnnamedDisplayChanged).toHaveBeenCalledOnce();

        unnamedDisplayInfo.dispose?.();
        utilityDisplayInfo.dispose?.();
        effectDisplayInfo.dispose?.();
        expect(nameWatcherDisposals.get(unnamedScene)).toHaveBeenCalledOnce();
        expect(nameWatcherDisposals.get(utilityScene)).toHaveBeenCalledOnce();

        service.dispose?.();
        expect(topologyWatcherDispose).toHaveBeenCalledOnce();
        expect(registration.dispose).toHaveBeenCalledOnce();
    });
});

describe("Babylon Lite scene resource explorer services", () => {
    it("registers product-specific providers with the engine explorer", () => {
        expect(EngineExplorerServiceDefinition.produces).toEqual([EngineExplorerServiceIdentity]);
        expect(MeshExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity, WatcherServiceIdentity]);
        expect(MaterialExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity, WatcherServiceIdentity]);
        expect(TextureExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
        expect(TextLayerExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
    });

    it("contributes selectable mesh, material, and texture sections beneath scene contexts", () => {
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const dispose = vi.fn();
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                return { dispose };
            },
        } as IEngineExplorerService;
        const nameChangedCallbacks = new Map<object, () => void>();
        const watcherDisposals = new Map<object, () => void>();
        const watcherService = {
            watchProperty: vi.fn((entity: { name?: string }, propertyKey: "name", onChanged: (value: string) => void) => {
                const dispose = vi.fn();
                expect(propertyKey).toBe("name");
                nameChangedCallbacks.set(entity, () => onChanged(entity.name ?? ""));
                watcherDisposals.set(entity, dispose);
                return { dispose };
            }),
        } as unknown as IWatcherService;

        const registrations = [
            MeshExplorerServiceDefinition.factory(engineExplorerService, watcherService),
            MaterialExplorerServiceDefinition.factory(engineExplorerService, watcherService),
            TextureExplorerServiceDefinition.factory(engineExplorerService),
            TextLayerExplorerServiceDefinition.factory(engineExplorerService),
        ];

        const redTexture = { width: 1, height: 1 } as Texture2D;
        const blueTexture = { width: 2, height: 2 } as Texture2D;
        const standardMaterial = CreateMaterial("standard", "Red Material", redTexture);
        const pbrMaterial = CreateMaterial("pbr", "Blue Material", blueTexture);
        const redMesh = CreateMesh("Red Box", standardMaterial);
        const blueMesh = CreateMesh("Blue Sphere", pbrMaterial);
        const scene = {
            _kind: "scene",
            meshes: [redMesh, blueMesh, CreateMesh("Small Red Box", standardMaterial)],
        } as SceneContext;

        const descriptions = providers
            .filter((provider) => provider.predicate(scene))
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .flatMap((provider) => provider.getNodes(scene));
        const tree = BuildExplorerTree(descriptions);

        expect(GetNames(tree.nodes)).toEqual(["Meshes", "Materials", "Textures"]);
        expect(GetNames(tree.nodes[0].children)).toEqual(["Red Box", "Blue Sphere", "Small Red Box"]);
        expect(GetNames(tree.nodes[1].children)).toEqual(["Red Material", "Blue Material"]);
        expect(GetNames(tree.nodes[2].children)).toEqual(["Texture 1 (1 x 1)", "Texture 2 (2 x 2)"]);
        expect(tree.nodes[0].children[0].entity).toBe(redMesh);
        expect(tree.nodes[1].children[0].entity).toBe(standardMaterial);
        expect(tree.nodes[2].children[0].entity).toBe(redTexture);
        expect(tree.nodes[0].children[0].icon).toBeDefined();
        expect(tree.nodes[1].children[0].icon).toBeDefined();
        expect(tree.nodes[2].children[0].icon).toBeDefined();
        expect(watcherService.watchProperty).toHaveBeenCalledTimes(5);

        const meshDisplayInfo = tree.nodes[0].children[0].getDisplayInfo();
        const materialDisplayInfo = tree.nodes[1].children[0].getDisplayInfo();
        const meshDisplayChanged = vi.fn();
        const materialDisplayChanged = vi.fn();
        meshDisplayInfo.onChange?.add(meshDisplayChanged);
        materialDisplayInfo.onChange?.add(materialDisplayChanged);

        redMesh.name = "Renamed Box";
        standardMaterial.name = "Renamed Material";
        nameChangedCallbacks.get(redMesh)?.();
        nameChangedCallbacks.get(standardMaterial)?.();

        expect(meshDisplayInfo.name).toBe("Renamed Box");
        expect(materialDisplayInfo.name).toBe("Renamed Material");
        expect(meshDisplayChanged).toHaveBeenCalledOnce();
        expect(materialDisplayChanged).toHaveBeenCalledOnce();

        meshDisplayInfo.dispose?.();
        materialDisplayInfo.dispose?.();
        expect(watcherDisposals.get(redMesh)).toHaveBeenCalledOnce();
        expect(watcherDisposals.get(standardMaterial)).toHaveBeenCalledOnce();

        registrations.forEach((registration) => registration?.dispose?.());
        expect(dispose).toHaveBeenCalledTimes(4);
    });

    it("contributes stable text layer children and snapshots beneath text renderers", () => {
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                return { dispose: () => {} };
            },
        } as IEngineExplorerService;
        TextLayerExplorerServiceDefinition.factory(engineExplorerService);

        const firstLayer = { data: { runs: [] } } as unknown as TextLayer;
        const secondLayer = { data: { runs: [] } } as unknown as TextLayer;
        const layers = [firstLayer];
        const renderer = { _kind: "text-renderer", layers } as unknown as TextRenderer;
        const provider = providers[0];

        expect(provider.predicate(renderer)).toBe(true);
        expect(provider.predicate({ _kind: "sprite-renderer" } as RenderingContext)).toBe(false);

        const firstDescriptions = provider.getNodes(renderer);
        const firstTree = BuildExplorerTree(firstDescriptions);
        expect(GetNames(firstTree.nodes)).toEqual(["Layer 1"]);
        expect(firstTree.nodes[0].entity).toBe(firstLayer);
        expect(firstTree.nodes[0].icon).toBeDefined();

        layers.push(secondLayer);
        const addedDescriptions = provider.getNodes(renderer);
        expect(GetNames(BuildExplorerTree(addedDescriptions).nodes)).toEqual(["Layer 1", "Layer 2"]);
        expect(provider.getSnapshot(renderer)).toEqual([firstLayer, secondLayer]);

        layers.shift();
        const removedDescriptions = provider.getNodes(renderer);
        expect(removedDescriptions[0].id).toBe(addedDescriptions[1].id);
        expect(GetNames(BuildExplorerTree(removedDescriptions).nodes)).toEqual(["Layer 1"]);
        expect(provider.getSnapshot(renderer)).toEqual([secondLayer]);
    });

    it("does not contribute scene resources beneath other rendering contexts", () => {
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                return { dispose: () => {} };
            },
        } as IEngineExplorerService;
        const watcherService = {
            watchProperty: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as IWatcherService;

        MeshExplorerServiceDefinition.factory(engineExplorerService, watcherService);
        const effectRenderer = { _kind: "effect-renderer" } as RenderingContext;

        expect(providers[0].predicate(effectRenderer)).toBe(false);
    });
});
