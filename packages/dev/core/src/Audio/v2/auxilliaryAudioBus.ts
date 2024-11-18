import type { Nullable } from "../../types";
import type { IAbstractAudioBusOptions } from "./abstractAudioBus";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AbstractAudioEngine } from "./audioEngine";
import type { AudioPositioner } from "./audioPositioner";
import type { AudioSender } from "./audioSender";

/**
 * Options for creating a new auxilliary audio bus.
 */
export interface IAuxilliaryAudioBusOptions extends IAbstractAudioBusOptions {
    /**
     * Whether to enable a positioner for the auxilliary audio bus.
     */
    enablePositioner?: boolean;
    /**
     * The output bus for the auxilliary audio bus.
     */
    outputBus?: AbstractAudioBus;
}

/**
 * Abstract class representing an auxilliary audio bus in the audio engine.
 */
export abstract class AuxiliaryAudioBus extends AbstractAudioBus {
    private _positioner: Nullable<AudioPositioner> = null;
    private _outputBus: Nullable<AbstractAudioBus> = null;

    /**
     * The sender for the auxilliary audio bus.
     */
    public readonly sender: AudioSender;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IAuxilliaryAudioBusOptions> = null) {
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
     * The positioner for the auxilliary audio bus.
     */
    public get positioner(): Nullable<AudioPositioner> {
        return this._positioner;
    }

    /**
     * Enables the positioner for the auxilliary audio bus.
     * @returns A promise that resolves when the positioner is enabled.
     */
    public async enablePositioner() {
        if (this._positioner) {
            return;
        }

        this._positioner = await this._createPositioner();
    }

    /**
     * The output bus for the auxilliary audio bus.
     */
    public get outputBus(): Nullable<AbstractAudioBus> {
        return this._outputBus;
    }

    public set outputBus(outputBus: Nullable<AbstractAudioBus>) {
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
