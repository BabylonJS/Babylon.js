import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { SoundState } from "../soundState";
import { _CleanUrl } from "../soundTools";
import type { IStaticSoundOptions } from "../staticSound";
import { StaticSound } from "../staticSound";
import { StaticSoundBuffer } from "../staticSoundBuffer";
import { _StaticSoundInstance } from "../staticSoundInstance";
import { _SpatialAudio } from "../subProperties/spatialAudio";
import { _StereoAudio } from "../subProperties/stereoAudio";
import { _WebAudioBusAndSoundSubGraph } from "./subGraphs/webAudioBusAndSoundSubGraph";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode, IWebAudioOutNode, IWebAudioSuperNode } from "./webAudioNode";
import { _GetWebAudioEngine } from "./webAudioTools";

const FileExtensionRegex = new RegExp("\\.(\\w{3,4})($|\\?)");

export type StaticSoundSourceType = ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[];

/**
 * Creates a new static sound.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param options - The options for the static sound.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created static sound.
 */
export async function CreateSoundAsync(
    name: string,
    source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
    options: Nullable<IStaticSoundOptions> = null,
    engine: Nullable<AudioEngineV2> = null
): Promise<StaticSound> {
    const webAudioEngine = _GetWebAudioEngine(engine);

    const sound = new WebAudioStaticSound(name, webAudioEngine, options);
    await sound.init(source, options);

    return sound;
}

/**
 * Creates a new static sound buffer.
 * @param source - The source of the sound buffer.
 * @param options - The options for the static sound buffer.
 * @param engine - The audio engine.
 * @returns A promise that resolves to the created static sound buffer.
 */
export async function CreateSoundBufferAsync(
    source: ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[],
    options: Nullable<IStaticSoundOptions> = null,
    engine: Nullable<AudioEngineV2> = null
): Promise<StaticSoundBuffer> {
    const webAudioEngine = _GetWebAudioEngine(engine);

    const buffer = new WebAudioStaticSoundBuffer(webAudioEngine);
    await buffer.init(source, options);
    return buffer;
}

/** @internal */
class WebAudioStaticSound extends StaticSound implements IWebAudioSuperNode {
    private _buffer: WebAudioStaticSoundBuffer;
    private _spatial: Nullable<_SpatialAudio> = null;
    private _stereo: Nullable<_StereoAudio> = null;

    protected _subGraph: _WebAudioBusAndSoundSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    public constructor(name: string, engine: _WebAudioEngine, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);

        this._subGraph = new WebAudioStaticSound._SubGraph(this);
    }

    /** @internal */
    public async init(source: StaticSoundSourceType, options: Nullable<IStaticSoundOptions> = null): Promise<void> {
        this.audioContext = this.engine.audioContext;

        if (source instanceof WebAudioStaticSoundBuffer) {
            this._buffer = source as WebAudioStaticSoundBuffer;
        } else if (typeof source === "string" || Array.isArray(source) || source instanceof ArrayBuffer || source instanceof AudioBuffer) {
            this._buffer = (await CreateSoundBufferAsync(source, options, this.engine)) as WebAudioStaticSoundBuffer;
        }

        if (options?.outBus) {
            this.outBus = options.outBus;
        } else {
            await this.engine.isReadyPromise;
            this.outBus = this.engine.defaultMainBus;
        }

        await this._subGraph.init(options);

        if (options?.autoplay) {
            this.play(this.startOffset, this.duration > 0 ? this.duration : null);
        }

        this.engine.addSuperNode(this);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.engine.removeSuperNode(this);
    }

    /** @internal */
    public get buffer(): WebAudioStaticSoundBuffer {
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
        return this._spatial ?? (this._spatial = new _SpatialAudio(this._subGraph));
    }

    /** @internal */
    public override get stereo(): _StereoAudio {
        return this._stereo ?? (this._stereo = new _StereoAudio(this._subGraph));
    }

    protected _createInstance(): WebAudioStaticSoundInstance {
        return new WebAudioStaticSoundInstance(this);
    }

    protected override _connect(node: IWebAudioInNode): void {
        super._connect(node);

        if (node.inNode) {
            this.outNode?.connect(node.inNode);
        }
    }

    protected override _disconnect(node: IWebAudioInNode): void {
        super._disconnect(node);

        if (node.inNode) {
            try {
                this.outNode?.disconnect(node.inNode);
            } catch (e) {
                // Ignore error that occurs when node is not connected.
                if (!(e instanceof DOMException && e.name === "InvalidAccessError")) {
                    throw e;
                }
            }
        }
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStaticSound";
    }

    private static _SubGraph = class extends _WebAudioBusAndSoundSubGraph {
        protected override _owner: WebAudioStaticSound;

        protected get _downstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._downstreamNodes ?? null;
        }

        protected get _upstreamNodes(): Nullable<Set<AbstractAudioNode>> {
            return this._owner._upstreamNodes ?? null;
        }
    };
}

/** @internal */
class WebAudioStaticSoundBuffer extends StaticSoundBuffer {
    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioBuffer: AudioBuffer;

    /** @internal */
    public get sampleRate(): number {
        return this.audioBuffer.sampleRate;
    }

    /** @internal */
    public get length(): number {
        return this.audioBuffer.length;
    }

    /** @internal */
    public get duration(): number {
        return this.audioBuffer.duration;
    }

