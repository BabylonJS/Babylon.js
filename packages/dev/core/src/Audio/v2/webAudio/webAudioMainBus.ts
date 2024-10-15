import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractMainAudioBus } from "../abstractMainAudioBus";
import { WebAudioDevice } from "./webAudioDevice";
import type { WebAudioEngine } from "./webAudioEngine";

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

        const device = engine.defaultDevice as WebAudioDevice;
        this._gainNode = new GainNode(device.audioContext);
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioDevice) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioDevice) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
