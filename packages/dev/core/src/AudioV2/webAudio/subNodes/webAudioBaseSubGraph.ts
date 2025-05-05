import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../../abstractAudio/abstractAudioNode";
import { _AbstractAudioSubGraph } from "../../abstractAudio/subNodes/abstractAudioSubGraph";
import type { _AbstractAudioSubNode } from "../../abstractAudio/subNodes/abstractAudioSubNode";
import { _GetAudioAnalyzerSubNode } from "../../abstractAudio/subNodes/audioAnalyzerSubNode";
import { AudioSubNode } from "../../abstractAudio/subNodes/audioSubNode";
import type { IVolumeAudioOptions } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import { _GetVolumeAudioSubNode } from "../../abstractAudio/subNodes/volumeAudioSubNode";
import type { IAudioAnalyzerOptions } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
import { _HasAudioAnalyzerOptions } from "../../abstractAudio/subProperties/abstractAudioAnalyzer";
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
    protected _outputNode: Nullable<AudioNode> = null;

    /** @internal */
    public constructor(owner: IWebAudioSuperNode) {
        super();

        this._owner = owner;
    }

    /** @internal */
    public async initAsync(options: Partial<IWebAudioBaseSubGraphOptions>): Promise<void> {
        const hasAnalyzerOptions = _HasAudioAnalyzerOptions(options);

        if (hasAnalyzerOptions) {
            await this.createAndAddSubNodeAsync(AudioSubNode.ANALYZER);
        }

        await this.createAndAddSubNodeAsync(AudioSubNode.VOLUME);

        await this._createSubNodePromisesResolvedAsync();

        if (hasAnalyzerOptions) {
            const analyzerNode = _GetAudioAnalyzerSubNode(this);
            if (!analyzerNode) {
                throw new Error("No analyzer subnode.");
            }

            analyzerNode.setOptions(options);
        }

        const volumeNode = _GetVolumeAudioSubNode(this);
        if (!volumeNode) {
            throw new Error("No volume subnode.");
        }

        volumeNode.setOptions(options);

        if (volumeNode.getClassName() !== "_VolumeWebAudioSubNode") {
            throw new Error("Not a WebAudio subnode.");
        }

        this._outputNode = (volumeNode as _VolumeWebAudioSubNode).node;

        // Connect the new wrapped WebAudio node to the wrapped downstream WebAudio nodes.
        // The wrapper nodes are unaware of this change.
        if (this._outputNode && this._downstreamNodes) {
            const it = this._downstreamNodes.values();
            for (let next = it.next(); !next.done; next = it.next()) {
                const inNode = (next.value as IWebAudioInNode)._inNode;
                if (inNode) {
                    this._outputNode.connect(inNode);
                }
            }
        }
    }

    protected abstract readonly _downstreamNodes: Nullable<Set<AbstractAudioNode>>;

    /** @internal */
    public get _inNode(): Nullable<AudioNode> {
        return this._outputNode;
    }

    /** @internal */
    public get _outNode(): Nullable<AudioNode> {
        return this._outputNode;
    }

    // Function is async, but throws synchronously. Avoiding breaking changes.
    // eslint-disable-next-line @typescript-eslint/promise-function-async
    protected _createSubNode(name: string): Promise<_AbstractAudioSubNode> {
        switch (name) {
            case AudioSubNode.ANALYZER:
                return _CreateAudioAnalyzerSubNodeAsync(this._owner.engine);
            case AudioSubNode.VOLUME:
                return _CreateVolumeAudioSubNodeAsync(this._owner.engine);
            default:
                throw new Error(`Unknown subnode name: ${name}`);
        }
    }

    protected _onSubNodesChanged(): void {
        const analyzerNode = _GetAudioAnalyzerSubNode(this);
        const volumeNode = _GetVolumeAudioSubNode(this);

        if (analyzerNode && volumeNode) {
            volumeNode.connect(analyzerNode);
        }
    }
}
