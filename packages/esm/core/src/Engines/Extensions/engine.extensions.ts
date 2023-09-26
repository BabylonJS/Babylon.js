import { augmentEngineState } from "../engine.adapters";
import type { IBaseEnginePublic } from "../engine.base";
import type { IRawTextureEngineExtension } from "./engine.rawTexture.base";
import type { IRenderTargetEngineExtension } from "./renderTarget/renderTarget.base";
import type { ITransformFeedbackEngineExtension } from "./transformFeedback/engine.transformFeedback.base";

export const enum EngineExtensions {
    RAW_TEXTURE = 0,
    TRANSFORM_FEEDBACK = 1,
    RENDER_TARGET = 2,
}

export interface IEngineExtensions {
    [EngineExtensions.RAW_TEXTURE]: IRawTextureEngineExtension;
    [EngineExtensions.TRANSFORM_FEEDBACK]: ITransformFeedbackEngineExtension;
    [EngineExtensions.RENDER_TARGET]: IRenderTargetEngineExtension;
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

export function getEngineExtension(engineState: IBaseEnginePublic, type: EngineExtensions) {
    return getEngineExtensions(engineState)[type];
}

export function setExtension<T extends IEngineExtension>(engineState: IBaseEnginePublic, type: EngineExtensions, extension: T) {
    const extensions = getEngineExtensions(engineState);
    const castedExtension = extension as unknown as /*IEngineExtensions[typeof type]*/ any;
    // the any cast is required to avoid TS error when setting the extension
    extensions[type] = castedExtension;
    // augment the engine state with these functions
    augmentEngineState(engineState, castedExtension);
}
