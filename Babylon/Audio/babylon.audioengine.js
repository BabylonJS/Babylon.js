var BABYLON;
(function (BABYLON) {
    // We're mainly based on the logic defined into the FreeCamera code
    var AudioEngine = (function () {
        function AudioEngine() {
            this.audioContext = null;
            this.canUseWebAudio = true;
            try  {
                if (typeof AudioContext !== 'undefined') {
                    this.audioContext = new AudioContext();
                } else if (typeof webkitAudioContext !== 'undefined') {
                    this.audioContext = new webkitAudioContext();
                } else {
                    this.canUseWebAudio = false;
                }
            } catch (e) {
                // Web
                this.canUseWebAudio = false;
            }
        }
        return AudioEngine;
    })();
    BABYLON.AudioEngine = AudioEngine;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.audioengine.js.map
