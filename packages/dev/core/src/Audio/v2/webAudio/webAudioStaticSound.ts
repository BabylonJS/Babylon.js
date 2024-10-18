import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import { WebAudioBus } from "./webAudioBus";
import type { WebAudioDevice } from "./webAudioDevice";
import type { AbstractWebAudioEngine, WebAudioStaticSoundOptions } from "./webAudioEngine";
import { WebAudioMainBus } from "./webAudioMainBus";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: GainNode;

    /** @internal */
    public audioBuffer: AudioBuffer;

    /** @internal */
    public audioContext: AudioContext;

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
        this.audioContext = await (this.engine.defaultDevice as WebAudioDevice).audioContext;
        this._gainNode = new GainNode(this.audioContext);

        this.outputBus = options?.outputBus ?? this.engine.defaultMainBus;

        if (options?.sourceUrl) {
            const response = await fetch(options.sourceUrl);
            const arrayBuffer = await response.arrayBuffer();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }

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
export class WebAudioStaticSoundInstance extends AbstractStaticSoundInstance {
    /** @internal */
    public sourceNode: AudioBufferSourceNode;

    /** @internal */
    get currentTime(): number {
        return 0;
    }

    public get webAudioOutputNode() {
        return this.sourceNode;
    }

    constructor(source: WebAudioStaticSound) {
        super(source);
    }

    public async init(): Promise<void> {
        this.sourceNode = new AudioBufferSourceNode((this._source as WebAudioStaticSound).audioContext, {
            buffer: (this._source as WebAudioStaticSound).audioBuffer,
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
        this.sourceNode.addEventListener("ended", this._onEnded.bind(this), { once: true });
        this.sourceNode.start(waitTime ? (this._source as WebAudioStaticSound).audioContext.currentTime + waitTime : 0, startOffset ?? 0, duration === null ? undefined : duration);
    }

    /** @internal */
    public pause(): void {
        //
    }

    /** @internal */
    public resume(): void {
        //
    }

    /** @internal */
    public stop(waitTime: Nullable<number> = null): void {
        this.sourceNode?.stop(waitTime ? (this._source as WebAudioStaticSound).audioContext.currentTime + waitTime : 0);
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

    protected _onEnded(): void {
        this.onEndedObservable.notifyObservers(this);
        this.sourceNode?.removeEventListener("ended", this._onEnded.bind(this));
    }
}
