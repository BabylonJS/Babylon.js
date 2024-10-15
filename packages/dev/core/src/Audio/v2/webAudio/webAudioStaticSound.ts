import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractSoundInstance } from "../abstractSoundInstance";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import type { IWebAudioStaticSoundOptions, WebAudioEngine } from "./webAudioEngine";
import { WebAudioMainBus } from "./webAudioMainBus";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: GainNode;
    private _audioBufferPromise: Nullable<Promise<AudioBuffer>> = null;

    public readonly audioContext: AudioContext;

    public override get engine(): WebAudioEngine {
        return this._engine as WebAudioEngine;
    }

    public override get outputBus(): WebAudioMainBus {
        return super.outputBus as WebAudioMainBus;
    }

    public override set outputBus(outputBus: WebAudioMainBus) {
        super.outputBus = outputBus;
    }

    public get webAudioInputNode() {
        return this._gainNode;
    }

    public get webAudioOutputNode() {
        return this._gainNode;
    }

    constructor(name: string, engine: WebAudioEngine, options?: IWebAudioStaticSoundOptions) {
        super(name, engine, options);

        this.audioContext = engine.defaultDevice.audioContext;
        this._gainNode = new GainNode(this.audioContext);

        this.webAudioInputNode.connect(this.outputBus.webAudioInputNode);

        if (options?.sourceUrl) {
            this._audioBufferPromise = fetch(options.sourceUrl)
                .then((response) => response.arrayBuffer())
                .then((arrayBuffer) => this.audioContext.decodeAudioData(arrayBuffer));
        }
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        const outputNode = this.webAudioOutputNode;
        if (!outputNode) {
            return;
        }

        if (node instanceof WebAudioMainBus) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioMainBus) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override async _createSoundInstance(): Promise<AbstractSoundInstance> {
        const instance = (await super._createSoundInstance()) as WebAudioStaticSoundInstance;

        instance.sourceNode.buffer = await this._audioBufferPromise;

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

    public get source(): WebAudioStaticSound {
        return this._source as WebAudioStaticSound;
    }

    constructor(source: WebAudioStaticSound) {
        super(source);

        this.sourceNode = new AudioBufferSourceNode(source.engine.defaultDevice.audioContext);

        this._connect(source);
    }

    public async play(): Promise<void> {
        await this.source.audioContext.resume();
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

        const outputNode = this.webAudioOutputNode;
        if (!outputNode) {
            return;
        }

        if (node instanceof WebAudioStaticSound) {
            outputNode.connect(node.webAudioInputNode);
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
