import { serialize, serializeAsMatrix, serializeAsVector3 } from "../../Misc/decorators";
import { Tools } from "../../Misc/tools";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Matrix, TmpVectors, Vector3 } from "../../Maths/math.vector";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import { GetClass, RegisterClass } from "../../Misc/typeStore";
import type { AbstractEngine } from "../../Engines/abstractEngine";
import { Observable } from "../../Misc/observable";
import { SerializationHelper } from "../../Misc/decorators.serialization";

import "../../Engines/AbstractEngine/abstractEngine.cubeTexture";

/**
 * Defines the available options when creating a cube texture
 */
export interface ICubeTextureCreationOptions {
    /** Defines the suffixes add to the picture name in case six images are in use like _px.jpg */
    extensions?: string[];

    /** noMipmap defines if mipmaps should be created or not */
    noMipmap?: boolean;

    /** files defines the six files to load for the different faces in that order: px, py, pz, nx, ny, nz */
    files?: string[];

    /** buffer to load instead of loading the data from the url */
    buffer?: ArrayBufferView;

    /** onLoad defines a callback triggered at the end of the file load if no errors occurred */
    onLoad?: () => void;

    /** onError defines a callback triggered in case of error during load */
    onError?: (message?: string, exception?: any) => void;

    /** format defines the internal format to use for the texture once loaded */
    format?: number;

    /** prefiltered defines whether or not the texture is created from prefiltered data */
    prefiltered?: boolean;

    /** forcedExtension defines the extensions to use (force a special type of file to load) in case it is different from the file name */
    forcedExtension?: any;

    /** createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary */
    createPolynomials?: boolean;

    /** lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness */
    lodScale?: number;

    /** lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness */
    lodOffset?: number;

    /** loaderOptions options to be passed to the loader */
    loaderOptions?: any;

    /** useSRGBBuffer Defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU) (default: false) */
    useSRGBBuffer?: boolean;
}

// The default scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
const defaultLodScale = 0.8;

/**
 * Class for creating a cube texture
 */
export class CubeTexture extends BaseTexture {
    private _delayedOnLoad: Nullable<() => void>;
    private _delayedOnError: Nullable<(message?: string, exception?: any) => void>;
    private _lodScale: number;
    private _lodOffset: number;

    /**
     * Observable triggered once the texture has been loaded.
     */
    public onLoadObservable: Observable<CubeTexture> = new Observable<CubeTexture>();

    /**
     * The url of the texture
     */
    @serialize()
    public url: string;

    /**
     * Gets or sets the center of the bounding box associated with the cube texture.
     * It must define where the camera used to render the texture was set
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#using-local-cubemap-mode
     */
    @serializeAsVector3()
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
    /**
     * Returns the bounding box size
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/reflectionTexture#using-local-cubemap-mode
     */
    @serializeAsVector3()
    public get boundingBoxSize(): Vector3 {
        return this._boundingBoxSize;
    }

    protected _rotationY: number = 0;

    /**
     * Sets texture matrix rotation angle around Y axis in radians.
     */
    @serialize("rotationY")
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
     * Are mip maps generated for this texture or not.
     */
    public override get noMipmap(): boolean {
        return this._noMipmap;
    }

    private _noMipmap: boolean;

    /** @internal */
    @serialize("files")
    public _files: Nullable<string[]> = null;

    @serialize("forcedExtension")
    protected _forcedExtension: Nullable<string> = null;

    /**
     * Gets the forced extension (if any)
     */
    public get forcedExtension(): Nullable<string> {
        return this._forcedExtension;
    }

    @serialize("extensions")
    private _extensions: Nullable<string[]> = null;

    @serializeAsMatrix("textureMatrix")
    private _textureMatrix: Matrix;

    @serializeAsMatrix("textureMatrixRefraction")
    private _textureMatrixRefraction: Matrix = new Matrix();

    private _format: number;
    private _createPolynomials: boolean;
    private _loaderOptions: any;
    private _useSRGBBuffer?: boolean;
    private _buffer: Nullable<ArrayBufferView> = null;

