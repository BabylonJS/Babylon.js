import { IDisposable, Scene } from '../../../scene';
import { WebXRControllerComponent } from './webXRControllerComponent';
import { Observable } from '../../../Misc/observable';
import { Logger } from '../../../Misc/logger';
import { SceneLoader } from '../../../Loading/sceneLoader';
import { AbstractMesh } from '../../../Meshes/abstractMesh';
import { Nullable } from '../../../types';
import { Quaternion, Vector3 } from '../../../Maths/math.vector';
import { Mesh } from '../../../Meshes/mesh';

export type MotionControllerHandness = "none" | "left" | "right" | "left-right" | "left-right-none";
export type MotionControllerComponentType = "trigger" | "squeeze" | "touchpad" | "thumbstick" | "button";

// Profiels can be found here - https://github.com/immersive-web/webxr-input-profiles/tree/master/packages/registry/profiles
export interface IMotionControllerLayout {
    selectComponentId: string;
    components: {
        [componentId: string]: {
            type: MotionControllerComponentType;
        }
    };
    gamepad?: {
        mapping: "" | "xr-standard";
        buttons: Array<string | null>; /* correlates to the componentId in components */
        axes: Array<{
            componentId: string;
            axis: "x-axis" | "y-axis";
        } | null>;
    };
}

export interface IMotionControllerLayoutMap {
    [handness: string /* handness */]: IMotionControllerLayout;
}
export interface IMotionControllerProfile {
    profileId: string;
    fallbackProfileIds: string[];
    layouts: IMotionControllerLayoutMap;
}

export interface IMotionControllerButtonMeshMap {
    valueMesh: AbstractMesh;
    pressedMesh: AbstractMesh;
    unpressedMesh: AbstractMesh;
}

export interface IMotionControllerAxisMeshMap {
    valueMesh: AbstractMesh;
    minMesh: AbstractMesh;
    maxMesh: AbstractMesh;
}

export interface IMinimalMotionControllerObject {
    id?: string;
    buttons: Array<{
        /**
        * Value of the button/trigger
        */
        value: number;
        /**
         * If the button/trigger is currently touched
         */
        touched: boolean;
        /**
         * If the button/trigger is currently pressed
         */
        pressed: boolean;
    }>;
    axes: number[];
}

export abstract class WebXRAbstractMotionController implements IDisposable {

    // constants
    public static ComponentType = {
        TRIGGER: "trigger",
        SQUEEZE: "squeeze",
        TOUCHPAD: "touchpad",
        THUMBSTICK: "thumbstick",
        BUTTON: "button"
    };

    public abstract profileId: string;

    public readonly components: {
        [id: string]: WebXRControllerComponent
    } = {};

    public onModelLoadedObservable: Observable<WebXRAbstractMotionController> = new Observable();
    public rootMesh: Nullable<AbstractMesh>;
    private _modelReady: boolean = false;

    constructor(protected scene: Scene, protected layout: IMotionControllerLayout,
        protected gamepadObject: IMinimalMotionControllerObject,
        public handness: MotionControllerHandness,
        _doNotLoadControllerMesh: boolean = false) {
        // initialize the components
        if (layout.gamepad) {
            layout.gamepad.buttons.forEach(this.initComponent);
        }
        // Model is loaded in WebXRInput
    }

    private initComponent = (id: string | null) => {
        if (!this.layout.gamepad || !id) { return; }
        const type = this.layout.components[id].type;
        const buttonIndex = this.layout.gamepad.buttons.indexOf(id);
        // search for axes
        let axes: number[] = [];
        this.layout.gamepad.axes.forEach((axis, index) => {
            if (axis && axis.componentId === id) {
                if (axis.axis === "x-axis") {
                    axes[0] = index;
                } else {
                    axes[1] = index;
                }
            }
        });
        this.components[id] = new WebXRControllerComponent(id, type, buttonIndex, axes);
    }

    public update(xrFrame: XRFrame) {
        this.getComponentTypes().forEach((id) => this.getComponent(id).update(this.gamepadObject));
        this.updateModel(xrFrame);
    }

    public getComponentTypes() {
        return Object.keys(this.components);
    }

    public getMainComponent() {
        return this.getComponent(this.layout.selectComponentId);
    }

    public getComponent(id: string) {
        return this.components[id];
    }

