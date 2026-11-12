/**
 * @vitest-environment jsdom
 */
import {
    addBillboardSystemToScene,
    addDepthHostedSpriteLayerToScene,
    addTextRenderableToScene,
    removeBillboardSystemFromScene,
    removeDepthHostedSpriteLayerFromScene,
    removeTextRenderableFromScene,
    type BillboardSpriteSystem,
    type EngineContext,
    type SceneContext,
    type Sprite2DLayer,
    type TextRenderable,
} from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    );
});

import { CreateExplorerService } from "../../src/services/panes/explorer/explorerService";
import { type IEngineExplorerService, type RenderingContextNodeProvider } from "../../src/lite/engineExplorerService";
import { SceneRenderableExplorerServiceDefinition } from "../../src/lite/services/panes/scene/sceneRenderableExplorerService";
import { CreateP9Selection, CreateP9Watcher } from "./liteP9TestUtils";

describe("published Lite scene renderable membership", () => {
    it("notifies Explorer and clears selection when real Lite collections change", () => {
        const scene = { _kind: "scene", _deferredBuilders: [], _renderables: [], _disposables: [], _pickSources: [] } as unknown as SceneContext;
        const engine = { _renderingContexts: [scene] } as unknown as EngineContext;
        Object.assign(engine, { surfaces: [engine] });
        Object.assign(scene, { surface: { engine } });
        const text = {} as TextRenderable;
        const sprite = { depth: "test", visible: true } as Sprite2DLayer;
        const billboard = { visible: true } as BillboardSpriteSystem;
        const selection = CreateP9Selection();
        const { watcher } = CreateP9Watcher();
        const commands = CreateExplorerService();
        let provider: RenderingContextNodeProvider<SceneContext> | undefined;
        const explorer = {
            addRenderingContextNodeProvider: (value: RenderingContextNodeProvider<SceneContext>) => {
                provider = value;
                return { dispose: vi.fn() };
            },
        } as unknown as IEngineExplorerService;
        const service = SceneRenderableExplorerServiceDefinition.factory(explorer, commands, watcher, { engine }, selection)!;
        const changed = vi.fn();
        provider!.onChanged!.add(changed);
        addTextRenderableToScene(scene, text);
        addDepthHostedSpriteLayerToScene(scene, sprite);
        addBillboardSystemToScene(scene, billboard);
        expect(provider!.getSnapshot(scene)).toEqual([text, sprite, billboard]);
        expect(changed).toHaveBeenCalledTimes(3);
        selection.selectedEntity = sprite;
        expect(removeDepthHostedSpriteLayerFromScene(scene, sprite)).toBe(true);
        expect(selection.selectedEntity).toBeNull();
        expect(removeTextRenderableFromScene(scene, text)).toBe(true);
        expect(removeBillboardSystemFromScene(scene, billboard)).toBe(true);
        expect(provider!.getNodes(scene)).toEqual([]);
        service.dispose?.();
        commands.dispose();
    });
});
