import { type Camera, type DirectionalLight, type Mesh, type SceneContext, type SceneNode, type ShadowGenerator } from "@babylonjs/lite";
import { tokens } from "@fluentui/react-components";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const original = await importOriginal<typeof import("@babylonjs/lite")>();
    return {
        ...original,
        removeFromScene: vi.fn((scene: SceneContext, entity: object) => {
            if (scene.camera === entity) {
                scene.camera = null;
            }
            if ("children" in entity && Array.isArray(entity.children)) {
                const removedNodes = new Set<object>([entity]);
                const addChildren = (node: { children: SceneNode[] }) => {
                    node.children.forEach((child) => {
                        removedNodes.add(child);
                        addChildren(child);
                    });
                };
                addChildren(entity as { children: SceneNode[] });
                for (let index = scene.meshes.length - 1; index >= 0; index--) {
                    if (removedNodes.has(scene.meshes[index])) {
                        scene.meshes.splice(index, 1);
                    }
                }
            }
            const lightIndex = scene.lights.indexOf(entity as DirectionalLight);
            if (lightIndex !== -1) {
                scene.lights.splice(lightIndex, 1);
            }
            const shadowIndex = scene.shadowGenerators.indexOf(entity as ShadowGenerator);
            if (shadowIndex !== -1) {
                scene.shadowGenerators.splice(shadowIndex, 1);
            }
        }),
        setParent: vi.fn((node: SceneNode, parent: SceneNode | null) => {
            if (node.parent && "children" in node.parent) {
                const index = node.parent.children.indexOf(node);
                if (index !== -1) {
                    node.parent.children.splice(index, 1);
                }
            }
            node.parent = parent;
            parent?.children.push(node);
        }),
        setSubtreeVisible: vi.fn((node: SceneNode, visible: boolean) => {
            node.visible = visible;
            node.children.forEach((child) => (child.visible = visible));
        }),
    };
});

