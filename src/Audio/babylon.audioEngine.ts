module BABYLON {
    export class AudioEngine {
        private _audioContext: Nullable<AudioContext> = null;
        private _audioContextInitialized = false;
        public canUseWebAudio: boolean = false;
        public masterGain: GainNode;

        private _connectedAnalyser: Nullable<Analyser>;
        public WarnedWebAudioUnsupported: boolean = false;
        public unlocked: boolean = false;
        public onAudioUnlocked: () => any;

        public isMP3supported: boolean = false;
        public isOGGsupported: boolean = false;

        public get audioContext(): Nullable<AudioContext> {
            if (!this._audioContextInitialized) {
                this._initializeAudioContext();
            }
            return this._audioContext;
        }

        constructor() {
            if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.canUseWebAudio = true;
            }

            var audioElem = document.createElement('audio');

            try {
                if (audioElem && !!audioElem.canPlayType && audioElem.canPlayType('audio/mpeg; codecs="mp3"').replace(/^no$/, '')) {
                    this.isMP3supported = true;
                }
            }
            catch (e) {
                // protect error during capability check.
            }

            try {
                if (audioElem && !!audioElem.canPlayType && audioElem.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/, '')) {
                    this.isOGGsupported = true;
                }
            }
            catch (e) {
                // protect error during capability check.
            }

            if (/iPad|iPhone|iPod/.test(navigator.platform)) {
                this._unlockiOSaudio();
            }
            else {
                this.unlocked = true;
            }
        }

        private _unlockiOSaudio() {
            var unlockaudio = () => {
                if (!this.audioContext) {
                    return;
                }
                var buffer = this.audioContext.createBuffer(1, 1, 22050);
                var source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
  
                setTimeout(() => {
                    if (((<any>source).playbackState === (<any>source).PLAYING_STATE || (<any>source).playbackState === (<any>source).FINISHED_STATE)) { 
                        this.unlocked = true;
                        window.removeEventListener('touchend', unlockaudio, false);
                        if (this.onAudioUnlocked) {
                            this.onAudioUnlocked();
                        }
                    }
                }, 0);
            };

            window.addEventListener('touchend', unlockaudio, false);
        }

        private _initializeAudioContext() {
            try {
                if (this.canUseWebAudio) {
                    this._audioContext = new AudioContext();
                    // create a global volume gain node 
                    this.masterGain = this._audioContext.createGain();
                    this.masterGain.gain.value = 1;
                    this.masterGain.connect(this._audioContext.destination);
                    this._audioContextInitialized = true;
                }
            }
            catch (e) {
                this.canUseWebAudio = false;
                Tools.Error("Web Audio: " + e.message);
            }
        }

        public dispose() {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                if (this._connectedAnalyser && this._audioContext) {
                    this._connectedAnalyser.stopDebugCanvas();
                    this._connectedAnalyser.dispose();
                    this.masterGain.disconnect();
                    this.masterGain.connect(this._audioContext.destination);
                    this._connectedAnalyser = null;
                }
                this.masterGain.gain.value = 1;
            }
            this.WarnedWebAudioUnsupported = false;
        }

        public getGlobalVolume(): number {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                return this.masterGain.gain.value;
            }
            else {
                return -1;
            }
        }

        public setGlobalVolume(newVolume: number) {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                this.masterGain.gain.value = newVolume;
            }
        }

        public connectToAnalyser(analyser: Analyser) {
            if (this._connectedAnalyser) {
                this._connectedAnalyser.stopDebugCanvas();
            }
            if (this.canUseWebAudio && this._audioContextInitialized && this._audioContext) {
                this._connectedAnalyser = analyser;
                this.masterGain.disconnect();
                this._connectedAnalyser.connectAudioNodes(this.masterGain, this._audioContext.destination);
            }
        }
    }
}


