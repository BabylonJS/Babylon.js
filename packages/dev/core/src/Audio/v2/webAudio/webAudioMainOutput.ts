import type { AbstractAudioEngine } from "../abstractAudioEngine";
import { MainAudioOutput } from "../mainAudioOutput";
import type { InternalWebAudioEngine } from "./webAudioEngine";

/** @internal */
export class WebAudioMainOutput extends MainAudioOutput {
    private _destinationNode: AudioDestinationNode;

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._destinationNode;
    }

    /** @internal */
    constructor(engine: AbstractAudioEngine) {
        super(engine);
    }

    /** @internal */
    public async init(): Promise<void> {
        this._destinationNode = (await (this.engine as InternalWebAudioEngine).audioContext).destination;
    }
}
