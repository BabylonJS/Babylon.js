var BABYLON;
(function (BABYLON) {
    var SoundTrack = (function () {
        function SoundTrack(scene, options) {
            this.id = -1;
            this._isMainTrack = false;
            this._scene = scene;
            this._audioEngine = scene.getEngine().getAudioEngine();
            this.soundCollection = new Array();
            if (this._audioEngine.canUseWebAudio) {
                this._trackGain = this._audioEngine.audioContext.createGain();

                //this._trackConvolver = this._audioEngine.audioContext.createConvolver();
                //this._trackConvolver.connect(this._trackGain);
                this._trackGain.connect(this._audioEngine.masterGain);

                if (options) {
                    if (options.volume) {
                        this._trackGain.gain.value = options.volume;
                    }
                    if (options.mainTrack) {
                        this._isMainTrack = options.mainTrack;
                    }
                }
            }
            if (!this._isMainTrack) {
                this._scene.soundTracks.push(this);
                this.id = this._scene.soundTracks.length - 1;
            }
        }
        SoundTrack.prototype.AddSound = function (sound) {
            sound.connectToSoundTrackAudioNode(this._trackGain);
            if (sound.soundTrackId) {
                if (sound.soundTrackId === -1) {
                    this._scene.mainSoundTrack.RemoveSound(sound);
                } else {
                    this._scene.soundTracks[sound.soundTrackId].RemoveSound(sound);
                }
            }
            this.soundCollection.push(sound);
            sound.soundTrackId = this.id;
        };

        SoundTrack.prototype.RemoveSound = function (sound) {
            var index = this.soundCollection.indexOf(sound);
            if (index !== -1) {
                this.soundCollection.splice(index, 1);
            }
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
