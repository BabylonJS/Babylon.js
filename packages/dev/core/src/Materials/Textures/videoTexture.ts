import { Observable } from "../../Misc/observable";
import { Tools } from "../../Misc/tools";
import { Logger } from "../../Misc/logger";
import type { Nullable } from "../../types";
import type { Scene } from "../../scene";
import { Texture } from "../../Materials/Textures/texture";
import { Constants } from "../../Engines/constants";
import type { ExternalTexture } from "./externalTexture";

import "../../Engines/Extensions/engine.videoTexture";
import "../../Engines/Extensions/engine.dynamicTexture";
import { serialize } from "core/Misc/decorators";
import { RegisterClass } from "core/Misc/typeStore";

function removeSource(video: HTMLVideoElement): void {
    // Remove any <source> elements, etc.
    while (video.firstChild) {
        video.removeChild(video.firstChild);
    }

    // detach srcObject
    video.srcObject = null;

    // Set a blank src (https://html.spec.whatwg.org/multipage/media.html#best-practices-for-authors-using-media-elements)
    video.src = "";

    // Prevent non-important errors maybe (https://twitter.com/beraliv/status/1205214277956775936)
    video.removeAttribute("src");
}

/**
 * Settings for finer control over video usage
 */
export interface VideoTextureSettings {
    /**
     * Applies `autoplay` to video, if specified
     */
    autoPlay?: boolean;

    /**
     * Applies `muted` to video, if specified
     */
    muted?: boolean;

    /**
     * Applies `loop` to video, if specified
     */
    loop?: boolean;

    /**
     * Automatically updates internal texture from video at every frame in the render loop
     */
    autoUpdateTexture: boolean;

    /**
     * Image src displayed during the video loading or until the user interacts with the video.
     */
    poster?: string;

    /**
     * Defines the associated texture format.
     */
    format?: number;

    /**
     * Notify babylon to not modify any video settings and not control the video's playback.
     * Set this to true if you are controlling the way the video is being played, stopped and paused.
     */
    independentVideoSource?: boolean;
}

/**
 * If you want to display a video in your scene, this is the special texture for that.
 * This special texture works similar to other textures, with the exception of a few parameters.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/videoTexture
 */
export class VideoTexture extends Texture {
    /**
     * Tells whether textures will be updated automatically or user is required to call `updateTexture` manually
     */
    public readonly autoUpdateTexture: boolean;

    /**
     * The video instance used by the texture internally
     */
    public readonly video: HTMLVideoElement;

    private _externalTexture: Nullable<ExternalTexture> = null;
    private _onUserActionRequestedObservable: Nullable<Observable<Texture>> = null;

    /**
     * Event triggered when a dom action is required by the user to play the video.
     * This happens due to recent changes in browser policies preventing video to auto start.
     */
    public get onUserActionRequestedObservable(): Observable<Texture> {
        if (!this._onUserActionRequestedObservable) {
            this._onUserActionRequestedObservable = new Observable<Texture>();
        }
        return this._onUserActionRequestedObservable;
    }

    private _generateMipMaps: boolean;
    private _stillImageCaptured = false;
    private _displayingPosterTexture = false;
    @serialize("settings")
    private _settings: VideoTextureSettings;
    private _createInternalTextureOnEvent: string;
    private _frameId = -1;
    @serialize("src")
    private _currentSrc: Nullable<string | string[] | HTMLVideoElement> = null;
    private _onError?: Nullable<(message?: string, exception?: any) => void>;
    private _errorFound = false;

    /**
     * Serialize the flag to define this texture as a video texture
     */
    @serialize()
    public readonly isVideo = true;

    private _processError(reason: any) {
        this._errorFound = true;
        if (this._onError) {
            this._onError(reason?.message);
        } else {
            Logger.Error(reason?.message);
        }
    }

    private _handlePlay() {
        this._errorFound = false;
        this.video.play().catch((reason) => {
            if (reason?.name === "NotAllowedError") {
                if (this._onUserActionRequestedObservable && this._onUserActionRequestedObservable.hasObservers()) {
                    this._onUserActionRequestedObservable.notifyObservers(this);
                    return;
                } else if (!this.video.muted) {
                    Logger.Warn("Unable to autoplay a video with sound. Trying again with muted turned true");
                    this.video.muted = true;
                    this._errorFound = false;
                    this.video.play().catch((otherReason) => {
                        this._processError(otherReason);
                    });
                    return;
                }
            }

            this._processError(reason);
        });
    }

