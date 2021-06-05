import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { PointerInfo, PointerEventTypes } from "babylonjs/Events/pointerEvents";
import { Material } from "babylonjs/Materials/material";
import { HemisphericLight } from "babylonjs/Lights/hemisphericLight";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { UtilityLayerRenderer } from "babylonjs/Rendering/utilityLayerRenderer";
import { EngineStore } from "babylonjs/Engines/engineStore";
import { IDisposable, Scene } from "babylonjs/scene";

import { Container3D } from "./controls/container3D";
import { Control3D } from "./controls/control3D";
import { TouchButton3D } from "./controls/touchButton3D";

/**
 * Class used to manage 3D user interface
 * @see https://doc.babylonjs.com/how_to/gui3d
 */
export class GUI3DManager implements IDisposable {
    private _scene: Scene;
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    private _utilityLayer: Nullable<UtilityLayerRenderer>;
    private _rootContainer: Container3D;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _pointerOutObserver: Nullable<Observer<number>>;
    private _touchableButtons = new Set<TouchButton3D>();
    private _touchIds = new Map<string, number>();
    private static _touchIdCounter = 300;
    /** @hidden */
    public _lastPickedControl: Control3D;
    /** @hidden */
    public _lastControlOver: { [pointerId: number]: Control3D } = {};
    /** @hidden */
    public _lastControlDown: { [pointerId: number]: Control3D } = {};

    /**
     * Observable raised when the point picked by the pointer events changed
     */
    public onPickedPointChangedObservable = new Observable<Nullable<Vector3>>();

    /**
     * Observable raised when a picking happens
     */
    public onPickingObservable = new Observable<Nullable<AbstractMesh>>();

    // Shared resources
    /** @hidden */
    public _sharedMaterials: { [key: string]: Material } = {};

    /** @hidden */
    public _touchSharedMaterials: { [key: string]: Material } = {};

    /** Gets the hosting scene */
    public get scene(): Scene {
        return this._scene;
    }

    /** Gets associated utility layer */
    public get utilityLayer(): Nullable<UtilityLayerRenderer> {
        return this._utilityLayer;
    }

    /**
     * Creates a new GUI3DManager
     * @param scene
     */
    public constructor(scene?: Scene) {
        this._scene = scene || EngineStore.LastCreatedScene!;
        this._sceneDisposeObserver = this._scene.onDisposeObservable.add(() => {
            this._sceneDisposeObserver = null;
            this._utilityLayer = null;
            this.dispose();
        });

        this._utilityLayer = UtilityLayerRenderer._CreateDefaultUtilityLayerFromScene(this._scene);
        this._utilityLayer.onlyCheckPointerDownEvents = false;
        this._utilityLayer.pickUtilitySceneFirst = false;
        this._utilityLayer.mainSceneTrackerPredicate = (mesh: Nullable<AbstractMesh>) => {
            return mesh && mesh.reservedDataStore?.GUI3D?.control?._node;
        };

        // Root
        this._rootContainer = new Container3D("RootContainer");
        this._rootContainer._host = this;
        let utilityLayerScene = this._utilityLayer.utilityLayerScene;

        // Events
        this._pointerOutObserver = this._utilityLayer.onPointerOutObservable.add((pointerId) => {
            this._handlePointerOut(pointerId, true);
        });

        this._pointerObserver = utilityLayerScene.onPointerObservable.add((pi, state) => {
            this._doPicking(pi);
        });

        // Scene
        this._utilityLayer.utilityLayerScene.autoClear = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        new HemisphericLight("hemi", Vector3.Up(), this._utilityLayer.utilityLayerScene);
    }

    private _handlePointerOut(pointerId: number, isPointerUp: boolean) {
        var previousControlOver = this._lastControlOver[pointerId];
        if (previousControlOver) {
            previousControlOver._onPointerOut(previousControlOver);
            delete this._lastControlOver[pointerId];
        }

        if (isPointerUp) {
            if (this._lastControlDown[pointerId]) {
                this._lastControlDown[pointerId].forcePointerUp();
                delete this._lastControlDown[pointerId];
            }
        }

        this.onPickedPointChangedObservable.notifyObservers(null);
    }

    private _doPicking(pi: PointerInfo): boolean {
        if (!this._utilityLayer || !this._utilityLayer.shouldRender || !this._utilityLayer.utilityLayerScene.activeCamera) {
            return false;
        }

        let pointerEvent = <PointerEvent>pi.event;

        let pointerId = pointerEvent.pointerId || 0;
        let buttonIndex = pointerEvent.button;

        let pickingInfo = pi.pickInfo;
        if (pickingInfo) {
            this.onPickingObservable.notifyObservers(pickingInfo.pickedMesh);
        }

        if (!pickingInfo || !pickingInfo.hit) {
            this._handlePointerOut(pointerId, pi.type === PointerEventTypes.POINTERUP);
            return false;
        }

        if (pickingInfo.pickedPoint) {
            this.onPickedPointChangedObservable.notifyObservers(pickingInfo.pickedPoint);
        }

        const control = <Control3D>pickingInfo.pickedMesh!.reservedDataStore?.GUI3D?.control;
        if (!!control && !control._processObservables(pi.type, pickingInfo.pickedPoint!, pointerId, buttonIndex)) {
            if (pi.type === PointerEventTypes.POINTERMOVE) {
                if (this._lastControlOver[pointerId]) {
                    this._lastControlOver[pointerId]._onPointerOut(this._lastControlOver[pointerId]);
                }

                delete this._lastControlOver[pointerId];
            }
        }

        if (pi.type === PointerEventTypes.POINTERUP) {
            if (this._lastControlDown[pointerEvent.pointerId]) {
                this._lastControlDown[pointerEvent.pointerId].forcePointerUp();
                delete this._lastControlDown[pointerEvent.pointerId];
            }

            if (pointerEvent.pointerType === "touch") {
                this._handlePointerOut(pointerId, false);
            }
        }

        return true;
    }

