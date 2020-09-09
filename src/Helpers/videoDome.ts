import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { VideoTexture, VideoTextureSettings } from "../Materials/Textures/videoTexture";
import { TextureDome } from "./textureDome";

declare type Camera = import("../Cameras/camera").Camera;

/**
 * Display a 360/180 degree video on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera or multiple videos with different locations in the scene.
 * This class achieves its effect with a VideoTexture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export class VideoDome extends TextureDome<VideoTexture> {
    /**
     * Define the video source as a Monoscopic panoramic 360 video.
     */
    public static readonly MODE_MONOSCOPIC = TextureDome.MODE_MONOSCOPIC;
    /**
     * Define the video source as a Stereoscopic TopBottom/OverUnder panoramic 360 video.
     */
    public static readonly MODE_TOPBOTTOM = TextureDome.MODE_TOPBOTTOM;
    /**
     * Define the video source as a Stereoscopic Side by Side panoramic 360 video.
     */
    public static readonly MODE_SIDEBYSIDE = TextureDome.MODE_SIDEBYSIDE;

    /**
     * Get the video texture associated with this video dome
     */
    public get videoTexture(): VideoTexture {
        return this._texture;
    }
    /**
     * Get the video mode of this dome
     */
    public get videoMode(): number {
        return this.textureMode;
    }
    /**
     * Set the video mode of this dome.
     * @see textureMode
     */
    public set videoMode(value: number) {
        this.textureMode = value;
    }

    protected _initTexture(urlsOrElement: string | string[] | HTMLVideoElement, scene: Scene, options: any): VideoTexture {
        const tempOptions: VideoTextureSettings = { loop: options.loop, autoPlay: options.autoPlay, autoUpdateTexture: true, poster: options.poster };
        const texture = new VideoTexture((this.name || "videoDome") + "_texture", urlsOrElement, scene, false, this._useDirectMapping, Texture.TRILINEAR_SAMPLINGMODE, tempOptions);
        // optional configuration
        if (options.clickToPlay) {
            scene.onPointerUp = () => {
                this._texture.video.play();
            };
        }
        return texture;
    }
}
