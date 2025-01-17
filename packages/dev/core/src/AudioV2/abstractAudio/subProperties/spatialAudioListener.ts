import { _SpatialAudioListenerDefaults, AbstractSpatialAudioListener, type ISpatialAudioListenerOptions } from "./abstractSpatialAudioListener";

/** @internal */
export abstract class _SpatialAudioListener extends AbstractSpatialAudioListener {
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
            this.rotationQuaternion = _SpatialAudioListenerDefaults.RotationQuaternion.clone();
        }
    }
}
