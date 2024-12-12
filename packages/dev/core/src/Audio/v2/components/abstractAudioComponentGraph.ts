import type { Nullable } from "../../../types";
import type { AbstractAudioComponent } from "./abstractAudioComponent";

/** @internal */
export abstract class _AbstractAudioComponentGraph {
    protected abstract _getComponent(componentClassName: string): Nullable<AbstractAudioComponent>;

    protected _updateComponents(): void {
        const stereoComponent = this._getComponent("Stereo");
        const volumeComponent = this._getComponent("Volume");

        stereoComponent?.disconnect();
        volumeComponent?.disconnect();

        if (stereoComponent && volumeComponent) {
            stereoComponent.connect(volumeComponent);
        }
    }
}
