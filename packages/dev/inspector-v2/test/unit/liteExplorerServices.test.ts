import {
    type EngineContext,
    type Material,
    type Mesh,
    type RenderingContext,
    type SceneNode,
    type SceneContext,
    type Sprite2DLayer,
    type SpriteRenderer,
    type SurfaceContext,
    type TextLayer,
    type TextRenderer,
    type Texture2D,
} from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { Observable } from "core/Misc/observable";

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

const { RemoveSpriteRendererLayer, RemoveTextRendererLayer } = vi.hoisted(() => ({
    RemoveSpriteRendererLayer: vi.fn((renderer: SpriteRenderer, layer: Sprite2DLayer) => {
        const index = renderer.layers.indexOf(layer);
        if (index === -1) {
            return false;
        }
        (renderer.layers as Sprite2DLayer[]).splice(index, 1);
        return true;
    }),
    RemoveTextRendererLayer: vi.fn((renderer: TextRenderer, layer: TextLayer) => {
        const index = renderer.layers.indexOf(layer);
        if (index === -1) {
            return false;
        }
        (renderer.layers as TextLayer[]).splice(index, 1);
        return true;
    }),
}));

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        removeSpriteRendererLayer: RemoveSpriteRendererLayer,
        removeTextRendererLayer: RemoveTextRendererLayer,
    };
});

vi.mock("../../src/services/panes/explorer/explorerPane", () => ({
    CreateExplorerPaneRegistration: (_shellService: unknown, _selectionService: unknown, options: import("../../src/services/panes/explorer/explorerPane").ExplorerPaneOptions) => {
        const dispose = vi.fn();
        PaneRegistrations.push({ options, dispose });
        return { dispose };
    },
}));

