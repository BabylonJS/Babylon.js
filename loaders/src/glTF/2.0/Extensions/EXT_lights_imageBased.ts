/// <reference path="../../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GLTF2.Extensions {
    const NAME = "EXT_lights_imageBased";

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
     * [Specification](TODO) (Experimental)
     */
    export class EXT_lights_imageBased extends GLTFLoaderExtension {
        public readonly name = NAME;

        private _lights?: ILight[];

        protected _onLoading(): void {
            const extensions = this._loader._gltf.extensions;
            if (extensions && extensions[this.name]) {
                const extension = extensions[this.name] as ILights;
                this._lights = extension.lights;
            }
        }

        protected _loadSceneAsync(context: string, scene: _ILoaderScene): Nullable<Promise<void>> { 
            return this._loadExtensionAsync<ILightReference>(context, scene, (extensionContext, extension) => {
                const promises = new Array<Promise<void>>();

                promises.push(this._loader._loadSceneAsync(context, scene));

                this._loader._parent._logOpen(`${extensionContext}`);

                const light = GLTFLoader._GetProperty(`${extensionContext}/light`, this._lights, extension.light);
                promises.push(this._loadLightAsync(`#/extensions/${this.name}/lights/${extension.light}`, light).then(texture => {
                    this._loader._babylonScene.environmentTexture = texture;
                }));

                this._loader._parent._logClose();

                return Promise.all(promises).then(() => {});
            });
        }

        private _loadLightAsync(context: string, light: ILight): Promise<BaseTexture> {
            if (!light._loaded) {
                const promises = new Array<Promise<void>>();

                this._loader._parent._logOpen(`${context}`);

                const imageData = new Array<Array<ArrayBufferView>>(light.specularImages.length);
                for (let mipmap = 0; mipmap < light.specularImages.length; mipmap++) {
                    const faces = light.specularImages[mipmap];
                    imageData[mipmap] = new Array<ArrayBufferView>(faces.length);
                    for (let face = 0; face < faces.length; face++) {
                        const specularImageContext = `${context}/specularImages/${mipmap}/${face}`;
                        this._loader._parent._logOpen(`${specularImageContext}`);

                        const index = faces[face];
                        const image = GLTFLoader._GetProperty(specularImageContext, this._loader._gltf.images, index);
                        promises.push(this._loader._loadImageAsync(`#/images/${index}`, image).then(data => {
                            imageData[mipmap][face] = data;
                        }));

                        this._loader._parent._logClose();
                    }
                }

                this._loader._parent._logClose();

                light._loaded = Promise.all(promises).then(() => {
                    const babylonTexture = new RawCubeTexture(this._loader._babylonScene, null, light.specularImageSize);
                    light._babylonTexture = babylonTexture;

                    if (light.intensity != undefined) {
                        babylonTexture.level = light.intensity;
                    }

                    if (light.rotation) {
                        let rotation = Quaternion.FromArray(light.rotation);

                        // Invert the rotation so that positive rotation is counter-clockwise.
                        if (!this._loader._babylonScene.useRightHandedSystem) {
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

    GLTFLoader._Register(NAME, loader => new EXT_lights_imageBased(loader));
}