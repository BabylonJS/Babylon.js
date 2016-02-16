var BABYLON;
(function (BABYLON) {
    var Analyser = (function () {
        function Analyser(scene) {
            this.SMOOTHING = 0.75;
            this.FFT_SIZE = 512;
            this.BARGRAPHAMPLITUDE = 256;
            this.DEBUGCANVASPOS = { x: 20, y: 20 };
            this.DEBUGCANVASSIZE = { width: 320, height: 200 };
            this._scene = scene;
            this._audioEngine = BABYLON.Engine.audioEngine;
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
            if (this._audioEngine.canUseWebAudio) {
                return this._webAudioAnalyser.frequencyBinCount;
            }
            else {
                return 0;
            }
        };
        Analyser.prototype.getByteFrequencyData = function () {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
                this._webAudioAnalyser.fftSize = this.FFT_SIZE;
                this._webAudioAnalyser.getByteFrequencyData(this._byteFreqs);
            }
            return this._byteFreqs;
        };
        Analyser.prototype.getByteTimeDomainData = function () {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
                this._webAudioAnalyser.fftSize = this.FFT_SIZE;
                this._webAudioAnalyser.getByteTimeDomainData(this._byteTime);
            }
            return this._byteTime;
        };
        Analyser.prototype.getFloatFrequencyData = function () {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
                this._webAudioAnalyser.fftSize = this.FFT_SIZE;
                this._webAudioAnalyser.getFloatFrequencyData(this._floatFreqs);
            }
            return this._floatFreqs;
        };
        Analyser.prototype.drawDebugCanvas = function () {
            var _this = this;
            if (this._audioEngine.canUseWebAudio) {
                if (!this._debugCanvas) {
                    this._debugCanvas = document.createElement("canvas");
                    this._debugCanvas.width = this.DEBUGCANVASSIZE.width;
                    this._debugCanvas.height = this.DEBUGCANVASSIZE.height;
                    this._debugCanvas.style.position = "absolute";
                    this._debugCanvas.style.top = this.DEBUGCANVASPOS.y + "px";
                    this._debugCanvas.style.left = this.DEBUGCANVASPOS.x + "px";
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
                    this._debugCanvasContext.fillRect(0, 0, this.DEBUGCANVASSIZE.width, this.DEBUGCANVASSIZE.height);
                    // Draw the frequency domain chart.
                    for (var i = 0; i < this.getFrequencyBinCount(); i++) {
                        var value = workingArray[i];
                        var percent = value / this.BARGRAPHAMPLITUDE;
                        var height = this.DEBUGCANVASSIZE.height * percent;
                        var offset = this.DEBUGCANVASSIZE.height - height - 1;
                        var barWidth = this.DEBUGCANVASSIZE.width / this.getFrequencyBinCount();
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
        Analyser.prototype.dispose = function () {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.disconnect();
            }
        };
        return Analyser;
    })();
    BABYLON.Analyser = Analyser;
})(BABYLON || (BABYLON = {}));
