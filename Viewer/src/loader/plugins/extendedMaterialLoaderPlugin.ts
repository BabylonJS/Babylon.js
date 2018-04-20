import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../..";
import { Color3, Texture, BaseTexture, Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material, PBRMaterial, Engine } from "babylonjs";

export class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {

    private _model: ViewerModel;

    public onMaterialLoaded(baseMaterial: Material) {
        var material = baseMaterial as PBRMaterial;
        material.alphaMode = Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
    }
}