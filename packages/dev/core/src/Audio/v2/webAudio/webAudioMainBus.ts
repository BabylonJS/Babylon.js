import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { MainAudioBus } from "../mainAudioBus";
import { WebAudioBaseSubGraph } from "./subGraphs/webAudioBaseSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioNode } from "./webAudioNode";
import type { IWebAudioParentNode } from "./webAudioParentNode";

/**
 * Creates a new main audio bus.
 * @param name - The name of the main bus.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created main audio bus.
 */
export async function CreateMainAudioBusAsync(name: string, engine: AudioEngineV2): Promise<MainAudioBus> {
    if (!engine.isWebAudio) {
        throw new Error("Wrong engine type.");
    }

    const bus = new _WebAudioMainBus(name, engine as _WebAudioEngine);
    await bus.init();
    (engine as _WebAudioEngine).addMainBus(bus);
    return bus;
}

/** @internal */
export class _WebAudioMainBus extends MainAudioBus implements IWebAudioParentNode {
    protected _subGraph: WebAudioBaseSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    constructor(name: string, engine: _WebAudioEngine) {
        super(name, engine);

        this.audioContext = engine.audioContext;
        this._subGraph = new WebAudioBaseSubGraph(this);
    }

    /** @internal */
    public async init(): Promise<void> {
        await this._subGraph.init();

        if (this.engine.mainOutput) {
            this._connect(this.engine.mainOutput);
        }
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
    public get subGraph(): WebAudioBaseSubGraph {
        return this._subGraph;
    }

    protected override _connect(node: IWebAudioNode): void {
        super._connect(node);

        if (node.webAudioInputNode) {
            this.webAudioOutputNode?.connect(node.webAudioInputNode);
        }
    }

    protected override _disconnect(node: IWebAudioNode): void {
        super._disconnect(node);

        if (node.webAudioInputNode) {
            this.webAudioOutputNode?.disconnect(node.webAudioInputNode);
        }
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
        return "_WebAudioMainBus";
    }
}
