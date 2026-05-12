import { type Nullable } from "core/types";
import { type Material } from "core/Materials/material";
import { type BaseTexture } from "core/Materials/Textures/baseTexture";
import { type IMaterial, type ITextureInfo } from "../glTFLoaderInterfaces";
import { type IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader } from "../glTFLoader";
import { type IKHRMaterialsTransmission } from "babylonjs-gltf2interface";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";
import { TransmissionHelper, type ITransmissionHelperHolder } from "./transmissionHelper";

const NAME = "KHR_materials_transmission";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc, @typescript-eslint/naming-convention
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the KHR_materials_transmission extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["KHR_materials_transmission"]: {};
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Khronos/KHR_materials_transmission/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class KHR_materials_transmission implements IGLTFLoaderExtension {
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
    public order = 175;

    private _loader: GLTFLoader;

    /**
     * @internal
     */
    constructor(loader: GLTFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        if (this.enabled) {
            loader.parent.transparencyAsCoverage = true;
        }
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
        return GLTFLoader.LoadExtensionAsync<IKHRMaterialsTransmission>(context, material, this.name, async (extensionContext, extension) => {
            const promises = new Array<Promise<any>>();
            promises.push(this._loader.loadMaterialPropertiesAsync(context, material, babylonMaterial));
            promises.push(this._loadTransparentPropertiesAsync(extensionContext, material, babylonMaterial, extension));
            // eslint-disable-next-line github/no-then
            return await Promise.all(promises).then(() => {});
        });
    }

    // eslint-disable-next-line no-restricted-syntax, @typescript-eslint/promise-function-async
    private _loadTransparentPropertiesAsync(context: string, material: IMaterial, babylonMaterial: Material, extension: IKHRMaterialsTransmission): Promise<void> {
        const adapter = this._loader._getOrCreateMaterialAdapter(babylonMaterial);
        const transmissionWeight = extension.transmissionFactor !== undefined ? extension.transmissionFactor : 0.0;

        if (transmissionWeight === 0 || !adapter) {
            return Promise.resolve();
        }

        // Set transmission properties immediately via adapter
        adapter.configureTransmission();
        adapter.transmissionWeight = transmissionWeight;

        // Handle transmission helper setup (only needed for PBR materials)
        if (transmissionWeight > 0 && !this._loader.parent.dontUseTransmissionHelper) {
            const scene = babylonMaterial.getScene() as unknown as ITransmissionHelperHolder;
            if (!scene._transmissionHelper) {
                new TransmissionHelper({}, babylonMaterial.getScene(), this._loader);
            } else if (!scene._transmissionHelper?._isRenderTargetValid()) {
                // If the render target is not valid, recreate it.
                scene._transmissionHelper?._setupRenderTargets();
            }
        }

        // Load texture if present
        let texturePromise: Promise<Nullable<BaseTexture>> = Promise.resolve(null);
        if (extension.transmissionTexture) {
            (extension.transmissionTexture as ITextureInfo).nonColorData = true;
            texturePromise = this._loader.loadTextureInfoAsync(`${context}/transmissionTexture`, extension.transmissionTexture, (texture: BaseTexture) => {
                texture.name = `${babylonMaterial.name} (Transmission)`;
                adapter.transmissionWeightTexture = texture;
            });
        }

        // eslint-disable-next-line github/no-then
        return texturePromise.then(() => {});
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new KHR_materials_transmission(loader));
