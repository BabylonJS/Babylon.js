import type { Nullable } from "core/types";
import { Color3 } from "core/Maths/math.color";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsPbrSpecularGlossiness } from "babylonjs-gltf2interface";

const NAME = "KHR_materials_pbrSpecularGlossiness";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Archived/KHR_materials_pbrSpecularGlossiness/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_pbrSpecularGlossiness implements IGLTFLoaderExtension {
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
    public order = 200;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsPbrSpecularGlossiness>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialBasePropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadSpecularGlossinessPropertiesAsync(extensionContext, extension, babylonMaterial));
            this._loader.loadMaterialAlphaProperties(context, material, babylonMaterial);
            return Promise.all(promises).then(() => {});
        });
    }

    private _loadSpecularGlossinessPropertiesAsync(context: string, properties: IKHRMaterialsPbrSpecularGlossiness, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.metallic = null;
        babylonMaterial.roughness = null;

        if (properties.diffuseFactor) {
            babylonMaterial.albedoColor = Color3.FromArray(properties.diffuseFactor);
            babylonMaterial.alpha = properties.diffuseFactor[3];
        } else {
            babylonMaterial.albedoColor = Color3.White();
        }

        babylonMaterial.reflectivityColor = properties.specularFactor ? Color3.FromArray(properties.specularFactor) : Color3.White();
        babylonMaterial.microSurface = properties.glossinessFactor == undefined ? 1 : properties.glossinessFactor;

        if (properties.diffuseTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/diffuseTexture`, properties.diffuseTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Diffuse)`;
                    babylonMaterial.albedoTexture = texture;
                })
            );
        }

        if (properties.specularGlossinessTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/specularGlossinessTexture`, properties.specularGlossinessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Specular Glossiness)`;
                    babylonMaterial.reflectivityTexture = texture;
                    babylonMaterial.reflectivityTexture.hasAlpha = true;
                })
            );

            babylonMaterial.useMicroSurfaceFromReflectivityMapAlpha = true;
        }

        return Promise.all(promises).then(() => {});
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_pbrSpecularGlossiness(loader));
