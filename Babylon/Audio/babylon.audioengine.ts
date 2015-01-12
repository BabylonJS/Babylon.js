module BABYLON {
    export class AudioEngine {
        public audioContext: AudioContext = null;
        public canUseWebAudio: boolean = false;
        public masterGain: GainNode;

        constructor() {
            // creating the audio context 
            try {
                if (typeof AudioContext !== 'undefined') {
                    this.audioContext = new AudioContext();
                    this.canUseWebAudio = true;
                } else if (typeof webkitAudioContext !== 'undefined') {
                    this.audioContext = new webkitAudioContext();
                    this.canUseWebAudio = true;
                } 
            } catch (e) {
                this.canUseWebAudio = false;
            }

            // create a global volume gain node 
            if (this.canUseWebAudio) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 1;
                this.masterGain.connect(this.audioContext.destination);
            }
        }

        public getGlobalVolume(): number {
            if (this.canUseWebAudio) {
                return this.masterGain.gain.value;
            }
            else {
                return -1;
            }
        }

        public setGlobalVolume(newVolume: number) {
            if (this.canUseWebAudio) {
                this.masterGain.gain.value = newVolume;
            }
        }
    }
}


