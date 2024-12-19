import type { AudioEngineV2 } from "../audioEngineV2";
import { MainAudioOutput } from "../mainAudioOutput";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInputNode } from "./webAudioNode";

/** @internal */
export async function _CreateMainAudioOutputAsync(engine: AudioEngineV2): Promise<_WebAudioMainOutput> {
    if (!engine.isWebAudio) {
        throw new Error("Wrong engine type.");
    }

    const mainAudioOutput = new _WebAudioMainOutput(engine);
    return mainAudioOutput;
}

/** @internal */
export class _WebAudioMainOutput extends MainAudioOutput implements IWebAudioInputNode {
    private _destinationNode: AudioDestinationNode;
    private _gainNode: GainNode;

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._gainNode;
    }

    /** @internal */
    public get volume(): number {
        return this._gainNode.gain.value;
    }

    /** @internal */
    public set volume(value: number) {
        this._gainNode.gain.value = value;
    }

    /** @internal */
    public constructor(engine: AudioEngineV2) {
        super(engine);

        const audioContext = (this.engine as _WebAudioEngine).audioContext;

        this._gainNode = new GainNode(audioContext);
        this._destinationNode = audioContext.destination;

        this._gainNode.connect(this._destinationNode);
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioMainOutput";
    }
}
