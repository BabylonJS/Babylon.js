import { ITextureInfo, IMaterial } from "babylonjs-gltf2interface";
import { IGLTFExporterExtensionV2 } from "../glTFExporterExtension";
import { _Exporter } from "../glTFExporter";
import { Material } from 'babylonjs/Materials/material';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { Nullable } from 'babylonjs/types';

const NAME = "KHR_materials_sheen";

interface IKHR_materials_sheen {
    intensityFactor: number;
    colorFactor: number[];
    colorIntensityTexture?: ITextureInfo;
}

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
    private _exporter: _Exporter;
    private _textureInfo: ITextureInfo;
    private _exportedTexture: Nullable<BaseTexture> = null;

    private _wasUsed = false;

    constructor(exporter: _Exporter) {
        this._exporter = exporter;
    }

    public dispose() {
        delete this._exporter;
    }

    /** @hidden */
    public onExporting(): void {
        if (this._wasUsed) {
            if (this._exporter._glTF.extensionsUsed == null) {
                this._exporter._glTF.extensionsUsed = [];
            }
            if (this._exporter._glTF.extensionsUsed.indexOf(NAME) === -1) {
                this._exporter._glTF.extensionsUsed.push(NAME);
            }
            if (this.required) {
                if (this._exporter._glTF.extensionsRequired == null) {
                    this._exporter._glTF.extensionsRequired = [];
                }
                if (this._exporter._glTF.extensionsRequired.indexOf(NAME) === -1) {
                    this._exporter._glTF.extensionsRequired.push(NAME);
                }
            }
            if (this._exporter._glTF.extensions == null) {
                this._exporter._glTF.extensions = {};
            }
        }
    }

    public postExportTexture?(context: string, textureInfo:ITextureInfo, babylonTexture: Texture): void {
        if (babylonTexture === this._exportedTexture || babylonTexture.reservedDataStore && babylonTexture.reservedDataStore.source === this._exportedTexture) {
            this._textureInfo = textureInfo;
        }
    }

    public postExportMaterialAdditionalTextures?(context: string, node: IMaterial, babylonMaterial: Material): BaseTexture[] {
        if (babylonMaterial instanceof PBRMaterial) {
            if (babylonMaterial.sheen.isEnabled && babylonMaterial.sheen.texture) {
                this._exportedTexture = babylonMaterial.sheen.texture;
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
                const sheenInfo: IKHR_materials_sheen = {
                    colorFactor: babylonMaterial.sheen.color.asArray(),
                    intensityFactor: babylonMaterial.sheen.intensity
                };

                if (this._textureInfo) {
                    sheenInfo.colorIntensityTexture = this._textureInfo;
                }

                node.extensions[NAME] = sheenInfo;
            }
            resolve(node);
        });
    }    
}

_Exporter.RegisterExtension(NAME, (exporter) => new KHR_materials_sheen(exporter));