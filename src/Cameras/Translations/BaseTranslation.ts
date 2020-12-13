import { Camera } from '../camera';

/**
 * A camera Translation is a callback that alters a camera property.
 * It is typically (but not be limited to being) called by code managing user
 * inputs.
 */
// TODO(mrdunk): Investigate whether using BABYLON.Behaviour<T> is viable here?
export abstract class BaseTranslation {
    protected _baseName: string;
    public name: string;

    constructor(protected _camera: Camera) {}

    /**
     * Called to actually affect the camera.
     */
    abstract updateCamera(value?: number): void;
}