import { BuildExplorerTree, type ExplorerNode } from "../../src/components/explorer/explorerModel";
import { EngineContextIdentity, type IEngineContext } from "../../src/lite/engineContext";
import {
    type IEngineExplorerService,
    EngineExplorerServiceDefinition,
    EngineExplorerServiceIdentity,
    type RenderingContextNodeProvider,
    type RenderingContextPresentationProvider,
} from "../../src/lite/engineExplorerService";
import { MaterialExplorerServiceDefinition } from "../../src/lite/services/panes/scene/materialExplorerService";
import { MeshExplorerServiceDefinition } from "../../src/lite/services/panes/scene/meshExplorerService";
import { SpriteLayerExplorerServiceDefinition } from "../../src/lite/services/panes/scene/spriteLayerExplorerService";
import { TextLayerExplorerServiceDefinition } from "../../src/lite/services/panes/scene/textLayerExplorerService";
import { TextureExplorerServiceDefinition } from "../../src/lite/services/panes/scene/textureExplorerService";
import { type IWatcherService, WatcherServiceIdentity } from "../../src/services/watcherService";
import { type ISelectionService, SelectionServiceIdentity } from "../../src/services/selectionService";
import { GetExplorerNodeChildren, type IExplorerService, ExplorerServiceIdentity } from "../../src/services/panes/explorer/explorerService";
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
    return {
        name,
        material,
        receiveShadows: false,
        children: [],
        parent: null,
        position: { x: 0, y: 0, z: 0 },
        rotationQuaternion: { x: 0, y: 0, z: 0, w: 1 },
        rotation: { x: 0, y: 0, z: 0 },
        scaling: { x: 1, y: 1, z: 1 },
        worldMatrix: new Float32Array(16),
        worldMatrixVersion: 0,
    } as Mesh;
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

    it("detects resources transferred between scene contexts", () => {
        PaneRegistrations.length = 0;
        const mesh = {} as Mesh;
        const firstSceneMeshes = [mesh];
        const secondSceneMeshes: Mesh[] = [];
        const firstScene = { _kind: "scene", meshes: firstSceneMeshes } as SceneContext;
        const secondScene = { _kind: "scene", meshes: secondSceneMeshes } as SceneContext;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [firstScene, secondScene],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];

        let getTopologySnapshot: (() => readonly object[]) | undefined;
        let areTopologySnapshotsEqual: ((left: readonly object[], right: readonly object[]) => boolean) | undefined;
        let notifyTopologyChanged: (() => void) | undefined;
        const watcherService = {
            watchValue: vi.fn(
                (getValue: () => readonly object[], onChanged: (value: readonly object[]) => void, equals: (left: readonly object[], right: readonly object[]) => boolean) => {
                    getTopologySnapshot = getValue;
                    areTopologySnapshotsEqual = equals;
                    notifyTopologyChanged = () => onChanged(getValue());
                    return { dispose: vi.fn() };
                }
            ),
        } as unknown as IWatcherService;
        const service = EngineExplorerServiceDefinition.factory({ engine } as IEngineContext, {} as IShellService, {} as ISelectionService, watcherService)!;
        const onNodesChanged = vi.fn();
        PaneRegistrations.at(-1)!.options.onNodesChanged?.add(onNodesChanged);
        const providerRegistration = service.addRenderingContextNodeProvider({
            predicate: (context): context is SceneContext => context === firstScene || context === secondScene,
            getNodes: (scene) => scene.meshes.map((entity) => ({ id: "mesh", entity, getDisplayInfo: () => ({ name: "Mesh" }) })),
            getSnapshot: (scene) => scene.meshes,
        });
        const paneNodeProviders = PaneRegistrations.at(-1)!.options.nodeProviders?.items ?? [];

        expect(GetExplorerNodeChildren(firstScene, [], paneNodeProviders)[0].entity).toBe(mesh);
        expect(GetExplorerNodeChildren(secondScene, [], paneNodeProviders)).toEqual([]);

        if (!getTopologySnapshot || !areTopologySnapshotsEqual || !notifyTopologyChanged) {
            throw new Error("Expected the topology watcher to be registered.");
        }

        const beforeTransfer = getTopologySnapshot();
        firstSceneMeshes.splice(0, 1);
        secondSceneMeshes.push(mesh);
        const afterTransfer = getTopologySnapshot();

        expect(areTopologySnapshotsEqual(beforeTransfer, afterTransfer)).toBe(false);
        expect(onNodesChanged).toHaveBeenCalledOnce();
        notifyTopologyChanged();
        expect(onNodesChanged).toHaveBeenCalledTimes(2);
        expect(GetExplorerNodeChildren(firstScene, [], paneNodeProviders)).toEqual([]);
        expect(GetExplorerNodeChildren(secondScene, [], paneNodeProviders)[0].entity).toBe(mesh);

        providerRegistration.dispose();
        providerRegistration.dispose();
        expect(onNodesChanged).toHaveBeenCalledTimes(3);
        expect(GetExplorerNodeChildren(secondScene, [], paneNodeProviders)).toEqual([]);
        service.dispose?.();
    });

    it("keeps rendering context presentation separate from contributed children", () => {
        PaneRegistrations.length = 0;
        type CustomRenderingContext = RenderingContext & { iconLabel: string };
        const context = { _kind: "custom-rendering-context", iconLabel: "Custom context" } as unknown as CustomRenderingContext;
        const child = {};
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [context],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];
        const watcherService = {
            watchValue: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as IWatcherService;
        const service = EngineExplorerServiceDefinition.factory({ engine } as IEngineContext, {} as IShellService, {} as ISelectionService, watcherService)!;
        const paneOptions = PaneRegistrations.at(-1)!.options;
        const onNodesChanged = vi.fn();
        paneOptions.onNodesChanged?.add(onNodesChanged);
        const CustomIcon = ({ entity }: { entity: CustomRenderingContext }) => createElement("span", null, entity.iconLabel);

        const getContextNode = () => paneOptions.getNodes()[0];
        expect(getContextNode().getDisplayInfo().name).toBe("custom-rendering-context");
        expect(getContextNode().icon).toBeUndefined();

        const childRegistration = service.addRenderingContextNodeProvider({
            predicate: (candidate): candidate is RenderingContext => candidate === context,
            getNodes: () => [{ id: "child", entity: child, getDisplayInfo: () => ({ name: "Child" }) }],
            getSnapshot: () => [child],
        });
        const earlierPresentationRegistration = service.addRenderingContextPresentationProvider({
            predicate: (candidate): candidate is RenderingContext => candidate === context,
            getPresentation: () => ({ getDisplayInfo: () => ({ name: "Earlier presentation" }) }),
        });
        const preferredPresentationRegistration = service.addRenderingContextPresentationProvider({
            predicate: (candidate): candidate is CustomRenderingContext => candidate === context,
            getPresentation: () => ({ icon: CustomIcon }),
        });

        const preferredNode = getContextNode();
        expect(preferredNode.getDisplayInfo().name).toBe("custom-rendering-context");
        expect(renderToStaticMarkup(createElement(preferredNode.icon!, { entity: {} }))).toBe("<span>Custom context</span>");
        expect(GetExplorerNodeChildren(context, [], paneOptions.nodeProviders?.items ?? [])[0].entity).toBe(child);
        expect(onNodesChanged).toHaveBeenCalledTimes(3);

        preferredPresentationRegistration.dispose();
        preferredPresentationRegistration.dispose();
        expect(getContextNode().getDisplayInfo().name).toBe("Earlier presentation");
        expect(getContextNode().icon).toBeUndefined();

        earlierPresentationRegistration.dispose();
        expect(getContextNode().getDisplayInfo().name).toBe("custom-rendering-context");

        childRegistration.dispose();
        childRegistration.dispose();
        expect(GetExplorerNodeChildren(context, [], paneOptions.nodeProviders?.items ?? [])).toEqual([]);
        expect(onNodesChanged).toHaveBeenCalledTimes(6);

        const ownedProvider = {
            predicate: (candidate: RenderingContext): candidate is RenderingContext => candidate === context,
            getPresentation: () => ({ icon: CustomIcon }),
        } satisfies RenderingContextPresentationProvider<RenderingContext>;
        const ownedRegistration = service.addRenderingContextPresentationProvider(ownedProvider);
        expect(onNodesChanged).toHaveBeenCalledTimes(7);

        service.dispose?.();
        ownedRegistration.dispose();
        ownedRegistration.dispose();
        expect(() => service.addRenderingContextPresentationProvider(ownedProvider)).toThrow("Observable collection is disposed.");
        expect(onNodesChanged).toHaveBeenCalledTimes(7);
    });

    it("routes shared commands to the Explorer and cleans them up", () => {
        PaneRegistrations.length = 0;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];
        const watcherService = {
            watchValue: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as IWatcherService;

        const service = EngineExplorerServiceDefinition.factory({ engine } as IEngineContext, {} as IShellService, {} as ISelectionService, watcherService)!;
        const sharedService: IExplorerService = service;
        const itemCommand = { predicate: (context: unknown): context is Mesh => true, getCommand: () => ({}) };
        const groupCommand = { predicate: (context: unknown): context is "Resources" => context === "Resources", getCommand: () => ({}) };
        const itemRegistration = sharedService.addItemCommand(itemCommand as never);
        const groupRegistration = sharedService.addGroupCommand(groupCommand as never);
        const paneOptions = PaneRegistrations.at(-1)!.options;

        expect(paneOptions.itemCommandProviders?.items).toEqual([itemCommand]);
        expect(paneOptions.groupCommandProviders?.items).toEqual([groupCommand]);

        itemRegistration.dispose();
        groupRegistration.dispose();
        expect(paneOptions.itemCommandProviders?.items).toEqual([]);
        expect(paneOptions.groupCommandProviders?.items).toEqual([]);

        sharedService.addItemCommand(itemCommand as never);
        sharedService.addGroupCommand(groupCommand as never);
        service.dispose?.();
        expect(paneOptions.itemCommandProviders?.items).toEqual([]);
        expect(paneOptions.groupCommandProviders?.items).toEqual([]);
    });

    it("clears a selection when polling discovers that its Explorer entity was removed", () => {
        PaneRegistrations.length = 0;
        const layer = { order: 0 } as TextLayer;
        const rendererLayers = [layer];
        const renderer = { _kind: "text-renderer", layers: rendererLayers } as unknown as TextRenderer;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [renderer],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];
        const selectionService = { selectedEntity: layer } as ISelectionService;
        let notifyTopologyChanged: ((snapshot: unknown) => void) | undefined;
        let getTopologySnapshot: (() => unknown) | undefined;
        const watcherService = {
            watchValue: vi.fn((getValue: () => unknown, onChanged: (snapshot: unknown) => void) => {
                getTopologySnapshot = getValue;
                notifyTopologyChanged = onChanged;
                return { dispose: vi.fn() };
            }),
        } as unknown as IWatcherService;
        const service = EngineExplorerServiceDefinition.factory({ engine } as IEngineContext, {} as IShellService, selectionService, watcherService)!;
        service.addRenderingContextNodeProvider({
            predicate: (context): context is TextRenderer => context === renderer,
            getNodes: (context) => context.layers.map((entity) => ({ id: "layer", entity, getDisplayInfo: () => ({ name: "Text Layer 1" }) })),
            getSnapshot: (context) => context.layers,
        });

        rendererLayers.splice(0, 1);
        notifyTopologyChanged?.(getTopologySnapshot?.());

        expect(selectionService.selectedEntity).toBeNull();
        service.dispose?.();
    });

    it("keeps a selection while the entity remains in another contributed branch", () => {
        PaneRegistrations.length = 0;
        const entity = {};
        const rendererEntities = [entity];
        const renderer = { _kind: "text-renderer", layers: rendererEntities } as unknown as TextRenderer;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [renderer],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];
        const selectionService = { selectedEntity: entity } as ISelectionService;
        let notifyTopologyChanged: (() => void) | undefined;
        const watcherService = {
            watchValue: vi.fn((getValue: () => unknown, onChanged: () => void) => {
                notifyTopologyChanged = () => {
                    getValue();
                    onChanged();
                };
                return { dispose: vi.fn() };
            }),
        } as unknown as IWatcherService;
        const service = EngineExplorerServiceDefinition.factory({ engine } as IEngineContext, {} as IShellService, selectionService, watcherService)!;
        service.addRenderingContextNodeProvider({
            predicate: (context): context is TextRenderer => context === renderer,
            getNodes: () => rendererEntities.map((rendererEntity) => ({ id: "renderer-entity", entity: rendererEntity, getDisplayInfo: () => ({ name: "Renderer entity" }) })),
            getSnapshot: () => rendererEntities,
        });
        const genericEntities = [entity];
        const genericChanged = new Observable<void>();
        const genericRegistration = service.addNodeProvider({
            predicate: (parent): parent is EngineContext => parent === engine,
            getNodes: () => genericEntities.map((genericEntity) => ({ id: "generic-entity", entity: genericEntity, getDisplayInfo: () => ({ name: "Generic entity" }) })),
            onChanged: genericChanged,
        });

        rendererEntities.splice(0, 1);
        notifyTopologyChanged?.();
        expect(selectionService.selectedEntity).toBe(entity);

        genericEntities.splice(0, 1);
        genericChanged.notifyObservers();
        expect(selectionService.selectedEntity).toBeNull();

        service.dispose?.();
        selectionService.selectedEntity = entity;
        genericChanged.notifyObservers();
        expect(selectionService.selectedEntity).toBe(entity);
        genericRegistration.dispose();
    });
});

