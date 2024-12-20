import type { Nullable } from "../../../../types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import type { _AbstractAudioSubNode } from "../../abstractAudioSubNode";
import { _AudioSubNode } from "../../subNodes/audioSubNode";
import type { _SpatialAudioSubNode, ISpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import { _hasSpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import type { _StereoAudioSubNode, IStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import { _hasStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "../subNodes/spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "../subNodes/stereoWebAudioSubNode";
import type { IWebAudioOutNode, IWebAudioSubNode } from "../webAudioNode";
import { _WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export interface IWebAudioBusAndSoundSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBusAndSoundSubGraph extends _WebAudioBaseSubGraph {
    protected abstract get _upstreamNodes(): Nullable<Set<AbstractAudioNode>>;

    protected _inNode: Nullable<AudioNode> = null;

    /** @internal */
    public override async init(options: Nullable<IWebAudioBusAndSoundSubGraphOptions>): Promise<void> {
        super.init(options);

        let hasSpatialOptions = false;
        let hasStereoOptions = false;

        if (options) {
            if ((hasSpatialOptions = _hasSpatialAudioOptions(options))) {
                this._createAndAddSubNode(_AudioSubNode.Spatial);
            }
            if ((hasStereoOptions = _hasStereoAudioOptions(options))) {
                this._createAndAddSubNode(_AudioSubNode.Stereo);
            }
        }

        await this._createSubNodePromisesResolved();

        if (hasSpatialOptions) {
            this.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.Spatial)?.setOptions(options);
        }
        if (hasStereoOptions) {
            this.getSubNode<_StereoAudioSubNode>(_AudioSubNode.Stereo)?.setOptions(options);
        }
    }

    /** @internal */
    public override get inNode(): Nullable<AudioNode> {
        return this._inNode;
    }

    protected override _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>> {
        const node = super._createSubNode(name);

        if (node) {
            return node;
        }

        switch (name) {
            case _AudioSubNode.Spatial:
                return _CreateSpatialAudioSubNodeAsync(this._owner.engine);
            case _AudioSubNode.Stereo:
                return _CreateStereoAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected override _onSubNodesChanged(): void {
        super._onSubNodesChanged();

        const stereoNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Stereo);
        const volumeNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Volume);

        if (stereoNode) {
            if (volumeNode) {
                stereoNode.connect(volumeNode);
            }
        }

        let inSubNode: Nullable<IWebAudioSubNode> = null;
        if (stereoNode) {
            inSubNode = stereoNode;
        } else if (volumeNode) {
            inSubNode = volumeNode;
        }

        const inNode = inSubNode?.node ?? null;

        if (this._inNode !== inNode) {
            // Disconnect the wrapped upstream WebAudio nodes from the old wrapped WebAudio node.
            // The wrapper nodes are unaware of this change.
            if (this._inNode && this._upstreamNodes) {
                const it = this._upstreamNodes.values();
                for (let next = it.next(); !next.done; next = it.next()) {
                    (next.value as IWebAudioOutNode).outNode?.disconnect(this._inNode);
                }
            }

            this._inNode = inNode;

            // Connect the wrapped upstream WebAudio nodes to the new wrapped WebAudio node.
            // The wrapper nodes are unaware of this change.
            if (inNode && this._upstreamNodes) {
                const it = this._upstreamNodes.values();
                for (let next = it.next(); !next.done; next = it.next()) {
                    (next.value as IWebAudioOutNode).outNode?.connect(inNode);
                }
            }
        }
    }
}
