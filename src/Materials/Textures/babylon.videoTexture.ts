module BABYLON {
    /**
     * Settings for finer control over video usage
     * @typedef {Object} VideoTextureSettings
     * @property {boolean} [autoPlay] Applies `autoplay` to video, if specified
     * @property {boolean} [loop] - Applies `loop` to video, if specified
     * @property {boolean} autoUpdateTexture - Automatically updates internal texture from video at every frame in the render loop
     */
    export interface VideoTextureSettings {
        autoPlay?: boolean;
        loop?: boolean;
        autoUpdateTexture: boolean;
    }

    const getName = (src: string | string[] | HTMLVideoElement): string => {
        if (src instanceof HTMLVideoElement) {
            return src.currentSrc;
        }

        if (typeof src === "object") {
            return src.toString();
        }

        return src;
    };

    const getVideo = (src: string | string[] | HTMLVideoElement): HTMLVideoElement => {
        if (src instanceof HTMLVideoElement) {
            return src;
        }
        const video: HTMLVideoElement = document.createElement("video");
        if (typeof src === "string") {
            video.src = src;
        } else {
            src.forEach(url => {
                const source = document.createElement("source");
                source.src = url;
                video.appendChild(source);
            });
        }
        return video;
    };

    export class VideoTexture extends Texture {
        readonly autoUpdateTexture: boolean;
        readonly video: HTMLVideoElement;

        private _generateMipMaps: boolean;
        private _engine: Engine;

        /**
         * Creates a video texture.
         * Sample : https://doc.babylonjs.com/how_to/video_texture
         * @param {string | null} name optional name, will detect from video source, if not defined
         * @param {(string | string[] | HTMLVideoElement)} src can be used to provide an url, array of urls or an already setup HTML video element.
         * @param {BABYLON.Scene} scene is obviously the current scene.
         * @param {boolean} generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param {boolean} invertY is false by default but can be used to invert video on Y axis
         * @param {number} samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         * @param {VideoTextureSettings} [settings] allows finer control over video usage
         */
        constructor(
            name: Nullable<string>,
            src: string | string[] | HTMLVideoElement,
            scene: Nullable<Scene>,
            generateMipMaps = false,
            invertY = false,
            samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE,
            settings: VideoTextureSettings = {
                autoPlay: true,
                loop: true,
                autoUpdateTexture: true,
            }
        ) {
            super(null, scene, !generateMipMaps, invertY);

            this._engine = this.getScene()!.getEngine();
            this._generateMipMaps = generateMipMaps;
            this._samplingMode = samplingMode;
            this.autoUpdateTexture = settings.autoUpdateTexture;

            this.name = name || getName(src);
            this.video = getVideo(src);

            if (settings.autoPlay !== undefined) {
                this.video.autoplay = settings.autoPlay;
            }
            if (settings.loop !== undefined) {
                this.video.loop = settings.loop;
            }

            this.video.addEventListener("canplay", this._createInternalTexture);
            this.video.addEventListener("paused", this.updateInternalTexture);
            this.video.addEventListener("seeked", this.updateInternalTexture);
            this.video.addEventListener("emptied", this.reset);

            if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
                this._createInternalTexture();
            }
        }

        private _createInternalTexture = (): void => {
            if (this._texture != null) {
                return;
            }

            if (
                !this._engine.needPOTTextures ||
                (Tools.IsExponentOfTwo(this.video.videoWidth) && Tools.IsExponentOfTwo(this.video.videoHeight))
            ) {
                this.wrapU = Texture.WRAP_ADDRESSMODE;
                this.wrapV = Texture.WRAP_ADDRESSMODE;
            } else {
                this.wrapU = Texture.CLAMP_ADDRESSMODE;
                this.wrapV = Texture.CLAMP_ADDRESSMODE;
                this._generateMipMaps = false;
            }

            this._texture = this._engine.createDynamicTexture(
                this.video.videoWidth,
                this.video.videoHeight,
                this._generateMipMaps,
                this._samplingMode
            );
            this._texture.width;

            this.updateInternalTexture();

            this._texture.isReady = true;
        };

        private reset = (): void => {
            if (this._texture == null) {
                return;
            }
            this._texture.dispose();
            this._texture = null;
        };

        /**
         * Internal method to initiate `update`.
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
         * @param isVisible Visibility state, detected by user using `scene.getActiveMeshes()` or othervise.
         */
        public updateTexture(isVisible: boolean): void {
            if (!isVisible) {
                return;
            }
            if (this.video.paused) {
                return;
            }
            this.updateInternalTexture();
        }

        protected updateInternalTexture = (e?: Event): void => {
            if (this._texture == null || !this._texture.isReady) {
                return;
            }
            if (this.video.readyState < this.video.HAVE_CURRENT_DATA) {
                return;
            }

            this._engine.updateVideoTexture(this._texture, this.video, this._invertY);
        };

        /**
         * Change video content. Changing video instance or setting multiple urls (as in constructor) is not supported.
         * @param url New url.
         */
        public updateURL(url: string): void {
            this.video.src = url;
        }

        public dispose(): void {
            super.dispose();
            this.video.removeEventListener("canplay", this._createInternalTexture);
            this.video.removeEventListener("paused", this.updateInternalTexture);
            this.video.removeEventListener("seeked", this.updateInternalTexture);
            this.video.removeEventListener("emptied", this.reset);
        }

        public static CreateFromWebCam(
            scene: Scene,
            onReady: (videoTexture: VideoTexture) => void,
            constraints: {
                minWidth: number;
                maxWidth: number;
                minHeight: number;
                maxHeight: number;
                deviceId: string;
            }
        ): void {
            var video = document.createElement("video");
            var constraintsDeviceId;
            if (constraints && constraints.deviceId) {
                constraintsDeviceId = {
                    exact: constraints.deviceId,
                };
            }

            navigator.getUserMedia =
                navigator.getUserMedia ||
                navigator.webkitGetUserMedia ||
                navigator.mozGetUserMedia ||
                navigator.msGetUserMedia;
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

            if (navigator.getUserMedia) {
                navigator.getUserMedia(
                    {
                        video: {
                            deviceId: constraintsDeviceId,
                            width: {
                                min: (constraints && constraints.minWidth) || 256,
                                max: (constraints && constraints.maxWidth) || 640,
                            },
                            height: {
                                min: (constraints && constraints.minHeight) || 256,
                                max: (constraints && constraints.maxHeight) || 480,
                            },
                        },
                    },
                    (stream: any) => {
                        if (video.mozSrcObject !== undefined) {
                            // hack for Firefox < 19
                            video.mozSrcObject = stream;
                        } else {
                            video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                        }

                        video.play();

                        if (onReady) {
                            onReady(new VideoTexture("video", video, scene, true, true));
                        }
                    },
                    function(e: MediaStreamError) {
                        Tools.Error(e.name);
                    }
                );
            }
        }
    }
}
