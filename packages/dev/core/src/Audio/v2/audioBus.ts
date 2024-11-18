import type { Nullable } from "../../types";
import type { IAbstractAudioBusOptions } from "./abstractAudioBus";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngine";
import type { AudioPositioner } from "./audioPositioner";
import type { AudioSender } from "./audioSender";
import type { MainAudioBus } from "./mainAudioBus";

export type AbstractPrimaryAudioBus = MainAudioBus | AudioBus;

/**
 * Options for creating a new audio bus.
 */
export interface IAudioBusOptions extends IAbstractAudioBusOptions {
    /**
     * Whether to enable the positioner.
     */
    enablePositioner?: boolean;
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
    private _positioner: Nullable<AudioPositioner> = null;

    /**
     * The sender of the audio bus.
     */
    public readonly sender: AudioSender;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAudioBusOptions> = null) {
        super(name, engine);

        if (options?.enablePositioner) {
            this.enablePositioner();
        }

        this.sender = {} as any; //engine.createSender(this);

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        }
    }

    /**
     * The positioner of the audio bus.
     */
    public get positioner(): Nullable<AudioPositioner> {
        return this._positioner;
    }

    /**
     * Enables the positioner of the audio bus.
     * @returns A promise that resolves when the positioner is enabled.
     */
    public async enablePositioner() {
        if (this._positioner) {
            return;
        }

        this._positioner = await this._createPositioner();
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

    protected abstract _createPositioner(): Promise<AudioPositioner>;
}