    private _processTouchControls = () => {
        let utilityLayerScene = this._utilityLayer ? this._utilityLayer.utilityLayerScene : null;
        if (utilityLayerScene) {
            const touchMeshes = utilityLayerScene.getMeshesByTags("touchEnabled");
            // Remove stale meshes
            this._touchIds.forEach((uniqueId, controllerName) => {
                let objectExists = false;
                touchMeshes.forEach((mesh) => {
                    if (mesh.name === controllerName) {
                        objectExists = true;
                    }
                });

                if (!objectExists) {
                    this._touchableButtons.forEach((button) => {
                        button._collisionCheckForStateChange(Vector3.Zero(), uniqueId, true);
                    });
                    this._touchIds.delete(controllerName);
                }
            });

            // Add new meshes
            touchMeshes.forEach((mesh) => {
                let controllerName = mesh.name;
                if (!this._touchIds.has(controllerName)) {
                    this._touchIds.set(controllerName, GUI3DManager._touchIdCounter++);
                }
            });

            this._touchableButtons.forEach((button) => {
                touchMeshes.forEach((mesh) => {
                    let uniqueId = this._touchIds.get(mesh.name)!;
                    button._collisionCheckForStateChange(mesh.getAbsolutePosition(), uniqueId);
                });
            });
        }
    };

    /**
     * Gets the root container
     */
    public get rootContainer(): Container3D {
        return this._rootContainer;
    }

    /**
     * Gets a boolean indicating if the given control is in the root child list
     * @param control defines the control to check
     * @returns true if the control is in the root child list
     */
    public containsControl(control: Control3D): boolean {
        return this._rootContainer.containsControl(control);
    }

    /**
     * Adds a control to the root child list
     * @param control defines the control to add
     * @returns the current manager
     */
    public addControl(control: Control3D): GUI3DManager {
        this._rootContainer.addControl(control);

        let utilityLayerScene = this._utilityLayer ? this._utilityLayer.utilityLayerScene : null;
        if (utilityLayerScene && control instanceof TouchButton3D) {
            if (this._touchableButtons.size == 0) {
                utilityLayerScene.registerBeforeRender(this._processTouchControls);
            }

            this._touchableButtons.add(control as TouchButton3D);
        }

        return this;
    }

    /**
     * Removes a control from the root child list
     * @param control defines the control to remove
     * @returns the current container
     */
    public removeControl(control: Control3D): GUI3DManager {
        this._rootContainer.removeControl(control);

        let utilityLayerScene = this._utilityLayer ? this._utilityLayer.utilityLayerScene : null;
        if (utilityLayerScene && control instanceof TouchButton3D) {
            this._touchableButtons.delete(control);

            if (this._touchableButtons.size == 0) {
                utilityLayerScene.unregisterBeforeRender(this._processTouchControls);
            }
        }

        return this;
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        this._rootContainer.dispose();

        for (var materialName in this._sharedMaterials) {
            if (!this._sharedMaterials.hasOwnProperty(materialName)) {
                continue;
            }

            this._sharedMaterials[materialName].dispose();
        }

        this._sharedMaterials = {};

        for (var materialName in this._touchSharedMaterials) {
            if (!this._touchSharedMaterials.hasOwnProperty(materialName)) {
                continue;
            }

            this._touchSharedMaterials[materialName].dispose();
        }

        this._touchSharedMaterials = {};

        if (this._pointerOutObserver && this._utilityLayer) {
            this._utilityLayer.onPointerOutObservable.remove(this._pointerOutObserver);
            this._pointerOutObserver = null;
        }

        this.onPickedPointChangedObservable.clear();
        this.onPickingObservable.clear();

        let utilityLayerScene = this._utilityLayer ? this._utilityLayer.utilityLayerScene : null;

        if (utilityLayerScene) {
            if (this._touchableButtons.size != 0) {
                utilityLayerScene.unregisterBeforeRender(this._processTouchControls);
            }

            if (this._pointerObserver) {
                utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
                this._pointerObserver = null;
            }
        }
        if (this._scene) {
            if (this._sceneDisposeObserver) {
                this._scene.onDisposeObservable.remove(this._sceneDisposeObserver);
                this._sceneDisposeObserver = null;
            }
        }

        if (this._utilityLayer) {
            this._utilityLayer.dispose();
        }
    }
}
