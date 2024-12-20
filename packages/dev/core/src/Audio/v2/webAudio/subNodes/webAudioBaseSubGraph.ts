import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import { _AbstractAudioSubGraph } from "../../subNodes/abstractAudioSubGraph";
import type { _AbstractAudioSubNode } from "../../subNodes/abstractAudioSubNode";
import { _AudioSubNode } from "../../subNodes/audioSubNode";
import type { _VolumeAudioSubNode, IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _HasVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioInNode, IWebAudioSubNode, IWebAudioSuperNode } from "../webAudioNode";

/** */
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
    public async init(options: Nullable<IWebAudioBaseSubGraphOptions>): Promise<void> {
        this._createAndAddSubNode(_AudioSubNode.Volume);

        await this._createSubNodePromisesResolved();

        if (options && _HasVolumeAudioOptions(options)) {
            this.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume)?.setOptions(options);
        }

        const volumeNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Volume);
        if (!volumeNode) {
            return;
        }

        this._outNode = volumeNode.node;

        // Connect the wrapped downstream WebAudio nodes to the new wrapped WebAudio node.
        // The wrapper nodes are unaware of this change.
        if (volumeNode.node && this._downstreamNodes) {
            const it = this._downstreamNodes.values();
            for (let next = it.next(); !next.done; next = it.next()) {
                const inNode = (next.value as IWebAudioInNode).inNode;
                if (inNode) {
                    volumeNode.node.connect(inNode);
                }
            }
        }
    }

    protected abstract get _downstreamNodes(): Nullable<Set<AbstractAudioNode>>;

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
            case _AudioSubNode.Volume:
                return _CreateVolumeAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }
}
