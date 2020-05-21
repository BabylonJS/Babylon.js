import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { PointerEventTypes } from "babylonjs/Events/pointerEvents";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { IBehaviorAware, Behavior } from "babylonjs/Behaviors/behavior";
import { IDisposable, Scene } from "babylonjs/scene";

import { GUI3DManager } from "../gui3DManager";
import { Vector3WithInfo } from "../vector3WithInfo";
import { Container3D } from "./container3D";

/**
 * Class used as base class for controls
 */
export class Control3D implements IDisposable, IBehaviorAware<Control3D> {
    /** @hidden */
    public _host: GUI3DManager;
    private _node: Nullable<TransformNode>;
    private _downCount = 0;
    private _enterCount = -1;
    private _downPointerIds: { [id: number]: boolean } = {};
    private _isVisible = true;

    /** Gets or sets the control position  in world space */
    public get position(): Vector3 {
        if (!this._node) {
            return Vector3.Zero();
        }

        return this._node.position;
    }

    public set position(value: Vector3) {
        if (!this._node) {
            return;
        }

        this._node.position = value;
    }

    /** Gets or sets the control scaling  in world space */
    public get scaling(): Vector3 {
        if (!this._node) {
            return new Vector3(1, 1, 1);
        }

        return this._node.scaling;
    }

    public set scaling(value: Vector3) {
        if (!this._node) {
            return;
        }

        this._node.scaling = value;
    }

    /** Callback used to start pointer enter animation */
    public pointerEnterAnimation: () => void;
    /** Callback used to start pointer out animation */
    public pointerOutAnimation: () => void;
    /** Callback used to start pointer down animation */
    public pointerDownAnimation: () => void;
    /** Callback used to start pointer up animation */
    public pointerUpAnimation: () => void;

    /**
    * An event triggered when the pointer move over the control
    */
    public onPointerMoveObservable = new Observable<Vector3>();

    /**
     * An event triggered when the pointer move out of the control
     */
    public onPointerOutObservable = new Observable<Control3D>();

    /**
     * An event triggered when the pointer taps the control
     */
    public onPointerDownObservable = new Observable<Vector3WithInfo>();

    /**
     * An event triggered when pointer is up
     */
    public onPointerUpObservable = new Observable<Vector3WithInfo>();

    /**
     * An event triggered when a control is clicked on (with a mouse)
     */
    public onPointerClickObservable = new Observable<Vector3WithInfo>();

    /**
     * An event triggered when pointer enters the control
     */
    public onPointerEnterObservable = new Observable<Control3D>();

    /**
     * Gets or sets the parent container
     */
    public parent: Nullable<Container3D>;

    // Behaviors
    private _behaviors = new Array<Behavior<Control3D>>();

    /**
     * Gets the list of attached behaviors
     * @see http://doc.babylonjs.com/features/behaviour
     */
    public get behaviors(): Behavior<Control3D>[] {
        return this._behaviors;
    }

    /**
     * Attach a behavior to the control
     * @see http://doc.babylonjs.com/features/behaviour
     * @param behavior defines the behavior to attach
     * @returns the current control
     */
    public addBehavior(behavior: Behavior<Control3D>): Control3D {
        var index = this._behaviors.indexOf(behavior);

        if (index !== -1) {
            return this;
        }

        behavior.init();
        let scene = this._host.scene;
        if (scene.isLoading) {
            // We defer the attach when the scene will be loaded
            scene.onDataLoadedObservable.addOnce(() => {
                behavior.attach(this);
            });
        } else {
            behavior.attach(this);
        }
        this._behaviors.push(behavior);

        return this;
    }

    /**
     * Remove an attached behavior
     * @see http://doc.babylonjs.com/features/behaviour
     * @param behavior defines the behavior to attach
     * @returns the current control
     */
    public removeBehavior(behavior: Behavior<Control3D>): Control3D {
        var index = this._behaviors.indexOf(behavior);

        if (index === -1) {
            return this;
        }

        this._behaviors[index].detach();
        this._behaviors.splice(index, 1);

        return this;
    }

    /**
     * Gets an attached behavior by name
     * @param name defines the name of the behavior to look for
     * @see http://doc.babylonjs.com/features/behaviour
     * @returns null if behavior was not found else the requested behavior
     */
    public getBehaviorByName(name: string): Nullable<Behavior<Control3D>> {
        for (var behavior of this._behaviors) {
            if (behavior.name === name) {
                return behavior;
            }
        }

        return null;
    }

    /** Gets or sets a boolean indicating if the control is visible */
    public get isVisible(): boolean {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        if (this._isVisible === value) {
            return;
        }

        this._isVisible = value;

        let mesh = this.mesh;
        if (mesh) {
            mesh.setEnabled(value);
        }
    }

    /**
     * Creates a new control
     * @param name defines the control name
     */
    constructor(
        /** Defines the control name */
        public name?: string) {
    }

    /**
     * Gets a string representing the class name
     */
    public get typeName(): string {
        return this._getTypeName();
    }

    /**
     * Get the current class name of the control.
     * @returns current class name
     */
    public getClassName(): string {
        return this._getTypeName();
    }

    protected _getTypeName(): string {
        return "Control3D";
    }

    /**
     * Gets the transform node used by this control
     */
    public get node(): Nullable<TransformNode> {
        return this._node;
    }

    /**
     * Gets the mesh used to render this control
     */
    public get mesh(): Nullable<AbstractMesh> {
        if (this._node instanceof AbstractMesh) {
            return this._node as AbstractMesh;
        }

        return null;
    }

