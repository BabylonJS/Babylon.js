import { ThinTexture } from "core/Materials/Textures/thinTexture.js";
import { type ThinEngine } from "core/Engines/thinEngine.js";
import type { Nullable } from "core/types.js";

/**
 * Helper that takes in a URL to an image and returns a ThinTexture
 * @param engine - defines the engine to use to create the texture
 * @param url - defines a value which contains one of the following:
 * * A conventional http URL, e.g. 'http://...' or 'file://...'
 * * A base64 string of in-line texture data, e.g. 'data:image/jpg;base64,/...'
 * @param flipY - Indicates if the Y axis should be flipped
 * @param samplingMode - The sampling mode to use
 * @param forcedExtension - defines the extension to use to pick the right loader
 * @returns A ThinTexture of the image
 */
export function CreateImageTexture(
    engine: ThinEngine,
    url: string,
    flipY: Nullable<boolean> = null,
    samplingMode: number | undefined = undefined,
    forcedExtension: string | null = null
): ThinTexture {
    const internalTexture = engine.createTexture(url, true, flipY ?? true, null, samplingMode, null, null, null, null, null, forcedExtension);
    return new ThinTexture(internalTexture);
}

/*
    Future util ideas:
        HtmlElementTexture
        WebCamTexture
*/
