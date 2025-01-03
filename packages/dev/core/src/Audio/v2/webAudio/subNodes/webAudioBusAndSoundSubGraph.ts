import type { Nullable } from "../../../../types";
import type { AbstractAudioNode } from "../../abstractAudioNode";
import type { _AbstractAudioSubNode } from "../../subNodes/abstractAudioSubNode";
import { _AudioSubNode } from "../../subNodes/audioSubNode";
import type { _SpatialAudioSubNode, ISpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import { _HasSpatialAudioOptions } from "../../subNodes/spatialAudioSubNode";
import type { _StereoAudioSubNode, IStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import { _HasStereoAudioOptions } from "../../subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../../subNodes/volumeAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "./spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "./stereoWebAudioSubNode";
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
            if ((hasSpatialOptions = _HasSpatialAudioOptions(options))) {
                this._createAndAddSubNode(_AudioSubNode.Spatial);
            }
            if ((hasStereoOptions = _HasStereoAudioOptions(options))) {
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
        const spatialNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Spatial);
        const stereoNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Stereo);
        const volumeNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.Volume);

        if (spatialNode) {
            spatialNode.disconnectAll();

            if (stereoNode) {
                spatialNode.connect(stereoNode);
            } else if (volumeNode) {
                spatialNode.connect(volumeNode);
            }
        }

        if (stereoNode) {
            stereoNode.disconnectAll();

            if (volumeNode) {
                stereoNode.connect(volumeNode);
            }
        }

        let inSubNode: Nullable<IWebAudioSubNode> = null;

        if (spatialNode) {
            inSubNode = spatialNode;
        } else if (stereoNode) {
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
