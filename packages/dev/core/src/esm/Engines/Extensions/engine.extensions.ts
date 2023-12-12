/* eslint-disable jsdoc/require-jsdoc */
import { augmentEngineState } from "../engine.adapters";
import type { IBaseEnginePublic } from "../engine.base";
import type { ICubeTextureEngineExtension } from "./cubeTexture/cubeTexture.base";
import type { IRawTextureEngineExtension } from "./rawTexture/engine.rawTexture.base";
import type { IMultiRenderEngineExtension } from "./multiRender/multiRender.base";
import type { IRenderTargetEngineExtension } from "./renderTarget/renderTarget.base";
import type { ITransformFeedbackEngineExtension } from "./transformFeedback/engine.transformFeedback.base";
import type { IAlphaEngineExtension } from "./alpha/alpha.base";
import type { IDynamicBufferEngineExtension } from "./dynamicBuffer/dynamicBuffer.base";
import type { IQueryEngineExtension } from "./query/query.base";
import type { IDynamicTextureEngineExtension } from "./dynamicTexture/dynamicTexture.base";
import type { IViewsEngineExtension } from "./views/views.base";
import type { IMultiviewEngineExtension } from "./multiview/multiview.base";
import type { IReadTextureEngineExtension } from "./readTexture/readTexture.base";
import type { IRenderTargetCubeEngineExtension } from "./renderTargetCube/renderTargetCube.base";
import type { ITextureSelectorEngineExtension } from "./textureSelector/textureSelector.base";
import type { IUniformBufferEngineExtension } from "./uniformBuffer/uniformBuffer.base";
import type { IVideoTextureEngineExtension } from "./videoTexture/videoTexture.base";

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
    MULTIVIEW = 10,
    READ_TEXTURE = 11,
    RENDER_TARGET_CUBE = 12,
    TEXTURE_SELECTOR = 13,
    UNIFORM_BUFFER = 14,
    VIDEO_TEXTURE = 15,
}

export interface IBaseEngineExtension {
    extensionState: any;
    initExtension(): void;
}

export interface IEngineExtensions {
    [EngineExtensions.RAW_TEXTURE]?: IRawTextureEngineExtension;
    [EngineExtensions.TRANSFORM_FEEDBACK]?: ITransformFeedbackEngineExtension;
    [EngineExtensions.RENDER_TARGET]?: IRenderTargetEngineExtension;
    [EngineExtensions.MULTI_RENDER]?: IMultiRenderEngineExtension;
    [EngineExtensions.CUBE_TEXTURE]?: ICubeTextureEngineExtension;
    [EngineExtensions.ALPHA]?: IAlphaEngineExtension;
    [EngineExtensions.QUERY]?: IQueryEngineExtension;
    [EngineExtensions.DYNAMIC_BUFFER]?: IDynamicBufferEngineExtension;
    [EngineExtensions.DYNAMIC_TEXTURE]?: IDynamicTextureEngineExtension;
    [EngineExtensions.VIEWS]?: IViewsEngineExtension;
    [EngineExtensions.MULTIVIEW]?: IMultiviewEngineExtension;
    [EngineExtensions.READ_TEXTURE]?: IReadTextureEngineExtension;
    [EngineExtensions.RENDER_TARGET_CUBE]?: IRenderTargetCubeEngineExtension;
    [EngineExtensions.TEXTURE_SELECTOR]?: ITextureSelectorEngineExtension;
    [EngineExtensions.UNIFORM_BUFFER]?: IUniformBufferEngineExtension;
    [EngineExtensions.VIDEO_TEXTURE]?: IVideoTextureEngineExtension;
}

export type IEngineExtension = IEngineExtensions[EngineExtensions];

const loadedExtensions: { [key: string]: IEngineExtensions } = {};

/**
 * this array stores engine extensions base on the engine unique id
 */
const engineExtensions: IEngineExtensions[] = [];

export function getEngineExtensions(engineState: IBaseEnginePublic): IEngineExtensions {
    engineExtensions[engineState.uniqueId] = engineExtensions[engineState.uniqueId] || ({} as IEngineExtensions);
    return engineExtensions[engineState.uniqueId];
}

export function getEngineExtension<K extends keyof IEngineExtensions>(engineState: IBaseEnginePublic, type: K): IEngineExtensions[K] {
    try {
        return getEngineExtensions(engineState)[type];
    } catch (e) {
        throw new Error(`Extension ${type} is not available`);
    }
}

export function loadExtension<K extends keyof IEngineExtensions>(
    type: K,
    extension: IEngineExtensions[K],
    engineType: string = "WebGL" /* WebGL | WebGPU */
): IEngineExtensions[K] {
    loadedExtensions[engineType] = loadedExtensions[engineType] || {};
    loadedExtensions[engineType][type] = extension;
    return extension;
}

export function setExtension<K extends keyof IEngineExtensions, T extends IBaseEnginePublic>(engineState: T, type: K, extension: IEngineExtensions[K]) {
    const extensions = getEngineExtensions(engineState);
    // the any cast is required to avoid TS error when setting the extension
    extensions[type] = extension;
    // augment the engine state with these functions
    // casted to any, as this is a legacy solution and is not part of the engine interface
    augmentEngineState(engineState as any, extension as any);

    if (!loadedExtensions[type]) {
        loadExtension(type, extension, engineState.name);
    }
}

/**
 * Augment an engine state with the extensions tht are already loaded
 * @param engineState the engine state to augment
 */
export function augmentEngineStateWithExtensions(engineState: IBaseEnginePublic) {
    const engineType = engineState.name;
    // augment the engine state with these functions
    // casted to any, as this is a legacy solution and is not part of the engine interface
    const extensionsTypeArray = Object.keys(loadedExtensions[engineType]) as unknown as EngineExtensions[];
    for (const extension of extensionsTypeArray) {
        setExtension(engineState, extension, loadedExtensions[engineType][extension]);
    }
}
