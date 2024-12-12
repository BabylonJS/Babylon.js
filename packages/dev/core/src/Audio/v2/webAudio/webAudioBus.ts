import type { Nullable } from "core/types";
import type { IAudioBusOptions } from "../audioBus";
import { AudioBus } from "../audioBus";
import type { AbstractAudioSubNode } from "../subNodes/abstractAudioSubNode";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioNode } from "./webAudioNode";

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

    protected override _onComponentAdded(component: AbstractAudioSubNode): void {
        //
    }

    protected override _onComponentRemoved(component: AbstractAudioSubNode): void {
        //
    }

    protected override _connect(node: IWebAudioNode): void {
        this._gainNode.connect(node.webAudioInputNode);
    }

    protected override _disconnect(node: IWebAudioNode): void {
        this._gainNode.disconnect(node.webAudioInputNode);
    }
}
