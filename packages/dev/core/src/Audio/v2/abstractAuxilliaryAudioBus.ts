import type { IAudioBusNodeOptions } from "./abstractAudioBusNode";
import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { Nullable } from "../../types";

export interface IAuxilliaryAudioBusOptions extends IAudioBusNodeOptions {
    enablePositioner?: boolean;
    outputBus?: AbstractAudioBusNode;
}

export abstract class AbstractAuxilliaryAudioBus extends AbstractAudioBusNode {
    private _positioner: Nullable<AbstractAudioPositioner> = null;
    private _outputBus: Nullable<AbstractAudioBusNode> = null;

    public readonly sender: AbstractAudioSender;

    public constructor(name: string, engine: AbstractAudioEngine, options?: IAuxilliaryAudioBusOptions) {
        super(name, engine);

        if (options?.enablePositioner) {
            this.enablePositioner();
        }

        this.sender = engine.createSender(this);

        if (options?.outputBus) {
            this.setOutputBus(options.outputBus);
        }
    }

    public get positioner(): Nullable<AbstractAudioPositioner> {
        return this._positioner;
    }

    public enablePositioner() {
        if (this._positioner) {
            return;
        }

        this._positioner = this.engine.createPositioner(this);
    }

    public get outputBus(): Nullable<AbstractAudioBusNode> {
        return this._outputBus;
    }

    public setOutputBus(outputBus: Nullable<AbstractAudioBusNode>) {
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
