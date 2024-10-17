import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractSoundInstance } from "../abstractSoundInstance";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import { WebAudioBus } from "./webAudioBus";
import type { WebAudioDevice } from "./webAudioDevice";
import type { AbstractWebAudioEngine, IWebAudioStaticSoundOptions } from "./webAudioEngine";
import { WebAudioMainBus } from "./webAudioMainBus";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: GainNode;
    private _audioBuffer: AudioBuffer;

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
    constructor(name: string, engine: AbstractWebAudioEngine, options: Nullable<IWebAudioStaticSoundOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(options: Nullable<IWebAudioStaticSoundOptions> = null): Promise<void> {
        this.audioContext = await (this.engine.defaultDevice as WebAudioDevice).audioContext;
        this._gainNode = new GainNode(this.audioContext);

        this.outputBus = options?.outputBus ?? this.engine.defaultMainBus;

        if (options?.sourceUrl) {
            const response = await fetch(options.sourceUrl);
            const arrayBuffer = await response.arrayBuffer();
            this._audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }

        if (options?.autoplay) {
            this.play();
        }
    }

    /** @internal */
    public onSoundInstanceEnded(instance: AbstractSoundInstance): void {
        this._onSoundInstanceEnded(instance);
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

    protected override async _createSoundInstance(): Promise<AbstractSoundInstance> {
        const instance = (await super._createSoundInstance()) as WebAudioStaticSoundInstance;

        instance.sourceNode!.buffer = this._audioBuffer;

        return instance;
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
        this.sourceNode = new AudioBufferSourceNode((this._source as WebAudioStaticSound).audioContext!);

        this._connect(this._source);
    }

    /** @internal */
    public async play(): Promise<void> {
        this.sourceNode.addEventListener("ended", this._onEnded.bind(this), { once: true });
        this.sourceNode.start();
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
    public stop(): void {
        this.sourceNode?.stop();
        this._onEnded();
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
        (this._source as WebAudioStaticSound).onSoundInstanceEnded(this);

        this.sourceNode?.removeEventListener("ended", this._onEnded.bind(this));

        this.onEndedObservable.notifyObservers(this);
    }
}
