import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { TextureDome } from "./textureDome";

/**
 * Display a 360 degree photo on an approximately spherical surface, useful for VR applications or skyboxes.
 * As a subclass of TransformNode, this allow parenting to the camera with different locations in the scene.
 * This class achieves its effect with a Texture and a correctly configured BackgroundMaterial on an inverted sphere.
 * Potential additions to this helper include zoom and and non-infinite distance rendering effects.
 */
export class PhotoDome extends TextureDome<Texture> {
    /**
     * Define the image as a Monoscopic panoramic 360 image.
     */
    public static readonly MODE_MONOSCOPIC = TextureDome.MODE_MONOSCOPIC;
    /**
     * Define the image as a Stereoscopic TopBottom/OverUnder panoramic 360 image.
     */
    public static readonly MODE_TOPBOTTOM = TextureDome.MODE_TOPBOTTOM;
    /**
     * Define the image as a Stereoscopic Side by Side panoramic 360 image.
     */
    public static readonly MODE_SIDEBYSIDE = TextureDome.MODE_SIDEBYSIDE;
    /**
     * Gets or sets the texture being displayed on the sphere
     */
    public get photoTexture(): Texture {
        return this.texture;
    }

    /**
     * sets the texture being displayed on the sphere
     */
    public set photoTexture(value: Texture) {
        this.texture = value;
    }

    /**
     * Gets the current video mode for the video. It can be:
     * * TextureDome.MODE_MONOSCOPIC : Define the texture source as a Monoscopic panoramic 360.
     * * TextureDome.MODE_TOPBOTTOM  : Define the texture source as a Stereoscopic TopBottom/OverUnder panoramic 360.
     * * TextureDome.MODE_SIDEBYSIDE : Define the texture source as a Stereoscopic Side by Side panoramic 360.
     */
    public get imageMode(): number {
        return this.textureMode;
    }
    /**
     * Sets the current video mode for the video. It can be:
     * * TextureDome.MODE_MONOSCOPIC : Define the texture source as a Monoscopic panoramic 360.
     * * TextureDome.MODE_TOPBOTTOM  : Define the texture source as a Stereoscopic TopBottom/OverUnder panoramic 360.
     * * TextureDome.MODE_SIDEBYSIDE : Define the texture source as a Stereoscopic Side by Side panoramic 360.
     */
    public set imageMode(value: number) {
        this.textureMode = value;
    }

    protected _initTexture(urlsOrElement: string, scene: Scene, options: any): Texture {
        return new Texture(urlsOrElement, scene, true, !this._useDirectMapping, undefined, undefined, (message, exception) => {
            this.onLoadErrorObservable.notifyObservers(message || "Unknown error occured");

            if (this.onError) {
                this.onError(message, exception);
            }
        });
    }
}
