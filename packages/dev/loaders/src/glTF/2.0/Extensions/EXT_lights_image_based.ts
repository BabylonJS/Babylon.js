import type { Nullable } from "core/types";
import { SphericalHarmonics, SphericalPolynomial } from "core/Maths/sphericalPolynomial";
import { Quaternion, Matrix } from "core/Maths/math.vector";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { RawCubeTexture } from "core/Materials/Textures/rawCubeTexture";

import type { IEXTLightsImageBased_LightReferenceImageBased, IEXTLightsImageBased_LightImageBased, IEXTLightsImageBased } from "babylonjs-gltf2interface";
import type { IScene } from "../glTFLoaderInterfaces";
import type { IGLTFLoaderExtension } from "../glTFLoaderExtension";
import { GLTFLoader, ArrayItem } from "../glTFLoader";
import { registerGLTFExtension, unregisterGLTFExtension } from "../glTFLoaderExtensionRegistry";

const NAME = "EXT_lights_image_based";

declare module "../../glTFFileLoader" {
    // eslint-disable-next-line jsdoc/require-jsdoc
    export interface GLTFLoaderExtensionOptions {
        /**
         * Defines options for the EXT_lights_image_based extension.
         */
        // NOTE: Don't use NAME here as it will break the UMD type declarations.
        ["EXT_lights_image_based"]: {};
    }
}

declare module "babylonjs-gltf2interface" {
    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface IEXTLightsImageBased_LightImageBased {
        _babylonTexture?: BaseTexture;
        _loaded?: Promise<void>;
    }
}

/**
 * [Specification](https://github.com/KhronosGroup/glTF/blob/main/extensions/2.0/Vendor/EXT_lights_image_based/README.md)
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export class EXT_lights_image_based implements IGLTFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLTFLoader;
    private _lights?: IEXTLightsImageBased_LightImageBased[];

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
        delete this._lights;
    }

    /** @internal */
    public onLoading(): void {
        const extensions = this._loader.gltf.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IEXTLightsImageBased;
            this._lights = extension.lights;
        }
    }

    /**
     * @internal
     */
    public loadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
        return GLTFLoader.LoadExtensionAsync<IEXTLightsImageBased_LightReferenceImageBased>(context, scene, this.name, (extensionContext, extension) => {
            this._loader._allMaterialsDirtyRequired = true;

            const promises = new Array<Promise<any>>();

            promises.push(this._loader.loadSceneAsync(context, scene));

            this._loader.logOpen(`${extensionContext}`);

            const light = ArrayItem.Get(`${extensionContext}/light`, this._lights, extension.light);
            promises.push(
                this._loadLightAsync(`/extensions/${this.name}/lights/${extension.light}`, light).then((texture) => {
                    this._loader.babylonScene.environmentTexture = texture;
                })
            );

            this._loader.logClose();

            return Promise.all(promises).then(() => {});
        });
    }

    private _loadLightAsync(context: string, light: IEXTLightsImageBased_LightImageBased): Promise<BaseTexture> {
        if (!light._loaded) {
            const promises = new Array<Promise<any>>();

            this._loader.logOpen(`${context}`);

            const imageData = new Array<Array<ArrayBufferView>>(light.specularImages.length);
            for (let mipmap = 0; mipmap < light.specularImages.length; mipmap++) {
                const faces = light.specularImages[mipmap];
                imageData[mipmap] = new Array<ArrayBufferView>(faces.length);
                for (let face = 0; face < faces.length; face++) {
                    const specularImageContext = `${context}/specularImages/${mipmap}/${face}`;
                    this._loader.logOpen(`${specularImageContext}`);

                    const index = faces[face];
                    const image = ArrayItem.Get(specularImageContext, this._loader.gltf.images, index);
                    promises.push(
                        this._loader.loadImageAsync(`/images/${index}`, image).then((data) => {
                            imageData[mipmap][face] = data;
                        })
                    );

                    this._loader.logClose();
                }
            }

            this._loader.logClose();

            light._loaded = Promise.all(promises).then(() => {
                const babylonTexture = new RawCubeTexture(this._loader.babylonScene, null, light.specularImageSize);
                babylonTexture.name = light.name || "environment";
                light._babylonTexture = babylonTexture;

                if (light.intensity != undefined) {
                    babylonTexture.level = light.intensity;
                }

                if (light.rotation) {
                    let rotation = Quaternion.FromArray(light.rotation);

                    // Invert the rotation so that positive rotation is counter-clockwise.
                    if (!this._loader.babylonScene.useRightHandedSystem) {
                        rotation = Quaternion.Inverse(rotation);
                    }

                    Matrix.FromQuaternionToRef(rotation, babylonTexture.getReflectionTextureMatrix());
                }

                if (!light.irradianceCoefficients) {
                    throw new Error(`${context}: Irradiance coefficients are missing`);
                }

                const sphericalHarmonics = SphericalHarmonics.FromArray(light.irradianceCoefficients);
                sphericalHarmonics.scaleInPlace(light.intensity);

                sphericalHarmonics.convertIrradianceToLambertianRadiance();
                const sphericalPolynomial = SphericalPolynomial.FromHarmonics(sphericalHarmonics);

                // Compute the lod generation scale to fit exactly to the number of levels available.
                const lodGenerationScale = (imageData.length - 1) / Math.log2(light.specularImageSize);
                return babylonTexture.updateRGBDAsync(imageData, sphericalPolynomial, lodGenerationScale);
            });
        }

        return light._loaded.then(() => {
            return light._babylonTexture!;
        });
    }
}

unregisterGLTFExtension(NAME);
registerGLTFExtension(NAME, true, (loader) => new EXT_lights_image_based(loader));
