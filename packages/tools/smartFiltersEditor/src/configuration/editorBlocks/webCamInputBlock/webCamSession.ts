import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine.js";
import type { InternalTexture } from "@babylonjs/core/Materials/Textures/internalTexture.js";
import { ThinTexture } from "@babylonjs/core/Materials/Textures/thinTexture.js";
import type { ConnectionPointType, IDisposable, RuntimeData } from "@babylonjs/smart-filters";

/**
 * Manages a single web cam session for a given source.
 */
export class WebCamSession implements IDisposable {
    private readonly _engine: ThinEngine;
    private readonly _textureOutput: RuntimeData<ConnectionPointType.Texture>;

    private _isDisposed = false;
    private _hiddenVideo: HTMLVideoElement | undefined;
    private _internalVideoTexture: InternalTexture | undefined;
    private _videoTexture: ThinTexture | undefined;
    private _mediaStream: MediaStream | undefined;
    private _deviceId: string;

    constructor(engine: ThinEngine, textureOutput: RuntimeData<ConnectionPointType.Texture>, deviceId: string) {
        this._engine = engine;
        this._textureOutput = textureOutput;
        this._deviceId = deviceId;
    }

    /**
     * Loads the WebCam, creates a ThinTexture from it, and sets that texture in textureOutput provided to the constructor.
     */
    public async load(): Promise<void> {
        const width = 640;
        const height = 480;

        const mediaTrackConstraints: MediaTrackConstraints = {
            width,
            height,
        };
        if (this._deviceId !== "") {
            mediaTrackConstraints.deviceId = this._deviceId;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: mediaTrackConstraints,
            audio: false,
        });
        this._mediaStream = stream;

        if (this._isDisposed) {
            this._disposeMediaStream();
            return;
        }

        const hiddenVideo = document.createElement("video");
        this._hiddenVideo = hiddenVideo;
        document.body.append(hiddenVideo);

        hiddenVideo.style.position = "absolute";
        hiddenVideo.style.top = "0";
        hiddenVideo.style.visibility = "hidden";

        hiddenVideo.setAttribute("playsinline", "");
        hiddenVideo.muted = true;
        hiddenVideo.autoplay = true;
        hiddenVideo.loop = true;
        hiddenVideo.width = width;
        hiddenVideo.height = height;

        hiddenVideo.onerror = () => {
            throw "Failed to load WebCam";
        };

        hiddenVideo.onloadeddata = () => {
            const internalVideoTexture = this._engine.createDynamicTexture(
                hiddenVideo.videoWidth,
                hiddenVideo.videoHeight,
                false,
                2
            );
            this._internalVideoTexture = internalVideoTexture;
            this._videoTexture = new ThinTexture(internalVideoTexture);
            this._videoTexture.wrapU = 0;
            this._videoTexture.wrapV = 0;
            this._textureOutput.value = this._videoTexture;

            const update = () => {
                if (this._isDisposed) {
                    return;
                }

                if (hiddenVideo.readyState >= hiddenVideo.HAVE_CURRENT_DATA) {
                    this._engine.updateVideoTexture(internalVideoTexture, hiddenVideo, false);
                }

                hiddenVideo.requestVideoFrameCallback(update);
            };

            hiddenVideo.requestVideoFrameCallback(update);
        };

        hiddenVideo.srcObject = stream;
    }

    public dispose(): void {
        this._isDisposed = true;

        this._disposeMediaStream();
        if (this._hiddenVideo) {
            this._hiddenVideo.onloadeddata = null;
            this._hiddenVideo.pause();
            this._hiddenVideo.srcObject = null;
            document.body.removeChild(this._hiddenVideo);
            this._hiddenVideo = undefined;
        }
        if (this._videoTexture) {
            this._videoTexture.dispose();
            this._videoTexture = undefined;
        }
        if (this._internalVideoTexture) {
            this._internalVideoTexture.dispose();
            this._internalVideoTexture = undefined;
        }
    }

    private _disposeMediaStream(): void {
        if (this._mediaStream) {
            this._mediaStream.getTracks().forEach((track) => track.stop());
            this._mediaStream = undefined;
        }
    }
}
