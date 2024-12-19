import type { Nullable } from "../../../../types";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import { hasSpatialAudioOptions, type ISpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import { hasStereoAudioOptions, type IStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import type { SpatialWebAudioSubNode } from "../subNodes/spatialWebAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "../subNodes/spatialWebAudioSubNode";
import type { StereoWebAudioSubNode } from "../subNodes/stereoWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "../subNodes/stereoWebAudioSubNode";
import type { VolumeWebAudioSubNode } from "../subNodes/volumeWebAudioSubNode";
import type { IWebAudioInputNode } from "../webAudioInputNode";
import type { IWebAudioParentNode } from "../webAudioParentNode";
import { WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export interface IWebAudioBusAndSoundSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export class WebAudioBusAndSoundSubGraph extends WebAudioBaseSubGraph {
    protected _webAudioInputNode: Nullable<AudioNode> = null;

    /** @internal */
    public constructor(owner: IWebAudioParentNode) {
        super(owner);
    }

    /** @internal */
    public override async init(options: Nullable<IWebAudioBusAndSoundSubGraphOptions>): Promise<void> {
        super.init(options);

        let hasSpatialOptions = false;
        let hasStereoOptions = false;

        if (options) {
            if ((hasSpatialOptions = hasSpatialAudioOptions(options))) {
                this._createAndAddSubNode(AudioSubNode.Spatial);
            }
            if ((hasStereoOptions = hasStereoAudioOptions(options))) {
                this._createAndAddSubNode(AudioSubNode.Stereo);
            }
        }

        await this._createSubNodePromisesResolved();

        if (hasSpatialOptions) {
            this.getSubNode<SpatialWebAudioSubNode>(AudioSubNode.Spatial)?.setOptions(options);
        }
        if (hasStereoOptions) {
            this.getSubNode<StereoWebAudioSubNode>(AudioSubNode.Stereo)?.setOptions(options);
        }
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

        const stereoNode = this.getSubNode<StereoWebAudioSubNode>(AudioSubNode.Stereo);
        const volumeNode = this.getSubNode<VolumeWebAudioSubNode>(AudioSubNode.Volume);

        if (stereoNode) {
            if (volumeNode) {
                stereoNode.connect(volumeNode);
            }
        }

        let inputSubNode: Nullable<IWebAudioInputNode> = null;
        if (stereoNode) {
            inputSubNode = stereoNode;
        } else if (volumeNode) {
            inputSubNode = volumeNode;
        }

        const webAudioInputNode = inputSubNode?.webAudioInputNode ?? null;

        if (this._webAudioInputNode !== webAudioInputNode) {
            this._owner.beforeInputNodeChanged();
            this._webAudioInputNode = webAudioInputNode;
            this._owner.afterInputNodeChanged();
        }
    }
}
