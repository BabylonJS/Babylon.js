import { ITextureInfo, IMaterial } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Material } from 'babylonjs/Materials/material';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { Nullable } from 'babylonjs/types';
import { IKHRMaterialsSheen } from 'babylonjs-gltf2interface';

const NAME = "KHR_materials_sheen";

/**
 * @hidden
 */
export class KHR_materials_sheen implements IGLTFExporterExtensionV2 {
    /** Name of this extension */
    public readonly name = NAME;

    /** Defines whether this extension is enabled */
    public enabled = true;

    /** Defines whether this extension is required */
    public required = false;

    /** Reference to the glTF exporter */
    private _textureInfos: ITextureInfo[] = [];
    private _exportedTextures: Nullable<BaseTexture>[] = [];

    private _wasUsed = false;

    constructor(exporter: _Exporter) {
    }

    public dispose() {
       this._textureInfos = [];
       this._exportedTextures = [];
    }

    /** @hidden */
    public get wasUsed() {
        return this._wasUsed;
    }

    private _getTextureIndex(babylonTexture: BaseTexture) {
        let textureIndex = this._exportedTextures.indexOf(babylonTexture);

        if (textureIndex === -1 && babylonTexture.reservedDataStore) {
            textureIndex = this._exportedTextures.indexOf(babylonTexture.reservedDataStore.source);
        }

        return textureIndex;
    }

    public postExportTexture?(context: string, textureInfo: ITextureInfo, babylonTexture: Texture): void {
        let textureIndex = this._getTextureIndex(babylonTexture);

        if (textureIndex > -1) {
            this._textureInfos[textureIndex] = textureInfo;
        }
    }

    public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
        if (babylonMaterial instanceof PBRMaterial) {
            if (babylonMaterial.sheen.isEnabled && babylonMaterial.sheen.texture) {
                this._exportedTextures.push(babylonMaterial.sheen.texture);
                return [babylonMaterial.sheen.texture];
            }
        }

        return [];
    }

    public postExportMaterialAsync?(context: string, node: IMaterial, babylonMaterial: Material): Promise<IMaterial> {
        return new Promise((resolve, reject) => {
            if (babylonMaterial instanceof PBRMaterial) {
                if (!babylonMaterial.sheen.isEnabled) {
                    resolve(node);
                    return;
                }

                this._wasUsed = true;

                if (node.extensions == null) {
                    node.extensions = {};
                }
                const sheenInfo: IKHRMaterialsSheen = {
                    sheenColorFactor: babylonMaterial.sheen.color.asArray(),
                    sheenRoughnessFactor: babylonMaterial.sheen.roughness ?? 0
                };

                if (babylonMaterial.sheen.texture) {
                    let textureIndex = this._getTextureIndex(babylonMaterial.sheen.texture);

                    if (textureIndex > -1) {
                        sheenInfo.sheenTexture = this._textureInfos[textureIndex] ;
                    }
                }

                node.extensions[NAME] = sheenInfo;
            }
            resolve(node);
        });
    }
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_sheen(exporter));