import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type { IStaticSoundOptions, IStaticSoundPlayOptions, IStaticSoundStopOptions, IStaticSoundStoredOptions } from "../abstractAudio/staticSound";
import { StaticSound } from "../abstractAudio/staticSound";
import type { IStaticSoundBufferOptions } from "../abstractAudio/staticSoundBuffer";
import { StaticSoundBuffer } from "../abstractAudio/staticSoundBuffer";
import type { IStaticSoundInstanceOptions } from "../abstractAudio/staticSoundInstance";
import { _StaticSoundInstance } from "../abstractAudio/staticSoundInstance";
import { _HasSpatialAudioOptions } from "../abstractAudio/subProperties/abstractSpatialAudio";
import type { _SpatialAudio } from "../abstractAudio/subProperties/spatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _CleanUrl, _FileExtensionRegex } from "../audioUtils";
import { SoundState } from "../soundState";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioOutNode, IWebAudioSuperNode } from "./webAudioNode";

type StaticSoundSourceType = ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[];

/** @internal */
export class _WebAudioStaticSound extends StaticSound implements IWebAudioSuperNode {
    private _buffer: _WebAudioStaticSoundBuffer;
    private _spatial: Nullable<_SpatialWebAudio> = null;
    private readonly _spatialAutoUpdate: boolean = true;
    private readonly _spatialMinUpdateTime: number = 0;
    private _stereo: Nullable<_StereoAudio> = null;

    protected override readonly _options: IStaticSoundStoredOptions;
    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Partial<IStaticSoundOptions>) {
        super(name, engine);

        if (typeof options.spatialAutoUpdate === "boolean") {
            this._spatialAutoUpdate = options.spatialAutoUpdate;
        }

        if (typeof options.spatialMinUpdateTime === "number") {
            this._spatialMinUpdateTime = options.spatialMinUpdateTime;
        }

        this._options = {
            autoplay: options.autoplay ?? false,
            duration: options.duration ?? 0,
            loop: options.loop ?? false,
            loopEnd: options.loopEnd ?? 0,
            loopStart: options.loopStart ?? 0,
            maxInstances: options.maxInstances ?? Infinity,
            pitch: options.pitch ?? 0,
            playbackRate: options.playbackRate ?? 1,
            startOffset: options.startOffset ?? 0,
        };

        this._subGraph = new _WebAudioStaticSound._SubGraph(this);
    }

    /** @internal */
    public async init(source: StaticSoundSourceType, options: Partial<IStaticSoundOptions>): Promise<void> {
        this.audioContext = this.engine.audioContext;

        if (source instanceof _WebAudioStaticSoundBuffer) {
            this._buffer = source as _WebAudioStaticSoundBuffer;
        } else if (typeof source === "string" || Array.isArray(source) || source instanceof ArrayBuffer || source instanceof AudioBuffer) {
            this._buffer = (await this.engine.createSoundBufferAsync(source, options)) as _WebAudioStaticSoundBuffer;
        }

        if (options.outBus) {
            this.outBus = options.outBus;
        } else {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.init(options);

        if (_HasSpatialAudioOptions(options)) {
            this._initSpatialProperty();
        }

        if (options.autoplay) {
            this.play();
        }

        this.engine.addNode(this);
    }

    /** @internal */
    public get buffer(): _WebAudioStaticSoundBuffer {
        return this._buffer;
    }

    /** @internal */
    public get inNode() {
        return this._subGraph.inNode;
    }

    /** @internal */
    public get outNode() {
        return this._subGraph.outNode;
    }

    /** @internal */
    public override get spatial(): _SpatialAudio {
        if (this._spatial) {
            return this._spatial;
        }
        return this._initSpatialProperty();
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._spatial?.dispose();
        this._spatial = null;

        this._stereo = null;

        this._subGraph.dispose();

        this.engine.removeNode(this);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioStaticSound";
    }

    protected _createInstance(): _WebAudioStaticSoundInstance {
        return new _WebAudioStaticSoundInstance(this, this._options);
    }

    protected override _connect(node: IWebAudioInNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the subgraph.
        if (node.inNode) {
            this.outNode?.connect(node.inNode);
        }

        return true;
    }

    protected override _disconnect(node: IWebAudioInNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node.inNode) {
            this.outNode?.disconnect(node.inNode);
        }

        return true;
    }

    private _initSpatialProperty(): _SpatialAudio {
        if (!this._spatial) {
            this._spatial = new _SpatialWebAudio(this._subGraph, this._spatialAutoUpdate, this._spatialMinUpdateTime);
        }

        return this._spatial;
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: _WebAudioStaticSound;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }
    };
}

