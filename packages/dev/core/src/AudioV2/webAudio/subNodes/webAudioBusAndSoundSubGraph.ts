import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../../abstractAudio/abstractAudioNode";
import type { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { _AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import type { _SpatialAudioSubNode } from "../../abstractAudio/subNodes/spatialAudioSubNode";
import type { _StereoAudioSubNode } from "../../abstractAudio/subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import { _HasSpatialAudioOptions, type ISpatialAudioOptions } from "../../abstractAudio/subProperties/abstractSpatialAudio";
import { _HasStereoAudioOptions, type IStereoAudioOptions } from "../../abstractAudio/subProperties/abstractStereoAudio";
import type { IWebAudioOutNode, IWebAudioSubNode } from "../webAudioNode";
import { _CreateSpatialAudioSubNodeAsync } from "./spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "./stereoWebAudioSubNode";
import { _WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export interface IWebAudioBusAndSoundSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBusAndSoundSubGraph extends _WebAudioBaseSubGraph {
    protected abstract get _upstreamNodes(): Nullable<Set<AbstractAudioNode>>;

    protected _inNode: Nullable<AudioNode> = null;

    /** @internal */
    public override async init(options: Partial<IWebAudioBusAndSoundSubGraphOptions>): Promise<void> {
        super.init(options);

        let hasSpatialOptions = false;
        let hasStereoOptions = false;

        if ((hasSpatialOptions = _HasSpatialAudioOptions(options))) {
            this._createAndAddSubNode(_AudioSubNode.SPATIAL);
        }
        if ((hasStereoOptions = _HasStereoAudioOptions(options))) {
            this._createAndAddSubNode(_AudioSubNode.STEREO);
        }

        await this._createSubNodePromisesResolved();

        if (hasSpatialOptions) {
            this.getSubNode<_SpatialAudioSubNode>(_AudioSubNode.SPATIAL)?.setOptions(options);
        }
        if (hasStereoOptions) {
            this.getSubNode<_StereoAudioSubNode>(_AudioSubNode.STEREO)?.setOptions(options);
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
            case _AudioSubNode.SPATIAL:
                return _CreateSpatialAudioSubNodeAsync(this._owner.engine);
            case _AudioSubNode.STEREO:
                return _CreateStereoAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected override _onSubNodesChanged(): void {
        const spatialNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.SPATIAL);
        const stereoNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.STEREO);
        const volumeNode = this.getSubNode<IWebAudioSubNode>(_AudioSubNode.VOLUME);

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
