import type { Nullable } from "core/types";
import { AbstractAudioBus } from "../abstractAudioBus";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { WebAudioDevice } from "./webAudioDevice";
import type { AbstractWebAudioEngine, WebAudioBusOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioBus extends AbstractAudioBus {
    private _gainNode: GainNode;

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._gainNode;
    }

    /** @internal */
    public get webAudioOutputNode(): AudioNode {
        return this._gainNode;
    }

    /** @internal */
    constructor(name: string, engine: AbstractWebAudioEngine, options: Nullable<WebAudioBusOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
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
