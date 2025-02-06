import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../../abstractAudio/abstractAudioNode";
import { _AbstractAudioSubGraph } from "../../abstractAudio/subNodes/abstractAudioSubGraph";
import type { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import type { IVolumeAudioOptions } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import { _GetVolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import type { IWebAudioInNode, IWebAudioSuperNode } from "../webAudioNode";
import type { _VolumeWebAudioSubNode } from "./volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "./volumeWebAudioSubNode";

/**
 * Options for creating a WebAudioBaseSubGraph.
 */
export interface IWebAudioBaseSubGraphOptions extends IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBaseSubGraph extends _AbstractAudioSubGraph {
    protected _owner: IWebAudioSuperNode;
    protected _outNode: Nullable<AudioNode> = null;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode) {
        super();

        this._owner = owner;
    }

    /** @internal */
    public async init(options: Partial<IWebAudioBaseSubGraphOptions>): Promise<void> {
        this._createAndAddSubNode(AudioSubNode.VOLUME);
        await this._createSubNodePromisesResolved();

        const volumeNode = _GetVolumeAudioSubNode(this);
        if (!volumeNode) {
            throw new Error("No volume subnode.");
        }

        volumeNode.setOptions(options);

        if (volumeNode.getClassName() !== "VolumeWebAudioSubNode") {
            throw new Error("Not a WebAudio subnode.");
        }

        this._outNode = (volumeNode as _VolumeWebAudioSubNode).node;

        // Connect the new wrapped WebAudio node to the wrapped downstream WebAudio nodes.
        // The wrapper nodes are unaware of this change.
        if (this._outNode && this._downstreamNodes) {
            const it = this._downstreamNodes.values();
            for (let next = it.next(); !next.done; next = it.next()) {
                const inNode = (next.value as IWebAudioInNode).inNode;
                if (inNode) {
                    this._outNode.connect(inNode);
                }
            }
        }
    }

    protected abstract readonly _downstreamNodes: Nullable<Set<AbstractAudioNode>>;

    /** @internal */
    public get inNode(): Nullable<AudioNode> {
        return this._outNode;
    }

    /** @internal */
    public get outNode(): Nullable<AudioNode> {
        return this._outNode;
    }

    protected _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>> {
        switch (name) {
            case AudioSubNode.VOLUME:
                return _CreateVolumeAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }
}
