/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { PBRMaterial } from "core/Materials/PBR/pbrMaterial";
import type { OpenPBRMaterial } from "core/Materials/PBR/openPbrMaterial";
import type { Material } from "core/Materials/material";
import type { IMaterial } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import type { IKHRMaterialsDispersion } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "KHR_materials_dispersion";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_dispersion extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_dispersion"]: {};
    }
}

let PBRMaterialClass: typeof PBRMaterial | typeof OpenPBRMaterial;

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/87bd64a7f5e23c84b6aef2e6082069583ed0ddb4/extensions/2.0/Khronos/KHR_materials_dispersion/README.md)
 * @experimental
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_dispersion implements IGLTFLoaderExtension {
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
    public order = 174;

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
    public loadMaterialPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, useOpenPBR: false): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsDispersion>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            if (useOpenPBR) {
                const mod = await import("core/Materials/PBR/openPbrMaterial");
                PBRMaterialClass = mod.OpenPBRMaterial;
            } else {
                const mod = await import("core/Materials/PBR/pbrMaterial");
                PBRMaterialClass = mod.PBRMaterial;
            }
            promises.push(this._loadDispersionPropertiesAsync(extensionContext, material, babylonMaterial, extension, useOpenPBR));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _loadDispersionPropertiesAsync(
        context: string,
        material: IMaterial,
        babylonMaterial: Material,
        extension: IKHRMaterialsDispersion,
        useOpenPBR: boolean = false
    ): Promise<void> {
        if (!(babylonMaterial instanceof PBRMaterialClass)) {
            throw new Error(`${context}: Material type not supported`);
        }

        if (!useOpenPBR) {
            // If transparency isn't enabled already, this extension shouldn't do anything.
            // i.e. it requires either the KHR_materials_transmission or KHR_materials_diffuse_transmission extensions.
            if (!(babylonMaterial as PBRMaterial).subSurface.isRefractionEnabled || !extension.dispersion) {
                return Promise.resolve();
            }
            (babylonMaterial as PBRMaterial).subSurface.isDispersionEnabled = true;
            (babylonMaterial as PBRMaterial).subSurface.dispersion = extension.dispersion;
        }
        return Promise.resolve();
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_dispersion(loader));
