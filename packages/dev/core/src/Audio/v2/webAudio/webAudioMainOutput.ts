import type { AudioEngineV2 } from "../audioEngineV2";
import { MainAudioOutput } from "../mainAudioOutput";
import type { WebAudioEngine } from "./webAudioEngine";

/**
 * Creates a new main audio output.
 * @param engine - The audio engine.
 * @returns A promise that resolves with the created audio output.
 */
export async function CreateMainAudioOutputAsync(engine: AudioEngineV2): Promise<MainAudioOutput> {
    if (!engine.isWebAudio) {
        throw new Error("Wrong engine type.");
    }

    const mainAudioOutput = new WebAudioMainOutput(engine);
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
    constructor(engine: AudioEngineV2) {
        super(engine);

        const audioContext = (this.engine as WebAudioEngine).audioContext;

        this._gainNode = new GainNode(audioContext);
        this._destinationNode = audioContext.destination;

        this._gainNode.connect(this._destinationNode);
    }

    /** @internal */
    public getClassName(): string {
        return "WebAudioMainOutput";
    }
}
