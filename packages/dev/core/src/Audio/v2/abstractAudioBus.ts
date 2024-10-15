import type { Nullable } from "../../types";
import type { IAudioBusNodeOptions } from "./abstractAudioBusNode";
import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractMainAudioBus } from "./abstractMainAudioBus";

export type AbstractPrimaryAudioBus = AbstractMainAudioBus | AbstractAudioBus;

export interface IAudioBusOptions extends IAudioBusNodeOptions {
    enablePositioner?: boolean;
    outputBus?: AbstractPrimaryAudioBus;
}

export abstract class AbstractAudioBus extends AbstractAudioBusNode {
    private _outputBus: Nullable<AbstractPrimaryAudioBus> = null;
    private _positioner: Nullable<AbstractAudioPositioner> = null;

    public readonly sender: AbstractAudioSender;

    public constructor(name: string, engine: AbstractAudioEngine, options?: IAudioBusOptions) {
        super(name, engine);

        if (options?.enablePositioner) {
            this.enablePositioner();
        }

        this.sender = {} as any; //engine.createSender(this);

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        }
    }

    public get positioner(): Nullable<AbstractAudioPositioner> {
        return this._positioner;
    }

    public async enablePositioner() {
        if (this._positioner) {
            return;
        }

        this._positioner = await this.engine.createPositioner(this);
    }

    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

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
