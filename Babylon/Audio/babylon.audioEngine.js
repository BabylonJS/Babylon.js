var BABYLON;
(function (BABYLON) {
    var AudioEngine = (function () {
        function AudioEngine() {
            this.audioContext = null;
            this.canUseWebAudio = false;
            this.WarnedWebAudioUnsupported = false;
            try {
                if (typeof AudioContext !== 'undefined') {
                    this.audioContext = new AudioContext();
                    this.canUseWebAudio = true;
                }
                else if (typeof webkitAudioContext !== 'undefined') {
                    this.audioContext = new webkitAudioContext();
                    this.canUseWebAudio = true;
                }
            }
            catch (e) {
                this.canUseWebAudio = false;
                BABYLON.Tools.Error("Web Audio: " + e.message);
            }
            // create a global volume gain node 
            if (this.canUseWebAudio) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 1;
                this.masterGain.connect(this.audioContext.destination);
            }
        }
        AudioEngine.prototype.dispose = function () {
            if (this.canUseWebAudio) {
                if (this._connectedAnalyser) {
                    this._connectedAnalyser.stopDebugCanvas();
                    this._connectedAnalyser.dispose();
                    this.masterGain.disconnect();
                    this.masterGain.connect(this.audioContext.destination);
                    this._connectedAnalyser = null;
                }
                this.masterGain.gain.value = 1;
            }
            this.WarnedWebAudioUnsupported = false;
        };
        AudioEngine.prototype.getGlobalVolume = function () {
            if (this.canUseWebAudio) {
                return this.masterGain.gain.value;
            }
            else {
                return -1;
            }
        };
        AudioEngine.prototype.setGlobalVolume = function (newVolume) {
            if (this.canUseWebAudio) {
                this.masterGain.gain.value = newVolume;
            }
        };
        AudioEngine.prototype.connectToAnalyser = function (analyser) {
            if (this._connectedAnalyser) {
                this._connectedAnalyser.stopDebugCanvas();
            }
            this._connectedAnalyser = analyser;
            if (this.canUseWebAudio) {
                this.masterGain.disconnect();
                this._connectedAnalyser.connectAudioNodes(this.masterGain, this.audioContext.destination);
            }
        };
        return AudioEngine;
    })();
    BABYLON.AudioEngine = AudioEngine;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.audioEngine.js.map