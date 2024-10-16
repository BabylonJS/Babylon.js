import type { Nullable } from "../../../types";
import { AbstractAudioDevice } from "../abstractAudioDevice";
import type { AbstractAudioEngine } from "../abstractAudioEngine";
import type { IWebAudioDeviceOptions } from "./webAudioEngine";

/** @internal */
export class WebAudioDevice extends AbstractAudioDevice {
    private _audioContext: AudioContext;

    private async _initAudioContext(resolve: (audioContext: AudioContext) => void): Promise<void> {
        this._audioContext = new AudioContext();
        await this._audioContext.resume();
        resolve(this._audioContext);
    }

    public audioContext = new Promise<AudioContext>((resolve) => {
        if (this._audioContext) {
            resolve(this._audioContext);
        } else {
            document.addEventListener("click", this._initAudioContext.bind(this, resolve), { once: true });
        }
    });

    public get webAudioInputNode(): Nullable<AudioNode> {
        return this._audioContext.destination ?? null;
    }

    public constructor(name: string, engine: AbstractAudioEngine, options: Nullable<IWebAudioDeviceOptions> = null) {
        super(name, engine);
    }
}
