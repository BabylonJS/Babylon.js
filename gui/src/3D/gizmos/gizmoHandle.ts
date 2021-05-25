import { Scene } from "babylonjs/scene";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { HandleMaterial } from "../materials";
import { SlateGizmo } from "./slateGizmo";
import { VirtualSixDofDragBehavior } from "babylonjs/Behaviors/Meshes/virtualSixDofDragBehavior";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";

/**
 * State of the handle regarding user interaction
 */
export enum HandleState {
    IDLE = 0,
    HOVER = 1,
    DRAG = 2,
}

export abstract class GizmoHandle {
    protected _scene: Scene;
    protected _state: HandleState = HandleState.IDLE;
    protected _materials: HandleMaterial[] = [];


    private _dragStartObserver: Nullable<Observer<any>>;
    private _draggingObserver: Nullable<
        Observer<any>
    >;
    private _dragEndObserver: Nullable<Observer<any>>;
    /**
     * @hidden
     */
    public _dragBehavior: VirtualSixDofDragBehavior;

    /**
     * The current state of the handle
     */
    public get state(): HandleState {
        return this._state;
    }

    private _gizmo: SlateGizmo;

    /**
     * Returns the gizmo carrying this handle
     */
    public get gizmo() {
        return this._gizmo;
    }

    /**
     * Sets hover state
     */
    public set hover(value: boolean) {
        if (value) {
            this._state |= HandleState.HOVER;
        } else {
            this._state &= ~HandleState.HOVER;
        }

        this._updateMaterial();
    }

    public set drag(value: boolean) {
        if (value) {
            this._state |= HandleState.DRAG;
        } else {
            this._state &= ~HandleState.DRAG;
        }

        this._updateMaterial();
    }

    public node: TransformNode;

    constructor(gizmo: SlateGizmo, scene: Scene) {
        this._scene = scene;
        this._gizmo = gizmo;

        this.node = this.createNode();
        this.node.reservedDataStore = {
            handle: this,
        };
    }

    protected _createMaterial(positionOffset?: Vector3) {
        const mat = new HandleMaterial("handle", this._scene);
        if (positionOffset) {
            mat._positionOffset = positionOffset;
        }
        return mat;
    }

    private _updateMaterial() {
        const state = this._state;
        for (const mat of this._materials) {
            mat.hover = false;
            mat.drag = false;
        }

        if (state & HandleState.DRAG) {
            for (const mat of this._materials) {
                mat.drag = true;
            }
        } else if (state & HandleState.HOVER) {
            for (const mat of this._materials) {
                mat.hover = true;
            }
        }
    }

    public setDragBehavior(
        dragStartObservable: (eventData: any) => void,
        dragObservable: (eventData: any) => void,
        dragEndObservable: (eventData: any) => void
    ) {
        const dragBehavior = new VirtualSixDofDragBehavior();
        this.node.addBehavior(dragBehavior);

        this._dragBehavior = dragBehavior;

        this._dragStartObserver = dragBehavior.onDragStartObservable.add(dragStartObservable);
        this._draggingObserver = dragBehavior.onDragObservable.add(dragObservable);
        this._dragEndObserver = dragBehavior.onDragEndObservable.add(dragEndObservable);
    }

    public abstract createNode(): TransformNode;

    /**
     * Disposes the handle
     */
    public dispose() {
        this._dragBehavior.onDragStartObservable.remove(this._dragStartObserver);
        this._dragBehavior.onDragObservable.remove(this._draggingObserver);
        this._dragBehavior.onDragEndObservable.remove(this._dragEndObserver);

        this._dragBehavior.detach();
        this.node.dispose();
    }
}

export class SideHandle extends GizmoHandle {
    public createNode() {
        // Create a simple vertical rectangle
        const verticalBox = BoxBuilder.CreateBox("sideVert", { width: 1, height: 10, depth: 0.1 }, this._scene);
        const sideNode = new TransformNode("side", this._scene);
        verticalBox.parent = sideNode;

        const mat = this._createMaterial();
        verticalBox.material = mat;
        this._materials.push(mat);

        return sideNode;
    }
}

export class CornerHandle extends GizmoHandle {
    public createNode() {
        // Create 2 boxes making a bottom left corner
        const horizontalBox = BoxBuilder.CreateBox("angleHor", { width: 3, height: 1, depth: 0.1 }, this._scene);
        const verticalBox = BoxBuilder.CreateBox("angleVert", { width: 1, height: 3, depth: 0.1 }, this._scene);

        const angleNode = new TransformNode("angle", this._scene);
        horizontalBox.parent = angleNode;
        verticalBox.parent = angleNode;

        horizontalBox.material = this._createMaterial(new Vector3(1, 0, 0));
        verticalBox.material = this._createMaterial(new Vector3(0, 1, 0));

        this._materials.push(horizontalBox.material as HandleMaterial);
        this._materials.push(verticalBox.material as HandleMaterial);
        return angleNode;
    }
}
