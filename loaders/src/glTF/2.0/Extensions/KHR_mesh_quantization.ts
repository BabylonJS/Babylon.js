import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "KHR_quantized_geometry";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_quantized_geometry)
 */
export class KHR_quantized_geometry implements IGLTFLoaderExtension {
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
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_quantized_geometry(loader));
