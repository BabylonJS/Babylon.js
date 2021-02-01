import { Observable } from '../../Misc/observable';
import { IDisposable } from '../../scene';
import { Nullable } from '../../types';
import { Analyser } from '../analyser';

/**
 * This represents an audio engine and it is responsible
 * to play, synchronize and analyse sounds throughout the application.
 * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music
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
     * Defines if the audio engine relies on a custom unlocked button.
     * In this case, the embedded button will not be displayed.
     */
    useCustomUnlockedButton: boolean;

    /**
     * Gets whether or not the audio engine is unlocked (require first a user gesture on some browser).
     */
    readonly unlocked: boolean;

    /**
     * Event raised when audio has been unlocked on the browser.
     */
    onAudioUnlockedObservable: Observable<IAudioEngine>;

    /**
     * Event raised when audio has been locked on the browser.
     */
    onAudioLockedObservable: Observable<IAudioEngine>;

    /**
     * Flags the audio engine in Locked state.
     * This happens due to new browser policies preventing audio to autoplay.
     */
    lock(): void;

    /**
     * Unlocks the audio engine once a user action has been done on the dom.
     * This is helpful to resume play once browser policies have been satisfied.
     */
    unlock(): void;

    /**
     * Gets the global volume sets on the master gain.
     * @returns the global volume if set or -1 otherwise
     */
    getGlobalVolume(): number;

    /**
     * Sets the global volume of your experience (sets on the master gain).
     * @param newVolume Defines the new global volume of the application
     */
    setGlobalVolume(newVolume: number): void;

    /**
     * Connect the audio engine to an audio analyser allowing some amazing
     * synchronization between the sounds/music and your visualization (VuMeter for instance).
     * @see https://doc.babylonjs.com/how_to/playing_sounds_and_music#using-the-analyser
     * @param analyser The analyser to connect to the engine
     */
    connectToAnalyser(analyser: Analyser): void;
}