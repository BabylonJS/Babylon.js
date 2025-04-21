/* eslint-disable @typescript-eslint/naming-convention */
import type { Nullable } from "core/types";
import { Observable } from "core/Misc/observable";
import { Vector3 } from "core/Maths/math.vector";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Scene } from "core/scene";
import { Control3D } from "./control3D";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { PointerDragBehavior } from "core/Behaviors/Meshes/pointerDragBehavior";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { SceneLoader } from "core/Loading/sceneLoader";
import { MRDLSliderBarMaterial } from "../materials/mrdl/mrdlSliderBarMaterial";
import { MRDLSliderThumbMaterial } from "../materials/mrdl/mrdlSliderThumbMaterial";
import { MRDLBackplateMaterial } from "../materials/mrdl/mrdlBackplateMaterial";
import { Tools } from "core/Misc/tools";

const SLIDER_MIN: number = 0;
const SLIDER_MAX: number = 100;
const SLIDER_VAL: number = 50;
const SLIDER_STEP: number = 0;
const SLIDER_SCALING: number = 1.0;
const SLIDER_MARGIN: number = 0.2;

/**
 * Class used to create a slider in 3D
 */
export class Slider3D extends Control3D {
    /**
     * Base Url for the models.
     */
    public static MODEL_BASE_URL: string = "https://assets.babylonjs.com/core/MRTK/";

    /**
     * File name for the 8x4 model.
     */
    public static MODEL_FILENAME: string = "mrtk-fluent-backplate.glb";

    private _sliderBackplate: AbstractMesh;
    private _sliderBackplateMaterial: MRDLBackplateMaterial;
    private _sliderBarMaterial: MRDLSliderBarMaterial;
    private _sliderThumbMaterial: MRDLSliderThumbMaterial;
    private _sliderThumb: AbstractMesh;
    private _sliderBar: AbstractMesh;
    private _sliderBackplateVisible: boolean;

    private _minimum: number;
    private _maximum: number;
    private _value: number;
    private _step: number;

    private _draggedPosition: number;

    /** Observable raised when the sldier value changes */
    public onValueChangedObservable = new Observable<number>();

    /**
     * Creates a new slider
     * @param name defines the control name
     * @param sliderBackplateVisible defines if the control has a backplate, default is false
     */
    constructor(name?: string, sliderBackplateVisible?: boolean) {
        super(name);
        this._sliderBackplateVisible = sliderBackplateVisible || false;

        this._minimum = SLIDER_MIN;
        this._maximum = SLIDER_MAX;
        this._step = SLIDER_STEP;
        this._value = SLIDER_VAL;
    }

    /**
     * Gets the mesh used to render this control
     */
    public override get mesh(): Nullable<AbstractMesh> {
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
        if (this._sliderThumb) {
            this._sliderThumb.position.x = this._convertToPosition(this.value);
        }
        this.onValueChangedObservable.notifyObservers(this._value);
    }

    protected get start(): number {
        if (!this.node) {
            return -SLIDER_SCALING / 2;
        }

        return this._sliderBar.position.x - this._sliderBar.scaling.x / 2;
    }

    protected get end(): number {
        if (!this.node) {
            return SLIDER_SCALING / 2;
        }

        return this._sliderBar.position.x + this._sliderBar.scaling.x / 2;
    }

    /**
     * Gets the slider bar material used by this control
     */
    public get sliderBarMaterial(): MRDLSliderBarMaterial {
        return this._sliderBarMaterial;
    }

    /**
     * Gets the slider thumb material used by this control
     */
    public get sliderThumbMaterial(): MRDLSliderThumbMaterial {
        return this._sliderThumbMaterial;
    }

    /**
     * Gets the slider backplate material used by this control
     */
    public get sliderBackplateMaterial(): MRDLBackplateMaterial {
        return this._sliderBackplateMaterial;
    }

    /**
     * Gets the slider bar mesh used by this control
     */
    public get sliderBar(): AbstractMesh {
        return this._sliderBar;
    }

    /**
     * Gets the slider thumb mesh used by this control
     */
    public get sliderThumb(): AbstractMesh {
        return this._sliderThumb;
    }

    /**
     * Gets the slider backplate mesh used by this control
     */
    public get sliderBackplate(): AbstractMesh {
        return this._sliderBackplate;
    }

    /** Sets a boolean indicating if the control is visible */
    public override set isVisible(value: boolean) {
        if (this._isVisible === value) {
            return;
        }

        this._isVisible = value;

        this.node?.setEnabled(value);
    }

