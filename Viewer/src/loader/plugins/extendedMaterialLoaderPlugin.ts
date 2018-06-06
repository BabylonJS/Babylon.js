import { ILoaderPlugin } from "./loaderPlugin";
import { ViewerModel } from "../../model/viewerModel";
import { Color3, Texture, BaseTexture, Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material, PBRMaterial, Engine } from "babylonjs";

/**
 * A (PBR) material will be extended using this function.
 * This function will hold extra default configuration for the viewer, if not implemented in Babylon itself.
 */
export class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {

    public onMaterialLoaded(baseMaterial: Material) {
        var material = baseMaterial as PBRMaterial;
        material.alphaMode = Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
    }
}