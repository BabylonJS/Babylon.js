import type { AbstractAudioEngine } from "../abstractAudioEngine";
import { AbstractMainAudioOutput } from "../abstractMainAudioOutput";
import type { WebAudioEngine } from "./webAudioEngine";

/** @internal */
export class WebAudioMainOutput extends AbstractMainAudioOutput {
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
        this._destinationNode = (await (this.engine as WebAudioEngine).audioContext).destination;
    }
}
