import { serialize, serializeAsMatrix, SerializationHelper } from "../../Misc/decorators";
import { Tools } from "../../Misc/tools";
import { Nullable } from "../../types";
import { Scene } from "../../scene";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import { _TypeStore } from '../../Misc/typeStore';
import { ThinEngine } from '../../Engines/thinEngine';

import "../../Engines/Extensions/engine.cubeTexture";
import { StringTools } from '../../Misc/stringTools';
import { Observable } from '../../Misc/observable';

/**
 * Class for creating a cube texture
 */
export class CubeTexture extends BaseTexture {
    private _delayedOnLoad: Nullable<() => void>;

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
     * @see http://doc.babylonjs.com/how_to/reflect#using-local-cubemap-mode
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
        let scene = this.getScene();
        if (scene) {
            scene.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }
    }
    /**
     * Returns the bounding box size
     * @see http://doc.babylonjs.com/how_to/reflect#using-local-cubemap-mode
     */
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
    public get noMipmap(): boolean {
        return this._noMipmap;
    }

    private _noMipmap: boolean;

    @serialize("files")
    private _files: Nullable<string[]> = null;

    @serialize("forcedExtension")
    protected _forcedExtension: Nullable<string> = null;

    @serialize("extensions")
    private _extensions: Nullable<string[]> = null;

    @serializeAsMatrix("textureMatrix")
    private _textureMatrix: Matrix;

    private _format: number;
    private _createPolynomials: boolean;

    /** @hidden */
    public _prefiltered: boolean = false;

    /**
     * Creates a cube texture from an array of image urls
     * @param files defines an array of image urls
     * @param scene defines the hosting scene
     * @param noMipmap specifies if mip maps are not used
     * @returns a cube texture
     */
    public static CreateFromImages(files: string[], scene: Scene, noMipmap?: boolean): CubeTexture {
        let rootUrlKey = "";

        files.forEach((url) => rootUrlKey += url);

        return new CubeTexture(rootUrlKey, scene, null, noMipmap, files);
    }

    /**
     * Creates and return a texture created from prefilterd data by tools like IBL Baker or Lys.
     * @param url defines the url of the prefiltered texture
     * @param scene defines the scene the texture is attached to
     * @param forcedExtension defines the extension of the file if different from the url
     * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
     * @return the prefiltered texture
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
     * @param null defines the scene or engine the texture is attached to
     * @param extensions defines the suffixes add to the picture name in case six images are in use like _px.jpg...
     * @param noMipmap defines if mipmaps should be created or not
     * @param files defines the six files to load for the different faces in that order: px, py, pz, nx, ny, nz
     * @param onLoad defines a callback triggered at the end of the file load if no errors occured
     * @param onError defines a callback triggered in case of error during load
     * @param format defines the internal format to use for the texture once loaded
     * @param prefiltered defines whether or not the texture is created from prefiltered data
     * @param forcedExtension defines the extensions to use (force a special type of file to load) in case it is different from the file name
     * @param createPolynomials defines whether or not to create polynomial harmonics from the texture data if necessary
     * @param lodScale defines the scale applied to environment texture. This manages the range of LOD level used for IBL according to the roughness
     * @param lodOffset defines the offset applied to environment texture. This manages first LOD level used for IBL according to the roughness
     * @return the cube texture
     */
    constructor(rootUrl: string, sceneOrEngine: Scene | ThinEngine, extensions: Nullable<string[]> = null, noMipmap: boolean = false, files: Nullable<string[]> = null,
        onLoad: Nullable<() => void> = null, onError: Nullable<(message?: string, exception?: any) => void> = null, format: number = Constants.TEXTUREFORMAT_RGBA, prefiltered = false,
        forcedExtension: any = null, createPolynomials: boolean = false,
        lodScale: number = 0.8, lodOffset: number = 0) {
        super(sceneOrEngine);

        this.name = rootUrl;
        this.url = rootUrl;
        this._noMipmap = noMipmap;
        this.hasAlpha = false;
        this._format = format;
        this.isCube = true;
        this._textureMatrix = Matrix.Identity();
        this._createPolynomials = createPolynomials;
        this.coordinatesMode = Texture.CUBIC_MODE;
        this._extensions = extensions;
        this._files = files;
        this._forcedExtension = forcedExtension;

        if (!rootUrl && !files) {
            return;
        }

        const lastDot = rootUrl.lastIndexOf(".");
        const extension = forcedExtension ? forcedExtension : (lastDot > -1 ? rootUrl.substring(lastDot).toLowerCase() : "");
        const isDDS = (extension === ".dds");
        const isEnv = (extension === ".env");

        if (isEnv) {
            this.gammaSpace = false;
            this._prefiltered = false;
            this.anisotropicFilteringLevel = 1;
        }
        else {
            this._prefiltered = prefiltered;

            if (prefiltered) {
                this.gammaSpace = false;
                this.anisotropicFilteringLevel = 1;
            }
        }

        this._texture = this._getFromCache(rootUrl, noMipmap);

        if (!files) {
            if (!isEnv && !isDDS && !extensions) {
                extensions = ["_px.jpg", "_py.jpg", "_pz.jpg", "_nx.jpg", "_ny.jpg", "_nz.jpg"];
            }

            files = [];

            if (extensions) {

                for (var index = 0; index < extensions.length; index++) {
                    files.push(rootUrl + extensions[index]);
                }
            }
        }

        this._files = files;

        let onLoadProcessing = () => {
            this.onLoadObservable.notifyObservers(this);
            if (onLoad) {
                onLoad();
            }
        };

        if (!this._texture) {
            const scene = this.getScene();
            if (!scene?.useDelayedTextureLoading) {
                if (prefiltered) {
                    this._texture = this._getEngine()!.createPrefilteredCubeTexture(rootUrl, scene, lodScale, lodOffset, onLoad, onError, format, forcedExtension, this._createPolynomials);
                }
                else {
                    this._texture = this._getEngine()!.createCubeTexture(rootUrl, scene, files, noMipmap, onLoad, onError, this._format, forcedExtension, false, lodScale, lodOffset);
                }
                this._texture?.onLoadedObservable.add(() => this.onLoadObservable.notifyObservers(this));

            } else {
                this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
            }
        } else {
            if (this._texture.isReady) {
                Tools.SetImmediate(() => onLoadProcessing());
            } else {
                this._texture.onLoadedObservable.add(() => onLoadProcessing());
            }
        }
    }

    /**
     * Gets a boolean indicating if the cube texture contains prefiltered mips (used to simulate roughness with PBR)
     */
    public get isPrefiltered(): boolean {
        return this._prefiltered;
    }

    /**
     * Get the current class name of the texture useful for serialization or dynamic coding.
     * @returns "CubeTexture"
     */
    public getClassName(): string {
        return "CubeTexture";
    }

    /**
     * Update the url (and optional buffer) of this texture if url was null during construction.
     * @param url the url of the texture
     * @param forcedExtension defines the extension to use
     * @param onLoad callback called when the texture is loaded  (defaults to null)
     * @param prefiltered Defines whether the updated texture is prefiltered or not
     */
    public updateURL(url: string, forcedExtension?: string, onLoad?: () => void, prefiltered: boolean = false): void {
        if (this.url) {
            this.releaseInternalTexture();
            this.getScene()?.markAllMaterialsAsDirty(Constants.MATERIAL_TextureDirtyFlag);
        }

        if (!this.name || StringTools.StartsWith(this.name, "data:")) {
            this.name = url;
        }
        this.url = url;
        this.delayLoadState = Constants.DELAYLOADSTATE_NOTLOADED;
        this._prefiltered = prefiltered;
        if (this._prefiltered) {
            this.gammaSpace = false;
            this.anisotropicFilteringLevel = 1;
        }
        this._forcedExtension = forcedExtension || null;

        if (onLoad) {
            this._delayedOnLoad = onLoad;
        }

        this.delayLoad(forcedExtension);
    }

    /**
     * Delays loading of the cube texture
     * @param forcedExtension defines the extension to use
     */
    public delayLoad(forcedExtension?: string): void {
        if (this.delayLoadState !== Constants.DELAYLOADSTATE_NOTLOADED) {
            return;
        }

        this.delayLoadState = Constants.DELAYLOADSTATE_LOADED;
        this._texture = this._getFromCache(this.url, this._noMipmap);

        if (!this._texture) {
            const scene = this.getScene();
            if (this._prefiltered) {
                this._texture = this._getEngine()!.createPrefilteredCubeTexture(this.url, scene, 0.8, 0, this._delayedOnLoad, undefined, this._format, undefined, this._createPolynomials);
            }
            else {
                this._texture = this._getEngine()!.createCubeTexture(this.url, scene, this._files, this._noMipmap, this._delayedOnLoad, null, this._format, forcedExtension);
            }

            this._texture?.onLoadedObservable.add(() => this.onLoadObservable.notifyObservers(this));
        }
    }

    /**
     * Returns the reflection texture matrix
     * @returns the reflection texture matrix
     */
    public getReflectionTextureMatrix(): Matrix {
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
    }

    /**
     * Parses text to create a cube texture
     * @param parsedTexture define the serialized text to read from
     * @param scene defines the hosting scene
     * @param rootUrl defines the root url of the cube texture
     * @returns a cube texture
     */
    public static Parse(parsedTexture: any, scene: Scene, rootUrl: string): CubeTexture {
        var texture = SerializationHelper.Parse(() => {
            var prefiltered: boolean = false;
            if (parsedTexture.prefiltered) {
                prefiltered = parsedTexture.prefiltered;
            }
            return new CubeTexture(rootUrl + parsedTexture.name, scene, parsedTexture.extensions, false, parsedTexture.files || null, null, null, undefined, prefiltered, parsedTexture.forcedExtension);
        }, parsedTexture, scene);

        // Local Cubemaps
        if (parsedTexture.boundingBoxPosition) {
            texture.boundingBoxPosition = Vector3.FromArray(parsedTexture.boundingBoxPosition);
        }
        if (parsedTexture.boundingBoxSize) {
            texture.boundingBoxSize = Vector3.FromArray(parsedTexture.boundingBoxSize);
        }

        // Animations
        if (parsedTexture.animations) {
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
     * Makes a clone, or deep copy, of the cube texture
     * @returns a new cube texture
     */
    public clone(): CubeTexture {
        let uniqueId = 0;

        let newCubeTexture = SerializationHelper.Clone(() => {
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
_TypeStore.RegisteredTypes["BABYLON.CubeTexture"] = CubeTexture;
