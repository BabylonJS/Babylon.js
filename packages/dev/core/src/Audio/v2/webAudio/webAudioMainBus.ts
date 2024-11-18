import type { AbstractAudioEngine } from "../audioEngine";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { MainAudioBus } from "../mainAudioBus";
import type { WebAudioEngine } from "./webAudioEngine";
import type { WebAudioMainOutput } from "./webAudioMainOutput";

/**
 * Creates a new main audio bus.
 * @param name - The name of the main bus.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created main audio bus.
 */
export async function CreateMainAudioBusAsync(name: string, engine: AbstractAudioEngine): Promise<MainAudioBus> {
    if (!engine.isWebAudio) {
        throw new Error("Wrong engine type.");
    }

    const bus = new WebAudioMainBus(name, engine as WebAudioEngine);
    await bus.init();
    (engine as WebAudioEngine).addMainBus(bus);
    return bus;
}

/** @internal */
export class WebAudioMainBus extends MainAudioBus {
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
    constructor(name: string, engine: WebAudioEngine) {
        super(name, engine);
    }

    /** @internal */
    public async init(): Promise<void> {
        this._gainNode = new GainNode(await (this.engine as WebAudioEngine).audioContext);

        if (this.engine.mainOutput) {
            this._connect(this.engine.mainOutput);
        }
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioMainBus";
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node.getClassName() === "WebAudioMainOutput" && (node as WebAudioMainOutput).webAudioInputNode) {
            this.webAudioOutputNode.connect((node as WebAudioMainOutput).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node.getClassName() === "WebAudioMainOutput" && (node as WebAudioMainOutput).webAudioInputNode) {
            this.webAudioOutputNode.disconnect((node as WebAudioMainOutput).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
