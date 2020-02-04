import { Observable, Observer } from "../Misc/observable";
import { Nullable } from "../types";
import { Scene } from "../scene";
import { TransformNode } from "../Meshes/transformNode";
import { Mesh } from "../Meshes/mesh";
import { Texture } from "../Materials/Textures/texture";
import { BackgroundMaterial } from "../Materials/Background/backgroundMaterial";
import "../Meshes/Builders/sphereBuilder";
import { Vector3 } from '../Maths/math.vector';
import { Camera } from '../Cameras/camera';

/**
 * Display a 360 degree photo on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera with different locations in the scene.
 * This class achieves its effect with a Texture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export class PhotoDome extends TransformNode {
    /**
     * Define the image as a Monoscopic panoramic 360 image.
     */
    public static readonly MODE_MONOSCOPIC = 0;
    /**
     * Define the image as a Stereoscopic TopBottom/OverUnder panoramic 360 image.
     */
    public static readonly MODE_TOPBOTTOM = 1;
    /**
     * Define the image as a Stereoscopic Side by Side panoramic 360 image.
     */
    public static readonly MODE_SIDEBYSIDE = 2;

    private _useDirectMapping = false;

    /**
     * The texture being displayed on the sphere
     */
    protected _photoTexture: Texture;

    /**
     * Gets or sets the texture being displayed on the sphere
     */
    public get photoTexture(): Texture {
        return this._photoTexture;
    }

    public set photoTexture(value: Texture) {
        if (this._photoTexture === value) {
            return;
        }
        this._photoTexture = value;
        if (this._useDirectMapping) {
            this._photoTexture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._photoTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._material.diffuseTexture = this._photoTexture;
        } else {
            this._photoTexture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches orientation
            this._photoTexture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._material.reflectionTexture = this._photoTexture;
        }
    }

    /**
     * Observable raised when an error occured while loading the 360 image
     */
    public onLoadErrorObservable = new Observable<string>();

    /**
     * The skybox material
     */
    protected _material: BackgroundMaterial;

    /**
     * The surface used for the skybox
     */
    protected _mesh: Mesh;
    /**
     * Gets the mesh used for the skybox.
     */
    public get mesh(): Mesh {
        return this._mesh;
    }

    /**
     * The current fov(field of view) multiplier, 0.0 - 2.0. Defaults to 1.0. Lower values "zoom in" and higher values "zoom out".
     * Also see the options.resolution property.
     */
    public get fovMultiplier(): number {
        return this._material.fovMultiplier;
    }
    public set fovMultiplier(value: number) {
        this._material.fovMultiplier = value;
    }

    private _imageMode = PhotoDome.MODE_MONOSCOPIC;
    /**
     * Gets or set the current video mode for the video. It can be:
     * * PhotoDome.MODE_MONOSCOPIC : Define the image as a Monoscopic panoramic 360 image.
     * * PhotoDome.MODE_TOPBOTTOM  : Define the image as a Stereoscopic TopBottom/OverUnder panoramic 360 image.
     * * PhotoDome.MODE_SIDEBYSIDE : Define the image as a Stereoscopic Side by Side panoramic 360 image.
     */
    public get imageMode(): number {
        return this._imageMode;
    }
    public set imageMode(value: number) {
        if (this._imageMode === value) {
            return;
        }

        this._changeImageMode(value);
    }

    /**
     * Create an instance of this class and pass through the parameters to the relevant classes, Texture, StandardMaterial, and Mesh.
     * @param name Element's name, child elements will append suffixes for their own names.
     * @param urlsOfPhoto defines the url of the photo to display
     * @param options defines an object containing optional or exposed sub element properties
     * @param onError defines a callback called when an error occured while loading the texture
     */
    constructor(name: string, urlOfPhoto: string, options: {
        resolution?: number,
        size?: number,
        useDirectMapping?: boolean,
        faceForward?: boolean
    }, scene: Scene, onError: Nullable<(message?: string, exception?: any) => void> = null) {
        super(name, scene);

        // set defaults and manage values
        name = name || "photoDome";
        options.resolution = (Math.abs(options.resolution as any) | 0) || 32;
        options.size = Math.abs(options.size as any) || (scene.activeCamera ? scene.activeCamera.maxZ * 0.48 : 1000);

        if (options.useDirectMapping === undefined) {
            this._useDirectMapping = true;
        } else {
            this._useDirectMapping = options.useDirectMapping;
        }

        if (options.faceForward === undefined) {
            options.faceForward = true;
        }

        this._setReady(false);

        // create
        let material = this._material = new BackgroundMaterial(name + "_material", scene);
        this._mesh = Mesh.CreateSphere(name + "_mesh", options.resolution, options.size, scene, false, Mesh.BACKSIDE);

        // configure material
        material.opacityFresnel = false;
        material.useEquirectangularFOV = true;
        material.fovMultiplier = 1.0;

        this.photoTexture = new Texture(urlOfPhoto, scene, true, !this._useDirectMapping, undefined, undefined, (message, exception) => {
            this.onLoadErrorObservable.notifyObservers(message || "Unknown error occured");

            if (onError) {
                onError(message, exception);
            }
        });
        this.photoTexture.anisotropicFilteringLevel = 1;

        this.photoTexture.onLoadObservable.addOnce(() => {
            this._setReady(true);
        });

        // configure mesh
        this._mesh.material = material;
        this._mesh.parent = this;

        // Initial rotation
        if (options.faceForward && scene.activeCamera) {
            let camera = scene.activeCamera;

            let forward = Vector3.Forward();
            var direction = Vector3.TransformNormal(forward, camera.getViewMatrix());
            direction.normalize();

            this.rotation.y = Math.acos(Vector3.Dot(forward, direction));
        }
    }

    private _onBeforeCameraRenderObserver: Nullable<Observer<Camera>> = null;

    private _changeImageMode(value: number): void {
        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this._imageMode = value;

        // Default Setup and Reset.
        this._photoTexture.uScale = 1;
        this._photoTexture.vScale = 1;
        this._photoTexture.uOffset = 0;
        this._photoTexture.vOffset = 0;

        switch (value) {
            case PhotoDome.MODE_SIDEBYSIDE:
                this._photoTexture.uScale = 0.5;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    this._photoTexture.uOffset = camera.isRightCamera ? 0.5 : 0.0;
                });
                break;
            case PhotoDome.MODE_TOPBOTTOM:
                this._photoTexture.vScale = 0.5;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    this._photoTexture.vOffset = camera.isRightCamera ? 0.5 : 0.0;
                });
                break;
        }
    }

    /**
     * Releases resources associated with this node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        this._photoTexture.dispose();
        this._mesh.dispose();
        this._material.dispose();

        this.onLoadErrorObservable.clear();

        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);

        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
