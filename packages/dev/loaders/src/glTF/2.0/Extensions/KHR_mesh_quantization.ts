import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import type { GLTFLoader } from "../glTFLoader";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_mesh_quantization";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_mesh_quantization extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_mesh_quantization"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_mesh_quantization/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_mesh_quantization implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this.enabled = loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {}
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_mesh_quantization(loader));
