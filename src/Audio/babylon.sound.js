var BABYLON;
(function (BABYLON) {
    var Sound = (function () {
        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound
        * @param urlOrArrayBuffer Url to the sound to load async or ArrayBuffer
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, volume, spatialSound, maxDistance, rolloffFactor, refDistance, distanceModel, panningModel
        */
        function Sound(name, urlOrArrayBuffer, scene, readyToPlayCallback, options) {
            var _this = this;
            this.autoplay = false;
            this.loop = false;
            this.useCustomAttenuation = false;
            this.spatialSound = false;
            this.refDistance = 1;
            this.rolloffFactor = 1;
            this.maxDistance = 100;
            this.distanceModel = "linear";
            this._panningModel = "equalpower";
            this._playbackRate = 1;
            this._startTime = 0;
            this._startOffset = 0;
            this._position = BABYLON.Vector3.Zero();
            this._localDirection = new BABYLON.Vector3(1, 0, 0);
            this._volume = 1;
            this._isLoaded = false;
            this._isReadyToPlay = false;
            this.isPlaying = false;
            this.isPaused = false;
            this._isDirectional = false;
            // Used if you'd like to create a directional sound.
            // If not set, the sound will be omnidirectional
            this._coneInnerAngle = 360;
            this._coneOuterAngle = 360;
            this._coneOuterGain = 0;
            this.name = name;
            this._scene = scene;
            this._readyToPlayCallback = readyToPlayCallback;
            // Default custom attenuation function is a linear attenuation
            this._customAttenuationFunction = function (currentVolume, currentDistance, maxDistance, refDistance, rolloffFactor) {
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
            if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                this._soundGain = BABYLON.Engine.audioEngine.audioContext.createGain();
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
                        BABYLON.Tools.LoadFile(urlOrArrayBuffer, function (data) { _this._soundLoaded(data); }, null, null, true);
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
            else {
                // Adding an empty sound to avoid breaking audio calls for non Web Audio browsers
                this._scene.mainSoundTrack.AddSound(this);
                if (!BABYLON.Engine.audioEngine.WarnedWebAudioUnsupported) {
                    BABYLON.Tools.Error("Web Audio is not supported by your browser.");
                    BABYLON.Engine.audioEngine.WarnedWebAudioUnsupported = true;
                }
                // Simulating a ready to play event to avoid breaking code for non web audio browsers
                if (this._readyToPlayCallback) {
                    window.setTimeout(function () {
                        _this._readyToPlayCallback();
                    }, 1000);
                }
            }
        }
        Sound.prototype.dispose = function () {
            if (BABYLON.Engine.audioEngine.canUseWebAudio && this._isReadyToPlay) {
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
        };
        Sound.prototype._soundLoaded = function (audioData) {
            var _this = this;
            this._isLoaded = true;
            BABYLON.Engine.audioEngine.audioContext.decodeAudioData(audioData, function (buffer) {
                _this._audioBuffer = buffer;
                _this._isReadyToPlay = true;
                if (_this.autoplay) {
                    _this.play();
                }
                if (_this._readyToPlayCallback) {
                    _this._readyToPlayCallback();
                }
            }, function () { BABYLON.Tools.Error("Error while decoding audio data for: " + _this.name); });
        };
        Sound.prototype.setAudioBuffer = function (audioBuffer) {
            if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                this._audioBuffer = audioBuffer;
                this._isReadyToPlay = true;
            }
        };
        Sound.prototype.updateOptions = function (options) {
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
                    this._soundSource.playbackRate.value = this._playbackRate;
                }
            }
        };
        Sound.prototype._createSpatialParameters = function () {
            if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                if (this._scene.headphone) {
                    this._panningModel = "HRTF";
                }
                this._soundPanner = BABYLON.Engine.audioEngine.audioContext.createPanner();
                this._updateSpatialParameters();
                this._soundPanner.connect(this._ouputAudioNode);
                this._inputAudioNode = this._soundPanner;
            }
        };
        Sound.prototype._updateSpatialParameters = function () {
            if (this.spatialSound) {
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
            }
        };
        Sound.prototype.switchPanningModelToHRTF = function () {
            this._panningModel = "HRTF";
            this._switchPanningModel();
        };
        Sound.prototype.switchPanningModelToEqualPower = function () {
            this._panningModel = "equalpower";
            this._switchPanningModel();
        };
        Sound.prototype._switchPanningModel = function () {
            if (BABYLON.Engine.audioEngine.canUseWebAudio && this.spatialSound) {
                this._soundPanner.panningModel = this._panningModel;
            }
        };
        Sound.prototype.connectToSoundTrackAudioNode = function (soundTrackAudioNode) {
            if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                this._ouputAudioNode.disconnect();
                this._ouputAudioNode.connect(soundTrackAudioNode);
            }
        };
        /**
        * Transform this sound into a directional source
        * @param coneInnerAngle Size of the inner cone in degree
        * @param coneOuterAngle Size of the outer cone in degree
        * @param coneOuterGain Volume of the sound outside the outer cone (between 0.0 and 1.0)
        */
        Sound.prototype.setDirectionalCone = function (coneInnerAngle, coneOuterAngle, coneOuterGain) {
            if (coneOuterAngle < coneInnerAngle) {
                BABYLON.Tools.Error("setDirectionalCone(): outer angle of the cone must be superior or equal to the inner angle.");
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
        };
        Sound.prototype.setPosition = function (newPosition) {
            this._position = newPosition;
            if (BABYLON.Engine.audioEngine.canUseWebAudio && this.spatialSound) {
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        };
        Sound.prototype.setLocalDirectionToMesh = function (newLocalDirection) {
            this._localDirection = newLocalDirection;
            if (BABYLON.Engine.audioEngine.canUseWebAudio && this._connectedMesh && this.isPlaying) {
                this._updateDirection();
            }
        };
        Sound.prototype._updateDirection = function () {
            var mat = this._connectedMesh.getWorldMatrix();
            var direction = BABYLON.Vector3.TransformNormal(this._localDirection, mat);
            direction.normalize();
            this._soundPanner.setOrientation(direction.x, direction.y, direction.z);
        };
        Sound.prototype.updateDistanceFromListener = function () {
            if (BABYLON.Engine.audioEngine.canUseWebAudio && this._connectedMesh && this.useCustomAttenuation) {
                var distance = this._connectedMesh.getDistanceToCamera(this._scene.activeCamera);
                this._soundGain.gain.value = this._customAttenuationFunction(this._volume, distance, this.maxDistance, this.refDistance, this.rolloffFactor);
            }
        };
        Sound.prototype.setAttenuationFunction = function (callback) {
            this._customAttenuationFunction = callback;
        };
        /**
        * Play the sound
        * @param time (optional) Start the sound after X seconds. Start immediately (0) by default.
        */
        Sound.prototype.play = function (time) {
            var _this = this;
            if (this._isReadyToPlay && this._scene.audioEnabled) {
                try {
                    var startTime = time ? BABYLON.Engine.audioEngine.audioContext.currentTime + time : BABYLON.Engine.audioEngine.audioContext.currentTime;
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
                    this._soundSource = BABYLON.Engine.audioEngine.audioContext.createBufferSource();
                    this._soundSource.buffer = this._audioBuffer;
                    this._soundSource.connect(this._inputAudioNode);
                    this._soundSource.loop = this.loop;
                    this._soundSource.playbackRate.value = this._playbackRate;
                    this._startTime = startTime;
                    this._soundSource.onended = function () { _this._onended(); };
                    this._soundSource.start(this._startTime, this.isPaused ? this._startOffset % this._soundSource.buffer.duration : 0);
                    this.isPlaying = true;
                    this.isPaused = false;
                }
                catch (ex) {
                    BABYLON.Tools.Error("Error while trying to play audio: " + this.name + ", " + ex.message);
                }
            }
        };
        Sound.prototype._onended = function () {
            this.isPlaying = false;
            if (this.onended) {
                this.onended();
            }
        };
        /**
        * Stop the sound
        * @param time (optional) Stop the sound after X seconds. Stop immediately (0) by default.
        */
        Sound.prototype.stop = function (time) {
            if (this.isPlaying) {
                var stopTime = time ? BABYLON.Engine.audioEngine.audioContext.currentTime + time : BABYLON.Engine.audioEngine.audioContext.currentTime;
                this._soundSource.stop(stopTime);
                this.isPlaying = false;
            }
        };
        Sound.prototype.pause = function () {
            if (this.isPlaying) {
                this.stop(0);
                this._startOffset += BABYLON.Engine.audioEngine.audioContext.currentTime - this._startTime;
                this.isPaused = true;
            }
        };
        Sound.prototype.setVolume = function (newVolume, time) {
            if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                if (time) {
                    this._soundGain.gain.linearRampToValueAtTime(this._volume, BABYLON.Engine.audioEngine.audioContext.currentTime);
                    this._soundGain.gain.linearRampToValueAtTime(newVolume, time);
                }
                else {
                    this._soundGain.gain.value = newVolume;
                }
            }
            this._volume = newVolume;
        };
        Sound.prototype.setPlaybackRate = function (newPlaybackRate) {
            this._playbackRate = newPlaybackRate;
            if (this.isPlaying) {
                this._soundSource.playbackRate.value = this._playbackRate;
            }
        };
        Sound.prototype.getVolume = function () {
            return this._volume;
        };
        Sound.prototype.attachToMesh = function (meshToConnectTo) {
            var _this = this;
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
            this._registerFunc = function (connectedMesh) { return _this._onRegisterAfterWorldMatrixUpdate(connectedMesh); };
            meshToConnectTo.registerAfterWorldMatrixUpdate(this._registerFunc);
        };
        Sound.prototype._onRegisterAfterWorldMatrixUpdate = function (connectedMesh) {
            this.setPosition(connectedMesh.getBoundingInfo().boundingSphere.centerWorld);
            if (BABYLON.Engine.audioEngine.canUseWebAudio && this._isDirectional && this.isPlaying) {
                this._updateDirection();
            }
        };
        return Sound;
    })();
    BABYLON.Sound = Sound;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.sound.js.map