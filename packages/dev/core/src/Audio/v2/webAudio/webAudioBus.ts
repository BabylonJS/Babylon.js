import type { Nullable } from "core/types";
import type { AbstractAudioNode } from "../abstractAudioNode";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import type { AudioPositioner } from "../audioPositioner";
import type { WebAudioEngine } from "./webAudioEngine";
import type { WebAudioMainOutput } from "./webAudioMainOutput";
import { CreateAudioPositionerAsync } from "./webAudioPositioner";

/**
 * Options for creating a new WebAudioBus.
 */
export interface IWebAudioBusOptions extends IAudioBusOptions {}

/** @internal */
export class WebAudioBus extends AudioBus {
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
    constructor(name: string, engine: WebAudioEngine, options: Nullable<IWebAudioBusOptions> = null) {
        super(name, engine, options);
    }

    /** @internal */
    public async init(): Promise<void> {
        this._gainNode = new GainNode(await (this.engine as WebAudioEngine).audioContext);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioBus";
    }

    protected override _createPositioner(): Promise<AudioPositioner> {
        return CreateAudioPositionerAsync(this);
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
