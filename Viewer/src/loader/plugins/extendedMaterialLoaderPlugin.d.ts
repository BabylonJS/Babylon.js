import { ILoaderPlugin } from "./loaderPlugin";
import { Material } from "babylonjs";
/**
 * A (PBR) material will be extended using this function.
 * This function will hold extra default configuration for the viewer, if not implemented in Babylon itself.
 */
export declare class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {
    onMaterialLoaded(baseMaterial: Material): void;
}