    /**
     * Creates a video texture.
     * If you want to display a video in your scene, this is the special texture for that.
     * This special texture works similar to other textures, with the exception of a few parameters.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/videoTexture
     * @param name optional name, will detect from video source, if not defined
     * @param src can be used to provide an url, array of urls or an already setup HTML video element.
     * @param scene is obviously the current scene.
     * @param generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
     * @param invertY is false by default but can be used to invert video on Y axis
     * @param samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
     * @param settings allows finer control over video usage
     * @param onError defines a callback triggered when an error occurred during the loading session
     * @param format defines the texture format to use (Engine.TEXTUREFORMAT_RGBA by default)
     */
    constructor(
        name: Nullable<string>,
        src: string | string[] | HTMLVideoElement,
        scene: Nullable<Scene>,
        generateMipMaps = false,
        invertY = false,
        samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
        settings: Partial<VideoTextureSettings> = {},
        onError?: Nullable<(message?: string, exception?: any) => void>,
        format: number = Constants.TEXTUREFORMAT_RGBA
    ) {
        super(null, scene, !generateMipMaps, invertY);

        this._settings = {
            autoPlay: true,
            loop: true,
            autoUpdateTexture: true,
            ...settings,
        };

        this._onError = onError;

        this._generateMipMaps = generateMipMaps;
        this._initialSamplingMode = samplingMode;
        this.autoUpdateTexture = this._settings.autoUpdateTexture;

        this._currentSrc = src;
        this.name = name || this._getName(src);
        this.video = this._getVideo(src);
        if (this._engine?.createExternalTexture) {
            this._externalTexture = this._engine.createExternalTexture(this.video);
        }

        if (!this._settings.independentVideoSource) {
            if (this._settings.poster) {
                this.video.poster = this._settings.poster;
            }
            if (this._settings.autoPlay !== undefined) {
                this.video.autoplay = this._settings.autoPlay;
            }
            if (this._settings.loop !== undefined) {
                this.video.loop = this._settings.loop;
            }
            if (this._settings.muted !== undefined) {
                this.video.muted = this._settings.muted;
            }

            this.video.setAttribute("playsinline", "");
            this.video.addEventListener("paused", this._updateInternalTexture);
            this.video.addEventListener("seeked", this._updateInternalTexture);
            this.video.addEventListener("loadeddata", this._updateInternalTexture);
            this.video.addEventListener("emptied", this._reset);

            if (this._settings.autoPlay) {
                this._handlePlay();
            }
        }

        this._createInternalTextureOnEvent = this._settings.poster && !this._settings.autoPlay ? "play" : "canplay";
        this.video.addEventListener(this._createInternalTextureOnEvent, this._createInternalTexture);
        this._format = format;

        const videoHasEnoughData = this.video.readyState >= this.video.HAVE_CURRENT_DATA;
        if (this._settings.poster && (!this._settings.autoPlay || !videoHasEnoughData)) {
            this._texture = this._getEngine()!.createTexture(this._settings.poster!, false, !this.invertY, scene);
            this._displayingPosterTexture = true;
        } else if (videoHasEnoughData) {
            this._createInternalTexture();
        }
    }

    /**
     * Get the current class name of the video texture useful for serialization or dynamic coding.
     * @returns "VideoTexture"
     */
    public getClassName(): string {
        return "VideoTexture";
    }

    private _getName(src: string | string[] | HTMLVideoElement): string {
        if (src instanceof HTMLVideoElement) {
            return src.currentSrc;
        }

        if (typeof src === "object") {
            return src.toString();
        }

        return src;
    }

    private _getVideo(src: string | string[] | HTMLVideoElement): HTMLVideoElement {
        if ((<any>src).isNative) {
            return <HTMLVideoElement>src;
        }
        if (src instanceof HTMLVideoElement) {
            Tools.SetCorsBehavior(src.currentSrc, src);
            return src;
        }
        const video: HTMLVideoElement = document.createElement("video");
        if (typeof src === "string") {
            Tools.SetCorsBehavior(src, video);
            video.src = src;
        } else {
            Tools.SetCorsBehavior(src[0], video);
            src.forEach((url) => {
                const source = document.createElement("source");
                source.src = url;
                video.appendChild(source);
            });
        }

        this.onDisposeObservable.addOnce(() => {
            removeSource(video);
        });

        return video;
    }

    private _resizeInternalTexture = (): void => {
        // Cleanup the old texture before replacing it
        if (this._texture != null) {
            this._texture.dispose();
        }

        if (!this._getEngine()!.needPOTTextures || (Tools.IsExponentOfTwo(this.video.videoWidth) && Tools.IsExponentOfTwo(this.video.videoHeight))) {
            this.wrapU = Texture.WRAP_ADDRESSMODE;
            this.wrapV = Texture.WRAP_ADDRESSMODE;
        } else {
            this.wrapU = Texture.CLAMP_ADDRESSMODE;
            this.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._generateMipMaps = false;
        }

        this._texture = this._getEngine()!.createDynamicTexture(this.video.videoWidth, this.video.videoHeight, this._generateMipMaps, this.samplingMode);
        this._texture.format = this._format ?? Constants.TEXTUREFORMAT_RGBA;

        // Reset the frame ID and update the new texture to ensure it pulls in the current video frame
        this._frameId = -1;
        this._updateInternalTexture();
    };

