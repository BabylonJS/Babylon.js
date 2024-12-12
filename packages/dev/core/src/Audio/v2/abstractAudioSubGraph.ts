import type { Nullable } from "../../types";
import type { AbstractAudioSubNode } from "./subNodes/abstractAudioSubNode";

/** @internal */
export abstract class _AbstractAudioSubGraph {
    protected abstract _getComponent(componentClassName: string): Nullable<AbstractAudioSubNode>;

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
