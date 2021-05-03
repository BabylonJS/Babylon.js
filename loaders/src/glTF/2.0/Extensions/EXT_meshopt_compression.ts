import { Nullable } from "babylonjs/types";
import { Tools } from "babylonjs/Misc/tools";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { ArrayItem, GLTFLoader } from "../glTFLoader";
import { IBufferView } from "../glTFLoaderInterfaces";
import { IEXTMeshoptCompression } from "babylonjs-gltf2interface";

const NAME = "EXT_meshopt_compression";

declare var MeshoptDecoder: any;

interface IBufferViewMeshopt extends IBufferView {
    _meshOptData?: Promise<ArrayBufferView>;
}

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

    /**
     * Path to decoder module; defaults to https://preview.babylonjs.com/meshopt_decoder.js
     */
    public static DecoderPath: string = "https://preview.babylonjs.com/meshopt_decoder.js";

    private _loader: GLTFLoader;
    private static _DecoderPromise?: Promise<any>;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this.enabled = loader.isExtensionUsed(NAME);
        this._loader = loader;

        if (this.enabled && !EXT_meshopt_compression._DecoderPromise) {
            EXT_meshopt_compression._DecoderPromise = Tools.LoadScriptAsync(EXT_meshopt_compression.DecoderPath).then(() => {
                // Wait for WebAssembly compilation before resolving promise
                return MeshoptDecoder.ready;
            });
        }
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @hidden */
    public loadBufferViewAsync(context: string, bufferView: IBufferView): Nullable<Promise<ArrayBufferView>> {
        return GLTFLoader.LoadExtensionAsync<IEXTMeshoptCompression, ArrayBufferView>(context, bufferView, this.name, (extensionContext, extension) => {
            const bufferViewMeshopt = bufferView as IBufferViewMeshopt;
            if (bufferViewMeshopt._meshOptData) {
                return bufferViewMeshopt._meshOptData;
            }

            const buffer = ArrayItem.Get(`${context}/buffer`, this._loader.gltf.buffers, extension.buffer);
            const bufferPromise = this._loader.loadBufferAsync(`/buffers/${buffer.index}`, buffer, (extension.byteOffset || 0), extension.byteLength);

            bufferViewMeshopt._meshOptData = Promise.all([bufferPromise, EXT_meshopt_compression._DecoderPromise]).then((res) => {
                const source = res[0] as Uint8Array;
                const count = extension.count;
                const stride = extension.byteStride;
                const result = new Uint8Array(new ArrayBuffer(count * stride));
                MeshoptDecoder.decodeGltfBuffer(result, count, stride, source, extension.mode, extension.filter);
                return Promise.resolve(result);
            });

            return bufferViewMeshopt._meshOptData;
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_meshopt_compression(loader));
