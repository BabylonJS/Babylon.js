import type { Nullable } from "../../../types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { AbstractSoundInstance } from "../abstractSoundInstance";
import { AbstractStaticSound } from "../abstractStaticSound";
import { AbstractStaticSoundInstance } from "../abstractStaticSoundInstance";
import { WebAudioBus, WebAudioMainBus } from "./webAudioBus";
import { WebAudioDevice } from "./webAudioDevice";
import type { IWebAudioStaticSoundOptions, WebAudioEngine } from "./webAudioEngine";

/** @internal */
export class WebAudioStaticSound extends AbstractStaticSound {
    private _gainNode: Nullable<GainNode> = null;
    private _audioBuffer: Nullable<AudioBuffer> = null;

    public audioContext: Nullable<AudioContext> = null;

    public get webAudioInputNode() {
        return this._gainNode;
    }

    public get webAudioOutputNode() {
        return this._gainNode;
    }

    constructor(name: string, engine: WebAudioEngine, options: Nullable<IWebAudioStaticSoundOptions> = null) {
        super(name, engine, options);
    }

    public override async init(options: Nullable<IWebAudioStaticSoundOptions> = null): Promise<void> {
        await super.init(options);

        this.audioContext = await (this.engine.defaultDevice as WebAudioDevice).audioContext;
        this._gainNode = new GainNode(this.audioContext);

        if (this.outputBus) {
            this._connect(this.outputBus);
        }

        if (options?.sourceUrl) {
            const response = await fetch(options.sourceUrl);
            const arrayBuffer = await response.arrayBuffer();
            this._audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        }
    }

    public onSoundInstanceEnded(instance: AbstractSoundInstance): void {
        this._onSoundInstanceEnded(instance);
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioMainBus) {
            this.webAudioOutputNode?.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioMainBus || node instanceof WebAudioBus) {
            this.webAudioOutputNode?.disconnect(node.webAudioInputNode);
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
    public sourceNode: Nullable<AudioBufferSourceNode> = null;

    public get currentTime(): number {
        return 0;
    }

    public get webAudioOutputNode(): Nullable<AudioNode> {
        return this.sourceNode;
    }

    constructor(source: WebAudioStaticSound) {
        super(source);
    }

    public override async init(): Promise<void> {
        await super.init();

        this.sourceNode = new AudioBufferSourceNode((this._source as WebAudioStaticSound).audioContext!);

        this._connect(this._source);
    }

    public async play(): Promise<void> {
        if (!this.sourceNode) {
            return;
        }

        this.sourceNode.addEventListener("ended", this._onEnded.bind(this), { once: true });
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

        this.sourceNode?.stop();
    }

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

    protected override _onEnded(): void {
        (this._source as WebAudioStaticSound).onSoundInstanceEnded(this);

        this.sourceNode?.removeEventListener("ended", this._onEnded.bind(this));
    }
}
