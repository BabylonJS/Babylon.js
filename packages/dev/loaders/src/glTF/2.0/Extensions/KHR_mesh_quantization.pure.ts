import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { type GLTFLoader } from "../glTFLoader.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

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

let _Registered = false;
/**
 * Registers the KHR_mesh_quantization glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_mesh_quantization(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_mesh_quantization(loader));
}
