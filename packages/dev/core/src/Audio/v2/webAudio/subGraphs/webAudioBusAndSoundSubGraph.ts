import type { Nullable } from "../../../../types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import type { AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { AudioSubNode } from "../../subNodes/audioSubNode";
import type { ISpatialAudioOptions, SpatialAudioSubNode } from "../../subNodes/spatialAudioSubNode";
import { hasSpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import type { IStereoAudioOptions, StereoAudioSubNode } from "../../subNodes/stereoAudioSubNode";
import { hasStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "../subNodes/spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "../subNodes/stereoWebAudioSubNode";
import type { IWebAudioOutputNode, IWebAudioSubNode } from "../webAudioNode";
import { WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export interface IWebAudioBusAndSoundSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class WebAudioBusAndSoundSubGraph extends WebAudioBaseSubGraph {
    protected abstract get _connectedUpstreamNodes(): Nullable<Set<AbstractAudioNode>>;

    protected _webAudioInputNode: Nullable<AudioNode> = null;

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
            this.getSubNode<SpatialAudioSubNode>(AudioSubNode.Spatial)?.setOptions(options);
        }
        if (hasStereoOptions) {
            this.getSubNode<StereoAudioSubNode>(AudioSubNode.Stereo)?.setOptions(options);
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
                return _CreateSpatialAudioSubNodeAsync(this._owner.engine);
            case AudioSubNode.Stereo:
                return _CreateStereoAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected override _onSubNodesChanged(): void {
        super._onSubNodesChanged();

        const stereoNode = this.getSubNode<IWebAudioSubNode>(AudioSubNode.Stereo);
        const volumeNode = this.getSubNode<IWebAudioSubNode>(AudioSubNode.Volume);

        if (stereoNode) {
            if (volumeNode) {
                stereoNode.connect(volumeNode);
            }
        }

        let inputSubNode: Nullable<IWebAudioSubNode> = null;
        if (stereoNode) {
            inputSubNode = stereoNode;
        } else if (volumeNode) {
            inputSubNode = volumeNode;
        }

        const webAudioInputNode = inputSubNode?.node ?? null;

        if (this._webAudioInputNode !== webAudioInputNode) {
            // Disconnect the wrapped upstream WebAudio nodes from the old wrapped WebAudio node.
            if (this._webAudioInputNode && this._connectedUpstreamNodes) {
                for (const node of this._connectedUpstreamNodes) {
                    (node as IWebAudioOutputNode).webAudioOutputNode?.disconnect(this._webAudioInputNode);
                }
            }

            this._webAudioInputNode = webAudioInputNode;

            // Connect the wrapped upstream WebAudio nodes to the new wrapped WebAudio node.
            if (webAudioInputNode && this._connectedUpstreamNodes) {
                for (const node of this._connectedUpstreamNodes) {
                    (node as IWebAudioOutputNode).webAudioOutputNode?.connect(webAudioInputNode);
                }
            }
        }
    }
}
