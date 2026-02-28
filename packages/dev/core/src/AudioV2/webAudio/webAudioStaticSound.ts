import type { Nullable } from "../../types";
import type { AbstractAudioNode } from "../abstractAudio/abstractAudioNode";
import type { IStaticSoundCloneOptions, IStaticSoundOptions, IStaticSoundPlayOptions, IStaticSoundStopOptions, IStaticSoundStoredOptions } from "../abstractAudio/staticSound";
import { StaticSound } from "../abstractAudio/staticSound";
import type { IStaticSoundBufferCloneOptions, IStaticSoundBufferOptions } from "../abstractAudio/staticSoundBuffer";
import { StaticSoundBuffer } from "../abstractAudio/staticSoundBuffer";
import type { IStaticSoundInstanceOptions } from "../abstractAudio/staticSoundInstance";
import { _StaticSoundInstance } from "../abstractAudio/staticSoundInstance";
import { _HasSpatialAudioOptions, type AbstractSpatialAudio } from "../abstractAudio/subProperties/abstractSpatialAudio";
import { _StereoAudio } from "../abstractAudio/subProperties/stereoAudio";
import { _CleanUrl, _FileExtensionRegex } from "../audioUtils";
import { SoundState } from "../soundState";
import { _WebAudioParameterComponent } from "./components/webAudioParameterComponent";
import { _WebAudioBusAndSoundSubGraph } from "./subNodes/webAudioBusAndSoundSubGraph";
import { _SpatialWebAudio } from "./subProperties/spatialWebAudio";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioOutNode, IWebAudioSuperNode } from "./webAudioNode";

type StaticSoundSourceType = ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[];

/** @internal */
export class _WebAudioStaticSound extends StaticSound implements IWebAudioSuperNode {
    private _buffer: _WebAudioStaticSoundBuffer;
    private _stereo: Nullable<_StereoAudio> = null;

