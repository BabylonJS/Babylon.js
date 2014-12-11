var BABYLON;
(function (BABYLON) {
    var SoundTrack = (function () {
        function SoundTrack(scene, options) {
            this._scene = scene;
            this._audioEngine = scene.getEngine().getAudioEngine();
            this._trackGain = this._audioEngine.audioContext.createGain();
            this._trackConvolver = this._audioEngine.audioContext.createConvolver();
            this._trackConvolver.connect(this._trackGain);
            this._trackGain.connect(this._audioEngine.masterGain);
            this._soundCollection = new Array();
            this._scene._soundTracks.push(this);
        }
        SoundTrack.prototype.AddSound = function (newSound) {
            newSound.connectToSoundTrackAudioNode(this._trackConvolver);
            this._soundCollection.push(newSound);
        };

        SoundTrack.prototype.RemoveSound = function (sound) {
        };

        SoundTrack.prototype.setVolume = function (newVolume) {
            if (this._audioEngine.canUseWebAudio) {
                this._trackGain.gain.value = newVolume;
            }
        };
        return SoundTrack;
    })();
    BABYLON.SoundTrack = SoundTrack;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.soundtrack.js.map
