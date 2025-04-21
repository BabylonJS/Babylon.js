import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import { FlowGraphEventType } from "./flowGraphEventType";

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
    private _pointerUnderMeshState: { [pointerId: number]: Nullable<AbstractMesh> } = {};

    private _startingTime: number = 0;

    constructor(scene: Scene) {
        this._scene = scene;
        this._initialize();
    }

    private _initialize() {
        this._sceneReadyObserver = this._scene.onReadyObservable.add(() => {
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
    }

    public dispose() {
        this._sceneDisposeObserver?.remove();
        this._sceneReadyObserver?.remove();
        this._sceneOnBeforeRenderObserver?.remove();
        this._meshPickedObserver?.remove();
        this._meshUnderPointerObserver?.remove();
        this.onEventTriggeredObservable.clear();
    }
}
