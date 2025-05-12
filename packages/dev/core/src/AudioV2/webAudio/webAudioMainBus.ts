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
    public constructor(name: string, engine: _WebAudioEngine) {
        super(name, engine);

        this._subGraph = new _WebAudioMainBus._SubGraph(this);
    }

    /** @internal */
    public async _initAsync(options: Partial<IMainAudioBusOptions>): Promise<void> {
        await this._subGraph.initAsync(options);

        if (this.engine.mainOut) {
            if (!this._connect(this.engine.mainOut)) {
                throw new Error("Connect failed");
            }
        }

        this.engine._addMainBus(this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.engine._removeMainBus(this);
    }

    /** @internal */
    public get _inNode() {
        return this._subGraph._inNode;
    }

    /** @internal */
    public get _outNode() {
        return this._subGraph._outNode;
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
