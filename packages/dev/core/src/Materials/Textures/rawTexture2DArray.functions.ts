import { type ImageSource } from "../../types";
import { type Scene } from "../../scene";
import { Constants } from "../../Engines/constants";
import { RawTexture2DArray } from "./rawTexture2DArray";

/**
 * These helpers populate 2D array texture layers from decoded image sources.
 * They rely on the AbstractEngine.updateTextureArrayLayerFromImageSource engine extension, which is
 * an opt-in side effect. Register it before use by importing the matching module for your backend:
 * - WebGL2:  import "core/Engines/Extensions/engine.texture2DArrayImageSource";
 * - WebGPU:  import "core/Engines/WebGPU/Extensions/engine.texture2DArrayImageSource";
 * (the full Engine build does not register it by default to keep it out of every engine bundle).
 *
 * Consuming the result: the built-in way to sample a chosen layer is Node Material's Texture block,
 * which exposes a `layer` input (feed it a Float) and samples the array at that layer for you — no
 * custom shader code required. If you instead write your own shader, declare a `sampler2DArray`
 * (GLSL) / `texture_2d_array<f32>` (WGSL) uniform and sample it with an explicit integer layer index;
 * the classic StandardMaterial / PBRMaterial texture slots are plain 2D and cannot read an array layer.
 */

/**
 * Options controlling how an image source is uploaded into a 2D array texture layer.
 */
export interface IUploadImageToTexture2DArrayLayerOptions {
    /** Defines if the source must be stored with the Y axis inverted (false by default) */
    invertY?: boolean;
    /** Defines if the source alpha must be premultiplied (false by default) */
    premultiplyAlpha?: boolean;
}

/**
 * Options controlling the creation of a 2D array texture from a list of image urls.
 */
export interface ICreateTexture2DArrayFromImageUrlsOptions extends IUploadImageToTexture2DArrayLayerOptions {
    /** Defines if mip levels should be generated (true by default) */
    generateMipMaps?: boolean;
    /** Defines the sampling mode to use (Texture.TRILINEAR_SAMPLINGMODE by default) */
    samplingMode?: number;
    /** Defines the texture type (Constants.TEXTURETYPE_UNSIGNED_BYTE by default) */
    textureType?: number;
    /** Options forwarded to createImageBitmap when decoding each url */
    imageBitmapOptions?: ImageBitmapOptions;
}

/**
 * Uploads a decoded image source (ImageBitmap, canvas, video, image element...) into a single layer of a 2D array texture.
 * This is the image-source counterpart to RawTexture2DArray.update, which only accepts raw bytes.
 * @param texture defines the 2D array texture to upload into
 * @param source defines the image source to upload
 * @param layer defines the array layer to upload into
 * @param options defines optional upload settings (invertY, premultiplyAlpha)
 */
export function UploadImageToTexture2DArrayLayer(texture: RawTexture2DArray, source: ImageSource, layer: number, options?: IUploadImageToTexture2DArrayLayerOptions): void {
    const internalTexture = texture.getInternalTexture();
    if (!internalTexture) {
        throw new Error("Cannot upload to a 2D array texture that has no internal texture.");
    }

    if (!Number.isInteger(layer) || layer < 0 || layer >= texture.depth) {
        throw new Error(`Layer ${layer} is out of range for a 2D array texture with ${texture.depth} layers.`);
    }

    const scene = texture.getScene();
    if (!scene) {
        throw new Error("Cannot upload to a 2D array texture that is not attached to a scene.");
    }

    const engine = scene.getEngine();
    // updateTextureArrayLayerFromImageSource is an opt-in engine extension. When the consumer never
    // imported it, the augmented method is undefined and would crash with a generic "is not a function"
    // error, so fail early with a message that names the required import for each backend.
    if (typeof (engine as unknown as Record<string, unknown>).updateTextureArrayLayerFromImageSource !== "function") {
        throw new Error(
            'updateTextureArrayLayerFromImageSource is not registered on the engine. Import the opt-in extension for your backend before use: WebGL2 -> "core/Engines/Extensions/engine.texture2DArrayImageSource", WebGPU -> "core/Engines/WebGPU/Extensions/engine.texture2DArrayImageSource".'
        );
    }

    engine.updateTextureArrayLayerFromImageSource(internalTexture, source, layer, options?.invertY ?? false, options?.premultiplyAlpha ?? false);
}

