import { serialize, SerializationHelper, serializeAsTexture } from "../../Misc/decorators";
import type { Observer } from "../../Misc/observable";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Matrix } from "../../Maths/math.vector";
import { EngineStore } from "../../Engines/engineStore";
import type { InternalTexture } from "../../Materials/Textures/internalTexture";
import { Constants } from "../../Engines/constants";
import type { IAnimatable } from "../../Animations/animatable.interface";
import { RandomGUID } from "../../Misc/guid";

import "../../Misc/fileTools";
import type { ThinEngine } from "../../Engines/thinEngine";
import { ThinTexture } from "./thinTexture";
import type { AbstractScene } from "../../abstractScene";

import type { Animation } from "../../Animations/animation";

/**
 * Base class of all the textures in babylon.
 * It groups all the common properties the materials, post process, lights... might need
 * in order to make a correct use of the texture.
 */
export class BaseTexture extends ThinTexture implements IAnimatable {
    /**
     * Default anisotropic filtering level for the application.
     * It is set to 4 as a good tradeoff between perf and quality.
     */
    public static DEFAULT_ANISOTROPIC_FILTERING_LEVEL = 4;

    /**
     * Gets or sets the unique id of the texture
     */
    @serialize()
    public uniqueId: number;

    /**
     * Define the name of the texture.
     */
    @serialize()
    public name: string;

    /**
     * Gets or sets an object used to store user defined information.
     */
    @serialize()
    public metadata: any = null;

    /** @internal */
    public _internalMetadata: any;

    /**
     * For internal use only. Please do not use.
     */
    public reservedDataStore: any = null;

