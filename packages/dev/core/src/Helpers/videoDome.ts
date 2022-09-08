import type { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import type { VideoTextureSettings } from "../Materials/Textures/videoTexture";
import { VideoTexture } from "../Materials/Textures/videoTexture";
import { TextureDome } from "./textureDome";
import type { Nullable } from "../types";
import type { Observer } from "../Misc/observable";
import { DeviceSourceManager } from "../DeviceInput/InputDevices/deviceSourceManager";
import { DeviceType, PointerInput } from "../DeviceInput/InputDevices/deviceEnums";
import type { IPointerEvent, IWheelEvent } from "../Events/deviceInputEvents";
import type { DeviceSourceType } from "../DeviceInput/internalDeviceSourceManager";

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

    private _textureObserver: Nullable<Observer<Texture>>;
    private _deviceSourceManager: Nullable<DeviceSourceManager> = null;
    private _connectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _disconnectedObserver: Nullable<Observer<DeviceSourceType>>;
    private _mouseObserver: Nullable<Observer<IPointerEvent | IWheelEvent>>;
    private _touchObservers: Array<Nullable<Observer<IPointerEvent>>> = [];

    protected _initTexture(urlsOrElement: string | string[] | HTMLVideoElement, scene: Scene, options: any): VideoTexture {
        const tempOptions: VideoTextureSettings = { loop: options.loop, autoPlay: options.autoPlay, autoUpdateTexture: true, poster: options.poster };
        const texture = new VideoTexture(
            (this.name || "videoDome") + "_texture",
            urlsOrElement,
            scene,
            options.generateMipMaps,
            this._useDirectMapping,
            Texture.TRILINEAR_SAMPLINGMODE,
            tempOptions
        );
        // optional configuration
        if (options.clickToPlay) {
            this._deviceSourceManager = new DeviceSourceManager(scene.getEngine());
            this._connectedObserver = this._deviceSourceManager.onDeviceConnectedObservable.add((deviceSource) => {
                if (deviceSource.deviceType === DeviceType.Mouse) {
                    this._mouseObserver = deviceSource.onInputChangedObservable.add((eventData) => {
                        if (
                            !("deltaY" in eventData) &&
                            (eventData.inputIndex === PointerInput.LeftClick ||
                                eventData.inputIndex === PointerInput.MiddleClick ||
                                eventData.inputIndex === PointerInput.RightClick)
                        ) {
                            if (deviceSource.getInput(eventData.inputIndex) === 1) {
                                this._texture.video.play();
                            }
                        }
                    });
                }

                if (deviceSource.deviceType === DeviceType.Touch) {
                    this._touchObservers.push(
                        deviceSource.onInputChangedObservable.add((eventData) => {
                            if (eventData.inputIndex === PointerInput.LeftClick) {
                                if (deviceSource.getInput(eventData.inputIndex) === 1) {
                                    this._texture.video.play();
                                }
                            }
                        })
                    );
                }
            });
        }
        this._textureObserver = texture.onLoadObservable.add(() => {
            this.onLoadObservable.notifyObservers();
        });
        return texture;
    }

    /**
     * Releases resources associated with this node.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        this._texture.onLoadObservable.remove(this._textureObserver);
        this._deviceSourceManager?.onDeviceConnectedObservable.remove(this._connectedObserver);
        this._deviceSourceManager?.onDeviceDisconnectedObservable.remove(this._disconnectedObserver);
        const mouse = this._deviceSourceManager?.getDeviceSource(DeviceType.Mouse);
        const touches = this._deviceSourceManager?.getDeviceSources(DeviceType.Touch);

        mouse?.onInputChangedObservable.remove(this._mouseObserver);
        touches?.forEach((touch) => {
            touch.onInputChangedObservable.remove(this._touchObservers[touch.deviceSlot]);
        });
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
