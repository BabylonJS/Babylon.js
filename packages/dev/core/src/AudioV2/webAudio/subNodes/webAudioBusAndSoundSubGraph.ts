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
import type { _StereoWebAudioSubNode } from "./stereoWebAudioSubNode";
import { _CreateStereoAudioSubNodeAsync } from "./stereoWebAudioSubNode";
import type { _VolumeWebAudioSubNode } from "./volumeWebAudioSubNode";
import { _WebAudioBaseSubGraph } from "./webAudioBaseSubGraph";

/** @internal */
export interface IWebAudioBusAndSoundSubGraphOptions extends ISpatialAudioOptions, IStereoAudioOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBusAndSoundSubGraph extends _WebAudioBaseSubGraph {
    private _rootNode: Nullable<GainNode> = null;
    protected abstract readonly _upstreamNodes: Nullable<Set<AbstractAudioNode>>;

    protected _inputNode: Nullable<AudioNode> = null;

    /** @internal */
    public override async initAsync(options: Partial<IWebAudioBusAndSoundSubGraphOptions>): Promise<void> {
        await super.initAsync(options);

        let hasSpatialOptions = false;
        let hasStereoOptions = false;

        if ((hasSpatialOptions = _HasSpatialAudioOptions(options))) {
            await this.createAndAddSubNodeAsync(AudioSubNode.SPATIAL);
        }
        if ((hasStereoOptions = _HasStereoAudioOptions(options))) {
            await this.createAndAddSubNodeAsync(AudioSubNode.STEREO);
        }

        await this._createSubNodePromisesResolvedAsync();

        if (hasSpatialOptions) {
            _GetSpatialAudioSubNode(this)?.setOptions(options);
        }
        if (hasStereoOptions) {
            _GetStereoAudioSubNode(this)?.setOptions(options);
        }
    }

    /** @internal */
    public override get _inNode(): Nullable<AudioNode> {
        return this._inputNode;
    }

    // eslint-disable-next-line @typescript-eslint/promise-function-async
    protected override _createSubNode(name: string): Promise<_AbstractAudioSubNode> {
        try {
            const node = super._createSubNode(name);
            return node;
        } catch (e) {}

        switch (name) {
            case AudioSubNode.SPATIAL:
                return _CreateSpatialAudioSubNodeAsync(this._owner.engine);
            case AudioSubNode.STEREO:
                return _CreateStereoAudioSubNodeAsync(this._owner.engine);
            default:
                throw new Error(`Unknown subnode name: ${name}`);
        }
    }

    protected override _onSubNodesChanged(): void {
        super._onSubNodesChanged();

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

            if (volumeNode) {
                spatialNode.connect(volumeNode);
            }
        }

        if (stereoNode) {
            stereoNode.disconnectAll();

            if (volumeNode) {
                stereoNode.connect(volumeNode);
            }
        }

        if (spatialNode && stereoNode) {
            this._rootNode = new GainNode(this._owner.engine._audioContext);
            this._rootNode.connect((spatialNode as _SpatialWebAudioSubNode)._outNode);
            this._rootNode.connect((stereoNode as _StereoWebAudioSubNode)._outNode);
        } else {
            this._rootNode?.disconnect();
            this._rootNode = null;
        }

        let inSubNode: Nullable<IWebAudioSubNode> = null;

        let inNode: Nullable<AudioNode> = null;

        if (this._rootNode) {
            inNode = this._rootNode;
        } else {
            if (spatialNode) {
                inSubNode = spatialNode as _SpatialWebAudioSubNode;
            } else if (stereoNode) {
                inSubNode = stereoNode as _StereoWebAudioSubNode;
            } else if (volumeNode) {
                inSubNode = volumeNode as _VolumeWebAudioSubNode;
            }

            inNode = inSubNode?.node ?? null;
        }

        if (this._inputNode !== inNode) {
            // Disconnect the wrapped upstream WebAudio nodes from the old wrapped WebAudio node.
            // The wrapper nodes are unaware of this change.
            if (this._inputNode && this._upstreamNodes) {
                const it = this._upstreamNodes.values();
                for (let next = it.next(); !next.done; next = it.next()) {
                    (next.value as IWebAudioOutNode)._outNode?.disconnect(this._inputNode);
                }
            }

            this._inputNode = inNode;

            // Connect the wrapped upstream WebAudio nodes to the new wrapped WebAudio node.
            // The wrapper nodes are unaware of this change.
            if (inNode && this._upstreamNodes) {
                const it = this._upstreamNodes.values();
                for (let next = it.next(); !next.done; next = it.next()) {
                    (next.value as IWebAudioOutNode)._outNode?.connect(inNode);
                }
            }
        }
    }
}
