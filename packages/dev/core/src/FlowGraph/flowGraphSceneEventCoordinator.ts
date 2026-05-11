import { type PointerInfo, PointerEventTypes } from "core/Events/pointerEvents";
import { type KeyboardInfo, KeyboardEventTypes } from "core/Events/keyboardEvents";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Observer, Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { type Nullable } from "core/types";
import { FlowGraphEventType } from "./flowGraphEventType";
import { _IsMacPlatform } from "./utils";

/**
 * the interface of the object the scene event coordinator will trigger.
 */
export interface IFlowGraphEventTrigger {
    /**
     * The type of the event
     */
    type: FlowGraphEventType;
    /**
     * The data of the event
     */
    payload?: any;
}

/**
 * This class is responsible for coordinating the events that are triggered in the scene.
 * It registers all observers needed to track certain events and triggers the blocks that are listening to them.
 * Abstracting the events from the class will allow us to easily change the events that are being listened to, and trigger them in any order.
 */
export class FlowGraphSceneEventCoordinator {
    /**
     * @internal
     */
    public readonly _scene: Scene;

    /**
     * register to this observable to get flow graph event notifications.
     */
    public onEventTriggeredObservable: Observable<IFlowGraphEventTrigger> = new Observable();

    /**
     * Was scene-ready already triggered?
     */
    public sceneReadyTriggered: boolean = false;

    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    private _sceneReadyObserver: Nullable<Observer<Scene>>;
    private _sceneOnBeforeRenderObserver: Nullable<Observer<Scene>>;
    private _meshPickedObserver: Nullable<Observer<PointerInfo>>;
    private _meshUnderPointerObserver: Nullable<Observer<{ mesh: Nullable<AbstractMesh>; pointerId: number }>>;
    private _pointerDownObserver: Nullable<Observer<PointerInfo>>;
    private _pointerUpObserver: Nullable<Observer<PointerInfo>>;
    private _pointerMoveObserver: Nullable<Observer<PointerInfo>>;
    private _pointerUnderMeshState: { [pointerId: number]: Nullable<AbstractMesh> } = {};
    private _keyDownObserver: Nullable<Observer<KeyboardInfo>>;
    private _keyUpObserver: Nullable<Observer<KeyboardInfo>>;
    private _onBlurHandler: (() => void) | null = null;

    /**
     * The set of keys currently pressed, keyed by `event.code`.
     * Keyboard event blocks use this to determine whether a key is held.
     *
     * In addition to physical key codes, a virtual `"CommandOrControl"` entry
     * is maintained: it tracks Meta (Cmd) on macOS and Ctrl on Windows/Linux,
     * enabling platform-agnostic shortcut checks via the IsKeyPressed block.
     */
    public readonly pressedKeys: Set<string> = new Set<string>();

    /** The physical key codes that map to the virtual CommandOrControl key on this platform. */
    private static readonly _commandOrCtrlCodes: ReadonlySet<string> = _IsMacPlatform ? new Set(["MetaLeft", "MetaRight"]) : new Set(["ControlLeft", "ControlRight"]);

    private _startingTime: number = 0;

    constructor(scene: Scene) {
        this._scene = scene;
        this._initialize();
    }

