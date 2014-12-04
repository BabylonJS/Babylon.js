var BABYLON;
(function (BABYLON) {
    var Sound = (function () {
        function Sound(url, audioEngine, readyToPlayCallback, distanceMax, autoplay, loop) {
            var _this = this;
            this.distanceMax = 10;
            this.autoplay = false;
            this.loop = false;
            this._position = BABYLON.Vector3.Zero();
            this._isLoaded = false;
            this._isReadyToPlay = false;
            this._audioEngine = audioEngine;
            this._readyToPlayCallback = readyToPlayCallback;
            if (distanceMax)
                this.distanceMax = distanceMax;
            if (autoplay)
                this.autoplay = autoplay;
            if (loop)
                this.loop = loop;
            if (audioEngine.canUseWebAudio) {
                BABYLON.Tools.LoadFile(url, function (data) {
                    _this._soundLoaded(data);
                }, null, null, true);
            }
        }
        Sound.prototype.setPosition = function (newPosition) {
            if (this._isReadyToPlay) {
                this._position = newPosition;
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        };

        Sound.prototype.play = function () {
            if (this._isReadyToPlay) {
                this._soundSource = this._audioEngine.audioContext.createBufferSource();
                this._soundSource.buffer = this._audioBuffer;
                this._soundPanner = this._audioEngine.audioContext.createPanner();
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
                this._soundPanner.connect(this._audioEngine.audioContext.destination);
                this._soundSource.connect(this._soundPanner);
                this._soundSource.loop = this.loop;
                this._soundSource.start(0);
            }
        };

        Sound.prototype.stop = function () {
        };

        Sound.prototype.pause = function () {
        };

        Sound.prototype._soundLoaded = function (audioData) {
            var _this = this;
            this._isLoaded = true;
            this._audioEngine.audioContext.decodeAudioData(audioData, function (buffer) {
                _this._audioBuffer = buffer;
                _this._isReadyToPlay = true;
                if (_this.autoplay)
                    _this.play();
                if (_this._readyToPlayCallback)
                    _this._readyToPlayCallback();
            }, null);
        };
        return Sound;
    })();
    BABYLON.Sound = Sound;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.sound.js.map
