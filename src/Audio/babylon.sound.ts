module BABYLON {
    /**
     * Defines a sound that can be played in the application.
     * The sound can either be an ambient track or a simple sound played in reaction to a user action.
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     */
    export class Sound {
        /**
         * The name of the sound in the scene.
         */
        public name: string;
        /**
         * Does the sound autoplay once loaded.
         */
        public autoplay: boolean = false;
        /**
         * Does the sound loop after it finishes playing once.
         */
        public loop: boolean = false;
        /**
         * Does the sound use a custom attenuation curve to simulate the falloff
         * happening when the source gets further away from the camera.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-your-own-custom-attenuation-function
         */
        public useCustomAttenuation: boolean = false;
        /**
         * The sound track id this sound belongs to.
         */
        public soundTrackId: number;
        /**
         * Is this sound currently played.
         */
        public isPlaying: boolean = false;
        /**
         * Is this sound currently paused.
         */
        public isPaused: boolean = false;
        /**
         * Does this sound enables spatial sound.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public spatialSound: boolean = false;
        /**
         * Define the reference distance the sound should be heard perfectly.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public refDistance: number = 1;
        /**
         * Define the roll off factor of spatial sounds.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public rolloffFactor: number = 1;
        /**
         * Define the max distance the sound should be heard (intensity just became 0 at this point).
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public maxDistance: number = 100;
        /**
         * Define the distance attenuation model the sound will follow.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public distanceModel: string = "linear";
        /**
         * @hidden
         * Back Compat
         **/
        public onended: () => any;

        /**
         * Observable event when the current playing sound finishes.
         */
        public onEndedObservable = new Observable<Sound>();

        private _panningModel: string = "equalpower";
        private _playbackRate: number = 1;
        private _streaming: boolean = false;
        private _startTime: number = 0;
        private _startOffset: number = 0;
        private _position: Vector3 = Vector3.Zero();
        /** @hidden */
        public _positionInEmitterSpace: boolean = false;
        private _localDirection: Vector3 = new Vector3(1, 0, 0);
        private _volume: number = 1;
        private _isReadyToPlay: boolean = false;
        private _isDirectional: boolean = false;
        private _readyToPlayCallback: Nullable<() => any>;
        private _audioBuffer: Nullable<AudioBuffer>;
        private _soundSource: Nullable<AudioBufferSourceNode>;
        private _streamingSource: MediaElementAudioSourceNode;
        private _soundPanner: Nullable<PannerNode>;
        private _soundGain: Nullable<GainNode>;
        private _inputAudioNode: AudioNode;
        private _outputAudioNode: AudioNode;
        // Used if you'd like to create a directional sound.
        // If not set, the sound will be omnidirectional
        private _coneInnerAngle: number = 360;
        private _coneOuterAngle: number = 360;
        private _coneOuterGain: number = 0;
        private _scene: Scene;
        private _connectedMesh: Nullable<AbstractMesh>;
        private _customAttenuationFunction: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number;
        private _registerFunc: Nullable<(connectedMesh: TransformNode) => void>;
        private _isOutputConnected = false;
        private _htmlAudioElement: HTMLAudioElement;
        private _urlType: 'Unknown' | 'String' | 'Array' | 'ArrayBuffer' | 'MediaStream' = "Unknown";

        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound
        * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer, it also works with MediaStreams
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel, streaming
        */
        constructor(name: string, urlOrArrayBuffer: any, scene: Scene, readyToPlayCallback: Nullable<() => void> = null, options?: any) {
            this.name = name;
            this._scene = scene;
            let compo = scene._getComponent(SceneComponentConstants.NAME_AUDIO);
            if (!compo) {
                compo = new AudioSceneComponent(scene);
                scene._addComponent(compo);
            }

            this._readyToPlayCallback = readyToPlayCallback;
            // Default custom attenuation function is a linear attenuation
            this._customAttenuationFunction = (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => {
                if (currentDistance < maxDistance) {
                    return currentVolume * (1 - currentDistance / maxDistance);
                }
                else {
                    return 0;
                }
            };
            if (options) {
                this.autoplay = options.autoplay || false;
                this.loop = options.loop || false;
                // if volume === 0, we need another way to check this option
                if (options.volume !== undefined) {
                    this._volume = options.volume;
                }
                this.spatialSound = options.spatialSound || false;
                this.maxDistance = options.maxDistance || 100;
                this.useCustomAttenuation = options.useCustomAttenuation || false;
                this.rolloffFactor = options.rolloffFactor || 1;
                this.refDistance = options.refDistance || 1;
                this.distanceModel = options.distanceModel || "linear";
                this._playbackRate = options.playbackRate || 1;
                this._streaming = options.streaming || false;
            }

            if (Engine.audioEngine.canUseWebAudio && Engine.audioEngine.audioContext) {
                this._soundGain = Engine.audioEngine.audioContext.createGain();
                this._soundGain.gain.value = this._volume;
                this._inputAudioNode = this._soundGain;
                this._outputAudioNode = this._soundGain;
                if (this.spatialSound) {
                    this._createSpatialParameters();
                }
                this._scene.mainSoundTrack.AddSound(this);
                var validParameter = true;

                // if no parameter is passed, you need to call setAudioBuffer yourself to prepare the sound
                if (urlOrArrayBuffer) {
                    try {
                        if (typeof (urlOrArrayBuffer) === "string") {
                            this._urlType = "String";
                        } else if (urlOrArrayBuffer instanceof ArrayBuffer) {
                            this._urlType = "ArrayBuffer";
                        } else if (urlOrArrayBuffer instanceof MediaStream) {
                            this._urlType = "MediaStream";
                        } else if (Array.isArray(urlOrArrayBuffer)) {
                            this._urlType = "Array";
                        }

                        var urls: string[] = [];
                        var codecSupportedFound = false;

                        switch (this._urlType) {
                            case "MediaStream":
                                this._streaming = true;
                                this._isReadyToPlay = true;
                                this._streamingSource = Engine.audioEngine.audioContext.createMediaElementSource(urlOrArrayBuffer);

                                if (this.autoplay) {
                                    this.play();
                                }

                                if (this._readyToPlayCallback) {
                                    this._readyToPlayCallback();
                                }
                                break;
                            case "ArrayBuffer":
                                if ((<ArrayBuffer>urlOrArrayBuffer).byteLength > 0) {
                                    codecSupportedFound = true;
                                    this._soundLoaded(urlOrArrayBuffer);
                                }
                                break;
                            case "String":
                                urls.push(urlOrArrayBuffer);
                            case "Array":
                                if (urls.length === 0) { urls = urlOrArrayBuffer; }
                                // If we found a supported format, we load it immediately and stop the loop
                                for (var i = 0; i < urls.length; i++) {
                                    var url = urls[i];
                                    if (url.indexOf(".mp3", url.length - 4) !== -1 && Engine.audioEngine.isMP3supported) {
                                        codecSupportedFound = true;
                                    }
                                    if (url.indexOf(".ogg", url.length - 4) !== -1 && Engine.audioEngine.isOGGsupported) {
                                        codecSupportedFound = true;
                                    }
                                    if (url.indexOf(".wav", url.length - 4) !== -1) {
                                        codecSupportedFound = true;
                                    }
                                    if (url.indexOf("blob:") !== -1) {
                                        codecSupportedFound = true;
                                    }
                                    if (codecSupportedFound) {
                                        // Loading sound using XHR2
                                        if (!this._streaming) {
                                            this._scene._loadFile(url, (data) => {
                                                this._soundLoaded(data as ArrayBuffer);
                                            }, undefined, true, true, (exception) => {
                                                if (exception) {
                                                    Tools.Error("XHR " + exception.status + " error on: " + url + ".");
                                                }
                                                Tools.Error("Sound creation aborted.");
                                                this._scene.mainSoundTrack.RemoveSound(this);
                                            });
                                        }
                                        // Streaming sound using HTML5 Audio tag
                                        else {
                                            this._htmlAudioElement = new Audio(url);
                                            this._htmlAudioElement.controls = false;
                                            this._htmlAudioElement.loop = this.loop;
                                            Tools.SetCorsBehavior(url, this._htmlAudioElement);
                                            this._htmlAudioElement.preload = "auto";
                                            this._htmlAudioElement.addEventListener("canplaythrough", () => {
                                                this._isReadyToPlay = true;
                                                if (this.autoplay) {
                                                    this.play();
                                                }
                                                if (this._readyToPlayCallback) {
                                                    this._readyToPlayCallback();
                                                }
                                            });
                                            document.body.appendChild(this._htmlAudioElement);
                                            this._htmlAudioElement.load();
                                        }
                                        break;
                                    }
                                }
                                break;
                            default:
                                validParameter = false;
                                break;
                        }

                        if (!validParameter) {
                            Tools.Error("Parameter must be a URL to the sound, an Array of URLs (.mp3 & .ogg) or an ArrayBuffer of the sound.");
                        }
                        else {
                            if (!codecSupportedFound) {
                                this._isReadyToPlay = true;
                                // Simulating a ready to play event to avoid breaking code path
                                if (this._readyToPlayCallback) {
                                    window.setTimeout(() => {
                                        if (this._readyToPlayCallback) {
                                            this._readyToPlayCallback();
                                        }
                                    }, 1000);
                                }
                            }
                        }
                    }
                    catch (ex) {
                        Tools.Error("Unexpected error. Sound creation aborted.");
                        this._scene.mainSoundTrack.RemoveSound(this);
                    }
                }
            }
            else {
                // Adding an empty sound to avoid breaking audio calls for non Web Audio browsers
                this._scene.mainSoundTrack.AddSound(this);
                if (!Engine.audioEngine.WarnedWebAudioUnsupported) {
                    Tools.Error("Web Audio is not supported by your browser.");
                    Engine.audioEngine.WarnedWebAudioUnsupported = true;
                }
                // Simulating a ready to play event to avoid breaking code for non web audio browsers
                if (this._readyToPlayCallback) {
                    window.setTimeout(() => {
                        if (this._readyToPlayCallback) {
                            this._readyToPlayCallback();
                        }
                    }, 1000);
                }
            }
        }

        /**
         * Release the sound and its associated resources
         */
        public dispose() {
            if (Engine.audioEngine.canUseWebAudio) {
                if (this.isPlaying) {
                    this.stop();
                }
                this._isReadyToPlay = false;
                if (this.soundTrackId === -1) {
                    this._scene.mainSoundTrack.RemoveSound(this);
                }
                else if (this._scene.soundTracks) {
                    this._scene.soundTracks[this.soundTrackId].RemoveSound(this);
                }
                if (this._soundGain) {
                    this._soundGain.disconnect();
                    this._soundGain = null;
                }
                if (this._soundPanner) {
                    this._soundPanner.disconnect();
                    this._soundPanner = null;
                }
                if (this._soundSource) {
                    this._soundSource.disconnect();
                    this._soundSource = null;
                }
                this._audioBuffer = null;

                if (this._htmlAudioElement) {
                    this._htmlAudioElement.pause();
                    this._htmlAudioElement.src = "";
                    document.body.removeChild(this._htmlAudioElement);
                }

                if (this._streamingSource) {
                    this._streamingSource.disconnect();
                }

                if (this._connectedMesh && this._registerFunc) {
                    this._connectedMesh.unregisterAfterWorldMatrixUpdate(this._registerFunc);
                    this._connectedMesh = null;
                }
            }
        }

        /**
         * Gets if the sounds is ready to be played or not.
         * @returns true if ready, otherwise false
         */
        public isReady(): boolean {
            return this._isReadyToPlay;
        }

        private _soundLoaded(audioData: ArrayBuffer) {
            if (!Engine.audioEngine.audioContext) {
                return;
            }
            Engine.audioEngine.audioContext.decodeAudioData(audioData, (buffer) => {
                this._audioBuffer = buffer;
                this._isReadyToPlay = true;
                if (this.autoplay) { this.play(); }
                if (this._readyToPlayCallback) { this._readyToPlayCallback(); }
            }, (err: any) => { Tools.Error("Error while decoding audio data for: " + this.name + " / Error: " + err); });
        }

        /**
         * Sets the data of the sound from an audiobuffer
         * @param audioBuffer The audioBuffer containing the data
         */
        public setAudioBuffer(audioBuffer: AudioBuffer): void {
            if (Engine.audioEngine.canUseWebAudio) {
                this._audioBuffer = audioBuffer;
                this._isReadyToPlay = true;
            }
        }

        /**
         * Updates the current sounds options such as maxdistance, loop...
         * @param options A JSON object containing values named as the object properties
         */
        public updateOptions(options: any): void {
            if (options) {
                this.loop = options.loop || this.loop;
                this.maxDistance = options.maxDistance || this.maxDistance;
                this.useCustomAttenuation = options.useCustomAttenuation || this.useCustomAttenuation;
                this.rolloffFactor = options.rolloffFactor || this.rolloffFactor;
                this.refDistance = options.refDistance || this.refDistance;
                this.distanceModel = options.distanceModel || this.distanceModel;
                this._playbackRate = options.playbackRate || this._playbackRate;
                this._updateSpatialParameters();
                if (this.isPlaying) {
                    if (this._streaming && this._htmlAudioElement) {
                        this._htmlAudioElement.playbackRate = this._playbackRate;
                    }
                    else {
                        if (this._soundSource) {
                            this._soundSource.playbackRate.value = this._playbackRate;
                        }
                    }
                }
            }
        }

        private _createSpatialParameters() {
            if (Engine.audioEngine.canUseWebAudio && Engine.audioEngine.audioContext) {
                if (this._scene.headphone) {
                    this._panningModel = "HRTF";
                }
                this._soundPanner = Engine.audioEngine.audioContext.createPanner();
                this._updateSpatialParameters();
                this._soundPanner.connect(this._outputAudioNode);
                this._inputAudioNode = this._soundPanner;
            }
        }

        private _updateSpatialParameters() {
            if (this.spatialSound && this._soundPanner) {
                if (this.useCustomAttenuation) {
                    // Tricks to disable in a way embedded Web Audio attenuation
                    this._soundPanner.distanceModel = "linear";
                    this._soundPanner.maxDistance = Number.MAX_VALUE;
                    this._soundPanner.refDistance = 1;
                    this._soundPanner.rolloffFactor = 1;
                    this._soundPanner.panningModel = this._panningModel as any;
                }
                else {
                    this._soundPanner.distanceModel = this.distanceModel as any;
                    this._soundPanner.maxDistance = this.maxDistance;
                    this._soundPanner.refDistance = this.refDistance;
                    this._soundPanner.rolloffFactor = this.rolloffFactor;
                    this._soundPanner.panningModel = this._panningModel as any;
                }
            }
        }

        /**
         * Switch the panning model to HRTF:
         * Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public switchPanningModelToHRTF() {
            this._panningModel = "HRTF";
            this._switchPanningModel();
        }

        /**
         * Switch the panning model to Equal Power:
         * Represents the equal-power panning algorithm, generally regarded as simple and efficient. equalpower is the default value.
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-a-spatial-3d-sound
         */
        public switchPanningModelToEqualPower() {
            this._panningModel = "equalpower";
            this._switchPanningModel();
        }

        private _switchPanningModel() {
            if (Engine.audioEngine.canUseWebAudio && this.spatialSound && this._soundPanner) {
                this._soundPanner.panningModel = this._panningModel as any;
            }
        }

        /**
         * Connect this sound to a sound track audio node like gain...
         * @param soundTrackAudioNode the sound track audio node to connect to
         */
        public connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode): void {
            if (Engine.audioEngine.canUseWebAudio) {
                if (this._isOutputConnected) {
                    this._outputAudioNode.disconnect();
                }
                this._outputAudioNode.connect(soundTrackAudioNode);
                this._isOutputConnected = true;
            }
        }

        /**
        * Transform this sound into a directional source
        * @param coneInnerAngle Size of the inner cone in degree
        * @param coneOuterAngle Size of the outer cone in degree
        * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
        */
        public setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number): void {
            if (coneOuterAngle < coneInnerAngle) {
                Tools.Error("setDirectionalCone(): outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }
            this._coneInnerAngle = coneInnerAngle;
            this._coneOuterAngle = coneOuterAngle;
            this._coneOuterGain = coneOuterGain;
            this._isDirectional = true;

            if (this.isPlaying && this.loop) {
                this.stop();
                this.play();
            }
        }

        /**
         * Gets or sets the inner angle for the directional cone.
         */
        public get directionalConeInnerAngle(): number {
            return this._coneInnerAngle;
        }

        /**
         * Gets or sets the inner angle for the directional cone.
         */
        public set directionalConeInnerAngle(value: number) {
            if (value != this._coneInnerAngle) {
                if (this._coneOuterAngle < value) {
                    Tools.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
                    return;
                }

                this._coneInnerAngle = value;
                if (Engine.audioEngine.canUseWebAudio && this.spatialSound && this._soundPanner) {
                    this._soundPanner.coneInnerAngle = this._coneInnerAngle;
                }
            }
        }

        /**
         * Gets or sets the outer angle for the directional cone.
         */
        public get directionalConeOuterAngle(): number {
            return this._coneOuterAngle;
        }

        /**
         * Gets or sets the outer angle for the directional cone.
         */
        public set directionalConeOuterAngle(value: number) {
            if (value != this._coneOuterAngle) {
                if (value < this._coneInnerAngle) {
                    Tools.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
                    return;
                }

                this._coneOuterAngle = value;
                if (Engine.audioEngine.canUseWebAudio && this.spatialSound && this._soundPanner) {
                    this._soundPanner.coneOuterAngle = this._coneOuterAngle;
                }
            }
        }

        /**
         * Sets the position of the emitter if spatial sound is enabled
         * @param newPosition Defines the new posisiton
         */
        public setPosition(newPosition: Vector3): void {
            this._position = newPosition;

            if (Engine.audioEngine.canUseWebAudio && this.spatialSound && this._soundPanner && !isNaN(this._position.x) && !isNaN(this._position.y) && !isNaN(this._position.z)) {
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        }

        /**
         * Sets the local direction of the emitter if spatial sound is enabled
         * @param newLocalDirection Defines the new local direction
         */
        public setLocalDirectionToMesh(newLocalDirection: Vector3): void {
            this._localDirection = newLocalDirection;

            if (Engine.audioEngine.canUseWebAudio && this._connectedMesh && this.isPlaying) {
                this._updateDirection();
            }
        }

        private _updateDirection() {
            if (!this._connectedMesh || !this._soundPanner) {
                return;
            }

            var mat = this._connectedMesh.getWorldMatrix();
            var direction = Vector3.TransformNormal(this._localDirection, mat);
            direction.normalize();
            this._soundPanner.setOrientation(direction.x, direction.y, direction.z);
        }

        /** @hidden */
        public updateDistanceFromListener() {
            if (Engine.audioEngine.canUseWebAudio && this._connectedMesh && this.useCustomAttenuation && this._soundGain && this._scene.activeCamera) {
                var distance = this._connectedMesh.getDistanceToCamera(this._scene.activeCamera);
                this._soundGain.gain.value = this._customAttenuationFunction(this._volume, distance, this.maxDistance, this.refDistance, this.rolloffFactor);
            }
        }

        /**
         * Sets a new custom attenuation function for the sound.
         * @param callback Defines the function used for the attenuation
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#creating-your-own-custom-attenuation-function
         */
        public setAttenuationFunction(callback: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number): void {
            this._customAttenuationFunction = callback;
        }

        /**
        * Play the sound
        * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
        * @param offset (optional) Start the sound setting it at a specific time
        */
        public play(time?: number, offset?: number): void {
            if (this._isReadyToPlay && this._scene.audioEnabled && Engine.audioEngine.audioContext) {
                try {
                    if (this._startOffset < 0) {
                        time = -this._startOffset;
                        this._startOffset = 0;
                    }
                    var startTime = time ? Engine.audioEngine.audioContext.currentTime + time : Engine.audioEngine.audioContext.currentTime;
                    if (!this._soundSource || !this._streamingSource) {
                        if (this.spatialSound && this._soundPanner) {
                            if (!isNaN(this._position.x) && !isNaN(this._position.y) && !isNaN(this._position.z)) {
                                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
                            }
                            if (this._isDirectional) {
                                this._soundPanner.coneInnerAngle = this._coneInnerAngle;
                                this._soundPanner.coneOuterAngle = this._coneOuterAngle;
                                this._soundPanner.coneOuterGain = this._coneOuterGain;
                                if (this._connectedMesh) {
                                    this._updateDirection();
                                }
                                else {
                                    this._soundPanner.setOrientation(this._localDirection.x, this._localDirection.y, this._localDirection.z);
                                }
                            }
                        }
                    }
                    if (this._streaming) {
                        if (!this._streamingSource) {
                            this._streamingSource = Engine.audioEngine.audioContext.createMediaElementSource(this._htmlAudioElement);
                            this._htmlAudioElement.onended = () => { this._onended(); };
                            this._htmlAudioElement.playbackRate = this._playbackRate;
                        }
                        this._streamingSource.disconnect();
                        this._streamingSource.connect(this._inputAudioNode);
                        if (this._htmlAudioElement) {
                            // required to manage properly the new suspended default state of Chrome
                            // When the option 'streaming: true' is used, we need first to wait for
                            // the audio engine to be unlocked by a user gesture before trying to play
                            // an HTML Audio elememt
                            var tryToPlay = () => {
                                if (Engine.audioEngine.unlocked) {
                                    var playPromise = this._htmlAudioElement.play();

                                    // In browsers that don’t yet support this functionality,
                                    // playPromise won’t be defined.
                                    if (playPromise !== undefined) {
                                        playPromise.catch(function(error) {
                                            // Automatic playback failed.
                                            // Waiting for the audio engine to be unlocked by user click on unmute
                                            Engine.audioEngine.lock();
                                            Engine.audioEngine.onAudioUnlockedObservable.addOnce(() => { tryToPlay(); });
                                        });
                                    }
                                }
                                else {
                                    Engine.audioEngine.onAudioUnlockedObservable.addOnce(() => { tryToPlay(); });
                                }
                            };
                            tryToPlay();
                        }
                    }
                    else {
                        this._soundSource = Engine.audioEngine.audioContext.createBufferSource();
                        this._soundSource.buffer = this._audioBuffer;
                        this._soundSource.connect(this._inputAudioNode);
                        this._soundSource.loop = this.loop;
                        this._soundSource.playbackRate.value = this._playbackRate;
                        this._soundSource.onended = () => { this._onended(); };
                        if (this._soundSource.buffer) {
                            this._soundSource.start(startTime, this.isPaused ? this._startOffset % this._soundSource.buffer.duration : offset ? offset : 0);
                        }
                    }
                    this._startTime = startTime;
                    this.isPlaying = true;
                    this.isPaused = false;
                }
                catch (ex) {
                    Tools.Error("Error while trying to play audio: " + this.name + ", " + ex.message);
                }
            }
        }

        private _onended() {
            this.isPlaying = false;
            if (this.onended) {
                this.onended();
            }
            this.onEndedObservable.notifyObservers(this);
        }

        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        public stop(time?: number): void {
            if (this.isPlaying) {
                if (this._streaming) {
                    if (this._htmlAudioElement) {
                        this._htmlAudioElement.pause();
                        // Test needed for Firefox or it will generate an Invalid State Error
                        if (this._htmlAudioElement.currentTime > 0) {
                            this._htmlAudioElement.currentTime = 0;
                        }
                    } else {
                        this._streamingSource.disconnect();
                    }
                }
                else if (Engine.audioEngine.audioContext && this._soundSource) {
                    var stopTime = time ? Engine.audioEngine.audioContext.currentTime + time : Engine.audioEngine.audioContext.currentTime;
                    this._soundSource.stop(stopTime);
                    this._soundSource.onended = () => { };
                    if (!this.isPaused) {
                        this._startOffset = 0;
                    }
                }
                this.isPlaying = false;
            }
        }

        /**
         * Put the sound in pause
         */
        public pause(): void {
            if (this.isPlaying) {
                this.isPaused = true;
                if (this._streaming) {
                    if (this._htmlAudioElement) {
                        this._htmlAudioElement.pause();
                    } else {
                        this._streamingSource.disconnect();
                    }
                }
                else if (Engine.audioEngine.audioContext) {
                    this.stop(0);
                    this._startOffset += Engine.audioEngine.audioContext.currentTime - this._startTime;
                }
            }
        }

        /**
         * Sets a dedicated volume for this sounds
         * @param newVolume Define the new volume of the sound
         * @param time Define in how long the sound should be at this value
         */
        public setVolume(newVolume: number, time?: number): void {
            if (Engine.audioEngine.canUseWebAudio && this._soundGain) {
                if (time && Engine.audioEngine.audioContext) {
                    this._soundGain.gain.cancelScheduledValues(Engine.audioEngine.audioContext.currentTime);
                    this._soundGain.gain.setValueAtTime(this._soundGain.gain.value, Engine.audioEngine.audioContext.currentTime);
                    this._soundGain.gain.linearRampToValueAtTime(newVolume, Engine.audioEngine.audioContext.currentTime + time);
                }
                else {
                    this._soundGain.gain.value = newVolume;
                }
            }
            this._volume = newVolume;
        }

        /**
         * Set the sound play back rate
         * @param newPlaybackRate Define the playback rate the sound should be played at
         */
        public setPlaybackRate(newPlaybackRate: number): void {
            this._playbackRate = newPlaybackRate;
            if (this.isPlaying) {
                if (this._streaming && this._htmlAudioElement) {
                    this._htmlAudioElement.playbackRate = this._playbackRate;
                }
                else if (this._soundSource) {
                    this._soundSource.playbackRate.value = this._playbackRate;
                }
            }
        }

        /**
         * Gets the volume of the sound.
         * @returns the volume of the sound
         */
        public getVolume(): number {
            return this._volume;
        }

        /**
         * Attach the sound to a dedicated mesh
         * @param meshToConnectTo The mesh to connect the sound with
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#attaching-a-sound-to-a-mesh
         */
        public attachToMesh(meshToConnectTo: AbstractMesh): void {
            if (this._connectedMesh && this._registerFunc) {
                this._connectedMesh.unregisterAfterWorldMatrixUpdate(this._registerFunc);
                this._registerFunc = null;
            }
            this._connectedMesh = meshToConnectTo;
            if (!this.spatialSound) {
                this.spatialSound = true;
                this._createSpatialParameters();
                if (this.isPlaying && this.loop) {
                    this.stop();
                    this.play();
                }
            }
            this._onRegisterAfterWorldMatrixUpdate(this._connectedMesh);
            this._registerFunc = (connectedMesh: TransformNode) => this._onRegisterAfterWorldMatrixUpdate(connectedMesh);
            meshToConnectTo.registerAfterWorldMatrixUpdate(this._registerFunc);
        }

        /**
         * Detach the sound from the previously attached mesh
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#attaching-a-sound-to-a-mesh
         */
        public detachFromMesh() {
            if (this._connectedMesh && this._registerFunc) {
                this._connectedMesh.unregisterAfterWorldMatrixUpdate(this._registerFunc);
                this._registerFunc = null;
                this._connectedMesh = null;
            }
        }

        private _onRegisterAfterWorldMatrixUpdate(node: TransformNode): void {
            if (!(<any>node).getBoundingInfo) {
                return;
            }
            let mesh = node as AbstractMesh;
            if (this._positionInEmitterSpace) {
                mesh.worldMatrixFromCache.invertToRef(Tmp.Matrix[0]);
                this.setPosition(Tmp.Matrix[0].getTranslation());
            }
            else
            {
                let boundingInfo = mesh.getBoundingInfo();
                this.setPosition(boundingInfo.boundingSphere.centerWorld);
            }
            if (Engine.audioEngine.canUseWebAudio && this._isDirectional && this.isPlaying) {
                this._updateDirection();
            }
        }

        /**
         * Clone the current sound in the scene.
         * @returns the new sound clone
         */
        public clone(): Nullable<Sound> {
            if (!this._streaming) {
                var setBufferAndRun = () => {
                    if (this._isReadyToPlay) {
                        clonedSound._audioBuffer = this.getAudioBuffer();
                        clonedSound._isReadyToPlay = true;
                        if (clonedSound.autoplay) { clonedSound.play(); }
                    }
                    else {
                        window.setTimeout(setBufferAndRun, 300);
                    }
                };

                var currentOptions = {
                    autoplay: this.autoplay, loop: this.loop,
                    volume: this._volume, spatialSound: this.spatialSound, maxDistance: this.maxDistance,
                    useCustomAttenuation: this.useCustomAttenuation, rolloffFactor: this.rolloffFactor,
                    refDistance: this.refDistance, distanceModel: this.distanceModel
                };

                var clonedSound = new Sound(this.name + "_cloned", new ArrayBuffer(0), this._scene, null, currentOptions);
                if (this.useCustomAttenuation) {
                    clonedSound.setAttenuationFunction(this._customAttenuationFunction);
                }
                clonedSound.setPosition(this._position);
                clonedSound.setPlaybackRate(this._playbackRate);
                setBufferAndRun();

                return clonedSound;
            }
            // Can't clone a streaming sound
            else {
                return null;
            }
        }

        /**
         * Gets the current underlying audio buffer containing the data
         * @returns the audio buffer
         */
        public getAudioBuffer(): Nullable<AudioBuffer> {
            return this._audioBuffer;
        }

        /**
         * Serializes the Sound in a JSON representation
         * @returns the JSON representation of the sound
         */
        public serialize(): any {
            var serializationObject: any = {
                name: this.name,
                url: this.name,
                autoplay: this.autoplay,
                loop: this.loop,
                volume: this._volume,
                spatialSound: this.spatialSound,
                maxDistance: this.maxDistance,
                rolloffFactor: this.rolloffFactor,
                refDistance: this.refDistance,
                distanceModel: this.distanceModel,
                playbackRate: this._playbackRate,
                panningModel: this._panningModel,
                soundTrackId: this.soundTrackId
            };

            if (this.spatialSound) {
                if (this._connectedMesh) {
                    serializationObject.connectedMeshId = this._connectedMesh.id;
                }

                serializationObject.position = this._position.asArray();
                serializationObject.refDistance = this.refDistance;
                serializationObject.distanceModel = this.distanceModel;

                serializationObject.isDirectional = this._isDirectional;
                serializationObject.localDirectionToMesh = this._localDirection.asArray();
                serializationObject.coneInnerAngle = this._coneInnerAngle;
                serializationObject.coneOuterAngle = this._coneOuterAngle;
                serializationObject.coneOuterGain = this._coneOuterGain;
            }

            return serializationObject;
        }

        /**
         * Parse a JSON representation of a sound to innstantiate in a given scene
         * @param parsedSound Define the JSON representation of the sound (usually coming from the serialize method)
         * @param scene Define the scene the new parsed sound should be created in
         * @param rootUrl Define the rooturl of the load in case we need to fetch relative dependencies
         * @param sourceSound Define a cound place holder if do not need to instantiate a new one
         * @returns the newly parsed sound
         */
        public static Parse(parsedSound: any, scene: Scene, rootUrl: string, sourceSound?: Sound): Sound {
            var soundName = parsedSound.name;
            var soundUrl;

            if (parsedSound.url) {
                soundUrl = rootUrl + parsedSound.url;
            }
            else {
                soundUrl = rootUrl + soundName;
            }

            var options = {
                autoplay: parsedSound.autoplay, loop: parsedSound.loop, volume: parsedSound.volume,
                spatialSound: parsedSound.spatialSound, maxDistance: parsedSound.maxDistance,
                rolloffFactor: parsedSound.rolloffFactor,
                refDistance: parsedSound.refDistance,
                distanceModel: parsedSound.distanceModel,
                playbackRate: parsedSound.playbackRate
            };

            var newSound: Sound;

            if (!sourceSound) {
                newSound = new Sound(soundName, soundUrl, scene, () => { scene._removePendingData(newSound); }, options);
                scene._addPendingData(newSound);
            }
            else {
                var setBufferAndRun = () => {
                    if (sourceSound._isReadyToPlay) {
                        newSound._audioBuffer = sourceSound.getAudioBuffer();
                        newSound._isReadyToPlay = true;
                        if (newSound.autoplay) { newSound.play(); }
                    }
                    else {
                        window.setTimeout(setBufferAndRun, 300);
                    }
                };

                newSound = new Sound(soundName, new ArrayBuffer(0), scene, null, options);
                setBufferAndRun();
            }

            if (parsedSound.position) {
                var soundPosition = Vector3.FromArray(parsedSound.position);
                newSound.setPosition(soundPosition);
            }
            if (parsedSound.isDirectional) {
                newSound.setDirectionalCone(parsedSound.coneInnerAngle || 360, parsedSound.coneOuterAngle || 360, parsedSound.coneOuterGain || 0);
                if (parsedSound.localDirectionToMesh) {
                    var localDirectionToMesh = Vector3.FromArray(parsedSound.localDirectionToMesh);
                    newSound.setLocalDirectionToMesh(localDirectionToMesh);
                }
            }
            if (parsedSound.connectedMeshId) {
                var connectedMesh = scene.getMeshByID(parsedSound.connectedMeshId);
                if (connectedMesh) {
                    newSound.attachToMesh(connectedMesh);
                }
            }

            return newSound;
        }
    }
}