    /**
     * Creates a cube texture from an array of image urls
     * @param files defines an array of image urls
     * @param scene defines the hosting scene
     * @param noMipmap specifies if mip maps are not used
     * @returns a cube texture
     */
    public static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean): CubeTexture {
        let rootUrlKey = "";

        for (const url of files) {
            rootUrlKey += url;
        }

        return new CubeTexture(rootUrlKey, scene, null, noMipmap, files);
    }

    /**
     * Creates and return a texture created from prefilterd data by tools like IBL Baker or Lys.
     * @param url defines the url of the prefiltered texture
     * @param scene defines the scene the texture is attached to
     * @param forcedExtension defines the extension of the file if different from the url
     * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
     * @returns the prefiltered texture
     */
    public static CreateFromPrefilteredData(url: string, scene: Scene, forcedExtension: any = null, createPolynomials: boolean = true) {
        const oldValue = scene.useDelayedTextureLoading;
        scene.useDelayedTextureLoading = false;

        const result = new CubeTexture(url, scene, null, false, null, null, null, undefined, true, forcedExtension, createPolynomials);

        scene.useDelayedTextureLoading = oldValue;

        return result;
    }

    /**
     * Creates a cube texture to use with reflection for instance. It can be based upon dds or six images as well
     * as prefiltered data.
     * @param rootUrl defines the url of the texture or the root name of the six images
     * @param sceneOrEngine defines the scene or engine the texture is attached to
     * @param extensionsOrOptions defines the suffixes add to the picture name in case six images are in use like _px.jpg or set of all options to create the cube texture
     * @param noMipmap defines if mipmaps should be created or not
     * @param files defines the six files to load for the different faces in that order: px, py, pz, nx, ny, nz
     * @param onLoad defines a callback triggered at the end of the file load if no errors occurred
     * @param onError defines a callback triggered in case of error during load
     * @param format defines the internal format to use for the texture once loaded
     * @param prefiltered defines whether or not the texture is created from prefiltered data
     * @param forcedExtension defines the extensions to use (force a special type of file to load) in case it is different from the file name
     * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @param loaderOptions options to be passed to the loader
     * @param useSRGBBuffer Defines if the texture must be loaded in a sRGB GPU buffer (if supported by the GPU) (default: false)
     * @returns the cube texture
     */
    constructor(
        rootUrl: string,
        sceneOrEngine: Scene | AbstractEngine,
        extensionsOrOptions: Nullable<string[] | ICubeTextureCreationOptions> = null,
        noMipmap: boolean = false,
        files: Nullable<string[]> = null,
        onLoad: Nullable<() => void> = null,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        format: number = Constants.TEXTUREFORMAT_RGBA,
        prefiltered = false,
        forcedExtension: any = null,
        createPolynomials: boolean = false,
        lodScale: number = defaultLodScale,
        lodOffset: number = 0,
        loaderOptions?: any,
        useSRGBBuffer?: boolean
    ) {
        super(sceneOrEngine);

        this.name = rootUrl;
        this.url = rootUrl;
        this._noMipmap = noMipmap;
        this.hasAlpha = false;
        this.isCube = true;
        this._textureMatrix = Matrix.Identity();
        this.coordinatesMode = Texture.CUBIC_MODE;

        let extensions: Nullable<string[]> = null;
        let buffer: Nullable<ArrayBufferView> = null;

        if (extensionsOrOptions !== null && !Array.isArray(extensionsOrOptions)) {
            extensions = extensionsOrOptions.extensions ?? null;
            this._noMipmap = extensionsOrOptions.noMipmap ?? false;
            files = extensionsOrOptions.files ?? null;
            buffer = extensionsOrOptions.buffer ?? null;
            this._format = extensionsOrOptions.format ?? Constants.TEXTUREFORMAT_RGBA;
            prefiltered = extensionsOrOptions.prefiltered ?? false;
            forcedExtension = extensionsOrOptions.forcedExtension ?? null;
            this._createPolynomials = extensionsOrOptions.createPolynomials ?? false;
            this._lodScale = extensionsOrOptions.lodScale ?? defaultLodScale;
            this._lodOffset = extensionsOrOptions.lodOffset ?? 0;
            this._loaderOptions = extensionsOrOptions.loaderOptions;
            this._useSRGBBuffer = extensionsOrOptions.useSRGBBuffer;
            onLoad = extensionsOrOptions.onLoad ?? null;
            onError = extensionsOrOptions.onError ?? null;
        } else {
            this._noMipmap = noMipmap;
            this._format = format;
            this._createPolynomials = createPolynomials;
            extensions = extensionsOrOptions;
            this._loaderOptions = loaderOptions;
            this._useSRGBBuffer = useSRGBBuffer;
            this._lodScale = lodScale;
            this._lodOffset = lodOffset;
        }

        if (!rootUrl && !files) {
            return;
        }

        this.updateURL(rootUrl, forcedExtension, onLoad, prefiltered, onError, extensions, this.getScene()?.useDelayedTextureLoading, files, buffer);
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "CubeTexture"
     */
    public override getClassName(): string {
        return "CubeTexture";
    }

    /**
     * Update the url (and optional buffer) of this texture if url was null during construction.
     * @param url the url of the texture
     * @param forcedExtension defines the extension to use
     * @param onLoad callback called when the texture is loaded  (defaults to null)
     * @param prefiltered Defines whether the updated texture is prefiltered or not
     * @param onError callback called if there was an error during the loading process (defaults to null)
     * @param extensions defines the suffixes add to the picture name in case six images are in use like _px.jpg...
     * @param delayLoad defines if the texture should be loaded now (false by default)
     * @param files defines the six files to load for the different faces in that order: px, py, pz, nx, ny, nz
     * @param buffer the buffer to use instead of loading from the url
     */
    public updateURL(
        url: string,
        forcedExtension: Nullable<string> = null,
        onLoad: Nullable<() => void> = null,
        prefiltered: boolean = false,
        onError: Nullable<(message?: string, exception?: any) => void> = null,
        extensions: Nullable<string[]> = null,
        delayLoad = false,
        files: Nullable<string[]> = null,
        buffer: Nullable<ArrayBufferView> = null
    ): void {
        if (!this.name || this.name.startsWith("data:")) {
            this.name = url;
        }
        this.url = url;

        if (forcedExtension) {
            this._forcedExtension = forcedExtension;
        }

        const lastDot = url.lastIndexOf(".");
        const extension = forcedExtension ? forcedExtension : lastDot > -1 ? url.substring(lastDot).toLowerCase() : "";
        const isDDS = extension.indexOf(".dds") === 0;
        const isEnv = extension.indexOf(".env") === 0;
        const isBasis = extension.indexOf(".basis") === 0;

        if (isEnv) {
            this.gammaSpace = false;
            this._prefiltered = false;
            this.anisotropicFilteringLevel = 1;
        } else {
            this._prefiltered = prefiltered;

            if (prefiltered) {
                this.gammaSpace = false;
                this.anisotropicFilteringLevel = 1;
            }
        }

        if (files) {
            this._files = files;
        } else {
            if (!isBasis && !isEnv && !isDDS && !extensions) {
                extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
            }

            this._files = this._files || [];
            this._files.length = 0;

            if (extensions) {
                for (let index = 0; index < extensions.length; index++) {
                    this._files.push(url + extensions[index]);
                }
                this._extensions = extensions;
            }
        }

        this._buffer = buffer;

        if (delayLoad) {
            this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
            this._delayedOnLoad = onLoad;
            this._delayedOnError = onError;
        } else {
            this._loadTexture(onLoad, onError);
        }
    }

    /**
     * Delays loading of the cube texture
     * @param forcedExtension defines the extension to use
     */
    public override delayLoad(forcedExtension?: string): void {
        if (this.delayLoadState !== Constants.DELAYLOADSTATE_NOTLOADED) {
            return;
        }
        if (forcedExtension) {
            this._forcedExtension = forcedExtension;
        }

        this.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
        this._loadTexture(this._delayedOnLoad, this._delayedOnError);
    }

    /**
     * Returns the reflection texture matrix
     * @returns the reflection texture matrix
     */
    public override getReflectionTextureMatrix(): Matrix {
        return this._textureMatrix;
    }

    /**
     * Sets the reflection texture matrix
     * @param value Reflection texture matrix
     */
    public setReflectionTextureMatrix(value: Matrix): void {
        if (value.updateFlag === this._textureMatrix.updateFlag) {
            return;
        }

        if (value.isIdentity() !== this._textureMatrix.isIdentity()) {
            this.getScene()?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag, (mat) => mat.getActiveTextures().indexOf(this) !== -1);
        }

        this._textureMatrix = value;

        if (!this.getScene()?.useRightHandedSystem) {
            return;
        }

        const scale = TmpVectors.Vector3[0];
        const quat = TmpVectors.Quaternion[0];
        const trans = TmpVectors.Vector3[1];

        this._textureMatrix.decompose(scale, quat, trans);

        quat.z *= -1; // these two operations correspond to negating the x and y euler angles
        quat.w *= -1;

        Matrix.ComposeToRef(scale, quat, trans, this._textureMatrixRefraction);
    }

    /**
     * Gets a suitable rotate/transform matrix when the texture is used for refraction.
     * There's a separate function from getReflectionTextureMatrix because refraction requires a special configuration of the matrix in right-handed mode.
     * @returns The refraction matrix
     */
    public override getRefractionTextureMatrix(): Matrix {
        return this.getScene()?.useRightHandedSystem ? this._textureMatrixRefraction : this._textureMatrix;
    }

    private _loadTexture(onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null) {
        const scene = this.getScene();
        const oldTexture = this._texture;
        this._texture = this._getFromCache(this.url, this._noMipmap, undefined, undefined, this._useSRGBBuffer, this.isCube);

        const onLoadProcessing = () => {
            this.onLoadObservable.notifyObservers(this);
            if (oldTexture) {
                oldTexture.dispose();
                this.getScene()?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
            }
            if (onLoad) {
                onLoad();
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

        if (!this._texture) {
            if (this._prefiltered) {
                this._texture = this._getEngine()!.createPrefilteredCubeTexture(
                    this.url,
                    scene,
                    this._lodScale,
                    this._lodOffset,
                    onLoad,
                    errorHandler,
                    this._format,
                    this._forcedExtension,
                    this._createPolynomials
                );
            } else {
                this._texture = this._getEngine()!.createCubeTexture(
                    this.url,
                    scene,
                    this._files,
                    this._noMipmap,
                    onLoad,
                    errorHandler,
                    this._format,
                    this._forcedExtension,
                    false,
                    this._lodScale,
                    this._lodOffset,
                    null,
                    this._loaderOptions,
                    !!this._useSRGBBuffer,
                    this._buffer
                );
            }

            this._texture?.onLoadedObservable.add(() => this.onLoadObservable.notifyObservers(this));
        } else {
            if (this._texture.isReady) {
                Tools.SetImmediate(() => onLoadProcessing());
            } else {
                this._texture.onLoadedObservable.add(() => onLoadProcessing());
            }
        }
    }

    /**
     * Parses text to create a cube texture
     * @param parsedTexture define the serialized text to read from
     * @param scene defines the hosting scene
     * @param rootUrl defines the root url of the cube texture
     * @returns a cube texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture {
        const texture = SerializationHelper.Parse(
            () => {
                let prefiltered: boolean = false;
                if (parsedTexture.prefiltered) {
                    prefiltered = parsedTexture.prefiltered;
                }
                return new CubeTexture(
                    rootUrl + (parsedTexture.url ?? parsedTexture.name),
                    scene,
                    parsedTexture.extensions,
                    false,
                    parsedTexture.files || null,
                    null,
                    null,
                    undefined,
                    prefiltered,
                    parsedTexture.forcedExtension
                );
            },
            parsedTexture,
            scene
        );

        // Local Cubemaps
        if (parsedTexture.boundingBoxPosition) {
            texture.boundingBoxPosition = Vector3.FromArray(parsedTexture.boundingBoxPosition);
        }
        if (parsedTexture.boundingBoxSize) {
            texture.boundingBoxSize = Vector3.FromArray(parsedTexture.boundingBoxSize);
        }

        // Animations
        if (parsedTexture.animations) {
            for (let animationIndex = 0; animationIndex < parsedTexture.animations.length; animationIndex++) {
                const parsedAnimation = parsedTexture.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    texture.animations.push(internalClass.Parse(parsedAnimation));
                }
            }
        }

        return texture;
    }

    /**
     * Makes a clone, or deep copy, of the cube texture
     * @returns a new cube texture
     */
    public override clone(): CubeTexture {
        let uniqueId = 0;

        const newCubeTexture = SerializationHelper.Clone(() => {
            const cubeTexture = new CubeTexture(this.url, this.getScene() || this._getEngine()!, this._extensions, this._noMipmap, this._files);
            uniqueId = cubeTexture.uniqueId;

            return cubeTexture;
        }, this);

        newCubeTexture.uniqueId = uniqueId;

        return newCubeTexture;
    }
}

Texture._CubeTextureParser = CubeTexture.Parse;
// Some exporters relies on Tools.Instantiate
RegisterClass("BABYLON.CubeTexture", CubeTexture);
