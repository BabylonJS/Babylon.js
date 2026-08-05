/* eslint-disable github/no-then */
/* eslint-disable @typescript-eslint/naming-convention */
import { type Nullable } from "core/types";
import { type Material } from "core/Materials/material";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type IMaterial } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader.pure";
import { type IKHRMaterialsScatter } from "babylonjs-gltf2interface";
import { Color3 } from "core/Maths/math.color.pure";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { Vector3 } from "core/Maths/math.vector.pure";
import { Logger } from "core/Misc/logger";

const NAME = "KHR_materials_scatter";

function multiScatterToSingleScatterAlbedo(multiScatter: Color3): Vector3 {
    const multiScatterAlbedo = new Vector3(multiScatter.r, multiScatter.g, multiScatter.b);
    const s: Vector3 = new Vector3(4.09712, 4.09712, 4.09712);
    s.addInPlace(new Vector3(4.20863, 4.20863, 4.20863).multiplyInPlace(multiScatterAlbedo));

    const p: Vector3 = new Vector3(9.59217, 9.59217, 9.59217);
    p.addInPlace(new Vector3(41.6808, 41.6808, 41.6808).multiplyInPlace(multiScatterAlbedo));
    p.addInPlace(new Vector3(17.7126, 17.7126, 17.7126).multiplyInPlace(multiScatterAlbedo.multiply(multiScatterAlbedo)));
    s.subtractInPlace(new Vector3(Math.sqrt(p.x), Math.sqrt(p.y), Math.sqrt(p.z)));
    return new Vector3(1.0, 1.0, 1.0).subtract(s.multiply(s));
}

/**
 * [Proposed Specification](https://github.com/KhronosGroup/glTF/pull/2579)
 * !!! Experimental Extension Subject to Changes !!!
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_scatter implements IGLTFLoaderExtension {
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
    }

    /** @internal */
    public dispose() {
        (this._loader as any) = null;
    }

    /**
     * @internal
     */
    // eslint-disable-next-line no-restricted-syntax
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsScatter>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            Logger.Log(`KHR_materials_scatter: ${material.name} (${material.index})`);
            promises.push(this._loadScatterPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    private _loadScatterPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsScatter): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        // Transmission should already be configured at this point.
        // If volumetric, we can modify the existing transmission slab by adding scattering.
        //      scatterColor = scatterStrength * scatterColor (requires texture multiply)
        // If thin-walled, we need to use the subsurface slab in OpenPBR
        //      subsurfaceWeight = scatterStrength * transmissionFactor (requires texture multiply)
        //      transmissionWeight = transmissionFactor * (1 - scatterStrength) (requires texture multiply)
        // adapter.configureScatter(); // If thin-walled, copy the transmission slab to the subsurface slab and modify the weights. If volumetric, add scattering to the existing transmission slab.
        const scatterStrength = extension.scatterStrengthFactor ?? 0;
        const multiscatterColor = extension.multiscatterColorFactor !== undefined ? Color3.FromArray(extension.multiscatterColorFactor) : Color3.White();
        const scatterAnisotropy = extension.scatterAnisotropy ?? 0;
        if (adapter.geometryThinWalled) {
            // Stage scatter strength in subsurfaceWeight/Texture; finalizeAsync will convert
            // both to final transmission_weight and subsurface_weight once all textures are loaded.
            adapter.configureSubsurface();
            adapter.subsurfaceWeight = scatterStrength;
            adapter.subsurfaceColor = multiscatterColor;
            adapter.subsurfaceScatterAnisotropy = scatterAnisotropy;
        } else {
            const effectiveMultiScatter = multiscatterColor.scale(scatterStrength);
            adapter.volumetricMultiScatterFactor = effectiveMultiScatter;

            const extinctionCoefficient = new Vector3(-Math.log(adapter.transmissionColor.r), -Math.log(adapter.transmissionColor.g), -Math.log(adapter.transmissionColor.b));
            extinctionCoefficient.scaleInPlace(1 / Math.max(adapter.transmissionDepth, 0.000001));

            const singleScatterAlbedo = multiScatterToSingleScatterAlbedo(effectiveMultiScatter);
            const scatteringCoefficient = extinctionCoefficient.multiply(singleScatterAlbedo);

            // The scattering coefficient in OpenPBR is defined as per unit distance, so we need to scale it back up by the depth.
            scatteringCoefficient.scaleInPlace(adapter.transmissionDepth);
            adapter.transmissionScatter.set(scatteringCoefficient.x, scatteringCoefficient.y, scatteringCoefficient.z);

            adapter.transmissionScatterAnisotropy = scatterAnisotropy;
        }

        const promises = new Array<Promise<any>>();

        if (extension.multiscatterColorTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/multiscatterColorTexture`, extension.multiscatterColorTexture).then((texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Multiscatter Color)`;
                    if (adapter.geometryThinWalled) {
                        adapter.subsurfaceColorTexture = texture;
                    } else {
                        adapter.transmissionScatterTexture = texture;
                    }
                })
            );
        }

        if (extension.scatterStrengthTexture) {
            promises.push(
                this._loader.loadTextureInfoAsync(`${context}/scatterStrengthTexture`, extension.scatterStrengthTexture).then((texture: BaseTexture) => {
                    texture.name = `${babylonMaterial.name} (Scatter Strength)`;
                    if (adapter.geometryThinWalled) {
                        adapter.subsurfaceWeightTexture = texture;
                    } else {
                        adapter.volumetricScatterStrengthTexture = texture;
                    }
                })
            );
        }

        return Promise.all(promises).then(() => {});
    }
}

let _Registered = false;
/**
 * Registers the KHR_materials_scatter glTF loader extension.
 * Safe to call multiple times; only the first call has an effect.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function RegisterKHR_materials_scatter(): void {
    if (_Registered) {
        return;
    }
    _Registered = true;

    unregisterGLTFExtension(NAME);

    registerGLTFExtension(NAME, true, (loader) => new KHR_materials_scatter(loader));
}
