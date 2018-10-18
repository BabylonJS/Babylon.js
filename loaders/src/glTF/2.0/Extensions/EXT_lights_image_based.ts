/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Loader.Extensions {
    const NAME = "EXT_lights_image_based";

    interface ILightReference {
        light: number;
    }

    interface ILight extends IChildRootProperty {
        intensity: number;
        rotation: number[];
        specularImageSize: number;
        specularImages: number[][];
        irradianceCoefficients: number[][];

        _babylonTexture?: BaseTexture;
        _loaded?: Promise<void>;
    }

    interface ILights {
        lights: ILight[];
    }

    /**
     * [Specification](https://github.com/KhronosGroup/glTF/blob/eb3e32332042e04691a5f35103f8c261e50d8f1e/extensions/2.0/Khronos/EXT_lights_image_based/README.md) (Experimental)
     */
    export class EXT_lights_image_based implements IGLTFLoaderExtension {
        /** The name of this extension. */
        public readonly name = NAME;

        /** Defines whether this extension is enabled. */
        public enabled = true;

        private _loader: GLTFLoader;
        private _lights?: ILight[];

        /** @hidden */
        constructor(loader: GLTFLoader) {
            this._loader = loader;
        }

        /** @hidden */
        public dispose() {
            delete this._loader;
            delete this._lights;
        }

        /** @hidden */
        public onLoading(): void {
            const extensions = this._loader.gltf.extensions;
            if (extensions && extensions[this.name]) {
                const extension = extensions[this.name] as ILights;
                this._lights = extension.lights;
            }
        }

        /** @hidden */
        public loadSceneAsync(context: string, scene: IScene): Nullable<Promise<void>> {
            return GLTFLoader.LoadExtensionAsync<ILightReference>(context, scene, this.name, (extensionContext, extension) => {
                const promises = new Array<Promise<any>>();

                promises.push(this._loader.loadSceneAsync(context, scene));

                this._loader.logOpen(`${extensionContext}`);

                const light = ArrayItem.Get(`${extensionContext}/light`, this._lights, extension.light);
                promises.push(this._loadLightAsync(`#/extensions/${this.name}/lights/${extension.light}`, light).then((texture) => {
                    this._loader.babylonScene.environmentTexture = texture;
                }));

                this._loader.logClose();

                return Promise.all(promises).then(() => {});
            });
        }

        private _loadLightAsync(context: string, light: ILight): Promise<BaseTexture> {
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
                        promises.push(this._loader.loadImageAsync(`#/images/${index}`, image).then((data) => {
                            imageData[mipmap][face] = data;
                        }));

                        this._loader.logClose();
                    }
                }

                this._loader.logClose();

                light._loaded = Promise.all(promises).then(() => {
                    const babylonTexture = new RawCubeTexture(this._loader.babylonScene, null, light.specularImageSize);
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

                    const sphericalHarmonics = SphericalHarmonics.FromArray(light.irradianceCoefficients);
                    sphericalHarmonics.scale(light.intensity);

                    sphericalHarmonics.convertIrradianceToLambertianRadiance();
                    const sphericalPolynomial = SphericalPolynomial.FromHarmonics(sphericalHarmonics);

                    // Compute the lod generation scale to fit exactly to the number of levels available.
                    const lodGenerationScale = (imageData.length - 1) / Scalar.Log2(light.specularImageSize);
                    return babylonTexture.updateRGBDAsync(imageData, sphericalPolynomial, lodGenerationScale);
                });
            }

            return light._loaded.then(() => {
                return light._babylonTexture!;
            });
        }
    }

    GLTFLoader.RegisterExtension(NAME, (loader) => new EXT_lights_image_based(loader));
}