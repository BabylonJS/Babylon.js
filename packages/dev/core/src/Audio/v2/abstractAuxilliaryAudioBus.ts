import type { Nullable } from "../../types";
import type { AudioBusNodeOptions } from "./abstractAudioBusNode";
import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";

/**
 * Options for creating a new auxilliary audio bus.
 */
export interface AuxilliaryAudioBusOptions extends AudioBusNodeOptions {
    /**
     * Whether to enable a positioner for the auxilliary audio bus.
     */
    enablePositioner?: boolean;
    /**
     * The output bus for the auxilliary audio bus.
     */
    outputBus?: AbstractAudioBusNode;
}

/**
 * Abstract class representing an auxilliary audio bus in the audio engine.
 */
export abstract class AbstractAuxilliaryAudioBus extends AbstractAudioBusNode {
    private _positioner: Nullable<AbstractAudioPositioner> = null;
    private _outputBus: Nullable<AbstractAudioBusNode> = null;

    /**
     * The sender for the auxilliary audio bus.
     */
    public readonly sender: AbstractAudioSender;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<AuxilliaryAudioBusOptions> = null) {
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
    public get positioner(): Nullable<AbstractAudioPositioner> {
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

        this._positioner = await this.engine.createPositioner(this);
    }

    /**
     * The output bus for the auxilliary audio bus.
     */
    public get outputBus(): Nullable<AbstractAudioBusNode> {
        return this._outputBus;
    }

    public set outputBus(outputBus: Nullable<AbstractAudioBusNode>) {
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
