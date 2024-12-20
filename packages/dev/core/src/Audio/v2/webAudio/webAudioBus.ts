import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import { _WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioSuperNode } from "./webAudioNode";
import { _StereoAudio } from "../subProperties/stereoAudio";
import { _SpatialAudio } from "../subProperties/spatialAudio";

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioSuperNode {
    private _spatial: Nullable<_SpatialAudio> = null;
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly audioContext: AudioContext;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Nullable<IAudioBusOptions> = null) {
        super(name, engine, options);

        this._subGraph = new _WebAudioBus._SubGraph(this);

        this.audioContext = engine.audioContext;
    }

    /** @internal */
    public async init(options: Nullable<IAudioBusOptions>): Promise<void> {
        await this._subGraph.init(options);

        this.engine.addSuperNode(this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.engine.removeSuperNode(this);
    }

    /** @internal */
    public get inNode() {
        return this._subGraph.inNode;
    }

    /** @internal */
    public get outNode() {
        return this._subGraph.outNode;
    }

    /** @internal */
    public override get spatial(): _SpatialAudio {
        return this._spatial ?? (this._spatial = new _SpatialAudio(this._subGraph));
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioBus;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }
    };
}
