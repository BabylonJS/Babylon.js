import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import { WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { IWebAudioSubGraph } from "./subGraphs/webAudioSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioParentNode } from "./webAudioParentNode";

/**
 * Options for creating a new WebAudio bus.
 */
export interface IWebAudioBusOptions extends IAudioBusOptions {}

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioParentNode {
    protected _subGraph: WebAudioBusAndSoundSubGraph;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IWebAudioBusOptions> = null) {
        super(name, engine, options);

        this.audioContext = engine.audioContext;
        this._subGraph = new WebAudioBusAndSoundSubGraph(this);
    }

    /** @internal */
    public async init(): Promise<void> {
        await this._subGraph.init();
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
    public get subGraph(): IWebAudioSubGraph {
        return this._subGraph;
    }

    /** @internal */
    public reconnectDownstreamNodes(): void {
        this._reconnectDownstreamNodes();
    }

    /** @internal */
    public reconnectUpstreamNodes(): void {
        this._reconnectUpstreamNodes();
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }
}
