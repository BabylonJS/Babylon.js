import type { Nullable } from "../../types";
import { AbstractAudioBus } from "./abstractAudioBus";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { AudioSender } from "./audioSender";
import type { MainAudioBus } from "./mainAudioBus";
import { AudioSubNode } from "./subNodes/audioSubNode";
import type { ISpatialAudioOptions } from "./subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions, StereoAudioSubNode } from "./subNodes/stereoAudioSubNode";
import { StereoAudio } from "./subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "./subNodes/volumeAudioSubNode";

export type AbstractPrimaryAudioBus = MainAudioBus | AudioBus;

/**
 * Options for creating a new audio bus.
 */
export interface IAudioBusOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {
    /**
     * The output bus of the audio bus.
     */
    outputBus?: AbstractPrimaryAudioBus;
}

/**
 * Abstract class for an audio bus.
 */
export abstract class AudioBus extends AbstractAudioBus {
    private _outputBus: Nullable<AbstractPrimaryAudioBus> = null;

    /**
     * The sender of the audio bus.
     */
    public readonly sender: AudioSender;

    /** @internal */
    constructor(name: string, engine: AudioEngineV2, options: Nullable<IAudioBusOptions> = null) {
        super(name, engine);

        this.sender = {} as any; //engine.createSender(this);

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        }
    }

    /**
     * Gets the output bus of the audio bus.
     */
    public get outputBus(): Nullable<AbstractPrimaryAudioBus> {
        return this._outputBus;
    }

    /**
     * Sets the output bus of the audio bus.
     */
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

    /** */
    public get stereoPan(): number {
        return this._subGraph.getSubNode<StereoAudioSubNode>(AudioSubNode.Stereo)?.pan ?? StereoAudio.DefaultPan;
    }

    public set stereoPan(value: number) {
        this._subGraph.callOnSubNode<StereoAudioSubNode>(AudioSubNode.Stereo, (node) => {
            node.pan = value;
        });
    }
}
