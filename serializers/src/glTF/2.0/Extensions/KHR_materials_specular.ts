import { IMaterial } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Material } from "babylonjs/Materials/material";
import { PBRMaterial } from "babylonjs/Materials/PBR/pbrMaterial";
import { IKHRMaterialsSpecular } from "babylonjs-gltf2interface";

const NAME = "KHR_material_specular";

/**
 * @hidden
 */
export class KHR_material_specular implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defined whether this extension is enabled */
    public enabled = true;

    /** Defined whether this extention is required */
    public required = false;

    private _wasUsed = false;

    private _exporter: _Exporter;

    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    public dispose() {
    }

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed
    }

    public postExportMaterialAsync(context: string, node: IMaterial, babylonMaterial:Material): Promise<IMaterial> {
        return new Promise((resolve, reject) => {
            if(babylonMaterial instanceof PBRMaterial) {
                
                this._wasUsed = true;

                if(node.extensions == null) {
                    node.extensions = {};
                }
                
                const specularColorTextureInfo = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.reflectanceTexture);
                const specularTextureInfo = this._exporter._glTFMaterialExporter._getTextureInfo(babylonMaterial.metallicReflectanceTexture);
                
                const specularInfo: IKHRMaterialsSpecular = {
                    specularColorFactor: babylonMaterial.metallicReflectanceColor.asArray(),
                    specularFactor: babylonMaterial.metallicF0Factor,
                    specularColorTexture: specularColorTextureInfo!,
                    specularTexture: specularTextureInfo!
                };

                node.extensions[NAME] = specularInfo;
            }
            resolve(node);
        });    
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_material_specular(exporter));