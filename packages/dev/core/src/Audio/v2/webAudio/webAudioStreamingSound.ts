import type { Nullable } from "../../../types";
import type { AbstractAudioEngine } from "../abstractAudioEngine";
import type { IStreamingSoundOptions } from "../streamingSound";
import { StreamingSound } from "../streamingSound";
import { StreamingSoundInstance } from "../streamingSoundInstance";
import type { WebAudioEngine } from "./webAudioEngine";

/**
 * Options for creating a new WebAudioStreamingSound.
 */
export interface IWebAudioStreamingSoundOptions extends IStreamingSoundOptions {
    /**
     * The URL of the sound source.
     */
    sourceUrl?: string;
}

/**
 * Creates a new streaming sound.
 * @param name - The name of the sound.
 * @param engine - The audio engine.
 * @param options - The options for the streaming sound.
 * @returns A promise that resolves to the created streaming sound.
 */
export async function CreateStreamingSoundAsync(name: string, engine: AbstractAudioEngine, options: Nullable<IStreamingSoundOptions> = null): Promise<StreamingSound> {
    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const sound = new WebAudioStreamingSound(name, engine as WebAudioEngine, options);
    await sound.init(options);
    (engine as WebAudioEngine).addSound(sound);
    return sound;
}

/** @internal */
class WebAudioStreamingSound extends StreamingSound {
    private _gainNode: GainNode;

    /** @internal */
    public override readonly engine: WebAudioEngine;

    /** @internal */
    public audioContext: BaseAudioContext;

    /** @internal */
    public get volume(): number {
        return this._gainNode.gain.value;
    }

    public set volume(value: number) {
        this._gainNode.gain.value = value;
    }

    /** @internal */
    public get currentTime(): number {
        return 0;
    }

    /** @internal */
    constructor(name: string, engine: WebAudioEngine, options: Nullable<IWebAudioStreamingSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioStreamingSoundOptions> = null): Promise<void> {
        this.audioContext = await this.engine.audioContext;

        this._gainNode = new GainNode(this.audioContext);

        this.volume = options?.volume ?? 1;
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSound";
    }

    protected _createSoundInstance(): WebAudioStreamingSoundInstance {
        const soundInstance = new WebAudioStreamingSoundInstance(this);
        this.engine.addSoundInstance(soundInstance);
        return soundInstance;
    }
}

/** @internal */
class WebAudioStreamingSoundInstance extends StreamingSoundInstance {
    public get currentTime(): number {
        return 0;
    }

    constructor(source: WebAudioStreamingSound) {
        super(source);
    }

    public async init(): Promise<void> {}

    /** @internal */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {}

    /** @internal */
    public pause(): void {}

    /** @internal */
    public resume(): void {}

    /** @internal */
    public override stop(waitTime: Nullable<number> = null): void {}

    /** @internal */
    public getClassName(): string {
        return "WebAudioStreamingSoundInstance";
    }
}
