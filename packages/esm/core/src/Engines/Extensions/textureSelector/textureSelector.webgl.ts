import type { Nullable } from "@babylonjs/core/types";
import type { IWebGLEnginePublic, WebGLEngineStateFull } from "../../engine.webgl";
import type { ITextureSelectorEngineExtension } from "./textureSelector.base";
import { _getExtensionState, _transformTextureUrl } from "./textureSelector.base";

export const setCompressedTextureExclusions: ITextureSelectorEngineExtension["setCompressedTextureExclusions"] = function (
    engineState: IWebGLEnginePublic,
    skippedFiles: Array<string>
): void {
    _getExtensionState(engineState)._excludedCompressedTextures = skippedFiles;
};

export const setTextureFormatToUse: ITextureSelectorEngineExtension["setTextureFormatToUse"] = function (
    engineState: IWebGLEnginePublic,
    formatsAvailable: Array<string>
): Nullable<string> {
    const state = _getExtensionState(engineState);
    const fes = engineState as WebGLEngineStateFull;
    const texturesSupported = state.texturesSupported;
    for (let i = 0, len1 = texturesSupported.length; i < len1; i++) {
        for (let j = 0, len2 = formatsAvailable.length; j < len2; j++) {
            if (texturesSupported[i] === formatsAvailable[j].toLowerCase()) {
                fes._transformTextureUrl = _transformTextureUrl.bind(state);
                return (state._textureFormatInUse = texturesSupported[i]);
            }
        }
    }
    // actively set format to nothing, to allow this to be called more than once
    // and possibly fail the 2nd time
    state._textureFormatInUse = "";
    fes._transformTextureUrl = null;
    return null;
};

export const getTextureSelectorEngineExtension: ITextureSelectorEngineExtension = {
    setCompressedTextureExclusions,
    setTextureFormatToUse,
};

export default getTextureSelectorEngineExtension;