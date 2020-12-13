import { BaseTranslation } from './BaseTranslation';
import { FreeCamera } from '../freeCamera';
import { Vector3 } from '../../Maths/math.vector';

/**
 * A demonstration handler that can be attached to an arbitrary input.
 * It moves the camera in a circular motion.
 */
export class SomeUserDefinedTranslation extends BaseTranslation {
    name = 'myTranslation'
    private _angle = 0;
    private _offset = Vector3.Zero();
    private _translationMoverelativeX: BaseTranslation;
    private _translationMoverelativeZ: BaseTranslation;

    constructor(protected _camera: FreeCamera, private _radius: number = 10) {
        super(_camera);

        // Save references to these other handlers so we can use them to move the camera.
        this._translationMoverelativeX =
            <BaseTranslation>this._camera.getTranslation('freeCameraMoveRelative_X');
        this._translationMoverelativeZ =
            <BaseTranslation>this._camera.getTranslation('freeCameraMoveRelative_Z');
    }

    public updateCamera(value: number): void {
        if( value === 0) {
            return;
        }
        this._angle += value * Math.PI / 180;
        while(this._angle >= 2 * Math.PI) {
            this._angle -= 2 * Math.PI;
        }
        while(this._angle < 0) {
            this._angle += 2 * Math.PI;
        }

        this._angle += value;

        this._translationMoverelativeX.updateCamera(-this._offset.x);
        this._translationMoverelativeZ.updateCamera(-this._offset.z);
        this._offset.x = this._radius * Math.cos(this._angle);
        this._offset.z = this._radius * Math.sin(this._angle);
        this._translationMoverelativeX.updateCamera(this._offset.x);
        this._translationMoverelativeZ.updateCamera(this._offset.z);
    }
}
