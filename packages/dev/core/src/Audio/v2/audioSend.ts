import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./audioEngine";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AuxiliaryAudioBus } from "./auxilliaryAudioBus";

/**
 * The type of send.
 */
export enum AudioSendType {
    /**
     * The send is post-fader.
     */
    PostFader,
    /**
     * The send is pre-fader.
     */
    PreFader,
}

/**
 * Options for creating a new audio send.
 */
export interface IAudioSendOptions {
    /**
     * The type of send.
     */
    sendType?: AudioSendType;
}

/**
 * Owned by AbstractAudioEngine.
 */
export abstract class AudioSend extends AbstractAudioNode {
    private _outputBus: Nullable<AuxiliaryAudioBus> = null;
    private _sendType: AudioSendType;

    /** @internal */
    constructor(engine: AbstractAudioEngine, options: Nullable<IAudioSendOptions> = null) {
        super(engine, AudioNodeType.InputOutput);

        this._sendType = options?.sendType ?? AudioSendType.PostFader;
    }

    /**
     * The output bus.
     */
    public get outputBus(): Nullable<AuxiliaryAudioBus> {
        return this._outputBus;
    }

    public set outputBus(outputBus: Nullable<AuxiliaryAudioBus>) {
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
