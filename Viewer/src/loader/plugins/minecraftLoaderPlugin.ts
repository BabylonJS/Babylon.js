import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../..";
import { Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material } from "babylonjs";
import { IGLTFLoaderData, GLTF2 } from "babylonjs-loaders";


export class MinecraftLoaderPlugin implements ILoaderPlugin {

    private _model: ViewerModel;

    private _minecraftEnabled: boolean;

    public onInit(loader: ISceneLoaderPlugin | ISceneLoaderPluginAsync, model: ViewerModel) {
        this._model = model;
        this._minecraftEnabled = false;
    }

    public inParsed(data: IGLTFLoaderData) {
        if (data && data.json && data.json['meshes'] && data.json['meshes'].length) {
            var meshes = data.json['meshes'] as GLTF2.IMesh[];
            for (var i = 0; i < meshes.length; i++) {
                var mesh = meshes[i];
                if (mesh && mesh.extras && mesh.extras.MSFT_minecraftMesh) {
                    this._minecraftEnabled = true;
                    break;
                }
            }
        }
    }

    public onMaterialLoaded(material: Material) {
        if (this._minecraftEnabled && material.needAlphaBlending()) {
            material.forceDepthWrite = true;
            material.backFaceCulling = true;
            material.separateCullingPass = true;
        }
    }
}