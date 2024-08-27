/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import type { AbstractAudioEngine } from "./abstractAudioEngine";
import type { AbstractAudioListener } from "./abstractAudioListener";
import { AbstractNamedAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { Nullable } from "../../types";

export interface IAudioDeviceOptions {
    enableListener?: boolean;
}

export abstract class AbstractAudioDevice extends AbstractNamedAudioNode {
    public constructor(name: string, engine: AbstractAudioEngine, options?: IAudioDeviceOptions) {
        super(name, engine, AudioNodeType.Input);

        if (options?.enableListener) {
            this._listener = engine.createListener(this);
        }
    }

    private _listener: Nullable<AbstractAudioListener> = null;

    public get listener(): Nullable<AbstractAudioListener> {
        return this._listener;
    }
}
