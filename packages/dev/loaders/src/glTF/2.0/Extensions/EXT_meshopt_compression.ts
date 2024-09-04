import type { Nullable } from "core/types";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { ArrayItem, GLTFLoader } from "../glTFLoader";
import type { IBufferView } from "../glTFLoaderInterfaces";
import type { IEXTMeshoptCompression } from "babylonjs-gltf2interface";
import { MeshoptCompression } from "core/Meshes/Compression/meshoptCompression";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "EXT_meshopt_compression";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_meshopt_compression extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_meshopt_compression"]: {};
    }
}

interface IBufferViewMeshopt extends IBufferView {
    _meshOptData?: Promise<ArrayBufferView>;
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_meshopt_compression/README.md)
 *
 * This extension uses a WebAssembly decoder module from https://github.com/zeux/meshoptimizer/tree/master/js
 * @since 5.0.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
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

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this.enabled = loader.isExtensionUsed(NAME);
        this._loader = loader;
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public loadBufferViewAsync(context: string, bufferView: IBufferView): Nullable<Promise<ArrayBufferView>> {
        return GLTFLoader.LoadExtensionAsync<IEXTMeshoptCompression, ArrayBufferView>(context, bufferView, this.name, (extensionContext, extension) => {
            const bufferViewMeshopt = bufferView as IBufferViewMeshopt;
            if (bufferViewMeshopt._meshOptData) {
                return bufferViewMeshopt._meshOptData;
            }

            const buffer = ArrayItem.Get(`${context}/buffer`, this._loader.gltf.buffers, extension.buffer);
            bufferViewMeshopt._meshOptData = this._loader.loadBufferAsync(`/buffers/${buffer.index}`, buffer, extension.byteOffset || 0, extension.byteLength).then((buffer) => {
                return MeshoptCompression.Default.decodeGltfBufferAsync(buffer as Uint8Array, extension.count, extension.byteStride, extension.mode, extension.filter);
            });

            return bufferViewMeshopt._meshOptData;
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_meshopt_compression(loader));
