import type { Nullable } from "../../types";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { AbstractAuxilliaryAudioBus } from "./abstractAuxilliaryAudioBus";

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
export interface AudioSendOptions {
    /**
     * The type of send.
     */
    sendType?: AudioSendType;
}

/**
 * Owned by AbstractAudioEngine.
 */
export abstract class AbstractAudioSend extends AbstractAudioNode {
    private _outputBus: Nullable<AbstractAuxilliaryAudioBus> = null;
    private _sendType: AudioSendType;

    /** @internal */
    constructor(engine: AbstractAudioEngine, options: Nullable<AudioSendOptions> = null) {
        super(engine, AudioNodeType.InputOutput);

        this._sendType = options?.sendType ?? AudioSendType.PostFader;
    }

    /**
     * The output bus.
     */
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
