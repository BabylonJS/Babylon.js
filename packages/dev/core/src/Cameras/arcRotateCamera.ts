import { serialize, serializeAsVector3, serializeAsMeshReference, serializeAsVector2 } from "../Misc/decorators";
import { Observable } from "../Misc/observable";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import { Matrix, Vector3, Vector2 } from "../Maths/math.vector";
import { Node } from "../node";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { AutoRotationBehavior } from "../Behaviors/Cameras/autoRotationBehavior";
import { BouncingBehavior } from "../Behaviors/Cameras/bouncingBehavior";
import { FramingBehavior } from "../Behaviors/Cameras/framingBehavior";
import { Camera } from "./camera";
import { TargetCamera } from "./targetCamera";
import type { ArcRotateCameraPointersInput } from "../Cameras/Inputs/arcRotateCameraPointersInput";
import type { ArcRotateCameraKeyboardMoveInput } from "../Cameras/Inputs/arcRotateCameraKeyboardMoveInput";
import type { ArcRotateCameraMouseWheelInput } from "../Cameras/Inputs/arcRotateCameraMouseWheelInput";
import { ArcRotateCameraInputsManager } from "../Cameras/arcRotateCameraInputsManager";
import { Epsilon } from "../Maths/math.constants";
import { Tools } from "../Misc/tools";

import type { Collider } from "../Collisions/collider";
import type { TransformNode } from "core/Meshes/transformNode";

Node.AddNodeConstructor("ArcRotateCamera", (name, scene) => {
    return () => new ArcRotateCamera(name, 0, 0, 1.0, Vector3.Zero(), scene);
});

/**
 * This represents an orbital type of camera.
 *
 * This camera always points towards a given target position and can be rotated around that target with the target as the centre of rotation. It can be controlled with cursors and mouse, or with touch events.
 * Think of this camera as one orbiting its target position, or more imaginatively as a spy satellite orbiting the earth. Its position relative to the target (earth) can be set by three parameters, alpha (radians) the longitudinal rotation, beta (radians) the latitudinal rotation and radius the distance from the target position.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#arc-rotate-camera
 */
export class ArcRotateCamera extends TargetCamera {
    /**
     * Defines the rotation angle of the camera along the longitudinal axis.
     */
    @serialize()
    public alpha: number;

    /**
     * Defines the rotation angle of the camera along the latitudinal axis.
     */
    @serialize()
    public beta: number;

    /**
     * Defines the radius of the camera from it s target point.
     */
    @serialize()
    public radius: number;

    /**
     * Defines an override value to use as the parameter to setTarget.
     * This allows the parameter to be specified when animating the target (e.g. using FramingBehavior).
     */
    @serialize()
    public overrideCloneAlphaBetaRadius: Nullable<boolean>;

    @serializeAsVector3("target")
    protected _target: Vector3;
    @serializeAsMeshReference("targetHost")
    protected _targetHost: Nullable<TransformNode>;

    /**
     * Defines the target point of the camera.
     * The camera looks towards it from the radius distance.
     */
    public get target(): Vector3 {
        return this._target;
    }
    public set target(value: Vector3) {
        this.setTarget(value);
    }

    /**
     * Defines the target transform node of the camera.
     * The camera looks towards it from the radius distance.
     * Please note that setting a target host will disable panning.
     */
    public get targetHost(): Nullable<TransformNode> {
        return this._targetHost;
    }
    public set targetHost(value: Nullable<TransformNode>) {
        if (value) {
            this.setTarget(value);
        }
    }

    /**
     * Return the current target position of the camera. This value is expressed in local space.
     * @returns the target position
     */
    public getTarget(): Vector3 {
        return this.target;
    }

    /**
     * Define the current local position of the camera in the scene
     */
    public get position(): Vector3 {
        return this._position;
    }

    public set position(newPosition: Vector3) {
        this.setPosition(newPosition);
    }

    protected _upToYMatrix: Matrix;
    protected _yToUpMatrix: Matrix;

    /**
     * The vector the camera should consider as up. (default is Vector3(0, 1, 0) as returned by Vector3.Up())
     * Setting this will copy the given vector to the camera's upVector, and set rotation matrices to and from Y up.
     * DO NOT set the up vector using copyFrom or copyFromFloats, as this bypasses setting the above matrices.
     */
    set upVector(vec: Vector3) {
        if (!this._upToYMatrix) {
            this._yToUpMatrix = new Matrix();
            this._upToYMatrix = new Matrix();

            this._upVector = Vector3.Zero();
        }

        vec.normalize();
        this._upVector.copyFrom(vec);
        this.setMatUp();
    }

    get upVector() {
        return this._upVector;
    }

    /**
     * Sets the Y-up to camera up-vector rotation matrix, and the up-vector to Y-up rotation matrix.
     */
    public setMatUp() {
        // from y-up to custom-up (used in _getViewMatrix)
        Matrix.RotationAlignToRef(Vector3.UpReadOnly, this._upVector, this._yToUpMatrix);

        // from custom-up to y-up (used in rebuildAnglesAndRadius)
        Matrix.RotationAlignToRef(this._upVector, Vector3.UpReadOnly, this._upToYMatrix);
    }