/** @internal */
export class _WebAudioStaticSoundBuffer extends StaticSoundBuffer {
    /** @internal */
    public audioBuffer: AudioBuffer;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);
    }

    public async init(source: StaticSoundSourceType, options: Partial<IStaticSoundBufferOptions>): Promise<void> {
        if (source instanceof AudioBuffer) {
            this.audioBuffer = source;
        } else if (typeof source === "string") {
            await this._initFromUrl(source);
        } else if (Array.isArray(source)) {
            await this._initFromUrls(source, options.skipCodecCheck ?? false);
        } else if (source instanceof ArrayBuffer) {
            await this._initFromArrayBuffer(source);
        }
    }

    /** @internal */
    public get channelCount(): number {
        return this.audioBuffer.numberOfChannels;
    }

    /** @internal */
    public get duration(): number {
        return this.audioBuffer.duration;
    }

    /** @internal */
    public get length(): number {
        return this.audioBuffer.length;
    }

    /** @internal */
    public get sampleRate(): number {
        return this.audioBuffer.sampleRate;
    }

    private async _initFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
        this.audioBuffer = await this.engine.audioContext.decodeAudioData(arrayBuffer);
    }

    private async _initFromUrl(url: string): Promise<void> {
        url = _CleanUrl(url);
        await this._initFromArrayBuffer(await (await fetch(url)).arrayBuffer());
    }

    private async _initFromUrls(urls: string[], skipCodecCheck: boolean): Promise<void> {
        for (const url of urls) {
            if (skipCodecCheck) {
                await this._initFromUrl(url);
            } else {
                const matches = url.match(_FileExtensionRegex);
                const format = matches?.at(1);
                if (format && this.engine.isFormatValid(format)) {
                    try {
                        await this._initFromUrl(url);
                    } catch (e) {
                        if (format && 0 < format.length) {
                            this.engine.flagInvalidFormat(format);
                        }
                    }
                }
            }

            if (this.audioBuffer) {
                break;
            }
        }
    }
}

/** @internal */
class _WebAudioStaticSoundInstance extends _StaticSoundInstance implements IWebAudioOutNode {
    private _enginePlayTime: number = 0;
    private _enginePauseTime: number = 0;
    private _sourceNode: Nullable<AudioBufferSourceNode> = null;
    private _volumeNode: GainNode;

    protected override readonly _options: IStaticSoundInstanceOptions;
    protected override _sound: _WebAudioStaticSound;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    public constructor(sound: _WebAudioStaticSound, options: IStaticSoundInstanceOptions) {
        super(sound);

        this._options = options;

        this._volumeNode = new GainNode(sound.audioContext);
        this._initSourceNode();
    }

