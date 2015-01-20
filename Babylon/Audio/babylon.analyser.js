var BABYLON;
(function (BABYLON) {
    var Analyser = (function () {
        function Analyser(scene) {
            this.SMOOTHING = 0.75;
            this.FFT_SIZE = 512;
            this.BARGRAPHAMPLITUDE = 256;
            this._debugCanvasWidth = 320;
            this._debugCanvasHeight = 200;
            this._scene = scene;
            this._audioEngine = scene.getEngine().getAudioEngine();
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser = this._audioEngine.audioContext.createAnalyser();
                this._webAudioAnalyser.minDecibels = -140;
                this._webAudioAnalyser.maxDecibels = 0;
                this._byteFreqs = new Uint8Array(this._webAudioAnalyser.frequencyBinCount);
                this._byteTime = new Uint8Array(this._webAudioAnalyser.frequencyBinCount);
                this._floatFreqs = new Float32Array(this._webAudioAnalyser.frequencyBinCount);
            }
        }
        Analyser.prototype.getFrequencyBinCount = function () {
            return this._webAudioAnalyser.frequencyBinCount;
        };

        Analyser.prototype.getByteFrequencyData = function () {
            this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
            this._webAudioAnalyser.fftSize = this.FFT_SIZE;
            this._webAudioAnalyser.getByteFrequencyData(this._byteFreqs);
            return this._byteFreqs;
        };

        Analyser.prototype.getByteTimeDomainData = function () {
            this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
            this._webAudioAnalyser.fftSize = this.FFT_SIZE;
            this._webAudioAnalyser.getByteTimeDomainData(this._byteTime);
            return this._byteTime;
        };

        Analyser.prototype.getFloatFrequencyData = function () {
            this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
            this._webAudioAnalyser.fftSize = this.FFT_SIZE;
            this._webAudioAnalyser.getFloatFrequencyData(this._floatFreqs);
            return this._floatFreqs;
        };

        Analyser.prototype.drawDebugCanvas = function () {
            var _this = this;
            if (this._audioEngine.canUseWebAudio) {
                if (!this._debugCanvas) {
                    this._debugCanvas = document.createElement("canvas");
                    this._debugCanvas.width = this._debugCanvasWidth;
                    this._debugCanvas.height = this._debugCanvasHeight;
                    this._debugCanvas.style.position = "absolute";
                    this._debugCanvas.style.top = "30px";
                    this._debugCanvas.style.left = "10px";
                    this._debugCanvasContext = this._debugCanvas.getContext("2d");
                    document.body.appendChild(this._debugCanvas);
                    this._registerFunc = function () {
                        _this.drawDebugCanvas();
                    };
                    this._scene.registerBeforeRender(this._registerFunc);
                }
                if (this._registerFunc) {
                    var workingArray = this.getByteFrequencyData();

                    this._debugCanvasContext.fillStyle = 'rgb(0, 0, 0)';
                    this._debugCanvasContext.fillRect(0, 0, this._debugCanvasWidth, this._debugCanvasHeight);

                    for (var i = 0; i < this.getFrequencyBinCount(); i++) {
                        var value = workingArray[i];
                        var percent = value / this.BARGRAPHAMPLITUDE;
                        var height = this._debugCanvasHeight * percent;
                        var offset = this._debugCanvasHeight - height - 1;
                        var barWidth = this._debugCanvasWidth / this.getFrequencyBinCount();
                        var hue = i / this.getFrequencyBinCount() * 360;
                        this._debugCanvasContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
                        this._debugCanvasContext.fillRect(i * barWidth, offset, barWidth, height);
                    }
                }
            }
        };

        Analyser.prototype.stopDebugCanvas = function () {
            if (this._debugCanvas) {
                this._scene.unregisterBeforeRender(this._registerFunc);
                this._registerFunc = null;
                document.body.removeChild(this._debugCanvas);
                this._debugCanvas = null;
                this._debugCanvasContext = null;
            }
        };

        Analyser.prototype.connectAudioNodes = function (inputAudioNode, outputAudioNode) {
            if (this._audioEngine.canUseWebAudio) {
                inputAudioNode.connect(this._webAudioAnalyser);
                this._webAudioAnalyser.connect(outputAudioNode);
            }
        };
        return Analyser;
    })();
    BABYLON.Analyser = Analyser;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.analyser.js.map