    /** @internal */
    public get channelCount(): number {
        return this.audioBuffer.numberOfChannels;
    }

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);
    }

    public async init(source: StaticSoundSourceType, options: Nullable<IStaticSoundOptions> = null): Promise<void> {
        if (source instanceof AudioBuffer) {
            this.audioBuffer = source;
        } else if (typeof source === "string") {
            await this._initFromUrl(source);
        } else if (Array.isArray(source)) {
            await this._initFromUrls(source, options?.skipCodecCheck ?? false);
        } else if (source instanceof ArrayBuffer) {
            await this._initFromArrayBuffer(source);
        }
    }

    private async _initFromUrl(url: string): Promise<void> {
        // TODO: Maybe use the existing file loading tools here.
        url = _CleanUrl(url);
        await this._initFromArrayBuffer(await (await fetch(url)).arrayBuffer());
    }

    private async _initFromUrls(urls: string[], skipCodecCheck: boolean): Promise<void> {
        for (const url of urls) {
            if (skipCodecCheck) {
                await this._initFromUrl(url);
            } else {
                const matches = url.match(FileExtensionRegex);
                const format = matches?.at(1);
                if (format && this.engine.formatIsValid(format)) {
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

    private async _initFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
        this.audioBuffer = await this.engine.audioContext.decodeAudioData(arrayBuffer);
    }
}

/** @internal */
class WebAudioStaticSoundInstance extends _StaticSoundInstance implements IWebAudioOutNode {
    /** @internal */
    public override readonly engine: _WebAudioEngine;

    private _duration: Nullable<number> = null;
    private _loop: boolean = false;

    private _enginePlayTime: number = 0;
    private _enginePauseTime: number = 0;

    /** @internal */
    get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._enginePlayTime;
    }

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._enginePlayTime;
        return this._enginePauseTime + timeSinceLastStart + this._startOffset;
    }

    set currentTime(value: number) {
        const restart = this._state === SoundState.Starting || this._state === SoundState.Started;

        if (restart) {
            this.stop();
            this._deinitSourceNode();
        }

        this._startOffset = value;

        if (restart) {
            this.play();
        }
    }

    private _onEngineStateChanged = () => {
        if (this.engine.state !== "running") {
            return;
        }

        if (this._loop && this.state === SoundState.Starting) {
            this.play(this._enginePlayTime, this._startOffset, this._duration);
        }

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    };

    protected override _sound: WebAudioStaticSound;

    /** @internal */
    public sourceNode: Nullable<AudioBufferSourceNode>;

    public constructor(sound: WebAudioStaticSound) {
        super(sound);
        this._initSourceNode();
        this._loop = sound.loop;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._deinitSourceNode();

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    public get outNode(): Nullable<AudioNode> {
        return this.sourceNode;
    }

    /** @internal */
    public play(startOffset: Nullable<number> = null, duration: Nullable<number> = null, waitTime: Nullable<number> = null): void {
        if (this._state === SoundState.Started) {
            return;
        }

        this._duration = duration;

        if (this._state === SoundState.Paused) {
            // TODO: Make this fall within loop points when loop start/end is set.
            startOffset = (this.currentTime + this._startOffset) % this._sound.buffer.duration;
            waitTime = 0;
        } else if (startOffset) {
            this._startOffset = startOffset;
        } else {
            startOffset = this._startOffset;
        }

        this._enginePlayTime = this.engine.currentTime + (waitTime ?? 0);

        this._initSourceNode();

        if (this.engine.state === "running") {
            this._setState(SoundState.Started);
            this.sourceNode?.start(this._enginePlayTime, startOffset ?? 0, duration === null ? undefined : duration);
        } else if (this._loop) {
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

        this.sourceNode?.stop();
        this._deinitSourceNode();
    }

    /** @internal */
    public resume(): void {
        if (this._state === SoundState.Paused) {
            this.play();
        }
    }

    /** @internal */
    public stop(waitTime: Nullable<number> = null): void {
        if (this._state === SoundState.Stopped) {
            return;
        }

        this._setState(SoundState.Stopped);

        this.sourceNode?.stop(waitTime ? this.engine.currentTime + waitTime : 0);

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStaticSoundInstance";
    }

    protected _onEnded = () => {
        this._enginePlayTime = 0;

        this.onEndedObservable.notifyObservers(this);
        this._deinitSourceNode();
    };

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStaticSound && node.inNode) {
            this.sourceNode?.connect(node.inNode);
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStaticSound && node.inNode) {
            this.sourceNode?.disconnect(node.inNode);
        }
    }

    private _initSourceNode(): void {
        if (this.sourceNode) {
            return;
        }

        this.sourceNode = new AudioBufferSourceNode(this._sound.audioContext, {
            buffer: this._sound.buffer.audioBuffer,
            detune: this._sound.pitch,
            loop: this._sound.loop,
            loopEnd: this._sound.loopEnd,
            loopStart: this._sound.loopStart,
            playbackRate: this._sound.playbackRate,
        });

        this.sourceNode.addEventListener("ended", this._onEnded, { once: true });
        this._connect(this._sound);
    }

    private _deinitSourceNode(): void {
        if (!this.sourceNode) {
            return;
        }

        this._disconnect(this._sound);
        this.sourceNode.removeEventListener("ended", this._onEnded);

        this.sourceNode = null;
    }
}
