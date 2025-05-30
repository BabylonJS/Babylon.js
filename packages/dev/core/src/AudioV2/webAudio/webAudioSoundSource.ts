import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "../abstractAudio";
import type { ISoundSourceOptions } from "../abstractAudio/abstractSoundSource";
import { AbstractSoundSource } from "../abstractAudio/abstractSoundSource";
import { _HasSpatialAudioOptions } from "../abstractAudio/subProperties/abstractSpatialAudio";
import type { _SpatialAudio } from "../abstractAudio/subProperties/spatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode } from "./webAudioNode";

/** @internal */
export class _WebAudioSoundSource extends AbstractSoundSource {
    private _spatial: Nullable<_SpatialWebAudio> = null;
    private readonly _spatialAutoUpdate: boolean = true;
    private readonly _spatialMinUpdateTime: number = 0;
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;
    protected _webAudioNode: AudioNode;

    /** @internal */
    public _audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(name: string, webAudioNode: AudioNode, engine: _WebAudioEngine, options: Partial<ISoundSourceOptions>) {
        super(name, engine);

        if (typeof options.spatialAutoUpdate === "boolean") {
            this._spatialAutoUpdate = options.spatialAutoUpdate;
        }

        if (typeof options.spatialMinUpdateTime === "number") {
            this._spatialMinUpdateTime = options.spatialMinUpdateTime;
        }

        this._audioContext = this.engine._audioContext;
        this._webAudioNode = webAudioNode;

        this._subGraph = new _WebAudioSoundSource._SubGraph(this);
    }

    /** @internal */
    public async _initAsync(options: Partial<ISoundSourceOptions>): Promise<void> {
        if (options.outBus) {
            this.outBus = options.outBus;
        } else if (options.outBusAutoDefault !== false) {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.initAsync(options);

        if (_HasSpatialAudioOptions(options)) {
            this._initSpatialProperty();
        }

        this.engine._addNode(this);
    }

    /** @internal */
    public get _inNode() {
        return this._webAudioNode;
    }

    /** @internal */
    public get _outNode() {
        return this._subGraph._outNode;
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
    public override dispose(): void {
        super.dispose();

        this._spatial?.dispose();
        this._spatial = null;

        this._stereo = null;

        this._subGraph.dispose();

        this.engine._removeNode(this);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioSoundSource";
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node._inNode) {
            this._outNode?.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node._inNode) {
            this._outNode?.disconnect(node._inNode);
        }

        return true;
    }

    private _initSpatialProperty(): _SpatialAudio {
        if (!this._spatial) {
            this._spatial = new _SpatialWebAudio(this._subGraph, this._spatialAutoUpdate, this._spatialMinUpdateTime);
        }

        return this._spatial;
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioSoundSource;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }

        protected override _onSubNodesChanged(): void {
            super._onSubNodesChanged();

            this._owner._inNode.disconnect();

            if (this._owner._subGraph._inNode) {
                this._owner._inNode.connect(this._owner._subGraph._inNode);
            }
        }
    };
}
