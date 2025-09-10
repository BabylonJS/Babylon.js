import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import { CubeMapToSphericalPolynomialTools } from "../../Misc/HighDynamicRange/cubemapToSphericalPolynomial";
import { Observable } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { ToGammaSpace } from "../../Maths/math.constants";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import { HDRFiltering } from "../../Materials/Textures/Filtering/hdrFiltering";
import { HDRIrradianceFiltering } from "../../Materials/Textures/Filtering/hdrIrradianceFiltering";
import { ToHalfFloat } from "../../Misc/textureTools";
import "../../Materials/Textures/baseTexture.polynomial";
import type { CubeMapInfo } from "../../Misc/HighDynamicRange/panoramaToCubemap";

/**
 * This represents an environment base texture which could for instance be from HDR or EXR files.
 */
export abstract class EnvCubeTexture extends BaseTexture {
    private static _FacesMapping = ["right", "left", "up", "down", "front", "back"];

    protected _generateHarmonics = true;
    protected _noMipmap: boolean;
    protected _size: number;

    private _prefilterOnLoad: boolean;
    private _prefilterIrradianceOnLoad: boolean;
    private _prefilterUsingCdf: boolean;
    private _textureMatrix: Matrix;
    private _supersample: boolean;
    private _onLoad: () => void;
    private _onError: Nullable<() => void> = null;

    /**
     * The texture URL.
     */
    public url: string;

    protected _isBlocking: boolean = true;
    /**
     * Sets whether or not the texture is blocking during loading.
     */
    public override set isBlocking(value: boolean) {
        this._isBlocking = value;
    }
    /**
     * Gets whether or not the texture is blocking during loading.
     */
    public override get isBlocking(): boolean {
        return this._isBlocking;
    }

    protected _rotationY: number = 0;
    /**
     * Sets texture matrix rotation angle around Y axis in radians.
     */
    public set rotationY(value: number) {
        this._rotationY = value;
        this.setReflectionTextureMatrix(Matrix.RotationY(this._rotationY));
    }
    /**
     * Gets texture matrix rotation angle around Y axis radians.
     */
    public get rotationY(): number {
        return this._rotationY;
    }

    /**
     * Gets or sets the center of the bounding box associated with the cube texture
     * It must define where the camera used to render the texture was set
     */
    public boundingBoxPosition = Vector3.Zero();

    private _boundingBoxSize: Vector3;

    /**
     * Gets or sets the size of the bounding box associated with the cube texture
     * When defined, the cubemap will switch to local mode
     * @see https://community.arm.com/graphics/b/blog/posts/reflections-based-on-local-cubemaps-in-unity
     * @example https://www.babylonjs-playground.com/#RNASML
     */
    public set boundingBoxSize(value: Vector3) {
        if (this._boundingBoxSize && this._boundingBoxSize.equals(value)) {
            return;
        }
        this._boundingBoxSize = value;
        const scene = this.getScene();
        if (scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }
    }
    public get boundingBoxSize(): Vector3 {
        return this._boundingBoxSize;
    }

    /**
     * Observable triggered once the texture has been loaded.
     */
    public onLoadObservable: Observable<EnvCubeTexture> = new Observable<EnvCubeTexture>();

