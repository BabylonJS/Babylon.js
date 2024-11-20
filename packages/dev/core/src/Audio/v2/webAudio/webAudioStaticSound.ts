import type { Nullable } from "../../../types";
import { LastCreatedAudioEngine, type AudioEngineV2 } from "../audioEngineV2";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { SoundState } from "../soundState";
import type { IStaticSoundOptions } from "../staticSound";
import { StaticSound } from "../staticSound";
import { StaticSoundBuffer } from "../staticSoundBuffer";
import { StaticSoundInstance } from "../staticSoundInstance";
import type { WebAudioBus } from "./webAudioBus";
import type { WebAudioEngine } from "./webAudioEngine";
import type { WebAudioMainBus } from "./webAudioMainBus";

const fileExtensionRegex = new RegExp("\\.(\\w{3,4}$|\\?)");

export type StaticSoundSourceType = ArrayBuffer | AudioBuffer | StaticSoundBuffer | string | string[];

/**
 * Creates a new static sound.
 * @param name - The name of the sound.
 * @param source - The source of the sound.
 * @param engine - The audio engine.
 * @param options - The options for the static sound.
 * @returns A promise that resolves to the created static sound.
 */
export async function CreateSoundAsync(
    name: string,
    source: StaticSoundSourceType,
    engine: Nullable<AudioEngineV2> = null,
    options: Nullable<IStaticSoundOptions> = null
): Promise<StaticSound> {
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine available.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const sound = new WebAudioStaticSound(name, engine as WebAudioEngine, options);
    await sound.init(source, options);
    (engine as WebAudioEngine).addSound(sound);
    return sound;
}

/**
 * Creates a new static sound buffer.
 * @param source - The source of the sound buffer.
 * @param engine - The audio engine.
 * @param options - The options for the static sound buffer.
 * @returns A promise that resolves to the created static sound buffer.
 */
export async function CreateSoundBufferAsync(
    source: StaticSoundSourceType,
    engine: Nullable<AudioEngineV2> = null,
    options: Nullable<IStaticSoundOptions> = null
): Promise<StaticSoundBuffer> {
    engine = engine ?? LastCreatedAudioEngine();

    if (!engine) {
        throw new Error("No audio engine available.");
    }

    if (!engine.isWebAudio) {
        throw new Error("Unsupported engine type.");
    }

    const buffer = new WebAudioStaticSoundBuffer(engine as WebAudioEngine);
    await buffer.init(source, options);
    return buffer;
}

/** @internal */
class WebAudioStaticSound extends StaticSound {
    private _gainNode: GainNode;

    /** @internal */
    public override readonly engine: WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext | BaseAudioContext;

    private _buffer: WebAudioStaticSoundBuffer;

    /** @internal */
    public get buffer(): WebAudioStaticSoundBuffer {
        return this._buffer;
    }

    /** @internal */
    public get volume(): number {
        return this._gainNode.gain.value;
    }

    public set volume(value: number) {
        this._gainNode.gain.value = value;
    }

    /** @internal */
    public get webAudioInputNode() {
        return this._gainNode;
    }

    /** @internal */
    public get webAudioOutputNode() {
        return this._gainNode;
    }

    /** @internal */
    constructor(name: string, engine: WebAudioEngine, options: Nullable<IStaticSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(source: StaticSoundSourceType, options: Nullable<IStaticSoundOptions> = null): Promise<void> {
        this.audioContext = this.engine.audioContext;

        this._gainNode = new GainNode(this.audioContext);

        if (source instanceof WebAudioStaticSoundBuffer) {
            this._buffer = source as WebAudioStaticSoundBuffer;
        } else if (typeof source === "string" || Array.isArray(source) || source instanceof ArrayBuffer || source instanceof AudioBuffer) {
            this._buffer = (await CreateSoundBufferAsync(source, this.engine, options)) as WebAudioStaticSoundBuffer;
        }

        if (options?.outputBus) {
            this.outputBus = options.outputBus;
        } else {
            await this.engine.isReadyPromise;
            this.outputBus = this.engine.defaultMainBus;
        }

        this.volume = options?.volume ?? 1;

        if (options?.autoplay) {
            this.play(null, this.startOffset, this.duration > 0 ? this.duration : null);
        }
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

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node.getClassName() === "WebAudioMainBus" || node.getClassName() === "WebAudioBus") {
            this.webAudioOutputNode.connect((node as WebAudioMainBus | WebAudioBus).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node.getClassName() === "WebAudioMainBus" || node.getClassName() === "WebAudioBus") {
            this.webAudioOutputNode.disconnect((node as WebAudioMainBus | WebAudioBus).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}

/** @internal */
class WebAudioStaticSoundBuffer extends StaticSoundBuffer {
    /** @internal */
    public override readonly engine: WebAudioEngine;

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
    constructor(engine: WebAudioEngine) {
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
        await this._initFromArrayBuffer(await (await fetch(url)).arrayBuffer());
    }

    private async _initFromUrls(urls: string[], skipCodecCheck: boolean): Promise<void> {
        for (const url of urls) {
            if (skipCodecCheck) {
                await this._initFromUrl(url);
            } else {
                const format = url.match(fileExtensionRegex)?.at(1);
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
class WebAudioStaticSoundInstance extends StaticSoundInstance {
    /** @internal */
    public override readonly engine: WebAudioEngine;

    private _duration: Nullable<number> = null;
    private _loop: boolean = false;

    private _currentTime: number = 0;
    private _startTime: number = 0;

    /** @internal */
    get startTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        return this._startTime;
    }

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._startTime;
        return this._currentTime + timeSinceLastStart;
    }

    private _onEngineStateChanged = () => {
        if (this.engine.state !== "running") {
            return;
        }

        if (this._loop && this.state === SoundState.Starting) {
            this.play(this._startTime, this._startOffset, this._duration);
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
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {
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

        this._startTime = this.engine.currentTime + (waitTime ?? 0);

        this._initSourceNode();

        if (this.engine.state === "running") {
            this._setState(SoundState.Started);
            this.sourceNode?.start(this._startTime, startOffset ?? 0, duration === null ? undefined : duration);
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
        this._currentTime += this.engine.currentTime - this._startTime;

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

    protected _onEnded = (() => {
        this._startTime = 0;

        this.onEndedObservable.notifyObservers(this);
        this._deinitSourceNode();
    }).bind(this);

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.sourceNode?.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.sourceNode?.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
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
