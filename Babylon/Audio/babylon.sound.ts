module BABYLON {
    export class Sound {
        private _audioBuffer;
        public maxDistance: number = 10;
        public autoplay: boolean = false;
        public loop: boolean = false;
        private _position: Vector3 = Vector3.Zero();
        private _direction: Vector3 = Vector3.Zero();
        private _volume: number;
        private _currentVolume: number;
        private _isLoaded: boolean = false;
        private _isReadyToPlay: boolean = false;
        private _isPlaying: boolean = false;
        private _isDirectional: boolean = false;
        private _audioEngine: BABYLON.AudioEngine;
        private _readyToPlayCallback;
        private _soundSource: AudioBufferSourceNode;
        private _soundPanner: PannerNode;
        // Used if you'd like to create a directional sound.
        // If not set, the sound will be omnidirectional
        private _coneInnerAngle: number = null;
        private _coneOuterAngle: number = null;
        private _coneOuterGain: number = null;
        private _scene: BABYLON.Scene;
        private _name: string;

        /**
        * Create a sound and attach it to a scene
        * @param name Name of your sound 
        * @param url Url to the sound to load async
        * @param readyToPlayCallback Provide a callback function if you'd like to load your code once the sound is ready to be played
        * @param options Objects to provide with the current available options: autoplay, loop, distanceMax
        */
        constructor(name: string, url: string, scene: BABYLON.Scene, readyToPlayCallback?: () => void, options?) {
            this._name = name;
            this._scene = scene;
            this._audioEngine = this._scene.getEngine().getAudioEngine();
            this._readyToPlayCallback = readyToPlayCallback;
            if (options) {
                if (options.distanceMax) { this.maxDistance = options.distanceMax; }
                if (options.autoplay) { this.autoplay = options.autoplay; }
                if (options.loop) { this.loop = options.loop; }
            }

            if (this._audioEngine.canUseWebAudio) {
                BABYLON.Tools.LoadFile(url, (data) => { this._soundLoaded(data); }, null, null, true);
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

            if (this._isPlaying) {
                this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
            }
        }

        public setDirection(newDirection: Vector3) {
            this._direction = newDirection;

            if (this._isPlaying) {
                console.log(this._direction.x + " " + this._direction.y + " " + this._direction.z);
                this._soundPanner.setOrientation(this._direction.x, this._direction.y, this._direction.z);
            }
        }

        public play() {
            if (this._isReadyToPlay) {
                try {
                    this._soundSource = this._audioEngine.audioContext.createBufferSource();
                    this._soundSource.buffer = this._audioBuffer;
                    this._soundPanner = this._audioEngine.audioContext.createPanner();
                    this._soundPanner.setPosition(this._position.x, this._position.y, this._position.z);
                    //this._soundPanner.maxDistance = this.maxDistance;
                    if (this._isDirectional) {
                        this._soundPanner.coneInnerAngle = this._coneInnerAngle;
                        this._soundPanner.coneOuterAngle = this._coneOuterAngle;
                        this._soundPanner.coneOuterGain = this._coneOuterGain;
                        this._soundPanner.setOrientation(this._direction.x, this._direction.y, this._direction.z);
                    }
                    this._soundPanner.connect(this._audioEngine.masterGain);
                    this._soundSource.connect(this._soundPanner);
                    this._soundSource.loop = this.loop;
                    this._soundSource.start(0);
                    this._isPlaying = true;
                }
                catch (ex) {
                    BABYLON.Tools.Error("Error while trying to play audio: " + this._name + ", " + ex.message);
                }
            }
        }

        public stop() {
            this._soundSource.stop(0);
            this._isPlaying = false;
        }

        public pause() {
        }

        public attachToMesh(meshToConnectTo: BABYLON.AbstractMesh) {
            meshToConnectTo.registerAfterWorldMatrixUpdate((connectedMesh: BABYLON.AbstractMesh) => this._onRegisterAfterWorldMatrixUpdate(connectedMesh));
        }

        private _onRegisterAfterWorldMatrixUpdate(connectedMesh: BABYLON.AbstractMesh) {
            this.setPosition(connectedMesh.position);
            if (this._isDirectional) {
                var mat = connectedMesh.getWorldMatrix();
                var direction = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, 1), mat);
                direction.normalize();
                this.setDirection(direction);
            }
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