module BABYLON {
    export class AudioEngine {
        public audioContext: AudioContext = null;
        public canUseWebAudio: boolean = false;
        public masterGain: GainNode;

        private _connectedAnalyser: Analyser;
        public WarnedWebAudioUnsupported: boolean = false;

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
                Tools.Error("Web Audio: " + e.message);
            }

            // create a global volume gain node 
            if (this.canUseWebAudio) {
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 1;
                this.masterGain.connect(this.audioContext.destination);
            }
        }

        public dispose() {
            if (this.canUseWebAudio) {
                if (this._connectedAnalyser) {
                    this._connectedAnalyser.stopDebugCanvas();
                    this._connectedAnalyser.dispose();
                    this.masterGain.disconnect();
                    this.masterGain.connect(this.audioContext.destination);
                    this._connectedAnalyser = null;
                }
                this.masterGain.gain.value = 1;
            }
            this.WarnedWebAudioUnsupported = false;
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

        public connectToAnalyser(analyser: Analyser) {
            if (this._connectedAnalyser) {
                this._connectedAnalyser.stopDebugCanvas();
            }
            this._connectedAnalyser = analyser;
            if (this.canUseWebAudio) {
                this.masterGain.disconnect();
                this._connectedAnalyser.connectAudioNodes(this.masterGain, this.audioContext.destination);
            }
        }
    }
}


