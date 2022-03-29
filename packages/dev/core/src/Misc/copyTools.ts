/* eslint-disable @typescript-eslint/naming-convention */
import type { ISize } from "../Maths/math.size";
import type { Nullable } from "../types";

declare type BaseTexture = import("../Materials/Textures/baseTexture").BaseTexture;

/**
 * Transform some pixel data to a base64 string
 * @param pixels defines the pixel data to transform to base64
 * @param size defines the width and height of the (texture) data
 * @param invertY true if the data must be inverted for the Y coordinate during the conversion
 * @returns The base64 encoded string or null
 */
export function GenerateBase64StringFromPixelData(pixels: ArrayBufferView, size: ISize, invertY = false): Nullable<string> {
    const width = size.width;
    const height = size.height;

    if (pixels instanceof Float32Array) {
        let len = pixels.byteLength / pixels.BYTES_PER_ELEMENT;
        const npixels = new Uint8Array(len);

        while (--len >= 0) {
            let val = pixels[len];
            if (val < 0) {
                val = 0;
            } else if (val > 1) {
                val = 1;
            }
            npixels[len] = val * 255;
        }

        pixels = npixels;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
        return null;
    }

    const imageData = ctx.createImageData(width, height);
    const castData = <any>imageData.data;
    castData.set(pixels);
    ctx.putImageData(imageData, 0, 0);

    if (invertY) {
        const canvas2 = document.createElement("canvas");
        canvas2.width = width;
        canvas2.height = height;

        const ctx2 = canvas2.getContext("2d");
        if (!ctx2) {
            return null;
        }

        ctx2.translate(0, height);
        ctx2.scale(1, -1);
        ctx2.drawImage(canvas, 0, 0);

        return canvas2.toDataURL("image/png");
    }

    return canvas.toDataURL("image/png");
}

/**
 * Reads the pixels stored in the webgl texture and returns them as a base64 string
 * @param texture defines the texture to read pixels from
 * @param faceIndex defines the face of the texture to read (in case of cube texture)
 * @param level defines the LOD level of the texture to read (in case of Mip Maps)
 * @returns The base64 encoded string or null
 */
export function GenerateBase64StringFromTexture(texture: BaseTexture, faceIndex = 0, level = 0): Nullable<string> {
    const internalTexture = texture.getInternalTexture();
    if (!internalTexture) {
        return null;
    }

    const pixels = texture._readPixelsSync(faceIndex, level);
    if (!pixels) {
        return null;
    }

    return GenerateBase64StringFromPixelData(pixels, texture.getSize(), internalTexture.invertY);
}

/**
 * Reads the pixels stored in the webgl texture and returns them as a base64 string
 * @param texture defines the texture to read pixels from
 * @param faceIndex defines the face of the texture to read (in case of cube texture)
 * @param level defines the LOD level of the texture to read (in case of Mip Maps)
 * @returns The base64 encoded string or null wrapped in a promise
 */
export async function GenerateBase64StringFromTextureAsync(texture: BaseTexture, faceIndex = 0, level = 0): Promise<Nullable<string>> {
    const internalTexture = texture.getInternalTexture();
    if (!internalTexture) {
        return null;
    }

    const pixels = await texture.readPixels(faceIndex, level);
    if (!pixels) {
        return null;
    }

    return GenerateBase64StringFromPixelData(pixels, texture.getSize(), internalTexture.invertY);
}

/**
 * Class used to host copy specific utilities
 * (Back-compat)
 */
export const CopyTools = {
    /**
     * Transform some pixel data to a base64 string
     * @param pixels defines the pixel data to transform to base64
     * @param size defines the width and height of the (texture) data
     * @param invertY true if the data must be inverted for the Y coordinate during the conversion
     * @returns The base64 encoded string or null
     */
    GenerateBase64StringFromPixelData,

    /**
     * Reads the pixels stored in the webgl texture and returns them as a base64 string
     * @param texture defines the texture to read pixels from
     * @param faceIndex defines the face of the texture to read (in case of cube texture)
     * @param level defines the LOD level of the texture to read (in case of Mip Maps)
     * @returns The base64 encoded string or null
     */
    GenerateBase64StringFromTexture,

    /**
     * Reads the pixels stored in the webgl texture and returns them as a base64 string
     * @param texture defines the texture to read pixels from
     * @param faceIndex defines the face of the texture to read (in case of cube texture)
     * @param level defines the LOD level of the texture to read (in case of Mip Maps)
     * @returns The base64 encoded string or null wrapped in a promise
     */
    GenerateBase64StringFromTextureAsync,
};
