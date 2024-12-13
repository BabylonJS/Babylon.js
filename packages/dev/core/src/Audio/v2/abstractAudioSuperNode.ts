import type { Nullable } from "../../types";
import type { AudioNodeType } from "./abstractAudioNode";
import { AbstractAudioNode } from "./abstractAudioNode";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "./abstractAudioSubNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class for an audio node containing audio sub-nodes.
 */
export abstract class AbstractAudioSuperNode extends AbstractAudioNode {
    private _subNodes = new Map<string, AbstractAudioSubNode>();

    protected abstract _subNodeGraph: _AbstractAudioSubGraph;

    /**
     * The name of the audio node.
     */
    public name: string;

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType) {
        super(engine, nodeType);
        this.name = name;
    }

    /**
     * The node's stereo pan.
     */
    public get stereoPan(): number {
        return this._subNodeGraph.stereoPan;
    }

    public set stereoPan(value: number) {
        this._subNodeGraph.stereoPan = value;
    }

    /**
     * The node's volume.
     */
    public get volume(): number {
        return this._subNodeGraph.volume;
    }

    public set volume(value: number) {
        this._subNodeGraph.volume = value;
    }

    protected abstract _updateSubNodes(): void;

    protected _addSubNode(subNode: AbstractAudioSubNode): void {
        if (this._subNodes.has(subNode.name)) {
            return;
        }

        this._subNodes.set(subNode.name, subNode);
        this._updateSubNodes();
    }

    protected _disconnectSubNodes(): void {
        const it = this._subNodes.values();
        for (let next = it.next(); !next.done; next = it.next()) {
            next.value.disconnect();
        }
    }

    protected _getSubNode(name: string): Nullable<AbstractAudioSubNode> {
        return this._subNodes.get(name) ?? null;
    }

    protected _hasSubNode(name: string): boolean {
        return this._subNodes.has(name);
    }

    protected _removeSubNode(subNode: AbstractAudioSubNode): void {
        if (!this._subNodes.has(subNode.name)) {
            return;
        }

        this._subNodes.delete(subNode.name);
        this._updateSubNodes();
    }
}
