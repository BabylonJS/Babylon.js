import { BaseTranslation } from './BaseTranslation';
import { FreeCamera } from '../freeCamera';
import { Coordinate } from '../../Maths/math.axis';
import { Matrix, Vector3 } from '../../Maths/math.vector';

/**
 * A handler to move a FreeCamera in a single axis relative to it's self.
 */
export class FreeCameraMoveRelative extends BaseTranslation {
    protected readonly _baseName: string = 'freeCameraMoveRelative_';

    constructor(public coordinate: Coordinate, protected _camera: FreeCamera) {
        // Pass the text representation of the coordinate to the parent class.
        super(_camera);
        this.name = this._baseName + Coordinate[coordinate];
    }

    private _translation: Vector3 = Vector3.Zero();
    private _cameraTransformMatrix: Matrix = Matrix.Zero();
    private _transformedDirection: Vector3 = Vector3.Zero();

    public updateCamera(value: number): void {
        this._translation.setAll(0);
        this._camera.getViewMatrix().invertToRef(this._cameraTransformMatrix);

        switch (this.coordinate) {
            case Coordinate.X:
                this._translation.set(value, 0, 0);
                break;
            case Coordinate.Y:
                this._translation.set(0, value, 0);
                break;
            case Coordinate.Z:
                this._translation.set(0, 0, value);
                if (this._camera.getScene().useRightHandedSystem) {
                    this._translation.z *= -1;
                }
                break;
        }
        
        Vector3.TransformNormalToRef(
            this._translation, this._cameraTransformMatrix, this._transformedDirection);
        this._camera.cameraDirection.addInPlace(this._transformedDirection);
    }
}

/**
 * A handler to rotate a FreeCamera in a single axis.
 */
export class FreeCameraRotateRelative extends BaseTranslation {
    protected readonly _baseName: string = 'freeCameraRotateRelative_';

    constructor(public coordinate: Coordinate, protected _camera: FreeCamera) {
        // Pass the text representation of the coordinate to the parent class.
        super(_camera);
        this.name = this._baseName + Coordinate[coordinate];
    }

    public updateCamera(value: number): void {
        switch (this.coordinate) {
            case Coordinate.X:
                this._camera.cameraRotation.x += value / 200;
                break;
            case Coordinate.Y:
                this._camera.cameraRotation.y += value / 200;
                break;
        }
    }
}

/**
 * A handler to move a FreeCamera in a single axis relative to the scene.
 */
export class FreeCameraMoveScene extends BaseTranslation {
    protected readonly _baseName: string = 'freeCameraMoveScene_';

    constructor(public coordinate: Coordinate, protected _camera: FreeCamera) {
        // Pass the text representation of the coordinate to the parent class.
        super(_camera);
        this.name = this._baseName + Coordinate[coordinate];
    }

    private _translation: Vector3 = Vector3.Zero();

    public updateCamera(value: number): void {
        this._translation.setAll(0);

        switch (this.coordinate) {
            case Coordinate.X:
                this._translation.x += value;
                break;
            case Coordinate.Y:
                this._translation.y += value;
                break;
            case Coordinate.Z:
                this._translation.z += value;
                break;
        }

        this._camera.cameraDirection.addInPlace(this._translation);
    }
}
