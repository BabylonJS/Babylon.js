﻿module BABYLON {
    export class Sound {
        public name: string;
        public autoplay: boolean = false;
        public loop: boolean = false;
        public useCustomAttenuation: boolean = false;
        public soundTrackId: number;
        public spatialSound: boolean = false;
        public refDistance: number = 1;
        public rolloffFactor: number = 1;
        public maxDistance: number = 100;
        public distanceModel: string = "linear";
        private _panningModel: string = "equalpower";
        public onended: () => any;
        private _playbackRate: number = 1;
        private _startTime: number = 0;
        private _startOffset: number = 0;
        private _position: Vector3 = Vector3.Zero();
        private _localDirection: Vector3 = new Vector3(1, 0, 0);
        private _volume: number = 1;
        private _isLoaded: boolean = false;
        private _isReadyToPlay: boolean = false;
        public isPlaying: boolean = false;
        public isPaused: boolean = false;
        private _isDirectional: boolean = false;
        private _readyToPlayCallback: () => any;
        private _audioBuffer: AudioBuffer;
        private _soundSource: AudioBufferSourceNode;
        private _soundPanner: PannerNode;
        private _soundGain: GainNode;
        private _inputAudioNode: AudioNode;
        private _ouputAudioNode: AudioNode;
        // Used if you'd like to create a directional sound.
        // If not set, the sound will be omnidirectional
        private _coneInnerAngle: number = 360;
        private _coneOuterAngle: number = 360;
        private _coneOuterGain: number = 0;
        private _scene: Scene;
        private _connectedMesh: AbstractMesh;
        private _customAttenuationFunction: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number;
        private _registerFunc: (connectedMesh: AbstractMesh) => any;

        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound 
        * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer 
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel
        */
        constructor(name: string, urlOrArrayBuffer: any, scene: Scene, readyToPlayCallback?: () => void, options?) {
            this.name = name;
            this._scene = scene;
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
            }

            if (Engine.audioEngine.canUseWebAudio) {
                this._soundGain = Engine.audioEngine.audioContext.createGain();
                this._soundGain.gain.value = this._volume;
                this._inputAudioNode = this._soundGain;
                this._ouputAudioNode = this._soundGain;
                if (this.spatialSound) {
                    this._createSpatialParameters();
                }
                this._scene.mainSoundTrack.AddSound(this);
                // if no parameter is passed, you need to call setAudioBuffer yourself to prepare the sound
                if (urlOrArrayBuffer) {
                    // If it's an URL
                    if (typeof (urlOrArrayBuffer) === "string") {
                        Tools.LoadFile(urlOrArrayBuffer, (data) => { this._soundLoaded(data); }, null, null, true);
                    }
                    else {
                        if (urlOrArrayBuffer instanceof ArrayBuffer) {
                            this._soundLoaded(urlOrArrayBuffer);
                        }
                        else {
                            Tools.Error("Parameter must be a URL to the sound or an ArrayBuffer of the sound.");
                        }
                    }
                }
            }
            else {
                // Adding an empty sound to avoid breaking audio calls for non Web Audio browsers
                this._scene.mainSoundTrack.AddSound(this);
                if (!Engine.audioEngine.WarnedWebAudioUnsupported) {
                    BABYLON.Tools.Error("Web Audio is not supported by your browser.");
                    Engine.audioEngine.WarnedWebAudioUnsupported = true;
                }
                // Simulating a ready to play event to avoid breaking code for non web audio browsers
                if (this._readyToPlayCallback) {
                    window.setTimeout(() => {
                        this._readyToPlayCallback();
                    }, 1000);
                }
            }
        }

        public dispose() {
            if (Engine.audioEngine.canUseWebAudio && this._isReadyToPlay) {
                if (this.isPlaying) {
                    this.stop();
                }
                this._isReadyToPlay = false;
                if (this.soundTrackId === -1) {
                    this._scene.mainSoundTrack.RemoveSound(this);
                }
                else {
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

                if (this._connectedMesh) {
                    this._connectedMesh.unregisterAfterWorldMatrixUpdate(this._registerFunc);
                    this._connectedMesh = null;
                }
            }
        }

        private _soundLoaded(audioData: ArrayBuffer) {
            this._isLoaded = true;
            Engine.audioEngine.audioContext.decodeAudioData(audioData, (buffer) => {
                this._audioBuffer = buffer;
                this._isReadyToPlay = true;
                if (this.autoplay) { this.play(); }
                if (this._readyToPlayCallback) { this._readyToPlayCallback(); }
            }, (error) => { Tools.Error("Error while decoding audio data: " + error.err); });
        }

        public setAudioBuffer(audioBuffer: AudioBuffer): void {
            if (Engine.audioEngine.canUseWebAudio) {
                this._audioBuffer = audioBuffer;
                this._isReadyToPlay = true;
            }
        }

        public updateOptions(options) {
            if (options) {
                this.loop = options.loop || this.loop;
                this.maxDistance = options.maxDistance || this.maxDistance;
                this.useCustomAttenuation = options.useCustomAttenuation || this.useCustomAttenuation;
                this.rolloffFactor = options.rolloffFactor || this.rolloffFactor;
                this.refDistance = options.refDistance || this.refDistance;
                this.distanceModel = options.distanceModel || this.distanceModel;
                this._playbackRate = options.playbackRate || this._playbackRate;
            }
        }

        private _createSpatialParameters() {
            if (Engine.audioEngine.canUseWebAudio) {
                if (this._scene.headphone) {
                    this._panningModel = "HRTF";
                }
                this._soundPanner = Engine.audioEngine.audioContext.createPanner();

                if (this.useCustomAttenuation) {
                    // Tricks to disable in a way embedded Web Audio attenuation 
                    this._soundPanner.distanceModel = "linear";
                    this._soundPanner.maxDistance = Number.MAX_VALUE;
                    this._soundPanner.refDistance = 1;
                    this._soundPanner.rolloffFactor = 1;
                    this._soundPanner.panningModel = this._panningModel;
                }
                else {
                    this._soundPanner.distanceModel = this.distanceModel;
                    this._soundPanner.maxDistance = this.maxDistance;
                    this._soundPanner.refDistance = this.refDistance;
                    this._soundPanner.rolloffFactor = this.rolloffFactor;
                    this._soundPanner.panningModel = this._panningModel;
                }
                this._soundPanner.connect(this._ouputAudioNode);
                this._inputAudioNode = this._soundPanner;
            }
        }

        public switchPanningModelToHRTF() {
            this._panningModel = "HRTF";
            this._switchPanningModel();    
        }

        public switchPanningModelToEqualPower() {
            this._panningModel = "equalpower";
            this._switchPanningModel();
        }

        private _switchPanningModel() {
            if (Engine.audioEngine.canUseWebAudio && this.spatialSound) {
                this._soundPanner.panningModel = this._panningModel;
            }
        }

        public connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode) {
            if (Engine.audioEngine.canUseWebAudio) {
                this._ouputAudioNode.disconnect();
                this._ouputAudioNode.connect(soundTrackAudioNode);
            }
        }

        /**
        * Transform this sound into a directional source
        * @param coneInnerAngle Size of the inner cone in degree
        * @param coneOuterAngle Size of the outer cone in degree
        * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
        */
        public setDirectionalCone(coneInnerAngle: number, coneOuterAngle: number, coneOuterGain: number) {
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

        public setPosition(newPosition: Vector3) {
            this._position = newPosition;

            if (Engine.audioEngine.canUseWebAudio && this.spatialSound) {
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        }

        public setLocalDirectionToMesh(newLocalDirection: Vector3) {
            this._localDirection = newLocalDirection;

            if (Engine.audioEngine.canUseWebAudio && this._connectedMesh && this.isPlaying) {
                this._updateDirection();
            }
        }

        private _updateDirection() {
            var mat = this._connectedMesh.getWorldMatrix();
            var direction = Vector3.TransformNormal(this._localDirection, mat);
            direction.normalize();
            this._soundPanner.setOrientation(direction.x, direction.y, direction.z);
        }

        public updateDistanceFromListener() {
            if (Engine.audioEngine.canUseWebAudio && this._connectedMesh && this.useCustomAttenuation) {
                var distance = this._connectedMesh.getDistanceToCamera(this._scene.activeCamera);
                this._soundGain.gain.value = this._customAttenuationFunction(this._volume, distance, this.maxDistance, this.refDistance, this.rolloffFactor);
            }
        }

        public setAttenuationFunction(callback: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number) {
            this._customAttenuationFunction = callback;
        }

        /**
        * Play the sound
        * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
        */
        public play(time?: number) {
            if (this._isReadyToPlay && this._scene.audioEnabled) {
                try {
                    var startTime = time ? Engine.audioEngine.audioContext.currentTime + time : Engine.audioEngine.audioContext.currentTime;
                    if (!this._soundSource) {
                        if (this.spatialSound) {
                            this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
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
                    this._soundSource = Engine.audioEngine.audioContext.createBufferSource();
                    this._soundSource.buffer = this._audioBuffer;
                    this._soundSource.connect(this._inputAudioNode);
                    this._soundSource.loop = this.loop;
                    this._soundSource.playbackRate.value = this._playbackRate;
                    this._startTime = startTime;
                    this._soundSource.onended = () => { this._onended(); };
                    this._soundSource.start(this._startTime, this.isPaused ? this._startOffset % this._soundSource.buffer.duration : 0);
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
        }

        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        public stop(time?: number) {
            if (this.isPlaying) {
                var stopTime = time ? Engine.audioEngine.audioContext.currentTime + time : Engine.audioEngine.audioContext.currentTime;
                this._soundSource.stop(stopTime);
                this.isPlaying = false;
            }
        }

        public pause() {
            if (this.isPlaying) {
                this.stop(0);
                this._startOffset += Engine.audioEngine.audioContext.currentTime - this._startTime;
                this.isPaused = true;
            }
        }

        public setVolume(newVolume: number, time?: number) {
            if (Engine.audioEngine.canUseWebAudio && !this.spatialSound) {
                if (time) {
                    this._soundGain.gain.linearRampToValueAtTime(this._volume, Engine.audioEngine.audioContext.currentTime);
                    this._soundGain.gain.linearRampToValueAtTime(newVolume, time);
                }
                else {
                    this._soundGain.gain.value = newVolume;
                }
            }
            this._volume = newVolume;
        }

        public setPlaybackRate(newPlaybackRate: number) {
            this._playbackRate = newPlaybackRate;
            if (this.isPlaying) {
                this._soundSource.playbackRate.value = this._playbackRate;
            }
        }

        public getVolume(): number {
            return this._volume;
        }

        public attachToMesh(meshToConnectTo: AbstractMesh) {
            this._connectedMesh = meshToConnectTo;
            if (!this.spatialSound) {
                this._createSpatialParameters();
                this.spatialSound = true;
                if (this.isPlaying && this.loop) {
                    this.stop();
                    this.play();
                }
            }
            this._onRegisterAfterWorldMatrixUpdate(this._connectedMesh);
            this._registerFunc = (connectedMesh: AbstractMesh) => this._onRegisterAfterWorldMatrixUpdate(connectedMesh);
            meshToConnectTo.registerAfterWorldMatrixUpdate(this._registerFunc);
        }

        private _onRegisterAfterWorldMatrixUpdate(connectedMesh: AbstractMesh) {
            this.setPosition(connectedMesh.getBoundingInfo().boundingSphere.centerWorld);
            if (Engine.audioEngine.canUseWebAudio && this._isDirectional && this.isPlaying) {
                this._updateDirection();
            }
        }
    }
}
