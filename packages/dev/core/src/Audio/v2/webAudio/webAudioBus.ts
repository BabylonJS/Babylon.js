import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import { WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { IWebAudioSubGraph } from "./subGraphs/webAudioSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInputNode } from "./webAudioInputNode";
import type { IWebAudioOutputNode } from "./webAudioOutputNode";
import type { IWebAudioParentNode } from "./webAudioParentNode";

/** @internal */
export class _WebAudioBus extends AudioBus implements IWebAudioParentNode {
    protected _subGraph: WebAudioBusAndSoundSubGraph;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IAudioBusOptions> = null) {
        super(name, engine, options);

        this.audioContext = engine.audioContext;
        this._subGraph = new WebAudioBusAndSoundSubGraph(this);
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
    public get subGraph(): IWebAudioSubGraph {
        return this._subGraph;
    }

    /** @internal */
    public beforeInputNodeChanged(): void {
        if (this.webAudioInputNode && this._connectedUpstreamNodes) {
            for (const node of this._connectedUpstreamNodes) {
                (node as IWebAudioOutputNode).webAudioOutputNode?.disconnect(this.webAudioInputNode);
            }
        }
    }

    /** @internal */
    public afterInputNodeChanged(): void {
        if (this.webAudioInputNode && this._connectedUpstreamNodes) {
            for (const node of this._connectedUpstreamNodes) {
                (node as IWebAudioOutputNode).webAudioOutputNode?.connect(this.webAudioInputNode);
            }
        }
    }

    /** @internal */
    public beforeOutputNodeChanged(): void {
        this.webAudioOutputNode?.disconnect();
    }

    /** @internal */
    public afterOutputNodeChanged(): void {
        if (this.webAudioOutputNode && this._connectedDownstreamNodes) {
            for (const node of this._connectedDownstreamNodes) {
                const webAudioInputNode = (node as IWebAudioInputNode).webAudioInputNode;
                if (webAudioInputNode) {
                    this.webAudioOutputNode.connect(webAudioInputNode);
                }
            }
        }
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }
}
