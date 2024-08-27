/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioBusNode } from "./abstractAudioBusNode";
import type { AbstractAudioDevice } from "./abstractAudioDevice";
import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { Nullable } from "../../types";

export abstract class AbstractMainAudioBus extends AbstractAudioBusNode {
    public constructor(name: string, engine: AbstractAudioEngine) {
        super(name, engine);
    }

    private _device: Nullable<AbstractAudioDevice> = null;

    public get device(): Nullable<AbstractAudioDevice> {
        return this._device;
    }

    public setDevice(device: Nullable<AbstractAudioDevice>) {
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
