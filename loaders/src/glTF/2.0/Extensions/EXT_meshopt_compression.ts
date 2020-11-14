import { Nullable } from "babylonjs/types";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IBufferView } from "../glTFLoaderInterfaces";

import { MeshoptDecoder } from "./meshopt_decoder.module.js";

const NAME = "EXT_meshopt_compression";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression)
 *
 * This extension uses a WebAssembly decoder module from https://github.com/zeux/meshoptimizer/tree/master/js
 */
export class EXT_meshopt_compression implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this.enabled = loader.isExtensionUsed(NAME) && MeshoptDecoder.supported;
        this._loader = loader;
    }

    /** @hidden */
    public dispose() {
    }

    /** @hidden */
    public loadBufferViewAsync(context: string, bufferView: IBufferView): Nullable<Promise<ArrayBufferView>> {
        if (bufferView.extensions && bufferView.extensions[this.name]) {
            var extensionDef = bufferView.extensions[this.name];
            if (extensionDef._decoded) {
                return extensionDef._decoded;
            }

            var view = this._loader.loadBufferViewAsync(context, extensionDef);
            var decoder = MeshoptDecoder;

            extensionDef._decoded = Promise.all([view, decoder.ready]).then(function (res) {
                var source = res[0] as Uint8Array;
                var count = extensionDef.count;
                var stride = extensionDef.byteStride;
                var result = new Uint8Array(new ArrayBuffer(count * stride));

                decoder.decodeGltfBuffer(result, count, stride, source, extensionDef.mode, extensionDef.filter);

                return Promise.resolve(result);
            });

            return extensionDef._decoded;
        } else {
            return null;
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_meshopt_compression(loader));
