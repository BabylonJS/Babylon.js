import type { Nullable } from "../../types";
import type { IAbstractAudioBusOptions } from "./abstractAudioBus";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
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
    private _outputBus: Nullable<AbstractAudioBus> = null;

    /**
     * The sender for the auxilliary audio bus.
     */
    public readonly sender: AudioSender;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAuxilliaryAudioBusOptions> = null) {
        super(name, engine);

        this.sender = {} as any; //engine.createSender(this);

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        }
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
}
