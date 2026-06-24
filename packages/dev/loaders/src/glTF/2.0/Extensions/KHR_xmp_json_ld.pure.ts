import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { type GLTFLoader } from "../glTFLoader.pure";
import { type IKHRXmpJsonLd_Gltf, type IKHRXmpJsonLd_Node } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_xmp_json_ld";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_xmp_json_ld/README.md)
 * @since 5.0.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_xmp_json_ld implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    /**
     * Defines a number that determines the order the extensions are applied.
     */
    public order = 100;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * Called after the loader state changes to LOADING.
     */
    public onLoading(): void {
        if (this._loader.rootBabylonMesh === null) {
            return;
        }

        const xmpGltf = this._loader.gltf.extensions?.KHR_xmp_json_ld as IKHRXmpJsonLd_Gltf;
        const xmpNode = this._loader.gltf.asset?.extensions?.KHR_xmp_json_ld as IKHRXmpJsonLd_Node;
        if (xmpGltf && xmpNode) {
            const packet = +xmpNode.packet;
            if (xmpGltf.packets && packet < xmpGltf.packets.length) {
                this._loader.rootBabylonMesh.metadata = this._loader.rootBabylonMesh.metadata || {};
                this._loader.rootBabylonMesh.metadata.xmp = xmpGltf.packets[packet];
            }
        }
    }
}

let _Registered = false;
/**
 * Registers the KHR_xmp_json_ld glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_xmp_json_ld(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_xmp_json_ld(loader));
}