    private _initialize() {
        this._sceneReadyObserver = this._scene.onReadyObservable.addOnce(() => {
            if (!this.sceneReadyTriggered) {
                this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.SceneReady });
                this.sceneReadyTriggered = true;
            }
        });

        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(() => {
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.SceneDispose });
        });
        this._sceneOnBeforeRenderObserver = this._scene.onBeforeRenderObservable.add(() => {
            const deltaTime = this._scene.getEngine().getDeltaTime() / 1000; // set in seconds
            this.onEventTriggeredObservable.notifyObservers({
                type: FlowGraphEventType.SceneBeforeRender,
                payload: {
                    timeSinceStart: this._startingTime,
                    deltaTime,
                },
            });
            this._startingTime += deltaTime;
        });

        this._meshPickedObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.MeshPick, payload: pointerInfo });
        }, PointerEventTypes.POINTERPICK); // should it be pointerdown?

        this._pointerDownObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerDown, payload: pointerInfo });
        }, PointerEventTypes.POINTERDOWN);

        this._pointerUpObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerUp, payload: pointerInfo });
        }, PointerEventTypes.POINTERUP);

        this._pointerMoveObserver = this._scene.onPointerObservable.add((pointerInfo) => {
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerMove, payload: pointerInfo });
        }, PointerEventTypes.POINTERMOVE);

        this._meshUnderPointerObserver = this._scene.onMeshUnderPointerUpdatedObservable.add((data) => {
            // check if the data has changed. Check the state of the last change and see if it is a mesh or null.
            // if it is a mesh and the previous state was null, trigger over event. If it is null and the previous state was a mesh, trigger out event.
            // if it is a mesh and the previous state was a mesh, trigger out from the old mesh and over the new mesh
            // if it is null and the previous state was null, do nothing.
            const pointerId = data.pointerId;
            const mesh = data.mesh;
            const previousState = this._pointerUnderMeshState[pointerId];
            if (!previousState && mesh) {
                this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerOver, payload: { pointerId, mesh } });
            } else if (previousState && !mesh) {
                this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerOut, payload: { pointerId, mesh: previousState } });
            } else if (previousState && mesh && previousState !== mesh) {
                this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerOut, payload: { pointerId, mesh: previousState, over: mesh } });
                this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.PointerOver, payload: { pointerId, mesh, out: previousState } });
            }
            this._pointerUnderMeshState[pointerId] = mesh;
        }, PointerEventTypes.POINTERMOVE);

        this._keyDownObserver = this._scene.onKeyboardObservable.add((keyboardInfo) => {
            const code = keyboardInfo.event.code;
            this.pressedKeys.add(code);
            if (FlowGraphSceneEventCoordinator._commandOrCtrlCodes.has(code)) {
                this.pressedKeys.add("CommandOrControl");
            }
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.KeyDown, payload: keyboardInfo });
        }, KeyboardEventTypes.KEYDOWN);

        this._keyUpObserver = this._scene.onKeyboardObservable.add((keyboardInfo) => {
            const code = keyboardInfo.event.code;
            this.pressedKeys.delete(code);
            if (FlowGraphSceneEventCoordinator._commandOrCtrlCodes.has(code)) {
                // Only remove CommandOrControl if neither left nor right is still held
                let stillHeld = false;
                for (const c of FlowGraphSceneEventCoordinator._commandOrCtrlCodes) {
                    if (c !== code && this.pressedKeys.has(c)) {
                        stillHeld = true;
                        break;
                    }
                }
                if (!stillHeld) {
                    this.pressedKeys.delete("CommandOrControl");
                }
            }
            this.onEventTriggeredObservable.notifyObservers({ type: FlowGraphEventType.KeyUp, payload: keyboardInfo });
        }, KeyboardEventTypes.KEYUP);

        // Clear all tracked keys when the window/tab loses focus.
        // Without this, held keys would appear "stuck" after an Alt-Tab
        // because the keyup event fires in the other window.
        const canvas = this._scene.getEngine().getRenderingCanvas();
        if (canvas) {
            this._onBlurHandler = () => this.pressedKeys.clear();
            canvas.addEventListener("blur", this._onBlurHandler);
        }
    }

    public dispose() {
        this._sceneDisposeObserver?.remove();
        this._sceneReadyObserver?.remove();
        this._sceneOnBeforeRenderObserver?.remove();
        this._meshPickedObserver?.remove();
        this._meshUnderPointerObserver?.remove();
        this._pointerDownObserver?.remove();
        this._pointerUpObserver?.remove();
        this._pointerMoveObserver?.remove();
        this._keyDownObserver?.remove();
        this._keyUpObserver?.remove();
        if (this._onBlurHandler) {
            const canvas = this._scene.getEngine().getRenderingCanvas();
            canvas?.removeEventListener("blur", this._onBlurHandler);
            this._onBlurHandler = null;
        }
        this.pressedKeys.clear();
        this.onEventTriggeredObservable.clear();
    }
}
