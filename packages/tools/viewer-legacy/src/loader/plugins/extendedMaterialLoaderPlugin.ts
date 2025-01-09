import type { Material } from "core/Materials/material";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { ILoaderPlugin } from "./loaderPlugin";
import { Constants } from "core/Engines/constants";

/**
 * A (PBR) material will be extended using this function.
 * This function will hold extra default configuration for the viewer, if not implemented in Babylon itself.
 */
export class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {
    public onMaterialLoaded(baseMaterial: Material) {
        const material = baseMaterial as PBRMaterial;
        material.alphaMode = Constants.ALPHA_PREMULTIPLIED_PORTERDUFF;
    }
}
