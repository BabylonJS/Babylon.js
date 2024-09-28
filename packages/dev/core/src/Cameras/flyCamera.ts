import { serialize, serializeAsVector3 } from "../Misc/decorators";
import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { Quaternion } from "../Maths/math.vector";
import { Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { TargetCamera } from "./targetCamera";
import { FlyCameraInputsManager } from "./flyCameraInputsManager";
import type { FlyCameraMouseInput } from "../Cameras/Inputs/flyCameraMouseInput";
import type { FlyCameraKeyboardInput } from "../Cameras/Inputs/flyCameraKeyboardInput";
import { Tools } from "../Misc/tools";
import { RegisterClass } from "../Misc/typeStore";

import type { Collider } from "../Collisions/collider";
import { AbstractEngine } from "core/Engines/abstractEngine";

/**
 * This is a flying camera, designed for 3D movement and rotation in all directions,
 * such as in a 3D Space Shooter or a Flight Simulator.
 */
export class FlyCamera extends TargetCamera {
    /**
     * Define the collision ellipsoid of the camera.
     * This is helpful for simulating a camera body, like a player's body.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions#arcrotatecamera
     */
    @serializeAsVector3()
    public ellipsoid = new Vector3(1, 1, 1);

    /**
     * Define an offset for the position of the ellipsoid around the camera.
     * This can be helpful if the camera is attached away from the player's body center,
     * such as at its head.
     */
    @serializeAsVector3()
    public ellipsoidOffset = new Vector3(0, 0, 0);

    /**
     * Enable or disable collisions of the camera with the rest of the scene objects.
     */
    @serialize()
    public checkCollisions = false;

    /**
     * Enable or disable gravity on the camera.
     */
    @serialize()
    public applyGravity = false;

    /**
     * Define the current direction the camera is moving to.
     */
    public override cameraDirection = Vector3.Zero();

    /**
     * Define the current local rotation of the camera as a quaternion to prevent Gimbal lock.
     * This overrides and empties cameraRotation.
     */
    public override rotationQuaternion: Quaternion;

    /**
     * Track Roll to maintain the wanted Rolling when looking around.
     */
    public _trackRoll: number = 0;

    /**
     * Slowly correct the Roll to its original value after a Pitch+Yaw rotation.
     */
    public rollCorrect: number = 100;

    /**
     * Mimic a banked turn, Rolling the camera when Yawing.
     * It's recommended to use rollCorrect = 10 for faster banking correction.
     */
    public bankedTurn: boolean = false;

    /**
     * Limit in radians for how much Roll banking will add. (Default: 90°)
     */
    public bankedTurnLimit: number = Math.PI / 2;

    /**
     * Value of 0 disables the banked Roll.
     * Value of 1 is equal to the Yaw angle in radians.
     */
    public bankedTurnMultiplier: number = 1;

    /**
     * The inputs manager loads all the input sources, such as keyboard and mouse.
     */
    public override inputs: FlyCameraInputsManager;

    /**
     * Gets the input sensibility for mouse input.
     * Higher values reduce sensitivity.
     */
    public get angularSensibility(): number {
        const mouse = <FlyCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            return mouse.angularSensibility;
        }

        return 0;
    }

    /**
     * Sets the input sensibility for a mouse input.
     * Higher values reduce sensitivity.
     */
    public set angularSensibility(value: number) {
        const mouse = <FlyCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            mouse.angularSensibility = value;
        }
    }

    /**
     * Get the keys for camera movement forward.
     */
    public get keysForward(): number[] {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysForward;
        }

        return [];
    }

    /**
     * Set the keys for camera movement forward.
     */
    public set keysForward(value: number[]) {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysForward = value;
        }
    }

    /**
     * Get the keys for camera movement backward.
     */
    public get keysBackward(): number[] {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysBackward;
        }

        return [];
    }

    public set keysBackward(value: number[]) {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysBackward = value;
        }
    }

    /**
     * Get the keys for camera movement up.
     */
    public get keysUp(): number[] {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUp;
        }

        return [];
    }

    /**
     * Set the keys for camera movement up.
     */
    public set keysUp(value: number[]) {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUp = value;
        }
    }

    /**
     * Get the keys for camera movement down.
     */
    public get keysDown(): number[] {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDown;
        }

        return [];
    }

    /**
     * Set the keys for camera movement down.
     */
    public set keysDown(value: number[]) {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDown = value;
        }
    }

    /**
     * Get the keys for camera movement left.
     */
    public get keysLeft(): number[] {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysLeft;
        }

        return [];
    }

    /**
     * Set the keys for camera movement left.
     */
    public set keysLeft(value: number[]) {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysLeft = value;
        }
    }

    /**
     * Set the keys for camera movement right.
     */
    public get keysRight(): number[] {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRight;
        }

        return [];
    }

    /**
     * Set the keys for camera movement right.
     */
    public set keysRight(value: number[]) {
        const keyboard = <FlyCameraKeyboardInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRight = value;
        }
    }

    /**
     * Event raised when the camera collides with a mesh in the scene.
     */
    public onCollide: (collidedMesh: AbstractMesh) => void;

    private _collider: Collider;
    private _needMoveForGravity = false;
    private _oldPosition = Vector3.Zero();
    private _diffPosition = Vector3.Zero();
    private _newPosition = Vector3.Zero();

    /** @internal */
    public _localDirection: Vector3;
    /** @internal */
    public _transformedDirection: Vector3;

    /**
     * Instantiates a FlyCamera.
     * This is a flying camera, designed for 3D movement and rotation in all directions,
     * such as in a 3D Space Shooter or a Flight Simulator.
     * @param name Define the name of the camera in the scene.
     * @param position Define the starting position of the camera in the scene.
     * @param scene Define the scene the camera belongs to.
     * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active, if no other camera has been defined as active.
     */
    constructor(name: string, position: Vector3, scene?: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, position, scene, setActiveOnSceneIfNoneActive);
        this.inputs = new FlyCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public override attachControl(noPreventDefault?: boolean): void;
    /**
     * Attached controls to the current camera.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public override attachControl(ignored: any, noPreventDefault?: boolean): void {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this.inputs.attachElement(noPreventDefault);
    }

    /**
     * Detach a control from the HTML DOM element.
     * The camera will stop reacting to that input.
     */
    public override detachControl(): void {
        this.inputs.detachElement();

        this.cameraDirection = new Vector3(0, 0, 0);
    }

    // Collisions.
    private _collisionMask = -1;

    /**
     * Get the mask that the camera ignores in collision events.
     */
    public get collisionMask(): number {
        return this._collisionMask;
    }

    /**
     * Set the mask that the camera ignores in collision events.
     */
    public set collisionMask(mask: number) {
        this._collisionMask = !isNaN(mask) ? mask : -1;
    }

    /**
     * @internal
     */
    public _collideWithWorld(displacement: Vector3): void {
        let globalPosition: Vector3;

        if (this.parent) {
            globalPosition = Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
        } else {
            globalPosition = this.position;
        }

        globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
        this._oldPosition.addInPlace(this.ellipsoidOffset);
        const coordinator = this.getScene().collisionCoordinator;

        if (!this._collider) {
            this._collider = coordinator.createCollider();
        }

        this._collider._radius = this.ellipsoid;
        this._collider.collisionMask = this._collisionMask;

        // No need for clone, as long as gravity is not on.
        let actualDisplacement = displacement;

        // Add gravity to direction to prevent dual-collision checking.
        if (this.applyGravity) {
            // This prevents mending with cameraDirection, a global variable of the fly camera class.
            actualDisplacement = displacement.add(this.getScene().gravity);
        }

        coordinator.getNewPosition(this._oldPosition, actualDisplacement, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
    }

    /**
     * @internal
     */
    private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
        const updatePosition = (newPos: Vector3) => {
            this._newPosition.copyFrom(newPos);

            this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

            if (this._diffPosition.length() > AbstractEngine.CollisionsEpsilon) {
                this.position.addInPlace(this._diffPosition);
                if (this.onCollide && collidedMesh) {
                    this.onCollide(collidedMesh);
                }
            }
        };

        updatePosition(newPosition);
    };

    /** @internal */
    public override _checkInputs(): void {
        if (!this._localDirection) {
            this._localDirection = Vector3.Zero();
            this._transformedDirection = Vector3.Zero();
        }

        this.inputs.checkInputs();

        super._checkInputs();
    }

    /**
     * Enable movement without a user input. This allows gravity to always be applied.
     */
    public set needMoveForGravity(value: boolean) {
        this._needMoveForGravity = value;
    }

    /**
     * When true, gravity is applied whether there is user input or not.
     */
    public get needMoveForGravity(): boolean {
        return this._needMoveForGravity;
    }

    /** @internal */
    public override _decideIfNeedsToMove(): boolean {
        return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
    }

    /** @internal */
    public override _updatePosition(): void {
        if (this.checkCollisions && this.getScene().collisionsEnabled) {
            this._collideWithWorld(this.cameraDirection);
        } else {
            super._updatePosition();
        }
    }

    /**
     * Restore the Roll to its target value at the rate specified.
     * @param rate - Higher means slower restoring.
     * @internal
     */
    public restoreRoll(rate: number): void {
        const limit = this._trackRoll; // Target Roll.
        const z = this.rotation.z; // Current Roll.
        const delta = limit - z; // Difference in Roll.

        const minRad = 0.001; // Tenth of a radian is a barely noticable difference.

        // If the difference is noticable, restore the Roll.
        if (Math.abs(delta) >= minRad) {
            // Change Z rotation towards the target Roll.
            this.rotation.z += delta / rate;

            // Match when near enough.
            if (Math.abs(limit - this.rotation.z) <= minRad) {
                this.rotation.z = limit;
            }
        }
    }

    /**
     * Destroy the camera and release the current resources held by it.
     */
    public override dispose(): void {
        this.inputs.clear();
        super.dispose();
    }

    /**
     * Get the current object class name.
     * @returns the class name.
     */
    public override getClassName(): string {
        return "FlyCamera";
    }
}

// Register Class Name
RegisterClass("BABYLON.FlyCamera", FlyCamera);
