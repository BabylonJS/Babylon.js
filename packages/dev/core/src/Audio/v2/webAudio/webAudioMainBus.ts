import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { LastCreatedAudioEngine } from "../audioEngineV2";
import type { IMainAudioBusOptions } from "../mainAudioBus";
import { MainAudioBus } from "../mainAudioBus";
import { WebAudioBaseSubGraph } from "./subGraphs/webAudioBaseSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInputNode, IWebAudioParentNode } from "./webAudioNode";

/**
 * Creates a new main audio bus.
 * @param name - The name of the main audio bus.
 * @param options - The options to use when creating the main audio bus.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created main audio bus.
 */
export async function CreateMainAudioBusAsync(name: string, options: Nullable<IMainAudioBusOptions> = null, engine: Nullable<AudioEngineV2> = null): Promise<MainAudioBus> {
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine available.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const bus = new _WebAudioMainBus(name, engine as _WebAudioEngine);
    await bus.init(options);
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
        this._subGraph = new _WebAudioMainBus._SubGraph(this);
    }

    /** @internal */
    public async init(options: Nullable<IMainAudioBusOptions>): Promise<void> {
        await this._subGraph.init(options);

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

    protected override _connect(node: IWebAudioInputNode): void {
        super._connect(node);

        if (node.webAudioInputNode) {
            this.webAudioOutputNode?.connect(node.webAudioInputNode);
        }
    }

    protected override _disconnect(node: IWebAudioInputNode): void {
        super._disconnect(node);

        if (node.webAudioInputNode) {
            this.webAudioOutputNode?.disconnect(node.webAudioInputNode);
        }
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
        return "_WebAudioMainBus";
    }

    private static _SubGraph = class extends WebAudioBaseSubGraph {
        protected override _owner: _WebAudioMainBus;

        protected get _children(): Map<string, Set<AbstractAudioNode>> {
            return this._owner.children;
        }

        protected get _connectedDownstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._connectedDownstreamNodes ?? null;
        }
    };
}
