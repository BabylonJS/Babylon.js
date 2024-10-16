import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractSoundInstance } from "../abstractSoundInstance";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import { WebAudioBus, WebAudioMainBus } from "./webAudioBus";
import type { IWebAudioStaticSoundOptions, WebAudioEngine } from "./webAudioEngine";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: GainNode;
    private _audioBuffer: Nullable<AudioBuffer> = null;

    public readonly audioContext: AudioContext;

    public get webAudioInputNode() {
        return this._gainNode;
    }

    public get webAudioOutputNode() {
        return this._gainNode;
    }

    constructor(name: string, engine: WebAudioEngine, options: Nullable<IWebAudioStaticSoundOptions> = null) {
        super(name, engine, options);

        this.audioContext = engine.defaultDevice.audioContext;
        this._gainNode = new GainNode(this.audioContext);
    }

    public override async init(options: Nullable<IWebAudioStaticSoundOptions> = null): Promise<void> {
        await super.init(options);

        if (options?.sourceUrl) {
            const response = await fetch(options.sourceUrl);
            const arrayBuffer = await response.arrayBuffer();
            this._audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
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

    protected override async _createSoundInstance(): Promise<AbstractSoundInstance> {
        const instance = (await super._createSoundInstance()) as WebAudioStaticSoundInstance;

        instance.sourceNode.buffer = this._audioBuffer;

        return instance;
    }
}

/** @internal */
export class WebAudioStaticSoundInstance extends AbstractStaticSoundInstance {
    public sourceNode: AudioBufferSourceNode;

    public get currentTime(): number {
        return 0;
    }

    public get webAudioOutputNode(): AudioNode {
        return this.sourceNode;
    }

    constructor(source: WebAudioStaticSound) {
        super(source);

        this.sourceNode = new AudioBufferSourceNode(source.audioContext);
    }

    public async play(): Promise<void> {
        await (this._source as WebAudioStaticSound).audioContext.resume();
        this.sourceNode.start();
    }

    public pause(): void {
        //
    }

    public resume(): void {
        //
    }

    public override stop(): void {
        super.stop();
        this.sourceNode.stop();
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioStaticSound) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioStaticSound) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
