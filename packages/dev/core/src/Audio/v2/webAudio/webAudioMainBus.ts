import type { AudioEngineV2 } from "../audioEngineV2";
import type { AbstractAudioNode } from "../abstractAudioNode";
import { MainAudioBus } from "../mainAudioBus";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { _WebAudioMainOutput } from "./webAudioMainOutput";

/**
 * Creates a new main audio bus.
 * @param name - The name of the main bus.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created main audio bus.
 */
export async function CreateMainAudioBusAsync(name: string, engine: AudioEngineV2): Promise<MainAudioBus> {
    if (!engine.isWebAudio) {
        throw new Error("Wrong engine type.");
    }

    const bus = new _WebAudioMainBus(name, engine as _WebAudioEngine);
    (engine as _WebAudioEngine).addMainBus(bus);
    return bus;
}

/** @internal */
export class _WebAudioMainBus extends MainAudioBus {
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
    constructor(name: string, engine: _WebAudioEngine) {
        super(name, engine);

        this._gainNode = new GainNode((this.engine as _WebAudioEngine).audioContext);

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

        if (node.getClassName() === "WebAudioMainOutput" && (node as _WebAudioMainOutput).webAudioInputNode) {
            this.webAudioOutputNode.connect((node as _WebAudioMainOutput).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node.getClassName() === "WebAudioMainOutput" && (node as _WebAudioMainOutput).webAudioInputNode) {
            this.webAudioOutputNode.disconnect((node as _WebAudioMainOutput).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
