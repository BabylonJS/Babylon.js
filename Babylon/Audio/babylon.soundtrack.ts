module BABYLON {
    export class SoundTrack {
        private _audioEngine: BABYLON.AudioEngine;
        private _trackGain: GainNode;
        private _trackConvolver: ConvolverNode;
        private _scene: BABYLON.Scene;
        public id: number = -1;
        public soundCollection: Array<BABYLON.Sound>;
        private _isMainTrack: boolean = false;

        constructor(scene: BABYLON.Scene, options?: any) {
            this._scene = scene;
            this._audioEngine = scene.getEngine().getAudioEngine();
            this.soundCollection = new Array();
            if (this._audioEngine.canUseWebAudio) {
                this._trackGain = this._audioEngine.audioContext.createGain();
                //this._trackConvolver = this._audioEngine.audioContext.createConvolver();
                //this._trackConvolver.connect(this._trackGain);
                this._trackGain.connect(this._audioEngine.masterGain);

                if (options) {
                    if (options.volume) { this._trackGain.gain.value = options.volume; }
                    if (options.mainTrack) { this._isMainTrack = options.mainTrack; }
                }
            }
            if (!this._isMainTrack) {
                this._scene.soundTracks.push(this);
                this.id = this._scene.soundTracks.length - 1;
            }
        }

        public AddSound(sound: BABYLON.Sound) {
            sound.connectToSoundTrackAudioNode(this._trackGain);
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

        public RemoveSound(sound: BABYLON.Sound) {
            var index = this.soundCollection.indexOf(sound);
            if (index !== -1) {
                this.soundCollection.splice(index, 1);
            }
        }

        public setVolume(newVolume: number) {
            if (this._audioEngine.canUseWebAudio) {
                this._trackGain.gain.value = newVolume;
            }
        }
    }
}