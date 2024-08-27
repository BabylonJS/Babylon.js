/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAuxilliaryAudioBus } from "./abstractAuxilliaryAudioBus";
import type { Nullable } from "../../types";

export enum AudioSendType {
    PostFader,
    PreFader,
}

export interface IAudioSendOptions {
    sendType?: AudioSendType;
}

export abstract class AbstractAudioSend extends AbstractAudioNode {
    public constructor(engine: AbstractAudioEngine, options?: IAudioSendOptions) {
        super(engine, AudioNodeType.InputOutput);

        this._sendType = options?.sendType ?? AudioSendType.PostFader;
    }

    private _outputBus: Nullable<AbstractAuxilliaryAudioBus> = null;

    public get outputBus(): Nullable<AbstractAuxilliaryAudioBus> {
        return this._outputBus;
    }

    public setOutputBus(outputBus: Nullable<AbstractAuxilliaryAudioBus>) {
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

    private _sendType: AudioSendType;

    /**
     * The type of send.
     */
    public get sendType(): AudioSendType {
        return this._sendType;
    }

    public setSendType(sendType: AudioSendType) {
        if (this._sendType === sendType) {
            return;
        }

        this._sendType = sendType;
    }
}
