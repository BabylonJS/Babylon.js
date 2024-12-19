import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import { WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioSuperNode } from "./webAudioNode";

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioSuperNode {
    protected _subGraph: WebAudioBusAndSoundSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public readonly audioContext: AudioContext;

    /** @internal */
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IAudioBusOptions> = null) {
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
    public get webAudioInputNode() {
        return this._subGraph.webAudioInputNode;
    }

    /** @internal */
    public get webAudioOutputNode() {
        return this._subGraph.webAudioOutputNode;
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }

    private static _SubGraph = class extends WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioBus;

        protected get _connectedDownstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._connectedDownstreamNodes ?? null;
        }

        protected get _connectedUpstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._connectedUpstreamNodes ?? null;
        }
    };
}
