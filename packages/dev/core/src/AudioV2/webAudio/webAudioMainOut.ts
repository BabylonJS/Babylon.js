import type { Nullable } from "../../types";
import { _MainAudioOut } from "../abstractAudio/mainAudioOut";
import type { IAudioParameterRampOptions } from "../audioParameter";
import { _WebAudioParameterComponent } from "./components/webAudioParameterComponent";
import type { _WebAudioEngine } from "./webAudioEngine";
import type { IWebAudioInNode } from "./webAudioNode";

/** @internal */
export class _WebAudioMainOut extends _MainAudioOut implements IWebAudioInNode {
    private _destinationNode: AudioDestinationNode;
    private _gainNode: GainNode;
    private _volume: _WebAudioParameterComponent;

    /** @internal */
    public override readonly engine: _WebAudioEngine;

    /** @internal */
    public constructor(engine: _WebAudioEngine) {
        super(engine);

        const audioContext = engine._audioContext;

        this._gainNode = new GainNode(audioContext);
        this._destinationNode = audioContext.destination;

        this._gainNode.connect(this._destinationNode);

        this._volume = new _WebAudioParameterComponent(this.engine, this._gainNode.gain);
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._volume.dispose();
        this._gainNode.disconnect();
        this._destinationNode.disconnect();
    }

    /** @internal */
    public get _inNode(): AudioNode {
        return this._gainNode;
    }

    /** @internal */
    public get volume(): number {
        return this._volume.targetValue;
    }

    /** @internal */
    public set volume(value: number) {
        this._volume.targetValue = value;
    }

    /** @internal */
    public getClassName(): string {
        return "_WebAudioMainOut";
    }

    /** @internal */
    public setVolume(value: number, options: Nullable<Partial<IAudioParameterRampOptions>> = null): void {
        this._volume.setTargetValue(value, options);
    }
}
