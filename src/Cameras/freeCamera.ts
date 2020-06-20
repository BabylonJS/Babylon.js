import { Nullable } from "../types";
import { serializeAsVector3, serialize } from "../Misc/decorators";
import { Vector3, Vector2 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Scene } from "../scene";
import { Engine } from "../Engines/engine";
import { TargetCamera } from "./targetCamera";
import { FreeCameraInputsManager } from "./freeCameraInputsManager";
import { FreeCameraMouseInput } from "../Cameras/Inputs/freeCameraMouseInput";
import { FreeCameraKeyboardMoveInput } from "../Cameras/Inputs/freeCameraKeyboardMoveInput";

declare type Collider = import("../Collisions/collider").Collider;

/**
 * This represents a free type of camera. It can be useful in First Person Shooter game for instance.
 * Please consider using the new UniversalCamera instead as it adds more functionality like the gamepad.
 * @see https://doc.babylonjs.com/features/cameras#universal-camera
 */
export class FreeCamera extends TargetCamera {
    /**
     * Define the collision ellipsoid of the camera.
     * This is helpful to simulate a camera body like the player body around the camera
     * @see https://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity#arcrotatecamera
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
    public inputs: FreeCameraInputsManager;

    /**
     * Gets the input sensibility for a mouse input. (default is 2000.0)
     * Higher values reduce sensitivity.
     */
    public get angularSensibility(): number {
        var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
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
        var mouse = <FreeCameraMouseInput>this.inputs.attached["mouse"];
        if (mouse) {
            mouse.angularSensibility = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the forward move of the camera.
     */
    public get keysUp(): number[] {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUp;
        }

        return [];
    }

    public set keysUp(value: number[]) {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUp = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the upward move of the camera.
     */
    public get keysUpward(): number[] {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysUpward;
        }

        return [];
    }

    public set keysUpward(value: number[]) {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysUpward = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the backward move of the camera.
     */
    public get keysDown(): number[] {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDown;
        }

        return [];
    }

    public set keysDown(value: number[]) {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDown = value;
        }
    }

     /**
     * Gets or Set the list of keyboard keys used to control the downward move of the camera.
     */
    public get keysDownward(): number[] {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysDownward;
        }

        return [];
    }

    public set keysDownward(value: number[]) {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysDownward = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the left strafe move of the camera.
     */
    public get keysLeft(): number[] {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysLeft;
        }

        return [];
    }

    public set keysLeft(value: number[]) {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysLeft = value;
        }
    }

    /**
     * Gets or Set the list of keyboard keys used to control the right strafe move of the camera.
     */
    public get keysRight(): number[] {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            return keyboard.keysRight;
        }

        return [];
    }

    public set keysRight(value: number[]) {
        var keyboard = <FreeCameraKeyboardMoveInput>this.inputs.attached["keyboard"];
        if (keyboard) {
            keyboard.keysRight = value;
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

    /** @hidden */
    public _localDirection: Vector3;
    /** @hidden */
    public _transformedDirection: Vector3;

    /**
     * Instantiates a Free Camera.
     * This represents a free type of camera. It can be useful in First Person Shooter game for instance.
     * Please consider using the new UniversalCamera instead as it adds more functionality like touch to this camera.
     * @see https://doc.babylonjs.com/features/cameras#universal-camera
     * @param name Define the name of the camera in the scene
     * @param position Define the start position of the camera in the scene
     * @param scene Define the scene the camera belongs to
     * @param setActiveOnSceneIfNoneActive Defines wheter the camera should be marked as active if not other active cameras have been defined
     */
    constructor(name: string, position: Vector3, scene: Scene, setActiveOnSceneIfNoneActive = true) {
        super(name, position, scene, setActiveOnSceneIfNoneActive);
        this.inputs = new FreeCameraInputsManager(this);
        this.inputs.addKeyboard().addMouse();
    }

    /**
     * Attached controls to the current camera.
     * @param element Defines the element the controls should be listened from
     * @param noPreventDefault Defines whether event caught by the controls should call preventdefault() (https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
     */
    public attachControl(element: HTMLElement, noPreventDefault?: boolean): void {
        this.inputs.attachElement(element, noPreventDefault);
    }

    /**
     * Detach the current controls from the camera.
     * The camera will stop reacting to inputs.
     * @param element Defines the element to stop listening the inputs from
     */
    public detachControl(element: HTMLElement): void {
        this.inputs.detachElement(element);

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

    /** @hidden */
    public _collideWithWorld(displacement: Vector3): void {
        var globalPosition: Vector3;

        if (this.parent) {
            globalPosition = Vector3.TransformCoordinates(this.position, this.parent.getWorldMatrix());
        } else {
            globalPosition = this.position;
        }

        globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPosition);
        this._oldPosition.addInPlace(this.ellipsoidOffset);

        let coordinator = this.getScene().collisionCoordinator;
        if (!this._collider) {
            this._collider = coordinator.createCollider();
        }

        this._collider._radius = this.ellipsoid;
        this._collider.collisionMask = this._collisionMask;

        //no need for clone, as long as gravity is not on.
        var actualDisplacement = displacement;

        //add gravity to the direction to prevent the dual-collision checking
        if (this.applyGravity) {
            //this prevents mending with cameraDirection, a global variable of the free camera class.
            actualDisplacement = displacement.add(this.getScene().gravity);
        }

        coordinator.getNewPosition(this._oldPosition, actualDisplacement, this._collider, 3, null, this._onCollisionPositionChange, this.uniqueId);

    }

    private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {

        var updatePosition = (newPos: Vector3) => {
            this._newPosition.copyFrom(newPos);

            this._newPosition.subtractToRef(this._oldPosition, this._diffPosition);

            if (this._diffPosition.length() > Engine.CollisionsEpsilon) {
                this.position.addInPlace(this._diffPosition);
                if (this.onCollide && collidedMesh) {
                    this.onCollide(collidedMesh);
                }
            }
        };

        updatePosition(newPosition);
    }

    /** @hidden */
    public _checkInputs(): void {
        if (!this._localDirection) {
            this._localDirection = Vector3.Zero();
            this._transformedDirection = Vector3.Zero();
        }

        this.inputs.checkInputs();

        super._checkInputs();
    }

    /** @hidden */
    public _decideIfNeedsToMove(): boolean {
        return this._needMoveForGravity || Math.abs(this.cameraDirection.x) > 0 || Math.abs(this.cameraDirection.y) > 0 || Math.abs(this.cameraDirection.z) > 0;
    }

    /** @hidden */
    public _updatePosition(): void {
        if (this.checkCollisions && this.getScene().collisionsEnabled) {
            this._collideWithWorld(this.cameraDirection);
        } else {
            super._updatePosition();
        }
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
     * @return the class name
     */
    public getClassName(): string {
        return "FreeCamera";
    }
}
