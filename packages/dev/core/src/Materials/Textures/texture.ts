import { serialize, SerializationHelper } from "../../Misc/decorators";
import { Observable } from "../../Misc/observable";
import type { Nullable } from "../../types";
import { Matrix, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Constants } from "../../Engines/constants";
import { GetClass, RegisterClass } from "../../Misc/typeStore";
import { _WarnImport } from "../../Misc/devTools";
import type { IInspectable } from "../../Misc/iInspectable";
import type { ThinEngine } from "../../Engines/thinEngine";
import { TimingTools } from "../../Misc/timingTools";
import { InstantiationTools } from "../../Misc/instantiationTools";
import { Plane } from "../../Maths/math.plane";
import { EncodeArrayBufferToBase64 } from "../../Misc/stringTools";
import { GenerateBase64StringFromTexture, GenerateBase64StringFromTextureAsync } from "../../Misc/copyTools";
import { CompatibilityOptions } from "../../Compat/compatibilityOptions";
import type { InternalTexture } from "./internalTexture";

import type { CubeTexture } from "../../Materials/Textures/cubeTexture";
import type { MirrorTexture } from "../../Materials/Textures/mirrorTexture";
import type { RenderTargetTexture } from "../../Materials/Textures/renderTargetTexture";
import type { Scene } from "../../scene";
import type { VideoTexture, VideoTextureSettings } from "./videoTexture";

/**
 * Defines the available options when creating a texture
 */
export interface ITextureCreationOptions {
    /** Defines if the texture will require mip maps or not (default: false) */
    noMipmap?: boolean;

    /** Defines if the texture needs to be inverted on the y axis during loading (default: true) */
    invertY?: boolean;

    /** Defines the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...) (default: Texture.TRILINEAR_SAMPLINGMODE) */
    samplingMode?: number;

    /** Defines a callback triggered when the texture has been loaded (default: null) */
    onLoad?: Nullable<() => void>;

    /** Defines a callback triggered when an error occurred during the loading session (default: null) */
    onError?: Nullable<(message?: string, exception?: any) => void>;

    /** Defines the buffer to load the texture from in case the texture is loaded from a buffer representation (default: null) */
    buffer?: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap>;

    /** Defines if the buffer we are loading the texture from should be deleted after load (default: false) */
    deleteBuffer?: boolean;

    /** Defines the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...) (default: ) */
    format?: number;

    /** Defines an optional mime type information (default: undefined) */
    mimeType?: string;

    /** Options to be passed to the loader (default: undefined) */
    loaderOptions?: any;

    /** Specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg) (default: undefined) */
    creationFlags?: number;

    /** Defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU) (default: false) */
    useSRGBBuffer?: boolean;

    /** Defines the underlying texture from an already existing one */
    internalTexture?: InternalTexture;

    /** Defines the underlying texture texture space */
    gammaSpace?: boolean;
}

/**
 * This represents a texture in babylon. It can be easily loaded from a network, base64 or html input.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#texture
 */
export class Texture extends BaseTexture {
    /**
     * Gets or sets a general boolean used to indicate that textures containing direct data (buffers) must be saved as part of the serialization process
     */
    public static SerializeBuffers = true;

    /**
     * Gets or sets a general boolean used to indicate that texture buffers must be saved as part of the serialization process.
     * If no buffer exists, one will be created as base64 string from the internal webgl data.
     */
    public static ForceSerializeBuffers = false;

    /**
     * This observable will notify when any texture had a loading error
     */
    public static OnTextureLoadErrorObservable = new Observable<BaseTexture>();

