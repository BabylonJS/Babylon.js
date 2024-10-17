import type { Nullable } from "../../../types";
import { AbstractAudioDevice } from "../abstractAudioDevice";
import type { AbstractAudioEngine } from "../abstractAudioEngine";
import type { WebAudioDeviceOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioDevice extends AbstractAudioDevice {
    private _audioContext: AudioContext;

    private async _initAudioContext(): Promise<void> {
        if (this._audioContext === undefined) {
            this._audioContext = new AudioContext();
        }

        await this._audioContext.resume();
        this._resolveAudioContext(this._audioContext);

        document.removeEventListener("click", this._initAudioContext);
    }

    private _resolveAudioContext: (audioContext: AudioContext) => void;

    /** @internal */
    public audioContext = new Promise<AudioContext>((resolve) => {
        this._resolveAudioContext = resolve;
        document.addEventListener("click", this._initAudioContext.bind(this), { once: true });
    });

    /** @internal */
    public get webAudioInputNode(): AudioNode {
        return this._audioContext.destination;
    }

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine, options: Nullable<WebAudioDeviceOptions> = null) {
        super(name, engine);

        if (options?.audioContext) {
            this._audioContext = options.audioContext;
            this._initAudioContext();
        }
    }
}
