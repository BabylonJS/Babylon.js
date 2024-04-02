import type { Nullable } from "../types";
import { serialize, serializeAsMeshReference } from "../Misc/decorators";
import { Tools } from "../Misc/tools";
import { TargetCamera } from "./targetCamera";
import type { Scene } from "../scene";
import { TmpVectors, Vector3 } from "../Maths/math.vector";
import { Node } from "../node";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { FollowCameraInputsManager } from "./followCameraInputsManager";
Node.AddNodeConstructor("FollowCamera", (name, scene) => {
    return () => new FollowCamera(name, Vector3.Zero(), scene);
});

Node.AddNodeConstructor("ArcFollowCamera", (name, scene) => {
    return () => new ArcFollowCamera(name, 0, 0, 1.0, null, scene);
});

/**
 * A follow camera takes a mesh as a target and follows it as it moves. Both a free camera version followCamera and
 * an arc rotate version arcFollowCamera are available.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
 */
export class FollowCamera extends TargetCamera {
    /**
     * Distance the follow camera should follow an object at
     */
    @serialize()
    public radius: number = 12;

    /**
     * Minimum allowed distance of the camera to the axis of rotation
     * (The camera can not get closer).
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public lowerRadiusLimit: Nullable<number> = null;

    /**
     * Maximum allowed distance of the camera to the axis of rotation
     * (The camera can not get further).
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public upperRadiusLimit: Nullable<number> = null;

    /**
     * Define a rotation offset between the camera and the object it follows
     */
    @serialize()
    public rotationOffset: number = 0;

    /**
     * Minimum allowed angle to camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public lowerRotationOffsetLimit: Nullable<number> = null;

    /**
     * Maximum allowed angle to camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public upperRotationOffsetLimit: Nullable<number> = null;

    /**
     * Define a height offset between the camera and the object it follows.
     * It can help following an object from the top (like a car chasing a plane)
     */
    @serialize()
    public heightOffset: number = 4;

    /**
     * Minimum allowed height of camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public lowerHeightOffsetLimit: Nullable<number> = null;

    /**
     * Maximum allowed height of camera position relative to target object.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public upperHeightOffsetLimit: Nullable<number> = null;

    /**
     * Define how fast the camera can accelerate to follow it s target.
     */
    @serialize()
    public cameraAcceleration: number = 0.05;

    /**
     * Define the speed limit of the camera following an object.
     */
    @serialize()
    public maxCameraSpeed: number = 20;

    /**
     * Define the target of the camera.
     */
    @serializeAsMeshReference("lockedTargetId")
    public lockedTarget: Nullable<AbstractMesh>;

    /**
     * Defines the input associated with the camera.
     */
    public inputs: FollowCameraInputsManager;

    /**
     * Instantiates the follow camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
     * @param name Define the name of the camera in the scene
     * @param position Define the position of the camera
     * @param scene Define the scene the camera belong to
     * @param lockedTarget Define the target of the camera
     */
    constructor(name: string, position: Vector3, scene?: Scene, lockedTarget: Nullable<AbstractMesh> = null) {
        super(name, position, scene);

        this.lockedTarget = lockedTarget;
        this.inputs = new FollowCameraInputsManager(this);
        this.inputs.addKeyboard().addMouseWheel().addPointers();
        // Uncomment the following line when the relevant handlers have been implemented.
        // this.inputs.addKeyboard().addMouseWheel().addPointers().addVRDeviceOrientation();
    }

