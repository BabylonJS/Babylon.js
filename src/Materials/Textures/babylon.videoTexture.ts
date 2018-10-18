module BABYLON {
    /**
     * Settings for finer control over video usage
     */
    export interface VideoTextureSettings {
        /**
         * Applies `autoplay` to video, if specified
         */
        autoPlay?: boolean;

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
    }

    /**
     * If you want to display a video in your scene, this is the special texture for that.
     * This special texture works similar to other textures, with the exception of a few parameters.
     * @see https://doc.babylonjs.com/how_to/video_texture
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

        private _onUserActionRequestedObservable: Nullable<Observable<Texture>> = null;

        /**
         * Event triggerd when a dom action is required by the user to play the video.
         * This happens due to recent changes in browser policies preventing video to auto start.
         */
        public get onUserActionRequestedObservable(): Observable<Texture> {
            if (!this._onUserActionRequestedObservable) {
                this._onUserActionRequestedObservable = new Observable<Texture>();
            }
            return this._onUserActionRequestedObservable;
        }

        private _generateMipMaps: boolean;
        private _engine: Engine;
        private _stillImageCaptured = false;
        private _poster = false;

        /**
         * Creates a video texture.
         * If you want to display a video in your scene, this is the special texture for that.
         * This special texture works similar to other textures, with the exception of a few parameters.
         * @see https://doc.babylonjs.com/how_to/video_texture
         * @param name optional name, will detect from video source, if not defined
         * @param src can be used to provide an url, array of urls or an already setup HTML video element.
         * @param scene is obviously the current scene.
         * @param generateMipMaps can be used to turn on mipmaps (Can be expensive for videoTextures because they are often updated).
         * @param invertY is false by default but can be used to invert video on Y axis
         * @param samplingMode controls the sampling method and is set to TRILINEAR_SAMPLINGMODE by default
         * @param settings allows finer control over video usage
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

            this.name = name || this._getName(src);
            this.video = this._getVideo(src);
            if (settings.poster) {
                this.video.poster = settings.poster;
            }

            if (settings.autoPlay !== undefined) {
                this.video.autoplay = settings.autoPlay;
            }
            if (settings.loop !== undefined) {
                this.video.loop = settings.loop;
            }

            this.video.setAttribute("playsinline", "");

            this.video.addEventListener("canplay", this._createInternalTexture);
            this.video.addEventListener("paused", this._updateInternalTexture);
            this.video.addEventListener("seeked", this._updateInternalTexture);
            this.video.addEventListener("emptied", this.reset);

            if (this.video.readyState >= this.video.HAVE_CURRENT_DATA) {
                this._createInternalTexture();
            }

            if (settings.poster) {
                this._texture = this._engine.createTexture(settings.poster!, false, true, scene);
                this._poster = true;
            }
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
            return video;
        }

        private _createInternalTexture = (): void => {
            if (this._texture != null) {
                if (this._poster) {
                    this._texture.dispose();
                    this._poster = false;
                }
                else {
                    return;
                }
            }

            if (!this._engine.needPOTTextures ||
                (Tools.IsExponentOfTwo(this.video.videoWidth) && Tools.IsExponentOfTwo(this.video.videoHeight))) {
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

            if (!this.video.autoplay) {
                let oldHandler = this.video.onplaying;
                let error = false;
                this.video.onplaying = () => {
                    this.video.onplaying = oldHandler;
                    this._texture!.isReady = true;
                    this._updateInternalTexture();
                    if (!error) {
                        this.video.pause();
                    }
                    if (this.onLoadObservable.hasObservers()) {
                        this.onLoadObservable.notifyObservers(this);
                    }
                };
                var playing = this.video.play();
                if (playing) {
                    playing.then(() => {
                        // Everything is good.
                    })
                        .catch(() => {
                            error = true;
                            // On Chrome for instance, new policies might prevent playing without user interaction.
                            if (this._onUserActionRequestedObservable && this._onUserActionRequestedObservable.hasObservers()) {
                                this._onUserActionRequestedObservable.notifyObservers(this);
                            }
                        });
                }
                else {
                    this.video.onplaying = oldHandler;
                    this._texture.isReady = true;
                    this._updateInternalTexture();
                    if (this.onLoadObservable.hasObservers()) {
                        this.onLoadObservable.notifyObservers(this);
                    }
                }
            }
            else {
                this._texture.isReady = true;
                this._updateInternalTexture();
                if (this.onLoadObservable.hasObservers()) {
                    this.onLoadObservable.notifyObservers(this);
                }
            }
        }

        private reset = (): void => {
            if (this._texture == null) {
                return;
            }

            if (!this._poster) {
                this._texture.dispose();
                this._texture = null;
            }
        }

        /**
         * @hidden Internal method to initiate `update`.
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
            if (this.video.paused && this._stillImageCaptured) {
                return;
            }
            this._stillImageCaptured = true;
            this._updateInternalTexture();
        }

        protected _updateInternalTexture = (e?: Event): void => {
            if (this._texture == null || !this._texture.isReady) {
                return;
            }
            if (this.video.readyState < this.video.HAVE_CURRENT_DATA) {
                return;
            }

            this._engine.updateVideoTexture(this._texture, this.video, this._invertY);
        }

        /**
         * Change video content. Changing video instance or setting multiple urls (as in constructor) is not supported.
         * @param url New url.
         */
        public updateURL(url: string): void {
            this.video.src = url;
        }

        /**
         * Dispose the texture and release its associated resources.
         */
        public dispose(): void {
            super.dispose();

            if (this._onUserActionRequestedObservable) {
                this._onUserActionRequestedObservable.clear();
                this._onUserActionRequestedObservable = null;
            }

            this.video.removeEventListener("canplay", this._createInternalTexture);
            this.video.removeEventListener("paused", this._updateInternalTexture);
            this.video.removeEventListener("seeked", this._updateInternalTexture);
            this.video.removeEventListener("emptied", this.reset);
            this.video.pause();
        }

        /**
         * Creates a video texture straight from your WebCam video feed.
         * @param scene Define the scene the texture should be created in
         * @param onReady Define a callback to triggered once the texture will be ready
         * @param constraints Define the constraints to use to create the web cam feed from WebRTC
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
            }
        ): void {
            var video = document.createElement("video");
            video.setAttribute('autoplay', '');
            video.setAttribute('muted', '');
            video.setAttribute('playsinline', '');

            var constraintsDeviceId;
            if (constraints && constraints.deviceId) {
                constraintsDeviceId = {
                    exact: constraints.deviceId,
                };
            }

            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;

            if (navigator.mediaDevices) {
                navigator.mediaDevices.getUserMedia({ video: constraints })
                    .then(function(stream) {
                        if (video.mozSrcObject !== undefined) {
                            // hack for Firefox < 19
                            video.mozSrcObject = stream;
                        } else {
                            video.srcObject = stream;
                        }

                        let onPlaying = () => {
                            if (onReady) {
                                onReady(new VideoTexture("video", video, scene, true, true));
                            }
                            video.removeEventListener("playing", onPlaying);
                        };

                        video.addEventListener("playing", onPlaying);
                        video.play();
                    })
                    .catch(function(err) {
                        Tools.Error(err.name);
                    });
            }
            else {
                navigator.getUserMedia =
                    navigator.getUserMedia ||
                    navigator.webkitGetUserMedia ||
                    navigator.mozGetUserMedia ||
                    navigator.msGetUserMedia;

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
}
