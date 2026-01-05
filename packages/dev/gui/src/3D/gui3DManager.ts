/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { Vector3 } from "core/Maths/math.vector";
import type { PointerInfo } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { Material } from "core/Materials/material";
import { HemisphericLight } from "core/Lights/hemisphericLight";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { EngineStore } from "core/Engines/engineStore";
import type { IDisposable, Scene } from "core/scene";

import { Container3D } from "./controls/container3D";
import type { Control3D } from "./controls/control3D";
import type { IPointerEvent } from "core/Events/deviceInputEvents";

/**
 * Class used to manage 3D user interface
 * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui3D
 */
export class GUI3DManager implements IDisposable {
    private _scene: Scene;
    private _sceneDisposeObserver: Nullable<Observer<Scene>>;
    private _utilityLayer: Nullable<UtilityLayerRenderer>;
    private _rootContainer: Container3D;
    private _pointerObserver: Nullable<Observer<PointerInfo>>;
    private _pointerOutObserver: Nullable<Observer<number>>;
    private _customControlScaling = 1.0;
    /** @internal */
    public _lastPickedControl: Control3D;
    /** @internal */
    public _lastControlOver: { [pointerId: number]: Control3D } = {};
    /** @internal */
    public _lastControlDown: { [pointerId: number]: Control3D } = {};

    protected static MRTK_REALISTIC_SCALING: number = 0.032;

    /**
     * Observable raised when the point picked by the pointer events changed
     */
    public onPickedPointChangedObservable = new Observable<Nullable<Vector3>>();

    /**
     * Observable raised when a picking happens
     */
    public onPickingObservable = new Observable<Nullable<AbstractMesh>>();

    // Shared resources
    /** @internal */
    public _sharedMaterials: { [key: string]: Material } = {};

    /** @internal */
    public _touchSharedMaterials: { [key: string]: Material } = {};

    /** Gets the hosting scene */
    public get scene(): Scene {
        return this._scene;
    }

    /** Gets associated utility layer */
    public get utilityLayer(): Nullable<UtilityLayerRenderer> {
        return this._utilityLayer;
    }

    /** Gets the scaling for all UI elements owned by this manager */
    public get controlScaling() {
        return this._customControlScaling;
    }

    /** Sets the scaling adjustment for all UI elements owned by this manager */
    public set controlScaling(newScale: number) {
        if (this._customControlScaling !== newScale && newScale > 0) {
            const scaleRatio = newScale / this._customControlScaling;
            this._customControlScaling = newScale;

            for (const control of this._rootContainer.children) {
                control.scaling.scaleInPlace(scaleRatio);

                if (newScale !== 1) {
                    control._isScaledByManager = true;
                }
            }
        }
    }

    /** Gets if controls attached to this manager are realistically sized, based on the fact that 1 unit length is 1 meter */
    public get useRealisticScaling() {
        return this.controlScaling === GUI3DManager.MRTK_REALISTIC_SCALING;
    }

    /** Sets if controls attached to this manager are realistically sized, based on the fact that 1 unit length is 1 meter */
    public set useRealisticScaling(newValue: boolean) {
        this.controlScaling = newValue ? GUI3DManager.MRTK_REALISTIC_SCALING : 1;
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
        const utilityLayerScene = this._utilityLayer.utilityLayerScene;

        // Events
        this._pointerOutObserver = this._utilityLayer.onPointerOutObservable.add((pointerId) => {
            this._handlePointerOut(pointerId, true);
        });

        this._pointerObserver = utilityLayerScene.onPointerObservable.add((pi) => {
            this._doPicking(pi);
        });

        // Scene
        this._utilityLayer.utilityLayerScene.autoClear = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = false;
        new HemisphericLight("hemi", Vector3.Up(), this._utilityLayer.utilityLayerScene);
    }

    private _handlePointerOut(pointerId: number, isPointerUp: boolean) {
        const previousControlOver = this._lastControlOver[pointerId];
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

        const pointerEvent = <IPointerEvent>pi.event;

        const pointerId = pointerEvent.pointerId || 0;
        const buttonIndex = pointerEvent.button;

        const pickingInfo = pi.pickInfo;
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
        if (!!control && !control._processObservables(pi.type, pickingInfo.pickedPoint!, pickingInfo.originMesh?.position || null, pointerId, buttonIndex)) {
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

            if (pointerEvent.pointerType === "touch" || (pointerEvent.pointerType === "xr" && this._scene.getEngine().hostInformation.isMobile)) {
                this._handlePointerOut(pointerId, false);
            }
        }

        return true;
    }

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
        if (this._customControlScaling !== 1) {
            control.scaling.scaleInPlace(this._customControlScaling);
            control._isScaledByManager = true;
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
        if (control._isScaledByManager) {
            control.scaling.scaleInPlace(1 / this._customControlScaling);
            control._isScaledByManager = false;
        }
        return this;
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        this._rootContainer.dispose();

        for (const materialName in this._sharedMaterials) {
            if (!Object.prototype.hasOwnProperty.call(this._sharedMaterials, materialName)) {
                continue;
            }

            this._sharedMaterials[materialName].dispose();
        }

        this._sharedMaterials = {};

        for (const materialName in this._touchSharedMaterials) {
            if (!Object.prototype.hasOwnProperty.call(this._touchSharedMaterials, materialName)) {
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

        const utilityLayerScene = this._utilityLayer ? this._utilityLayer.utilityLayerScene : null;

        if (utilityLayerScene) {
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
