import { Nullable } from "babylonjs/types";
import { Tools } from "babylonjs/Misc/tools";
import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { ArrayItem, GLTFLoader } from "../glTFLoader";
import { IBufferView } from "../glTFLoaderInterfaces";
import { IEXTMeshoptCompression } from "babylonjs-gltf2interface";
import { MeshoptCompression } from "babylonjs/Meshes/Compression/meshoptCompression";

const NAME = "EXT_meshopt_compression";

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

    private _loader: GLTFLoader;

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this.enabled = loader.isExtensionUsed(NAME);
        this._loader = loader;
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
            bufferViewMeshopt._meshOptData = this._loader.loadBufferAsync(`/buffers/${buffer.index}`, buffer, (extension.byteOffset || 0), extension.byteLength).then((buffer) => {
                return MeshoptCompression.Default.decodeGltfBufferAsync(buffer as Uint8Array, extension.count, extension.byteStride, extension.mode, extension.filter);
            });

            return bufferViewMeshopt._meshOptData;
        });
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_meshopt_compression(loader));
