import { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { IKHR_xmp_gltf, IKHR_xmp_node } from 'babylonjs-gltf2interface';

const NAME = "KHR_xmp";

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/1553)
 * !!! Experimental Extension Subject to Changes !!!
 */
export class KHR_xmp implements IGLTFLoaderExtension {
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

    /** @hidden */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @hidden */
    public dispose() {
        delete this._loader;
    }

    /**
     * Called after the loader state changes to LOADING.
     */
    public onLoading(): void {
        const xmp_gltf = (this._loader.gltf.extensions?.KHR_xmp as IKHR_xmp_gltf);
        const xmp_node = (this._loader.gltf.asset?.extensions?.KHR_xmp as IKHR_xmp_node);
        if (xmp_gltf && xmp_node) {
            const packet = +xmp_node.packet;
            if (xmp_gltf.packets && packet < xmp_gltf.packets.length) {
                this._loader.rootBabylonMesh.metadata = this._loader.rootBabylonMesh.metadata || { };
                this._loader.rootBabylonMesh.metadata.xmp = xmp_gltf.packets[packet];
            }
        }
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_xmp(loader));