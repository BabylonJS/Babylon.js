import { Observable } from "../../Misc/observable";
import type { AbstractSound } from "./abstractSound";
import { AbstractSoundInstance } from "./abstractSoundInstance";

/**
 * A streaming sound instance.
 */
export abstract class StreamingSoundInstance extends AbstractSoundInstance {
    /** Observable triggered when the instance is ready to play */
    public onReadyObservable = new Observable<StreamingSoundInstance>();

    protected constructor(source: AbstractSound) {
        super(source);
    }
}
