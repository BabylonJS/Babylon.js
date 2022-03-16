import { Sound } from "../Audio/sound";
import { Logger } from "../Misc/logger";

/**
 * Wraps one or more Sound objects and selects one with random weight for playback.
 */
export class WeightedSound {
    /** When true a Sound will be selected and played when the current playing Sound completes. */
    public loop: boolean = false;
    private _coneInnerAngle: number = 360;
    private _coneOuterAngle: number = 360;
    private _volume: number = 1;
    /** A Sound is currently playing. */
    public isPlaying: boolean = false;
    /** A Sound is currently paused. */
    public isPaused: boolean = false;

    private _sounds: Sound[] = [];
    private _weights: number[] = [];
    private _currentIndex?: number;

    /**
     * Creates a new WeightedSound from the list of sounds given.
     * @param loop When true a Sound will be selected and played when the current playing Sound completes.
     * @param sounds Array of Sounds that will be selected from.
     * @param weights Array of number values for selection weights; length must equal sounds, values will be normalized to 1
     */
    constructor(loop: boolean, sounds: Sound[], weights: number[]) {
        if (sounds.length !== weights.length) {
            throw new Error('Sounds length does not equal weights length');
        }

        this.loop = loop;
        this._weights = weights;
        // Normalize the weights
        let weightSum = 0;
        for (const weight of weights) {
            weightSum += weight;
        }
        const invWeightSum = weightSum > 0 ? 1 / weightSum : 0;
        for (let i = 0; i < this._weights.length; i++) {
            this._weights[i] *= invWeightSum;
        }
        this._sounds = sounds;
        for (let sound of this._sounds) {
            sound.onEndedObservable.add(() => { this._onended(); });
        }
    }

    /**
     * The size of cone in degrees for a directional sound in which there will be no attenuation.
     */
    public get directionalConeInnerAngle(): number {
        return this._coneInnerAngle;
    }

    /**
     * The size of cone in degrees for a directional sound in which there will be no attenuation.
     */
    public set directionalConeInnerAngle(value: number) {
        if (value !== this._coneInnerAngle) {
            if (this._coneOuterAngle < value) {
                Logger.Error("directionalConeInnerAngle: outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }

            this._coneInnerAngle = value;
            for (let sound of this._sounds) {
                sound.directionalConeInnerAngle = value;
            }
        }
    }

    /**
     * Size of cone in degrees for a directional sound outside of which there will be no sound.
     * Listener angles between innerAngle and outerAngle will falloff linearly.
     */
    public get directionalConeOuterAngle(): number {
        return this._coneOuterAngle;
    }

    /**
     * Size of cone in degrees for a directional sound outside of which there will be no sound.
     * Listener angles between innerAngle and outerAngle will falloff linearly.
     */
    public set directionalConeOuterAngle(value: number) {
        if (value !== this._coneOuterAngle) {
            if (value < this._coneInnerAngle) {
                Logger.Error("directionalConeOuterAngle: outer angle of the cone must be superior or equal to the inner angle.");
                return;
            }

            this._coneOuterAngle = value;
            for (let sound of this._sounds) {
                sound.directionalConeOuterAngle = value;
            }
        }
    }

    /**
     * Playback volume.
     */
    public get volume(): number {
        return this._volume;
    }

    /**
     * Playback volume.
     */
    public set volume(value: number) {
        if (value !== this._volume) {
            for (let sound of this._sounds) {
                sound.setVolume(value);
            }
        }
    }

    private _onended() {
        if (this._currentIndex !== undefined) {
            this._sounds[this._currentIndex].autoplay = false;
        }
        if (this.loop && this.isPlaying) {
            this.play();
        } else {
            this.isPlaying = false;
        }
    }

    /**
     * Suspend playback
     */
    public pause() {
        this.isPaused = true;
        if (this._currentIndex !== undefined) {
            this._sounds[this._currentIndex].pause();
        }
    }

    /**
     * Stop playback
     */
    public stop() {
        this.isPlaying = false;
        if (this._currentIndex !== undefined) {
            this._sounds[this._currentIndex].stop();
        }
    }

    /**
     * Start playback.
     * @param startOffset Position the clip head at a specific time in seconds.
     */
    public play(startOffset?: number) {
        if (!this.isPaused) {
            this.stop();
            let randomValue = Math.random();
            let total = 0;
            for (let i = 0; i < this._weights.length; i++) {
                total += this._weights[i];
                if (randomValue <= total) {
                    this._currentIndex = i;
                    break;
                }
            }
        }
        const sound = this._sounds[this._currentIndex!];
        if (sound.isReady()) {
            sound.play(0, this.isPaused ? undefined : startOffset);
        } else {
            sound.autoplay = true;
        }
        this.isPlaying = true;
        this.isPaused = false;
    }
}
