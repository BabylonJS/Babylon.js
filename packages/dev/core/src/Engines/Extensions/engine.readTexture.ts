import { ThinEngine } from "../../Engines/thinEngine";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import type { Nullable } from "../../types";
import * as extension from "core/esm/Engines/WebGL/Extensions/readTexture/readTexture.webgl";
import { EngineExtensions, loadExtension } from "core/esm/Engines/Extensions/engine.extensions";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /** @internal */
        _readTexturePixels(
            texture: InternalTexture,
            width: number,
            height: number,
            faceIndex?: number,
            level?: number,
            buffer?: Nullable<ArrayBufferView>,
            flushRenderer?: boolean,
            noDataConversion?: boolean,
            x?: number,
            y?: number
        ): Promise<ArrayBufferView>;

        /** @internal */
        _readTexturePixelsSync(
            texture: InternalTexture,
            width: number,
            height: number,
            faceIndex?: number,
            level?: number,
            buffer?: Nullable<ArrayBufferView>,
            flushRenderer?: boolean,
            noDataConversion?: boolean,
            x?: number,
            y?: number
        ): ArrayBufferView;
    }
}

/**
 * Allocate a typed array depending on a texture type. Optionally can copy existing data in the buffer.
 * @param type type of the texture
 * @param sizeOrDstBuffer size of the array OR an existing buffer that will be used as the destination of the copy (if copyBuffer is provided)
 * @param sizeInBytes true if the size of the array is given in bytes, false if it is the number of elements of the array
 * @param copyBuffer if provided, buffer to copy into the destination buffer (either a newly allocated buffer if sizeOrDstBuffer is a number or use sizeOrDstBuffer as the destination buffer otherwise)
 * @returns the allocated buffer or sizeOrDstBuffer if the latter is an ArrayBuffer
 */
export function allocateAndCopyTypedBuffer(type: number, sizeOrDstBuffer: number | ArrayBuffer, sizeInBytes = false, copyBuffer?: ArrayBuffer): ArrayBufferView {
    return extension.allocateAndCopyTypedBuffer(type, sizeOrDstBuffer, sizeInBytes, copyBuffer);
}

ThinEngine.prototype._readTexturePixelsSync = function (
    texture: InternalTexture,
    width: number,
    height: number,
    faceIndex = -1,
    level = 0,
    buffer: Nullable<ArrayBufferView> = null,
    flushRenderer = true,
    noDataConversion = false,
    x = 0,
    y = 0
): ArrayBufferView {
    return extension._readTexturePixelsSync(this._engineState, texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion, x, y);
};

ThinEngine.prototype._readTexturePixels = function (
    texture: InternalTexture,
    width: number,
    height: number,
    faceIndex = -1,
    level = 0,
    buffer: Nullable<ArrayBufferView> = null,
    flushRenderer = true,
    noDataConversion = false,
    x = 0,
    y = 0
): Promise<ArrayBufferView> {
    return extension._readTexturePixels(this._engineState, texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion, x, y);
};

loadExtension(EngineExtensions.READ_TEXTURE, extension);
