/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import { Color3 } from "core/Maths/math.color";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsVolume } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { Vector3 } from "core/Maths/math.vector";

const NAME = "KHR_materials_volume";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_volume extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_volume"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_volume/README.md)
 * @since 5.0.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_volume implements IGLTFLoaderExtension {
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
    public order = 173;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            // We need to disable instance usage because the attenuation factor depends on the node scale of each individual mesh
            this._loader._disableInstancedMesh++;
        }
    }

    /** @internal */
    public dispose() {
        if (this.enabled) {
            this._loader._disableInstancedMesh--;
        }
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsVolume>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadVolumePropertiesAsync(extensionContext, material, babylonMaterial, extension));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadVolumePropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsVolume): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);

        // If transparency isn't enabled already, this extension shouldn't do anything.
        // i.e. it requires either the KHR_materials_transmission or KHR_materials_diffuse_transmission extensions.
        if ((adapter.transmissionWeight === 0 && adapter.subsurfaceWeight === 0) || !extension.thicknessFactor) {
            return Promise.resolve();
        }

        const attenuationDistance = extension.attenuationDistance !== undefined ? extension.attenuationDistance : Number.MAX_VALUE;
        const attenuationColor = extension.attenuationColor !== undefined && extension.attenuationColor.length == 3 ? Color3.FromArray(extension.attenuationColor) : Color3.White();
        // Calculate the attenuation coefficient (i.e. extinction coefficient)
        const extinctionCoefficient = new Vector3(-Math.log(attenuationColor.r), -Math.log(attenuationColor.g), -Math.log(attenuationColor.b));
        extinctionCoefficient.scaleInPlace(1 / Math.max(attenuationDistance, 0.001));
        adapter.extinctionCoefficient = extinctionCoefficient;

        adapter.transmissionDepth = attenuationDistance;
        adapter.transmissionColor = attenuationColor;

        adapter.volumeThickness = extension.thicknessFactor ?? 0;

        const promises = new Array<Promise<any>>();

        if (extension.thicknessTexture) {
            (extension.thicknessTexture as ITextureInfo).nonColorData = true;
            // eslint-disable-next-line github/no-then
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/thicknessTexture`, extension.thicknessTexture, (texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Thickness)`;
                    adapter.volumeThicknessTexture = texture;
                })
            );
        }

        // eslint-disable-next-line github/no-then
        return Promise.all(promises).then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_volume(loader));
