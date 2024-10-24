import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundBuffer } from "../abstractStaticSoundBuffer";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import { SoundState } from "../soundState";
import { WebAudioBus } from "./webAudioBus";
import type { AbstractWebAudioEngine, WebAudioEngine, WebAudioStaticSoundBufferOptions, WebAudioStaticSoundOptions } from "./webAudioEngine";
import { WebAudioMainBus } from "./webAudioMainBus";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: GainNode;

    /** @internal */
    public audioContext: AudioContext;

    private _buffer: WebAudioStaticSoundBuffer;

    /** @internal */
    public get buffer(): WebAudioStaticSoundBuffer {
        return this._buffer;
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
        this.audioContext = await (this.engine as WebAudioEngine).audioContext;
        this._gainNode = new GainNode(this.audioContext);
        this._buffer = (await this.engine.createSoundBuffer(options)) as WebAudioStaticSoundBuffer;
        this.outputBus = options?.outputBus ?? this.engine.defaultMainBus;

        if (options?.autoplay) {
            this.play();
        }
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
        if (options?.sourceUrl) {
            const response = await fetch(options.sourceUrl);
            const arrayBuffer = await response.arrayBuffer();
            const audioContext = await (this.engine as WebAudioEngine).audioContext;
            this.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        }
    }
}

/** @internal */
export class WebAudioStaticSoundInstance extends AbstractStaticSoundInstance {
    private _state: SoundState = SoundState.Stopped;
    private _currentTime: number = 0;
    private _startTime: number = 0;

    /** @internal */
    public sourceNode: AudioBufferSourceNode;

    /** @internal */
    get currentTime(): number {
        if (this._state === SoundState.Stopped) {
            return 0;
        }

        const timeSinceLastStart = this._state === SoundState.Paused ? 0 : (this._source as WebAudioStaticSound).audioContext.currentTime - this._startTime;
        return this._currentTime + timeSinceLastStart;
    }

    public get webAudioOutputNode() {
        return this.sourceNode;
    }

    constructor(source: WebAudioStaticSound) {
        super(source);
    }

    public async init(): Promise<void> {
        this.sourceNode = new AudioBufferSourceNode((this._source as WebAudioStaticSound).audioContext, {
            buffer: (this._source as WebAudioStaticSound).buffer.audioBuffer,
            detune: this._source.pitch,
            loop: this._source.loop,
            loopEnd: (this._source as WebAudioStaticSound).loopEnd,
            loopStart: (this._source as WebAudioStaticSound).loopStart,
            playbackRate: this._source.playbackRate,
        });

        this._connect(this._source);
    }

    /** @internal */
    public async play(waitTime: Nullable<number> = null, startOffset: Nullable<number> = null, duration: Nullable<number> = null): Promise<void> {
        if (this._state === SoundState.Playing) {
            return;
        }

        if (this._state === SoundState.Paused) {
            this.resume();
            return;
        }

        this._state = SoundState.Playing;

        this.sourceNode.addEventListener("ended", this._onEnded.bind(this), { once: true });

        this._startTime = (this._source as WebAudioStaticSound).audioContext.currentTime + (waitTime ?? 0);
        this.sourceNode.start(this._startTime, startOffset ?? 0, duration === null ? undefined : duration);
    }

    /** @internal */
    public pause(): void {
        if (this._state === SoundState.Paused) {
            return;
        }
        this._state = SoundState.Paused;

        this._source.stop();
        this._currentTime += (this._source as WebAudioStaticSound).audioContext.currentTime - this._startTime;
    }

    /** @internal */
    public resume(): void {
        if (this._state !== SoundState.Paused) {
            return;
        }

        // TODO: Make this fall within loop points when loop start/end is set.
        const startOffset = (this.currentTime + this._startOffset) % (this._source as WebAudioStaticSound).buffer.duration;

        this.play(0, startOffset);
    }

    /** @internal */
    public stop(waitTime: Nullable<number> = null): void {
        if (this._state === SoundState.Stopped) {
            return;
        }
        this._state = SoundState.Stopped;

        this.sourceNode?.stop(waitTime ? (this._source as WebAudioStaticSound).audioContext.currentTime + waitTime : 0);
    }

    protected _onEnded(): void {
        this._startTime = 0;

        if (this._state === SoundState.Paused) {
            return;
        }

        this.onEndedObservable.notifyObservers(this);
        this.sourceNode?.removeEventListener("ended", this._onEnded.bind(this));
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStaticSound && node.webAudioInputNode) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
