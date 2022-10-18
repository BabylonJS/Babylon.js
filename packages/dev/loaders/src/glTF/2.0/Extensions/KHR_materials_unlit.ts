import type { Nullable } from "core/types";
import { Color3 } from "core/Maths/math.color";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";

const NAME = "KHR_materials_unlit";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_unlit/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_unlit implements IGLTFLoaderExtension {
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
    public order = 210;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync(context, material, this.name, () => {
            return this._loadUnlitPropertiesAsync(context, material, babylonMaterial);
        });
    }

    private _loadUnlitPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();
        babylonMaterial.unlit = true;

        const properties = material.pbrMetallicRoughness;
        if (properties) {
            if (properties.baseColorFactor) {
                babylonMaterial.albedoColor = Color3.FromArray(properties.baseColorFactor);
                babylonMaterial.alpha = properties.baseColorFactor[3];
            } else {
                babylonMaterial.albedoColor = Color3.White();
            }

            if (properties.baseColorTexture) {
                promises.push(
                    this._loader.loadTextureInfoAsync(`${context}/baseColorTexture`, properties.baseColorTexture, (texture) => {
                        texture.name = `${babylonMaterial.name} (Base Color)`;
                        babylonMaterial.albedoTexture = texture;
                    })
                );
            }
        }

        if (material.doubleSided) {
            babylonMaterial.backFaceCulling = false;
            babylonMaterial.twoSidedLighting = true;
        }

        this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);

        return Promise.all(promises).then(() => {});
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_unlit(loader));