    private _createInternalTexture = (): void => {
        if (this._texture != null) {
            if (this._displayingPosterTexture) {
                this._displayingPosterTexture = false;
            } else {
                return;
            }
        }

        this.video.addEventListener("resize", this._resizeInternalTexture);
        this._resizeInternalTexture();

        if (!this.video.autoplay && !this._settings.poster && !this._settings.independentVideoSource) {
            const oldHandler = this.video.onplaying;
            const oldMuted = this.video.muted;
            this.video.muted = true;
            this.video.onplaying = () => {
                this.video.muted = oldMuted;
                this.video.onplaying = oldHandler;
                this._updateInternalTexture();
                if (!this._errorFound) {
                    this.video.pause();
                }
                if (this.onLoadObservable.hasObservers()) {
                    this.onLoadObservable.notifyObservers(this);
                }
            };
            this._handlePlay();
        } else {
            this._updateInternalTexture();
            if (this.onLoadObservable.hasObservers()) {
                this.onLoadObservable.notifyObservers(this);
            }
        }
    };

    private _reset = (): void => {
        if (this._texture == null) {
            return;
        }

        if (!this._displayingPosterTexture) {
            this._texture.dispose();
            this._texture = null;
        }
    };

    /**
     * @internal Internal method to initiate `update`.
     */
    public _rebuild(): void {
        this.update();
    }

    /**
     * Update Texture in the `auto` mode. Does not do anything if `settings.autoUpdateTexture` is false.
     */
    public update(): void {
        if (!this.autoUpdateTexture) {
            // Expecting user to call `updateTexture` manually
            return;
        }

        this.updateTexture(true);
    }

    /**
     * Update Texture in `manual` mode. Does not do anything if not visible or paused.
     * @param isVisible Visibility state, detected by user using `scene.getActiveMeshes()` or otherwise.
     */
    public updateTexture(isVisible: boolean): void {
        if (!isVisible) {
            return;
        }
        if (this.video.paused && this._stillImageCaptured) {
            return;
        }
        this._stillImageCaptured = true;
        this._updateInternalTexture();
    }

    protected _updateInternalTexture = (): void => {
        if (this._texture == null) {
            return;
        }
        if (this.video.readyState < this.video.HAVE_CURRENT_DATA) {
            return;
        }
        if (this._displayingPosterTexture) {
            return;
        }

        const frameId = this.getScene()!.getFrameId();
        if (this._frameId === frameId) {
            return;
        }

        this._frameId = frameId;

        this._getEngine()!.updateVideoTexture(this._texture, this._externalTexture ? this._externalTexture : this.video, this._invertY);
    };

    /**
     * Get the underlying external texture (if supported by the current engine, else null)
     */
    public get externalTexture(): Nullable<ExternalTexture> {
        return this._externalTexture;
    }

    /**
     * Change video content. Changing video instance or setting multiple urls (as in constructor) is not supported.
     * @param url New url.
     */
    public updateURL(url: string): void {
        this.video.src = url;
        this._currentSrc = url;
    }

    /**
     * Clones the texture.
     * @returns the cloned texture
     */
    public clone(): VideoTexture {
        return new VideoTexture(this.name, this._currentSrc!, this.getScene(), this._generateMipMaps, this.invertY, this.samplingMode, this._settings);
    }

    /**
     * Dispose the texture and release its associated resources.
     */
    public dispose(): void {
        super.dispose();

        this._currentSrc = null;

        if (this._onUserActionRequestedObservable) {
            this._onUserActionRequestedObservable.clear();
            this._onUserActionRequestedObservable = null;
        }

        this.video.removeEventListener(this._createInternalTextureOnEvent, this._createInternalTexture);
        if (!this._settings.independentVideoSource) {
            this.video.removeEventListener("paused", this._updateInternalTexture);
            this.video.removeEventListener("seeked", this._updateInternalTexture);
            this.video.removeEventListener("loadeddata", this._updateInternalTexture);
            this.video.removeEventListener("emptied", this._reset);
            this.video.removeEventListener("resize", this._resizeInternalTexture);
            this.video.pause();
        }

        this._externalTexture?.dispose();
    }

