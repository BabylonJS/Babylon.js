module BABYLON {
    export class Analyser {
        public SMOOTHING = 0.75;
        public FFT_SIZE = 512;
        public BARGRAPHAMPLITUDE = 256;
        public DEBUGCANVASPOS = { x: 20, y: 20 };
        public DEBUGCANVASSIZE = { width: 320, height: 200 }

        private _byteFreqs: Uint8Array;
        private _byteTime: Uint8Array;
        private _floatFreqs: Float32Array;
        private _webAudioAnalyser: AnalyserNode;
        private _debugCanvas: HTMLCanvasElement;
        private _debugCanvasContext: CanvasRenderingContext2D;
        private _scene: Scene;
        private _registerFunc;
        private _audioEngine: AudioEngine;

        constructor(scene: Scene) {
            this._scene = scene;
            this._audioEngine = Engine.audioEngine;
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser = this._audioEngine.audioContext.createAnalyser();
                this._webAudioAnalyser.minDecibels = -140;
                this._webAudioAnalyser.maxDecibels = 0;
                this._byteFreqs = new Uint8Array(this._webAudioAnalyser.frequencyBinCount);
                this._byteTime = new Uint8Array(this._webAudioAnalyser.frequencyBinCount);
                this._floatFreqs = new Float32Array(this._webAudioAnalyser.frequencyBinCount);
            }
        }

        public getFrequencyBinCount(): number {
            if (this._audioEngine.canUseWebAudio) {
                return this._webAudioAnalyser.frequencyBinCount;
            }
            else {
                return 0;
            }
        }

        public getByteFrequencyData(): Uint8Array {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
                this._webAudioAnalyser.fftSize = this.FFT_SIZE;
                this._webAudioAnalyser.getByteFrequencyData(this._byteFreqs);
            }
            return this._byteFreqs;
        }

        public getByteTimeDomainData(): Uint8Array {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
                this._webAudioAnalyser.fftSize = this.FFT_SIZE;
                this._webAudioAnalyser.getByteTimeDomainData(this._byteTime);
            }
            return this._byteTime;
        }

        public getFloatFrequencyData(): Uint8Array {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.smoothingTimeConstant = this.SMOOTHING;
                this._webAudioAnalyser.fftSize = this.FFT_SIZE;
                this._webAudioAnalyser.getFloatFrequencyData(this._floatFreqs);
            }
            return this._floatFreqs;
        }

        public drawDebugCanvas() {
            if (this._audioEngine.canUseWebAudio) {
                if (!this._debugCanvas) {
                    this._debugCanvas = document.createElement("canvas");
                    this._debugCanvas.width = this.DEBUGCANVASSIZE.width;
                    this._debugCanvas.height = this.DEBUGCANVASSIZE.height;
                    this._debugCanvas.style.position = "absolute";
                    this._debugCanvas.style.top = this.DEBUGCANVASPOS.y + "px" ;
                    this._debugCanvas.style.left = this.DEBUGCANVASPOS.x + "px" ;
                    this._debugCanvasContext = this._debugCanvas.getContext("2d");
                    document.body.appendChild(this._debugCanvas);
                    this._registerFunc = () => {
                        this.drawDebugCanvas();
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
        }

        public stopDebugCanvas() {
            if (this._debugCanvas) {
                this._scene.unregisterBeforeRender(this._registerFunc);
                this._registerFunc = null;
                document.body.removeChild(this._debugCanvas);
                this._debugCanvas = null;
                this._debugCanvasContext = null;
            }
        }

        public connectAudioNodes(inputAudioNode: AudioNode, outputAudioNode: AudioNode) {
            if (this._audioEngine.canUseWebAudio) {
                inputAudioNode.connect(this._webAudioAnalyser);
                this._webAudioAnalyser.connect(outputAudioNode);
            }
        }

        public dispose() {
            if (this._audioEngine.canUseWebAudio) {
                this._webAudioAnalyser.disconnect();
            }
        }
    }
}