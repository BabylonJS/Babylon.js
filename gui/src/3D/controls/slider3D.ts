import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Vector3 } from "babylonjs/Maths/math.vector";
import { TransformNode } from "babylonjs/Meshes/transformNode";
import { Scene } from "babylonjs/scene";
import { Mesh } from "babylonjs/Meshes/mesh";
import { Control3D } from "./control3D";
import { BoxBuilder } from "babylonjs/Meshes/Builders/boxBuilder";
import { CylinderBuilder } from "babylonjs/Meshes/Builders/cylinderBuilder";
import { PointerDragBehavior } from "babylonjs/Behaviors/Meshes/pointerDragBehavior";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Color3 } from "babylonjs/Maths/math.color";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";

const SLIDER_MIN: number = 0;
const SLIDER_MAX: number = 100;
const SLIDER_VAL: number = 50;
const SLIDER_STEP: number = 0;
const SLIDER_SCALING: number = 2.0;

/**
 * Class used to create a slider in 3D
 */
export class Slider3D extends Control3D {
    private _sliderBarMaterial: StandardMaterial;
    private _sliderThumbMaterial: StandardMaterial;
    private _sliderThumb: Mesh;
    private _sliderBar: Mesh;

    private _minimum: number;
    private _maximum: number;
    private _value: number;
    private _step: number;

    /** Observable raised when the sldier value changes */
    public onValueChangedObservable = new Observable<number>();

    /**
     * Creates a new slider
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        this._minimum = SLIDER_MIN;
        this._maximum = SLIDER_MAX;
        this._step = SLIDER_STEP;
        this._value = SLIDER_VAL;
    }

    /**
     * Gets the mesh used to render this control
     */
    public get mesh(): Nullable<AbstractMesh> {
        if (this.node) {
            return this._sliderThumb;
        }

        return null;
    }

    /** Gets or sets minimum value */
    public get minimum(): number {
        return this._minimum;
    }

    public set minimum(value: number) {
        if (this._minimum === value) {
            return;
        }

        this._minimum = Math.max(value, SLIDER_MIN);
        this._value = Math.max(Math.min(this._value, this._maximum), this._minimum);
    }

    /** Gets or sets maximum value */
    public get maximum(): number {
        return this._maximum;
    }

    public set maximum(value: number) {
        if (this._maximum === value) {
            return;
        }

        this._maximum = Math.max(value, this._minimum);
        this._value = Math.max(Math.min(this._value, this._maximum), this._minimum);
    }

    /** Gets or sets step value */
    public get step(): number {
        return this._step;
    }

    public set step(value: number) {
        if (this._step === value) {
            return;
        }

        this._step = Math.max(Math.min(value, this._maximum - this._minimum), SLIDER_STEP);
    }

    /** Gets or sets current value */
    public get value(): number {
        return this._value;
    }

    public set value(value: number) {
        if (this._value === value) {
            return;
        }

        this._value = Math.max(Math.min(value, this._maximum), this._minimum);
        this.onValueChangedObservable.notifyObservers(this._value);
    }

    protected get start(): number {
        if (!this.node) {
            return -SLIDER_SCALING / 2;
        }

        return this._sliderBar.position.x - this._sliderBar.scaling.y / 2;
    }

    protected get end(): number {
        if (!this.node) {
            return SLIDER_SCALING / 2;
        }

        return this._sliderBar.position.x + this._sliderBar.scaling.y / 2;
    }

    /**
     * Gets the slider bar material used by this control
     */
    public get sliderBarMaterial(): StandardMaterial {
        return this._sliderBarMaterial;
    }

    /**
     * Gets the slider thumb material used by this control
     */
    public get sliderThumbMaterial(): StandardMaterial {
        return this._sliderThumbMaterial;
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        const anchor = new TransformNode(`${this.name}_slider`, scene);

        const sliderBar = CylinderBuilder.CreateCylinder(`${this.name}_sliderbar`, { diameter: 0.03, height: 1.0 }, scene);
        sliderBar.rotation.z = -Math.PI / 2;
        sliderBar.scaling.y = SLIDER_SCALING;
        sliderBar.isPickable = false;
        sliderBar.setParent(anchor);

        const sliderThumb = BoxBuilder.CreateBox(`${this.name}_sliderthumb`, { size: 0.1 }, scene);
        sliderThumb.scaling = new Vector3(SLIDER_SCALING, SLIDER_SCALING, SLIDER_SCALING);
        sliderThumb.position.x = this._convertToPosition(this.value);
        sliderThumb.addBehavior(this._createBehavior());
        sliderThumb.setParent(anchor);

        this._sliderBar = sliderBar;
        this._sliderThumb = sliderThumb;

        return anchor;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        const barMaterial = new StandardMaterial(`${this.name}_sliderbar_material`, mesh.getScene());
        barMaterial.specularColor = Color3.Black();
        this._sliderBar.material = barMaterial;

        const thumbMaterial = new StandardMaterial(`${this.name}_sliderthumb_material`, mesh.getScene());
        thumbMaterial.specularColor = Color3.Black();
        mesh.material = thumbMaterial;

        this._sliderBarMaterial = barMaterial;
        this._sliderThumbMaterial = thumbMaterial;
    }

    private _createBehavior(): PointerDragBehavior {
        const pointerDragBehavior = new PointerDragBehavior({ dragAxis: Vector3.Right() });
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragObservable.add((event) => {
            const newPosition = this._sliderThumb.position.x + event.dragDistance;
            this._sliderThumb.position.x = Math.max(Math.min(newPosition, this.end), this.start);
            this.value = this._convertToValue(this._sliderThumb.position.x);
        });

        pointerDragBehavior.onDragEndObservable.add((event) => {
            this._sliderThumb.position.x = this._convertToPosition(this.value);
        });

        return pointerDragBehavior;
    }

    private _convertToPosition(value: number): number {
        const position = ((value - this.minimum) / (this.maximum - this.minimum)) * (this.end - this.start) + this.start;
        return Math.min(Math.max(position, this.start), this.end);
    }

    private _convertToValue(position: number): number {
        let value = ((position - this.start) / (this.end - this.start)) * (this.maximum - this.minimum);
        value = this.step ? Math.round(value / this.step) * this.step : value;

        return Math.max(Math.min(this.minimum + value, this._maximum), this._minimum);
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();
        this._sliderBar?.dispose();
        this._sliderThumb?.dispose();
        this._sliderBarMaterial?.dispose();
        this._sliderThumbMaterial?.dispose();
    }
}
