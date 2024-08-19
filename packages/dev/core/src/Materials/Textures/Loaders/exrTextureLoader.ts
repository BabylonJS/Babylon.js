import type { Nullable } from "core/types";
import type { InternalTexture } from "../internalTexture";
import type { IInternalTextureLoader } from "./internalTextureLoader";
import { GetExrHeader } from "./Exr/exrLoader.header";
import { CreateDecoder, OutputType } from "./Exr/exrLoader.decoder";
import { ParseInt32, ParseUint32 } from "./Exr/exrLoader.core";
import { UncompressRAW } from "./Exr/exrLoader.compression";
import { Constants } from "core/Engines";

/* Inspired by https://github.com/sciecode/three.js/blob/dev/examples/jsm/loaders/EXRLoader.js */

const DefaultOutputType: OutputType = OutputType.HalfFloatType;

/**
 * Loader for .exr file format
 * #4RN0VF#143: 2d EXR
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _ExrTextureLoader implements IInternalTextureLoader {
    /**
     * Defines whether the loader supports cascade loading the different faces.
     */
    public readonly supportCascades = false;

    /**
     * Uploads the cube texture data to the WebGL texture. It has already been bound.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param createPolynomials will be true if polynomials have been requested
     * @param onLoad defines the callback to trigger once the texture is ready
     * @param onError defines the callback to trigger in case of error
     */
    public loadCubeData(
        data: ArrayBufferView | ArrayBufferView[],
        texture: InternalTexture,
        createPolynomials: boolean,
        onLoad: Nullable<(data?: any) => void>,
        onError: Nullable<(message?: string, exception?: any) => void>
    ): void {}

    /**
     * Uploads the 2D texture data to the WebGL texture. It has already been bound once in the callback.
     * @param data contains the texture data
     * @param texture defines the BabylonJS internal texture
     * @param callback defines the method to call once ready to upload
     */
    public loadData(
        data: ArrayBufferView,
        texture: InternalTexture,
        callback: (width: number, height: number, loadMipmap: boolean, isCompressed: boolean, done: () => void, failedLoading?: boolean) => void
    ): void {
        const dataView = new DataView(data.buffer);

        const offset = { value: 0 };
        const header = GetExrHeader(dataView, offset);
        const decoder = CreateDecoder(header, dataView, offset, DefaultOutputType);

        const tmpOffset = { value: 0 };

        for (let scanlineBlockIdx = 0; scanlineBlockIdx < decoder.height / decoder.scanlineBlockSize; scanlineBlockIdx++) {
            const line = ParseInt32(dataView, offset) - header.dataWindow.yMin; // line_no
            decoder.size = ParseUint32(dataView, offset); // data_len
            decoder.lines = line + decoder.scanlineBlockSize > decoder.height ? decoder.height - line : decoder.scanlineBlockSize;

            const isCompressed = decoder.size < decoder.lines * decoder.bytesPerLine;
            const viewer = isCompressed && decoder.uncompress ? decoder.uncompress(decoder) : UncompressRAW(decoder);

            offset.value += decoder.size;

            for (let line_y = 0; line_y < decoder.scanlineBlockSize; line_y++) {
                const scan_y = scanlineBlockIdx * decoder.scanlineBlockSize;
                const true_y = line_y + decoder.scanOrder(scan_y);
                if (true_y >= decoder.height) {
                    continue;
                }

                const lineOffset = line_y * decoder.bytesPerLine;
                const outLineOffset = (decoder.height - 1 - true_y) * decoder.outLineWidth;

                for (let channelID = 0; channelID < decoder.channels; channelID++) {
                    const name = header.channels[channelID].name;
                    const lOff = decoder.channelLineOffsets[name];
                    const cOff = decoder.decodeChannels[name];

                    if (cOff === undefined) {
                        continue;
                    }

                    tmpOffset.value = lineOffset + lOff;

                    for (let x = 0; x < decoder.width; x++) {
                        const outIndex = outLineOffset + x * decoder.outputChannels + cOff;
                        if (decoder.byteArray) {
                            decoder.byteArray[outIndex] = decoder.getter(viewer, tmpOffset);
                        }
                    }
                }
            }
        }

        // Updating texture
        const width = header.dataWindow.xMax - header.dataWindow.xMin + 1;
        const height = header.dataWindow.yMax - header.dataWindow.yMin + 1;
        callback(width, height, texture.generateMipMaps, false, () => {
            const engine = texture.getEngine();
            texture.format = header.format;
            switch (DefaultOutputType) {
                case OutputType.FloatType:
                    texture.type = Constants.TEXTURETYPE_FLOAT;
                    break;
                case OutputType.HalfFloatType:
                    texture.type = Constants.TEXTURETYPE_HALF_FLOAT;
                    break;
            }
            texture.invertY = false;
            texture._gammaSpace = !header.linearSpace;
            if (decoder.byteArray) {
                engine._uploadDataToTextureDirectly(texture, decoder.byteArray, 0, 0, undefined, true);
            }
        });
    }
}