describe("Babylon Lite scene resource explorer services", () => {
    it("registers product-specific providers with the engine explorer", () => {
        expect(EngineExplorerServiceDefinition.produces).toEqual([EngineExplorerServiceIdentity, ExplorerServiceIdentity]);
        expect(MeshExplorerServiceDefinition.consumes).toEqual([
            EngineExplorerServiceIdentity,
            ExplorerServiceIdentity,
            WatcherServiceIdentity,
            SelectionServiceIdentity,
            EngineContextIdentity,
        ]);
        expect(MaterialExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity, WatcherServiceIdentity]);
        expect(TextureExplorerServiceDefinition.consumes).toEqual([EngineExplorerServiceIdentity]);
        expect(TextLayerExplorerServiceDefinition.consumes).toEqual([
            EngineExplorerServiceIdentity,
            ExplorerServiceIdentity,
            WatcherServiceIdentity,
            SelectionServiceIdentity,
            EngineContextIdentity,
        ]);
        expect(SpriteLayerExplorerServiceDefinition.consumes).toEqual([
            EngineExplorerServiceIdentity,
            ExplorerServiceIdentity,
            WatcherServiceIdentity,
            SelectionServiceIdentity,
            EngineContextIdentity,
        ]);
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
            watchValue: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as IWatcherService;
        const commandDisposals: ReturnType<typeof vi.fn>[] = [];
        const explorerService = {
            addItemCommand: vi.fn(() => {
                const commandDispose = vi.fn();
                commandDisposals.push(commandDispose);
                return { dispose: commandDispose };
            }),
        } as unknown as IExplorerService;
        const selectionService = { selectedEntity: null } as ISelectionService;

        const redTexture = { width: 1, height: 1 } as Texture2D;
        const blueTexture = { width: 2, height: 2 } as Texture2D;
        const standardMaterial = CreateMaterial("standard", "Red Material", redTexture);
        const pbrMaterial = CreateMaterial("pbr", "Blue Material", blueTexture);
        const redMesh = CreateMesh("Red Box", standardMaterial);
        const blueMesh = CreateMesh("Blue Sphere", pbrMaterial);
        const scene = {
            _kind: "scene",
            meshes: [redMesh, blueMesh, CreateMesh("Small Red Box", standardMaterial)],
            camera: null,
            lights: [],
            shadowGenerators: [],
        } as SceneContext;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [scene],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];
        const registrations = [
            MeshExplorerServiceDefinition.factory(engineExplorerService, explorerService, watcherService, selectionService, { engine } as IEngineContext),
            MaterialExplorerServiceDefinition.factory(engineExplorerService, watcherService),
            TextureExplorerServiceDefinition.factory(engineExplorerService),
            TextLayerExplorerServiceDefinition.factory(engineExplorerService, explorerService, watcherService, selectionService, { engine } as IEngineContext),
        ];

        const descriptions = providers
            .filter((provider) => provider.predicate(scene))
            .sort((left, right) => (left.order ?? 0) - (right.order ?? 0))
            .flatMap((provider) => provider.getNodes(scene));
        const tree = BuildExplorerTree(descriptions);

        expect(GetNames(tree.nodes)).toEqual(["Nodes", "Materials", "Textures"]);
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
        commandDisposals.forEach((commandDispose) => expect(commandDispose).toHaveBeenCalledOnce());
    });

    it("contributes ordered Text and Sprite layers with parity commands and clean disposal", () => {
        const providers: RenderingContextNodeProvider<RenderingContext>[] = [];
        const providerDisposals: ReturnType<typeof vi.fn>[] = [];
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<RenderingContext>) => {
                providers.push(provider);
                const dispose = vi.fn();
                providerDisposals.push(dispose);
                return { dispose };
            },
        } as IEngineExplorerService;
        const commands: import("../../src/components/explorer/explorerModel").ExplorerCommandProvider<object>[] = [];
        const commandDisposals: ReturnType<typeof vi.fn>[] = [];
        const explorerService = {
            addItemCommand: (command: import("../../src/components/explorer/explorerModel").ExplorerCommandProvider<object>) => {
                commands.push(command);
                const dispose = vi.fn();
                commandDisposals.push(dispose);
                return { dispose };
            },
        } as unknown as IExplorerService;
        const watcherDisposals: ReturnType<typeof vi.fn>[] = [];
        const watcherService = {
            watchProperty: vi.fn(() => {
                const dispose = vi.fn();
                watcherDisposals.push(dispose);
                return { dispose };
            }),
        } as unknown as IWatcherService;
        const selectionService = { selectedEntity: null } as ISelectionService;

        const firstTextLayer = { data: { runs: [] }, order: 10, visible: true } as unknown as TextLayer;
        const secondTextLayer = { data: { runs: [] }, order: 0, visible: true } as unknown as TextLayer;
        const textLayers = [firstTextLayer, secondTextLayer];
        const textRenderer = { _kind: "text-renderer", layers: textLayers } as unknown as TextRenderer;
        const firstSpriteLayer = { count: 1, order: 5, visible: true } as unknown as Sprite2DLayer;
        const secondSpriteLayer = { count: 2, order: -1, visible: true } as unknown as Sprite2DLayer;
        const spriteLayers = [firstSpriteLayer, secondSpriteLayer];
        const spriteRenderer = { _kind: "sprite-renderer", layers: spriteLayers } as unknown as SpriteRenderer;
        const auxiliarySurface = { _renderingContexts: [textRenderer, spriteRenderer] } as unknown as SurfaceContext;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine, auxiliarySurface];
        const engineContext = { engine } as IEngineContext;
        const registrations = [
            TextLayerExplorerServiceDefinition.factory(engineExplorerService, explorerService, watcherService, selectionService, engineContext),
            SpriteLayerExplorerServiceDefinition.factory(engineExplorerService, explorerService, watcherService, selectionService, engineContext),
        ];
        const textProvider = providers.find((provider) => provider.predicate(textRenderer))!;
        const spriteProvider = providers.find((provider) => provider.predicate(spriteRenderer))!;

        expect(textProvider.predicate(textRenderer)).toBe(true);
        expect(textProvider.predicate(spriteRenderer)).toBe(false);
        expect(spriteProvider.predicate(spriteRenderer)).toBe(true);
        expect(spriteProvider.predicate(textRenderer)).toBe(false);

        const textTree = BuildExplorerTree(textProvider.getNodes(textRenderer));
        const spriteTree = BuildExplorerTree(spriteProvider.getNodes(spriteRenderer));
        expect(GetNames(textTree.nodes)).toEqual(["Text Layer 1", "Text Layer 2"]);
        expect(textTree.nodes.map((node) => node.entity)).toEqual([secondTextLayer, firstTextLayer]);
        expect(GetNames(spriteTree.nodes)).toEqual(["Sprite Layer 1", "Sprite Layer 2"]);
        expect(spriteTree.nodes.map((node) => node.entity)).toEqual([secondSpriteLayer, firstSpriteLayer]);
        expect(renderToStaticMarkup(createElement(spriteTree.nodes[0].icon!, { entity: secondSpriteLayer }))).toContain(tokens.colorPalettePeachForeground2);

        const beforeOrderChange = textProvider.getSnapshot(textRenderer);
        firstTextLayer.order = -2;
        const afterOrderChange = textProvider.getSnapshot(textRenderer);
        expect(afterOrderChange[1]).not.toBe(beforeOrderChange[1]);
        expect(BuildExplorerTree(textProvider.getNodes(textRenderer)).nodes[0].entity).toBe(firstTextLayer);

        const textVisibilityProvider = commands.find((command) => command.order === 1100 && command.predicate(firstTextLayer))!;
        const textVisibilityCommand = textVisibilityProvider.getCommand(firstTextLayer);
        if (textVisibilityCommand.type !== "toggle") {
            throw new Error("Expected a Text layer visibility command.");
        }
        textVisibilityCommand.isEnabled = false;
        expect(firstTextLayer.visible).toBe(false);
        expect(textVisibilityCommand.displayName).toBe("Show Text Layer");
        textVisibilityCommand.dispose?.();

        const spriteVisibilityProvider = commands.find((command) => command.order === 1100 && command.predicate(secondSpriteLayer))!;
        const spriteVisibilityCommand = spriteVisibilityProvider.getCommand(secondSpriteLayer);
        if (spriteVisibilityCommand.type !== "toggle") {
            throw new Error("Expected a Sprite layer visibility command.");
        }
        spriteVisibilityCommand.isEnabled = false;
        expect(secondSpriteLayer.visible).toBe(false);
        expect(spriteVisibilityCommand.displayName).toBe("Show Sprite Layer");
        spriteVisibilityCommand.dispose?.();

        selectionService.selectedEntity = secondTextLayer;
        const textRemoveProvider = commands.find((command) => command.order === 10000 && command.predicate(secondTextLayer))!;
        const textRemoveCommand = textRemoveProvider.getCommand(secondTextLayer);
        if (textRemoveCommand.type !== "action") {
            throw new Error("Expected a Text layer remove command.");
        }
        textRemoveCommand.execute();
        expect(RemoveTextRendererLayer).toHaveBeenCalledWith(textRenderer, secondTextLayer);
        expect(textLayers).toEqual([firstTextLayer]);
        expect(selectionService.selectedEntity).toBeNull();

        selectionService.selectedEntity = secondSpriteLayer;
        const spriteRemoveProvider = commands.find((command) => command.order === 10000 && command.predicate(secondSpriteLayer))!;
        const spriteRemoveCommand = spriteRemoveProvider.getCommand(secondSpriteLayer);
        if (spriteRemoveCommand.type !== "action") {
            throw new Error("Expected a Sprite layer remove command.");
        }
        spriteRemoveCommand.execute();
        expect(RemoveSpriteRendererLayer).toHaveBeenCalledWith(spriteRenderer, secondSpriteLayer);
        expect(spriteLayers).toEqual([firstSpriteLayer]);
        expect(selectionService.selectedEntity).toBeNull();

        const sharedSpriteRenderer = { _kind: "sprite-renderer", layers: [firstSpriteLayer] } as unknown as SpriteRenderer;
        (auxiliarySurface as { _renderingContexts: RenderingContext[] })._renderingContexts.push(sharedSpriteRenderer);
        selectionService.selectedEntity = firstSpriteLayer;
        expect(spriteRemoveProvider.predicate(firstSpriteLayer)).toBe(false);
        expect(selectionService.selectedEntity).toBe(firstSpriteLayer);

        registrations.forEach((registration) => registration?.dispose?.());
        providerDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
        commandDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
        expect(watcherDisposals).toHaveLength(2);
        watcherDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
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
            watchValue: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as IWatcherService;
        const effectRenderer = { _kind: "effect-renderer" } as RenderingContext;
        const engine = {
            surfaces: [] as unknown as EngineContext["surfaces"],
            _renderingContexts: [effectRenderer],
        } as unknown as EngineContext;
        (engine as { surfaces: readonly SurfaceContext[] }).surfaces = [engine];

        MeshExplorerServiceDefinition.factory(
            engineExplorerService,
            { addItemCommand: vi.fn(() => ({ dispose: vi.fn() })) } as unknown as IExplorerService,
            watcherService,
            {
                selectedEntity: null,
            } as ISelectionService,
            { engine } as IEngineContext
        );

        expect(providers[0].predicate(effectRenderer)).toBe(false);
    });
});