    @serialize("hasAlpha")
    private _hasAlpha = false;
    /**
     * Define if the texture is having a usable alpha value (can be use for transparency or glossiness for instance).
     */
    public set hasAlpha(value: boolean) {
        if (this._hasAlpha === value) {
            return;
        }
        this._hasAlpha = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    public get hasAlpha(): boolean {
        return this._hasAlpha;
    }

    @serialize("getAlphaFromRGB")
    private _getAlphaFromRGB = false;
    /**
     * Defines if the alpha value should be determined via the rgb values.
     * If true the luminance of the pixel might be used to find the corresponding alpha value.
     */
    public set getAlphaFromRGB(value: boolean) {
        if (this._getAlphaFromRGB === value) {
            return;
        }
        this._getAlphaFromRGB = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    public get getAlphaFromRGB(): boolean {
        return this._getAlphaFromRGB;
    }

    /**
     * Intensity or strength of the texture.
     * It is commonly used by materials to fine tune the intensity of the texture
     */
    @serialize()
    public level = 1;

    @serialize("coordinatesIndex")
    protected _coordinatesIndex = 0;

    /**
     * Gets or sets a boolean indicating that the texture should try to reduce shader code if there is no UV manipulation.
     * (ie. when texture.getTextureMatrix().isIdentityAs3x2() returns true)
     */
    @serialize()
    public optimizeUVAllocation = true;

    /**
     * Define the UV channel to use starting from 0 and defaulting to 0.
     * This is part of the texture as textures usually maps to one uv set.
     */
    public set coordinatesIndex(value: number) {
        if (this._coordinatesIndex === value) {
            return;
        }
        this._coordinatesIndex = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    public get coordinatesIndex(): number {
        return this._coordinatesIndex;
    }

    @serialize("coordinatesMode")
    protected _coordinatesMode = Constants.TEXTURE_EXPLICIT_MODE;

    /**
     * How a texture is mapped.
     *
     * | Value | Type                                | Description |
     * | ----- | ----------------------------------- | ----------- |
     * | 0     | EXPLICIT_MODE                       |             |
     * | 1     | SPHERICAL_MODE                      |             |
     * | 2     | PLANAR_MODE                         |             |
     * | 3     | CUBIC_MODE                          |             |
     * | 4     | PROJECTION_MODE                     |             |
     * | 5     | SKYBOX_MODE                         |             |
     * | 6     | INVCUBIC_MODE                       |             |
     * | 7     | EQUIRECTANGULAR_MODE                |             |
     * | 8     | FIXED_EQUIRECTANGULAR_MODE          |             |
     * | 9     | FIXED_EQUIRECTANGULAR_MIRRORED_MODE |             |
     */
    public set coordinatesMode(value: number) {
        if (this._coordinatesMode === value) {
            return;
        }
        this._coordinatesMode = value;
        if (this._scene) {
            this._scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }
    }
    public get coordinatesMode(): number {
        return this._coordinatesMode;
    }

    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    @serialize()
    public get wrapU() {
        return this._wrapU;
    }
    public set wrapU(value: number) {
        this._wrapU = value;
    }

    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    @serialize()
    public get wrapV() {
        return this._wrapV;
    }
    public set wrapV(value: number) {
        this._wrapV = value;
    }

    /**
     * | Value | Type               | Description |
     * | ----- | ------------------ | ----------- |
     * | 0     | CLAMP_ADDRESSMODE  |             |
     * | 1     | WRAP_ADDRESSMODE   |             |
     * | 2     | MIRROR_ADDRESSMODE |             |
     */
    @serialize()
    public wrapR = Constants.TEXTURE_WRAP_ADDRESSMODE;

    /**
     * With compliant hardware and browser (supporting anisotropic filtering)
     * this defines the level of anisotropic filtering in the texture.
     * The higher the better but the slower. This defaults to 4 as it seems to be the best tradeoff.
     */
    @serialize()
    public anisotropicFilteringLevel = BaseTexture.DEFAULT_ANISOTROPIC_FILTERING_LEVEL;

    /** @internal */
    public _isCube = false;
    /**
     * Define if the texture is a cube texture or if false a 2d texture.
     */
    @serialize()
    public get isCube(): boolean {
        if (!this._texture) {
            return this._isCube;
        }

        return this._texture.isCube;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected set isCube(value: boolean) {
        if (!this._texture) {
            this._isCube = value;
        } else {
            this._texture.isCube = value;
        }
    }

    /**
     * Define if the texture is a 3d texture (webgl 2) or if false a 2d texture.
     */
    @serialize()
    public get is3D(): boolean {
        if (!this._texture) {
            return false;
        }

        return this._texture.is3D;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected set is3D(value: boolean) {
        if (!this._texture) {
            return;
        }

        this._texture.is3D = value;
    }

    /**
     * Define if the texture is a 2d array texture (webgl 2) or if false a 2d texture.
     */
    @serialize()
    public get is2DArray(): boolean {
        if (!this._texture) {
            return false;
        }

        return this._texture.is2DArray;
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    protected set is2DArray(value: boolean) {
        if (!this._texture) {
            return;
        }

        this._texture.is2DArray = value;
    }

    /** @internal */
    protected _gammaSpace = true;
    /**
     * Define if the texture contains data in gamma space (most of the png/jpg aside bump).
     * HDR texture are usually stored in linear space.
     * This only impacts the PBR and Background materials
     */
    @serialize()
    public get gammaSpace(): boolean {
        if (!this._texture) {
            return this._gammaSpace;
        } else {
            if (this._texture._gammaSpace === null) {
                this._texture._gammaSpace = this._gammaSpace;
            }
        }

        return this._texture._gammaSpace && !this._texture._useSRGBBuffer;
    }

    public set gammaSpace(gamma: boolean) {
        if (!this._texture) {
            if (this._gammaSpace === gamma) {
                return;
            }

            this._gammaSpace = gamma;
        } else {
            if (this._texture._gammaSpace === gamma) {
                return;
            }
            this._texture._gammaSpace = gamma;
        }

        this.getScene()?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
            return mat.hasTexture(this);
        });
    }

    /**
     * Gets or sets whether or not the texture contains RGBD data.
     */
    public get isRGBD(): boolean {
        return this._texture != null && this._texture._isRGBD;
    }
    public set isRGBD(value: boolean) {
        if (value === this.isRGBD) {
            return;
        }

        if (this._texture) {
            this._texture._isRGBD = value;
        }

        this.getScene()?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
            return mat.hasTexture(this);
        });
    }

    /**
     * Is Z inverted in the texture (useful in a cube texture).
     */
    @serialize()
    public invertZ = false;

    /**
     * Are mip maps generated for this texture or not.
     */
    public get noMipmap(): boolean {
        return false;
    }

    /**
     * @internal
     */
    @serialize()
    public lodLevelInAlpha = false;

    /**
     * With prefiltered texture, defined the offset used during the prefiltering steps.
     */
    @serialize()
    public get lodGenerationOffset(): number {
        if (this._texture) {
            return this._texture._lodGenerationOffset;
        }

        return 0.0;
    }
    public set lodGenerationOffset(value: number) {
        if (this._texture) {
            this._texture._lodGenerationOffset = value;
        }
    }

    /**
     * With prefiltered texture, defined the scale used during the prefiltering steps.
     */
    @serialize()
    public get lodGenerationScale(): number {
        if (this._texture) {
            return this._texture._lodGenerationScale;
        }

        return 0.0;
    }
    public set lodGenerationScale(value: number) {
        if (this._texture) {
            this._texture._lodGenerationScale = value;
        }
    }

    /**
     * With prefiltered texture, defined if the specular generation is based on a linear ramp.
     * By default we are using a log2 of the linear roughness helping to keep a better resolution for
     * average roughness values.
     */
    @serialize()
    public get linearSpecularLOD(): boolean {
        if (this._texture) {
            return this._texture._linearSpecularLOD;
        }

        return false;
    }
    public set linearSpecularLOD(value: boolean) {
        if (this._texture) {
            this._texture._linearSpecularLOD = value;
        }
    }

    /**
     * In case a better definition than spherical harmonics is required for the diffuse part of the environment.
     * You can set the irradiance texture to rely on a texture instead of the spherical approach.
     * This texture need to have the same characteristics than its parent (Cube vs 2d, coordinates mode, Gamma/Linear, RGBD).
     */
    @serializeAsTexture()
    public get irradianceTexture(): Nullable<BaseTexture> {
        if (this._texture) {
            return this._texture._irradianceTexture;
        }

        return null;
    }
    public set irradianceTexture(value: Nullable<BaseTexture>) {
        if (this._texture) {
            this._texture._irradianceTexture = value;
        }
    }

    /**
     * Define if the texture is a render target.
     */
    @serialize()
    public isRenderTarget = false;

    /**
     * Define the unique id of the texture in the scene.
     */
    public get uid(): string {
        if (!this._uid) {
            this._uid = RandomGUID();
        }
        return this._uid;
    }

    /** @internal */
    public _prefiltered: boolean = false;
    /** @internal */
    public _forceSerialize: boolean = false;

    /**
     * Return a string representation of the texture.
     * @returns the texture as a string
     */
    public toString(): string {
        return this.name;
    }

    /**
     * Get the class name of the texture.
     * @returns "BaseTexture"
     */
    public getClassName(): string {
        return "BaseTexture";
    }

    /**
     * Define the list of animation attached to the texture.
     */
    public animations: Animation[] = [];

    /**
     * An event triggered when the texture is disposed.
     */
    public onDisposeObservable = new Observable<BaseTexture>();

    private _onDisposeObserver: Nullable<Observer<BaseTexture>> = null;
    /**
     * Callback triggered when the texture has been disposed.
     * Kept for back compatibility, you can use the onDisposeObservable instead.
     */
    public set onDispose(callback: () => void) {
        if (this._onDisposeObserver) {
            this.onDisposeObservable.remove(this._onDisposeObserver);
        }
        this._onDisposeObserver = this.onDisposeObservable.add(callback);
    }

    protected _scene: Nullable<Scene> = null;

    /** @internal */
    private _uid: Nullable<string> = null;

    /**
     * Define if the texture is preventing a material to render or not.
     * If not and the texture is not ready, the engine will use a default black texture instead.
     */
    public get isBlocking(): boolean {
        return true;
    }

    /** @internal */
    public _parentContainer: Nullable<AbstractScene> = null;

    protected _loadingError: boolean = false;
    protected _errorObject?: {
        message?: string;
        exception?: any;
    };

    /**
     * Was there any loading error?
     */
    public get loadingError(): boolean {
        return this._loadingError;
    }

    /**
     * If a loading error occurred this object will be populated with information about the error.
     */
    public get errorObject():
        | {
              message?: string;
              exception?: any;
          }
        | undefined {
        return this._errorObject;
    }

    /**
     * Instantiates a new BaseTexture.
     * Base class of all the textures in babylon.
     * It groups all the common properties the materials, post process, lights... might need
     * in order to make a correct use of the texture.
     * @param sceneOrEngine Define the scene or engine the texture belongs to
     * @param internalTexture Define the internal texture associated with the texture
     */
    constructor(sceneOrEngine?: Nullable<Scene | ThinEngine>, internalTexture: Nullable<InternalTexture> = null) {
        super(null);

        if (sceneOrEngine) {
            if (BaseTexture._IsScene(sceneOrEngine)) {
                this._scene = sceneOrEngine;
            } else {
                this._engine = sceneOrEngine;
            }
        } else {
            this._scene = EngineStore.LastCreatedScene;
        }

        if (this._scene) {
            this.uniqueId = this._scene.getUniqueId();
            this._scene.addTexture(this);
            this._engine = this._scene.getEngine();
        }

        this._texture = internalTexture;

        this._uid = null;
    }

    /**
     * Get the scene the texture belongs to.
     * @returns the scene or null if undefined
     */
    public getScene(): Nullable<Scene> {
        return this._scene;
    }

    /** @internal */
    protected _getEngine(): Nullable<ThinEngine> {
        return this._engine;
    }

    /**
     * Checks if the texture has the same transform matrix than another texture
     * @param texture texture to check against
     * @returns true if the transforms are the same, else false
     */
    public checkTransformsAreIdentical(texture: Nullable<BaseTexture>): boolean {
        return texture !== null;
    }

    /**
     * Get the texture transform matrix used to offset tile the texture for instance.
     * @returns the transformation matrix
     */
    public getTextureMatrix(): Matrix {
        return <Matrix>Matrix.IdentityReadOnly;
    }

    /**
     * Get the texture reflection matrix used to rotate/transform the reflection.
     * @returns the reflection matrix
     */
    public getReflectionTextureMatrix(): Matrix {
        return <Matrix>Matrix.IdentityReadOnly;
    }

    /**
     * Gets a suitable rotate/transform matrix when the texture is used for refraction.
     * There's a separate function from getReflectionTextureMatrix because refraction requires a special configuration of the matrix in right-handed mode.
     * @returns The refraction matrix
     */
    public getRefractionTextureMatrix(): Matrix {
        return this.getReflectionTextureMatrix();
    }

    /**
     * Get if the texture is ready to be consumed (either it is ready or it is not blocking)
     * @returns true if ready, not blocking or if there was an error loading the texture
     */
    public isReadyOrNotBlocking(): boolean {
        return !this.isBlocking || this.isReady() || this.loadingError;
    }

    /**
     * Scales the texture if is `canRescale()`
     * @param ratio the resize factor we want to use to rescale
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public scale(ratio: number): void {}

    /**
     * Get if the texture can rescale.
     */
    public get canRescale(): boolean {
        return false;
    }

    /**
     * @internal
     */
    public _getFromCache(url: Nullable<string>, noMipmap: boolean, sampling?: number, invertY?: boolean, useSRGBBuffer?: boolean, isCube?: boolean): Nullable<InternalTexture> {
        const engine = this._getEngine();
        if (!engine) {
            return null;
        }

        const correctedUseSRGBBuffer = engine._getUseSRGBBuffer(!!useSRGBBuffer, noMipmap);

        const texturesCache = engine.getLoadedTexturesCache();
        for (let index = 0; index < texturesCache.length; index++) {
            const texturesCacheEntry = texturesCache[index];

            if (useSRGBBuffer === undefined || correctedUseSRGBBuffer === texturesCacheEntry._useSRGBBuffer) {
                if (invertY === undefined || invertY === texturesCacheEntry.invertY) {
                    if (texturesCacheEntry.url === url && texturesCacheEntry.generateMipMaps === !noMipmap) {
                        if (!sampling || sampling === texturesCacheEntry.samplingMode) {
                            if (isCube === undefined || isCube === texturesCacheEntry.isCube) {
                                texturesCacheEntry.incrementReferences();
                                return texturesCacheEntry;
                            }
                        }
                    }
                }
            }
        }

        return null;
    }

    /** @internal */
    public _rebuild(_fromContextLost = false): void {}

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public clone(): Nullable<BaseTexture> {
        return null;
    }

    /**
     * Get the texture underlying type (INT, FLOAT...)
     */
    public get textureType(): number {
        if (!this._texture) {
            return Constants.TEXTURETYPE_UNSIGNED_INT;
        }

        return this._texture.type !== undefined ? this._texture.type : Constants.TEXTURETYPE_UNSIGNED_INT;
    }

    /**
     * Get the texture underlying format (RGB, RGBA...)
     */
    public get textureFormat(): number {
        if (!this._texture) {
            return Constants.TEXTUREFORMAT_RGBA;
        }

        return this._texture.format !== undefined ? this._texture.format : Constants.TEXTUREFORMAT_RGBA;
    }

    /**
     * Indicates that textures need to be re-calculated for all materials
     */
    protected _markAllSubMeshesAsTexturesDirty() {
        const scene = this.getScene();

        if (!scene) {
            return;
        }

        scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
    }

    /**
     * Reads the pixels stored in the webgl texture and returns them as an ArrayBuffer.
     * This will returns an RGBA array buffer containing either in values (0-255) or
     * float values (0-1) depending of the underlying buffer type.
     * @param faceIndex defines the face of the texture to read (in case of cube texture)
     * @param level defines the LOD level of the texture to read (in case of Mip Maps)
     * @param buffer defines a user defined buffer to fill with data (can be null)
     * @param flushRenderer true to flush the renderer from the pending commands before reading the pixels
     * @param noDataConversion false to convert the data to Uint8Array (if texture type is UNSIGNED_BYTE) or to Float32Array (if texture type is anything but UNSIGNED_BYTE). If true, the type of the generated buffer (if buffer==null) will depend on the type of the texture
     * @param x defines the region x coordinates to start reading from (default to 0)
     * @param y defines the region y coordinates to start reading from (default to 0)
     * @param width defines the region width to read from (default to the texture size at level)
     * @param height defines the region width to read from (default to the texture size at level)
     * @returns The Array buffer promise containing the pixels data.
     */
    public readPixels(
        faceIndex = 0,
        level = 0,
        buffer: Nullable<ArrayBufferView> = null,
        flushRenderer = true,
        noDataConversion = false,
        x = 0,
        y = 0,
        width = Number.MAX_VALUE,
        height = Number.MAX_VALUE
    ): Nullable<Promise<ArrayBufferView>> {
        if (!this._texture) {
            return null;
        }

        const engine = this._getEngine();
        if (!engine) {
            return null;
        }

        const size = this.getSize();
        let maxWidth = size.width;
        let maxHeight = size.height;
        if (level !== 0) {
            maxWidth = maxWidth / Math.pow(2, level);
            maxHeight = maxHeight / Math.pow(2, level);
            maxWidth = Math.round(maxWidth);
            maxHeight = Math.round(maxHeight);
        }

        width = Math.min(maxWidth, width);
        height = Math.min(maxHeight, height);

        try {
            if (this._texture.isCube) {
                return engine._readTexturePixels(this._texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion, x, y);
            }

            return engine._readTexturePixels(this._texture, width, height, -1, level, buffer, flushRenderer, noDataConversion, x, y);
        } catch (e) {
            return null;
        }
    }

    /**
     * @internal
     */
    public _readPixelsSync(faceIndex = 0, level = 0, buffer: Nullable<ArrayBufferView> = null, flushRenderer = true, noDataConversion = false): Nullable<ArrayBufferView> {
        if (!this._texture) {
            return null;
        }

        const size = this.getSize();
        let width = size.width;
        let height = size.height;

        const engine = this._getEngine();
        if (!engine) {
            return null;
        }

        if (level != 0) {
            width = width / Math.pow(2, level);
            height = height / Math.pow(2, level);

            width = Math.round(width);
            height = Math.round(height);
        }

        try {
            if (this._texture.isCube) {
                return engine._readTexturePixelsSync(this._texture, width, height, faceIndex, level, buffer, flushRenderer, noDataConversion);
            }

            return engine._readTexturePixelsSync(this._texture, width, height, -1, level, buffer, flushRenderer, noDataConversion);
        } catch (e) {
            return null;
        }
    }

    /** @internal */
    public get _lodTextureHigh(): Nullable<BaseTexture> {
        if (this._texture) {
            return this._texture._lodTextureHigh;
        }
        return null;
    }

    /** @internal */
    public get _lodTextureMid(): Nullable<BaseTexture> {
        if (this._texture) {
            return this._texture._lodTextureMid;
        }
        return null;
    }

    /** @internal */
    public get _lodTextureLow(): Nullable<BaseTexture> {
        if (this._texture) {
            return this._texture._lodTextureLow;
        }
        return null;
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        if (this._scene) {
            // Animations
            if (this._scene.stopAnimation) {
                this._scene.stopAnimation(this);
            }

            // Remove from scene
            this._scene.removePendingData(this);
            const index = this._scene.textures.indexOf(this);

            if (index >= 0) {
                this._scene.textures.splice(index, 1);
            }
            this._scene.onTextureRemovedObservable.notifyObservers(this);
            this._scene = null;

            if (this._parentContainer) {
                const index = this._parentContainer.textures.indexOf(this);
                if (index > -1) {
                    this._parentContainer.textures.splice(index, 1);
                }
                this._parentContainer = null;
            }
        }

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();

        this.metadata = null;

        super.dispose();
    }

    /**
     * Serialize the texture into a JSON representation that can be parsed later on.
     * @param allowEmptyName True to force serialization even if name is empty. Default: false
     * @returns the JSON representation of the texture
     */
    public serialize(allowEmptyName = false): any {
        if (!this.name && !allowEmptyName) {
            return null;
        }

        const serializationObject = SerializationHelper.Serialize(this);

        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);

        return serializationObject;
    }

    /**
     * Helper function to be called back once a list of texture contains only ready textures.
     * @param textures Define the list of textures to wait for
     * @param callback Define the callback triggered once the entire list will be ready
     */
    public static WhenAllReady(textures: BaseTexture[], callback: () => void): void {
        let numRemaining = textures.length;
        if (numRemaining === 0) {
            callback();
            return;
        }

        for (let i = 0; i < textures.length; i++) {
            const texture = textures[i];

            if (texture.isReady()) {
                if (--numRemaining === 0) {
                    callback();
                }
            } else {
                const onLoadObservable = (texture as any).onLoadObservable as Observable<BaseTexture>;

                if (onLoadObservable) {
                    onLoadObservable.addOnce(() => {
                        if (--numRemaining === 0) {
                            callback();
                        }
                    });
                } else {
                    if (--numRemaining === 0) {
                        callback();
                    }
                }
            }
        }
    }

    private static _IsScene(sceneOrEngine: Scene | ThinEngine): sceneOrEngine is Scene {
        return sceneOrEngine.getClassName() === "Scene";
    }
}
