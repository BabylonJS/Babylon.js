import { Scene } from "../scene";
import { TransformNode } from "../Meshes/transformNode";
import { Mesh } from "../Meshes/mesh";
import { _TimeToken } from "../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
import { Texture } from "../Materials/Textures/texture";
import { VideoTexture, VideoTextureSettings } from "../Materials/Textures/videoTexture";
import { BackgroundMaterial } from "../Materials/Background/backgroundMaterial";
import "../Meshes/Builders/sphereBuilder";

/**
 * Display a 360 degree video on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera or multiple videos with different locations in the scene.
 * This class achieves its effect with a VideoTexture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export class VideoDome extends TransformNode {
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
     * The surface used for the skybox
     */
    protected _mesh: Mesh;

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

    /**
     * Create an instance of this class and pass through the parameters to the relevant classes, VideoTexture, StandardMaterial, and Mesh.
     * @param name Element's name, child elements will append suffixes for their own names.
     * @param urlsOrVideo defines the url(s) or the video element to use
     * @param options An object containing optional or exposed sub element properties
     */
    constructor(name: string, urlsOrVideo: string | string[] | HTMLVideoElement, options: {
        resolution?: number,
        clickToPlay?: boolean,
        autoPlay?: boolean,
        loop?: boolean,
        size?: number,
        poster?: string,
        useDirectMapping?: boolean
    }, scene: Scene) {
        super(name, scene);

        // set defaults and manage values
        name = name || "videoDome";
        options.resolution = (Math.abs(options.resolution as any) | 0) || 32;
        options.clickToPlay = Boolean(options.clickToPlay);
        options.autoPlay = options.autoPlay === undefined ? true : Boolean(options.autoPlay);
        options.loop = options.loop === undefined ? true : Boolean(options.loop);
        options.size = Math.abs(options.size as any) || (scene.activeCamera ? scene.activeCamera.maxZ * 0.48 : 1000);

        if (options.useDirectMapping === undefined) {
            this._useDirectMapping = true;
        } else {
            this._useDirectMapping = options.useDirectMapping;
        }

        this._setReady(false);

        // create
        let tempOptions: VideoTextureSettings = { loop: options.loop, autoPlay: options.autoPlay, autoUpdateTexture: true, poster: options.poster };
        let material = this._material = new BackgroundMaterial(name + "_material", scene);
        let texture = this._videoTexture = new VideoTexture(name + "_texture", urlsOrVideo, scene, false, this._useDirectMapping, Texture.TRILINEAR_SAMPLINGMODE, tempOptions);
        this._mesh = Mesh.CreateSphere(name + "_mesh", options.resolution, options.size, scene, false, Mesh.BACKSIDE);

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

        // optional configuration
        if (options.clickToPlay) {
            scene.onPointerUp = () => {
                this._videoTexture.video.play();
            };
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

        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
