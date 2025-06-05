import type { TextureSize } from "publishedBabylonCore/Materials/Textures/textureCreationOptions";
import type { OutputTextureOptions } from "../blockFoundation/textureOptions";
import type { SmartFilter } from "../smartFilter";
import type { ThinEngine } from "publishedBabylonCore/Engines/thinEngine";

/**
 * Determines the output texture size for a given shader block
 * @param smartFilter - The smart filter to use
 * @param engine - The engine to use
 * @param textureOptions - The texture options to use
 * @returns - The output texture size
 */
export function GetBlockOutputTextureSize(smartFilter: SmartFilter, engine: ThinEngine, textureOptions: OutputTextureOptions): TextureSize {
    let outputWidth: number;
    let outputHeight: number;
    const renderTargetWrapper = smartFilter.outputBlock.renderTargetWrapper;
    if (renderTargetWrapper) {
        outputWidth = renderTargetWrapper.width;
        outputHeight = renderTargetWrapper.height;
    } else {
        outputWidth = engine.getRenderWidth(true);
        outputHeight = engine.getRenderHeight(true);
    }
    return {
        width: Math.floor(outputWidth * textureOptions.ratio),
        height: Math.floor(outputHeight * textureOptions.ratio),
    };
}
