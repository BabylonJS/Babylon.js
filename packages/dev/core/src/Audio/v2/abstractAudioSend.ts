import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAuxilliaryAudioBus } from "./abstractAuxilliaryAudioBus";

export enum AudioSendType {
    PostFader,
    PreFader,
}

export interface IAudioSendOptions {
    sendType?: AudioSendType;
}

/**
 * Owned by AbstractAudioEngine.
 */
export abstract class AbstractAudioSend extends AbstractAudioNode {
    private _outputBus: Nullable<AbstractAuxilliaryAudioBus> = null;
    private _sendType: AudioSendType;

    public constructor(engine: AbstractAudioEngine, options: Nullable<IAudioSendOptions> = null) {
        super(engine, AudioNodeType.InputOutput);

        this._sendType = options?.sendType ?? AudioSendType.PostFader;
    }

    public get outputBus(): Nullable<AbstractAuxilliaryAudioBus> {
        return this._outputBus;
    }

    public set outputBus(outputBus: Nullable<AbstractAuxilliaryAudioBus>) {
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

    /**
     * The type of send.
     */
    public get sendType(): AudioSendType {
        return this._sendType;
    }

    public set sendType(sendType: AudioSendType) {
        if (this._sendType === sendType) {
            return;
        }

        this._sendType = sendType;
    }
}
