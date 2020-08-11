import { serialize, SerializationHelper } from "../../Misc/decorators";
import { Observable } from "../../Misc/observable";
import { Nullable } from "../../types";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Constants } from "../../Engines/constants";
import { _TypeStore } from '../../Misc/typeStore';
import { _DevTools } from '../../Misc/devTools';
import { IInspectable } from '../../Misc/iInspectable';
import { ThinEngine } from '../../Engines/thinEngine';
import { TimingTools } from '../../Misc/timingTools';
import { InstantiationTools } from '../../Misc/instantiationTools';
import { Plane } from '../../Maths/math.plane';
import { StringTools } from '../../Misc/stringTools';

declare type CubeTexture = import("../../Materials/Textures/cubeTexture").CubeTexture;
declare type MirrorTexture = import("../../Materials/Textures/mirrorTexture").MirrorTexture;
declare type RenderTargetTexture = import("../../Materials/Textures/renderTargetTexture").RenderTargetTexture;
declare type Scene = import("../../scene").Scene;

/**
 * This represents a texture in babylon. It can be easily loaded from a network, base64 or html input.
 * @see https://doc.babylonjs.com/babylon101/materials#texture
 */
export class Texture extends BaseTexture {
    /**
     * Gets or sets a general boolean used to indicate that textures containing direct data (buffers) must be saved as part of the serialization process
     */
    public static SerializeBuffers = true;

