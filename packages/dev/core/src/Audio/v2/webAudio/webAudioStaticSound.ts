import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractAudioSubNode } from "../abstractAudioSubNode";
import { LastCreatedAudioEngine, type AudioEngineV2 } from "../audioEngineV2";
import { SoundState } from "../soundState";
import { _cleanUrl } from "../soundTools";
import type { IStaticSoundOptions } from "../staticSound";
import { StaticSound } from "../staticSound";
import { StaticSoundBuffer } from "../staticSoundBuffer";
import { _StaticSoundInstance } from "../staticSoundInstance";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioNode } from "./webAudioNode";
import type { _WebAudioSubGraph } from "./webAudioSubGraph";
import { _CreateAudioSubGraphAsync } from "./webAudioSubGraph";
import type { IWebAudioSuperNode } from "./webAudioSuperNode";

const fileExtensionRegex = new RegExp("\\.(\\w{3,4})($|\\?)");

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
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine available.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const sound = new WebAudioStaticSound(name, engine as _WebAudioEngine, options);
    await sound.init(source, options);
    (engine as _WebAudioEngine).addSound(sound);
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
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine available.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const buffer = new WebAudioStaticSoundBuffer(engine as _WebAudioEngine);
    await buffer.init(source, options);
    return buffer;
}

/** @internal */
class WebAudioStaticSound extends StaticSound implements IWebAudioSuperNode, IWebAudioNode {
    private _buffer: WebAudioStaticSoundBuffer;

    protected _subNodeGraph: _WebAudioSubGraph;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext | OfflineAudioContext;

    /** @internal */
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(source: StaticSoundSourceType, options: Nullable<IStaticSoundOptions> = null): Promise<void> {
        this.audioContext = this.engine.audioContext;

        if (source instanceof WebAudioStaticSoundBuffer) {
            this._buffer = source as WebAudioStaticSoundBuffer;
        } else if (typeof source === "string" || Array.isArray(source) || source instanceof ArrayBuffer || source instanceof AudioBuffer) {
            this._buffer = (await CreateSoundBufferAsync(source, options, this.engine)) as WebAudioStaticSoundBuffer;
        }

        this._subNodeGraph = await _CreateAudioSubGraphAsync(this, options);

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        } else {
            await this.engine.isReadyPromise;
            this.outputBus = this.engine.defaultMainBus;
        }

        if (options?.autoplay) {
            this.play(this.startOffset, this.duration > 0 ? this.duration : null);
        }
    }

    /** @internal */
    public get buffer(): WebAudioStaticSoundBuffer {
        return this._buffer;
    }

    /** @internal */
    public get webAudioInputNode() {
        return this._subNodeGraph.webAudioInputNode;
    }

    /** @internal */
    public get webAudioOutputNode() {
        return this._subNodeGraph.webAudioOutputNode;
    }

    /** @internal */
    public addSubNode(subNode: AbstractAudioSubNode): void {
        this._addSubNode(subNode);
    }

    /** @internal */
    public disconnectSubNodes(): void {
        this._disconnectSubNodes();
    }

    /** @internal */
    public getSubNode(subNodeClassName: string): Nullable<AbstractAudioSubNode> {
        return this._getSubNode(subNodeClassName);
    }

    /** @internal */
    public hasSubNode(name: string): boolean {
        return this._hasSubNode(name);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioStaticSound";
    }

    protected _createSoundInstance(): WebAudioStaticSoundInstance {
        const soundInstance = new WebAudioStaticSoundInstance(this);
        this.engine.addSoundInstance(soundInstance);
        return soundInstance;
    }

    protected override _updateSubNodes(): void {
        if (!this._subNodeGraph) {
            return;
        }

        this._subNodeGraph.updateSubNodes();
        this._reconnect();
    }

    protected override _connect(node: IWebAudioNode): void {
        super._connect(node);
        this.webAudioOutputNode.connect(node.webAudioInputNode);
    }

    protected override _disconnect(node: IWebAudioNode): void {
        super._disconnect(node);
        this.webAudioOutputNode.disconnect(node.webAudioInputNode);
    }
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
    public get numberOfChannels(): number {
        return this.audioBuffer.numberOfChannels;
    }

    /** @internal */
    constructor(engine: _WebAudioEngine) {
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
        url = _cleanUrl(url);
        await this._initFromArrayBuffer(await (await fetch(url)).arrayBuffer());
    }

    private async _initFromUrls(urls: string[], skipCodecCheck: boolean): Promise<void> {
        for (const url of urls) {
            if (skipCodecCheck) {
                await this._initFromUrl(url);
            } else {
                const matches = url.match(fileExtensionRegex);
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
class WebAudioStaticSoundInstance extends _StaticSoundInstance {
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

    protected override _source: WebAudioStaticSound;

    /** @internal */
    public sourceNode: Nullable<AudioBufferSourceNode>;

    constructor(source: WebAudioStaticSound) {
        super(source);
        this._initSourceNode();
        this._loop = source.loop;
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this.stop();

        this._deinitSourceNode();

        this.engine.stateChangedObservable.removeCallback(this._onEngineStateChanged);
    }

    /** @internal */
    public play(startOffset: Nullable<number> = null, duration: Nullable<number> = null, waitTime: Nullable<number> = null): void {
        if (this._state === SoundState.Started) {
            return;
        }

        this._duration = duration;

        if (this._state === SoundState.Paused) {
            // TODO: Make this fall within loop points when loop start/end is set.
            startOffset = (this.currentTime + this._startOffset) % this._source.buffer.duration;
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

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.sourceNode?.connect(node.webAudioInputNode);
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.sourceNode?.disconnect(node.webAudioInputNode);
        }
    }

    private _initSourceNode(): void {
        if (this.sourceNode) {
            return;
        }

        this.sourceNode = new AudioBufferSourceNode(this._source.audioContext, {
            buffer: this._source.buffer.audioBuffer,
            detune: this._source.pitch,
            loop: this._source.loop,
            loopEnd: this._source.loopEnd,
            loopStart: this._source.loopStart,
            playbackRate: this._source.playbackRate,
        });

        this.sourceNode.addEventListener("ended", this._onEnded, { once: true });
        this._connect(this._source);
    }

    private _deinitSourceNode(): void {
        if (!this.sourceNode) {
            return;
        }

        this._disconnect(this._source);
        this.sourceNode.removeEventListener("ended", this._onEnded);

        this.sourceNode = null;
    }
}
