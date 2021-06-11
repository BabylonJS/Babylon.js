import { Analyser } from "./analyser";

import { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { Logger } from "../Misc/logger";
import { IAudioEngine } from './Interfaces/IAudioEngine';

/**
 * This represents the default audio engine used in babylon.
 * It is responsible to play, synchronize and analyse sounds throughout the  application.
 * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
 */
export class NativeAudioEngine implements IAudioEngine {
    private _audioContext: Nullable<AudioContext> = null;
    private _audioContextInitialized = false;

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
    public unlocked: boolean = true;

    /**
     * Defines if the audio engine relies on a custom unlocked button.
     * In this case, the embedded button will not be displayed.
     */
    public useCustomUnlockedButton: boolean = false;

    /**
     * Event raised when audio has been unlocked on the browser.
     */
    public onAudioUnlockedObservable = new Observable<IAudioEngine>();

    /**
     * Event raised when audio has been locked on the browser.
     */
    public onAudioLockedObservable = new Observable<IAudioEngine>();

    /**
     * Gets the current AudioContext if available.
     */
    public get audioContext(): Nullable<AudioContext> {
        if (!this._audioContextInitialized) {
            debugger;
            this._initializeAudioContext();
        }
        debugger;
        return this._audioContext;
    }

    private _connectedAnalyser: Nullable<Analyser>;

    /**
     * Instantiates a new audio engine.
     *
     * There should be only one per page as some browsers restrict the number
     * of audio contexts you can create.
     * @param hostElement defines the host element where to display the mute icon if necessary
     */
    constructor(hostElement: Nullable<HTMLElement> = null) {
        this.isMP3supported = true; // TODO: is there a way to ask the context/underlying engine for this capability instead of the DOM?
        this.isOGGsupported = true; // TODO: is there a way to ask the context/underlying engine for this capability instead of the DOM?
        this.canUseWebAudio = true; // TODO: is there a way to ask the context/underlying engine for this capability instead of the DOM?
    }

    /**
     * Flags the audio engine in Locked state.
     * This happens due to new browser policies preventing audio to autoplay.
     */
    public lock() {
        this._triggerSuspendedState();
    }

    /**
     * Unlocks the audio engine once a user action has been done on the dom.
     * This is helpful to resume play once browser policies have been satisfied.
     */
    public unlock() {
        this._triggerRunningState();
    }

    private _resumeAudioContext(): Promise<void> {
        let result: Promise<void>;
        if (this._audioContext!.resume !== undefined) {
            result = this._audioContext!.resume();
        }
        return result! || Promise.resolve();
    }

    private _initializeAudioContext() {
        try {
            if (this.canUseWebAudio) {
                debugger;
                this._audioContext = new AudioContext();
                // create a global volume gain node
                this.masterGain = this._audioContext.createGain();
                this.masterGain.gain.value = 1;
                this.masterGain.connect(this._audioContext.destination);
                this._audioContextInitialized = true;
                if (this._audioContext.state === "running") {
                    // Do not wait for the promise to unlock.
                    this._triggerRunningState();
                }
            }
        }
        catch (e) {
            this.canUseWebAudio = false;
            Logger.Error("Native Audio: " + e.message);
        }
    }

    private _tryToRun = false;
    private _triggerRunningState() {
        if (this._tryToRun) {
            return;
        }
        this._tryToRun = true;

        this._resumeAudioContext()
            .then(() => {
                this._tryToRun = false;
                // Notify users that the audio stack is unlocked/unmuted
                this.unlocked = true;
                this.onAudioUnlockedObservable.notifyObservers(this);
            }).catch(() => {
                this._tryToRun = false;
                this.unlocked = false;
            });
    }

    private _triggerSuspendedState() {
        this.unlocked = false;
        this.onAudioLockedObservable.notifyObservers(this);
    }

    /**
     * Destroy and release the resources associated with the audio context.
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

        this.onAudioUnlockedObservable.clear();
        this.onAudioLockedObservable.clear();
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
     * synchronization between the sounds/music and your visualization (VuMeter for instance).
     * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music#using-the-analyser
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
