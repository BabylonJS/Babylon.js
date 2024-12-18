import type { Nullable } from "../../../../types";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "../subNodes/spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "../subNodes/stereoWebAudioSubNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";
import type { IWebAudioSubGraph } from "../webAudioSubGraph";
import { WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export class WebAudioBusAndSoundSubGraph extends WebAudioBaseSubGraph implements IWebAudioSubGraph {
    /** @internal */
    public constructor(owner: IWebAudioParentNode) {
        super(owner);
    }

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this.webAudioOutputNode;
    }

    protected override _createSubNode(name: string): Nullable<Promise<AbstractAudioSubNode>> {
        const node = super._createSubNode(name);

        if (node) {
            return node;
        }

        switch (name) {
            case AudioSubNode.Spatial:
                return _CreateSpatialAudioSubNodeAsync(this._owner);
            case AudioSubNode.Stereo:
                return _CreateStereoAudioSubNodeAsync(this._owner);
            default:
                return null;
        }
    }
}
