import type { AbstractAudioEngine } from "../audioEngine";
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
    private _gainNode: GainNode;

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._gainNode;
    }

    /** @internal */
    constructor(engine: AbstractAudioEngine) {
        super(engine);
    }

    /** @internal */
    public async init(): Promise<void> {
        const audioContext = await (this.engine as WebAudioEngine).audioContext;

        this._gainNode = new GainNode(audioContext);
        this._destinationNode = audioContext.destination;

        this._gainNode.connect(this._destinationNode);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioMainOutput";
    }
}
