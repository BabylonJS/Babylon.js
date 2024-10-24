import type { AbstractAudioNode } from "../abstractAudioNode";
import { AbstractMainAudioBus } from "../abstractMainAudioBus";
import type { AbstractWebAudioEngine, WebAudioEngine } from "./webAudioEngine";
import { WebAudioMainOutput } from "./webAudioMainOutput";

/** @internal */
export class WebAudioMainBus extends AbstractMainAudioBus {
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
    constructor(name: string, engine: AbstractWebAudioEngine) {
        super(name, engine);
    }

    /** @internal */
    public async init(): Promise<void> {
        this._gainNode = new GainNode(await (this.engine as WebAudioEngine).audioContext);

        if (this.engine.mainOutput) {
            this._connect(this.engine.mainOutput);
        }
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node instanceof WebAudioMainOutput && node.webAudioInputNode) {
            this.webAudioOutputNode.connect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node instanceof WebAudioMainOutput && node.webAudioInputNode) {
            this.webAudioOutputNode.disconnect(node.webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