    protected override readonly _options: IStaticSoundStoredOptions;
    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public _audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Partial<IStaticSoundOptions>) {
        super(name, engine, options);

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
    public async _initAsync(source: StaticSoundSourceType, options: Partial<IStaticSoundOptions>): Promise<void> {
        this._audioContext = this.engine._audioContext;

        if (source instanceof _WebAudioStaticSoundBuffer) {
            this._buffer = source;
        } else if (typeof source === "string" || Array.isArray(source) || source instanceof ArrayBuffer || source instanceof AudioBuffer) {
            this._buffer = (await this.engine.createSoundBufferAsync(source, options)) as _WebAudioStaticSoundBuffer;
        }

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

        if (options.autoplay) {
            this.play();
        }

        this.engine._addSound(this);
    }

    /** @internal */
    public get buffer(): _WebAudioStaticSoundBuffer {
        return this._buffer;
    }

    /** @internal */
    public get _inNode() {
        return this._subGraph._inNode;
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
    public override async cloneAsync(options: Nullable<Partial<IStaticSoundCloneOptions>> = null): Promise<StaticSound> {
        const clone = await this.engine.createSoundAsync(this.name, options?.cloneBuffer ? this.buffer.clone() : this.buffer, this._options);

        clone.outBus = options?.outBus ? options.outBus : this.outBus;

        return clone;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._stereo = null;

        this._subGraph.dispose();

        this.engine._removeSound(this);
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

    public _getOptions(): IStaticSoundStoredOptions {
        return this._options;
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
    public _audioBuffer: AudioBuffer;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);
    }

    public async _initAsync(source: StaticSoundSourceType, options: Partial<IStaticSoundBufferOptions>): Promise<void> {
        if (source instanceof AudioBuffer) {
            this._audioBuffer = source;
        } else if (typeof source === "string") {
            await this._initFromUrlAsync(source);
        } else if (Array.isArray(source)) {
            await this._initFromUrlsAsync(source, options.skipCodecCheck ?? false);
        } else if (source instanceof ArrayBuffer) {
            await this._initFromArrayBufferAsync(source);
        }
    }

    /** @internal */
    public get channelCount(): number {
        return this._audioBuffer.numberOfChannels;
    }

    /** @internal */
    public get duration(): number {
        return this._audioBuffer.duration;
    }

    /** @internal */
    public get length(): number {
        return this._audioBuffer.length;
    }

    /** @internal */
    public get sampleRate(): number {
        return this._audioBuffer.sampleRate;
    }

    /** @internal */
    public override clone(options: Nullable<Partial<IStaticSoundBufferCloneOptions>> = null): StaticSoundBuffer {
        const audioBuffer = new AudioBuffer({
            length: this._audioBuffer.length,
            numberOfChannels: this._audioBuffer.numberOfChannels,
            sampleRate: this._audioBuffer.sampleRate,
        });

        for (let i = 0; i < this._audioBuffer.numberOfChannels; i++) {
            audioBuffer.copyToChannel(this._audioBuffer.getChannelData(i), i);
        }

        const buffer = new _WebAudioStaticSoundBuffer(this.engine);
        buffer._audioBuffer = audioBuffer;
        buffer.name = options?.name ? options.name : this.name;

        return buffer;
    }

    private async _initFromArrayBufferAsync(arrayBuffer: ArrayBuffer): Promise<void> {
        this._audioBuffer = await this.engine._audioContext.decodeAudioData(arrayBuffer);
    }

    private async _initFromUrlAsync(url: string): Promise<void> {
        url = _CleanUrl(url);
        await this._initFromArrayBufferAsync(await (await fetch(url)).arrayBuffer());
    }

    private async _initFromUrlsAsync(urls: string[], skipCodecCheck: boolean): Promise<void> {
        for (const url of urls) {
            if (skipCodecCheck) {
                // eslint-disable-next-line no-await-in-loop
                await this._initFromUrlAsync(url);
            } else {
                const matches = url.match(_FileExtensionRegex);
                const format = matches?.at(1);
                if (format && this.engine.isFormatValid(format)) {
                    try {
                        // eslint-disable-next-line no-await-in-loop
                        await this._initFromUrlAsync(url);
                    } catch {
                        if (format && 0 < format.length) {
                            this.engine.flagInvalidFormat(format);
                        }
                    }
                }
            }

            if (this._audioBuffer) {
                break;
            }
        }
    }
}

/** @internal */
class _WebAudioStaticSoundInstance extends _StaticSoundInstance implements IWebAudioOutNode {
    private _enginePlayTime: number = 0;
    private _enginePauseTime: number = 0;
    private _isConnected: boolean = false;
    private _pitch: Nullable<_WebAudioParameterComponent> = null;
    private _playbackRate: Nullable<_WebAudioParameterComponent> = null;
    private _sourceNode: Nullable<AudioBufferSourceNode> = null;
    private _volumeNode: GainNode;

    protected override readonly _options: IStaticSoundInstanceOptions;
    protected override _sound: _WebAudioStaticSound;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    public constructor(sound: _WebAudioStaticSound, options: IStaticSoundInstanceOptions) {
        super(sound);

        this._options = options;

        this._volumeNode = new GainNode(sound._audioContext);
        this._initSourceNode();
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._pitch?.dispose();
        this._playbackRate?.dispose();

        this.stop();

        this._deinitSourceNode();

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
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
            // Stop source node without sending `onEndedObservable` so instance's `dispose` function is not called.
            const sourceNode = this._sourceNode;
            this._deinitSourceNode();
            sourceNode?.stop();
            this._state = SoundState.Stopped;
        }

        if (this.state === SoundState.Paused) {
            this._enginePauseTime = 0;
        }

        this._options.startOffset = value;

        if (restart) {
            this.play();
        }
    }

    public get _outNode(): Nullable<AudioNode> {
        return this._volumeNode;
    }

    /** @internal */
    public set pitch(value: number) {
        this._pitch?.setTargetValue(value);
    }

    /** @internal */
    public set playbackRate(value: number) {
        this._playbackRate?.setTargetValue(value);
    }

    /** @internal */
    public get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._enginePlayTime;
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
        if (options.startOffset !== undefined) {
            this._options.startOffset = options.startOffset;
        }

        let startOffset = this._options.startOffset;

        if (this._state === SoundState.Paused) {
            startOffset += this._enginePauseTime;
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
        if (this._state !== SoundState.Started && this._state !== SoundState.Starting) {
            return;
        }

        const wasStarted = this._state === SoundState.Started;

        this._setState(SoundState.Paused);
        this._enginePauseTime += this.engine.currentTime - this._enginePlayTime;

        if (wasStarted) {
            this._sourceNode?.stop();
        } else {
            this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
        }

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

        if (this._state === SoundState.Started) {
            const engineStopTime = this.engine.currentTime + (options.waitTime ?? 0);
            this._sourceNode?.stop(engineStopTime);
        }

        if (options.waitTime === undefined || options.waitTime <= 0) {
            this._setState(SoundState.Stopped);
            this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
        }
    }

    protected override _connect(node: AbstractAudioNode): boolean {
        const connected = super._connect(node);

        if (!connected) {
            return false;
        }

        // If the wrapped node is not available now, it will be connected later by the sound's subgraph.
        if (node instanceof _WebAudioStaticSound && node._inNode) {
            this._outNode?.connect(node._inNode);
            this._isConnected = true;
        }

        return true;
    }

    protected override _disconnect(node: AbstractAudioNode): boolean {
        const disconnected = super._disconnect(node);

        if (!disconnected) {
            return false;
        }

        if (node instanceof _WebAudioStaticSound && node._inNode) {
            this._outNode?.disconnect(node._inNode);
            this._isConnected = false;
        }

        return true;
    }

    protected _onEnded = () => {
        this._enginePlayTime = 0;

        if (this._state !== SoundState.Paused) {
            this.onEndedObservable.notifyObservers(this);
        }

        this._deinitSourceNode();
    };

    private _deinitSourceNode(): void {
        if (!this._sourceNode) {
            return;
        }

        if (this._isConnected && !this._disconnect(this._sound)) {
            throw new Error("Disconnect failed");
        }

        this._sourceNode.disconnect(this._volumeNode);
        this._sourceNode.removeEventListener("ended", this._onEnded);

        this._sourceNode = null;
    }

    private _initSourceNode(): void {
        if (!this._sourceNode) {
            this._sourceNode = new AudioBufferSourceNode(this._sound._audioContext, { buffer: this._sound.buffer._audioBuffer });

            this._sourceNode.addEventListener("ended", this._onEnded, { once: true });
            this._sourceNode.connect(this._volumeNode);

            if (!this._connect(this._sound)) {
                throw new Error("Connect failed");
            }

            this._pitch = new _WebAudioParameterComponent(this.engine, this._sourceNode.detune);
            this._playbackRate = new _WebAudioParameterComponent(this.engine, this._sourceNode.playbackRate);
        }

        const node = this._sourceNode;
        node.detune.value = this._sound.pitch;
        node.loop = this._options.loop;
        node.loopEnd = this._options.loopEnd;
        node.loopStart = this._options.loopStart;
        node.playbackRate.value = this._sound.playbackRate;
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
