import type { Nullable } from "core/types";
import { AbstractAudioSubGraph } from "../../abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import type { _VolumeWebAudioSubNode } from "../subNodes/volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";
import type { IWebAudioSubGraph } from "./webAudioSubGraph";

/** @internal */
export class WebAudioBaseSubGraph extends AbstractAudioSubGraph implements IWebAudioSubGraph {
    protected override _owner: IWebAudioParentNode;
    protected _webAudioOutputNode: Nullable<AudioNode> = null;

    /** @internal */
    constructor(owner: IWebAudioParentNode) {
        super(owner);
    }

    /** @internal */
    public async init(): Promise<void> {
        this._createAndAddSubNode(AudioSubNode.Volume);

        await this._createSubNodePromisesResolved();
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

        const volumeNode = this.getSubNode<_VolumeWebAudioSubNode>(AudioSubNode.Volume);
        if (!volumeNode) {
            return;
        }

        this._webAudioOutputNode = volumeNode.node;

        this._owner.reconnectDownstreamNodes();
    }
}
