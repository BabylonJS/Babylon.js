/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { Material } from "core/Materials/material";
import { Color3 } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { IMaterial, ITextureInfo } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsVolumeScatter } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_volume_scatter";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_volume_scatter extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_volume_scatter"]: {};
    }
}

function multiScatterToSingleScatterAlbedo(multiScatter: Color3): Vector3 {
    const multiScatterAlbedo = new Vector3(multiScatter.r, multiScatter.g, multiScatter.b);
    const s: Vector3 = new Vector3(4.09712, 4.09712, 4.09712);
    s.multiplyInPlace(multiScatterAlbedo);
    s.addInPlace(new Vector3(4.20863, 4.20863, 4.20863));

    const p: Vector3 = new Vector3(9.59217, 9.59217, 9.59217);
    p.addInPlace(new Vector3(41.6808, 41.6808, 41.6808).multiplyInPlace(multiScatterAlbedo));
    p.addInPlace(new Vector3(17.7126, 17.7126, 17.7126).multiplyInPlace(multiScatterAlbedo.multiply(multiScatterAlbedo)));
    s.subtractInPlace(new Vector3(Math.sqrt(p.x), Math.sqrt(p.y), Math.sqrt(p.z)));
    return new Vector3(1.0, 1.0, 1.0).subtract(s.multiply(s));
}

/**
 * TODO: In-progress specification
 * [Specification](https://github.com/KhronosGroup/glTF/blob/7ea427ed55d44427e83c0a6d1c87068b1a4151c5/extensions/2.0/Khronos/KHR_materials_volume_scatter/README.md)
 * @experimental
 * @since 9.0.0
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_volume_scatter implements IGLTFLoaderExtension {
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
    public order = 172;

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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsVolumeScatter>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadVolumePropertiesAsync(extensionContext, material, babylonMaterial, extension));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadVolumePropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsVolumeScatter): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);

        // If transparency isn't enabled already, this extension shouldn't do anything.
        // i.e. it requires either the KHR_materials_transmission or KHR_materials_diffuse_transmission extensions.
        if (adapter.transmissionWeight === 0 && adapter.subsurfaceWeight === 0) {
            return Promise.resolve();
        }

        const scatterColor = extension.multiscatterColor !== undefined && extension.multiscatterColor.length == 3 ? Color3.FromArray(extension.multiscatterColor) : Color3.Black();
        const scatterAnisotropy = extension.scatterAnisotropy !== undefined ? extension.scatterAnisotropy : 0;

        // In glTF, both the translucency volume and subsurface volume use the same input parameters.
        // We'll apply them to both, as appropriate.
        if (adapter.transmissionWeight > 0) {
            const singleScatterAlbedo = multiScatterToSingleScatterAlbedo(scatterColor);

            const extinctionCoefficient = new Vector3(-Math.log(adapter.transmissionColor.r), -Math.log(adapter.transmissionColor.g), -Math.log(adapter.transmissionColor.b));
            extinctionCoefficient.scaleInPlace(1 / Math.max(adapter.transmissionDepth, 0.001));

            const scatteringCoefficient = extinctionCoefficient.multiply(singleScatterAlbedo);

            // The scattering coefficient in OpenPBR is defined as per unit distance, so we need to scale it back up by the depth.
            scatteringCoefficient.scaleInPlace(adapter.transmissionDepth);
            adapter.transmissionScatter.set(scatteringCoefficient.x, scatteringCoefficient.y, scatteringCoefficient.z);

            // Load texture if present
            let texturePromise: Promise<Nullable<BaseTexture>> = Promise.resolve(null);
            if (extension.multiscatterColorTexture) {
                (extension.multiscatterColorTexture as ITextureInfo).nonColorData = true;
                texturePromise = this._loader.loadTextureInfoAsync(`${context}/multiscatterColorTexture`, extension.multiscatterColorTexture, (texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Transmission)`;
                    adapter.transmissionWeightTexture = texture;
                });
            }
            adapter.transmissionScatterAnisotropy = scatterAnisotropy;
            // eslint-disable-next-line github/no-then
            return texturePromise.then(() => {});
        }
        // Subsurface volume
        if (adapter.subsurfaceWeight > 0) {
            adapter.subsurfaceScatterAnisotropy = scatterAnisotropy;
            adapter.subsurfaceColor = scatterColor;

            const mfp = new Vector3(
                adapter.extinctionCoefficient.x !== 0 ? 1.0 / adapter.extinctionCoefficient.x : 1.0,
                adapter.extinctionCoefficient.y !== 0 ? 1.0 / adapter.extinctionCoefficient.y : 1.0,
                adapter.extinctionCoefficient.z !== 0 ? 1.0 / adapter.extinctionCoefficient.z : 1.0
            );

            adapter.subsurfaceRadius = Math.max(mfp.x, mfp.y, mfp.z);
            adapter.subsurfaceRadiusScale = new Color3(mfp.x / adapter.subsurfaceRadius, mfp.y / adapter.subsurfaceRadius, mfp.z / adapter.subsurfaceRadius);
        }

        return Promise.resolve();
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_volume_scatter(loader));
