import type { Nullable } from "core/types";
import type { IAudioBusOptions } from "../abstractAudioBus";
import { AbstractAudioBus } from "../abstractAudioBus";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractMainAudioBus } from "../abstractMainAudioBus";
import { WebAudioDevice } from "./webAudioDevice";
import type { WebAudioEngine } from "./webAudioEngine";

export interface IWebAudioBusOptions extends IAudioBusOptions {}

export class WebAudioBus extends AbstractAudioBus {
    private _gainNode: GainNode;

    public get webAudioInputNode(): AudioNode {
        return this._gainNode;
    }

    public get webAudioOutputNode(): AudioNode {
        return this._gainNode;
    }

    public constructor(name: string, engine: WebAudioEngine, options: Nullable<IWebAudioBusOptions> = null) {
        super(name, engine, options);
    }

    public async init(options: Nullable<IWebAudioBusOptions> = null): Promise<void> {
        const device = this.engine.defaultDevice as WebAudioDevice;
        this._gainNode = new GainNode(await device.audioContext);
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioDevice && node.webAudioInputNode) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioDevice && node.webAudioInputNode) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}

export class WebAudioMainBus extends AbstractMainAudioBus {
    private _gainNode: GainNode;

    public get webAudioInputNode(): AudioNode {
        return this._gainNode;
    }

    public get webAudioOutputNode(): AudioNode {
        return this._gainNode;
    }

    public constructor(name: string, engine: WebAudioEngine) {
        super(name, engine);
    }

    public async init(): Promise<void> {
        const device = this.engine.defaultDevice as WebAudioDevice;
        this._gainNode = new GainNode(await device.audioContext);
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioDevice && node.webAudioInputNode) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioDevice && node.webAudioInputNode) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
