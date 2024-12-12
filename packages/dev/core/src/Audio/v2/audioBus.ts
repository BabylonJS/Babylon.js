import type { Nullable } from "../../types";
import type { IAbstractAudioBusOptions } from "./abstractAudioBus";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { AudioSender } from "./audioSender";
import type { MainAudioBus } from "./mainAudioBus";

export type AbstractPrimaryAudioBus = MainAudioBus | AudioBus;

/**
 * Options for creating a new audio bus.
 */
export interface IAudioBusOptions extends IAbstractAudioBusOptions {
    /**
     * The output bus of the audio bus.
     */
    outputBus?: AbstractPrimaryAudioBus;
}

/**
 * Abstract class for an audio bus.
 */
export abstract class AudioBus extends AbstractAudioBus {
    private _outputBus: Nullable<AbstractPrimaryAudioBus> = null;

    /**
     * The sender of the audio bus.
     */
    public readonly sender: AudioSender;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAudioBusOptions> = null) {
        super(name, engine);

        this.sender = {} as any; //engine.createSender(this);

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        }
    }

    /**
     * Gets the output bus of the audio bus.
     */
    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

    /**
     * Sets the output bus of the audio bus.
     */
    public set outputBus(outputBus: Nullable<AbstractPrimaryAudioBus>) {
        if (this._outputBus === outputBus) {
            return;
        }

        if (this._outputBus) {
            this._disconnect(this._outputBus);
        }

        this._outputBus = outputBus;

        if (this._outputBus) {
            this._connect(this._outputBus);
        }
    }
}
