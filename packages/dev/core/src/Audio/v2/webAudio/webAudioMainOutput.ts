import type { AbstractAudioEngine } from "../abstractAudioEngine";
import { MainAudioOutput } from "../mainAudioOutput";
import type { WebAudioEngine } from "./webAudioEngine";

/**
 * Creates a new main audio output.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created audio output.
 */
export async function CreateMainAudioOutputAsync(engine: AbstractAudioEngine): Promise<MainAudioOutput> {
    if (!engine.isWebAudio) {
        throw new Error("Wrong engine type.");
    }

    const mainAudioOutput = new WebAudioMainOutput(engine);
    await mainAudioOutput.init();
    return mainAudioOutput;
}

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
        this._destinationNode = (await (this.engine as WebAudioEngine).audioContext).destination;
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioMainOutput";
    }
}
