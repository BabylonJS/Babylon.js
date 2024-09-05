import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import type { GLTFLoader } from "../glTFLoader";
import type { IKHRXmpJsonLd_Gltf, IKHRXmpJsonLd_Node } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_xmp_json_ld";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_xmp_json_ld extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_xmp_json_ld"]: {};
    }
}

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

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_xmp_json_ld(loader));
