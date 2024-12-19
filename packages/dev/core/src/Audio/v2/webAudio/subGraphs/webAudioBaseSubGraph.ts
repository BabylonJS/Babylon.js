import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import { AbstractAudioSubGraph } from "../../abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import type { IVolumeAudioOptions, VolumeAudioSubNode } from "../../subNodes/volumeAudioSubNode";
import { hasVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioInputNode, IWebAudioSuperNode, IWebAudioSubNode } from "../webAudioNode";

/** */
export interface IWebAudioBaseSubGraphOptions extends IVolumeAudioOptions {}

/** @internal */
export abstract class WebAudioBaseSubGraph extends AbstractAudioSubGraph {
    protected _owner: IWebAudioSuperNode;
    protected _webAudioOutputNode: Nullable<AudioNode> = null;

    /** @internal */
    constructor(owner: IWebAudioSuperNode) {
        super();

        this._owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioBaseSubGraphOptions>): Promise<void> {
        this._createAndAddSubNode(AudioSubNode.Volume);

        await this._createSubNodePromisesResolved();

        if (options && hasVolumeAudioOptions(options)) {
            this.getSubNode<VolumeAudioSubNode>(AudioSubNode.Volume)?.setOptions(options);
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

    protected _createSubNode(name: string): Nullable<Promise<AbstractAudioSubNode>> {
        switch (name) {
            case AudioSubNode.Volume:
                return _CreateVolumeAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected _onSubNodesChanged(): void {
        if (this._webAudioOutputNode) {
            return;
        }

        const volumeNode = this.getSubNode<IWebAudioSubNode>(AudioSubNode.Volume);
        if (!volumeNode) {
            return;
        }

        this._webAudioOutputNode = volumeNode.node;

        if (this._webAudioOutputNode && this._connectedDownstreamNodes) {
            for (const node of this._connectedDownstreamNodes) {
                const webAudioInputNode = (node as IWebAudioInputNode).webAudioInputNode;
                if (webAudioInputNode) {
                    this._webAudioOutputNode.connect(webAudioInputNode);
                }
            }
        }
    }
}