    private _follow(cameraTarget: AbstractMesh) {
        if (!cameraTarget) {
            return;
        }

        const rotMatrix = TmpVectors.Matrix[0];
        cameraTarget.absoluteRotationQuaternion.toRotationMatrix(rotMatrix);
        const yRotation = Math.atan2(rotMatrix.m[8], rotMatrix.m[10]);

        const radians = Tools.ToRadians(this.rotationOffset) + yRotation;
        const targetPosition = cameraTarget.getAbsolutePosition();
        const targetX: number = targetPosition.x + Math.sin(radians) * this.radius;

        const targetZ: number = targetPosition.z + Math.cos(radians) * this.radius;
        const dx: number = targetX - this.position.x;
        const dy: number = targetPosition.y + this.heightOffset - this.position.y;
        const dz: number = targetZ - this.position.z;
        let vx: number = dx * this.cameraAcceleration * 2; //this is set to .05
        let vy: number = dy * this.cameraAcceleration;
        let vz: number = dz * this.cameraAcceleration * 2;

        if (vx > this.maxCameraSpeed || vx < -this.maxCameraSpeed) {
            vx = vx < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        if (vy > this.maxCameraSpeed || vy < -this.maxCameraSpeed) {
            vy = vy < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        if (vz > this.maxCameraSpeed || vz < -this.maxCameraSpeed) {
            vz = vz < 1 ? -this.maxCameraSpeed : this.maxCameraSpeed;
        }

        this.position = new Vector3(this.position.x + vx, this.position.y + vy, this.position.z + vz);
        this.setTarget(targetPosition);
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void;
    /**
     * Attached controls to the current camera.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(ignored: any, noPreventDefault?: boolean): void {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this.inputs.attachElement(noPreventDefault);

        this._reset = () => {};
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public detachControl(): void {
        this.inputs.detachElement();

        if (this._reset) {
            this._reset();
        }
    }

    /** @internal */
    public _checkInputs(): void {
        this.inputs.checkInputs();
        this._checkLimits();
        super._checkInputs();
        if (this.lockedTarget) {
            this._follow(this.lockedTarget);
        }
    }

    private _checkLimits() {
        if (this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit) {
            this.radius = this.lowerRadiusLimit;
        }
        if (this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit) {
            this.radius = this.upperRadiusLimit;
        }

        if (this.lowerHeightOffsetLimit !== null && this.heightOffset < this.lowerHeightOffsetLimit) {
            this.heightOffset = this.lowerHeightOffsetLimit;
        }
        if (this.upperHeightOffsetLimit !== null && this.heightOffset > this.upperHeightOffsetLimit) {
            this.heightOffset = this.upperHeightOffsetLimit;
        }

        if (this.lowerRotationOffsetLimit !== null && this.rotationOffset < this.lowerRotationOffsetLimit) {
            this.rotationOffset = this.lowerRotationOffsetLimit;
        }
        if (this.upperRotationOffsetLimit !== null && this.rotationOffset > this.upperRotationOffsetLimit) {
            this.rotationOffset = this.upperRotationOffsetLimit;
        }
    }

    /**
     * Gets the camera class name.
     * @returns the class name
     */
    public getClassName(): string {
        return "FollowCamera";
    }
}

/**
 * Arc Rotate version of the follow camera.
 * It still follows a Defined mesh but in an Arc Rotate Camera fashion.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
 */
export class ArcFollowCamera extends TargetCamera {
    private _cartesianCoordinates: Vector3 = Vector3.Zero();

    /** Define the camera target (the mesh it should follow) */
    private _meshTarget: Nullable<AbstractMesh>;

    /**
     * Instantiates a new ArcFollowCamera
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#followcamera
     * @param name Define the name of the camera
     * @param alpha Define the rotation angle of the camera around the longitudinal axis
     * @param beta Define the rotation angle of the camera around the elevation axis
     * @param radius Define the radius of the camera from its target point
     * @param target Define the target of the camera
     * @param scene Define the scene the camera belongs to
     */
    constructor(
        name: string,
        /** The longitudinal angle of the camera */
        public alpha: number,
        /** The latitudinal angle of the camera */
        public beta: number,
        /** The radius of the camera from its target */
        public radius: number,
        /** Define the camera target (the mesh it should follow) */
        target: Nullable<AbstractMesh>,
        scene: Scene
    ) {
        super(name, Vector3.Zero(), scene);
        this.setMeshTarget(target);
    }

    /**
     * Sets the mesh to follow with this camera.
     * @param target the target to follow
     */
    public setMeshTarget(target: Nullable<AbstractMesh>) {
        this._meshTarget = target;
        this._follow();
    }

    private _follow(): void {
        if (!this._meshTarget) {
            return;
        }
        this._cartesianCoordinates.x = this.radius * Math.cos(this.alpha) * Math.cos(this.beta);
        this._cartesianCoordinates.y = this.radius * Math.sin(this.beta);
        this._cartesianCoordinates.z = this.radius * Math.sin(this.alpha) * Math.cos(this.beta);

        const targetPosition = this._meshTarget.getAbsolutePosition();
        this.position = targetPosition.add(this._cartesianCoordinates);
        this.setTarget(targetPosition);
    }

    /** @internal */
    public _checkInputs(): void {
        super._checkInputs();
        this._follow();
    }

    /**
     * Returns the class name of the object.
     * It is mostly used internally for serialization purposes.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcFollowCamera";
    }
}
