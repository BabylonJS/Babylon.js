import type { AudioEngineV2 } from "../abstractAudio/audioEngineV2";
import { _MainAudioOut } from "../abstractAudio/mainAudioOut";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode } from "./webAudioNode";
import { _GetWebAudioEngine } from "./webAudioUtils";

/** @internal */
export async function _CreateMainAudioOutAsync(engine: AudioEngineV2): Promise<_WebAudioMainOut> {
    const mainAudioOutput = new _WebAudioMainOut(_GetWebAudioEngine(engine));
    return mainAudioOutput;
}

/** @internal */
export class _WebAudioMainOut extends _MainAudioOut implements IWebAudioInNode {
    private _destinationNode: AudioDestinationNode;
    private _gainNode: GainNode;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        const audioContext = engine.audioContext;

        this._gainNode = new GainNode(audioContext);
        this._destinationNode = audioContext.destination;

        this._gainNode.connect(this._destinationNode);
    }

    /** @internal */
    public get inNode(): AudioNode {
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
    public override dispose(): void {
        super.dispose();

        this._gainNode.disconnect();
        this._destinationNode.disconnect();
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioMainOut";
    }
}
