import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../../abstractAudio/abstractAudioNode";
import type { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import { _GetSpatialAudioSubNode } from "../../abstractAudio/subNodes/spatialAudioSubNode";
import { _GetStereoAudioSubNode } from "../../abstractAudio/subNodes/stereoAudioSubNode";
import type { IVolumeAudioOptions } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import { _GetVolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import type { ISpatialAudioOptions } from "../../abstractAudio/subProperties/abstractSpatialAudio";
import { _HasSpatialAudioOptions } from "../../abstractAudio/subProperties/abstractSpatialAudio";
import type { IStereoAudioOptions } from "../../abstractAudio/subProperties/abstractStereoAudio";
import { _HasStereoAudioOptions } from "../../abstractAudio/subProperties/abstractStereoAudio";
import type { IWebAudioOutNode, IWebAudioSubNode } from "../webAudioNode";
import type { _SpatialWebAudioSubNode } from "./spatialWebAudioSubNode";
import { _CreateSpatialAudioSubNodeAsync } from "./spatialWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync, type _StereoWebAudioSubNode } from "./stereoWebAudioSubNode";
import type { _VolumeWebAudioSubNode } from "./volumeWebAudioSubNode";
import { _WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export interface IWebAudioBusAndSoundSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBusAndSoundSubGraph extends _WebAudioBaseSubGraph {
    protected abstract readonly _upstreamNodes: Nullable<Set<AbstractAudioNode>>;

    protected _inNode: Nullable<AudioNode> = null;

    /** @internal */
    public override async init(options: Partial<IWebAudioBusAndSoundSubGraphOptions>): Promise<void> {
        super.init(options);

        let hasSpatialOptions = false;
        let hasStereoOptions = false;

        if ((hasSpatialOptions = _HasSpatialAudioOptions(options))) {
            this._createAndAddSubNode(AudioSubNode.SPATIAL);
        }
        if ((hasStereoOptions = _HasStereoAudioOptions(options))) {
            this._createAndAddSubNode(AudioSubNode.STEREO);
        }

        await this._createSubNodePromisesResolved();

        if (hasSpatialOptions) {
            _GetSpatialAudioSubNode(this)?.setOptions(options);
        }
        if (hasStereoOptions) {
            _GetStereoAudioSubNode(this)?.setOptions(options);
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
            case AudioSubNode.SPATIAL:
                return _CreateSpatialAudioSubNodeAsync(this._owner.engine);
            case AudioSubNode.STEREO:
                return _CreateStereoAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected override _onSubNodesChanged(): void {
        const spatialNode = _GetSpatialAudioSubNode(this);
        const stereoNode = _GetStereoAudioSubNode(this);
        const volumeNode = _GetVolumeAudioSubNode(this);

        if (spatialNode && spatialNode.getClassName() !== "_SpatialWebAudioSubNode") {
            throw new Error("Not a WebAudio subnode.");
        }
        if (stereoNode && stereoNode.getClassName() !== "_StereoWebAudioSubNode") {
            throw new Error("Not a WebAudio subnode.");
        }
        if (volumeNode && volumeNode.getClassName() !== "_VolumeWebAudioSubNode") {
            throw new Error("Not a WebAudio subnode.");
        }

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
            inSubNode = spatialNode as _SpatialWebAudioSubNode;
        } else if (stereoNode) {
            inSubNode = stereoNode as _StereoWebAudioSubNode;
        } else if (volumeNode) {
            inSubNode = volumeNode as _VolumeWebAudioSubNode;
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
