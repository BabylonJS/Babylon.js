import type { Analyser } from "./analyser";

import type { Nullable } from "../types";
import { Observable } from "../Misc/observable";
import { AbstractEngine } from "../Engines/abstractEngine";
import type { IAudioEngine } from "./Interfaces/IAudioEngine";
import { _WebAudioEngine } from "../AudioV2/webAudio/webAudioEngine";
import type { _WebAudioMainBus } from "../AudioV2/webAudio/webAudioMainBus";

// Sets the default audio engine to Babylon.js
AbstractEngine.AudioEngineFactory = (
    hostElement: Nullable<HTMLElement>,
    audioContext: Nullable<AudioContext>,
    audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode>
) => {
    return new AudioEngine(hostElement, audioContext, audioDestination);
};

/**
 * This represents the default audio engine used in babylon.
 * It is responsible to play, synchronize and analyse sounds throughout the  application.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic
 */
export class AudioEngine implements IAudioEngine {
    private _audioContext: Nullable<AudioContext> = null;
    private _masterGain: GainNode;
    private _tryToRun = false;
    private _useCustomUnlockedButton: boolean = false;

    /**
     * Gets whether the current host supports Web Audio and thus could create AudioContexts.
     */
    public canUseWebAudio: boolean = true;

    /**
     * The master gain node defines the global audio volume of your audio engine.
     */
    public get masterGain(): GainNode {
        return this._masterGain;
    }

    public set masterGain(value: GainNode) {
        this._masterGain = this._v2.mainOut._inNode = value;
    }

    /**
     * Defines if Babylon should emit a warning if WebAudio is not supported.
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
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
     * Some Browsers have strong restrictions about Audio and won't autoplay unless
     * a user interaction has happened.
     */
    public unlocked: boolean = false;

    /**
     * Defines if the audio engine relies on a custom unlocked button.
     * In this case, the embedded button will not be displayed.
     */
    public get useCustomUnlockedButton(): boolean {
        return this._useCustomUnlockedButton;
    }

    public set useCustomUnlockedButton(value: boolean) {
        this._useCustomUnlockedButton = value;
        this._v2._unmuteUIEnabled = !value;
    }

    /**
     * Event raised when audio has been unlocked on the browser.
     */
    public onAudioUnlockedObservable = new Observable<IAudioEngine>();

    /**
     * Event raised when audio has been locked on the browser.
     */
    public onAudioLockedObservable = new Observable<IAudioEngine>();

    /** @internal */
    public _v2: _WebAudioEngine;

    /**
     * Gets the current AudioContext if available.
     */
    public get audioContext(): Nullable<AudioContext> {
        if (this._v2.state === "running") {
            // Do not wait for the promise to unlock.
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            this._triggerRunningStateAsync();
        }
        return this._v2._audioContext;
    }

    private _connectedAnalyser: Nullable<Analyser>;

    /**
     * Instantiates a new audio engine.
     *
     * @param hostElement defines the host element where to display the mute icon if necessary
     * @param audioContext defines the audio context to be used by the audio engine
     * @param audioDestination defines the audio destination node to be used by audio engine
     */
    constructor(
        hostElement: Nullable<HTMLElement> = null,
        audioContext: Nullable<AudioContext> = null,
        audioDestination: Nullable<AudioDestinationNode | MediaStreamAudioDestinationNode> = null
    ) {
        const v2 = new _WebAudioEngine({
            audioContext: audioContext ? audioContext : undefined,
            defaultUIParentElement: hostElement?.parentElement ? hostElement.parentElement : undefined,
        });

        // Historically the unmute button is disabled until a sound tries to play and can't, which results in a call
        // to `AudioEngine.lock()`, which is where the unmute button is enabled if no custom UI is requested.
        v2._unmuteUIEnabled = false;

        this._masterGain = new GainNode(v2._audioContext);
        v2._audioDestination = audioDestination;

        v2.stateChangedObservable.add((state) => {
            if (state === "running") {
                this.unlocked = true;
                this.onAudioUnlockedObservable.notifyObservers(this);
            } else {
                this.unlocked = false;
                this.onAudioLockedObservable.notifyObservers(this);
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-floating-promises, github/no-then
        v2._initAsync({ resumeOnInteraction: false }).then(() => {
            const mainBusOutNode = (v2.defaultMainBus as _WebAudioMainBus)._outNode;
            if (mainBusOutNode) {
                mainBusOutNode.disconnect(v2.mainOut._inNode);
                mainBusOutNode.connect(this._masterGain);
            }

            v2.mainOut._inNode = this._masterGain;
            v2.stateChangedObservable.notifyObservers(v2.state);
        });

        this.isMP3supported = v2.isFormatValid("mp3");
        this.isOGGsupported = v2.isFormatValid("ogg");

        this._v2 = v2;
    }

    /**
     * Flags the audio engine in Locked state.
     * This happens due to new browser policies preventing audio to autoplay.
     */
    public lock() {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._v2._audioContext.suspend();

        if (!this._useCustomUnlockedButton) {
            this._v2._unmuteUIEnabled = true;
        }
    }

    /**
     * Unlocks the audio engine once a user action has been done on the dom.
     * This is helpful to resume play once browser policies have been satisfied.
     */
    public unlock() {
        if (this._audioContext?.state === "running") {
            if (!this.unlocked) {
                // Notify users that the audio stack is unlocked/unmuted
                this.unlocked = true;
                this.onAudioUnlockedObservable.notifyObservers(this);
            }

            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._triggerRunningStateAsync();
    }

    /** @internal */
    public _resumeAudioContextOnStateChange(): void {
        this._audioContext?.addEventListener(
            "statechange",
            () => {
                if (this.unlocked && this._audioContext?.state !== "running") {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    this._resumeAudioContextAsync();
                }
            },
            {
                once: true,
                passive: true,
                signal: AbortSignal.timeout(3000),
            }
        );
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async, no-restricted-syntax
    private _resumeAudioContextAsync(): Promise<void> {
        if (this._v2._isUsingOfflineAudioContext) {
            return Promise.resolve();
        }

        return this._v2._audioContext.resume();
    }

    /**
     * Destroy and release the resources associated with the audio context.
     */
    public dispose(): void {
        this._v2.dispose();

        this.onAudioUnlockedObservable.clear();
        this.onAudioLockedObservable.clear();
    }

    /**
     * Gets the global volume sets on the master gain.
     * @returns the global volume if set or -1 otherwise
     */
    public getGlobalVolume(): number {
        return this.masterGain.gain.value;
    }

    /**
     * Sets the global volume of your experience (sets on the master gain).
     * @param newVolume Defines the new global volume of the application
     */
    public setGlobalVolume(newVolume: number): void {
        this.masterGain.gain.value = newVolume;
    }

    /**
     * Connect the audio engine to an audio analyser allowing some amazing
     * synchronization between the sounds/music and your visualization (VuMeter for instance).
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#using-the-analyser
     * @param analyser The analyser to connect to the engine
     */
    public connectToAnalyser(analyser: Analyser): void {
        if (this._connectedAnalyser) {
            this._connectedAnalyser.stopDebugCanvas();
        }

        this._connectedAnalyser = analyser;
        this.masterGain.disconnect();
        this._connectedAnalyser.connectAudioNodes(this.masterGain, this._v2._audioContext.destination);
    }

    private async _triggerRunningStateAsync() {
        if (this._tryToRun) {
            return;
        }
        this._tryToRun = true;

        await this._resumeAudioContextAsync();

        this._tryToRun = false;
        this.unlocked = true;

        this.onAudioUnlockedObservable.notifyObservers(this);
    }
}
