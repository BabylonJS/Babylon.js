/** This file must only contain pure code and pure imports */

import { Action } from "./action.pure";
import { type Condition } from "./condition.pure";
import { type Sound } from "../Audio/sound.pure";
import { RegisterClass } from "../Misc/typeStore";

/**
 * This defines an action helpful to play a defined sound on a triggered action.
 */
export class PlaySoundAction extends Action {
    private _sound: Sound;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param sound defines the sound to play
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, sound: Sound, condition?: Condition) {
        super(triggerOptions, condition);
        this._sound = sound;
    }

    /** @internal */
    public override _prepare(): void {}

    /**
     * Execute the action and play the sound.
     */
    public override execute(): void {
        if (this._sound !== undefined) {
            this._sound.play();
        }
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public override serialize(parent: any): any {
        return super._serialize(
            {
                name: "PlaySoundAction",
                properties: [{ name: "sound", value: this._sound.name }],
            },
            parent
        );
    }
}

/**
 * This defines an action helpful to stop a defined sound on a triggered action.
 */
export class StopSoundAction extends Action {
    private _sound: Sound;

    /**
     * Instantiate the action
     * @param triggerOptions defines the trigger options
     * @param sound defines the sound to stop
     * @param condition defines the trigger related conditions
     */
    constructor(triggerOptions: any, sound: Sound, condition?: Condition) {
        super(triggerOptions, condition);
        this._sound = sound;
    }

    /** @internal */
    public override _prepare(): void {}

    /**
     * Execute the action and stop the sound.
     */
    public override execute(): void {
        if (this._sound !== undefined) {
            this._sound.stop();
        }
    }

    /**
     * Serializes the actions and its related information.
     * @param parent defines the object to serialize in
     * @returns the serialized object
     */
    public override serialize(parent: any): any {
        return super._serialize(
            {
                name: "StopSoundAction",
                properties: [{ name: "sound", value: this._sound.name }],
            },
            parent
        );
    }
}

let _registered = false;
export function registerDirectAudioActions(): void {
    if (_registered) {
        return;
    }
    _registered = true;

    RegisterClass("BABYLON.PlaySoundAction", PlaySoundAction);
    RegisterClass("BABYLON.StopSoundAction", StopSoundAction);
}
