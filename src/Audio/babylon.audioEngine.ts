module BABYLON {
    /**
     * This represents an audio engine and it is responsible
     * to play, synchronize and analyse sounds throughout the application.
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     */
    export interface IAudioEngine extends IDisposable {
        /**
         * Gets whether the current host supports Web Audio and thus could create AudioContexts.
         */
        readonly canUseWebAudio: boolean;

        /**
         * Gets the current AudioContext if available.
         */
        readonly audioContext: Nullable<AudioContext>;

        /**
         * The master gain node defines the global audio volume of your audio engine.
         */
        readonly masterGain: GainNode;

        /**
         * Gets whether or not mp3 are supported by your browser.
         */
        readonly isMP3supported: boolean;

        /**
         * Gets whether or not ogg are supported by your browser.
         */
        readonly isOGGsupported: boolean;

        /**
         * Defines if Babylon should emit a warning if WebAudio is not supported.
         * @ignoreNaming
         */
        WarnedWebAudioUnsupported: boolean;
    }

    // Sets the default audio engine to Babylon JS.
    Engine.AudioEngineFactory = () => { return new AudioEngine(); };

    /**
     * This represents the default audio engine used in babylon.
     * It is responsible to play, synchronize and analyse sounds throughout the  application.
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     */
    export class AudioEngine implements IAudioEngine{
        /**
         * Gets whether the current host supports Web Audio and thus could create AudioContexts.
         */
        public canUseWebAudio: boolean = false;

        /**
         * The master gain node defines the global audio volume of your audio engine.
         */
        public masterGain: GainNode;

        /**
         * Defines if Babylon should emit a warning if WebAudio is not supported.
         * @ignoreNaming
         */
        public WarnedWebAudioUnsupported: boolean = false;

        /**
         * Gets whether or not mp3 are supported by your browser.
         */
        public isMP3supported: boolean = false;

        /**
         * Gets whether or not ogg are supported by your browser.
         */
        public isOGGsupported: boolean = false;

        /**
         * Gets whether audio has been unlocked on the device.
         * Some Browsers have strong restrictions about Audio and won t autoplay unless
         * a user interaction has happened.
         */
        public unlocked: boolean = false;

        /**
         * Event raised when audio has been unlocked on the browser.
         */
        public onAudioUnlocked: () => any;

        /**
         * Gets the current AudioContext if available.
         */
        public get audioContext(): Nullable<AudioContext> {
            if (!this._audioContextInitialized) {
                this._initializeAudioContext();
            }
            return this._audioContext;
        }

        private _audioContext: Nullable<AudioContext> = null;
        private _audioContextInitialized = false;
        private _connectedAnalyser: Nullable<Analyser>;
        
        /**
         * Instantiates a new audio engine.
         * 
         * There should be only one per page as some browsers restrict the number
         * of audio contexts you can create.
         */
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

        /**
         * Destroy and release the resources associated with the audio ccontext.
         */
        public dispose(): void {
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

        /**
         * Gets the global volume sets on the master gain.
         * @returns the global volume if set or -1 otherwise
         */
        public getGlobalVolume(): number {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                return this.masterGain.gain.value;
            }
            else {
                return -1;
            }
        }

        /**
         * Sets the global volume of your experience (sets on the master gain).
         * @param newVolume Defines the new global volume of the application
         */
        public setGlobalVolume(newVolume: number): void {
            if (this.canUseWebAudio && this._audioContextInitialized) {
                this.masterGain.gain.value = newVolume;
            }
        }

        /**
         * Connect the audio engine to an audio analyser allowing some amazing 
         * synchornization between the sounds/music and your visualization (VuMeter for instance).
         * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music#using-the-analyser
         * @param analyser The analyser to connect to the engine
         */
        public connectToAnalyser(analyser: Analyser): void {
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


