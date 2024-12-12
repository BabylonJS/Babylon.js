import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import type { AbstractAudioComponent } from "../components/abstractAudioComponent";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { _WebAudioMainOutput } from "./webAudioMainOutput";

/**
 * Options for creating a new WebAudio bus.
 */
export interface IWebAudioBusOptions extends IAudioBusOptions {}

/** @internal */
export class _WebAudioBus extends AudioBus {
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
    constructor(name: string, engine: _WebAudioEngine, options: Nullable<IWebAudioBusOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(): Promise<void> {
        this._gainNode = new GainNode(await (this.engine as _WebAudioEngine).audioContext);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioBus";
    }

    protected override _onComponentAdded(component: AbstractAudioComponent): void {
        //
    }

    protected override _onComponentRemoved(component: AbstractAudioComponent): void {
        //
    }

    protected override _connect(node: AbstractAudioNode): void {
        super._connect(node);

        if (node.getClassName() === "_WebAudioMainOutput" && (node as _WebAudioMainOutput).webAudioInputNode) {
            this.webAudioOutputNode.connect((node as _WebAudioMainOutput).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }

    protected override _disconnect(node: AbstractAudioNode): void {
        super._disconnect(node);

        if (node.getClassName() === "_WebAudioMainOutput" && (node as _WebAudioMainOutput).webAudioInputNode) {
            this.webAudioOutputNode.disconnect((node as _WebAudioMainOutput).webAudioInputNode);
        } else {
            throw new Error("Unsupported node type.");
        }
    }
}
