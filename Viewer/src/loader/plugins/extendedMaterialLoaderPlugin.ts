import { ILoaderPlugin } from "./loaderPlugin";
import { telemetryManager } from "../../telemetryManager";
import { ViewerModel } from "../..";
import { Color3, Texture, BaseTexture, Tools, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Material, PBRMaterial, Engine } from "babylonjs";

export class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {

    private _model: ViewerModel;

    public onMaterialLoaded(baseMaterial: Material) {
        var material = baseMaterial as PBRMaterial;
        material.alphaMode = Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;

        var isAlphaOnlyOne = (texture: BaseTexture) => {
            var pixels = texture.readPixels() as Uint8Array;
            var alphaOne = true;
            for (var i = 3; i < pixels.length; i += 4) {
                if (pixels[i] !== 255) {
                    alphaOne = false;
                    break;
                }
            }

            return alphaOne;
        };

        if (material.albedoTexture) {
            material.albedoColor = Color3.White();
        }
        else {
            material.albedoColor = material.albedoColor.toLinearSpace();
        }

        if (material.reflectivityTexture) {
            material.reflectivityColor = Color3.White();
            material.microSurface = 1;

            if (material.reflectivityTexture) {
                if (material.reflectivityTexture.isReady()) {
                    if (isAlphaOnlyOne(material.reflectivityTexture)) {
                        material.useMicroSurfaceFromReflectivityMapAlpha = false;
                        material.useAutoMicroSurfaceFromReflectivityMap = true;
                    }
                }
                else {
                    (<Texture>material.reflectivityTexture).onLoadObservable.add(loadedTexture => {
                        if (isAlphaOnlyOne(loadedTexture)) {
                            material.useMicroSurfaceFromReflectivityMapAlpha = false;
                            material.useAutoMicroSurfaceFromReflectivityMap = true;
                        }
                    });
                }
            }
        }
        else {
            material.reflectivityColor = material.reflectivityColor.toLinearSpace();
        }

        if (material.bumpTexture) {
            material.bumpTexture.level = 1;
            // Normal maps are currently DirectX convention instead of OpenGL.
            material.invertNormalMapY = true;
        }

        if (material.emissiveTexture) {
            material.emissiveColor = Color3.White();
        }

        material.useRadianceOcclusion = false;
        material.useHorizonOcclusion = false;
        material.useAlphaFresnel = material.needAlphaBlending();
        material.backFaceCulling = material.forceDepthWrite;
        material.twoSidedLighting = true;
        material.useSpecularOverAlpha = false;
        material.useRadianceOverAlpha = false;
        material.usePhysicalLightFalloff = true;
        material.forceNormalForward = true;
    }
}