    /** @internal */
    public static _SerializeInternalTextureUniqueId = false;

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static _CubeTextureParser = (jsonTexture: any, scene: Scene, rootUrl: string): CubeTexture => {
        throw _WarnImport("CubeTexture");
    };
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static _CreateMirror = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean): MirrorTexture => {
        throw _WarnImport("MirrorTexture");
    };
    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public static _CreateRenderTargetTexture = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean, creationFlags?: number): RenderTargetTexture => {
        throw _WarnImport("RenderTargetTexture");
    };

    /**
     * @internal
     */
    public static _CreateVideoTexture(
        name: Nullable<string>,
        src: string | string[] | HTMLVideoElement,
        scene: Nullable<Scene>,
        generateMipMaps = false,
        invertY = false,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        settings: Partial<VideoTextureSettings> = {},
        onError?: Nullable<(message?: string, exception?: any) => void>,
        format: number = Constants.TEXTUREFORMAT_RGBA
    ): VideoTexture {
        throw _WarnImport("VideoTexture");
    }

    /** nearest is mag = nearest and min = nearest and no mip */
    public static readonly NEAREST_SAMPLINGMODE = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly NEAREST_NEAREST_MIPLINEAR = Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR; // nearest is mag = nearest and min = nearest and mip = linear

    /** Bilinear is mag = linear and min = linear and no mip */
    public static readonly BILINEAR_SAMPLINGMODE = Constants.TEXTURE_BILINEAR_SAMPLINGMODE;
    /** Bilinear is mag = linear and min = linear and mip = nearest */
    public static readonly LINEAR_LINEAR_MIPNEAREST = Constants.TEXTURE_LINEAR_LINEAR_MIPNEAREST; // Bilinear is mag = linear and min = linear and mip = nearest

    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly TRILINEAR_SAMPLINGMODE = Constants.TEXTURE_TRILINEAR_SAMPLINGMODE;
    /** Trilinear is mag = linear and min = linear and mip = linear */
    public static readonly LINEAR_LINEAR_MIPLINEAR = Constants.TEXTURE_LINEAR_LINEAR_MIPLINEAR; // Trilinear is mag = linear and min = linear and mip = linear

    /** mag = nearest and min = nearest and mip = nearest */
    public static readonly NEAREST_NEAREST_MIPNEAREST = Constants.TEXTURE_NEAREST_NEAREST_MIPNEAREST;
    /** mag = nearest and min = linear and mip = nearest */
    public static readonly NEAREST_LINEAR_MIPNEAREST = Constants.TEXTURE_NEAREST_LINEAR_MIPNEAREST;
    /** mag = nearest and min = linear and mip = linear */
    public static readonly NEAREST_LINEAR_MIPLINEAR = Constants.TEXTURE_NEAREST_LINEAR_MIPLINEAR;
    /** mag = nearest and min = linear and mip = none */
    public static readonly NEAREST_LINEAR = Constants.TEXTURE_NEAREST_LINEAR;
    /** mag = nearest and min = nearest and mip = none */
    public static readonly NEAREST_NEAREST = Constants.TEXTURE_NEAREST_NEAREST;
    /** mag = linear and min = nearest and mip = nearest */
    public static readonly LINEAR_NEAREST_MIPNEAREST = Constants.TEXTURE_LINEAR_NEAREST_MIPNEAREST;
    /** mag = linear and min = nearest and mip = linear */
    public static readonly LINEAR_NEAREST_MIPLINEAR = Constants.TEXTURE_LINEAR_NEAREST_MIPLINEAR;
    /** mag = linear and min = linear and mip = none */
    public static readonly LINEAR_LINEAR = Constants.TEXTURE_LINEAR_LINEAR;
    /** mag = linear and min = nearest and mip = none */
    public static readonly LINEAR_NEAREST = Constants.TEXTURE_LINEAR_NEAREST;

    /** Explicit coordinates mode */
    public static readonly EXPLICIT_MODE = Constants.TEXTURE_EXPLICIT_MODE;
    /** Spherical coordinates mode */
    public static readonly SPHERICAL_MODE = Constants.TEXTURE_SPHERICAL_MODE;
    /** Planar coordinates mode */
    public static readonly PLANAR_MODE = Constants.TEXTURE_PLANAR_MODE;
    /** Cubic coordinates mode */
    public static readonly CUBIC_MODE = Constants.TEXTURE_CUBIC_MODE;
    /** Projection coordinates mode */
    public static readonly PROJECTION_MODE = Constants.TEXTURE_PROJECTION_MODE;
    /** Inverse Cubic coordinates mode */
    public static readonly SKYBOX_MODE = Constants.TEXTURE_SKYBOX_MODE;
    /** Inverse Cubic coordinates mode */
    public static readonly INVCUBIC_MODE = Constants.TEXTURE_INVCUBIC_MODE;
    /** Equirectangular coordinates mode */
    public static readonly EQUIRECTANGULAR_MODE = Constants.TEXTURE_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed coordinates mode */
    public static readonly FIXED_EQUIRECTANGULAR_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MODE;
    /** Equirectangular Fixed Mirrored coordinates mode */
    public static readonly FIXED_EQUIRECTANGULAR_MIRRORED_MODE = Constants.TEXTURE_FIXED_EQUIRECTANGULAR_MIRRORED_MODE;

    /** Texture is not repeating outside of 0..1 UVs */
    public static readonly CLAMP_ADDRESSMODE = Constants.TEXTURE_CLAMP_ADDRESSMODE;
    /** Texture is repeating outside of 0..1 UVs */
    public static readonly WRAP_ADDRESSMODE = Constants.TEXTURE_WRAP_ADDRESSMODE;
    /** Texture is repeating and mirrored */
    public static readonly MIRROR_ADDRESSMODE = Constants.TEXTURE_MIRROR_ADDRESSMODE;

    /**
     * Gets or sets a boolean which defines if the texture url must be build from the serialized URL instead of just using the name and loading them side by side with the scene file
     */
    public static UseSerializedUrlIfAny = false;

    /**
     * Define the url of the texture.
     */
    @serialize()
    public url: Nullable<string> = null;

    /**
     * Define an offset on the texture to offset the u coordinates of the UVs
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials#offsetting
     */
    @serialize()
    public uOffset = 0;

    /**
     * Define an offset on the texture to offset the v coordinates of the UVs
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials#offsetting
     */
    @serialize()
    public vOffset = 0;

    /**
     * Define an offset on the texture to scale the u coordinates of the UVs
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials#tiling
     */
    @serialize()
    public uScale = 1.0;

    /**
     * Define an offset on the texture to scale the v coordinates of the UVs
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials#tiling
     */
    @serialize()
    public vScale = 1.0;

    /**
     * Define an offset on the texture to rotate around the u coordinates of the UVs
     * The angle is defined in radians.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials
     */
    @serialize()
    public uAng = 0;

    /**
     * Define an offset on the texture to rotate around the v coordinates of the UVs
     * The angle is defined in radians.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials
     */
    @serialize()
    public vAng = 0;

    /**
     * Define an offset on the texture to rotate around the w coordinates of the UVs (in case of 3d texture)
     * The angle is defined in radians.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/moreMaterials
     */
    @serialize()
    public wAng = 0;

    /**
     * Defines the center of rotation (U)
     */
    @serialize()
    public uRotationCenter = 0.5;

    /**
     * Defines the center of rotation (V)
     */
    @serialize()
    public vRotationCenter = 0.5;

    /**
     * Defines the center of rotation (W)
     */
    @serialize()
    public wRotationCenter = 0.5;

    /**
     * Sets this property to true to avoid deformations when rotating the texture with non-uniform scaling
     */
    @serialize()
    public homogeneousRotationInUVTransform = false;

    /**
     * Are mip maps generated for this texture or not.
     */
    get noMipmap(): boolean {
        return this._noMipmap;
    }

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/toolsAndResources/inspector#extensibility
     */
    public inspectableCustomProperties: Nullable<IInspectable[]> = null;

    /** @internal */
    public _noMipmap: boolean = false;
    /** @internal */
    public _invertY: boolean = false;
    private _rowGenerationMatrix: Nullable<Matrix> = null;
    private _cachedTextureMatrix: Nullable<Matrix> = null;
    private _projectionModeMatrix: Nullable<Matrix> = null;
    private _t0: Nullable<Vector3> = null;
    private _t1: Nullable<Vector3> = null;
    private _t2: Nullable<Vector3> = null;

    private _cachedUOffset: number = -1;
    private _cachedVOffset: number = -1;
    private _cachedUScale: number = 0;
    private _cachedVScale: number = 0;
    private _cachedUAng: number = -1;
    private _cachedVAng: number = -1;
    private _cachedWAng: number = -1;
    private _cachedReflectionProjectionMatrixId: number = -1;
    private _cachedURotationCenter: number = -1;
    private _cachedVRotationCenter: number = -1;
    private _cachedWRotationCenter: number = -1;
    private _cachedHomogeneousRotationInUVTransform: boolean = false;

    private _cachedReflectionTextureMatrix: Nullable<Matrix> = null;
    private _cachedReflectionUOffset = -1;
    private _cachedReflectionVOffset = -1;
    private _cachedReflectionUScale = 0;
    private _cachedReflectionVScale = 0;
    private _cachedReflectionCoordinatesMode = -1;

    /** @internal */
    public _buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null;
    private _deleteBuffer: boolean = false;
    protected _format: Nullable<number> = null;
    private _delayedOnLoad: Nullable<() => void> = null;
    private _delayedOnError: Nullable<() => void> = null;
    private _mimeType?: string;
    private _loaderOptions?: any;
    private _creationFlags?: number;
    /** @internal */
    public _useSRGBBuffer?: boolean;
    private _forcedExtension?: string;

    /** Returns the texture mime type if it was defined by a loader (undefined else) */
    public get mimeType() {
        return this._mimeType;
    }

    /**
     * Observable triggered once the texture has been loaded.
     */
    public onLoadObservable: Observable<Texture> = new Observable<Texture>();

    protected _isBlocking: boolean = true;
    /**
     * Is the texture preventing material to render while loading.
     * If false, a default texture will be used instead of the loading one during the preparation step.
     */
    public set isBlocking(value: boolean) {
        this._isBlocking = value;
    }
    @serialize()
    public get isBlocking(): boolean {
        return this._isBlocking;
    }

    /**
     * Gets a boolean indicating if the texture needs to be inverted on the y axis during loading
     */
    public get invertY(): boolean {
        return this._invertY;
    }

    /**
     * Instantiates a new texture.
     * This represents a texture in babylon. It can be easily loaded from a network, base64 or html input.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/materials_introduction#texture
     * @param url defines the url of the picture to load as a texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param noMipmapOrOptions defines if the texture will require mip maps or not or set of all options to create the texture
     * @param invertY defines if the texture needs to be inverted on the y axis during loading
     * @param samplingMode defines the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...)
     * @param onLoad defines a callback triggered when the texture has been loaded
     * @param onError defines a callback triggered when an error occurred during the loading session
     * @param buffer defines the buffer to load the texture from in case the texture is loaded from a buffer representation
     * @param deleteBuffer defines if the buffer we are loading the texture from should be deleted after load
     * @param format defines the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
     * @param mimeType defines an optional mime type information
     * @param loaderOptions options to be passed to the loader
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @param forcedExtension defines the extension to use to pick the right loader
     */
    constructor(
        url: Nullable<string>,
        sceneOrEngine?: Nullable<Scene | ThinEngine>,
        noMipmapOrOptions?: boolean | ITextureCreationOptions,
        invertY?: boolean,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null,
        deleteBuffer: boolean = false,
        format?: number,
        mimeType?: string,
        loaderOptions?: any,
        creationFlags?: number,
        forcedExtension?: string
    ) {
        super(sceneOrEngine);

        this.name = url || "";
        this.url = url;

        let noMipmap: boolean;
        let useSRGBBuffer: boolean = false;
        let internalTexture: Nullable<InternalTexture> = null;
        let gammaSpace = true;

        if (typeof noMipmapOrOptions === "object" && noMipmapOrOptions !== null) {
            noMipmap = noMipmapOrOptions.noMipmap ?? false;
            invertY = noMipmapOrOptions.invertY ?? (CompatibilityOptions.UseOpenGLOrientationForUV ? false : true);
            samplingMode = noMipmapOrOptions.samplingMode ?? Texture.TRILINEAR_SAMPLINGMODE;
            onLoad = noMipmapOrOptions.onLoad ?? null;
            onError = noMipmapOrOptions.onError ?? null;
            buffer = noMipmapOrOptions.buffer ?? null;
            deleteBuffer = noMipmapOrOptions.deleteBuffer ?? false;
            format = noMipmapOrOptions.format;
            mimeType = noMipmapOrOptions.mimeType;
            loaderOptions = noMipmapOrOptions.loaderOptions;
            creationFlags = noMipmapOrOptions.creationFlags;
            useSRGBBuffer = noMipmapOrOptions.useSRGBBuffer ?? false;
            internalTexture = noMipmapOrOptions.internalTexture ?? null;
            gammaSpace = noMipmapOrOptions.gammaSpace ?? gammaSpace;
        } else {
            noMipmap = !!noMipmapOrOptions;
        }

        this._gammaSpace = gammaSpace;
        this._noMipmap = noMipmap;
        this._invertY = invertY === undefined ? (CompatibilityOptions.UseOpenGLOrientationForUV ? false : true) : invertY;
        this._initialSamplingMode = samplingMode;
        this._buffer = buffer;
        this._deleteBuffer = deleteBuffer;
        this._mimeType = mimeType;
        this._loaderOptions = loaderOptions;
        this._creationFlags = creationFlags;
        this._useSRGBBuffer = useSRGBBuffer;
        this._forcedExtension = forcedExtension;
        if (format) {
            this._format = format;
        }

        const scene = this.getScene();
        const engine = this._getEngine();
        if (!engine) {
            return;
        }

        engine.onBeforeTextureInitObservable.notifyObservers(this);

        const load = () => {
            if (this._texture) {
                if (this._texture._invertVScale) {
                    this.vScale *= -1;
                    this.vOffset += 1;
                }

                // Update texture to match internal texture's wrapping
                if (this._texture._cachedWrapU !== null) {
                    this.wrapU = this._texture._cachedWrapU;
                    this._texture._cachedWrapU = null;
                }
                if (this._texture._cachedWrapV !== null) {
                    this.wrapV = this._texture._cachedWrapV;
                    this._texture._cachedWrapV = null;
                }
                if (this._texture._cachedWrapR !== null) {
                    this.wrapR = this._texture._cachedWrapR;
                    this._texture._cachedWrapR = null;
                }
            }

            if (this.onLoadObservable.hasObservers()) {
                this.onLoadObservable.notifyObservers(this);
            }
            if (onLoad) {
                onLoad();
            }

            if (!this.isBlocking && scene) {
                scene.resetCachedMaterial();
            }
        };

        const errorHandler = (message?: string, exception?: any) => {
            this._loadingError = true;
            this._errorObject = { message, exception };
            if (onError) {
                onError(message, exception);
            }
            Texture.OnTextureLoadErrorObservable.notifyObservers(this);
        };

        if (!this.url && !internalTexture) {
            this._delayedOnLoad = load;
            this._delayedOnError = errorHandler;
            return;
        }

        this._texture = internalTexture ?? this._getFromCache(this.url, noMipmap, samplingMode, this._invertY, useSRGBBuffer, this.isCube);

        if (!this._texture) {
            if (!scene || !scene.useDelayedTextureLoading) {
                try {
                    this._texture = engine.createTexture(
                        this.url,
                        noMipmap,
                        this._invertY,
                        scene,
                        samplingMode,
                        load,
                        errorHandler,
                        this._buffer,
                        undefined,
                        this._format,
                        this._forcedExtension,
                        mimeType,
                        loaderOptions,
                        creationFlags,
                        useSRGBBuffer
                    );
                } catch (e) {
                    errorHandler("error loading", e);
                    throw e;
                }
                if (deleteBuffer) {
                    this._buffer = null;
                }
            } else {
                this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;

                this._delayedOnLoad = load;
                this._delayedOnError = errorHandler;
            }
        } else {
            if (this._texture.isReady) {
                TimingTools.SetImmediate(() => load());
            } else {
                const loadObserver = this._texture.onLoadedObservable.add(load);
                this._texture.onErrorObservable.add((e) => {
                    errorHandler(e.message, e.exception);
                    this._texture?.onLoadedObservable.remove(loadObserver);
                });
            }
        }
    }

    /**
     * Update the url (and optional buffer) of this texture if url was null during construction.
     * @param url the url of the texture
     * @param buffer the buffer of the texture (defaults to null)
     * @param onLoad callback called when the texture is loaded  (defaults to null)
     * @param forcedExtension defines the extension to use to pick the right loader
     */
    public updateURL(
        url: string,
        buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null,
        onLoad?: () => void,
        forcedExtension?: string
    ): void {
        if (this.url) {
            this.releaseInternalTexture();
            this.getScene()!.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }

        if (!this.name || this.name.startsWith("data:")) {
            this.name = url;
        }
        this.url = url;
        this._buffer = buffer;
        this._forcedExtension = forcedExtension;
        this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;

        if (onLoad) {
            this._delayedOnLoad = onLoad;
        }
        this.delayLoad();
    }

    /**
     * Finish the loading sequence of a texture flagged as delayed load.
     * @internal
     */
    public delayLoad(): void {
        if (this.delayLoadState !== Constants.DELAYLOADSTATE_NOTLOADED) {
            return;
        }

        const scene = this.getScene();
        if (!scene) {
            return;
        }

        this.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
        this._texture = this._getFromCache(this.url, this._noMipmap, this.samplingMode, this._invertY, this._useSRGBBuffer, this.isCube);

        if (!this._texture) {
            this._texture = scene
                .getEngine()
                .createTexture(
                    this.url,
                    this._noMipmap,
                    this._invertY,
                    scene,
                    this.samplingMode,
                    this._delayedOnLoad,
                    this._delayedOnError,
                    this._buffer,
                    null,
                    this._format,
                    this._forcedExtension,
                    this._mimeType,
                    this._loaderOptions,
                    this._creationFlags,
                    this._useSRGBBuffer
                );
            if (this._deleteBuffer) {
                this._buffer = null;
            }
        } else {
            if (this._delayedOnLoad) {
                if (this._texture.isReady) {
                    TimingTools.SetImmediate(this._delayedOnLoad);
                } else {
                    this._texture.onLoadedObservable.add(this._delayedOnLoad);
                }
            }
        }

        this._delayedOnLoad = null;
        this._delayedOnError = null;
    }

    private _prepareRowForTextureGeneration(x: number, y: number, z: number, t: Vector3): void {
        x *= this._cachedUScale;
        y *= this._cachedVScale;

        x -= this.uRotationCenter * this._cachedUScale;
        y -= this.vRotationCenter * this._cachedVScale;
        z -= this.wRotationCenter;

        Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, this._rowGenerationMatrix!, t);

        t.x += this.uRotationCenter * this._cachedUScale + this._cachedUOffset;
        t.y += this.vRotationCenter * this._cachedVScale + this._cachedVOffset;
        t.z += this.wRotationCenter;
    }

    /**
     * Checks if the texture has the same transform matrix than another texture
     * @param texture texture to check against
     * @returns true if the transforms are the same, else false
     */
    public checkTransformsAreIdentical(texture: Nullable<Texture>): boolean {
        return (
            texture !== null &&
            this.uOffset === texture.uOffset &&
            this.vOffset === texture.vOffset &&
            this.uScale === texture.uScale &&
            this.vScale === texture.vScale &&
            this.uAng === texture.uAng &&
            this.vAng === texture.vAng &&
            this.wAng === texture.wAng
        );
    }

    /**
     * Get the current texture matrix which includes the requested offsetting, tiling and rotation components.
     * @param uBase The horizontal base offset multiplier (1 by default)
     * @returns the transform matrix of the texture.
     */
    public getTextureMatrix(uBase = 1): Matrix {
        if (
            this.uOffset === this._cachedUOffset &&
            this.vOffset === this._cachedVOffset &&
            this.uScale * uBase === this._cachedUScale &&
            this.vScale === this._cachedVScale &&
            this.uAng === this._cachedUAng &&
            this.vAng === this._cachedVAng &&
            this.wAng === this._cachedWAng &&
            this.uRotationCenter === this._cachedURotationCenter &&
            this.vRotationCenter === this._cachedVRotationCenter &&
            this.wRotationCenter === this._cachedWRotationCenter &&
            this.homogeneousRotationInUVTransform === this._cachedHomogeneousRotationInUVTransform
        ) {
            return this._cachedTextureMatrix!;
        }

        this._cachedUOffset = this.uOffset;
        this._cachedVOffset = this.vOffset;
        this._cachedUScale = this.uScale * uBase;
        this._cachedVScale = this.vScale;
        this._cachedUAng = this.uAng;
        this._cachedVAng = this.vAng;
        this._cachedWAng = this.wAng;
        this._cachedURotationCenter = this.uRotationCenter;
        this._cachedVRotationCenter = this.vRotationCenter;
        this._cachedWRotationCenter = this.wRotationCenter;
        this._cachedHomogeneousRotationInUVTransform = this.homogeneousRotationInUVTransform;

        if (!this._cachedTextureMatrix || !this._rowGenerationMatrix) {
            this._cachedTextureMatrix = Matrix.Zero();
            this._rowGenerationMatrix = new Matrix();
            this._t0 = Vector3.Zero();
            this._t1 = Vector3.Zero();
            this._t2 = Vector3.Zero();
        }

        Matrix.RotationYawPitchRollToRef(this.vAng, this.uAng, this.wAng, this._rowGenerationMatrix!);

        if (this.homogeneousRotationInUVTransform) {
            Matrix.TranslationToRef(-this._cachedURotationCenter, -this._cachedVRotationCenter, -this._cachedWRotationCenter, TmpVectors.Matrix[0]);
            Matrix.TranslationToRef(this._cachedURotationCenter, this._cachedVRotationCenter, this._cachedWRotationCenter, TmpVectors.Matrix[1]);
            Matrix.ScalingToRef(this._cachedUScale, this._cachedVScale, 0, TmpVectors.Matrix[2]);
            Matrix.TranslationToRef(this._cachedUOffset, this._cachedVOffset, 0, TmpVectors.Matrix[3]);

            TmpVectors.Matrix[0].multiplyToRef(this._rowGenerationMatrix!, this._cachedTextureMatrix);
            this._cachedTextureMatrix.multiplyToRef(TmpVectors.Matrix[1], this._cachedTextureMatrix);
            this._cachedTextureMatrix.multiplyToRef(TmpVectors.Matrix[2], this._cachedTextureMatrix);
            this._cachedTextureMatrix.multiplyToRef(TmpVectors.Matrix[3], this._cachedTextureMatrix);

            // copy the translation row to the 3rd row of the matrix so that we don't need to update the shaders (which expects the translation to be on the 3rd row)
            this._cachedTextureMatrix.setRowFromFloats(2, this._cachedTextureMatrix.m[12], this._cachedTextureMatrix.m[13], this._cachedTextureMatrix.m[14], 1);
        } else {
            this._prepareRowForTextureGeneration(0, 0, 0, this._t0!);
            this._prepareRowForTextureGeneration(1.0, 0, 0, this._t1!);
            this._prepareRowForTextureGeneration(0, 1.0, 0, this._t2!);

            this._t1!.subtractInPlace(this._t0!);
            this._t2!.subtractInPlace(this._t0!);

            Matrix.FromValuesToRef(
                this._t1!.x,
                this._t1!.y,
                this._t1!.z,
                0.0,
                this._t2!.x,
                this._t2!.y,
                this._t2!.z,
                0.0,
                this._t0!.x,
                this._t0!.y,
                this._t0!.z,
                0.0,
                0.0,
                0.0,
                0.0,
                1.0,
                this._cachedTextureMatrix
            );
        }

        const scene = this.getScene();

        if (!scene) {
            return this._cachedTextureMatrix;
        }

        if (this.optimizeUVAllocation) {
            // We flag the materials that are using this texture as "texture dirty" because depending on the fact that the matrix is the identity or not, some defines
            // will get different values (see MaterialHelper.PrepareDefinesForMergedUV), meaning we should regenerate the effect accordingly
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }

        return this._cachedTextureMatrix;
    }

    /**
     * Get the current matrix used to apply reflection. This is useful to rotate an environment texture for instance.
     * @returns The reflection texture transform
     */
    public getReflectionTextureMatrix(): Matrix {
        const scene = this.getScene();

        if (!scene) {
            return this._cachedReflectionTextureMatrix!;
        }

        if (
            this.uOffset === this._cachedReflectionUOffset &&
            this.vOffset === this._cachedReflectionVOffset &&
            this.uScale === this._cachedReflectionUScale &&
            this.vScale === this._cachedReflectionVScale &&
            this.coordinatesMode === this._cachedReflectionCoordinatesMode
        ) {
            if (this.coordinatesMode === Texture.PROJECTION_MODE) {
                if (this._cachedReflectionProjectionMatrixId === scene.getProjectionMatrix().updateFlag) {
                    return this._cachedReflectionTextureMatrix!;
                }
            } else {
                return this._cachedReflectionTextureMatrix!;
            }
        }

        if (!this._cachedReflectionTextureMatrix) {
            this._cachedReflectionTextureMatrix = Matrix.Zero();
        }

        if (!this._projectionModeMatrix) {
            this._projectionModeMatrix = Matrix.Zero();
        }

        const flagMaterialsAsTextureDirty = this._cachedReflectionCoordinatesMode !== this.coordinatesMode;

        this._cachedReflectionUOffset = this.uOffset;
        this._cachedReflectionVOffset = this.vOffset;
        this._cachedReflectionUScale = this.uScale;
        this._cachedReflectionVScale = this.vScale;
        this._cachedReflectionCoordinatesMode = this.coordinatesMode;

        switch (this.coordinatesMode) {
            case Texture.PLANAR_MODE: {
                Matrix.IdentityToRef(this._cachedReflectionTextureMatrix);
                (<any>this._cachedReflectionTextureMatrix)[0] = this.uScale;
                (<any>this._cachedReflectionTextureMatrix)[5] = this.vScale;
                (<any>this._cachedReflectionTextureMatrix)[12] = this.uOffset;
                (<any>this._cachedReflectionTextureMatrix)[13] = this.vOffset;
                break;
            }
            case Texture.PROJECTION_MODE: {
                Matrix.FromValuesToRef(0.5, 0.0, 0.0, 0.0, 0.0, -0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.5, 0.5, 1.0, 1.0, this._projectionModeMatrix);

                const projectionMatrix = scene.getProjectionMatrix();
                this._cachedReflectionProjectionMatrixId = projectionMatrix.updateFlag;
                projectionMatrix.multiplyToRef(this._projectionModeMatrix, this._cachedReflectionTextureMatrix);
                break;
            }
            default:
                Matrix.IdentityToRef(this._cachedReflectionTextureMatrix);
                break;
        }

        if (flagMaterialsAsTextureDirty) {
            // We flag the materials that are using this texture as "texture dirty" if the coordinatesMode has changed.
            // Indeed, this property is used to set the value of some defines used to generate the effect (in material.isReadyForSubMesh), so we must make sure this code will be re-executed and the effect recreated if necessary
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
                return mat.hasTexture(this);
            });
        }

        return this._cachedReflectionTextureMatrix;
    }

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public clone(): Texture {
        const options: ITextureCreationOptions = {
            noMipmap: this._noMipmap,
            invertY: this._invertY,
            samplingMode: this.samplingMode,
            onLoad: undefined,
            onError: undefined,
            buffer: this._texture ? this._texture._buffer : undefined,
            deleteBuffer: this._deleteBuffer,
            format: this.textureFormat,
            mimeType: this.mimeType,
            loaderOptions: this._loaderOptions,
            creationFlags: this._creationFlags,
            useSRGBBuffer: this._useSRGBBuffer,
        };

        return SerializationHelper.Clone(() => {
            return new Texture(this._texture ? this._texture.url : null, this.getScene(), options);
        }, this);
    }

    /**
     * Serialize the texture to a JSON representation we can easily use in the respective Parse function.
     * @returns The JSON representation of the texture
     */
    public serialize(): any {
        const savedName = this.name;

        if (!Texture.SerializeBuffers) {
            if (this.name.startsWith("data:")) {
                this.name = "";
            }
        }

        if (this.name.startsWith("data:") && this.url === this.name) {
            this.url = "";
        }

        const serializationObject = super.serialize(Texture._SerializeInternalTextureUniqueId);

        if (!serializationObject) {
            return null;
        }

        if (Texture.SerializeBuffers || Texture.ForceSerializeBuffers) {
            if (typeof this._buffer === "string" && (this._buffer as string).substr(0, 5) === "data:") {
                serializationObject.base64String = this._buffer;
                serializationObject.name = serializationObject.name.replace("data:", "");
            } else if (this.url && this.url.startsWith("data:") && this._buffer instanceof Uint8Array) {
                serializationObject.base64String = "data:image/png;base64," + EncodeArrayBufferToBase64(this._buffer);
            } else if (Texture.ForceSerializeBuffers || (this.url && this.url.startsWith("blob:")) || this._forceSerialize) {
                serializationObject.base64String =
                    !this._engine || this._engine._features.supportSyncTextureRead ? GenerateBase64StringFromTexture(this) : GenerateBase64StringFromTextureAsync(this);
            }
        }

        serializationObject.invertY = this._invertY;
        serializationObject.samplingMode = this.samplingMode;
        serializationObject._creationFlags = this._creationFlags;
        serializationObject._useSRGBBuffer = this._useSRGBBuffer;
        if (Texture._SerializeInternalTextureUniqueId) {
            serializationObject.internalTextureUniqueId = this._texture?.uniqueId ?? undefined;
        }
        serializationObject.noMipmap = this._noMipmap;

        this.name = savedName;

        return serializationObject;
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "Texture"
     */
    public getClassName(): string {
        return "Texture";
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        super.dispose();

        this.onLoadObservable.clear();

        this._delayedOnLoad = null;
        this._delayedOnError = null;
        this._buffer = null;
    }

    /**
     * Parse the JSON representation of a texture in order to recreate the texture in the given scene.
     * @param parsedTexture Define the JSON representation of the texture
     * @param scene Define the scene the parsed texture should be instantiated in
     * @param rootUrl Define the root url of the parsing sequence in the case of relative dependencies
     * @returns The parsed texture if successful
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): Nullable<BaseTexture> {
        if (parsedTexture.customType) {
            const customTexture = InstantiationTools.Instantiate(parsedTexture.customType);
            // Update Sampling Mode
            const parsedCustomTexture: any = customTexture.Parse(parsedTexture, scene, rootUrl);
            if (parsedTexture.samplingMode && parsedCustomTexture.updateSamplingMode && parsedCustomTexture._samplingMode) {
                if (parsedCustomTexture._samplingMode !== parsedTexture.samplingMode) {
                    parsedCustomTexture.updateSamplingMode(parsedTexture.samplingMode);
                }
            }
            return parsedCustomTexture;
        }

        if (parsedTexture.isCube && !parsedTexture.isRenderTarget) {
            return Texture._CubeTextureParser(parsedTexture, scene, rootUrl);
        }

        const hasInternalTextureUniqueId = parsedTexture.internalTextureUniqueId !== undefined;

        if (!parsedTexture.name && !parsedTexture.isRenderTarget && !hasInternalTextureUniqueId) {
            return null;
        }

        let internalTexture: InternalTexture | undefined;

        if (hasInternalTextureUniqueId) {
            const cache = scene.getEngine().getLoadedTexturesCache();
            for (const texture of cache) {
                if (texture.uniqueId === parsedTexture.internalTextureUniqueId) {
                    internalTexture = texture;
                    break;
                }
            }
        }

        const onLoaded = (texture: Texture | null) => {
            // Clear cache
            if (texture && texture._texture) {
                texture._texture._cachedWrapU = null;
                texture._texture._cachedWrapV = null;
                texture._texture._cachedWrapR = null;
            }

            // Update Sampling Mode
            if (parsedTexture.samplingMode) {
                const sampling: number = parsedTexture.samplingMode;
                if (texture && texture.samplingMode !== sampling) {
                    texture.updateSamplingMode(sampling);
                }
            }
            // Animations
            if (texture && parsedTexture.animations) {
                for (let animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                    const parsedAnimation = parsedTexture.animations[animationIndex];
                    const internalClass = GetClass("BABYLON.Animation");
                    if (internalClass) {
                        texture.animations.push(internalClass.Parse(parsedAnimation));
                    }
                }
            }

            if (hasInternalTextureUniqueId && !internalTexture) {
                texture?._texture?._setUniqueId(parsedTexture.internalTextureUniqueId);
            }
        };

        const texture = SerializationHelper.Parse(
            () => {
                let generateMipMaps: boolean = true;
                if (parsedTexture.noMipmap) {
                    generateMipMaps = false;
                }
                if (parsedTexture.mirrorPlane) {
                    const mirrorTexture = Texture._CreateMirror(parsedTexture.name, parsedTexture.renderTargetSize, scene, generateMipMaps);
                    mirrorTexture._waitingRenderList = parsedTexture.renderList;
                    mirrorTexture.mirrorPlane = Plane.FromArray(parsedTexture.mirrorPlane);
                    onLoaded(mirrorTexture);
                    return mirrorTexture;
                } else if (parsedTexture.isRenderTarget) {
                    let renderTargetTexture: Nullable<RenderTargetTexture> = null;
                    if (parsedTexture.isCube) {
                        // Search for an existing reflection probe (which contains a cube render target texture)
                        if (scene.reflectionProbes) {
                            for (let index = 0; index < scene.reflectionProbes.length; index++) {
                                const probe = scene.reflectionProbes[index];
                                if (probe.name === parsedTexture.name) {
                                    return probe.cubeTexture;
                                }
                            }
                        }
                    } else {
                        renderTargetTexture = Texture._CreateRenderTargetTexture(
                            parsedTexture.name,
                            parsedTexture.renderTargetSize,
                            scene,
                            generateMipMaps,
                            parsedTexture._creationFlags ?? 0
                        );
                        renderTargetTexture._waitingRenderList = parsedTexture.renderList;
                    }
                    onLoaded(renderTargetTexture);
                    return renderTargetTexture;
                } else if (parsedTexture.isVideo) {
                    const texture = Texture._CreateVideoTexture(
                        rootUrl + (parsedTexture.url || parsedTexture.name),
                        rootUrl + (parsedTexture.src || parsedTexture.url),
                        scene,
                        generateMipMaps,
                        parsedTexture.invertY,
                        parsedTexture.samplingMode,
                        parsedTexture.settings || {}
                    );
                    onLoaded(texture);
                    return texture;
                } else {
                    let texture: Texture;

                    if (parsedTexture.base64String && !internalTexture) {
                        // name and url are the same to ensure caching happens from the actual base64 string
                        texture = Texture.CreateFromBase64String(
                            parsedTexture.base64String,
                            parsedTexture.base64String,
                            scene,
                            !generateMipMaps,
                            parsedTexture.invertY,
                            parsedTexture.samplingMode,
                            () => {
                                onLoaded(texture);
                            },
                            parsedTexture._creationFlags ?? 0,
                            parsedTexture._useSRGBBuffer ?? false
                        );

                        // prettier name to fit with the loaded data
                        texture.name = parsedTexture.name;
                    } else {
                        let url: string;
                        if (parsedTexture.name && (parsedTexture.name.indexOf("://") > 0 || parsedTexture.name.startsWith("data:"))) {
                            url = parsedTexture.name;
                        } else {
                            url = rootUrl + parsedTexture.name;
                        }

                        if (parsedTexture.url && (parsedTexture.url.startsWith("data:") || Texture.UseSerializedUrlIfAny)) {
                            url = parsedTexture.url;
                        }

                        const options: ITextureCreationOptions = {
                            noMipmap: !generateMipMaps,
                            invertY: parsedTexture.invertY,
                            samplingMode: parsedTexture.samplingMode,
                            onLoad: () => {
                                onLoaded(texture);
                            },
                            internalTexture,
                        };

                        texture = new Texture(url, scene, options);
                    }

                    return texture;
                }
            },
            parsedTexture,
            scene
        );

        return texture;
    }

    /**
     * Creates a texture from its base 64 representation.
     * @param data Define the base64 payload without the data: prefix
     * @param name Define the name of the texture in the scene useful fo caching purpose for instance
     * @param scene Define the scene the texture should belong to
     * @param noMipmapOrOptions defines if the texture will require mip maps or not or set of all options to create the texture
     * @param invertY define if the texture needs to be inverted on the y axis during loading
     * @param samplingMode define the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...)
     * @param onLoad define a callback triggered when the texture has been loaded
     * @param onError define a callback triggered when an error occurred during the loading session
     * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @returns the created texture
     */
    public static CreateFromBase64String(
        data: string,
        name: string,
        scene: Scene,
        noMipmapOrOptions?: boolean | ITextureCreationOptions,
        invertY?: boolean,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<() => void> = null,
        format: number = Constants.TEXTUREFORMAT_RGBA,
        creationFlags?: number
    ): Texture {
        return new Texture("data:" + name, scene, noMipmapOrOptions, invertY, samplingMode, onLoad, onError, data, false, format, undefined, undefined, creationFlags);
    }

    /**
     * Creates a texture from its data: representation. (data: will be added in case only the payload has been passed in)
     * @param name Define the name of the texture in the scene useful fo caching purpose for instance
     * @param buffer define the buffer to load the texture from in case the texture is loaded from a buffer representation
     * @param scene Define the scene the texture should belong to
     * @param deleteBuffer define if the buffer we are loading the texture from should be deleted after load
     * @param noMipmapOrOptions defines if the texture will require mip maps or not or set of all options to create the texture
     * @param invertY define if the texture needs to be inverted on the y axis during loading
     * @param samplingMode define the sampling mode we want for the texture while fetching from it (Texture.NEAREST_SAMPLINGMODE...)
     * @param onLoad define a callback triggered when the texture has been loaded
     * @param onError define a callback triggered when an error occurred during the loading session
     * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
     * @param creationFlags specific flags to use when creating the texture (Constants.TEXTURE_CREATIONFLAG_STORAGE for storage textures, for eg)
     * @returns the created texture
     */
    public static LoadFromDataString(
        name: string,
        buffer: any,
        scene: Scene,
        deleteBuffer: boolean = false,
        noMipmapOrOptions?: boolean | ITextureCreationOptions,
        invertY: boolean = true,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        format: number = Constants.TEXTUREFORMAT_RGBA,
        creationFlags?: number
    ): Texture {
        if (name.substr(0, 5) !== "data:") {
            name = "data:" + name;
        }

        return new Texture(name, scene, noMipmapOrOptions, invertY, samplingMode, onLoad, onError, buffer, deleteBuffer, format, undefined, undefined, creationFlags);
    }
}

// References the dependencies.
RegisterClass("BABYLON.Texture", Texture);
SerializationHelper._TextureParser = Texture.Parse;