    /**
     * Current inertia value on the longitudinal axis.
     * The bigger this number the longer it will take for the camera to stop.
     */
    @serialize()
    public inertialAlphaOffset = 0;

    /**
     * Current inertia value on the latitudinal axis.
     * The bigger this number the longer it will take for the camera to stop.
     */
    @serialize()
    public inertialBetaOffset = 0;

    /**
     * Current inertia value on the radius axis.
     * The bigger this number the longer it will take for the camera to stop.
     */
    @serialize()
    public inertialRadiusOffset = 0;

    /**
     * Minimum allowed angle on the longitudinal axis.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public lowerAlphaLimit: Nullable<number> = null;

    /**
     * Maximum allowed angle on the longitudinal axis.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public upperAlphaLimit: Nullable<number> = null;

    /**
     * Minimum allowed angle on the latitudinal axis.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public lowerBetaLimit: Nullable<number> = 0.01;

    /**
     * Maximum allowed angle on the latitudinal axis.
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public upperBetaLimit: Nullable<number> = Math.PI - 0.01;

    /**
     * Minimum allowed distance of the camera to the target (The camera can not get closer).
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public lowerRadiusLimit: Nullable<number> = null;

    /**
     * Maximum allowed distance of the camera to the target (The camera can not get further).
     * This can help limiting how the Camera is able to move in the scene.
     */
    @serialize()
    public upperRadiusLimit: Nullable<number> = null;

    /**
     * Defines the current inertia value used during panning of the camera along the X axis.
     */
    @serialize()
    public inertialPanningX: number = 0;

    /**
     * Defines the current inertia value used during panning of the camera along the Y axis.
     */
    @serialize()
    public inertialPanningY: number = 0;

    /**
     * Defines the distance used to consider the camera in pan mode vs pinch/zoom.
     * Basically if your fingers moves away from more than this distance you will be considered
     * in pinch mode.
     */
    @serialize()
    public pinchToPanMaxDistance: number = 20;

    /**
     * Defines the maximum distance the camera can pan.
     * This could help keeping the camera always in your scene.
     */
    @serialize()
    public panningDistanceLimit: Nullable<number> = null;

    /**
     * Defines the target of the camera before panning.
     */
    @serializeAsVector3()
    public panningOriginTarget: Vector3 = Vector3.Zero();

    /**
     * Defines the value of the inertia used during panning.
     * 0 would mean stop inertia and one would mean no deceleration at all.
     */
    @serialize()
    public panningInertia = 0.9;

    //-- begin properties for backward compatibility for inputs

    /**
     * Gets or Set the pointer angular sensibility  along the X axis or how fast is the camera rotating.
     */
    public get angularSensibilityX(): number {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            return pointers.angularSensibilityX;
        }