    /**
     * Instantiates an EnvCubeTexture from the following parameters.
     *
     * @param url The location of the raw data (Panorama stored in RGBE format)
     * @param sceneOrEngine The scene or engine the texture will be used in
     * @param size The cubemap desired size (the more it increases the longer the generation will be)
     * @param noMipmap Forces to not generate the mipmap if true
     * @param generateHarmonics Specifies whether you want to extract the polynomial harmonics during the generation process
     * @param gammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
     * @param prefilterOnLoad Prefilters texture to allow use of this texture as a PBR reflection texture.
     * @param onLoad on success callback function
     * @param onError on error callback function
     * @param supersample Defines if texture must be supersampled (default: false)
     * @param prefilterIrradianceOnLoad Prefilters texture to allow use of this texture for irradiance lighting.
     * @param prefilterUsingCdf Defines if the prefiltering should be done using a CDF instead of the default approach.
     */
    constructor(
        url: string,
        sceneOrEngine: Scene | AbstractEngine,
        size: number,
        noMipmap = false,
        generateHarmonics = true,
        gammaSpace = false,
        prefilterOnLoad = false,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        supersample = false,
        prefilterIrradianceOnLoad = false,
        prefilterUsingCdf = false
    ) {
        super(sceneOrEngine);

        if (!url) {
            return;
        }

        this._coordinatesMode = Texture.CUBIC_MODE;
        this.name = url;
        this.url = url;
        this.hasAlpha = false;
        this.isCube = true;
        this._textureMatrix = Matrix.Identity();
        this._prefilterOnLoad = prefilterOnLoad;
        this._prefilterIrradianceOnLoad = prefilterIrradianceOnLoad;
        this._prefilterUsingCdf = prefilterUsingCdf;
        this._onLoad = () => {
            this.onLoadObservable.notifyObservers(this);
            if (onLoad) {
                onLoad();
            }
        };

        this._onError = onError;
        this.gammaSpace = gammaSpace;

        this._noMipmap = noMipmap;
        this._size = size;
        // CDF is very sensitive to lost precision due to downsampling. This can result in
        // noticeable brightness differences with different resolutions. Enabling supersampling
        // mitigates this.
        this._supersample = supersample || prefilterUsingCdf;
        this._generateHarmonics = generateHarmonics;

        this._texture = this._getFromCache(url, this._noMipmap, undefined, undefined, undefined, this.isCube);

        if (!this._texture) {
            if (!this.getScene()?.useDelayedTextureLoading) {
                this._loadTexture();
            } else {
                this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
            }
        } else {
            if (this._texture.isReady) {
                Tools.SetImmediate(() => this._onLoad());
            } else {
                this._texture.onLoadedObservable.add(this._onLoad);
            }
        }
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "EnvCubeTexture"
     */
    public override getClassName(): string {
        return "EnvCubeTexture";
    }

    /**
     * Convert the raw data from the server into cubemap faces
     * @param buffer The buffer containing the texture data
     * @param size The cubemap face size
     * @param supersample Defines if texture must be supersampled
     * @returns The cube map data
     */
    protected abstract _getCubeMapTextureDataAsync(buffer: ArrayBuffer, size: number, supersample: boolean): Promise<CubeMapInfo>;

    /**
     * Occurs when the file has been loaded.
     */
    private _loadTexture() {
        const engine = this._getEngine()!;
        const caps = engine.getCaps();

        let textureType = Constants.TEXTURETYPE_UNSIGNED_BYTE;
        if (caps.textureFloat && caps.textureFloatLinearFiltering) {
            textureType = Constants.TEXTURETYPE_FLOAT;
        } else if (caps.textureHalfFloat && caps.textureHalfFloatLinearFiltering) {
            textureType = Constants.TEXTURETYPE_HALF_FLOAT;
        }

        // eslint-disable-next-line no-restricted-syntax
        const callback = async (buffer: ArrayBuffer): Promise<ArrayBufferView<ArrayBufferLike>[]> => {
            this.lodGenerationOffset = 0.0;
            this.lodGenerationScale = 0.8;

            // Extract the raw linear data.
            const data = await this._getCubeMapTextureDataAsync(buffer, this._size, this._supersample);

            // Generate harmonics if needed.
            if (this._generateHarmonics) {
                const sphericalPolynomial = CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                this.sphericalPolynomial = sphericalPolynomial;
            }

            const results = [];

            let byteArray: Nullable<Uint8Array> = null;
            let shortArray: Nullable<Uint16Array> = null;

            // Push each faces.
            for (let j = 0; j < 6; j++) {
                // Create fallback array
                if (textureType === Constants.TEXTURETYPE_HALF_FLOAT) {
                    shortArray = new Uint16Array(this._size * this._size * 3);
                } else if (textureType === Constants.TEXTURETYPE_UNSIGNED_BYTE) {
                    // 3 channels of 1 bytes per pixel in bytes.
                    byteArray = new Uint8Array(this._size * this._size * 3);
                }

                const dataFace = <Float32Array>(<any>data)[EnvCubeTexture._FacesMapping[j]];

                // If special cases.
                if (this.gammaSpace || shortArray || byteArray) {
                    for (let i = 0; i < this._size * this._size; i++) {
                        // Put in gamma space if requested.
                        if (this.gammaSpace) {
                            dataFace[i * 3 + 0] = Math.pow(dataFace[i * 3 + 0], ToGammaSpace);
                            dataFace[i * 3 + 1] = Math.pow(dataFace[i * 3 + 1], ToGammaSpace);
                            dataFace[i * 3 + 2] = Math.pow(dataFace[i * 3 + 2], ToGammaSpace);
                        }

                        // Convert to half float texture for fallback.
                        if (shortArray) {
                            shortArray[i * 3 + 0] = ToHalfFloat(dataFace[i * 3 + 0]);
                            shortArray[i * 3 + 1] = ToHalfFloat(dataFace[i * 3 + 1]);
                            shortArray[i * 3 + 2] = ToHalfFloat(dataFace[i * 3 + 2]);
                        }

                        // Convert to int texture for fallback.
                        if (byteArray) {
                            let r = Math.max(dataFace[i * 3 + 0] * 255, 0);
                            let g = Math.max(dataFace[i * 3 + 1] * 255, 0);
                            let b = Math.max(dataFace[i * 3 + 2] * 255, 0);

                            // May use luminance instead if the result is not accurate.
                            const max = Math.max(Math.max(r, g), b);
                            if (max > 255) {
                                const scale = 255 / max;
                                r *= scale;
                                g *= scale;
                                b *= scale;
                            }

                            byteArray[i * 3 + 0] = r;
                            byteArray[i * 3 + 1] = g;
                            byteArray[i * 3 + 2] = b;
                        }
                    }
                }

                if (shortArray) {
                    results.push(shortArray);
                } else if (byteArray) {
                    results.push(byteArray);
                } else {
                    results.push(dataFace);
                }
            }

            return results;
        };

        if (engine._features.allowTexturePrefiltering && (this._prefilterOnLoad || this._prefilterIrradianceOnLoad)) {
            const previousOnLoad = this._onLoad;
            const hdrFiltering = new HDRFiltering(engine);
            this._onLoad = () => {
                let irradiancePromise: Promise<Nullable<BaseTexture>> = Promise.resolve(null);
                let radiancePromise: Promise<void> = Promise.resolve();
                if (this._prefilterIrradianceOnLoad) {
                    const hdrIrradianceFiltering = new HDRIrradianceFiltering(engine, { useCdf: this._prefilterUsingCdf });
                    irradiancePromise = hdrIrradianceFiltering.prefilter(this);
                }
                if (this._prefilterOnLoad) {
                    radiancePromise = hdrFiltering.prefilter(this);
                }
                // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
                Promise.all([irradiancePromise, radiancePromise]).then((results) => {
                    const irradianceTexture = results[0];
                    if (this._prefilterIrradianceOnLoad && irradianceTexture) {
                        this.irradianceTexture = irradianceTexture;
                        const scene = this.getScene();
                        if (scene) {
                            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
                        }
                    }
                    if (previousOnLoad) {
                        previousOnLoad();
                    }
                });
            };
        }

        this._texture = engine.createRawCubeTextureFromUrl(
            this.url,
            this.getScene(),
            this._size,
            Constants.TEXTUREFORMAT_RGB,
            textureType,
            this._noMipmap,
            callback,
            null,
            this._onLoad,
            this._onError
        );
    }

    // Methods
    public override delayLoad(): void {
        if (this.delayLoadState !== Constants.DELAYLOADSTATE_NOTLOADED) {
            return;
        }

        this.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
        this._texture = this._getFromCache(this.url, this._noMipmap);

        if (!this._texture) {
            this._loadTexture();
        }
    }

    /**
     * Get the texture reflection matrix used to rotate/transform the reflection.
     * @returns the reflection matrix
     */
    public override getReflectionTextureMatrix(): Matrix {
        return this._textureMatrix;
    }

    /**
     * Set the texture reflection matrix used to rotate/transform the reflection.
     * @param value Define the reflection matrix to set
     */
    public setReflectionTextureMatrix(value: Matrix): void {
        this._textureMatrix = value;

        if (value.updateFlag === this._textureMatrix.updateFlag) {
            return;
        }

        if (value.isIdentity() !== this._textureMatrix.isIdentity()) {
            this.getScene()?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => mat.getActiveTextures().indexOf(this) !== -1);
        }
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public override dispose(): void {
        this.onLoadObservable.clear();
        super.dispose();
    }

    /**
     * Serializes the texture to a JSON representation.
     * @returns the JSON representation
     */
    public override serialize(): any {
        if (!this.name) {
            return null;
        }

        const serializationObject: any = {};
        serializationObject.name = this.name;
        serializationObject.hasAlpha = this.hasAlpha;
        serializationObject.isCube = true;
        serializationObject.level = this.level;
        serializationObject.size = this._size;
        serializationObject.coordinatesMode = this.coordinatesMode;
        serializationObject.useInGammaSpace = this.gammaSpace;
        serializationObject.generateHarmonics = this._generateHarmonics;
        serializationObject.noMipmap = this._noMipmap;
        serializationObject.isBlocking = this._isBlocking;
        serializationObject.rotationY = this._rotationY;

        return serializationObject;
    }

    protected abstract _instantiateClone(): this;

    /**
     * Clones the current texture.
     * @returns the cloned texture
     */
    public override clone(): this {
        const newTexture = this._instantiateClone();

        // Base Texture
        newTexture.level = this.level;
        newTexture.wrapU = this.wrapU;
        newTexture.wrapV = this.wrapV;
        newTexture.coordinatesIndex = this.coordinatesIndex;
        newTexture.coordinatesMode = this.coordinatesMode;

        return newTexture;
    }

    protected static _Parse(parsedTexture: any, texture: EnvCubeTexture): void {
        texture.name = parsedTexture.name;
        texture.hasAlpha = parsedTexture.hasAlpha;
        texture.level = parsedTexture.level;
        texture.coordinatesMode = parsedTexture.coordinatesMode;
        texture.isBlocking = parsedTexture.isBlocking;
        if (parsedTexture.boundingBoxPosition) {
            texture.boundingBoxPosition = Vector3.FromArray(parsedTexture.boundingBoxPosition);
        }
        if (parsedTexture.boundingBoxSize) {
            texture.boundingBoxSize = Vector3.FromArray(parsedTexture.boundingBoxSize);
        }
        if (parsedTexture.rotationY) {
            texture.rotationY = parsedTexture.rotationY;
        }
    }
}
