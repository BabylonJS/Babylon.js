import type { Nullable } from "core/types";
import { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { Material } from "core/Materials/material";

import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsIridescence } from "babylonjs-gltf2interface";

const NAME = "KHR_materials_iridescence";

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_iridescence/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_iridescence implements IGLTFLoaderExtension {
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
    public order = 195;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsIridescence>(context, material, this.name, (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadIridescencePropertiesAsync(extensionContext, extension, babylonMaterial));
            return Promise.all(promises).then(() => {});
        });
    }

    private _loadIridescencePropertiesAsync(context: string, properties: IKHRMaterialsIridescence, babylonMaterial: Material): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterial)) {
            throw new Error(`${context}: Material type not supported`);
        }

        const promises = new Array<Promise<any>>();

        babylonMaterial.iridescence.isEnabled = true;

        babylonMaterial.iridescence.intensity = properties.iridescenceFactor ?? 0;
        babylonMaterial.iridescence.indexOfRefraction = properties.iridescenceIor ?? (properties as any).iridescenceIOR ?? 1.3;
        babylonMaterial.iridescence.minimumThickness = properties.iridescenceThicknessMinimum ?? 100;
        babylonMaterial.iridescence.maximumThickness = properties.iridescenceThicknessMaximum ?? 400;

        if (properties.iridescenceTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/iridescenceTexture`, properties.iridescenceTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Iridescence Intensity)`;
                    babylonMaterial.iridescence.texture = texture;
                })
            );
        }

        if (properties.iridescenceThicknessTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/iridescenceThicknessTexture`, properties.iridescenceThicknessTexture, (texture) => {
                    texture.name = `${babylonMaterial.name} (Iridescence Thickness)`;
                    babylonMaterial.iridescence.thicknessTexture = texture;
                })
            );
        }

        return Promise.all(promises).then(() => {});
    }
}

GLTFLoader.RegisterExtension(NAME, (loader) => new KHR_materials_iridescence(loader));
