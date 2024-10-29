import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundBuffer } from "../abstractStaticSoundBuffer";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import { SoundState } from "../soundState";
import { WebAudioBus } from "./webAudioBus";
import type { AbstractWebAudioEngine, WebAudioEngine, WebAudioStaticSoundBufferOptions, WebAudioStaticSoundOptions } from "./webAudioEngine";
import { WebAudioMainBus } from "./webAudioMainBus";

const fileExtensionRegex = new RegExp("\\.(\\w{3,4}$|\\?)");

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: GainNode;

    /** @internal */
    public override readonly engine: WebAudioEngine;

    /** @internal */
    public audioContext: AudioContext;

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
    constructor(name: string, engine: AbstractWebAudioEngine, options: Nullable<WebAudioStaticSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(options: Nullable<WebAudioStaticSoundOptions> = null): Promise<void> {
        this.audioContext = await this.engine.audioContext;

        this._gainNode = new GainNode(this.audioContext);

        if (options?.sourceBuffer) {
            this._buffer = options.sourceBuffer as WebAudioStaticSoundBuffer;
        } else if (options?.sourceUrl || options?.sourceUrls || options?.sourceArrayBuffer || options?.sourceAudioBuffer) {
            this._buffer = (await this.engine.createSoundBuffer(options)) as WebAudioStaticSoundBuffer;
        }

        this.outputBus = options?.outputBus ?? this.engine.defaultMainBus;
        this.volume = options?.volume ?? 1;

        if (options?.autoplay) {
            this.play(null, this.startOffset, this.duration > 0 ? this.duration : null);
        }
    }

    protected _createSoundInstance(): WebAudioStaticSoundInstance {
        return this.engine.createStaticSoundInstance(this);
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioMainBus) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioMainBus || node instanceof WebAudioBus) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}

/** @internal */
export class WebAudioStaticSoundBuffer extends AbstractStaticSoundBuffer {
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
    constructor(engine: AbstractWebAudioEngine) {
        super(engine);
    }

    public async init(options: Nullable<WebAudioStaticSoundBufferOptions> = null): Promise<void> {
        if (options?.sourceAudioBuffer) {
            this.audioBuffer = options.sourceAudioBuffer;
        } else if (options?.sourceUrl) {
            await this._initFromUrl(options.sourceUrl);
        } else if (options?.sourceUrls) {
            await this._initFromUrls(options.sourceUrls, options.sourceUrlsSkipCodecCheck ?? false);
        } else if (options?.sourceArrayBuffer) {
            await this._initFromArrayBuffer(options.sourceArrayBuffer);
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
                if (format && this.engine.formatIsInvalid(format)) {
                    continue;
                }
                try {
                    await this._initFromUrl(url);
                } catch (e) {
                    if (format && 0 < format.length) {
                        this.engine.flagInvalidFormat(format);
                    }
                }
            }
            if (this.audioBuffer) {
                break;
            }
        }
    }

    private async _initFromArrayBuffer(arrayBuffer: ArrayBuffer): Promise<void> {
        this.audioBuffer = await (await this.engine.audioContext).decodeAudioData(arrayBuffer);
    }
}

/** @internal */
export class WebAudioStaticSoundInstance extends AbstractStaticSoundInstance {
    private _state: SoundState = SoundState.Stopped;
    private _currentTime: number = 0;
    private _startTime: number = 0;

    protected override _source: WebAudioStaticSound;

    /** @internal */
    public sourceNode: Nullable<AudioBufferSourceNode>;

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : this.engine.currentTime - this._startTime;
        return this._currentTime + timeSinceLastStart;
    }

    public get webAudioOutputNode() {
        return this.sourceNode;
    }

    constructor(source: WebAudioStaticSound) {
        super(source);
        this._initSourceNode();
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();
        this.stop();
        this._deinitSourceNode();
    }

    /** @internal */
    public play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): void {
        if (this._state === SoundState.Playing) {
            return;
        }

        if (this._state === SoundState.Paused) {
            // TODO: Make this fall within loop points when loop start/end is set.
            startOffset = (this.currentTime + this._startOffset) % this._source.buffer.duration;
            waitTime = 0;
        }

        this._state = SoundState.Playing;
        this._startTime = this.engine.currentTime + (waitTime ?? 0);

        this._initSourceNode();
        this.sourceNode?.start(this._startTime, startOffset ?? 0, duration === null ? undefined : duration);
    }

    /** @internal */
    public pause(): void {
        if (this._state === SoundState.Paused) {
            return;
        }

        this._state = SoundState.Paused;
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

        this._state = SoundState.Stopped;

        this.sourceNode?.stop(waitTime ? this.engine.currentTime + waitTime : 0);
    }

    protected _onEnded = (() => {
        this._startTime = 0;

        this.onEndedObservable.notifyObservers(this);
        this._deinitSourceNode();
    }).bind(this);

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.webAudioOutputNode?.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.webAudioOutputNode?.disconnect(node.webAudioInputNode);
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
