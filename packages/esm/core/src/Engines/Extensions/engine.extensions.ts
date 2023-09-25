import type { IBaseEnginePublic } from "../engine.base";
import type { IRawTextureEngineExtension } from "./engine.rawTexture.base";
import type { ITransformFeedbackEngineExtension } from "./transformFeedback/transformFeedback.base";

export const enum EngineExtensions {
    RAW_TEXTURE = "rawTexture",
    TRANSFORM_FEEDBACK = "transformFeedback",
}

export interface IEngineExtensions {
    [EngineExtensions.RAW_TEXTURE]: IRawTextureEngineExtension;
    [EngineExtensions.TRANSFORM_FEEDBACK]: ITransformFeedbackEngineExtension;
}

const engineExtensions: IEngineExtensions[] = [];

export function getEngineExtensions(engineState: IBaseEnginePublic): IEngineExtensions {
    engineExtensions[engineState.uniqueId] = engineExtensions[engineState.uniqueId] || ({} as IEngineExtensions);
    return engineExtensions[engineState.uniqueId];
}

export function getEngineExtension(engineState: IBaseEnginePublic, type: EngineExtensions) {
    return getEngineExtensions(engineState)[type];
}
