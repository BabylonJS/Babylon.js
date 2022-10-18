import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "KHR_mesh_quantization";

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

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_mesh_quantization(loader));
