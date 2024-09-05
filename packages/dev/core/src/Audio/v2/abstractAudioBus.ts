/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { IAudioBusNodeOptions } from "./abstractAudioBusNode";
import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioPositioner } from "./abstractAudioPositioner";
import type { AbstractAudioSender } from "./abstractAudioSender";
import type { AbstractMainAudioBus } from "./abstractMainAudioBus";
import type { Nullable } from "../../types";

export type AbstractPrimaryAudioBus = AbstractMainAudioBus | AbstractAudioBus;

export interface IAudioBusOptions extends IAudioBusNodeOptions {
    enablePositioner?: boolean;
    outputBus?: AbstractPrimaryAudioBus;
}

export abstract class AbstractAudioBus extends AbstractAudioBusNode {
    public constructor(name: string, engine: AbstractAudioEngine, options?: IAudioBusOptions) {
        super(name, engine);

        if (options?.enablePositioner) {
            this.enablePositioner();
        }

        this.sender = engine.createSender(this);

        if (options?.outputBus) {
            this.setOutputBus(options.outputBus);
        }
    }

    private _positioner: Nullable<AbstractAudioPositioner> = null;

    public get positioner(): Nullable<AbstractAudioPositioner> {
        return this._positioner;
    }

    public enablePositioner() {
        if (this._positioner) {
            return;
        }

        this._positioner = this.engine.createPositioner(this);
    }

    public readonly sender: AbstractAudioSender;

    private _outputBus: Nullable<AbstractPrimaryAudioBus> = null;

    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

    public setOutputBus(outputBus: Nullable<AbstractPrimaryAudioBus>) {
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