    /** @internal */
    public get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._enginePlayTime;
        return this._enginePauseTime + timeSinceLastStart + this._options.startOffset;
    }

    public set currentTime(value: number) {
        const restart = this._state === SoundState.Starting || this._state === SoundState.Started;

        if (restart) {
            this.stop();
            this._deinitSourceNode();
        }

        this._options.startOffset = value;

        if (restart) {
            this.play();
        }
    }

    public get outNode(): Nullable<AudioNode> {
        return this._volumeNode;
    }

    /** @internal */
    public set pitch(value: number) {
        this._options.pitch = value;
        if (this._sourceNode) {
            this.engine._setAudioParam(this._sourceNode.detune, value);
        }
    }

    /** @internal */
    public set playbackRate(value: number) {
        this._options.playbackRate = value;
        if (this._sourceNode) {
            this.engine._setAudioParam(this._sourceNode.playbackRate, value);
        }
    }

    /** @internal */
    public get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._enginePlayTime;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._sourceNode = null;

        this.stop();

        this._deinitSourceNode();

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioStaticSoundInstance";
    }

    /** @internal */
    public play(options: Partial<IStaticSoundPlayOptions> = {}): void {
        if (this._state === SoundState.Started) {
            return;
        }

        if (options.duration !== undefined) {
            this._options.duration = options.duration;
        }
        if (options.loop !== undefined) {
            this._options.loop = options.loop;
        }
        if (options.loopStart !== undefined) {
            this._options.loopStart = options.loopStart;
        }
        if (options.loopEnd !== undefined) {
            this._options.loopEnd = options.loopEnd;
        }
        if (options.pitch !== undefined) {
            this._options.pitch = options.pitch;
        }
        if (options.playbackRate !== undefined) {
            this._options.playbackRate = options.playbackRate;
        }
        if (options.startOffset !== undefined) {
            this._options.startOffset = options.startOffset;
        }

        let startOffset = this._options.startOffset;

        if (this._state === SoundState.Paused) {
            startOffset += this.currentTime;
            startOffset %= this._sound.buffer.duration;
        }

        this._enginePlayTime = this.engine.currentTime + (options.waitTime ?? 0);

        this._volumeNode.gain.value = options.volume ?? 1;

        this._initSourceNode();

        if (this.engine.state === "running") {
            this._setState(SoundState.Started);
            this._sourceNode?.start(this._enginePlayTime, startOffset, this._options.duration > 0 ? this._options.duration : undefined);
        } else if (this._options.loop) {
            this._setState(SoundState.Starting);
            this.engine.stateChangedObservable.add(this._onEngineStateChanged);
        }
    }

    /** @internal */
    public pause(): void {
        if (this._state === SoundState.Paused) {
            return;
        }

        this._setState(SoundState.Paused);
        this._enginePauseTime += this.engine.currentTime - this._enginePlayTime;

        this._sourceNode?.stop();
        this._deinitSourceNode();
    }

    /** @internal */
    public resume(): void {
        if (this._state === SoundState.Paused) {
            this.play();
        }
    }

    /** @internal */
    public stop(options: Partial<IStaticSoundStopOptions> = {}): void {
        if (this._state === SoundState.Stopped) {
            return;
        }

        this._setState(SoundState.Stopped);

        const engineStopTime = this.engine.currentTime + (options.waitTime ?? 0);
        this._sourceNode?.stop(engineStopTime);

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    protected override _connect(node: AbstractAudioNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the sound's subgraph.
        if (node instanceof _WebAudioStaticSound && node.inNode) {
            this.outNode?.connect(node.inNode);
        }

        return true;
    }

    protected override _disconnect(node: AbstractAudioNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node instanceof _WebAudioStaticSound && node.inNode) {
            this.outNode?.disconnect(node.inNode);
        }

        return true;
    }

    protected _onEnded = () => {
        this._enginePlayTime = 0;

        this.onEndedObservable.notifyObservers(this);
        this._deinitSourceNode();
    };

    private _deinitSourceNode(): void {
        if (!this._sourceNode) {
            return;
        }

        if (!this._disconnect(this._sound)) {
            throw new Error("Disconnect failed");
        }

        this._sourceNode.disconnect(this._volumeNode);
        this._sourceNode.removeEventListener("ended", this._onEnded);

        this._sourceNode = null;
    }

    private _initSourceNode(): void {
        if (!this._sourceNode) {
            this._sourceNode = new AudioBufferSourceNode(this._sound.audioContext, { buffer: this._sound.buffer.audioBuffer });

            this._sourceNode.addEventListener("ended", this._onEnded, { once: true });
            this._sourceNode.connect(this._volumeNode);

            if (!this._connect(this._sound)) {
                throw new Error("Connect failed");
            }
        }

        const node = this._sourceNode;
        node.detune.value = this._options.pitch;
        node.loop = this._options.loop;
        node.loopEnd = this._options.loopEnd;
        node.loopStart = this._options.loopStart;
        node.playbackRate.value = this._options.playbackRate;
    }

    private _onEngineStateChanged = () => {
        if (this.engine.state !== "running") {
            return;
        }

        if (this._options.loop && this.state === SoundState.Starting) {
            this.play();
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    };
}
