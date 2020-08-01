import { Scene } from "../scene";
import { TransformNode } from "../Meshes/transformNode";
import { Mesh } from "../Meshes/mesh";
import { Texture } from "../Materials/Textures/texture";
import { VideoTexture, VideoTextureSettings } from "../Materials/Textures/videoTexture";
import { BackgroundMaterial } from "../Materials/Background/backgroundMaterial";
import "../Meshes/Builders/sphereBuilder";
import { Nullable } from "../types";
import { Observer } from "../Misc/observable";
import { Vector3 } from "../Maths/math.vector";
import { Axis } from "../Maths/math";
import { SphereBuilder } from "../Meshes/Builders/sphereBuilder";

declare type Camera = import("../Cameras/camera").Camera;

/**
 * Display a 360/180 degree video on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera or multiple videos with different locations in the scene.
 * This class achieves its effect with a VideoTexture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export class VideoDome extends TransformNode {
    /**
     * Define the video source as a Monoscopic panoramic 360 video.
     */
    public static readonly MODE_MONOSCOPIC = 0;
    /**
     * Define the video source as a Stereoscopic TopBottom/OverUnder panoramic 360 video.
     */
    public static readonly MODE_TOPBOTTOM = 1;
    /**
     * Define the video source as a Stereoscopic Side by Side panoramic 360 video.
     */
    public static readonly MODE_SIDEBYSIDE = 2;

    private _halfDome: boolean = false;

    private _useDirectMapping = false;

    /**
     * The video texture being displayed on the sphere
     */
    protected _videoTexture: VideoTexture;

    /**
     * Gets the video texture being displayed on the sphere
     */
    public get videoTexture(): VideoTexture {
        return this._videoTexture;
    }

    /**
     * The skybox material
     */
    protected _material: BackgroundMaterial;

    /**
     * The surface used for the video dome
     */
    protected _mesh: Mesh;
    /**
     * Gets the mesh used for the video dome.
     */
    public get mesh(): Mesh {
        return this._mesh;
    }

    /**
     * A mesh that will be used to mask the back of the video dome in case it is a 180 degree movie.
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

    private _videoMode = VideoDome.MODE_MONOSCOPIC;
    /**
     * Gets or set the current video mode for the video. It can be:
     * * VideoDome.MODE_MONOSCOPIC : Define the video source as a Monoscopic panoramic 360 video.
     * * VideoDome.MODE_TOPBOTTOM  : Define the video source as a Stereoscopic TopBottom/OverUnder panoramic 360 video.
     * * VideoDome.MODE_SIDEBYSIDE : Define the video source as a Stereoscopic Side by Side panoramic 360 video.
     */
    public get videoMode(): number {
        return this._videoMode;
    }
    public set videoMode(value: number) {
        if (this._videoMode === value) {
            return;
        }

        this._changeVideoMode(value);
    }

    /**
     * Is the video a 180 degrees video (half dome) or 360 video (full dome)
     *
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
     * Create an instance of this class and pass through the parameters to the relevant classes, VideoTexture, StandardMaterial, and Mesh.
     * @param name Element's name, child elements will append suffixes for their own names.
     * @param urlsOrVideo defines the url(s) or the video element to use
     * @param options An object containing optional or exposed sub element properties
     */
    constructor(
        name: string,
        urlsOrVideo: string | string[] | HTMLVideoElement,
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
        scene: Scene
    ) {
        super(name, scene);

        scene = this.getScene();

        // set defaults and manage values
        name = name || "videoDome";
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

        // create
        let tempOptions: VideoTextureSettings = { loop: options.loop, autoPlay: options.autoPlay, autoUpdateTexture: true, poster: options.poster };
        let material = (this._material = new BackgroundMaterial(name + "_material", scene));
        let texture = (this._videoTexture = new VideoTexture(name + "_texture", urlsOrVideo, scene, false, this._useDirectMapping, Texture.TRILINEAR_SAMPLINGMODE, tempOptions));
        this._mesh = Mesh.CreateSphere(name + "_mesh", options.resolution, options.size, scene, false, Mesh.BACKSIDE);
        texture.anisotropicFilteringLevel = 1;
        texture.onLoadObservable.addOnce(() => {
            this._setReady(true);
        });

        // configure material
        material.useEquirectangularFOV = true;
        material.fovMultiplier = 1.0;
        material.opacityFresnel = false;

        if (this._useDirectMapping) {
            texture.wrapU = Texture.CLAMP_ADDRESSMODE;
            texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            material.diffuseTexture = texture;
        } else {
            texture.coordinatesMode = Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE; // matches orientation
            texture.wrapV = Texture.CLAMP_ADDRESSMODE;
            material.reflectionTexture = texture;
        }

        // configure mesh
        this._mesh.material = material;
        this._mesh.parent = this;

        // create a (disabled until needed) mask to cover unneeded segments of 180 videos.
        this._halfDomeMask = SphereBuilder.CreateSphere("", { slice: 0.5, diameter: options.size * 0.99, segments: options.resolution, sideOrientation: Mesh.BACKSIDE }, scene);
        this._halfDomeMask.rotate(Axis.X, -Math.PI / 2);
        // set the parent, so it will always be positioned correctly AND will be disposed when the main sphere is disposed
        this._halfDomeMask.parent = this._mesh;
        this._halfDome = !!options.halfDomeMode;
        // enable or disable according to the settings
        this._halfDomeMask.setEnabled(this._halfDome);

        // optional configuration
        if (options.clickToPlay) {
            scene.onPointerUp = () => {
                this._videoTexture.video.play();
            };
        }

        // Initial rotation
        if (options.faceForward && scene.activeCamera) {
            let camera = scene.activeCamera;

            let forward = Vector3.Forward();
            var direction = Vector3.TransformNormal(forward, camera.getViewMatrix());
            direction.normalize();

            this.rotation.y = Math.acos(Vector3.Dot(forward, direction));
        }

        this._changeVideoMode(this._videoMode);
    }

    private _changeVideoMode(value: number): void {
        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
        this._videoMode = value;

        // Default Setup and Reset.
        this._videoTexture.uScale = 1;
        this._videoTexture.vScale = 1;
        this._videoTexture.uOffset = 0;
        this._videoTexture.vOffset = 0;

        switch (value) {
            case VideoDome.MODE_MONOSCOPIC:
                if (this._halfDome) {
                    this._videoTexture.uScale = 2;
                }
                break;
            case VideoDome.MODE_SIDEBYSIDE:
                // in half-dome mode the uScale should be double of 360 videos
                // Use 0.99999 to boost perf by not switching program
                this._videoTexture.uScale = this._halfDome ? 0.99999 : 0.5;
                const rightOffset = this._halfDome ? 0.0 : 0.5;
                const leftOffset = this._halfDome ? 0.5 : 0.0;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    this._videoTexture.uOffset = camera.isRightCamera ? rightOffset : leftOffset;
                });
                break;
            case VideoDome.MODE_TOPBOTTOM:
                // in half-dome mode the vScale should be double of 360 videos
                // Use 0.99999 to boost perf by not switching program
                this._videoTexture.vScale = this._halfDome ? 0.99999 : 0.5;
                this._onBeforeCameraRenderObserver = this._scene.onBeforeCameraRenderObservable.add((camera) => {
                    this._videoTexture.vOffset = camera.isRightCamera ? 0.5 : 0.0;
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
        this._videoTexture.dispose();
        this._mesh.dispose();
        this._material.dispose();

        this._scene.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);

        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
