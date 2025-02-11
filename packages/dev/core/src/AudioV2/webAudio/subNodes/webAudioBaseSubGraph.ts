import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../../abstractAudio/abstractAudioNode";
import { _AbstractAudioSubGraph } from "../../abstractAudio/subNodes/abstractAudioSubGraph";
import type { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { _GetAudioAnalyzerSubNode, type _AudioAnalyzerSubNode } from "../../abstractAudio/subNodes/audioAnalyzerSubNode";
import { AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import { _GetVolumeAudioSubNode, type _VolumeAudioSubNode, type IVolumeAudioOptions } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import { _HasAudioAnalyzerOptions, type IAudioAnalyzerOptions } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import type { IWebAudioInNode, IWebAudioSuperNode } from "../webAudioNode";
import type { _VolumeWebAudioSubNode } from "./volumeWebAudioSubNode";
import { _CreateVolumeAudioSubNodeAsync } from "./volumeWebAudioSubNode";
import { _CreateAudioAnalyzerSubNodeAsync } from "./webAudioAnalyzerSubNode";

/**
 * Options for creating a WebAudioBaseSubGraph.
 */
export interface IWebAudioBaseSubGraphOptions extends IAudioAnalyzerOptions, IVolumeAudioOptions {}

/** @internal */
export abstract class _WebAudioBaseSubGraph extends _AbstractAudioSubGraph {
    protected _owner: IWebAudioSuperNode;
    protected _outNode: Nullable<AudioNode> = null;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode) {
        super();

        this._owner = owner;
    }

    /** @internal */
    public async init(options: Partial<IWebAudioBaseSubGraphOptions>): Promise<void> {
        const volumeNode = await this.createAndAddSubNode<_VolumeAudioSubNode>(AudioSubNode.VOLUME);
        volumeNode.setOptions(options);

        if (volumeNode.getClassName() !== "_VolumeWebAudioSubNode") {
            throw new Error("Not a WebAudio subnode.");
        }

        this._outNode = (volumeNode as _VolumeWebAudioSubNode).node;

        // Connect the new wrapped WebAudio node to the wrapped downstream WebAudio nodes.
        // The wrapper nodes are unaware of this change.
        if (this._outNode && this._downstreamNodes) {
            const it = this._downstreamNodes.values();
            for (let next = it.next(); !next.done; next = it.next()) {
                const inNode = (next.value as IWebAudioInNode).inNode;
                if (inNode) {
                    this._outNode.connect(inNode);
                }
            }
        }

        if (_HasAudioAnalyzerOptions(options)) {
            const analyzerNode = await this.createAndAddSubNode<_AudioAnalyzerSubNode>(AudioSubNode.ANALYZER);
            analyzerNode.setOptions(options);
        }
    }

    protected abstract readonly _downstreamNodes: Nullable<Set<AbstractAudioNode>>;

    /** @internal */
    public get inNode(): Nullable<AudioNode> {
        return this._outNode;
    }

    /** @internal */
    public get outNode(): Nullable<AudioNode> {
        return this._outNode;
    }

    protected _createSubNode(name: string): Nullable<Promise<_AbstractAudioSubNode>> {
        switch (name) {
            case AudioSubNode.ANALYZER:
                return _CreateAudioAnalyzerSubNodeAsync(this._owner.engine);
            case AudioSubNode.VOLUME:
                return _CreateVolumeAudioSubNodeAsync(this._owner.engine);
            default:
                return null;
        }
    }

    protected override _onSubNodesChanged(): void {
        super._onSubNodesChanged();

        const analyzerNode = _GetAudioAnalyzerSubNode(this);
        const volumeNode = _GetVolumeAudioSubNode(this);

        if (analyzerNode && volumeNode) {
            volumeNode.connect(analyzerNode);
        }
    }
}
