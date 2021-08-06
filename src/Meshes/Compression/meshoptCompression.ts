import { Tools } from "../../Misc/tools";
import { IDisposable } from "../../scene";
import { Nullable } from "../../types";

declare var MeshoptDecoder: any;

/**
 * Configuration for meshoptimizer compression
 */
 export interface IMeshoptCompressionConfiguration {
    /**
     * Configuration for the decoder.
     */
    decoder: {
        /**
         * The url to the meshopt decoder library.
         */
        url: string;
    };
}

/**
 * Meshopt compression (https://github.com/zeux/meshoptimizer)
 *
 * This class wraps the meshopt library from https://github.com/zeux/meshoptimizer/tree/master/js.
 *
 * **Encoder**
 *
 * The encoder is not currently implemented.
 *
 * **Decoder**
 *
 * By default, the configuration points to a copy of the meshopt files on the Babylon.js preview CDN (e.g. https://preview.babylonjs.com/meshopt_decoder.js).
 *
 * To update the configuration, use the following code:
 * ```javascript
 *     MeshOptimizer.Configuration = {
 *         decoder: {
 *             url: "<url to the meshopt decoder library>"
 *         }
 *     };
 * ```
 */
export class MeshoptCompression implements IDisposable {
    private _decoderModulePromise?: Promise<any>;

    /**
     * The configuration. Defaults to the following:
     * ```javascript
     * decoder: {
     *   url: "https://preview.babylonjs.com/meshopt_decoder.js"
     * }
     * ```
     */
    public static Configuration: IMeshoptCompressionConfiguration = {
        decoder: {
            url: "https://preview.babylonjs.com/meshopt_decoder.js"
        }
    };

    private static _Default: Nullable<MeshoptCompression> = null;

    /**
     * Default instance for the meshoptimizer object.
     */
    public static get Default(): MeshoptCompression {
        if (!MeshoptCompression._Default) {
            MeshoptCompression._Default = new MeshoptCompression();
        }

        return MeshoptCompression._Default;
    }

    /**
     * Constructor
     */
    constructor() {
        const decoder = MeshoptCompression.Configuration.decoder;

        this._decoderModulePromise = Tools.LoadScriptAsync(Tools.GetAbsoluteUrl(decoder.url)).then(() => {
            // Wait for WebAssembly compilation before resolving promise
            return MeshoptDecoder.ready;
        });
    }

    /**
     * Stop all async operations and release resources.
     */
    public dispose(): void {
        delete this._decoderModulePromise;
    }

    /**
      * Decode meshopt data.
      * @see https://github.com/zeux/meshoptimizer/tree/master/js#decoder
      * @param source The input data.
      * @param count The number of elements.
      * @param stride The stride in bytes.
      * @param mode The compression mode.
      * @param filter The compression filter.
      */
    public decodeGltfBufferAsync(source: Uint8Array, count: number, stride: number, mode: "ATTRIBUTES" | "TRIANGLES" | "INDICES", filter?: string): Promise<Uint8Array> {
        return this._decoderModulePromise!.then(() => {
            const result = new Uint8Array(count * stride);
            MeshoptDecoder.decodeGltfBuffer(result, count, stride, source, mode, filter);
            return result;
        });
    }
}
