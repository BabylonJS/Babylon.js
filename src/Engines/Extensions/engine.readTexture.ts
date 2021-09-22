import { ThinEngine } from "../../Engines/thinEngine";
import { InternalTexture } from '../../Materials/Textures/internalTexture';
import { Nullable } from '../../types';
import { Constants } from "../constants";

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /** @hidden */
        _readTexturePixels(texture: InternalTexture, width: number, height: number, faceIndex?: number, level?: number, buffer?: Nullable<ArrayBufferView>, flushRenderer?: boolean, noDataConversion?: boolean): Promise<ArrayBufferView>;

        /** @hidden */
        _readTexturePixelsSync(texture: InternalTexture, width: number, height: number, faceIndex?: number, level?: number, buffer?: Nullable<ArrayBufferView>, flushRenderer?: boolean, noDataConversion?: boolean): ArrayBufferView;
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
    switch (type) {
        case Constants.TEXTURETYPE_BYTE: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Int8Array(sizeOrDstBuffer) : new Int8Array(sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Int8Array(copyBuffer));
            }
            return buffer;
        }
        case Constants.TEXTURETYPE_UNSIGNED_BYTE: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint8Array(sizeOrDstBuffer) : new Uint8Array(sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Uint8Array(copyBuffer));
            }
            return buffer;
        }
        case Constants.TEXTURETYPE_SHORT: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Int16Array(sizeOrDstBuffer) : new Int16Array(sizeInBytes ? sizeOrDstBuffer / 2 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Int16Array(copyBuffer));
            }
            return buffer;
        }
        case Constants.TEXTURETYPE_UNSIGNED_SHORT:
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_4_4_4_4:
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_5_5_1:
        case Constants.TEXTURETYPE_UNSIGNED_SHORT_5_6_5:
        case Constants.TEXTURETYPE_HALF_FLOAT: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint16Array(sizeOrDstBuffer) : new Uint16Array(sizeInBytes ? sizeOrDstBuffer / 2 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Uint16Array(copyBuffer));
            }
            return buffer;
        }
        case Constants.TEXTURETYPE_INT: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Int32Array(sizeOrDstBuffer) : new Int32Array(sizeInBytes ? sizeOrDstBuffer / 4 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Int32Array(copyBuffer));
            }
            return buffer;
        }
        case Constants.TEXTURETYPE_UNSIGNED_INTEGER:
        case Constants.TEXTURETYPE_UNSIGNED_INT_2_10_10_10_REV:
        case Constants.TEXTURETYPE_UNSIGNED_INT_24_8:
        case Constants.TEXTURETYPE_UNSIGNED_INT_10F_11F_11F_REV:
        case Constants.TEXTURETYPE_UNSIGNED_INT_5_9_9_9_REV:
        case Constants.TEXTURETYPE_FLOAT_32_UNSIGNED_INT_24_8_REV: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint32Array(sizeOrDstBuffer) : new Uint32Array(sizeInBytes ? sizeOrDstBuffer / 4 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Uint32Array(copyBuffer));
            }
            return buffer;
        }
        case Constants.TEXTURETYPE_FLOAT: {
            const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Float32Array(sizeOrDstBuffer) : new Float32Array(sizeInBytes ? sizeOrDstBuffer / 4 : sizeOrDstBuffer);
            if (copyBuffer) {
                buffer.set(new Float32Array(copyBuffer));
            }
            return buffer;
        }
    }

    const buffer = sizeOrDstBuffer instanceof ArrayBuffer ? new Uint8Array(sizeOrDstBuffer) : new Uint8Array(sizeOrDstBuffer);
    if (copyBuffer) {
        buffer.set(new Uint8Array(copyBuffer));
    }
    return buffer;
}

ThinEngine.prototype._readTexturePixelsSync = function (texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true, noDataConversion = false): ArrayBufferView {
    let gl = this._gl;
    if (!gl) {
        throw new Error("Engine does not have gl rendering context.");
    }
    if (!this._dummyFramebuffer) {
        let dummy = gl.createFramebuffer();

        if (!dummy) {
            throw new Error("Unable to create dummy framebuffer");
        }

        this._dummyFramebuffer = dummy;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._dummyFramebuffer);

    if (faceIndex > -1) {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + faceIndex, texture._hardwareTexture?.underlyingResource, level);
    } else {
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture._hardwareTexture?.underlyingResource, level);
    }

    let readType = (texture.type !== undefined) ? this._getWebGLTextureType(texture.type) : gl.UNSIGNED_BYTE;

    if (!noDataConversion) {
        switch (readType) {
            case gl.UNSIGNED_BYTE:
                if (!buffer) {
                    buffer = new Uint8Array(4 * width * height);
                }
                readType = gl.UNSIGNED_BYTE;
                break;
            default:
                if (!buffer) {
                    buffer = new Float32Array(4 * width * height);
                }
                readType = gl.FLOAT;
                break;
        }
    } else if (!buffer) {
        buffer = allocateAndCopyTypedBuffer(texture.type, 4 * width * height);
    }

    if (flushRenderer) {
        this.flushFramebuffer();
    }

    gl.readPixels(0, 0, width, height, gl.RGBA, readType, <DataView>buffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._currentFramebuffer);

    return buffer;
};

ThinEngine.prototype._readTexturePixels = function (texture: InternalTexture, width: number, height: number, faceIndex = -1, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true, noDataConversion = false): Promise<ArrayBufferView> {
    return Promise.resolve(this._readTexturePixelsSync(texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion));
};
