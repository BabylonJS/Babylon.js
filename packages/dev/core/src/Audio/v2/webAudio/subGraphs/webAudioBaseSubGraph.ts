import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import { _AbstractAudioSubGraph } from "../../abstractAudioSubGraph";
import type { _AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { _AudioSubNode } from "../../subNodes/audioSubNode";
import type { _VolumeAudioSubNode, IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _hasVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioInputNode, IWebAudioSubNode, IWebAudioSuperNode } from "../webAudioNode";

/** */
export interface IWebAudioBaseSubGraphOptions extends IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBaseSubGraph extends _AbstractAudioSubGraph {
    protected _owner: IWebAudioSuperNode;
    protected _webAudioOutputNode: Nullable<AudioNode> = null;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode) {
        super();

        this._owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioBaseSubGraphOptions>): Promise<void> {
        this._createAndAddSubNode(_AudioSubNode.Volume);

        await this._createSubNodePromisesResolved();

        if (options && _hasVolumeAudioOptions(options)) {
            this.getSubNode<_VolumeAudioSubNode>(_AudioSubNode.Volume)?.setOptions(options);
        }
    }

    protected abstract get _connectedDownstreamNodes(): Nullable<Set<AbstractAudioNode>>;

    /** @internal */
    public get webAudioInputNode(): Nullable<AudioNode> {
        return this._webAudioOutputNode;
    }

    /** @internal */
    public get webAudioOutputNode(): Nullable<AudioNode> {
        return this._webAudioOutputNode;
    }

    protected _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>> {
        switch (name) {
            case _AudioSubNode.Volume:
                return _CreateVolumeAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected _onSubNodesChanged(): void {
        if (this._webAudioOutputNode) {
            return;
        }

        const volumeNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Volume);
        if (!volumeNode) {
            return;
        }

        this._webAudioOutputNode = volumeNode.node;

        // Connect the wrapped downstream WebAudio nodes to the new wrapped WebAudio node.
        // The wrapper nodes are unaware of this change.
        if (volumeNode.node && this._connectedDownstreamNodes) {
            const it = this._connectedDownstreamNodes.values();
            for (let next = it.next(); !next.done; next = it.next()) {
                const webAudioInputNode = (next.value as IWebAudioInputNode).webAudioInputNode;
                if (webAudioInputNode) {
                    volumeNode.node.connect(webAudioInputNode);
                }
            }
        }
    }
}
