import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type { ISoundSourceOptions } from "../abstractAudio/abstractSoundSource";
import { AbstractSoundSource } from "../abstractAudio/abstractSoundSource";
import type { AbstractSpatialAudio } from "../abstractAudio/subProperties/abstractSpatialAudio";
import { _HasSpatialAudioOptions } from "../abstractAudio/subProperties/abstractSpatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode } from "./webAudioNode";

/** @internal */
export class _WebAudioSoundSource extends AbstractSoundSource {
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;
    protected _webAudioNode: Nullable<AudioNode> = null;

    /** @internal */
    public _audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(name: string, webAudioNode: AudioNode, engine: _WebAudioEngine, options: Partial<ISoundSourceOptions>) {
        super(name, engine, options);

        this._audioContext = this.engine._audioContext;
        this._webAudioNode = webAudioNode;

        this._subGraph = new _WebAudioSoundSource._SubGraph(this);
    }

    /** @internal */
    public async _initAsync(options: Partial<ISoundSourceOptions>): Promise<void> {
        if (options.outBus) {
            this.outBus = options.outBus;
        } else if (options.outBusAutoDefault !== false) {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.initAsync(options);

        if (_HasSpatialAudioOptions(options)) {
            this._initSpatialProperty();
        }

        this.engine._addNode(this);
    }

    /** @internal */
    public get _inNode() {
        return this._webAudioNode;
    }

    /** @internal */
    public get _outNode() {
        return this._subGraph._outNode;
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        if (this._webAudioNode) {
            if (this._webAudioNode instanceof MediaStreamAudioSourceNode) {
                for (const track of this._webAudioNode.mediaStream.getTracks()) {
                    track.stop();
                }
            }

            this._webAudioNode.disconnect();
            this._webAudioNode = null;
        }

        this._stereo = null;

        this._subGraph.dispose();

        this.engine._removeNode(this);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioSoundSource";
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node._inNode) {
            this._outNode?.connect(node._inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node._inNode) {
            this._outNode?.disconnect(node._inNode);
        }

        return true;
    }

    protected override _createSpatialProperty(autoUpdate: boolean, minUpdateTime: number): AbstractSpatialAudio {
        return new _SpatialWebAudio(this._subGraph, autoUpdate, minUpdateTime);
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioSoundSource;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }

        protected override _onSubNodesChanged(): void {
            super._onSubNodesChanged();

            this._owner._inNode?.disconnect();

            if (this._owner._subGraph._inNode) {
                this._owner._inNode?.connect(this._owner._subGraph._inNode);
            }
        }
    };
}
