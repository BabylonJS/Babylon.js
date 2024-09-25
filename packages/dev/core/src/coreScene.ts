import type { AnimationGroup } from "./Animations/animationGroup";
import type { Camera } from "./Cameras/camera";
import type { ICollisionCoordinator } from "./Collisions/collisionCoordinator";
import type { AbstractEngine } from "./Engines/abstractEngine";
import type { KeyboardInfo } from "./Events/keyboardEvents";
import type { PointerInfo } from "./Events/pointerEvents";
import type { GamepadManager } from "./Gamepads/gamepadManager";
import type { InputManager } from "./Inputs/scene.inputManager";
import type { Light } from "./Lights/light";
import type { Color4 } from "./Maths/math.color";
import type { Vector3 } from "./Maths/math.vector";
import type { AbstractMesh } from "./Meshes/abstractMesh";
import type { Observable } from "./Misc/observable";
import type { Node } from "./node";
import type { PostProcess } from "./PostProcesses/postProcess";
import type { Nullable } from "./types";

/**
 * Minimal scene class. Where Scene is doint all the heavy lifting at the price of file size, CoreScene is a minimal version of Scene.
 */
export class CoreScene {
    /** @internal */
    public _animationTime: number = 0;

    /**
     * Gets or sets a general scale for animation speed
     * @see https://www.babylonjs-playground.com/#IBU2W7#3
     */
    public animationTimeScale: number = 1;

    /** @internal */
    public _blockEntityCollection: boolean;

    /** @internal */
    public _pendingData = new Array();

    /** @internal */
    public _allowPostProcessClearColor: boolean;

    /**
     * Gets a string identifying the name of the class
     * @returns "CoreScene" string
     */
    public getClassName(): string {
        return "CoreScene";
    }

    /**
     * Returns a boolean indicating if the scene is still loading data
     * Always false in CoreScene
     */
    public get isLoading(): boolean {
        return false;
    }

    // Engine
    protected _engine: AbstractEngine;

    /**
     * Gets the engine associated with the scene
     * @returns an Engine
     */
    public getEngine(): AbstractEngine {
        return this._engine;
    }

    protected _renderId = 0;
    /**
     * Gets an unique Id for the current render phase
     * @returns a number
     */
    public getRenderId(): number {
        return this._renderId;
    }

    /** Call this function if you want to manually increment the render Id*/
    public incrementRenderId(): void {
        this._renderId++;
    }

    protected _frameId = 0;
    /**
     * Gets an unique Id for the current frame
     * @returns a number
     */
    public getFrameId(): number {
        return this._frameId;
    }

    /**
     * Defines the color used to clear the render buffer (Default is (0.2, 0.2, 0.3, 1.0))
     */
    public clearColor: Color4;

    /**
     * Gets or sets a boolean indicating if the scene must use right-handed coordinates system
     * CoreScene is a only left handed system
     * Child classes can override this property to define their own coordinate system
     */
    public get useRightHandedSystem(): boolean {
        return false;
    }

    /**
     * Gets the list of root nodes (ie. nodes with no parent)
     */
    public rootNodes: Node[];

    /**
     * All of the (abstract) meshes added to this scene
     */
    public meshes: AbstractMesh[];

    /** All of the cameras added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras
     */
    public cameras: Camera[];

    /**
     * The list of postprocesses added to the scene
     */
    public postProcesses: PostProcess[];

    /**
     * All of the lights added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/lights_introduction
     */
    public lights: Light[];

    /** @internal */
    public get collisionCoordinator(): Nullable<ICollisionCoordinator> {
        return null;
    }

    /** Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position */
    public cameraToUseForPointers: Nullable<Camera>;

    /**
     * Gets or sets the current active camera
     * Always null in CoreScene
     */
    public get activeCamera(): Nullable<Camera> {
        return null;
    }

    /**
     * All of the active cameras added to this scene.
     * Always null in CoreScene
     */
    public get activeCameras(): Nullable<Camera[]> {
        return null;
    }

    /**
     * Gets or sets the current on-screen X position of the pointer
     * Always 0 in CoreScene
     */
    public get pointerX(): number {
        return 0;
    }

    /**
     * Gets or sets the current on-screen Y position of the pointer
     * Always 0 in CoreScene
     */
    public get pointerY(): number {
        return 0;
    }

    /**
     * Gets or sets a boolean indicating if collisions are enabled on this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     */
    public collisionsEnabled: boolean;

    /**
     * Defines the gravity applied to this scene (used only for collisions)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     */
    public gravity: Vector3;

    /** @internal */
    public _inputManager: InputManager;

    /**
     * All of the animation groups added to this scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/groupAnimations
     */
    public animationGroups: AnimationGroup[];

    /**
     * An event triggered when a camera is created
     */
    public onNewCameraAddedObservable?: Observable<Camera>;

    /**
     * An event triggered when a camera is removed
     */
    public onCameraRemovedObservable?: Observable<Camera>;

    /**
     * An event triggered when SceneLoader.Append or SceneLoader.Load or SceneLoader.ImportMesh were successfully executed
     */
    public onDataLoadedObservable?: Observable<CoreScene>;

    /**
     * Observable event triggered each time an keyboard event is received from the hosting window
     */
    public onKeyboardObservable?: Observable<KeyboardInfo>;

    /**
     * An event triggered before rendering the scene (right after animations and physics)
     */
    public onBeforeRenderObservable: Observable<CoreScene>;

    /**
     * Observable event triggered each time an input event is received from the rendering canvas
     */
    public onPointerObservable?: Observable<PointerInfo>;

    /**
     * Adds the given camera to this scene
     * @param newCamera The camera to add
     */
    public addCamera?: (newCamera: Camera) => void;

    /**
     * Remove a camera for the list of scene's cameras
     * @param toRemove defines the camera to remove
     * @returns the index where the camera was in the camera list
     */
    public removeCamera?: (toRemove: Camera) => number;

    /**
     * Gets a camera using its Id
     * @param id defines the Id to look for
     * @returns the camera or null if not found
     */
    public getCameraById?: (id: string) => Nullable<Camera>;

    /**
     * Gets a the last added mesh using a given Id
     * @param id defines the Id to search for
     * @returns the found mesh or null if not found at all.
     */
    public getLastMeshById?: (id: string) => Nullable<AbstractMesh>;

    /**
     * Gets the gamepad manager associated with the scene
     * @see https://doc.babylonjs.com/features/featuresDeepDive/input/gamepads
     */
    public gamepadManager?: GamepadManager;

    /**
     * Creates a new CoreScene
     * @param engine defines the engine to use to render this scene
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
    }
}
