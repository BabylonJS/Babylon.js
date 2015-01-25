module BABYLON {
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
        public panningModel: string = "HRTF";
        private _startTime: number = 0;
        private _startOffset: number = 0;
        private _position: Vector3 = Vector3.Zero();
        private _localDirection: Vector3 = new Vector3(1, 0, 0);
        private _volume: number = 1;
        private _isLoaded: boolean = false;
        private _isReadyToPlay: boolean = false;
        private _isPlaying: boolean = false;
        private _isDirectional: boolean = false;
        private _audioEngine: BABYLON.AudioEngine;
        private _readyToPlayCallback;
        private _audioBuffer;
        private _soundSource: AudioBufferSourceNode;
        private _soundPanner: PannerNode;
        private _soundGain: GainNode;
        private _audioNode: AudioNode;
        // Used if you'd like to create a directional sound.
        // If not set, the sound will be omnidirectional
        private _coneInnerAngle: number = 360;
        private _coneOuterAngle: number = 360;
        private _coneOuterGain: number = 0;
        private _scene: BABYLON.Scene;
        private _connectedMesh: BABYLON.AbstractMesh;
        private _customAttenuationFunction: (currentVolume: number, currentDistance: number, maxDistance: number, refDistance: number, rolloffFactor: number) => number;
        private _registerFunc;

        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound 
        * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer 
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel
        */
        constructor(name: string, urlOrArrayBuffer: any, scene: BABYLON.Scene, readyToPlayCallback?: () => void, options?) {
            this.name = name;
            this._scene = scene;
            this._audioEngine = this._scene.getEngine().getAudioEngine();
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
                this._volume = options.volume || 1;
                this.spatialSound = options.spatialSound || false;
                this.maxDistance = options.maxDistance || 100;
                this.useCustomAttenuation = options.useCustomAttenation || false;
                this.rolloffFactor = options.rolloffFactor || 1;
                this.refDistance = options.refDistance || 1;
                this.distanceModel = options.distanceModel || "linear";
                this.panningModel = options.panningModel || "HRTF";
            }

            if (this._audioEngine.canUseWebAudio) {
                this._soundGain = this._audioEngine.audioContext.createGain();
                this._soundGain.gain.value = this._volume;
                if (this.spatialSound) {
                    this._createSpatialParameters();
                }
                else {
                    this._audioNode = this._soundGain;
                }
                this._scene.mainSoundTrack.AddSound(this);
                if (typeof (urlOrArrayBuffer) === "string") {
                    BABYLON.Tools.LoadFile(urlOrArrayBuffer,(data) => { this._soundLoaded(data); }, null, null, true);
                }
                else {
                    if (urlOrArrayBuffer instanceof ArrayBuffer) {
                        this._soundLoaded(urlOrArrayBuffer);
                    }
                    else {
                        BABYLON.Tools.Error("Parameter must be a URL to the sound or an ArrayBuffer of the sound.");
                    }
                }
            }
        }

        public dispose() {
            if (this._audioEngine.canUseWebAudio && this._isReadyToPlay) {
                if (this._isPlaying) {
                    this.stop();
                }
                this._isReadyToPlay = false;
                if (this.soundTrackId === -1) {
                    this._scene.mainSoundTrack.RemoveSound(this);
                }
                else {
                    this._scene.soundTracks[this.soundTrackId].RemoveSound(this);
                }
                this._soundGain.disconnect();
                this._soundSource.disconnect();
                this._audioBuffer = null;
                this._soundGain = null;
                this._soundSource = null;
                if (this._soundPanner) {
                    this._soundPanner.disconnect();
                    this._soundPanner = null;
                }
                this._audioNode.disconnect();
                if (this._connectedMesh) {
                    this._connectedMesh.unregisterAfterWorldMatrixUpdate(this._registerFunc);
                    this._connectedMesh = null;
                }
            }
        }

        private _soundLoaded(audioData: ArrayBuffer) {
            this._isLoaded = true;
            this._audioEngine.audioContext.decodeAudioData(audioData,(buffer) => {
                this._audioBuffer = buffer;
                this._isReadyToPlay = true;
                if (this.autoplay) { this.play(); }
                if (this._readyToPlayCallback) { this._readyToPlayCallback(); }
            }, function (error) {
                    BABYLON.Tools.Error("Error while decoding audio data: " + error.err);
                });
        }

        public updateOptions(options) {
            if (options) {
                this.loop = options.loop || this.loop;
                this.maxDistance = options.maxDistance || this.maxDistance;
                this.useCustomAttenuation = options.useCustomAttenation || this.useCustomAttenuation;
                this.rolloffFactor = options.rolloffFactor || this.rolloffFactor;
                this.refDistance = options.refDistance || this.refDistance;
                this.distanceModel = options.distanceModel || this.distanceModel;
                this.panningModel = options.panningModel || this.panningModel;
            }
        }

        private _createSpatialParameters() {
            if (this._audioEngine.canUseWebAudio) {
                this._soundPanner = this._audioEngine.audioContext.createPanner();

                if (this.useCustomAttenuation) {
                    // Tricks to disable in a way embedded Web Audio attenuation 
                    this._soundPanner.distanceModel = "linear";
                    this._soundPanner.maxDistance = Number.MAX_VALUE;
                    this._soundPanner.refDistance = 1;
                    this._soundPanner.rolloffFactor = 1;
                    this._soundPanner.panningModel = "HRTF";
                }
                else {
                    this._soundPanner.distanceModel = this.distanceModel;
                    this._soundPanner.maxDistance = this.maxDistance;
                    this._soundPanner.refDistance = this.refDistance;
                    this._soundPanner.rolloffFactor = this.rolloffFactor;
                    this._soundPanner.panningModel = this.panningModel;
                }
                this._soundPanner.connect(this._soundGain);
                this._audioNode = this._soundPanner;
            }
        }

        public connectToSoundTrackAudioNode(soundTrackAudioNode: AudioNode) {
            if (this._audioEngine.canUseWebAudio) {
                this._audioNode.disconnect();
                this._audioNode.connect(soundTrackAudioNode);
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
                BABYLON.Tools.Error("setDirectionalCone(): outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }
            this._coneInnerAngle = coneInnerAngle;
            this._coneOuterAngle = coneOuterAngle;
            this._coneOuterGain = coneOuterGain;
            this._isDirectional = true;

            if (this._isPlaying && this.loop) {
                this.stop();
                this.play();
            }
        }

        public setPosition(newPosition: Vector3) {
            this._position = newPosition;

            if (this._isPlaying && this.spatialSound) {
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        }

        public setLocalDirectionToMesh(newLocalDirection: Vector3) {
            this._localDirection = newLocalDirection;

            if (this._connectedMesh && this._isPlaying) {
                this._updateDirection();
            }
        }

        private _updateDirection() {
            var mat = this._connectedMesh.getWorldMatrix();
            var direction = BABYLON.Vector3.TransformNormal(this._localDirection, mat);
            direction.normalize();
            this._soundPanner.setOrientation(direction.x, direction.y, direction.z);
        }

        public updateDistanceFromListener() {
            if (this._connectedMesh && this.useCustomAttenuation) {
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
            if (this._isReadyToPlay) {
                try {
                    var startTime = time ? this._audioEngine.audioContext.currentTime + time : 0;
                    this._soundSource = this._audioEngine.audioContext.createBufferSource();
                    this._soundSource.buffer = this._audioBuffer;
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
                    this._soundSource.connect(this._audioNode);
                    this._soundSource.loop = this.loop;
                    this._startTime = startTime;
                    this._soundSource.start(startTime, this._startOffset % this._soundSource.buffer.duration);
                    this._isPlaying = true;
                }
                catch (ex) {
                    BABYLON.Tools.Error("Error while trying to play audio: " + this.name + ", " + ex.message);
                }
            }
        }

        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        public stop(time?: number) {
            if (this._isPlaying) {
                var stopTime = time ? this._audioEngine.audioContext.currentTime + time : 0;
                this._soundSource.stop(stopTime);
                this._isPlaying = false;
            }
        }

        public pause() {
            if (this._isPlaying) {
                this._soundSource.stop(0);
                this._startOffset += this._audioEngine.audioContext.currentTime - this._startTime;
            }
        }

        public setVolume(newVolume: number) {
            this._volume = newVolume;
            if (this._audioEngine.canUseWebAudio) {
                this._soundGain.gain.value = newVolume;
            }
        }

        public getVolume(): number {
            return this._volume;
        }

        public attachToMesh(meshToConnectTo: BABYLON.AbstractMesh) {
            this._connectedMesh = meshToConnectTo;
            if (!this.spatialSound) {
                this._createSpatialParameters();
                this.spatialSound = true;
                if (this._isPlaying && this.loop) {
                    this.stop();
                    this.play();
                }
            }
            this._registerFunc = (connectedMesh: BABYLON.AbstractMesh) => this._onRegisterAfterWorldMatrixUpdate(connectedMesh);
            meshToConnectTo.registerAfterWorldMatrixUpdate(this._registerFunc);
        }

        private _onRegisterAfterWorldMatrixUpdate(connectedMesh: BABYLON.AbstractMesh) {
            this.setPosition(connectedMesh.position);
            if (this._isDirectional && this._isPlaying) {
                this._updateDirection();
            }
        }
    }
}