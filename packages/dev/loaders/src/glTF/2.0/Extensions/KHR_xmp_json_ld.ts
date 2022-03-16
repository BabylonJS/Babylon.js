import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IKHRXmpJsonLd_Gltf, IKHRXmpJsonLd_Node } from "babylonjs-gltf2interface";

const NAME = "KHR_xmp_json_ld";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_xmp_json_ld)
 * @since 5.0.0
 */
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
     * @param loader
     * @hidden
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
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

        const xmp_gltf = this._loader.gltf.extensions?.KHR_xmp_json_ld as IKHRXmpJsonLd_Gltf;
        const xmp_node = this._loader.gltf.asset?.extensions?.KHR_xmp_json_ld as IKHRXmpJsonLd_Node;
        if (xmp_gltf && xmp_node) {
            const packet = +xmp_node.packet;
            if (xmp_gltf.packets && packet < xmp_gltf.packets.length) {
                this._loader.rootBabylonMesh.metadata = this._loader.rootBabylonMesh.metadata || {};
                this._loader.rootBabylonMesh.metadata.xmp = xmp_gltf.packets[packet];
            }
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_xmp_json_ld(loader));
