/* eslint-disable jsdoc/require-jsdoc */
import { augmentEngineState } from "../engine.adapters.js";
import type { IBaseEnginePublic } from "../engine.base.js";
import type { ICubeTextureEngineExtension } from "./cubeTexture/cubeTexture.base.js";
import type { IRawTextureEngineExtension } from "./rawTexture/engine.rawTexture.base.js";
import type { IMultiRenderEngineExtension } from "./multiRender/multiRender.base.js";
import type { IRenderTargetEngineExtension } from "./renderTarget/renderTarget.base.js";
import type { ITransformFeedbackEngineExtension } from "./transformFeedback/engine.transformFeedback.base.js";
import type { IAlphaEngineExtension } from "./alpha/alpha.base.js";
import type { IDynamicBufferEngineExtension } from "./dynamicBuffer/dynamicBuffer.base.js";
import type { IQueryEngineExtension } from "./query/query.base.js";
import type { IDynamicTextureEngineExtension } from "./dynamicTexture/dynamicTexture.base.js";
import type { IViewsEngineExtension } from "./views/views.base.js";

export const enum EngineExtensions {
    RAW_TEXTURE = 0,
    TRANSFORM_FEEDBACK = 1,
    RENDER_TARGET = 2,
    MULTI_RENDER = 3,
    CUBE_TEXTURE = 4,
    ALPHA = 5,
    QUERY = 6,
    DYNAMIC_BUFFER = 7,
    DYNAMIC_TEXTURE = 8,
    VIEWS = 9,
}

export interface IBaseEngineExtension {
    extensionState: any;
    initExtension(): void;
}

export interface IEngineExtensions {
    [EngineExtensions.RAW_TEXTURE]: IRawTextureEngineExtension;
    [EngineExtensions.TRANSFORM_FEEDBACK]: ITransformFeedbackEngineExtension;
    [EngineExtensions.RENDER_TARGET]: IRenderTargetEngineExtension;
    [EngineExtensions.MULTI_RENDER]: IMultiRenderEngineExtension;
    [EngineExtensions.CUBE_TEXTURE]: ICubeTextureEngineExtension;
    [EngineExtensions.ALPHA]: IAlphaEngineExtension;
    [EngineExtensions.QUERY]: IQueryEngineExtension;
    [EngineExtensions.DYNAMIC_BUFFER]: IDynamicBufferEngineExtension;
    [EngineExtensions.DYNAMIC_TEXTURE]: IDynamicTextureEngineExtension;
    [EngineExtensions.VIEWS]: IViewsEngineExtension;
}

export type IEngineExtension = IEngineExtensions[EngineExtensions];

/**
 * this array stores engine extensions base on the engine unique id
 */
const engineExtensions: IEngineExtensions[] = [];

export function getEngineExtensions(engineState: IBaseEnginePublic): IEngineExtensions {
    engineExtensions[engineState.uniqueId] = engineExtensions[engineState.uniqueId] || ({} as IEngineExtensions);
    return engineExtensions[engineState.uniqueId];
}

export function getEngineExtension<K extends keyof IEngineExtensions>(engineState: IBaseEnginePublic, type: K): IEngineExtensions[K] {
    return getEngineExtensions(engineState)[type];
}

export function setExtension<K extends keyof IEngineExtensions>(engineState: IBaseEnginePublic, type: K, extension: IEngineExtensions[K]) {
    const extensions = getEngineExtensions(engineState);
    // the any cast is required to avoid TS error when setting the extension
    extensions[type] = extension;
    // augment the engine state with these functions
    // casted to any, as this is a legacy solution and is not part of the engine interface
    augmentEngineState(engineState, extension as any);
}