    /**
     * Link the control as child of the given node
     * @param node defines the node to link to. Use null to unlink the control
     * @returns the current control
     */
    public linkToTransformNode(node: Nullable<TransformNode>): Control3D {
        if (this._node) {
            this._node.parent = node;
        }
        return this;
    }

    /** @hidden **/
    public _prepareNode(scene: Scene): void {
        if (!this._node) {
            this._node = this._createNode(scene);

            if (!this.node) {
                return;
            }
            this._node!.metadata = this; // Store the control on the metadata field in order to get it when picking
            this._node!.position = this.position;
            this._node!.scaling = this.scaling;

            let mesh = this.mesh;
            if (mesh) {
                mesh.isPickable = true;

                this._affectMaterial(mesh);
            }
        }
    }

    /**
     * Node creation.
     * Can be overriden by children
     * @param scene defines the scene where the node must be attached
     * @returns the attached node or null if none. Must return a Mesh or AbstractMesh if there is an atttached visible object
     */
    protected _createNode(scene: Scene): Nullable<TransformNode> {
        // Do nothing by default
        return null;
    }

    /**
     * Affect a material to the given mesh
     * @param mesh defines the mesh which will represent the control
     */
    protected _affectMaterial(mesh: AbstractMesh) {
        mesh.material = null;
    }

    // Pointers

    /** @hidden */
    public _onPointerMove(target: Control3D, coordinates: Vector3): void {
        this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);
    }

    /** @hidden */
    public _onPointerEnter(target: Control3D): boolean {
        if (this._enterCount > 0) {
            return false;
        }

        if (this._enterCount === -1) { // -1 is for touch input, we are now sure we are with a mouse or pencil
            this._enterCount = 0;
        }

        this._enterCount++;

        this.onPointerEnterObservable.notifyObservers(this, -1, target, this);

        if (this.pointerEnterAnimation) {
            this.pointerEnterAnimation();
        }

        return true;
    }

    /** @hidden */
    public _onPointerOut(target: Control3D): void {
        this._enterCount = 0;

        this.onPointerOutObservable.notifyObservers(this, -1, target, this);

        if (this.pointerOutAnimation) {
            this.pointerOutAnimation();
        }
    }

    /** @hidden */
    public _onPointerDown(target: Control3D, coordinates: Vector3, pointerId: number, buttonIndex: number): boolean {
        if (this._downCount !== 0) {
            this._downCount++;
            return false;
        }

        this._downCount++;

        this._downPointerIds[pointerId] = true;

        this.onPointerDownObservable.notifyObservers(new Vector3WithInfo(coordinates, buttonIndex), -1, target, this);

        if (this.pointerDownAnimation) {
            this.pointerDownAnimation();
        }

        return true;
    }

    /** @hidden */
    public _onPointerUp(target: Control3D, coordinates: Vector3, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        this._downCount--;
        delete this._downPointerIds[pointerId];

        if (this._downCount < 0) {
            // Handle if forcePointerUp was called prior to this
            this._downCount = 0;
            return;
        }

        if (this._downCount == 0) {
            if (notifyClick && (this._enterCount > 0 || this._enterCount === -1)) {
                this.onPointerClickObservable.notifyObservers(new Vector3WithInfo(coordinates, buttonIndex), -1, target, this);
            }
            this.onPointerUpObservable.notifyObservers(new Vector3WithInfo(coordinates, buttonIndex), -1, target, this);

            if (this.pointerUpAnimation) {
                this.pointerUpAnimation();
            }
        }
    }

    /** @hidden */
    public forcePointerUp(pointerId: Nullable<number> = null) {
        if (pointerId !== null) {
            this._onPointerUp(this, Vector3.Zero(), pointerId, 0, true);
        } else {
            for (var key in this._downPointerIds) {
                this._onPointerUp(this, Vector3.Zero(), +key as number, 0, true);
            }
            if (this._downCount > 0) {
                this._downCount = 1;
                this._onPointerUp(this, Vector3.Zero(), 0, 0, true);
            }

        }
    }

    /** @hidden */
    public _processObservables(type: number, pickedPoint: Vector3, pointerId: number, buttonIndex: number): boolean {
        if (type === PointerEventTypes.POINTERMOVE) {
            this._onPointerMove(this, pickedPoint);

            var previousControlOver = this._host._lastControlOver[pointerId];
            if (previousControlOver && previousControlOver !== this) {
                previousControlOver._onPointerOut(this);
            }

            if (previousControlOver !== this) {
                this._onPointerEnter(this);
            }

            this._host._lastControlOver[pointerId] = this;
            return true;
        }

        if (type === PointerEventTypes.POINTERDOWN) {
            this._onPointerDown(this, pickedPoint, pointerId, buttonIndex);
            this._host._lastControlDown[pointerId] = this;
            this._host._lastPickedControl = this;
            return true;
        }

        if (type === PointerEventTypes.POINTERUP || type === PointerEventTypes.POINTERDOUBLETAP) {
            if (this._host._lastControlDown[pointerId]) {
                this._host._lastControlDown[pointerId]._onPointerUp(this, pickedPoint, pointerId, buttonIndex, true);
            }
            delete this._host._lastControlDown[pointerId];
            return true;
        }

        return false;
    }

    /** @hidden */
    public _disposeNode(): void {
        if (this._node) {
            this._node.dispose();
            this._node = null;
        }
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        this.onPointerDownObservable.clear();
        this.onPointerEnterObservable.clear();
        this.onPointerMoveObservable.clear();
        this.onPointerOutObservable.clear();
        this.onPointerUpObservable.clear();
        this.onPointerClickObservable.clear();

        this._disposeNode();

        // Behaviors
        for (var behavior of this._behaviors) {
            behavior.detach();
        }
    }
}