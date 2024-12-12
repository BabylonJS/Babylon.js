import type { AudioEngineV2 } from "../audioEngineV2";
import type { AbstractAudioSubNode } from "../components/abstractAudioComponent";
import { MainAudioBus } from "../mainAudioBus";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioNode } from "./webAudioNode";

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
export class _WebAudioMainBus extends MainAudioBus implements IWebAudioNode {
    private _gainNode: GainNode;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

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
        return "_WebAudioMainBus";
    }

    protected override _onComponentAdded(component: AbstractAudioSubNode): void {
        //
    }

    protected override _onComponentRemoved(component: AbstractAudioSubNode): void {
        //
    }

    protected override _connect(node: IWebAudioNode): void {
        super._connect(node);
        this.webAudioOutputNode.connect(node.webAudioInputNode);
    }

    protected override _disconnect(node: IWebAudioNode): void {
        super._disconnect(node);
        this.webAudioOutputNode.disconnect(node.webAudioInputNode);
    }
}
