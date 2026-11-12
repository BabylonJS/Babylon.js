import {
    getSceneBillboardSystems,
    getSceneDepthHostedSpriteLayers,
    getSceneTextRenderables,
    type BillboardSpriteSystem,
    type EngineContext,
    type SceneContext,
    type Sprite2DLayer,
    type TextRenderable,
} from "@babylonjs/lite";

import { GetSceneContexts } from "./sceneEntityUtils";

export type SceneRenderable = TextRenderable | Sprite2DLayer | BillboardSpriteSystem;

export function GetSceneCustomRenderables(scene: SceneContext): readonly SceneRenderable[] {
    return [...getSceneTextRenderables(scene), ...getSceneDepthHostedSpriteLayers(scene), ...getSceneBillboardSystems(scene)];
}

export function GetEngineCustomRenderables(engine: EngineContext): readonly SceneRenderable[] {
    return [...new Set(GetSceneContexts(engine).flatMap(GetSceneCustomRenderables))];
}

export function IsSceneTextRenderable(engine: EngineContext, entity: unknown): entity is TextRenderable {
    return GetSceneContexts(engine).some((scene) => getSceneTextRenderables(scene).some((item) => item === entity));
}

export function IsSceneSpriteLayer(engine: EngineContext, entity: unknown): entity is Sprite2DLayer {
    return GetSceneContexts(engine).some((scene) => getSceneDepthHostedSpriteLayers(scene).some((item) => item === entity));
}

export function IsSceneBillboardSystem(engine: EngineContext, entity: unknown): entity is BillboardSpriteSystem {
    return GetSceneContexts(engine).some((scene) => getSceneBillboardSystems(scene).some((item) => item === entity));
}
