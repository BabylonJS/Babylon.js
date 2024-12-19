import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import { WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioParentNode } from "./webAudioNode";

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioParentNode {
    protected _subGraph: WebAudioBusAndSoundSubGraph;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IAudioBusOptions> = null) {
        super(name, engine, options);

        this.audioContext = engine.audioContext;
        this._subGraph = new _WebAudioBus._SubGraph(this);
    }

    /** @internal */
    public async init(options: Nullable<IAudioBusOptions>): Promise<void> {
        await this._subGraph.init(options);
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
    public get children(): Map<string, Set<AbstractAudioNode>> {
        return this._children;
    }

    /** @internal */
    public beforeInputNodeChanged(): void {}

    /** @internal */
    public afterInputNodeChanged(): void {}

    /** @internal */
    public beforeOutputNodeChanged(): void {}

    /** @internal */
    public afterOutputNodeChanged(): void {}

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }

    private static _SubGraph = class extends WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioBus;

        protected get _children(): Map<string, Set<AbstractAudioNode>> {
            return this._owner.children;
        }

        protected get _connectedDownstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._connectedDownstreamNodes ?? null;
        }

        protected get _connectedUpstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._connectedUpstreamNodes ?? null;
        }
    };
}
