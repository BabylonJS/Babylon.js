import { type Nullable } from "../../types";
import { type AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import { type ISoundSourceOptions, AbstractSoundSource } from "../abstractAudio/abstractSoundSource";
import { type AbstractSpatialAudio, _HasSpatialAudioOptions } from "../abstractAudio/subProperties/abstractSpatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import { type _WebAudioEngine } from "./webAudioEngine";
import { type IWebAudioInNode } from "./webAudioNode";

/** @internal */
export class _WebAudioSoundSource extends AbstractSoundSource {
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;
    protected _webAudioNode: Nullable<AudioNode> = null;

    private _mediaStreamAudioElement: Nullable<HTMLAudioElement> = null;
    private _stopMediaStreamTracksOnDispose = false;

    /** @internal */
    public _audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(name: string, webAudioNode: AudioNode, engine: _WebAudioEngine, options: Partial<ISoundSourceOptions>) {
        super(name, engine, options);

        this._audioContext = this.engine._audioContext;
        this._webAudioNode = webAudioNode;

        this._stopMediaStreamTracksOnDispose = options.stopMediaStreamTracksOnDispose === true;

        if (options.mediaStreamSinkEnabled !== false && webAudioNode instanceof MediaStreamAudioSourceNode) {
            this._attachMediaStreamSink(webAudioNode.mediaStream);
        }

        this._subGraph = new _WebAudioSoundSource._SubGraph(this);
    }

    /**
     * Keeps a `MediaStream`-backed source audible by attaching the stream to a hidden, muted audio element.
     *
     * Some browsers (notably Chromium) only deliver samples from a `MediaStreamAudioSourceNode` while its `MediaStream`
     * is also being pulled by an `HTMLMediaElement`; without this, a remote WebRTC stream routed through Web Audio is
     * silent and cannot be spatialized. The element is muted so it does not add a second, non-spatial playback.
     * @param mediaStream - the `MediaStream` backing this sound source
     */
    private _attachMediaStreamSink(mediaStream: MediaStream): void {
        if (typeof Audio === "undefined") {
            return;
        }

        const mediaElement = new Audio();
        mediaElement.muted = true;
        mediaElement.srcObject = mediaStream;
        this._mediaStreamAudioElement = mediaElement;

        void this._startMediaStreamSinkAsync(mediaElement);
    }

    /**
     * Starts best-effort playback of the muted keep-alive media element.
     * @param mediaElement - the muted media element pulling the source `MediaStream`
     */
    private async _startMediaStreamSinkAsync(mediaElement: HTMLAudioElement): Promise<void> {
        try {
            // Muted media is allowed to autoplay without a user gesture.
            await mediaElement.play();
        } catch {
            // A rejected play() only means this browser-specific keep-alive is unavailable, which is non-fatal.
        }
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

        if (this._mediaStreamAudioElement) {
            this._mediaStreamAudioElement.pause();
            this._mediaStreamAudioElement.srcObject = null;
            this._mediaStreamAudioElement = null;
        }

        if (this._webAudioNode) {
            if (this._stopMediaStreamTracksOnDispose && this._webAudioNode instanceof MediaStreamAudioSourceNode) {
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
