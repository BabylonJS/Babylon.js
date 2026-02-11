import { Tools } from "../../Misc/tools";
import type { IDisposable } from "../../scene";
import type { Nullable } from "../../types";

declare let MeshoptDecoder: any;

let NumberOfWorkers = 0;
let WorkerTimeout: Nullable<ReturnType<typeof setTimeout>> = null;

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
 *     MeshoptCompression.Configuration = {
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
     *   url: "https://cdn.babylonjs.com/meshopt_decoder.js"
     * }
     * ```
     */
    public static Configuration: IMeshoptCompressionConfiguration = {
        decoder: {
            url: `${Tools._DefaultCdnUrl}/meshopt_decoder.js`,
        },
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

        // eslint-disable-next-line github/no-then
        this._decoderModulePromise = Tools.LoadBabylonScriptAsync(decoder.url).then(() => {
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
     * @returns a Promise<Uint8Array> that resolves to the decoded data
     */
    public async decodeGltfBufferAsync(source: Uint8Array, count: number, stride: number, mode: "ATTRIBUTES" | "TRIANGLES" | "INDICES", filter?: string): Promise<Uint8Array> {
        await this._decoderModulePromise!;
        if (NumberOfWorkers === 0) {
            MeshoptDecoder.useWorkers(1);
            NumberOfWorkers = 1;
        }
        const result = await MeshoptDecoder.decodeGltfBufferAsync(count, stride, source, mode, filter);
        // a simple debounce to avoid switching back and forth between workers and no workers while decoding
        if (WorkerTimeout !== null) {
            clearTimeout(WorkerTimeout);
        }
        WorkerTimeout = setTimeout(() => {
            MeshoptDecoder.useWorkers(0);
            NumberOfWorkers = 0;
            WorkerTimeout = null;
        }, 1000);
        return result;
    }
}
