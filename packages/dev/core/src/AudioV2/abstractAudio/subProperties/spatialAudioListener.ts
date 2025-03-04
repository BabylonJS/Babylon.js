import type { ISpatialAudioListenerOptions } from "./abstractSpatialAudioListener";
import { _SpatialAudioListenerDefaults, AbstractSpatialAudioListener } from "./abstractSpatialAudioListener";

/** @internal */
export abstract class _SpatialAudioListener extends AbstractSpatialAudioListener {
    /** @internal */
    public dispose(): void {}

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioListenerOptions>): void {
        if (options.listenerPosition !== undefined) {
            this.position = options.listenerPosition.clone();
        }

        if (options.listenerRotationQuaternion !== undefined) {
            this.rotationQuaternion = options.listenerRotationQuaternion.clone();
        } else if (options.listenerRotation !== undefined) {
            this.rotation = options.listenerRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioListenerDefaults.rotationQuaternion.clone();
        }
    }
}
