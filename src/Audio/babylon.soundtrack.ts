module BABYLON {
    export class SoundTrack {
        private _outputAudioNode: Nullable<GainNode>;
        private _scene: Scene;
        public id: number = -1;
        public soundCollection: Array<Sound>;
        private _isMainTrack: boolean = false;
        private _connectedAnalyser: Analyser;
        private _options: any;
        private _isInitialized = false;

        constructor(scene: Scene, options?: any) {
            this._scene = scene;
            this.soundCollection = new Array();
            this._options = options;

            if (!this._isMainTrack) {
                this._scene.soundTracks.push(this);
                this.id = this._scene.soundTracks.length - 1;
            }
        }

        private _initializeSoundTrackAudioGraph() {
            if (Engine.audioEngine.canUseWebAudio && Engine.audioEngine.audioContext) {
                this._outputAudioNode = Engine.audioEngine.audioContext.createGain();
                this._outputAudioNode.connect(Engine.audioEngine.masterGain);

                if (this._options) {
                    if (this._options.volume) { this._outputAudioNode.gain.value = this._options.volume; }
                    if (this._options.mainTrack) { this._isMainTrack = this._options.mainTrack; }
                }

                this._isInitialized = true;
            }
        }

        public dispose() {
            if (Engine.audioEngine.canUseWebAudio) {
                if (this._connectedAnalyser) {
                    this._connectedAnalyser.stopDebugCanvas();
                }
                while (this.soundCollection.length) {
                    this.soundCollection[0].dispose();
                }
                if (this._outputAudioNode) {
                    this._outputAudioNode.disconnect();
                }
                this._outputAudioNode = null;
            }
        }

        public AddSound(sound: Sound) {
            if (!this._isInitialized) {
                this._initializeSoundTrackAudioGraph();
            }
            if (Engine.audioEngine.canUseWebAudio && this._outputAudioNode) {
                sound.connectToSoundTrackAudioNode(this._outputAudioNode);
            }
            if (sound.soundTrackId) {
                if (sound.soundTrackId === -1) {
                    this._scene.mainSoundTrack.RemoveSound(sound);
                }
                else {
                    this._scene.soundTracks[sound.soundTrackId].RemoveSound(sound);
                }
            }

            this.soundCollection.push(sound);
            sound.soundTrackId = this.id;
        }

        public RemoveSound(sound: Sound) {
            var index = this.soundCollection.indexOf(sound);
            if (index !== -1) {
                this.soundCollection.splice(index, 1);
            }
        }

        public setVolume(newVolume: number) {
            if (Engine.audioEngine.canUseWebAudio && this._outputAudioNode) {
                this._outputAudioNode.gain.value = newVolume;
            }
        }

        public switchPanningModelToHRTF() {
            if (Engine.audioEngine.canUseWebAudio) {
                for (var i = 0; i < this.soundCollection.length; i++) {
                    this.soundCollection[i].switchPanningModelToHRTF();
                }
            }
        }

        public switchPanningModelToEqualPower() {
            if (Engine.audioEngine.canUseWebAudio) {
                for (var i = 0; i < this.soundCollection.length; i++) {
                    this.soundCollection[i].switchPanningModelToEqualPower();
                }
            }
        }

        public connectToAnalyser(analyser: Analyser) {
            if (this._connectedAnalyser) {
                this._connectedAnalyser.stopDebugCanvas();
            }
            this._connectedAnalyser = analyser;
            if (Engine.audioEngine.canUseWebAudio && this._outputAudioNode) {
                this._outputAudioNode.disconnect();
                this._connectedAnalyser.connectAudioNodes(this._outputAudioNode, Engine.audioEngine.masterGain);
            }
        }
    }
}