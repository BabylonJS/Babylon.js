import { Camera } from "../../Cameras/camera";
import { UniversalCamera } from "../../Cameras/universalCamera";
import { Scene } from "../../scene";
import { Matrix, Vector3 } from "../../Maths/math.vector";
import { Nullable } from "../../types";
import { TargetCamera } from "../targetCamera";
import { TransformNode } from "../../Meshes/transformNode";
import { Viewport } from "../../Maths/math.viewport";

/**
 * Camera used to simulate stereoscopic rendering (based on UniversalCamera)
 * @see https://doc.babylonjs.com/features/cameras
 */
export class StereoscopicScreenUniversalCamera extends UniversalCamera {

    private _dirty = true;
    private _distanceToProjectionPlane: number;
    private _distanceBetweenEyes: number;

    public set distanceBetweenEyes(newValue: number) {
        this._dirty = true;
        this._distanceBetweenEyes = newValue;
    }

    public get distanceBetweenEyes(): number {
        return this._distanceBetweenEyes;
    }

    public set distanceToProjectionPlane(newValue: number) {
        this._dirty = true;
        this._distanceToProjectionPlane = newValue;
    }

    public get distanceToProjectionPlane(): number {
        return this._distanceToProjectionPlane;
    }
    /**
     * Creates a new StereoscopicScreenUniversalCamera
     * @param name defines camera name
     * @param position defines initial position
     * @param scene defines the hosting scene
     * @param _distanceToProjectionPlane defines distance between each color axis
     * @param distanceBetweenEyes defines is stereoscopic is done side by side or over under
     */
    constructor(name: string, position: Vector3, scene: Scene, _distanceToProjectionPlane: number = 1, distanceBetweenEyes: number = 0.0325) {
        super(name, position, scene);
        this._distanceBetweenEyes = distanceBetweenEyes;
        this._distanceToProjectionPlane = _distanceToProjectionPlane;
        this.setCameraRigMode(Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL, {});
    }

    /**
     * Gets camera class name
     * @returns StereoscopicScreenUniversalCamera
     */
    public getClassName(): string {
        return "StereoscopicUniversalCamera";
    }

    /**
     * @hidden
     */
    public createRigCamera(name: string, cameraIndex: number): Nullable<Camera> {
        const camera = new TargetCamera(name, Vector3.Zero(), this.getScene());
        const transform = new TransformNode('tm' + name, this.getScene());
        camera.parent = transform;
        transform.setPivotMatrix(Matrix.Identity(), false);
        transform.parent = this;
        camera.isRigCamera = true;
        camera.rigParent = this;
        return camera;
    }

    /**
     * @hidden
     */
    public _updateRigCameras() {
        super._updateRigCameras();
        if (this._dirty) {
            for (let cameraIndex = 0; cameraIndex < this._rigCameras.length; cameraIndex++) {
                this._updateCamera(this._rigCameras[cameraIndex] as TargetCamera, cameraIndex);
            }
            this._dirty = false;
        }
    }

    private _updateCamera(camera: TargetCamera, cameraIndex: number) {
        const b = cameraIndex === 0 ? this.distanceBetweenEyes : -this.distanceBetweenEyes;
        const z = cameraIndex === 0 ? this.distanceBetweenEyes / this.distanceToProjectionPlane : -this.distanceBetweenEyes / this.distanceToProjectionPlane;
        camera.position.set(-b, 0, -this.distanceToProjectionPlane);
        camera.setTarget(new Vector3(-b, 0, 0));
        const transform = camera.parent as TransformNode;
        const m = transform.getPivotMatrix();
        m.setTranslationFromFloats(b, 0, 0);
        m.setRowFromFloats(2, z, 0, 1, 0);
    }

    protected _setRigMode() {
        this._rigCameras[0].viewport = new Viewport(0, 0, 0.5, 1);
        this._rigCameras[1].viewport = new Viewport(0.5, 0, 0.5, 1.0);
        for (let cameraIndex = 0; cameraIndex < this._rigCameras.length; cameraIndex++) {
            this._updateCamera(this._rigCameras[cameraIndex] as TargetCamera, cameraIndex);
        }
    }
}