    // Mesh association
    protected override _createNode(scene: Scene): TransformNode {
        const sliderBackplate = CreateBox(
            `${this.name}_sliderbackplate`,
            {
                width: 1.0,
                height: 1.0,
                depth: 1.0,
            },
            scene
        );
        sliderBackplate.isPickable = false;
        sliderBackplate.visibility = 0;
        sliderBackplate.scaling = new Vector3(1, 0.5, 0.8);
        const baseUrl = Tools.GetAssetUrl(Slider3D.MODEL_BASE_URL);
        SceneLoader.ImportMeshAsync(undefined, baseUrl, Slider3D.MODEL_FILENAME, scene).then((result) => {
            // make all meshes not pickable. Required meshes' pickable state will be set later.
            for (const m of result.meshes) {
                m.isPickable = false;
            }
            const sliderBackplateModel = result.meshes[1];
            const sliderBarModel = result.meshes[1].clone(`${this.name}_sliderbar`, sliderBackplate);
            const sliderThumbModel = result.meshes[1].clone(`${this.name}_sliderthumb`, sliderBackplate);
            sliderBackplateModel.visibility = 0;

            if (this._sliderBackplateVisible) {
                sliderBackplateModel.visibility = 1;
                sliderBackplateModel.name = `${this.name}_sliderbackplate`;
                sliderBackplateModel.scaling.x = 1;
                sliderBackplateModel.scaling.z = 0.2;
                sliderBackplateModel.parent = sliderBackplate;
                if (this._sliderBackplateMaterial) {
                    sliderBackplateModel.material = this._sliderBackplateMaterial;
                }
                this._sliderBackplate = sliderBackplateModel;
            }

            if (sliderBarModel) {
                sliderBarModel.parent = sliderBackplate;
                sliderBarModel.position.z = -0.1;
                sliderBarModel.scaling = new Vector3(SLIDER_SCALING - SLIDER_MARGIN, 0.04, 0.3);
                if (this._sliderBarMaterial) {
                    sliderBarModel.material = this._sliderBarMaterial;
                }
                this._sliderBar = sliderBarModel;
            }

            if (sliderThumbModel) {
                sliderThumbModel.parent = sliderBackplate;
                sliderThumbModel.isPickable = true;
                sliderThumbModel.position.z = -0.115;
                sliderThumbModel.scaling = new Vector3(0.025, 0.3, 0.6);
                sliderThumbModel.position.x = this._convertToPosition(this.value);
                sliderThumbModel.addBehavior(this._createBehavior());
                if (this._sliderThumbMaterial) {
                    sliderThumbModel.material = this._sliderThumbMaterial;
                }
                this._sliderThumb = sliderThumbModel;
            }

            this._injectGUI3DReservedDataStore(sliderBackplate).control = this;
            const meshes = sliderBackplate.getChildMeshes();
            for (const mesh of meshes) {
                this._injectGUI3DReservedDataStore(mesh).control = this;
            }
        });

        this._affectMaterial(sliderBackplate);
        return sliderBackplate;
    }

    protected override _affectMaterial(mesh: AbstractMesh) {
        this._sliderBackplateMaterial = this._sliderBackplateMaterial ?? new MRDLBackplateMaterial(`${this.name}_sliderbackplate_material`, mesh.getScene());
        this._sliderBarMaterial = this._sliderBarMaterial ?? new MRDLSliderBarMaterial(`${this.name}_sliderbar_material`, mesh.getScene());
        this._sliderThumbMaterial = this._sliderThumbMaterial ?? new MRDLSliderThumbMaterial(`${this.name}_sliderthumb_material`, mesh.getScene());
    }

    private _createBehavior(): PointerDragBehavior {
        const pointerDragBehavior = new PointerDragBehavior({ dragAxis: Vector3.Right() });
        pointerDragBehavior.moveAttached = false;

        pointerDragBehavior.onDragStartObservable.add(() => {
            this._draggedPosition = this._sliderThumb.position.x;
        });

        pointerDragBehavior.onDragObservable.add((event) => {
            this._draggedPosition += event.dragDistance / this.scaling.x;
            this.value = this._convertToValue(this._draggedPosition);
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
    public override dispose() {
        super.dispose();
        this._sliderBar?.dispose();
        this._sliderThumb?.dispose();
        this._sliderBarMaterial?.dispose();
        this._sliderThumbMaterial?.dispose();
        this._sliderBackplate?.dispose();
        this._sliderBackplateMaterial?.dispose();
    }
}