    /**
     * Creates a video texture straight from a stream.
     * @param scene Define the scene the texture should be created in
     * @param stream Define the stream the texture should be created from
     * @param constraints video constraints
     * @param invertY Defines if the video should be stored with invert Y set to true (true by default)
     * @returns The created video texture as a promise
     */
    public static CreateFromStreamAsync(scene: Scene, stream: MediaStream, constraints: any, invertY = true): Promise<VideoTexture> {
        const video = scene.getEngine().createVideoElement(constraints);

        if (scene.getEngine()._badOS) {
            // Yes... I know and I hope to remove it soon...
            document.body.appendChild(video);
            video.style.transform = "scale(0.0001, 0.0001)";
            video.style.opacity = "0";
            video.style.position = "fixed";
            video.style.bottom = "0px";
            video.style.right = "0px";
        }

        video.setAttribute("autoplay", "");
        video.setAttribute("muted", "true");
        video.setAttribute("playsinline", "");
        video.muted = true;

        if (video.isNative) {
            // No additional configuration needed for native
        } else if (video.mozSrcObject !== undefined) {
            // hack for Firefox < 19
            video.mozSrcObject = stream;
        } else {
            if (typeof video.srcObject == "object") {
                video.srcObject = stream;
            } else {
                // older API. See https://developer.mozilla.org/en-US/docs/Web/API/URL/createObjectURL#using_object_urls_for_media_streams
                video.src = window.URL && window.URL.createObjectURL(stream as any);
            }
        }

        return new Promise<VideoTexture>((resolve) => {
            const onPlaying = () => {
                const videoTexture = new VideoTexture("video", video, scene, true, invertY, undefined, undefined, undefined, Constants.TEXTUREFORMAT_RGB);
                if (scene.getEngine()._badOS) {
                    videoTexture.onDisposeObservable.addOnce(() => {
                        video.remove();
                    });
                }
                videoTexture.onDisposeObservable.addOnce(() => {
                    removeSource(video);
                });

                resolve(videoTexture);
                video.removeEventListener("playing", onPlaying);
            };

            video.addEventListener("playing", onPlaying);
            video.play();
        });
    }

    /**
     * Creates a video texture straight from your WebCam video feed.
     * @param scene Define the scene the texture should be created in
     * @param constraints Define the constraints to use to create the web cam feed from WebRTC
     * @param audioConstaints Define the audio constraints to use to create the web cam feed from WebRTC
     * @param invertY Defines if the video should be stored with invert Y set to true (true by default)
     * @returns The created video texture as a promise
     */
    public static async CreateFromWebCamAsync(
        scene: Scene,
        constraints: {
            minWidth: number;
            maxWidth: number;
            minHeight: number;
            maxHeight: number;
            deviceId: string;
        } & MediaTrackConstraints,
        audioConstaints: boolean | MediaTrackConstraints = false,
        invertY = true
    ): Promise<VideoTexture> {
        if (navigator.mediaDevices) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: constraints,
                audio: audioConstaints,
            });

            const videoTexture = await this.CreateFromStreamAsync(scene, stream, constraints, invertY);
            videoTexture.onDisposeObservable.addOnce(() => {
                stream.getTracks().forEach((track) => {
                    track.stop();
                });
            });

            return videoTexture;
        }

        return Promise.reject("No support for userMedia on this device");
    }

    /**
     * Creates a video texture straight from your WebCam video feed.
     * @param scene Defines the scene the texture should be created in
     * @param onReady Defines a callback to triggered once the texture will be ready
     * @param constraints Defines the constraints to use to create the web cam feed from WebRTC
     * @param audioConstaints Defines the audio constraints to use to create the web cam feed from WebRTC
     * @param invertY Defines if the video should be stored with invert Y set to true (true by default)
     */
    public static CreateFromWebCam(
        scene: Scene,
        onReady: (videoTexture: VideoTexture) => void,
        constraints: {
            minWidth: number;
            maxWidth: number;
            minHeight: number;
            maxHeight: number;
            deviceId: string;
        } & MediaTrackConstraints,
        audioConstaints: boolean | MediaTrackConstraints = false,
        invertY = true
    ): void {
        this.CreateFromWebCamAsync(scene, constraints, audioConstaints, invertY)
            .then(function (videoTexture) {
                if (onReady) {
                    onReady(videoTexture);
                }
            })
            .catch(function (err) {
                Logger.Error(err.name);
            });
    }
}

Texture._CreateVideoTexture = (
    name: Nullable<string>,
    src: string | string[] | HTMLVideoElement,
    scene: Nullable<Scene>,
    generateMipMaps = false,
    invertY = false,
    samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
    settings: Partial<VideoTextureSettings> = {},
    onError?: Nullable<(message?: string, exception?: any) => void>,
    format: number = Constants.TEXTUREFORMAT_RGBA
) => {
    return new VideoTexture(name, src, scene, generateMipMaps, invertY, samplingMode, settings, onError, format);
};
// Some exporters relies on Tools.Instantiate
RegisterClass("BABYLON.VideoTexture", VideoTexture);
