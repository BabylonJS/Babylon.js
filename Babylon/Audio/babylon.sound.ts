module BABYLON {
    export class Sound {
        private _audioBuffer;
        public distanceMax: number = 10;
        public autoplay: boolean = false;
        public loop: boolean = false;
        private _position: Vector3 = Vector3.Zero();
        private _orientation: Vector3 = Vector3.Zero();
        private _volume: number;
        private _currentVolume: number;
        private _isLoaded: boolean = false;
        private _isReadyToPlay: boolean = false;
        private _audioEngine: BABYLON.AudioEngine;
        private _readyToPlayCallback;
        private _soundSource: AudioBufferSourceNode;
        private _soundPanner: PannerNode;

        constructor(url: string, engine: BABYLON.Engine, readyToPlayCallback, distanceMax?: number, autoplay?: boolean, loop?: boolean) {
            this._audioEngine = engine.getAudioEngine();;
            this._readyToPlayCallback = readyToPlayCallback;
            if (distanceMax) this.distanceMax = distanceMax;
            if (autoplay) this.autoplay = autoplay;
            if (loop) this.loop = loop;
            if (this._audioEngine.canUseWebAudio) {
                BABYLON.Tools.LoadFile(url, (data) => { this._soundLoaded(data); }, null, null, true);
            }
        }

        public setPosition(newPosition: Vector3) {
            this._position = newPosition;

            if (this._isReadyToPlay) {
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        }

        public setOrientiation(newOrientation: Vector3) {
            this._orientation = newOrientation;

            if (this._isReadyToPlay) {
                this._soundPanner.setOrientation(this._orientation.x, this._orientation.y, this._orientation.z);
            }
        }

        public play() {
            if (this._isReadyToPlay) {
                this._soundSource = this._audioEngine.audioContext.createBufferSource();
                this._soundSource.buffer = this._audioBuffer;
                this._soundPanner = this._audioEngine.audioContext.createPanner();
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
                this._soundPanner.connect(this._audioEngine.masterGain);
                this._soundSource.connect(this._soundPanner);
                this._soundSource.loop = this.loop;
                this._soundSource.start(0);
            }
        }

        public stop() {
        }

        public pause() {
        }

        public attachToMesh(meshToConnectTo: BABYLON.AbstractMesh) {
            meshToConnectTo.registerAfterWorldMatrixUpdate((connectedMesh: BABYLON.AbstractMesh) => this._onRegisterAfterWorldMatrixUpdate(connectedMesh));
        }

        private _onRegisterAfterWorldMatrixUpdate(connectedMesh: BABYLON.AbstractMesh) {
            this.setPosition(connectedMesh.position);
        }

        private _soundLoaded(audioData: ArrayBuffer) {
            this._isLoaded = true;
            this._audioEngine.audioContext.decodeAudioData(audioData, (buffer) => {
                this._audioBuffer = buffer;
                this._isReadyToPlay = true;
                if (this.autoplay) { this.play(); }
                if (this._readyToPlayCallback) { this._readyToPlayCallback(); }
            }, function (error) {
                    BABYLON.Tools.Error("Error while decoding audio data: " + error.err);
                });
        }
    }
}