import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import { AbstractAudioSubGraph } from "../../abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import { hasVolumeAudioOptions, VolumeAudio, type IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import type { VolumeWebAudioSubNode } from "../subNodes/volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioInputNode } from "../webAudioInputNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";
import type { IWebAudioSubGraph } from "./webAudioSubGraph";

/** */
export interface IWebAudioBaseSubGraphOptions extends IVolumeAudioOptions {}

/** @internal */
export abstract class WebAudioBaseSubGraph extends AbstractAudioSubGraph implements IWebAudioSubGraph {
    protected abstract get _connectedDownstreamNodes(): Nullable<Set<AbstractAudioNode>>;

    protected _owner: IWebAudioParentNode;
    protected _webAudioOutputNode: Nullable<AudioNode> = null;

    /** @internal */
    constructor(owner: IWebAudioParentNode) {
        super();

        this._owner = owner;
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioBaseSubGraphOptions>): Promise<void> {
        this._createAndAddSubNode(AudioSubNode.Volume);

        await this._createSubNodePromisesResolved();

        if (options && hasVolumeAudioOptions(options)) {
            const volumeNode = this.getSubNode<VolumeWebAudioSubNode>(AudioSubNode.Volume);
            if (volumeNode) {
                volumeNode.volume = options.volume !== undefined ? options.volume : VolumeAudio.DefaultVolume;
            }
        }
    }

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
                return _CreateVolumeAudioSubNodeAsync(this._owner);
            default:
                return null;
        }
    }

    protected _onSubNodesChanged(): void {
        if (this._webAudioOutputNode) {
            return;
        }

        const volumeNode = this.getSubNode<VolumeWebAudioSubNode>(AudioSubNode.Volume);
        if (!volumeNode) {
            return;
        }

        this._owner.webAudioOutputNode?.disconnect();

        this._webAudioOutputNode = volumeNode.node;

        if (this._owner.webAudioOutputNode && this._connectedDownstreamNodes) {
            for (const node of this._connectedDownstreamNodes) {
                const webAudioInputNode = (node as IWebAudioInputNode).webAudioInputNode;
                if (webAudioInputNode) {
                    this._owner.webAudioOutputNode.connect(webAudioInputNode);
                }
            }
        }
    }
}
