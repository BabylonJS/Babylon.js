import type { Sound } from "./sound";
import type { Analyser } from "./analyser";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { EngineStore } from "../Engines/engineStore";
import { AbstractEngine } from "core/Engines/abstractEngine";

/**
 * Options allowed during the creation of a sound track.
 */
export interface ISoundTrackOptions {
    /**
     * The volume the sound track should take during creation
     */
    volume?: number;
    /**
     * Define if the sound track is the main sound track of the scene
     */
    mainTrack?: boolean;
}

/**
 * It could be useful to isolate your music & sounds on several tracks to better manage volume on a grouped instance of sounds.
 * It will be also used in a future release to apply effects on a specific track.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#using-sound-tracks
 */
export class SoundTrack {
    /**
     * The unique identifier of the sound track in the scene.
     */
    public id: number = -1;
    /**
     * The list of sounds included in the sound track.
     */
    public soundCollection: Array<Sound>;

    private _outputAudioNode: Nullable<GainNode>;
    private _scene: Scene;
    private _connectedAnalyser: Analyser;
    private _options: ISoundTrackOptions;
    private _isInitialized = false;

    /**
     * Creates a new sound track.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#using-sound-tracks
     * @param scene Define the scene the sound track belongs to
     * @param options
     */
    constructor(scene?: Nullable<Scene>, options: ISoundTrackOptions = {}) {
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this._scene = scene;
        this.soundCollection = [];
        this._options = options;

        if (!this._options.mainTrack && this._scene.soundTracks) {
            this._scene.soundTracks.push(this);
            this.id = this._scene.soundTracks.length - 1;
        }
    }

    private _initializeSoundTrackAudioGraph() {
        if (AbstractEngine.audioEngine?.canUseWebAudio && AbstractEngine.audioEngine.audioContext) {
            this._outputAudioNode = AbstractEngine.audioEngine.audioContext.createGain();
            this._outputAudioNode.connect(AbstractEngine.audioEngine.masterGain);

            if (this._options) {
                if (this._options.volume) {
                    this._outputAudioNode.gain.value = this._options.volume;
                }
            }

            this._isInitialized = true;
        }
    }

    /**
     * Release the sound track and its associated resources
     */
    public dispose(): void {
        if (AbstractEngine.audioEngine && AbstractEngine.audioEngine.canUseWebAudio) {
            if (this._connectedAnalyser) {
                this._connectedAnalyser.stopDebugCanvas();
            }
            while (this.soundCollection.length) {
                this.soundCollection[0].dispose();
            }
            if (this._outputAudioNode) {
                this._outputAudioNode.disconnect();
            }
            this._outputAudioNode = null;
        }
    }

    /**
     * Adds a sound to this sound track
     * @param sound define the sound to add
     * @ignoreNaming
     */
    public addSound(sound: Sound): void {
        if (!this._isInitialized) {
            this._initializeSoundTrackAudioGraph();
        }
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._outputAudioNode) {
            sound.connectToSoundTrackAudioNode(this._outputAudioNode);
        }
        if (sound.soundTrackId !== undefined) {
            if (sound.soundTrackId === -1) {
                this._scene.mainSoundTrack.removeSound(sound);
            } else if (this._scene.soundTracks) {
                this._scene.soundTracks[sound.soundTrackId].removeSound(sound);
            }
        }

        this.soundCollection.push(sound);
        sound.soundTrackId = this.id;
    }

    /**
     * Removes a sound to this sound track
     * @param sound define the sound to remove
     * @ignoreNaming
     */
    public removeSound(sound: Sound): void {
        const index = this.soundCollection.indexOf(sound);
        if (index !== -1) {
            this.soundCollection.splice(index, 1);
        }
    }

    /**
     * Set a global volume for the full sound track.
     * @param newVolume Define the new volume of the sound track
     */
    public setVolume(newVolume: number): void {
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._outputAudioNode) {
            this._outputAudioNode.gain.value = newVolume;
        }
    }

    /**
     * Switch the panning model to HRTF:
     * Renders a stereo output of higher quality than equalpower — it uses a convolution with measured impulse responses from human subjects.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
     */
    public switchPanningModelToHRTF(): void {
        if (AbstractEngine.audioEngine?.canUseWebAudio) {
            for (let i = 0; i < this.soundCollection.length; i++) {
                this.soundCollection[i].switchPanningModelToHRTF();
            }
        }
    }

    /**
     * Switch the panning model to Equal Power:
     * Represents the equal-power panning algorithm, generally regarded as simple and efficient. equalpower is the default value.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#creating-a-spatial-3d-sound
     */
    public switchPanningModelToEqualPower(): void {
        if (AbstractEngine.audioEngine?.canUseWebAudio) {
            for (let i = 0; i < this.soundCollection.length; i++) {
                this.soundCollection[i].switchPanningModelToEqualPower();
            }
        }
    }

    /**
     * Connect the sound track to an audio analyser allowing some amazing
     * synchronization between the sounds/music and your visualization (VuMeter for instance).
     * @see https://doc.babylonjs.com/features/featuresDeepDive/audio/playingSoundsMusic#using-the-analyser
     * @param analyser The analyser to connect to the engine
     */
    public connectToAnalyser(analyser: Analyser): void {
        if (this._connectedAnalyser) {
            this._connectedAnalyser.stopDebugCanvas();
        }
        this._connectedAnalyser = analyser;
        if (AbstractEngine.audioEngine?.canUseWebAudio && this._outputAudioNode) {
            this._outputAudioNode.disconnect();
            this._connectedAnalyser.connectAudioNodes(this._outputAudioNode, AbstractEngine.audioEngine.masterGain);
        }
    }
}
