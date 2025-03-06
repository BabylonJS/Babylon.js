import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type { IAudioBusOptions } from "../abstractAudio/audioBus";
import { AudioBus } from "../abstractAudio/audioBus";
import { _HasSpatialAudioOptions } from "../abstractAudio/subProperties/abstractSpatialAudio";
import type { _SpatialAudio } from "../abstractAudio/subProperties/spatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioSuperNode } from "./webAudioNode";

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioSuperNode {
    private _spatial: Nullable<_SpatialAudio> = null;
    private readonly _spatialAutoUpdate: boolean = true;
    private readonly _spatialMinUpdateTime: number = 0;
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly audioContext: AudioContext;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Partial<IAudioBusOptions>) {
        super(name, engine);

        if (typeof options.spatialAutoUpdate === "boolean") {
            this._spatialAutoUpdate = options.spatialAutoUpdate;
        }

        if (typeof options.spatialMinUpdateTime === "number") {
            this._spatialMinUpdateTime = options.spatialMinUpdateTime;
        }

        this._subGraph = new _WebAudioBus._SubGraph(this);

        this.audioContext = engine.audioContext;
    }

    /** @internal */
    public async init(options: Partial<IAudioBusOptions>): Promise<void> {
        if (options.outBus) {
            this.outBus = options.outBus;
        } else {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.init(options);

        if (_HasSpatialAudioOptions(options)) {
            this._initSpatialProperty();
        }

        this.engine.addNode(this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._spatial = null;
        this._stereo = null;

        this.engine.removeNode(this);
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
        if (this._spatial) {
            return this._spatial;
        }
        return this._initSpatialProperty();
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }

    private _initSpatialProperty(): _SpatialAudio {
        if (!this._spatial) {
            this._spatial = new _SpatialWebAudio(this._subGraph, this._spatialAutoUpdate, this._spatialMinUpdateTime);
        }

        return this._spatial;
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
