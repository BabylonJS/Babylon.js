import { Scene } from "../scene";
import { TransformNode } from "../Meshes/transformNode";
import { Mesh } from "../Meshes/mesh";
import { Texture } from "../Materials/Textures/texture";
import { BackgroundMaterial } from "../Materials/Background/backgroundMaterial";
import "../Meshes/Builders/sphereBuilder";
import { Nullable } from "../types";
import { Observer, Observable } from "../Misc/observable";
import { Vector3 } from "../Maths/math.vector";
import { Axis } from "../Maths/math";
import { SphereBuilder } from "../Meshes/Builders/sphereBuilder";

declare type Camera = import("../Cameras/camera").Camera;

/**
 * Display a 360/180 degree texture on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera or multiple textures with different locations in the scene.
 * This class achieves its effect with a Texture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export abstract class TextureDome<T extends Texture> extends TransformNode {
    /**
     * Define the source as a Monoscopic panoramic 360/180.
     */
    public static readonly MODE_MONOSCOPIC = 0;
    /**
     * Define the source as a Stereoscopic TopBottom/OverUnder panoramic 360/180.
     */
    public static readonly MODE_TOPBOTTOM = 1;
    /**
     * Define the source as a Stereoscopic Side by Side panoramic 360/180.
     */
    public static readonly MODE_SIDEBYSIDE = 2;

    private _halfDome: boolean = false;

    protected _useDirectMapping = false;

    /**
     * The texture being displayed on the sphere
     */
    protected _texture: T;

    /**
     * Gets the texture being displayed on the sphere
     */
    public get texture(): T {
        return this._texture;
    }

    /**
     * Sets the texture being displayed on the sphere
     */
    public set texture(newTexture: T) {
        if (this._texture === newTexture) {
            return;
        }
        this._texture = newTexture;
        if (this._useDirectMapping) {
            this._texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._material.diffuseTexture = this._texture;
        } else {
            this._texture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches orientation
            this._texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._material.reflectionTexture = this._texture;
        }
    }

    /**
     * The skybox material
     */
    protected _material: BackgroundMaterial;

    /**
     * The surface used for the dome
     */
    protected _mesh: Mesh;
    /**
     * Gets the mesh used for the dome.
     */
    public get mesh(): Mesh {
        return this._mesh;
    }

    /**
     * A mesh that will be used to mask the back of the dome in case it is a 180 degree movie.
     */
    private _halfDomeMask: Mesh;

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

    protected _textureMode = TextureDome.MODE_MONOSCOPIC;
    /**
     * Gets or set the current texture mode for the texture. It can be:
     * * TextureDome.MODE_MONOSCOPIC : Define the texture source as a Monoscopic panoramic 360.
     * * TextureDome.MODE_TOPBOTTOM  : Define the texture source as a Stereoscopic TopBottom/OverUnder panoramic 360.
     * * TextureDome.MODE_SIDEBYSIDE : Define the texture source as a Stereoscopic Side by Side panoramic 360.
     */
    public get textureMode(): number {
        return this._textureMode;
    }
    /**
     * Sets the current texture mode for the texture. It can be:
      * * TextureDome.MODE_MONOSCOPIC : Define the texture source as a Monoscopic panoramic 360.
     * * TextureDome.MODE_TOPBOTTOM  : Define the texture source as a Stereoscopic TopBottom/OverUnder panoramic 360.
     * * TextureDome.MODE_SIDEBYSIDE : Define the texture source as a Stereoscopic Side by Side panoramic 360.
     */
    public set textureMode(value: number) {
        if (this._textureMode === value) {
            return;
        }

        this._changeTextureMode(value);
    }

    /**
     * Is it a 180 degrees dome (half dome) or 360 texture (full dome)
     */
    public get halfDome(): boolean {
        return this._halfDome;
    }

    /**
     * Set the halfDome mode. If set, only the front (180 degrees) will be displayed and the back will be blacked out.
     */
    public set halfDome(enabled: boolean) {
        this._halfDome = enabled;
        this._halfDomeMask.setEnabled(enabled);
    }

    /**
     * Oberserver used in Stereoscopic VR Mode.
     */
    private _onBeforeCameraRenderObserver: Nullable<Observer<Camera>> = null;
    /**
     * Observable raised when an error occured while loading the 360 image
     */
    public onLoadErrorObservable = new Observable<string>();

    /**
     * Create an instance of this class and pass through the parameters to the relevant classes- Texture, StandardMaterial, and Mesh.
     * @param name Element's name, child elements will append suffixes for their own names.
     * @param textureUrlOrElement defines the url(s) or the (video) HTML element to use
     * @param options An object containing optional or exposed sub element properties
     */
    constructor(
        name: string,
        textureUrlOrElement: string | string[] | HTMLVideoElement,
        options: {
            resolution?: number;
            clickToPlay?: boolean;
            autoPlay?: boolean;
            loop?: boolean;
            size?: number;
            poster?: string;
            faceForward?: boolean;
            useDirectMapping?: boolean;
            halfDomeMode?: boolean;
        },
        scene: Scene,
        protected onError: Nullable<(message?: string, exception?: any) => void> = null
    ) {
        super(name, scene);

        scene = this.getScene();

        // set defaults and manage values
        name = name || "textureDome";
        options.resolution = Math.abs(options.resolution as any) | 0 || 32;
        options.clickToPlay = Boolean(options.clickToPlay);
        options.autoPlay = options.autoPlay === undefined ? true : Boolean(options.autoPlay);
        options.loop = options.loop === undefined ? true : Boolean(options.loop);
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
        this._mesh = Mesh.CreateSphere(name + "_mesh", options.resolution, options.size, scene, false, Mesh.BACKSIDE);
        // configure material
        let material = (this._material = new BackgroundMaterial(name + "_material", scene));
        material.useEquirectangularFOV = true;
        material.fovMultiplier = 1.0;
        material.opacityFresnel = false;

        const texture = this._initTexture(textureUrlOrElement, scene, options);
        this.texture = texture;

        // configure mesh
        this._mesh.material = material;
        this._mesh.parent = this;

        // create a (disabled until needed) mask to cover unneeded segments of 180 texture.
        this._halfDomeMask = SphereBuilder.CreateSphere("", { slice: 0.5, diameter: options.size * 0.98, segments: options.resolution * 2, sideOrientation: Mesh.BACKSIDE }, scene);
        this._halfDomeMask.rotate(Axis.X, -Math.PI / 2);
        // set the parent, so it will always be positioned correctly AND will be disposed when the main sphere is disposed
        this._halfDomeMask.parent = this._mesh;
        this._halfDome = !!options.halfDomeMode;
        // enable or disable according to the settings
        this._halfDomeMask.setEnabled(this._halfDome);

        // create
        this._texture.anisotropicFilteringLevel = 1;
        this._texture.onLoadObservable.addOnce(() => {
            this._setReady(true);
        });

        // Initial rotation
        if (options.faceForward && scene.activeCamera) {
            let camera = scene.activeCamera;

            let forward = Vector3.Forward();
            var direction = Vector3.TransformNormal(forward, camera.getViewMatrix());
            direction.normalize();

            this.rotation.y = Math.acos(Vector3.Dot(forward, direction));
        }

        this._changeTextureMode(this._textureMode);
    }

    protected abstract _initTexture(urlsOrElement: string | string[] | HTMLElement, scene: Scene, options: any): T;

    protected _changeTextureMode(value: number): void {
        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this._textureMode = value;

        // Default Setup and Reset.
        this._texture.uScale = 1;
        this._texture.vScale = 1;
        this._texture.uOffset = 0;
        this._texture.vOffset = 0;

        switch (value) {
            case TextureDome.MODE_MONOSCOPIC:
                if (this._halfDome) {
                    this._texture.uScale = 2;
                    this._texture.uOffset = -1;
                }
                break;
            case TextureDome.MODE_SIDEBYSIDE:
                // in half-dome mode the uScale should be double of 360 texture
                // Use 0.99999 to boost perf by not switching program
                this._texture.uScale = this._halfDome ? 0.99999 : 0.5;
                const rightOffset = this._halfDome ? 0.0 : 0.5;
                const leftOffset = this._halfDome ? 0.5 : 0.0;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    this._texture.uOffset = camera.isRightCamera ? rightOffset : leftOffset;
                });
                break;
            case TextureDome.MODE_TOPBOTTOM:
                // in half-dome mode the vScale should be double of 360 texture
                // Use 0.99999 to boost perf by not switching program
                this._texture.vScale = this._halfDome ? 0.99999 : 0.5;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    this._texture.vOffset = camera.isRightCamera ? 0.5 : 0.0;
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
        this._texture.dispose();
        this._mesh.dispose();
        this._material.dispose();

        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this.onLoadErrorObservable.clear();

        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
