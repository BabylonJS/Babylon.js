import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type { IAudioBusOptions } from "../abstractAudio/audioBus";
import { AudioBus } from "../abstractAudio/audioBus";
import { _HasSpatialAudioOptions, type AbstractSpatialAudio } from "../abstractAudio/subProperties/abstractSpatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioSuperNode } from "./webAudioNode";

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioSuperNode {
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Partial<IAudioBusOptions>) {
        super(name, engine, options);

        this._subGraph = new _WebAudioBus._SubGraph(this);
    }

    /** @internal */
    public async _initAsync(options: Partial<IAudioBusOptions>): Promise<void> {
        if (options.outBus) {
            this.outBus = options.outBus;
        } else {
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
    public override dispose(): void {
        super.dispose();

        this._stereo = null;

        this.engine._removeNode(this);
    }

    /** @internal */
    public get _inNode() {
        return this._subGraph._inNode;
    }

    /** @internal */
    public get _outNode() {
        return this._subGraph._outNode;
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }

    protected override _createSpatialProperty(autoUpdate: boolean, minUpdateTime: number): AbstractSpatialAudio {
        return new _SpatialWebAudio(this._subGraph, autoUpdate, minUpdateTime);
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

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
