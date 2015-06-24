module BABYLON {
    export class SoundTrack {
        private _audioEngine: AudioEngine;
        private _outputAudioNode: GainNode;
        private _inputAudioNode: AudioNode;
        private _trackConvolver: ConvolverNode;
        private _scene: Scene;
        public id: number = -1;
        public soundCollection: Array<Sound>;
        private _isMainTrack: boolean = false;
        private _connectedAnalyser: Analyser;

        constructor(scene: Scene, options?: any) {
            this._scene = scene;
            this._audioEngine = Engine.audioEngine;
            this.soundCollection = new Array();
            if (this._audioEngine.canUseWebAudio) {
                this._outputAudioNode = this._audioEngine.audioContext.createGain();
                this._outputAudioNode.connect(this._audioEngine.masterGain);

                if (options) {
                    if (options.volume) { this._outputAudioNode.gain.value = options.volume; }
                    if (options.mainTrack) { this._isMainTrack = options.mainTrack; }
                }
            }
            if (!this._isMainTrack) {
                this._scene.soundTracks.push(this);
                this.id = this._scene.soundTracks.length - 1;
            }
        }

        public dispose() {
            if (this._audioEngine.canUseWebAudio) {
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
            if (Engine.audioEngine.canUseWebAudio) {
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
            if (this._audioEngine.canUseWebAudio) {
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
            if (this._audioEngine.canUseWebAudio) {
                this._outputAudioNode.disconnect();
                this._connectedAnalyser.connectAudioNodes(this._outputAudioNode, this._audioEngine.masterGain);
            }
        }
    }
}