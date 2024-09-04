import type { Nullable } from "../types";
import { serializeAsVector3, serialize } from "../Misc/decorators";
import { Vector3, Vector2 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Scene } from "../scene";
import { TargetCamera } from "./targetCamera";
import { FreeCameraInputsManager } from "./freeCameraInputsManager";
import type { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput";
import type { FreeCameraKeyboardMoveInput } from "../Cameras/Inputs/freeCameraKeyboardMoveInput";
import { Tools } from "../Misc/tools";
import { RegisterClass } from "../Misc/typeStore";

import type { Collider } from "../Collisions/collider";
import { AbstractEngine } from "core/Engines/abstractEngine";

/**
 * This represents a free type of camera. It can be useful in First Person Shooter game for instance.
 * Please consider using the new UniversalCamera instead as it adds more functionality like the gamepad.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
 */
export class FreeCamera extends TargetCamera {
    /**
     * Define the collision ellipsoid of the camera.
     * This is helpful to simulate a camera body like the player body around the camera
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions#arcrotatecamera
     */
    @serializeAsVector3()
    public ellipsoid = new Vector3(0.5, 1, 0.5);

    /**
     * Define an offset for the position of the ellipsoid around the camera.
     * This can be helpful to determine the center of the body near the gravity center of the body
     * instead of its head.
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
     * Define the input manager associated to the camera.
     */
    public override inputs: FreeCameraInputsManager;

    /**
     * Gets the input sensibility for a mouse input. (default is 2000.0)
     * Higher values reduce sensitivity.
     */
    public get angularSensibility(): number {
        const mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            return mouse.angularSensibility;
        }

        return 0;
    }

    /**
     * Sets the input sensibility for a mouse input. (default is 2000.0)
     * Higher values reduce sensitivity.
     */
    public set angularSensibility(value: number) {
        const mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            mouse.angularSensibility = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the forward move of the camera.
     */
    public get keysUp(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUp;
        }

        return [];
    }

    public set keysUp(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUp = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the upward move of the camera.
     */
    public get keysUpward(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUpward;
        }

        return [];
    }

    public set keysUpward(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUpward = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the backward move of the camera.
     */
    public get keysDown(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDown;
        }

        return [];
    }

    public set keysDown(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDown = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the downward move of the camera.
     */
    public get keysDownward(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDownward;
        }

        return [];
    }

    public set keysDownward(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDownward = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
     */
    public get keysLeft(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysLeft;
        }

        return [];
    }

    public set keysLeft(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysLeft = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
     */
    public get keysRight(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRight;
        }

        return [];
    }

    public set keysRight(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRight = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the left rotation move of the camera.
     */
    public get keysRotateLeft(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRotateLeft;
        }

        return [];
    }

    public set keysRotateLeft(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRotateLeft = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the right rotation move of the camera.
     */
    public get keysRotateRight(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRotateRight;
        }

        return [];
    }

    public set keysRotateRight(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRotateRight = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the up rotation move of the camera.
     */
    public get keysRotateUp(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRotateUp;
        }

        return [];
    }

    public set keysRotateUp(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRotateUp = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the down rotation move of the camera.
     */
    public get keysRotateDown(): number[] {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRotateDown;
        }

        return [];
    }

    public set keysRotateDown(value: number[]) {
        const keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRotateDown = value;
        }
    }

    /**
     * Event raised when the camera collide with a mesh in the scene.
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
     * Instantiates a Free Camera.
     * This represents a free type of camera. It can be useful in First Person Shooter game for instance.
     * Please consider using the new UniversalCamera instead as it adds more functionality like touch to this camera.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#universal-camera
     * @param name Define the name of the camera in the scene
     * @param position Define the start position of the camera in the scene
     * @param scene Define the scene the camera belongs to
     * @param setActiveOnSceneIfNoneActive Defines whether the camera should be marked as active if not other active cameras have been defined
     */
    constructor(name: string, position: Vector3, scene?: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, position, scene, setActiveOnSceneIfNoneActive);
        this.inputs = new FreeCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();
    }

    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public override attachControl(noPreventDefault?: boolean): void;
    /**
     * Attach the input controls to a specific dom element to get the input from.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     * BACK COMPAT SIGNATURE ONLY.
     */
    public override attachControl(ignored: any, noPreventDefault?: boolean): void;
    /**
     * Attached controls to the current camera.
     * @param ignored defines an ignored parameter kept for backward compatibility.
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public override attachControl(ignored?: any, noPreventDefault?: boolean): void {
        // eslint-disable-next-line prefer-rest-params
        noPreventDefault = Tools.BackCompatCameraNoPreventDefault(arguments);
        this.inputs.attachElement(noPreventDefault);
    }

    /**
     * Detach the current controls from the specified dom element.
     */
    public override detachControl(): void {
        this.inputs.detachElement();

        this.cameraDirection = new Vector3(0, 0, 0);
        this.cameraRotation = new Vector2(0, 0);
    }

    // Collisions
    private _collisionMask = -1;

    /**
     * Define a collision mask to limit the list of object the camera can collide with
     */
    public get collisionMask(): number {
        return this._collisionMask;
    }

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

        //no need for clone, as long as gravity is not on.
        let actualDisplacement = displacement;

        //add gravity to the direction to prevent the dual-collision checking
        if (this.applyGravity) {
            //this prevents mending with cameraDirection, a global variable of the free camera class.
            actualDisplacement = displacement.add(this.getScene().gravity);
        }

        coordinator.getNewPosition(this._oldPosition, actualDisplacement, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);
    }

    private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
        this._newPosition.copyFrom(newPosition);

        this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

        if (this._diffPosition.length() > AbstractEngine.CollisionsEpsilon) {
            this.position.addToRef(this._diffPosition, this._deferredPositionUpdate);
            if (!this._deferOnly) {
                this.position.copyFrom(this._deferredPositionUpdate);
            } else {
                this._deferredUpdated = true;
            }
            // call onCollide, if defined. Note that in case of deferred update, the actual position change might happen in the next frame.
            if (this.onCollide && collidedMesh) {
                this.onCollide(collidedMesh);
            }
        }
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
     * Destroy the camera and release the current resources hold by it.
     */
    public override dispose(): void {
        this.inputs.clear();
        super.dispose();
    }

    /**
     * Gets the current object class name.
     * @returns the class name
     */
    public override getClassName(): string {
        return "FreeCamera";
    }
}

// Register Class Name
RegisterClass("BABYLON.FreeCamera", FreeCamera);
