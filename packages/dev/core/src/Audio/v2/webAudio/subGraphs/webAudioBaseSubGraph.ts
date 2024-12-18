import type { Nullable } from "core/types";
import { AbstractAudioSubGraph } from "../../abstractAudioSubGraph";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import type { _VolumeWebAudioSubNode } from "../subNodes/volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";

/** @internal */
export abstract class WebAudioBaseSubGraph extends AbstractAudioSubGraph {
    protected override _owner: IWebAudioParentNode;

    /** @internal */
    constructor(owner: IWebAudioParentNode) {
        super(owner);
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this.getSubNode<_VolumeWebAudioSubNode>(AudioSubNode.Volume)?.node!;
    }

    protected _createSubNode(name: string): Nullable<Promise<AbstractAudioSubNode>> {
        switch (name) {
            case AudioSubNode.Volume:
                return _CreateVolumeAudioSubNodeAsync(this._owner);
            default:
                return null;
        }
    }
}