    public async loadModel(): Promise<boolean> {
        let useGeneric = !this._getModelLoadingConstraints();
        let loadingParams = this._getGenericFilenameAndPath();
        // Checking if GLB loader is present
        if (useGeneric) {
            Logger.Warn("You need to reference GLTF loader to load Windows Motion Controllers model. Falling back to generic models");
        } else {
            loadingParams = this._getFilenameAndPath();
        }
        return new Promise((resolve, reject) => {
            SceneLoader.ImportMesh("", loadingParams.path, loadingParams.filename, this.scene, (meshes: AbstractMesh[]) => {
                if (useGeneric) {
                    this._getGenericParentMesh(meshes);
                } else {
                    this._setRootMesh(meshes);
                }
                this._processLoadedModel(meshes);
                this._modelReady = true;
                this.onModelLoadedObservable.notifyObservers(this);
                resolve(true);
            }, null, (_scene: Scene, message: string) => {
                Logger.Log(message);
                Logger.Warn(`Failed to retrieve controller model of type ${this.profileId} from the remote server: ${loadingParams.path}${loadingParams.filename}`);
                reject(message);
            });
        });
    }

    public updateModel(xrFrame: XRFrame) {
        if (!this._modelReady) {
            return;
        }
        this._updateModel(xrFrame);
    }

    /**
     * Moves the axis on the controller mesh based on its current state
     * @param axis the index of the axis
     * @param axisValue the value of the axis which determines the meshes new position
     * @hidden
     */
    protected _lerpAxisTransform(axisMap: IMotionControllerAxisMeshMap, axisValue: number) {

        if (!axisMap.minMesh.rotationQuaternion || !axisMap.maxMesh.rotationQuaternion || !axisMap.valueMesh.rotationQuaternion) {
            return;
        }

        // Convert from gamepad value range (-1 to +1) to lerp range (0 to 1)
        let lerpValue = axisValue * 0.5 + 0.5;
        Quaternion.SlerpToRef(
            axisMap.minMesh.rotationQuaternion,
            axisMap.maxMesh.rotationQuaternion,
            lerpValue,
            axisMap.valueMesh.rotationQuaternion);
        Vector3.LerpToRef(
            axisMap.minMesh.position,
            axisMap.maxMesh.position,
            lerpValue,
            axisMap.valueMesh.position);
    }

    /**
     * Moves the buttons on the controller mesh based on their current state
     * @param buttonName the name of the button to move
     * @param buttonValue the value of the button which determines the buttons new position
     */
    protected _lerpButtonTransform(buttonMap: IMotionControllerButtonMeshMap, buttonValue: number) {

        if (!buttonMap
            || !buttonMap.unpressedMesh.rotationQuaternion
            || !buttonMap.pressedMesh.rotationQuaternion
            || !buttonMap.valueMesh.rotationQuaternion) {
            return;
        }

        Quaternion.SlerpToRef(
            buttonMap.unpressedMesh.rotationQuaternion,
            buttonMap.pressedMesh.rotationQuaternion,
            buttonValue,
            buttonMap.valueMesh.rotationQuaternion);
        Vector3.LerpToRef(
            buttonMap.unpressedMesh.position,
            buttonMap.pressedMesh.position,
            buttonValue,
            buttonMap.valueMesh.position);
    }

    private _getGenericFilenameAndPath(): { filename: string, path: string } {
        return {
            filename: "generic.babylon",
            path: "https://controllers.babylonjs.com/generic/"
        };
    }

    private _getGenericParentMesh(meshes: AbstractMesh[]): void {
        this.rootMesh = new Mesh(this.profileId + " " + this.handness, this.scene);

        meshes.forEach((mesh) => {
            if (!mesh.parent) {
                mesh.isPickable = false;
                mesh.setParent(this.rootMesh);
            }
        });

        this.rootMesh.rotationQuaternion = Quaternion.FromEulerAngles(0, Math.PI, 0);
    }

    protected abstract _getFilenameAndPath(): { filename: string, path: string };
    protected abstract _processLoadedModel(meshes: AbstractMesh[]): void;
    protected abstract _setRootMesh(meshes: AbstractMesh[]): void;
    protected abstract _updateModel(xrFrame: XRFrame): void;
    protected abstract _getModelLoadingConstraints(): boolean;

    public dispose(): void {
        this.getComponentTypes().forEach((id) => this.getComponent(id).dispose());
    }
}