import { BuildExplorerTree, type ExplorerCommandProvider } from "../../src/components/explorer/explorerModel";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { type IEngineContext } from "../../src/lite/engineContext";
import { GetSceneNodeRoots, SetQuaternionValue, SetVector3Value } from "../../src/lite/sceneEntityUtils";
import { CameraPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/cameraPropertiesService";
import { LightPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/lightPropertiesService";
import { SceneNodePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/sceneNodePropertiesService";
import { ShadowGeneratorPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/shadowGeneratorPropertiesService";
import { CameraExplorerServiceDefinition } from "../../src/lite/services/panes/scene/cameraExplorerService";
import { LightExplorerServiceDefinition } from "../../src/lite/services/panes/scene/lightExplorerService";
import { MeshExplorerServiceDefinition } from "../../src/lite/services/panes/scene/meshExplorerService";
import { ShadowGeneratorExplorerServiceDefinition } from "../../src/lite/services/panes/scene/shadowGeneratorExplorerService";
import { type IExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type ISelectionService } from "../../src/services/selectionService";
import { type IWatcherService } from "../../src/services/watcherService";

function CreateNode(name: string): SceneNode {
    const position = { x: 0, y: 0, z: 0, set: vi.fn(), copyFrom: vi.fn(), toArray: vi.fn() };
    const rotationQuaternion = { x: 0, y: 0, z: 0, w: 1, set: vi.fn(), copyFrom: vi.fn(), toArray: vi.fn() };
    const scaling = { x: 1, y: 1, z: 1, set: vi.fn(), copyFrom: vi.fn(), toArray: vi.fn() };
    return {
        name,
        children: [],
        position,
        rotationQuaternion,
        rotation: { x: 0, y: 0, z: 0, set: vi.fn() },
        scaling,
        parent: null,
        worldMatrix: new Float32Array(16),
        worldMatrixVersion: 0,
    };
}

function CreateMesh(name: string): Mesh {
    return {
        ...CreateNode(name),
        material: {},
        receiveShadows: false,
    } as Mesh;
}

function CreateScene(root: Mesh, camera: Camera, light: DirectionalLight, shadowGenerator: ShadowGenerator): SceneContext {
    return {
        _kind: "scene",
        meshes: [root, ...root.children.filter((child): child is Mesh => "material" in child)],
        camera,
        lights: [light],
        shadowGenerators: [shadowGenerator],
    } as SceneContext;
}

describe("Babylon Lite scene entities", () => {
    it("builds a hierarchy from public parent and children links", () => {
        const root = CreateMesh("Root");
        const child = CreateMesh("Child");
        const transform = CreateNode("Transform");
        root.children.push(transform);
        transform.parent = root;
        transform.children.push(child);
        child.parent = transform;
        const scene = { meshes: [root, child] } as SceneContext;

        expect(GetSceneNodeRoots(scene)).toEqual([root]);
    });

    it("mutates readonly transform references through public bulk setters", () => {
        const node = CreateNode("Node");

        SetVector3Value(node.position, [1, 2, 3]);
        SetQuaternionValue(node.rotationQuaternion, [0.1, 0.2, 0.3, 0.9]);

        expect(node.position.set).toHaveBeenCalledWith(1, 2, 3);
        expect(node.rotationQuaternion.set).toHaveBeenCalledWith(0.1, 0.2, 0.3, 0.9);
    });

    it("contributes nodes, cameras, lights, shadows, commands, and cleans up", () => {
        const providers: RenderingContextNodeProvider<SceneContext>[] = [];
        const providerDisposals: ReturnType<typeof vi.fn>[] = [];
        const commandProviders: ExplorerCommandProvider<object>[] = [];
        const commandDisposals: ReturnType<typeof vi.fn>[] = [];
        const engineExplorerService = {
            addRenderingContextNodeProvider: (provider: RenderingContextNodeProvider<SceneContext>) => {
                providers.push(provider);
                const dispose = vi.fn();
                providerDisposals.push(dispose);
                return { dispose };
            },
        } as IEngineExplorerService;
        const explorerService = {
            addItemCommand: (provider: ExplorerCommandProvider<object>) => {
                commandProviders.push(provider);
                const dispose = vi.fn();
                commandDisposals.push(dispose);
                return { dispose };
            },
        } as unknown as IExplorerService;
        const watcherService = {
            watchProperty: vi.fn(() => ({ dispose: vi.fn() })),
            watchValue: vi.fn(() => ({ dispose: vi.fn() })),
        } as unknown as IWatcherService;
        const selectionService = { selectedEntity: null } as ISelectionService;
        const root = CreateMesh("Root");
        const child = CreateMesh("Child");
        root.children.push(child);
        child.parent = root;
        const camera = {
            name: "Camera",
            fov: 1,
            nearPlane: 0.1,
            farPlane: 100,
            children: [],
            worldMatrix: new Float32Array(16),
            worldMatrixVersion: 0,
        } as Camera;
        const shadowGenerator = {};
        const light = {
            lightType: "directional",
            children: [],
            parent: null,
            worldMatrix: new Float32Array(16),
            worldMatrixVersion: 0,
            direction: { x: 0, y: -1, z: 0 },
            position: { x: 0, y: 1, z: 0 },
            diffuse: [1, 1, 1],
            specular: [1, 1, 1],
            intensity: 1,
            shadowGenerator,
        } as DirectionalLight;
        const scene = CreateScene(root, camera, light, shadowGenerator);
        const engine = {
            surfaces: [] as unknown[],
            _renderingContexts: [scene],
        };
        engine.surfaces.push(engine);
        const engineContext = { engine } as unknown as IEngineContext;

        const registrations = [
            MeshExplorerServiceDefinition.factory(engineExplorerService, explorerService, watcherService, selectionService, engineContext),
            CameraExplorerServiceDefinition.factory(engineExplorerService, explorerService, watcherService, selectionService, engineContext),
            LightExplorerServiceDefinition.factory(engineExplorerService, explorerService, selectionService, engineContext),
            ShadowGeneratorExplorerServiceDefinition.factory(engineExplorerService, explorerService, selectionService, engineContext),
        ];
        const descriptions = providers.flatMap((provider) => provider.getNodes(scene));
        const tree = BuildExplorerTree(descriptions);

        expect(tree.nodes.map((node) => node.getDisplayInfo().name)).toEqual(["Nodes", "Cameras", "Lights", "Shadow Generators"]);
        expect(tree.nodes[0].children[0].children[0].entity).toBe(child);
        expect(renderToStaticMarkup(createElement(tree.nodes[0].children[0].icon!, { entity: root }))).toContain(tokens.colorPaletteBlueForeground2);
        expect(renderToStaticMarkup(createElement(tree.nodes[1].children[0].icon!, { entity: camera }))).toContain(tokens.colorPaletteGreenForeground2);
        expect(renderToStaticMarkup(createElement(tree.nodes[2].children[0].icon!, { entity: light }))).toContain(tokens.colorPaletteYellowForeground2);
        expect(renderToStaticMarkup(createElement(tree.nodes[3].children[0].icon!, { entity: shadowGenerator }))).toContain(tokens.colorPaletteYellowForeground2);
        expect(commandProviders).toHaveLength(5);

        const nodeProvider = providers[0];
        const beforeReparent = nodeProvider.getSnapshot(scene);
        const dragDropConfig = descriptions[0].dragDropConfig;
        dragDropConfig?.onDrop(child, null);
        const afterReparent = nodeProvider.getSnapshot(scene);
        expect(child.parent).toBeNull();
        expect(afterReparent.at(-1)).not.toBe(beforeReparent.at(-1));
        dragDropConfig?.onDrop(child, root);

        const foreignRoot = CreateMesh("Foreign Root");
        const foreignScene = { ...scene, meshes: [foreignRoot], camera: null, lights: [], shadowGenerators: [] } as SceneContext;
        engine._renderingContexts.push(foreignScene);
        expect(dragDropConfig?.canDrop(child, foreignRoot)).toBe(false);
        engine._renderingContexts.pop();

        const visibilityProvider = commandProviders.find((provider) => provider.getCommand(root).type === "toggle");
        const visibilityCommand = visibilityProvider?.getCommand(root);
        if (visibilityCommand?.type !== "toggle") {
            throw new Error("Expected a visibility toggle command.");
        }
        visibilityCommand.isEnabled = false;
        expect(root.visible).toBe(false);
        expect(child.visible).toBe(false);

        const nodeRemoveProvider = commandProviders.find((provider) => provider.getCommand(root).displayName === "Remove from Scene");
        selectionService.selectedEntity = child;
        const childRemoveCommand = nodeRemoveProvider?.getCommand(child);
        if (childRemoveCommand?.type !== "action") {
            throw new Error("Expected a nested remove command.");
        }
        childRemoveCommand.execute();
        expect(root.children).not.toContain(child);
        expect(scene.meshes).not.toContain(child);
        expect(selectionService.selectedEntity).toBeNull();

        const cameraChild = CreateMesh("Camera Child");
        camera.children.push(cameraChild);
        cameraChild.parent = camera;
        scene.meshes.push(cameraChild);
        const cameraChildRemoveCommand = nodeRemoveProvider?.getCommand(cameraChild);
        if (cameraChildRemoveCommand?.type !== "action") {
            throw new Error("Expected a camera-child remove command.");
        }
        cameraChildRemoveCommand.execute();
        expect(camera.children).not.toContain(cameraChild);
        expect(scene.meshes).not.toContain(cameraChild);

        const secondScene = { ...scene, meshes: [root], camera: null, lights: [], shadowGenerators: [] } as SceneContext;
        engine._renderingContexts.push(secondScene);
        expect(nodeRemoveProvider?.predicate(root)).toBe(false);
        engine._renderingContexts.pop();
        expect(nodeRemoveProvider?.predicate(root)).toBe(true);
        const nodeRemoveCommand = nodeRemoveProvider?.getCommand(root);
        if (nodeRemoveCommand?.type !== "action") {
            throw new Error("Expected a remove command.");
        }
        selectionService.selectedEntity = root;
        nodeRemoveCommand.execute();
        expect(selectionService.selectedEntity).toBeNull();
        expect(scene.meshes).not.toContain(root);

        registrations.forEach((registration) => registration?.dispose?.());
        providerDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
        commandDisposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    });

    it("registers scene node, camera, light, and identity-only shadow properties", () => {
        const root = CreateMesh("Root");
        const camera = {
            name: "Camera",
            fov: 1,
            nearPlane: 0.1,
            farPlane: 100,
            children: [],
            worldMatrix: new Float32Array(16),
            worldMatrixVersion: 0,
        } as Camera;
        const shadowGenerator = {};
        const light = {
            lightType: "directional",
            children: [],
            parent: null,
            worldMatrix: new Float32Array(16),
            worldMatrixVersion: 0,
            direction: { x: 0, y: -1, z: 0 },
            position: { x: 0, y: 1, z: 0 },
            diffuse: [1, 1, 1],
            specular: [1, 1, 1],
            intensity: 1,
            shadowGenerator,
        } as DirectionalLight;
        const scene = CreateScene(root, camera, light, shadowGenerator);
        const engine = {
            surfaces: [] as unknown[],
            _renderingContexts: [scene],
        };
        engine.surfaces.push(engine);
        const contents: Parameters<IPropertiesService["addSectionContent"]>[0][] = [];
        const disposals: ReturnType<typeof vi.fn>[] = [];
        const propertiesService = {
            addSectionContent: (content: Parameters<IPropertiesService["addSectionContent"]>[0]) => {
                contents.push(content);
                const dispose = vi.fn();
                disposals.push(dispose);
                return { dispose };
            },
        } as IPropertiesService;

        const registrations = [
            SceneNodePropertiesServiceDefinition.factory(propertiesService),
            CameraPropertiesServiceDefinition.factory(propertiesService),
            LightPropertiesServiceDefinition.factory(propertiesService),
            ShadowGeneratorPropertiesServiceDefinition.factory(propertiesService, { engine } as unknown as IEngineContext),
        ];

        expect(contents.map((content) => content.key)).toEqual([
            "Babylon Lite Scene Node Properties",
            "Babylon Lite Camera Properties",
            "Babylon Lite Free Camera Properties",
            "Babylon Lite Arc Rotate Camera Properties",
            "Babylon Lite Light Properties",
            "Babylon Lite Directional Light Properties",
            "Babylon Lite Point Light Properties",
            "Babylon Lite Spot Light Properties",
            "Babylon Lite Hemispheric Light Properties",
            "Babylon Lite Shadow Generator Properties",
        ]);
        expect(contents[0].predicate(root)).toBe(true);
        expect(contents[1].predicate(camera)).toBe(true);
        expect(contents[5].predicate(light)).toBe(true);
        expect(contents[9].predicate(shadowGenerator)).toBe(true);
        expect(contents[9].content[0].section).toBe("General");

        registrations.forEach((registration) => registration?.dispose?.());
        disposals.forEach((dispose) => expect(dispose).toHaveBeenCalledOnce());
    });
});
