import type { Nullable } from "../../../../types";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "../subNodes/spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "../subNodes/stereoWebAudioSubNode";
import type { _VolumeWebAudioSubNode } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioNode } from "../webAudioNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";
import { WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export class WebAudioBusAndSoundSubGraph extends WebAudioBaseSubGraph {
    protected _webAudioInputNode: Nullable<AudioNode> = null;

    /** @internal */
    public constructor(owner: IWebAudioParentNode) {
        super(owner);
    }

    /** @internal */
    public override async init(): Promise<void> {
        super.init();

        this._createAndAddSubNode(AudioSubNode.Spatial);
        this._createAndAddSubNode(AudioSubNode.Stereo);

        await this._createSubNodePromisesResolved();
    }

    /** @internal */
    public override get webAudioInputNode(): Nullable<AudioNode> {
        return this._webAudioInputNode;
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

    protected override _onSubNodesChanged(): void {
        super._onSubNodesChanged();

        let inputSubNode: Nullable<IWebAudioNode> = null;

        const volumeNode = this.getSubNode<_VolumeWebAudioSubNode>(AudioSubNode.Volume);

        if (volumeNode) {
            inputSubNode = volumeNode;
        }

        const webAudioInputNode = inputSubNode?.webAudioInputNode ?? null;

        if (this._webAudioInputNode !== webAudioInputNode) {
            this._webAudioInputNode = webAudioInputNode;
            this._owner.reconnectUpstreamNodes();
        }
    }
}
