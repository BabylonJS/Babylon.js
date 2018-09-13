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

        /**
         * Gets whether or not the audio engine is unlocked (require first a user gesture on some browser).
         */
        readonly unlocked: boolean;

        /**
         * Event raised when audio has been unlocked on the browser.
         */
        onAudioUnlockedObservable: Observable<AudioEngine>;
    }

    // Sets the default audio engine to Babylon JS.
    Engine.AudioEngineFactory = () => { return new AudioEngine(); };

    /**
     * This represents the default audio engine used in babylon.
     * It is responsible to play, synchronize and analyse sounds throughout the  application.
     * @see http://doc.babylonjs.com/how_to/playing_sounds_and_music
     */
    export class AudioEngine implements IAudioEngine{
        private _audioContext: Nullable<AudioContext> = null;
        private _audioContextInitialized = false;
        private _muteButtonDisplayed = false;
        private _muteButton: HTMLButtonElement;
        private _engine: Engine;

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

        private _canvas: Nullable<HTMLCanvasElement>;

        /**
         * Gets whether audio has been unlocked on the device.
         * Some Browsers have strong restrictions about Audio and won t autoplay unless
         * a user interaction has happened.
         */
        public unlocked: boolean = false;

        /**
         * Event raised when audio has been unlocked on the browser.
         */
        public onAudioUnlockedObservable = new Observable<AudioEngine>();

        /**
         * Gets the current AudioContext if available.
         */
        public get audioContext(): Nullable<AudioContext> {
            if (!this._audioContextInitialized) {
                this._initializeAudioContext();
            }
            else {
                if (!this.unlocked && !this._muteButtonDisplayed) {
                    this._displayMuteButton();
                }
            }
            return this._audioContext;
        }

        private _connectedAnalyser: Nullable<Analyser>;
        
        /**
         * Instantiates a new audio engine.
         * 
         * There should be only one per page as some browsers restrict the number
         * of audio contexts you can create.
         * @param engine defines the hosting engine
         */
        constructor(engine = Engine.LastCreatedEngine) {
            if (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined') {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.canUseWebAudio = true;
            }

            var audioElem = document.createElement('audio');
            this._engine = engine!;

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
        }

        private _unlockiOSaudio() {
            this._displayMuteButton(true);

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
                        this._triggerRunningState()
                        this._muteButton.removeEventListener('touchend', unlockaudio, false);
                    }
                }, 0);
            };

            this._muteButton.addEventListener('touchend', unlockaudio, false);
        }

        private _resumeAudioContext() {
            this._audioContext!.resume();
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
                    if (this._audioContext.state === "running") {
                        this._triggerRunningState();
                    }
                    else {
                        if (!this._muteButtonDisplayed) {
                            this._displayMuteButton();
                        }
                        // 3 possible states: https://webaudio.github.io/web-audio-api/#BaseAudioContext
                        this._audioContext.addEventListener("statechange", () => {
                            if (this._audioContext!.state === "running") {
                                this._triggerRunningState();
                            }
                            else {
                                this._triggerSuspendedState();
                            }
                        });
                    }
                }
            }
            catch (e) {
                this.canUseWebAudio = false;
                Tools.Error("Web Audio: " + e.message);
            }
        }

        private _triggerRunningState() {
            this.unlocked = true;
            if (this._muteButtonDisplayed) {
               this._hideMuteButton(); 
            }
            // Notify users that the audio stack is unlocked/unmuted
            this.onAudioUnlockedObservable.notifyObservers(this);
        }

        private _triggerSuspendedState() {
            this.unlocked = false;
            this._displayMuteButton();
        }

        private _displayMuteButton(iOS: boolean = false) {
            this._muteButton = <HTMLButtonElement>document.createElement("BUTTON");
            this._muteButton.className = "babylonUnmuteIcon";
            this._muteButton.id = "babylonUnmuteIconBtn";
            this._muteButton.title = "Unmute";
            var css = ".babylonUnmuteIcon { position: absolute; height: 40px; width: 60px; background-color: rgba(51,51,51,0.7); background-image: url(data:image/svg+xml;charset=UTF-8,%3Csvg%20version%3D%221.1%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2239%22%20height%3D%2232%22%20viewBox%3D%220%200%2039%2032%22%3E%3Cpath%20fill%3D%22white%22%20d%3D%22M9.625%2018.938l-0.031%200.016h-4.953q-0.016%200-0.031-0.016v-12.453q0-0.016%200.031-0.016h4.953q0.031%200%200.031%200.016v12.453zM12.125%207.688l8.719-8.703v27.453l-8.719-8.719-0.016-0.047v-9.938zM23.359%207.875l1.406-1.406%204.219%204.203%204.203-4.203%201.422%201.406-4.219%204.219%204.219%204.203-1.484%201.359-4.141-4.156-4.219%204.219-1.406-1.422%204.219-4.203z%22%3E%3C%2Fpath%3E%3C%2Fsvg%3E); background-size: 90%; background-repeat:no-repeat; border: none; outline: none; } }";

            var style = document.createElement('style');
            style.appendChild(document.createTextNode(css));
            document.getElementsByTagName('head')[0].appendChild(style);

            this._moveButtonToTopLeft();
            document.body.appendChild(this._muteButton);

            if (!iOS) {
                this._muteButton.addEventListener('mousedown', () => {this._resumeAudioContext();}, false);
            }
            this._muteButtonDisplayed = true;

            this._canvas = this._engine.getRenderingCanvas();
            window.addEventListener("resize", this._onResize);
        }

        private _moveButtonToTopLeft() {
            if (this._canvas && this._muteButton) {
                this._muteButton.style.top = this._canvas.offsetTop + 20 + "px";
                this._muteButton.style.left = this._canvas.offsetLeft + 20 + "px";
            }
        }

        private _onResize = () => {
            this._moveButtonToTopLeft();
        }

        private _hideMuteButton() {
            if (this._muteButtonDisplayed) {
                document.body.removeChild(this._muteButton);
                this._muteButtonDisplayed = false;
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
            this._hideMuteButton();
            window.removeEventListener("resize", this._onResize);

            this.onAudioUnlockedObservable.clear();
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


