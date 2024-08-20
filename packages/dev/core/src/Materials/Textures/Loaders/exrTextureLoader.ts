import type { Nullable } from "core/types";
import type { InternalTexture } from "../internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";
import { GetExrHeader } from "./EXR/exrLoader.header";
import { CreateDecoderAsync, ScanData } from "./EXR/exrLoader.decoder";
import { ExrLoaderGlobalConfiguration } from "./EXR/exrLoader.configuration";

/* Inspired by https://github.com/sciecode/three.js/blob/dev/examples/jsm/loaders/EXRLoader.js */

/**
 * Loader for .exr file format
 * #4RN0VF#143: PIZ compression
 * #4RN0VF#146: ZIP compression
 * #4RN0VF#149: RLE compression
 * #4RN0VF#150: PXR24 compression
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _ExrTextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param _data contains the texture data
     * @param _texture defines the BabylonJS internal texture
     * @param _createPolynomials will be true if polynomials have been requested
     * @param _onLoad defines the callback to trigger once the texture is ready
     * @param _onError defines the callback to trigger in case of error
     */
    public loadCubeData(
        _data: ArrayBufferView | ArrayBufferView[],
        _texture: InternalTexture,
        _createPolynomials: boolean,
        _onLoad: Nullable<(data?: any) => void>,
        _onError: Nullable<(message?: string, exception?: any) => void>
    ): void {
        // eslint-disable-next-line no-throw-literal
        throw ".exr not supported in Cube.";
    }

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public async loadData(
        data: ArrayBufferView,
        texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, failedLoading?: boolean) => void
    ) {
        const dataView = new DataView(data.buffer);

        const offset = { value: 0 };
        const header = GetExrHeader(dataView, offset);
        const decoder = await CreateDecoderAsync(header, dataView, offset, ExrLoaderGlobalConfiguration.DefaultOutputType);

        ScanData(decoder, header, dataView, offset);

        // Updating texture
        const width = header.dataWindow.xMax - header.dataWindow.xMin + 1;
        const height = header.dataWindow.yMax - header.dataWindow.yMin + 1;
        callback(width, height, texture.generateMipMaps, false, () => {
            const engine = texture.getEngine();
            texture.format = header.format;
            texture.type = decoder.textureType;
            texture.invertY = false;
            texture._gammaSpace = !header.linearSpace;
            if (decoder.byteArray) {
                engine._uploadDataToTextureDirectly(texture, decoder.byteArray, 0, 0, undefined, true);
            }
        });
    }
}
