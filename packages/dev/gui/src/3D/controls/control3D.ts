import type { Nullable } from "core/types";
import { Observable } from "core/Misc/observable";
import { Vector3 } from "core/Maths/math.vector";
import { PointerEventTypes } from "core/Events/pointerEvents";
import type { TransformNode } from "core/Meshes/transformNode";
import { AbstractMesh } from "core/Meshes/abstractMesh";
import type { IBehaviorAware, Behavior } from "core/Behaviors/behavior";
import type { IDisposable, Scene } from "core/scene";

import type { GUI3DManager } from "../gui3DManager";
import { Vector3WithInfo } from "../vector3WithInfo";
import type { Container3D } from "./container3D";

import type { TouchButton3D } from "./touchButton3D";

/**
 * Class used as base class for controls
 */
export class Control3D implements IDisposable, IBehaviorAware<Control3D> {
    private _node: Nullable<TransformNode>;
    private _downCount = 0;
    private _enterCount = -1;
    private _downPointerIds: { [id: number]: number } = {}; // Store number of pointer downs per ID, from near and far interactions

    protected _isVisible = true;

    /** @internal */
    public _host: GUI3DManager;
    /** @internal */
    public _isScaledByManager = false;

    /** Gets or sets the control position in world space */
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

    /** Gets or sets the control scaling in world space */
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

        this._isScaledByManager = false;
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
     * An event triggered when the pointer moves over the control
     */
    public onPointerMoveObservable = new Observable<Vector3>();

    /**
     * An event triggered when the pointer moves out of the control
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     */
    public get behaviors(): Behavior<Control3D>[] {
        return this._behaviors;
    }

    /**
     * Attach a behavior to the control
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     * @param behavior defines the behavior to attach
     * @returns the current control
     */
    public addBehavior(behavior: Behavior<Control3D>): Control3D {
        const index = this._behaviors.indexOf(behavior);

        if (index !== -1) {
            return this;
        }

        behavior.init();
        const scene = this._host.scene;
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     * @param behavior defines the behavior to attach
     * @returns the current control
     */
    public removeBehavior(behavior: Behavior<Control3D>): Control3D {
        const index = this._behaviors.indexOf(behavior);

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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/behaviors
     * @returns null if behavior was not found else the requested behavior
     */
    public getBehaviorByName(name: string): Nullable<Behavior<Control3D>> {
        for (const behavior of this._behaviors) {
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

        const mesh = this.mesh;
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
        public name?: string
    ) {}

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

    /**
     * @internal
     */
    public _prepareNode(scene: Scene): void {
        if (!this._node) {
            this._node = this._createNode(scene);

            if (!this.node) {
                return;
            }
            this._injectGUI3DReservedDataStore(this.node).control = this; // Store the control on the reservedDataStore field in order to get it when picking

            const mesh = this.mesh;
            if (mesh) {
                mesh.isPickable = true;

                this._affectMaterial(mesh);
            }
        }
    }

    protected _injectGUI3DReservedDataStore(node: TransformNode): any {
        node.reservedDataStore = node.reservedDataStore ?? {};
        node.reservedDataStore.GUI3D = node.reservedDataStore.GUI3D ?? {};
        return node.reservedDataStore.GUI3D;
    }

    /**
     * Node creation.
     * Can be overriden by children
     * @param scene defines the scene where the node must be attached
     * @returns the attached node or null if none. Must return a Mesh or AbstractMesh if there is an attached visible object
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    private _isTouchButton3D(control: Control3D): control is TouchButton3D {
        return (control as TouchButton3D)._generatePointerEventType !== undefined;
    }

    // Pointers

    /**
     * @internal
     */
    public _onPointerMove(target: Control3D, coordinates: Vector3): void {
        this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);
    }

    /**
     * @internal
     */
    public _onPointerEnter(target: Control3D): boolean {
        if (this._enterCount === -1) {
            // -1 is for touch input, we are now sure we are with a mouse or pencil
            this._enterCount = 0;
        }

        this._enterCount++;

        if (this._enterCount > 1) {
            return false;
        }

        this.onPointerEnterObservable.notifyObservers(this, -1, target, this);

        if (this.pointerEnterAnimation) {
            this.pointerEnterAnimation();
        }

        return true;
    }

    /**
     * @internal
     */
    public _onPointerOut(target: Control3D): void {
        this._enterCount--;

        if (this._enterCount > 0) {
            return;
        }

        this._enterCount = 0;

        this.onPointerOutObservable.notifyObservers(this, -1, target, this);

        if (this.pointerOutAnimation) {
            this.pointerOutAnimation();
        }
    }

    /**
     * @internal
     */
    public _onPointerDown(target: Control3D, coordinates: Vector3, pointerId: number, buttonIndex: number): boolean {
        this._downCount++;
        this._downPointerIds[pointerId] = this._downPointerIds[pointerId] + 1 || 1;

        if (this._downCount !== 1) {
            return false;
        }

        this.onPointerDownObservable.notifyObservers(new Vector3WithInfo(coordinates, buttonIndex), -1, target, this);

        if (this.pointerDownAnimation) {
            this.pointerDownAnimation();
        }

        return true;
    }

    /**
     * @internal
     */
    public _onPointerUp(target: Control3D, coordinates: Vector3, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        this._downCount--;
        this._downPointerIds[pointerId]--;

        if (this._downPointerIds[pointerId] <= 0) {
            delete this._downPointerIds[pointerId];
        }

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

    /**
     * @internal
     */
    public forcePointerUp(pointerId: Nullable<number> = null) {
        if (pointerId !== null) {
            this._onPointerUp(this, Vector3.Zero(), pointerId, 0, true);
        } else {
            for (const key in this._downPointerIds) {
                this._onPointerUp(this, Vector3.Zero(), +key as number, 0, true);
            }
            if (this._downCount > 0) {
                this._downCount = 1;
                this._onPointerUp(this, Vector3.Zero(), 0, 0, true);
            }
        }
    }

    /**
     * @internal
     */
    public _processObservables(type: number, pickedPoint: Vector3, originMeshPosition: Nullable<Vector3>, pointerId: number, buttonIndex: number): boolean {
        if (this._isTouchButton3D(this) && originMeshPosition) {
            type = this._generatePointerEventType(type, originMeshPosition, this._downCount);
        }

        if (type === PointerEventTypes.POINTERMOVE) {
            this._onPointerMove(this, pickedPoint);

            const previousControlOver = this._host._lastControlOver[pointerId];
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

    /** @internal */
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
        for (const behavior of this._behaviors) {
            behavior.detach();
        }
    }
}
