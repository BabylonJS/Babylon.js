import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type { IMainAudioBusOptions } from "../abstractAudio/mainAudioBus";
import { MainAudioBus } from "../abstractAudio/mainAudioBus";
import { _WebAudioBaseSubGraph } from "./subNodes/webAudioBaseSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioSuperNode } from "./webAudioNode";

/** @internal */
export class _WebAudioMainBus extends MainAudioBus implements IWebAudioSuperNode {
    protected _subGraph: _WebAudioBaseSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine) {
        super(name, engine);

        this._subGraph = new _WebAudioMainBus._SubGraph(this);
        this.audioContext = engine.audioContext;
    }

    /** @internal */
    public async init(options: Partial<IMainAudioBusOptions>): Promise<void> {
        await this._subGraph.init(options);

        if (this.engine.mainOut) {
            if (!this._connect(this.engine.mainOut)) {
                throw new Error("Connect failed");
            }
        }

        this.engine.addMainBus(this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.engine.removeMainBus(this);
    }

    /** @internal */
    public get inNode() {
        return this._subGraph.inNode;
    }

    /** @internal */
    public get outNode() {
        return this._subGraph.outNode;
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        if (node.inNode) {
            this.outNode?.connect(node.inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node.inNode) {
            this.outNode?.disconnect(node.inNode);
        }

        return true;
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioMainBus";
    }

    private static _SubGraph = class extends _WebAudioBaseSubGraph {
        protected override _owner: _WebAudioMainBus;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }
    };
}
