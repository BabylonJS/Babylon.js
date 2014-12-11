module BABYLON {
    export class SoundTrack {
        private _audioEngine: BABYLON.AudioEngine;
        private _trackGain: GainNode;
        private _trackConvolver: ConvolverNode;
        private _scene: BABYLON.Scene;
        private _id: number;
        private _soundCollection: Array<BABYLON.Sound>;

        constructor(scene: BABYLON.Scene, options?) {
            this._scene = scene;
            this._audioEngine = scene.getEngine().getAudioEngine();
            this._trackGain = this._audioEngine.audioContext.createGain();
            this._trackConvolver = this._audioEngine.audioContext.createConvolver();
            this._trackConvolver.connect(this._trackGain);
            this._trackGain.connect(this._audioEngine.masterGain);
            this._soundCollection = new Array();
            this._scene._soundTracks.push(this);
        }

        public AddSound(newSound: BABYLON.Sound) {
            newSound.connectToSoundTrackAudioNode(this._trackConvolver);
            this._soundCollection.push(newSound);
        }

        public RemoveSound(sound: BABYLON.Sound) {
            
        }

        public setVolume(newVolume: number) {
            if (this._audioEngine.canUseWebAudio) {
                this._trackGain.gain.value = newVolume;
            }
        }
     
    }
}