    /** @hidden */
    public static _CubeTextureParser = (jsonTexture: any, scene: Scene, rootUrl: string): CubeTexture => {
        throw _DevTools.WarnImport("CubeTexture");
    }
    /** @hidden */
    public static _CreateMirror = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean): MirrorTexture => {
        throw _DevTools.WarnImport("MirrorTexture");
    }
    /** @hidden */
    public static _CreateRenderTargetTexture = (name: string, renderTargetSize: number, scene: Scene, generateMipMaps: boolean): RenderTargetTexture => {
        throw _DevTools.WarnImport("RenderTargetTexture");
    }

    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly NEAREST_SAMPLINGMODE = Constants.TEXTURE_NEAREST_SAMPLINGMODE;
    /** nearest is mag = nearest and min = nearest and mip = linear */
    public static readonly NEAREST_NEAREST_MIPLINEAR = Constants.TEXTURE_NEAREST_NEAREST_MIPLINEAR; // nearest is mag = nearest and min = nearest and mip = linear

    /** Bilinear is mag = linear and min = linear and mip = nearest */
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
     * @see https://doc.babylonjs.com/how_to/more_materials#offsetting
     */
    @serialize()
    public uOffset = 0;

    /**
     * Define an offset on the texture to offset the v coordinates of the UVs
     * @see https://doc.babylonjs.com/how_to/more_materials#offsetting
     */
    @serialize()
    public vOffset = 0;

    /**
     * Define an offset on the texture to scale the u coordinates of the UVs
     * @see https://doc.babylonjs.com/how_to/more_materials#tiling
     */
    @serialize()
    public uScale = 1.0;

    /**
     * Define an offset on the texture to scale the v coordinates of the UVs
     * @see https://doc.babylonjs.com/how_to/more_materials#tiling
     */
    @serialize()
    public vScale = 1.0;

    /**
     * Define an offset on the texture to rotate around the u coordinates of the UVs
     * @see https://doc.babylonjs.com/how_to/more_materials
     */
    @serialize()
    public uAng = 0;

    /**
     * Define an offset on the texture to rotate around the v coordinates of the UVs
     * @see https://doc.babylonjs.com/how_to/more_materials
     */
    @serialize()
    public vAng = 0;

    /**
     * Define an offset on the texture to rotate around the w coordinates of the UVs (in case of 3d texture)
     * @see https://doc.babylonjs.com/how_to/more_materials
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
     * Are mip maps generated for this texture or not.
     */
    get noMipmap(): boolean {
        return this._noMipmap;
    }

    /**
     * List of inspectable custom properties (used by the Inspector)
     * @see https://doc.babylonjs.com/how_to/debug_layer#extensibility
     */
    public inspectableCustomProperties: Nullable<IInspectable[]> = null;

    private _noMipmap: boolean = false;
    /** @hidden */
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
    private _cachedProjectionMatrixId: number = -1;
    private _cachedCoordinatesMode: number = -1;

    /** @hidden */
    protected _initialSamplingMode = Texture.BILINEAR_SAMPLINGMODE;

    /** @hidden */
    public _buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null;
    private _deleteBuffer: boolean = false;
    protected _format: Nullable<number> = null;
    private _delayedOnLoad: Nullable<() => void> = null;
    private _delayedOnError: Nullable<() => void> = null;
    private _mimeType?: string;

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
     * Get the current sampling mode associated with the texture.
     */
    public get samplingMode(): number {
        if (!this._texture) {
            return this._initialSamplingMode;
        }

        return this._texture.samplingMode;
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
     * @see https://doc.babylonjs.com/babylon101/materials#texture
     * @param url defines the url of the picture to load as a texture
     * @param sceneOrEngine defines the scene or engine the texture will belong to
     * @param noMipmap defines if the texture will require mip maps or not
     * @param invertY defines if the texture needs to be inverted on the y axis during loading
     * @param samplingMode defines the sampling mode we want for the texture while fectching from it (Texture.NEAREST_SAMPLINGMODE...)
     * @param onLoad defines a callback triggered when the texture has been loaded
     * @param onError defines a callback triggered when an error occurred during the loading session
     * @param buffer defines the buffer to load the texture from in case the texture is loaded from a buffer representation
     * @param deleteBuffer defines if the buffer we are loading the texture from should be deleted after load
     * @param format defines the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
     * @param mimeType defines an optional mime type information
     */
    constructor(url: Nullable<string>, sceneOrEngine: Nullable<Scene | ThinEngine>, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE, onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob | ImageBitmap> = null, deleteBuffer: boolean = false, format?: number, mimeType?: string) {
        super(sceneOrEngine);

        this.name = url || "";
        this.url = url;
        this._noMipmap = noMipmap;
        this._invertY = invertY;
        this._initialSamplingMode = samplingMode;
        this._buffer = buffer;
        this._deleteBuffer = deleteBuffer;
        this._mimeType = mimeType;
        if (format) {
            this._format = format;
        }

        var scene = this.getScene();
        var engine = this._getEngine();
        if (!engine) {
            return;
        }

        engine.onBeforeTextureInitObservable.notifyObservers(this);

        let load = () => {
            if (this._texture) {
                if (this._texture._invertVScale) {
                    this.vScale *= -1;
                    this.vOffset += 1;
                }

                // Update texutre to match internal texture's wrapping
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

        if (!this.url) {
            this._delayedOnLoad = load;
            this._delayedOnError = onError;
            return;
        }

        this._texture = this._getFromCache(this.url, noMipmap, samplingMode, invertY);

        if (!this._texture) {
            if (!scene || !scene.useDelayedTextureLoading) {
                this._texture = engine.createTexture(this.url, noMipmap, invertY, scene, samplingMode, load, onError, this._buffer, undefined, this._format, null, mimeType);
                if (deleteBuffer) {
                    delete this._buffer;
                }
            } else {
                this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;

                this._delayedOnLoad = load;
                this._delayedOnError = onError;
            }
        } else {
            if (this._texture.isReady) {
                TimingTools.SetImmediate(() => load());
            } else {
                this._texture.onLoadedObservable.add(load);
            }
        }
    }

    /**
     * Update the url (and optional buffer) of this texture if url was null during construction.
     * @param url the url of the texture
     * @param buffer the buffer of the texture (defaults to null)
     * @param onLoad callback called when the texture is loaded  (defaults to null)
     */
    public updateURL(url: string, buffer: Nullable<string | ArrayBuffer | ArrayBufferView | HTMLImageElement | Blob> = null, onLoad?: () => void): void {
        if (this.url) {
            this.releaseInternalTexture();
            this.getScene()!.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }

        if (!this.name || StringTools.StartsWith(this.name, "data:")) {
            this.name = url;
        }
        this.url = url;
        this._buffer = buffer;
        this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;

        if (onLoad) {
            this._delayedOnLoad = onLoad;
        }
        this.delayLoad();
    }

    /**
     * Finish the loading sequence of a texture flagged as delayed load.
     * @hidden
     */
    public delayLoad(): void {
        if (this.delayLoadState !== Constants.DELAYLOADSTATE_NOTLOADED) {
            return;
        }

        let scene = this.getScene();
        if (!scene) {
            return;
        }

        this.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
        this._texture = this._getFromCache(this.url, this._noMipmap, this.samplingMode, this._invertY);

        if (!this._texture) {
            this._texture = scene.getEngine().createTexture(this.url, this._noMipmap, this._invertY, scene, this.samplingMode, this._delayedOnLoad, this._delayedOnError, this._buffer, null, this._format, null, this._mimeType);
            if (this._deleteBuffer) {
                delete this._buffer;
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
     * Get the current texture matrix which includes the requested offsetting, tiling and rotation components.
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
            this.wAng === this._cachedWAng) {
            return this._cachedTextureMatrix!;
        }

        this._cachedUOffset = this.uOffset;
        this._cachedVOffset = this.vOffset;
        this._cachedUScale = this.uScale * uBase;
        this._cachedVScale = this.vScale;
        this._cachedUAng = this.uAng;
        this._cachedVAng = this.vAng;
        this._cachedWAng = this.wAng;

        if (!this._cachedTextureMatrix) {
            this._cachedTextureMatrix = Matrix.Zero();
            this._rowGenerationMatrix = new Matrix();
            this._t0 = Vector3.Zero();
            this._t1 = Vector3.Zero();
            this._t2 = Vector3.Zero();
        }

        Matrix.RotationYawPitchRollToRef(this.vAng, this.uAng, this.wAng, this._rowGenerationMatrix!);

        this._prepareRowForTextureGeneration(0, 0, 0, this._t0!);
        this._prepareRowForTextureGeneration(1.0, 0, 0, this._t1!);
        this._prepareRowForTextureGeneration(0, 1.0, 0, this._t2!);

        this._t1!.subtractInPlace(this._t0!);
        this._t2!.subtractInPlace(this._t0!);

        Matrix.FromValuesToRef(
            this._t1!.x, this._t1!.y, this._t1!.z, 0.0,
            this._t2!.x, this._t2!.y, this._t2!.z, 0.0,
            this._t0!.x, this._t0!.y, this._t0!.z, 0.0,
            0.0, 0.0, 0.0, 1.0,
            this._cachedTextureMatrix
        );

        let scene = this.getScene();

        if (!scene) {
            return this._cachedTextureMatrix;
        }

        scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
            return mat.hasTexture(this);
        });

        return this._cachedTextureMatrix;
    }

    /**
     * Get the current matrix used to apply reflection. This is useful to rotate an environment texture for instance.
     * @returns The reflection texture transform
     */
    public getReflectionTextureMatrix(): Matrix {
        let scene = this.getScene();

        if (!scene) {
            return this._cachedTextureMatrix!;
        }

        if (
            this.uOffset === this._cachedUOffset &&
            this.vOffset === this._cachedVOffset &&
            this.uScale === this._cachedUScale &&
            this.vScale === this._cachedVScale &&
            this.coordinatesMode === this._cachedCoordinatesMode) {
            if (this.coordinatesMode === Texture.PROJECTION_MODE) {
                if (this._cachedProjectionMatrixId === scene.getProjectionMatrix().updateFlag) {
                    return this._cachedTextureMatrix!;
                }
            } else {
                return this._cachedTextureMatrix!;
            }
        }

        if (!this._cachedTextureMatrix) {
            this._cachedTextureMatrix = Matrix.Zero();
        }

        if (!this._projectionModeMatrix) {
            this._projectionModeMatrix = Matrix.Zero();
        }

        this._cachedUOffset = this.uOffset;
        this._cachedVOffset = this.vOffset;
        this._cachedUScale = this.uScale;
        this._cachedVScale = this.vScale;
        this._cachedCoordinatesMode = this.coordinatesMode;

        switch (this.coordinatesMode) {
            case Texture.PLANAR_MODE:
                Matrix.IdentityToRef(this._cachedTextureMatrix);
                (<any>this._cachedTextureMatrix)[0] = this.uScale;
                (<any>this._cachedTextureMatrix)[5] = this.vScale;
                (<any>this._cachedTextureMatrix)[12] = this.uOffset;
                (<any>this._cachedTextureMatrix)[13] = this.vOffset;
                break;
            case Texture.PROJECTION_MODE:
                Matrix.FromValuesToRef(
                    0.5, 0.0, 0.0, 0.0,
                    0.0, -0.5, 0.0, 0.0,
                    0.0, 0.0, 0.0, 0.0,
                    0.5, 0.5, 1.0, 1.0,
                    this._projectionModeMatrix
                );

                let projectionMatrix = scene.getProjectionMatrix();
                this._cachedProjectionMatrixId = projectionMatrix.updateFlag;
                projectionMatrix.multiplyToRef(this._projectionModeMatrix, this._cachedTextureMatrix);
                break;
            default:
                Matrix.IdentityToRef(this._cachedTextureMatrix);
                break;
        }

        scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => {
            return (mat.getActiveTextures().indexOf(this) !== -1);
        });

        return this._cachedTextureMatrix;
    }

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public clone(): Texture {
        return SerializationHelper.Clone(() => {
            return new Texture(this._texture ? this._texture.url : null, this.getScene(), this._noMipmap, this._invertY, this.samplingMode, undefined, undefined, this._texture ? this._texture._buffer : undefined);
        }, this);
    }

    /**
     * Serialize the texture to a JSON representation we can easily use in the resepective Parse function.
     * @returns The JSON representation of the texture
     */
    public serialize(): any {
        let savedName = this.name;

        if (!Texture.SerializeBuffers) {
            if (StringTools.StartsWith(this.name, "data:")) {
                this.name = "";
            }
        }

        if (StringTools.StartsWith(this.name, "data:") && this.url === this.name) {
            this.url = "";
        }

        var serializationObject = super.serialize();

        if (!serializationObject) {
            return null;
        }

        if (Texture.SerializeBuffers) {
            if (typeof this._buffer === "string" && (this._buffer as string).substr(0, 5) === "data:") {
                serializationObject.base64String = this._buffer;
                serializationObject.name = serializationObject.name.replace("data:", "");
            } else if (this.url && StringTools.StartsWith(this.url, "data:") && this._buffer instanceof Uint8Array) {
                serializationObject.base64String = "data:image/png;base64," + StringTools.EncodeArrayBufferToBase64(this._buffer);
            }
        }

        serializationObject.invertY = this._invertY;
        serializationObject.samplingMode = this.samplingMode;

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
            var customTexture = InstantiationTools.Instantiate(parsedTexture.customType);
            // Update Sampling Mode
            var parsedCustomTexture: any = customTexture.Parse(parsedTexture, scene, rootUrl);
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

        if (!parsedTexture.name && !parsedTexture.isRenderTarget) {
            return null;
        }

        var texture = SerializationHelper.Parse(() => {
            var generateMipMaps: boolean = true;
            if (parsedTexture.noMipmap) {
                generateMipMaps = false;
            }
            if (parsedTexture.mirrorPlane) {
                var mirrorTexture = Texture._CreateMirror(parsedTexture.name, parsedTexture.renderTargetSize, scene, generateMipMaps);
                mirrorTexture._waitingRenderList = parsedTexture.renderList;
                mirrorTexture.mirrorPlane = Plane.FromArray(parsedTexture.mirrorPlane);

                return mirrorTexture;
            } else if (parsedTexture.isRenderTarget) {
                let renderTargetTexture: Nullable<RenderTargetTexture> = null;
                if (parsedTexture.isCube) {
                    // Search for an existing reflection probe (which contains a cube render target texture)
                    if (scene.reflectionProbes) {
                        for (var index = 0; index < scene.reflectionProbes.length; index++) {
                            const probe = scene.reflectionProbes[index];
                            if (probe.name === parsedTexture.name) {
                                return probe.cubeTexture;
                            }
                        }
                    }
                } else {
                    renderTargetTexture = Texture._CreateRenderTargetTexture(parsedTexture.name, parsedTexture.renderTargetSize, scene, generateMipMaps);
                    renderTargetTexture._waitingRenderList = parsedTexture.renderList;
                }

                return renderTargetTexture;
            } else {
                var texture: Texture;
                if (parsedTexture.base64String) {
                    texture = Texture.CreateFromBase64String(parsedTexture.base64String, parsedTexture.name, scene, !generateMipMaps, parsedTexture.invertY);
                } else {
                    let url: string;
                    if (parsedTexture.name && parsedTexture.name.indexOf("://") > 0) {
                        url = parsedTexture.name;
                    }
                    else {
                        url = rootUrl + parsedTexture.name;
                    }

                    if (StringTools.StartsWith(parsedTexture.url, "data:") || (Texture.UseSerializedUrlIfAny && parsedTexture.url)) {
                        url = parsedTexture.url;
                    }
                    texture = new Texture(url, scene, !generateMipMaps, parsedTexture.invertY);
                }

                return texture;
            }
        }, parsedTexture, scene);

        // Clear cache
        if (texture && texture._texture) {
            texture._texture._cachedWrapU = null;
            texture._texture._cachedWrapV = null;
            texture._texture._cachedWrapR = null;
        }

        // Update Sampling Mode
        if (parsedTexture.samplingMode) {
            var sampling: number = parsedTexture.samplingMode;
            if (texture && texture.samplingMode !== sampling) {
                texture.updateSamplingMode(sampling);
            }
        }
        // Animations
        if (texture && parsedTexture.animations) {
            for (var animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                var parsedAnimation = parsedTexture.animations[animationIndex];
                const internalClass = _TypeStore.GetClass("BABYLON.Animation");
                if (internalClass) {
                    texture.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
        }

        return texture;
    }

    /**
     * Creates a texture from its base 64 representation.
     * @param data Define the base64 payload without the data: prefix
     * @param name Define the name of the texture in the scene useful fo caching purpose for instance
     * @param scene Define the scene the texture should belong to
     * @param noMipmap Forces the texture to not create mip map information if true
     * @param invertY define if the texture needs to be inverted on the y axis during loading
     * @param samplingMode define the sampling mode we want for the texture while fectching from it (Texture.NEAREST_SAMPLINGMODE...)
     * @param onLoad define a callback triggered when the texture has been loaded
     * @param onError define a callback triggered when an error occurred during the loading session
     * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
     * @returns the created texture
     */
    public static CreateFromBase64String(data: string, name: string, scene: Scene, noMipmap?: boolean, invertY?: boolean, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<() => void> = null, format: number = Constants.TEXTUREFORMAT_RGBA): Texture {
        return new Texture("data:" + name, scene, noMipmap, invertY, samplingMode, onLoad, onError, data, false, format);
    }

    /**
     * Creates a texture from its data: representation. (data: will be added in case only the payload has been passed in)
     * @param data Define the base64 payload without the data: prefix
     * @param name Define the name of the texture in the scene useful fo caching purpose for instance
     * @param buffer define the buffer to load the texture from in case the texture is loaded from a buffer representation
     * @param scene Define the scene the texture should belong to
     * @param deleteBuffer define if the buffer we are loading the texture from should be deleted after load
     * @param noMipmap Forces the texture to not create mip map information if true
     * @param invertY define if the texture needs to be inverted on the y axis during loading
     * @param samplingMode define the sampling mode we want for the texture while fectching from it (Texture.NEAREST_SAMPLINGMODE...)
     * @param onLoad define a callback triggered when the texture has been loaded
     * @param onError define a callback triggered when an error occurred during the loading session
     * @param format define the format of the texture we are trying to load (Engine.TEXTUREFORMAT_RGBA...)
     * @returns the created texture
     */
    public static LoadFromDataString(name: string, buffer: any, scene: Scene, deleteBuffer: boolean = false, noMipmap: boolean = false, invertY: boolean = true, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format: number = Constants.TEXTUREFORMAT_RGBA): Texture {
        if (name.substr(0, 5) !== "data:") {
            name = "data:" + name;
        }

        return new Texture(name, scene, noMipmap, invertY, samplingMode, onLoad, onError, buffer, deleteBuffer, format);
    }
}

// References the dependencies.
_TypeStore.RegisteredTypes["BABYLON.Texture"] = Texture;
SerializationHelper._TextureParser = Texture.Parse;
