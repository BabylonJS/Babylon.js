import { type Nullable } from "core/types";
import { type Material } from "core/Materials/material";
import { type OpenPBRMaterial } from "core/Materials/PBR/openpbrMaterial";
import { type IKHRMaterialsRetroreflection } from "babylonjs-gltf2interface";
import { type IMaterial, type ITextureInfo } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_retroreflection";

/**
 * Loads the draft KHR_materials_retroreflection extension.
 * [Specification](https://github.com/KhronosGroup/glTF/blob/bfb9d65397d19cf630a36a3d1f95cb86a2f671c4/extensions/2.0/Khronos/KHR_materials_retroreflection/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_retroreflection implements IGLTFLoaderExtension {
    /** The name of this extension. */
    public readonly name = NAME;

    /** Defines whether this extension is enabled. */
    public enabled: boolean;

    /** Defines the order in which material extensions are applied. */
    public order = 196;

    private _loader: GLTFLoader;

    /** @internal */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = loader.isExtensionUsed(NAME);
    }

    /** @internal */
    public dispose(): void {
        (this._loader as any) = null;
    }

    /** @internal */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsRetroreflection>(context, material, this.name, async (extensionContext, extension) => {
            if (material.extensions?.["KHR_materials_pbrSpecularGlossiness"] || material.extensions?.["KHR_materials_unlit"]) {
                throw new Error(`${extensionContext}: KHR_materials_retroreflection is incompatible with this material model`);
            }

            await Promise.all([
                this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial),
                this._loadRetroreflectionPropertiesAsync(extensionContext, extension, babylonMaterial),
            ]);
        });
    }

    private async _loadRetroreflectionPropertiesAsync(context: string, properties: IKHRMaterialsRetroreflection, babylonMaterial: Material): Promise<void> {
        if (!("specularRetroreflectivity" in babylonMaterial)) {
            throw new Error(`${context}: KHR_materials_retroreflection requires an OpenPBRMaterial`);
        }

        const material = babylonMaterial as OpenPBRMaterial;
        material.specularRetroreflectivity = properties.retroreflectionFactor ?? 0;

        if (properties.retroreflectionTexture) {
            (properties.retroreflectionTexture as ITextureInfo).nonColorData = true;
            await this._loader.loadTextureInfoAsync(`${context}/retroreflectionTexture`, properties.retroreflectionTexture, (texture) => {
                texture.name = `${babylonMaterial.name} (Retroreflection)`;
                texture.gammaSpace = false;
                material.specularRetroreflectivityTexture = texture;
            });
        }
    }
}

/**
 * Registers the KHR_materials_retroreflection glTF loader extension.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_retroreflection(): void {
    unregisterGLTFExtension(NAME);
    registerGLTFExtension(NAME, true, (loader) => new KHR_materials_retroreflection(loader));
}
