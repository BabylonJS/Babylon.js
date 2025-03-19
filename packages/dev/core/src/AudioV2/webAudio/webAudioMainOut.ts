import { _MainAudioOut } from "../abstractAudio/mainAudioOut";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode } from "./webAudioNode";

/** @internal */
export class _WebAudioMainOut extends _MainAudioOut implements IWebAudioInNode {
    private _destinationNode: AudioDestinationNode;
    private _gainNode: GainNode;
    private _volume: number = 1;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

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
        return this._volume;
    }

    /** @internal */
    public set volume(value: number) {
        this._volume = value;
        this.engine._setAudioParam(this._gainNode.gain, value);
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
