import type { Nullable } from "../../types";
import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioDevice } from "./abstractAudioDevice";
import type { AbstractAudioEngine } from "./abstractAudioEngine";

/**
 * Abstract class representing the main audio bus in the audio engine.
 */
export abstract class AbstractMainAudioBus extends AbstractAudioBusNode {
    private _device: Nullable<AbstractAudioDevice> = null;

    /** @internal */
    constructor(name: string, engine: AbstractAudioEngine) {
        super(name, engine);
    }

    /**
     * The audio device.
     */
    public get device(): Nullable<AbstractAudioDevice> {
        return this._device;
    }

    public set device(device: Nullable<AbstractAudioDevice>) {
        if (this._device == device) {
            return;
        }

        if (this._device) {
            this._disconnect(this._device);
        }

        this._device = device;

        if (device) {
            this._connect(device);
        }
    }
}