        return 0;
    }

    public set angularSensibilityX(value: number) {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            pointers.angularSensibilityX = value;
        }
    }

    /**
     * Gets or Set the pointer angular sensibility along the Y axis or how fast is the camera rotating.
     */
    public get angularSensibilityY(): number {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            return pointers.angularSensibilityY;
        }

        return 0;
    }

    public set angularSensibilityY(value: number) {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            pointers.angularSensibilityY = value;
        }
    }

    /**
     * Gets or Set the pointer pinch precision or how fast is the camera zooming.
     */
    public get pinchPrecision(): number {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            return pointers.pinchPrecision;
        }

        return 0;
    }

    public set pinchPrecision(value: number) {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            pointers.pinchPrecision = value;
        }
    }

    /**
     * Gets or Set the pointer pinch delta percentage or how fast is the camera zooming.
     * It will be used instead of pinchDeltaPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when pinch zoom is used.
     */
    public get pinchDeltaPercentage(): number {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            return pointers.pinchDeltaPercentage;
        }

        return 0;
    }

    public set pinchDeltaPercentage(value: number) {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            pointers.pinchDeltaPercentage = value;
        }
    }

    /**
     * Gets or Set the pointer use natural pinch zoom to override the pinch precision
     * and pinch delta percentage.
     * When useNaturalPinchZoom is true, multi touch zoom will zoom in such
     * that any object in the plane at the camera's target point will scale
     * perfectly with finger motion.
     */
    public get useNaturalPinchZoom(): boolean {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            return pointers.useNaturalPinchZoom;
        }

        return false;
    }

    public set useNaturalPinchZoom(value: boolean) {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            pointers.useNaturalPinchZoom = value;
        }
    }

    /**
     * Gets or Set the pointer panning sensibility or how fast is the camera moving.
     */
    public get panningSensibility(): number {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            return pointers.panningSensibility;
        }

        return 0;
    }

    public set panningSensibility(value: number) {
        const pointers = <ArcRotateCameraPointersInput>this.inputs.attached["pointers"];
        if (pointers) {
            pointers.panningSensibility = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control beta angle in a positive direction.
     */
    public get keysUp(): number[] {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUp;
        }

        return [];
    }

    public set keysUp(value: number[]) {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUp = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control beta angle in a negative direction.
     */
    public get keysDown(): number[] {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDown;
        }

        return [];
    }

    public set keysDown(value: number[]) {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDown = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control alpha angle in a negative direction.
     */
    public get keysLeft(): number[] {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysLeft;
        }

        return [];
    }

    public set keysLeft(value: number[]) {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysLeft = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control alpha angle in a positive direction.
     */
    public get keysRight(): number[] {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRight;
        }

        return [];
    }

    public set keysRight(value: number[]) {
        const keyboard = <ArcRotateCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRight = value;
        }
    }

    /**
     * Gets or Set the mouse wheel precision or how fast is the camera zooming.
     */
    public get wheelPrecision(): number {
        const mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
        if (mousewheel) {
            return mousewheel.wheelPrecision;
        }

        return 0;
    }

    public set wheelPrecision(value: number) {
        const mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
        if (mousewheel) {
            mousewheel.wheelPrecision = value;
        }
    }

    /**
     * Gets or Set the boolean value that controls whether or not the mouse wheel
     * zooms to the location of the mouse pointer or not.  The default is false.
     */
    @serialize()
    public get zoomToMouseLocation(): boolean {
        const mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
        if (mousewheel) {
            return mousewheel.zoomToMouseLocation;
        }

        return false;
    }

    public set zoomToMouseLocation(value: boolean) {
        const mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
        if (mousewheel) {
            mousewheel.zoomToMouseLocation = value;
        }
    }

    /**
     * Gets or Set the mouse wheel delta percentage or how fast is the camera zooming.
     * It will be used instead of pinchDeltaPrecision if different from 0.
     * It defines the percentage of current camera.radius to use as delta when pinch zoom is used.
     */
    public get wheelDeltaPercentage(): number {
        const mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
        if (mousewheel) {
            return mousewheel.wheelDeltaPercentage;
        }

        return 0;
    }

    public set wheelDeltaPercentage(value: number) {
        const mousewheel = <ArcRotateCameraMouseWheelInput>this.inputs.attached["mousewheel"];
        if (mousewheel) {
            mousewheel.wheelDeltaPercentage = value;
        }
    }

    //-- end properties for backward compatibility for inputs

    /**
     * Defines how much the radius should be scaled while zooming on a particular mesh (through the zoomOn function)
     */
    @serialize()
    public zoomOnFactor = 1;

    /**
     * Defines a screen offset for the camera position.
     */
    @serializeAsVector2()
    public targetScreenOffset = Vector2.Zero();

    /**
     * Allows the camera to be completely reversed.
     * If false the camera can not arrive upside down.
     */
    @serialize()
    public allowUpsideDown = true;

    /**
     * Define if double tap/click is used to restore the previously saved state of the camera.
     */
    @serialize()
    public useInputToRestoreState = true;

    /** @internal */
    public _viewMatrix = new Matrix();
    /** @internal */
    public _useCtrlForPanning: boolean;
    /** @internal */
    public _panningMouseButton: number;

    /**
     * Defines the input associated to the camera.
     */
    public inputs: ArcRotateCameraInputsManager;

    /** @internal */
    public _reset: () => void;

    /**
     * Defines the allowed panning axis.
     */
    public panningAxis: Vector3 = new Vector3(1, 1, 0);
    protected _transformedDirection: Vector3 = new Vector3();

    /**
     * Defines if camera will eliminate transform on y axis.
     */
    public mapPanning: boolean = false;

    // Behaviors
    private _bouncingBehavior: Nullable<BouncingBehavior>;

    /**
     * Gets the bouncing behavior of the camera if it has been enabled.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#bouncing-behavior
     */
    public get bouncingBehavior(): Nullable<BouncingBehavior> {
        return this._bouncingBehavior;
    }

    /**
     * Defines if the bouncing behavior of the camera is enabled on the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#bouncing-behavior
     */
    public get useBouncingBehavior(): boolean {
        return this._bouncingBehavior != null;
    }

    public set useBouncingBehavior(value: boolean) {
        if (value === this.useBouncingBehavior) {
            return;
        }

        if (value) {
            this._bouncingBehavior = new BouncingBehavior();
            this.addBehavior(this._bouncingBehavior);
        } else if (this._bouncingBehavior) {
            this.removeBehavior(this._bouncingBehavior);
            this._bouncingBehavior = null;
        }
    }

    private _framingBehavior: Nullable<FramingBehavior>;

    /**
     * Gets the framing behavior of the camera if it has been enabled.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#framing-behavior
     */
    public get framingBehavior(): Nullable<FramingBehavior> {
        return this._framingBehavior;
    }

    /**
     * Defines if the framing behavior of the camera is enabled on the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#framing-behavior
     */
    public get useFramingBehavior(): boolean {
        return this._framingBehavior != null;
    }

    public set useFramingBehavior(value: boolean) {
        if (value === this.useFramingBehavior) {
            return;
        }

        if (value) {
            this._framingBehavior = new FramingBehavior();
            this.addBehavior(this._framingBehavior);
        } else if (this._framingBehavior) {
            this.removeBehavior(this._framingBehavior);
            this._framingBehavior = null;
        }
    }

    private _autoRotationBehavior: Nullable<AutoRotationBehavior>;

    /**
     * Gets the auto rotation behavior of the camera if it has been enabled.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#autorotation-behavior
     */
    public get autoRotationBehavior(): Nullable<AutoRotationBehavior> {
        return this._autoRotationBehavior;
    }

    /**
     * Defines if the auto rotation behavior of the camera is enabled on the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors/cameraBehaviors#autorotation-behavior
     */
    public get useAutoRotationBehavior(): boolean {
        return this._autoRotationBehavior != null;
    }

    public set useAutoRotationBehavior(value: boolean) {
        if (value === this.useAutoRotationBehavior) {
            return;
        }

        if (value) {
            this._autoRotationBehavior = new AutoRotationBehavior();
            this.addBehavior(this._autoRotationBehavior);
        } else if (this._autoRotationBehavior) {
            this.removeBehavior(this._autoRotationBehavior);
            this._autoRotationBehavior = null;
        }
    }

    /**
     * Observable triggered when the transform node target has been changed on the camera.
     */
    public onMeshTargetChangedObservable = new Observable<Nullable<TransformNode>>();

    /**
     * Event raised when the camera is colliding with a mesh.
     */
    public onCollide: (collidedMesh: AbstractMesh) => void;

    /**
     * Defines whether the camera should check collision with the objects oh the scene.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions#how-can-i-do-this-
     */
    public checkCollisions = false;

    /**
     * Defines the collision radius of the camera.
     * This simulates a sphere around the camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions#arcrotatecamera
     */
    public collisionRadius = new Vector3(0.5, 0.5, 0.5);

    protected _collider: Collider;
    protected _previousPosition = Vector3.Zero();
    protected _collisionVelocity = Vector3.Zero();
    protected _newPosition = Vector3.Zero();
    protected _previousAlpha: number;
    protected _previousBeta: number;
    protected _previousRadius: number;
    //due to async collision inspection
    protected _collisionTriggered: boolean;

    protected _targetBoundingCenter: Nullable<Vector3>;

    private _computationVector: Vector3 = Vector3.Zero();

    /**
     * Instantiates a new ArcRotateCamera in a given scene
     * @param name Defines the name of the camera
     * @param alpha Defines the camera rotation along the longitudinal axis
     * @param beta Defines the camera rotation along the latitudinal axis
     * @param radius Defines the camera distance from its target
     * @param target Defines the camera target
     * @param scene Defines the scene the camera belongs to
     * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active if not other active cameras have been defined
     */
    constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, scene?: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, Vector3.Zero(), scene, setActiveOnSceneIfNoneActive);

        this._target = Vector3.Zero();
        if (target) {
            this.setTarget(target);
        }

        this.alpha = alpha;
        this.beta = beta;
        this.radius = radius;

        this.getViewMatrix();
        this.inputs = new ArcRotateCameraInputsManager(this);
        this.inputs.addKeyboard().addMouseWheel().addPointers();
    }

    // Cache
    /** @internal */
    public _initCache(): void {
        super._initCache();
        this._cache._target = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        this._cache.alpha = undefined;
        this._cache.beta = undefined;
        this._cache.radius = undefined;
        this._cache.targetScreenOffset = Vector2.Zero();
    }

    /**
     * @internal
     */
    public _updateCache(ignoreParentClass?: boolean): void {
        if (!ignoreParentClass) {
            super._updateCache();
        }

        this._cache._target.copyFrom(this._getTargetPosition());
        this._cache.alpha = this.alpha;
        this._cache.beta = this.beta;
        this._cache.radius = this.radius;
        this._cache.targetScreenOffset.copyFrom(this.targetScreenOffset);
    }

    protected _getTargetPosition(): Vector3 {
        if (this._targetHost && this._targetHost.getAbsolutePosition) {
            const pos: Vector3 = this._targetHost.getAbsolutePosition();
            if (this._targetBoundingCenter) {
                pos.addToRef(this._targetBoundingCenter, this._target);
            } else {
                this._target.copyFrom(pos);
            }
        }

        const lockedTargetPosition = this._getLockedTargetPosition();

        if (lockedTargetPosition) {
            return lockedTargetPosition;
        }

        return this._target;
    }

    private _storedAlpha: number;
    private _storedBeta: number;
    private _storedRadius: number;
    private _storedTarget: Vector3;
    private _storedTargetScreenOffset: Vector2;

    /**
     * Stores the current state of the camera (alpha, beta, radius and target)
     * @returns the camera itself
     */
    public storeState(): Camera {
        this._storedAlpha = this.alpha;
        this._storedBeta = this.beta;
        this._storedRadius = this.radius;
        this._storedTarget = this._getTargetPosition().clone();
        this._storedTargetScreenOffset = this.targetScreenOffset.clone();

        return super.storeState();
    }

    /**
     * @internal
     * Restored camera state. You must call storeState() first
     */
    public _restoreStateValues(): boolean {
        if (!super._restoreStateValues()) {
            return false;
        }

        this.setTarget(this._storedTarget.clone());
        this.alpha = this._storedAlpha;
        this.beta = this._storedBeta;
        this.radius = this._storedRadius;
        this.targetScreenOffset = this._storedTargetScreenOffset.clone();

        this.inertialAlphaOffset = 0;
        this.inertialBetaOffset = 0;
        this.inertialRadiusOffset = 0;
        this.inertialPanningX = 0;
        this.inertialPanningY = 0;

        return true;
    }

    // Synchronized
    /** @internal */
    public _isSynchronizedViewMatrix(): boolean {
        if (!super._isSynchronizedViewMatrix()) {
            return false;
        }

        return (
            this._cache._target.equals(this._getTargetPosition()) &&
            this._cache.alpha === this.alpha &&
            this._cache.beta === this.beta &&
            this._cache.radius === this.radius &&
            this._cache.targetScreenOffset.equals(this.targetScreenOffset)
        );
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(noPreventDefault?: boolean): void;
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(ignored: any, noPreventDefault?: boolean): void;
    /**
     * Attached controls to the current camera.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     * @param useCtrlForPanning  Defines whether ctrl is used for panning within the controls
     */
    public attachControl(noPreventDefault: boolean, useCtrlForPanning: boolean): void;
    /**
     * Attached controls to the current camera.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     * @param useCtrlForPanning  Defines whether ctrl is used for panning within the controls
     */
    public attachControl(ignored: any, noPreventDefault: boolean, useCtrlForPanning: boolean): void;
    /**
     * Attached controls to the current camera.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     * @param useCtrlForPanning  Defines whether ctrl is used for panning within the controls
     * @param panningMouseButton Defines whether panning is allowed through mouse click button
     */
    public attachControl(noPreventDefault: boolean, useCtrlForPanning: boolean, panningMouseButton: number): void;
    /**
     * Attached controls to the current camera.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     * @param useCtrlForPanning  Defines whether ctrl is used for panning within the controls
     * @param panningMouseButton Defines whether panning is allowed through mouse click button
     */
    public attachControl(ignored: any, noPreventDefault?: boolean, useCtrlForPanning: boolean | number = true, panningMouseButton: number = 2): void {
        // eslint-disable-next-line prefer-rest-params
        const args = arguments;

        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(args);
        this._useCtrlForPanning = useCtrlForPanning as boolean;
        this._panningMouseButton = panningMouseButton;
        // backwards compatibility
        if (typeof args[0] === "boolean") {
            if (args.length > 1) {
                this._useCtrlForPanning = args[1];
            }
            if (args.length > 2) {
                this._panningMouseButton = args[2];
            }
        }

        this.inputs.attachElement(noPreventDefault);

        this._reset = () => {
            this.inertialAlphaOffset = 0;
            this.inertialBetaOffset = 0;
            this.inertialRadiusOffset = 0;
            this.inertialPanningX = 0;
            this.inertialPanningY = 0;
        };
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
        //if (async) collision inspection was triggered, don't update the camera's position - until the collision callback was called.
        if (this._collisionTriggered) {
            return;
        }

        this.inputs.checkInputs();
        // Inertia
        if (this.inertialAlphaOffset !== 0 || this.inertialBetaOffset !== 0 || this.inertialRadiusOffset !== 0) {
            const directionModifier = this.invertRotation ? -1 : 1;
            const handednessMultiplier = this._calculateHandednessMultiplier();
            let inertialAlphaOffset = this.inertialAlphaOffset * handednessMultiplier;

            if (this.beta < 0) {
                inertialAlphaOffset *= -1;
            }

            this.alpha += inertialAlphaOffset * directionModifier;
            this.beta += this.inertialBetaOffset * directionModifier;

            this.radius -= this.inertialRadiusOffset;
            this.inertialAlphaOffset *= this.inertia;
            this.inertialBetaOffset *= this.inertia;
            this.inertialRadiusOffset *= this.inertia;
            if (Math.abs(this.inertialAlphaOffset) < Epsilon) {
                this.inertialAlphaOffset = 0;
            }
            if (Math.abs(this.inertialBetaOffset) < Epsilon) {
                this.inertialBetaOffset = 0;
            }
            if (Math.abs(this.inertialRadiusOffset) < this.speed * Epsilon) {
                this.inertialRadiusOffset = 0;
            }
        }

        // Panning inertia
        if (this.inertialPanningX !== 0 || this.inertialPanningY !== 0) {
            const localDirection = new Vector3(this.inertialPanningX, this.inertialPanningY, this.inertialPanningY);

            this._viewMatrix.invertToRef(this._cameraTransformMatrix);
            localDirection.multiplyInPlace(this.panningAxis);
            Vector3.TransformNormalToRef(localDirection, this._cameraTransformMatrix, this._transformedDirection);

            // If mapPanning is enabled, we need to take the upVector into account and
            // make sure we're not panning in the y direction
            if (this.mapPanning) {
                const up = this.upVector;
                const right = Vector3.CrossToRef(this._transformedDirection, up, this._transformedDirection);
                Vector3.CrossToRef(up, right, this._transformedDirection);
            } else if (!this.panningAxis.y) {
                this._transformedDirection.y = 0;
            }

            if (!this._targetHost) {
                if (this.panningDistanceLimit) {
                    this._transformedDirection.addInPlace(this._target);
                    const distanceSquared = Vector3.DistanceSquared(this._transformedDirection, this.panningOriginTarget);
                    if (distanceSquared <= this.panningDistanceLimit * this.panningDistanceLimit) {
                        this._target.copyFrom(this._transformedDirection);
                    }
                } else {
                    this._target.addInPlace(this._transformedDirection);
                }
            }

            this.inertialPanningX *= this.panningInertia;
            this.inertialPanningY *= this.panningInertia;

            if (Math.abs(this.inertialPanningX) < this.speed * Epsilon) {
                this.inertialPanningX = 0;
            }
            if (Math.abs(this.inertialPanningY) < this.speed * Epsilon) {
                this.inertialPanningY = 0;
            }
        }

        // Limits
        this._checkLimits();

        super._checkInputs();
    }

    protected _checkLimits() {
        if (this.lowerBetaLimit === null || this.lowerBetaLimit === undefined) {
            if (this.allowUpsideDown && this.beta > Math.PI) {
                this.beta = this.beta - 2 * Math.PI;
            }
        } else {
            if (this.beta < this.lowerBetaLimit) {
                this.beta = this.lowerBetaLimit;
            }
        }

        if (this.upperBetaLimit === null || this.upperBetaLimit === undefined) {
            if (this.allowUpsideDown && this.beta < -Math.PI) {
                this.beta = this.beta + 2 * Math.PI;
            }
        } else {
            if (this.beta > this.upperBetaLimit) {
                this.beta = this.upperBetaLimit;
            }
        }

        if (this.lowerAlphaLimit !== null && this.alpha < this.lowerAlphaLimit) {
            this.alpha = this.lowerAlphaLimit;
        }
        if (this.upperAlphaLimit !== null && this.alpha > this.upperAlphaLimit) {
            this.alpha = this.upperAlphaLimit;
        }

        if (this.lowerRadiusLimit !== null && this.radius < this.lowerRadiusLimit) {
            this.radius = this.lowerRadiusLimit;
            this.inertialRadiusOffset = 0;
        }
        if (this.upperRadiusLimit !== null && this.radius > this.upperRadiusLimit) {
            this.radius = this.upperRadiusLimit;
            this.inertialRadiusOffset = 0;
        }
    }

    /**
     * Rebuilds angles (alpha, beta) and radius from the give position and target
     */
    public rebuildAnglesAndRadius(): void {
        this._position.subtractToRef(this._getTargetPosition(), this._computationVector);

        // need to rotate to Y up equivalent if up vector not Axis.Y
        if (this._upVector.x !== 0 || this._upVector.y !== 1.0 || this._upVector.z !== 0) {
            Vector3.TransformCoordinatesToRef(this._computationVector, this._upToYMatrix, this._computationVector);
        }

        this.radius = this._computationVector.length();

        if (this.radius === 0) {
            this.radius = 0.0001; // Just to avoid division by zero
        }

        // Alpha
        const previousAlpha = this.alpha;
        if (this._computationVector.x === 0 && this._computationVector.z === 0) {
            this.alpha = Math.PI / 2; // avoid division by zero when looking along up axis, and set to acos(0)
        } else {
            this.alpha = Math.acos(this._computationVector.x / Math.sqrt(Math.pow(this._computationVector.x, 2) + Math.pow(this._computationVector.z, 2)));
        }

        if (this._computationVector.z < 0) {
            this.alpha = 2 * Math.PI - this.alpha;
        }

        // Calculate the number of revolutions between the new and old alpha values.
        const alphaCorrectionTurns = Math.round((previousAlpha - this.alpha) / (2.0 * Math.PI));
        // Adjust alpha so that its numerical representation is the closest one to the old value.
        this.alpha += alphaCorrectionTurns * 2.0 * Math.PI;

        // Beta
        this.beta = Math.acos(this._computationVector.y / this.radius);

        this._checkLimits();
    }

    /**
     * Use a position to define the current camera related information like alpha, beta and radius
     * @param position Defines the position to set the camera at
     */
    public setPosition(position: Vector3): void {
        if (this._position.equals(position)) {
            return;
        }
        this._position.copyFrom(position);

        this.rebuildAnglesAndRadius();
    }

    /**
     * Defines the target the camera should look at.
     * This will automatically adapt alpha beta and radius to fit within the new target.
     * Please note that setting a target as a mesh will disable panning.
     * @param target Defines the new target as a Vector or a transform node
     * @param toBoundingCenter In case of a mesh target, defines whether to target the mesh position or its bounding information center
     * @param allowSamePosition If false, prevents reapplying the new computed position if it is identical to the current one (optim)
     * @param cloneAlphaBetaRadius If true, replicate the current setup (alpha, beta, radius) on the new target
     */
    public setTarget(target: TransformNode | Vector3, toBoundingCenter = false, allowSamePosition = false, cloneAlphaBetaRadius = false): void {
        cloneAlphaBetaRadius = this.overrideCloneAlphaBetaRadius ?? cloneAlphaBetaRadius;

        if ((target as TransformNode).computeWorldMatrix) {
            if (toBoundingCenter && (<any>target).getBoundingInfo) {
                this._targetBoundingCenter = (<any>target).getBoundingInfo().boundingBox.centerWorld.clone();
            } else {
                this._targetBoundingCenter = null;
            }
            (<TransformNode>target).computeWorldMatrix();
            this._targetHost = <TransformNode>target;
            this._target = this._getTargetPosition();

            this.onMeshTargetChangedObservable.notifyObservers(this._targetHost);
        } else {
            const newTarget = <Vector3>target;
            const currentTarget = this._getTargetPosition();
            if (currentTarget && !allowSamePosition && currentTarget.equals(newTarget)) {
                return;
            }
            this._targetHost = null;
            this._target = newTarget;
            this._targetBoundingCenter = null;
            this.onMeshTargetChangedObservable.notifyObservers(null);
        }

        if (!cloneAlphaBetaRadius) {
            this.rebuildAnglesAndRadius();
        }
    }

    /** @internal */
    public _getViewMatrix(): Matrix {
        // Compute
        const cosa = Math.cos(this.alpha);
        const sina = Math.sin(this.alpha);
        const cosb = Math.cos(this.beta);
        let sinb = Math.sin(this.beta);

        if (sinb === 0) {
            sinb = 0.0001;
        }

        if (this.radius === 0) {
            this.radius = 0.0001; // Just to avoid division by zero
        }

        const target = this._getTargetPosition();
        this._computationVector.copyFromFloats(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb);

        // Rotate according to up vector
        if (this._upVector.x !== 0 || this._upVector.y !== 1.0 || this._upVector.z !== 0) {
            Vector3.TransformCoordinatesToRef(this._computationVector, this._yToUpMatrix, this._computationVector);
        }

        target.addToRef(this._computationVector, this._newPosition);
        if (this.getScene().collisionsEnabled && this.checkCollisions) {
            const coordinator = this.getScene().collisionCoordinator;
            if (!this._collider) {
                this._collider = coordinator.createCollider();
            }
            this._collider._radius = this.collisionRadius;
            this._newPosition.subtractToRef(this._position, this._collisionVelocity);
            this._collisionTriggered = true;
            coordinator.getNewPosition(this._position, this._collisionVelocity, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
        } else {
            this._position.copyFrom(this._newPosition);

            let up = this.upVector;
            if (this.allowUpsideDown && sinb < 0) {
                up = up.negate();
            }

            this._computeViewMatrix(this._position, target, up);

            this._viewMatrix.addAtIndex(12, this.targetScreenOffset.x);
            this._viewMatrix.addAtIndex(13, this.targetScreenOffset.y);
        }
        this._currentTarget = target;
        return this._viewMatrix;
    }

    protected _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
        if (!collidedMesh) {
            this._previousPosition.copyFrom(this._position);
        } else {
            this.setPosition(newPosition);

            if (this.onCollide) {
                this.onCollide(collidedMesh);
            }
        }

        // Recompute because of constraints
        const cosa = Math.cos(this.alpha);
        const sina = Math.sin(this.alpha);
        const cosb = Math.cos(this.beta);
        let sinb = Math.sin(this.beta);

        if (sinb === 0) {
            sinb = 0.0001;
        }

        const target = this._getTargetPosition();
        this._computationVector.copyFromFloats(this.radius * cosa * sinb, this.radius * cosb, this.radius * sina * sinb);
        target.addToRef(this._computationVector, this._newPosition);
        this._position.copyFrom(this._newPosition);

        let up = this.upVector;
        if (this.allowUpsideDown && this.beta < 0) {
            up = up.clone();
            up = up.negate();
        }

        this._computeViewMatrix(this._position, target, up);
        this._viewMatrix.addAtIndex(12, this.targetScreenOffset.x);
        this._viewMatrix.addAtIndex(13, this.targetScreenOffset.y);

        this._collisionTriggered = false;
    };

    /**
     * Zooms on a mesh to be at the min distance where we could see it fully in the current viewport.
     * @param meshes Defines the mesh to zoom on
     * @param doNotUpdateMaxZ Defines whether or not maxZ should be updated whilst zooming on the mesh (this can happen if the mesh is big and the maxradius pretty small for instance)
     */
    public zoomOn(meshes?: AbstractMesh[], doNotUpdateMaxZ = false): void {
        meshes = meshes || this.getScene().meshes;

        const minMaxVector = Mesh.MinMax(meshes);
        let distance = this._calculateLowerRadiusFromModelBoundingSphere(minMaxVector.min, minMaxVector.max);

        // If there are defined limits, we need to take them into account
        distance = Math.max(Math.min(distance, this.upperRadiusLimit || Number.MAX_VALUE), this.lowerRadiusLimit || 0);
        this.radius = distance * this.zoomOnFactor;

        this.focusOn({ min: minMaxVector.min, max: minMaxVector.max, distance: distance }, doNotUpdateMaxZ);
    }

    /**
     * Focus on a mesh or a bounding box. This adapts the target and maxRadius if necessary but does not update the current radius.
     * The target will be changed but the radius
     * @param meshesOrMinMaxVectorAndDistance Defines the mesh or bounding info to focus on
     * @param doNotUpdateMaxZ Defines whether or not maxZ should be updated whilst zooming on the mesh (this can happen if the mesh is big and the maxradius pretty small for instance)
     */
    public focusOn(meshesOrMinMaxVectorAndDistance: AbstractMesh[] | { min: Vector3; max: Vector3; distance: number }, doNotUpdateMaxZ = false): void {
        let meshesOrMinMaxVector: { min: Vector3; max: Vector3 };
        let distance: number;

        if ((<any>meshesOrMinMaxVectorAndDistance).min === undefined) {
            // meshes
            const meshes = <AbstractMesh[]>meshesOrMinMaxVectorAndDistance || this.getScene().meshes;
            meshesOrMinMaxVector = Mesh.MinMax(meshes);
            distance = Vector3.Distance(meshesOrMinMaxVector.min, meshesOrMinMaxVector.max);
        } else {
            //minMaxVector and distance
            const minMaxVectorAndDistance = <any>meshesOrMinMaxVectorAndDistance;
            meshesOrMinMaxVector = minMaxVectorAndDistance;
            distance = minMaxVectorAndDistance.distance;
        }

        this._target = Mesh.Center(meshesOrMinMaxVector);

        if (!doNotUpdateMaxZ) {
            this.maxZ = distance * 2;
        }
    }

    /**
     * @override
     * Override Camera.createRigCamera
     * @param name the name of the camera
     * @param cameraIndex the index of the camera in the rig cameras array
     */
    public createRigCamera(name: string, cameraIndex: number): Camera {
        let alphaShift: number = 0;
        switch (this.cameraRigMode) {
            case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
            case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
            case Camera.RIG_MODE_STEREOSCOPIC_INTERLACED:
            case Camera.RIG_MODE_VR:
                alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? 1 : -1);
                break;
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                alphaShift = this._cameraRigParams.stereoHalfAngle * (cameraIndex === 0 ? -1 : 1);
                break;
        }
        const rigCam = new ArcRotateCamera(name, this.alpha + alphaShift, this.beta, this.radius, this._target, this.getScene());
        rigCam._cameraRigParams = {};
        rigCam.isRigCamera = true;
        rigCam.rigParent = this;
        rigCam.upVector = this.upVector;

        rigCam.mode = this.mode;
        rigCam.orthoLeft = this.orthoLeft;
        rigCam.orthoRight = this.orthoRight;
        rigCam.orthoBottom = this.orthoBottom;
        rigCam.orthoTop = this.orthoTop;

        return rigCam;
    }

    /**
     * @internal
     * @override
     * Override Camera._updateRigCameras
     */
    public _updateRigCameras() {
        const camLeft = <ArcRotateCamera>this._rigCameras[0];
        const camRight = <ArcRotateCamera>this._rigCameras[1];

        camLeft.beta = camRight.beta = this.beta;

        switch (this.cameraRigMode) {
            case Camera.RIG_MODE_STEREOSCOPIC_ANAGLYPH:
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_PARALLEL:
            case Camera.RIG_MODE_STEREOSCOPIC_OVERUNDER:
            case Camera.RIG_MODE_STEREOSCOPIC_INTERLACED:
            case Camera.RIG_MODE_VR:
                camLeft.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                camRight.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                break;
            case Camera.RIG_MODE_STEREOSCOPIC_SIDEBYSIDE_CROSSEYED:
                camLeft.alpha = this.alpha + this._cameraRigParams.stereoHalfAngle;
                camRight.alpha = this.alpha - this._cameraRigParams.stereoHalfAngle;
                break;
        }
        super._updateRigCameras();
    }

    /**
     * @internal
     */
    public _calculateLowerRadiusFromModelBoundingSphere(minimumWorld: Vector3, maximumWorld: Vector3, radiusScale: number = 1): number {
        const boxVectorGlobalDiagonal = Vector3.Distance(minimumWorld, maximumWorld);

        // Get aspect ratio in order to calculate frustum slope
        const engine = this.getScene().getEngine();
        const aspectRatio = engine.getAspectRatio(this);
        const frustumSlopeY = Math.tan(this.fov / 2);
        const frustumSlopeX = frustumSlopeY * aspectRatio;

        // Formula for setting distance
        // (Good explanation: http://stackoverflow.com/questions/2866350/move-camera-to-fit-3d-scene)
        const radiusWithoutFraming = boxVectorGlobalDiagonal * 0.5;

        // Horizon distance
        const radius = radiusWithoutFraming * radiusScale;
        const distanceForHorizontalFrustum = radius * Math.sqrt(1.0 + 1.0 / (frustumSlopeX * frustumSlopeX));
        const distanceForVerticalFrustum = radius * Math.sqrt(1.0 + 1.0 / (frustumSlopeY * frustumSlopeY));
        return Math.max(distanceForHorizontalFrustum, distanceForVerticalFrustum);
    }

    /**
     * Destroy the camera and release the current resources hold by it.
     */
    public dispose(): void {
        this.inputs.clear();
        super.dispose();
    }

    /**
     * Gets the current object class name.
     * @returns the class name
     */
    public getClassName(): string {
        return "ArcRotateCamera";
    }
}
