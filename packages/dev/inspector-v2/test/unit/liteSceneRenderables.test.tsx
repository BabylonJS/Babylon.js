/**
 * @vitest-environment jsdom
 */
import { type BillboardSpriteSystem, type SceneContext, type Sprite2DLayer, type TextRenderable } from "@babylonjs/lite";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { Scenes, Texts, Sprites, Billboards, Listeners } = vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
    return {
        Scenes: [] as SceneContext[],
        Texts: new Map<SceneContext, TextRenderable[]>(),
        Sprites: new Map<SceneContext, Sprite2DLayer[]>(),
        Billboards: new Map<SceneContext, BillboardSpriteSystem[]>(),
        Listeners: new Map<SceneContext, Set<() => void>>(),
    };
});

vi.mock("@babylonjs/lite", async (importOriginal) => {
    const subscribe = (scene: SceneContext, listener: () => void) => {
        let listeners = Listeners.get(scene);
        if (!listeners) {
            listeners = new Set();
            Listeners.set(scene, listeners);
        }
        listeners.add(listener);
        return () => listeners.delete(listener);
    };
    return {
        ...(await importOriginal<typeof import("@babylonjs/lite")>()),
        getRenderingContexts: () => Scenes,
        getRenderingContextKind: () => "scene",
        getSceneTextRenderables: (scene: SceneContext) => Texts.get(scene) ?? [],
        getSceneDepthHostedSpriteLayers: (scene: SceneContext) => Sprites.get(scene) ?? [],
        getSceneBillboardSystems: (scene: SceneContext) => Billboards.get(scene) ?? [],
        onSceneTextRenderablesChanged: subscribe,
        onSceneDepthHostedSpriteLayersChanged: subscribe,
        onSceneBillboardSystemsChanged: subscribe,
    };
});

import { BuildExplorerTree } from "../../src/components/explorer/explorerModel";
import { CreateExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type IPropertiesService } from "../../src/services/panes/properties/propertiesService";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { SceneRenderableExplorerServiceDefinition } from "../../src/lite/services/panes/scene/sceneRenderableExplorerService";
import { SceneRenderablePropertiesServiceDefinition } from "../../src/lite/services/panes/properties/sceneRenderablePropertiesService";
import { SpriteLayerPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/spriteLayerPropertiesService";
import { CreateP9Engine, CreateP9Selection, CreateP9Watcher } from "./liteP9TestUtils";

beforeEach(() => {
    Scenes.length = 0;
    Texts.clear();
    Sprites.clear();
    Billboards.clear();
    Listeners.clear();
});

describe("scene-hosted renderable inspection", () => {
    it("discovers all families, observes membership, reconciles selection across scenes, and disposes subscriptions", () => {
        const { engine, scene } = CreateP9Engine();
        const other = { meshes: [] } as unknown as SceneContext;
        Scenes.push(scene, other);
        const text = {} as TextRenderable;
        const sprite = { visible: true } as Sprite2DLayer;
        const billboard = { visible: true } as BillboardSpriteSystem;
        Texts.set(scene, [text]);
        Texts.set(other, [text]);
        Sprites.set(scene, [sprite]);
        Billboards.set(scene, [billboard]);
        const { watcher, checks } = CreateP9Watcher();
        const selection = CreateP9Selection();
        const commands = CreateExplorerService();
        let provider: RenderingContextNodeProvider<SceneContext> | undefined;
        const dispose = vi.fn();
        const explorer = {
            addRenderingContextNodeProvider: (value: RenderingContextNodeProvider<SceneContext>) => {
                provider = value;
                return { dispose };
            },
        } as unknown as IEngineExplorerService;
        const service = SceneRenderableExplorerServiceDefinition.factory(explorer, commands, watcher, { engine }, selection)!;
        expect(provider!.getSnapshot(scene)).toEqual([text, sprite, billboard]);
        const tree = BuildExplorerTree(provider!.getNodes(scene));
        expect(tree.nodes.map((node) => node.getDisplayInfo().name)).toEqual(["Text Renderables", "Depth-hosted Sprite Layers", "Billboard Systems"]);
        expect(tree.nodes.map((node) => node.children![0].entity)).toEqual([text, sprite, billboard]);
        const changed = vi.fn();
        provider!.onChanged!.add(changed);
        const command = commands.itemCommandProviders.items[0];
        expect(command.predicate(sprite)).toBe(true);
        expect(command.predicate(billboard)).toBe(true);
        expect(command.predicate(text)).toBe(false);
        const toggle = command.getCommand(sprite);
        if (!toggle || toggle.type !== "toggle") {
            throw new Error("Expected visibility toggle");
        }
        toggle.isEnabled = false;
        expect(sprite.visible).toBe(false);
        toggle.dispose?.();

        selection.selectedEntity = text;
        Texts.delete(scene);
        Listeners.get(scene)!.forEach((listener) => listener());
        expect(changed).toHaveBeenCalled();
        expect(selection.selectedEntity).toBe(text);
        Texts.delete(other);
        Listeners.get(other)!.forEach((listener) => listener());
        expect(selection.selectedEntity).toBeNull();

        selection.selectedEntity = billboard;
        Scenes.splice(0, 1);
        watcher.refresh();
        expect(selection.selectedEntity).toBeNull();
        expect(Listeners.get(scene)!.size).toBe(0);
        service.dispose?.();
        expect(Listeners.get(other)!.size).toBe(0);
        expect(checks.size).toBe(0);
        expect(dispose).toHaveBeenCalledOnce();
        commands.dispose();
    });

    it("registers properties only for reachable objects, including depth-hosted sprite layers", () => {
        const { engine, scene } = CreateP9Engine();
        Scenes.push(scene);
        const text = {} as TextRenderable;
        const sprite = {} as Sprite2DLayer;
        const billboard = {} as BillboardSpriteSystem;
        Texts.set(scene, [text]);
        Sprites.set(scene, [sprite]);
        Billboards.set(scene, [billboard]);
        type Content = Parameters<IPropertiesService["addSectionContent"]>[0];
        const dispose = vi.fn();
        const add = vi.fn<(content: Content) => { dispose: () => void }>(() => ({ dispose }));
        const properties = { addSectionContent: add } as unknown as IPropertiesService;
        const service = SceneRenderablePropertiesServiceDefinition.factory(properties, { engine })!;
        const spriteService = SpriteLayerPropertiesServiceDefinition.factory(properties, { engine })!;
        const [textContent, billboardContent, spriteContent] = add.mock.calls.map(([content]) => content);
        expect(textContent.predicate(text)).toBe(true);
        expect(textContent.predicate({})).toBe(false);
        expect(billboardContent.predicate(billboard)).toBe(true);
        expect(spriteContent.predicate(sprite)).toBe(true);
        expect(textContent.content.map((item) => item.section)).toEqual(["General", "Transform"]);
        Texts.delete(scene);
        expect(textContent.predicate(text)).toBe(false);
        service.dispose?.();
        spriteService.dispose?.();
        expect(dispose).toHaveBeenCalledTimes(3);
    });
});
