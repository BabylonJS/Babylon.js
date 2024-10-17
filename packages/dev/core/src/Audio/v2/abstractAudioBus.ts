import type { Nullable } from "../../types";
import type { AudioBusNodeOptions } from "./abstractAudioBusNode";
import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractMainAudioBus } from "./abstractMainAudioBus";

export type AbstractPrimaryAudioBus = AbstractMainAudioBus | AbstractAudioBus;

/**
 * Options for creating a new audio bus.
 */
export interface AudioBusOptions extends AudioBusNodeOptions {
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
export abstract class AbstractAudioBus extends AbstractAudioBusNode {
    private _outputBus: Nullable<AbstractPrimaryAudioBus> = null;
    private _positioner: Nullable<AbstractAudioPositioner> = null;

    /**
     * The sender of the audio bus.
     */
    public readonly sender: AbstractAudioSender;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<AudioBusOptions> = null) {
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
    public get positioner(): Nullable<AbstractAudioPositioner> {
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

        this._positioner = await this.engine.createPositioner(this);
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