/**
 * Fetches an image from a url, decodes it and uploads it into a single layer of a 2D array texture.
 * @param texture defines the 2D array texture to upload into
 * @param url defines the url of the image to load
 * @param layer defines the array layer to upload into
 * @param options defines optional upload settings (invertY, premultiplyAlpha)
 * @returns a promise resolved once the layer has been uploaded
 */
export async function LoadImageToTexture2DArrayLayer(texture: RawTexture2DArray, url: string, layer: number, options?: IUploadImageToTexture2DArrayLayerOptions): Promise<void> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image "${url}": ${response.status} ${response.statusText}`);
    }
    const blob = await response.blob();
    const bitmap = await createImageBitmap(blob);
    try {
        UploadImageToTexture2DArrayLayer(texture, bitmap, layer, options);
    } finally {
        bitmap.close();
    }
}

/**
 * Creates a 2D array texture and fills each layer from a list of image urls.
 * All images must share the same dimensions.
 * @param scene defines the hosting scene
 * @param urls defines the url of the image for each layer (at least one)
 * @param options defines optional creation and upload settings
 * @returns a promise resolved with the created RawTexture2DArray
 */
export async function CreateTexture2DArrayFromImageUrls(
    scene: Scene,
    urls: readonly [string, ...string[]],
    options?: ICreateTexture2DArrayFromImageUrlsOptions
): Promise<RawTexture2DArray> {
    // allSettled (not all): a rejected fetch/decode must not leak the layers that
    // already decoded. Promise.all rejects on the first failure and never enters the
    // try/finally below, orphaning every ImageBitmap that resolved. Close the
    // fulfilled ones here, then rethrow the original failure.
    const results = await Promise.allSettled(
        urls.map(async (url) => {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch image "${url}": ${response.status} ${response.statusText}`);
            }
            return await createImageBitmap(await response.blob(), options?.imageBitmapOptions);
        })
    );

    const firstRejection = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (firstRejection) {
        for (const result of results) {
            if (result.status === "fulfilled") {
                result.value.close();
            }
        }
        throw firstRejection.reason;
    }

    const bitmaps = results.filter((result): result is PromiseFulfilledResult<ImageBitmap> => result.status === "fulfilled").map((result) => result.value) as [
        ImageBitmap,
        ...ImageBitmap[],
    ];

    try {
        const width = bitmaps[0].width;
        const height = bitmaps[0].height;

        for (let index = 1; index < bitmaps.length; index++) {
            const bitmap = bitmaps[index];
            if (bitmap.width !== width || bitmap.height !== height) {
                throw new Error(`All images must share the same dimensions. Image at index ${index} is ${bitmap.width}x${bitmap.height}, expected ${width}x${height}.`);
            }
        }

        const texture = new RawTexture2DArray(
            null,
            width,
            height,
            bitmaps.length,
            Constants.TEXTUREFORMAT_RGBA,
            scene,
            options?.generateMipMaps ?? true,
            options?.invertY ?? false,
            options?.samplingMode,
            options?.textureType
        );

        const uploadOptions: IUploadImageToTexture2DArrayLayerOptions = {
            invertY: options?.invertY ?? false,
            premultiplyAlpha: options?.premultiplyAlpha ?? false,
        };

        // updateTextureArrayLayerFromImageSource rebuilds the whole mip chain on each upload when mips
        // are enabled. Uploading N layers that way is O(N) redundant mip generation, so suppress it
        // per-layer and let only the final upload regenerate the mips once — a single generateMipmap
        // covers every layer of the array.
        const internalTexture = texture.getInternalTexture();
        const generateMipMaps = internalTexture?.generateMipMaps ?? false;
        if (internalTexture && generateMipMaps) {
            internalTexture.generateMipMaps = false;
        }

        for (let layer = 0; layer < bitmaps.length; layer++) {
            if (internalTexture && generateMipMaps && layer === bitmaps.length - 1) {
                internalTexture.generateMipMaps = true;
            }
            UploadImageToTexture2DArrayLayer(texture, bitmaps[layer], layer, uploadOptions);
        }

        return texture;
    } finally {
        for (let index = 0; index < bitmaps.length; index++) {
            bitmaps[index].close();
        }
    }
}
