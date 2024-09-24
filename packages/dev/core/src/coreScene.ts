import type { Camera } from "./Cameras/camera";
import type { AbstractEngine } from "./Engines/abstractEngine";
import type { KeyboardInfo } from "./Events/keyboardEvents";
import type { Observable } from "./Misc/observable";

/**
 * Represents a flexible and small by default scene to be rendered by the engine.
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
    public _blockEntityCollection = false;

    /** @internal */
    public _pendingData = new Array();

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
     * Creates a new CoreScene
     * @param engine defines the engine to use to render this scene
     */
    constructor(engine: AbstractEngine) {
        this._engine = engine;
    }
}
