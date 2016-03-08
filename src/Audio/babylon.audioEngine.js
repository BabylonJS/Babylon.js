var BABYLON;
(function (BABYLON) {
    var AudioEngine = (function () {
        function AudioEngine() {
            this._audioContext = null;
            this._audioContextInitialized = false;
            this.canUseWebAudio = false;
            this.WarnedWebAudioUnsupported = false;
            this.unlocked = false;
            if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.canUseWebAudio = true;
            }
            if (/iPad|iPhone|iPod/.test(navigator.platform)) {
                this._unlockiOSaudio();
            }
            else {
                this.unlocked = true;
            }
        }
        Object.defineProperty(AudioEngine.prototype, "audioContext", {
            get: function () {
                if (!this._audioContextInitialized) {
                    this._initializeAudioContext();
                }
                return this._audioContext;
            },
            enumerable: true,
            configurable: true
        });
        AudioEngine.prototype._unlockiOSaudio = function () {
            var _this = this;
            var unlockaudio = function () {
                var buffer = _this.audioContext.createBuffer(1, 1, 22050);
                var source = _this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(_this.audioContext.destination);
                source.start(0);
                setTimeout(function () {
                    if ((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
                        _this.unlocked = true;
                        window.removeEventListener('touchend', unlockaudio, false);
                        if (_this.onAudioUnlocked) {
                            _this.onAudioUnlocked();
                        }
                    }
                }, 0);
            };
            window.addEventListener('touchend', unlockaudio, false);
        };
        AudioEngine.prototype._initializeAudioContext = function () {
            try {
                if (this.canUseWebAudio) {
                    this._audioContext = new AudioContext();
                    // create a global volume gain node 
                    this.masterGain = this._audioContext.createGain();
                    this.masterGain.gain.value = 1;
                    this.masterGain.connect(this._audioContext.destination);
                    this._audioContextInitialized = true;
                }
            }
            catch (e) {
                this.canUseWebAudio = false;
                BABYLON.Tools.Error("Web Audio: " + e.message);
            }
        };
        AudioEngine.prototype.dispose = function () {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                if (this._connectedAnalyser) {
                    this._connectedAnalyser.stopDebugCanvas();
                    this._connectedAnalyser.dispose();
                    this.masterGain.disconnect();
                    this.masterGain.connect(this._audioContext.destination);
                    this._connectedAnalyser = null;
                }
                this.masterGain.gain.value = 1;
            }
            this.WarnedWebAudioUnsupported = false;
        };
        AudioEngine.prototype.getGlobalVolume = function () {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                return this.masterGain.gain.value;
            }
            else {
                return -1;
            }
        };
        AudioEngine.prototype.setGlobalVolume = function (newVolume) {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                this.masterGain.gain.value = newVolume;
            }
        };
        AudioEngine.prototype.connectToAnalyser = function (analyser) {
            if (this._connectedAnalyser) {
                this._connectedAnalyser.stopDebugCanvas();
            }
            if (this.canUseWebAudio && this._audioContextInitialized) {
                this._connectedAnalyser = analyser;
                this.masterGain.disconnect();
                this._connectedAnalyser.connectAudioNodes(this.masterGain, this._audioContext.destination);
            }
        };
        return AudioEngine;
    }());
    BABYLON.AudioEngine = AudioEngine;
})(BABYLON || (BABYLON = {}));
