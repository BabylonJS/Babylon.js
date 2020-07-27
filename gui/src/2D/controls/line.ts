import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Vector3, Matrix } from "babylonjs/Maths/math.vector";
import { Tools } from "babylonjs/Misc/tools";
import { Scene } from "babylonjs/scene";

import { Control } from "./control";
import { ValueAndUnit } from "../valueAndUnit";
import { Measure } from "../measure";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/** Class used to render 2D lines */
export class Line extends Control {
    private _lineWidth = 1;
    private _x1 = new ValueAndUnit(0);
    private _y1 = new ValueAndUnit(0);
    private _x2 = new ValueAndUnit(0);
    private _y2 = new ValueAndUnit(0);
    private _dash = new Array<number>();
    private _connectedControl: Control;
    private _connectedControlDirtyObserver: Nullable<Observer<Control>>;

    /** Gets or sets the dash pattern */
    public get dash(): Array<number> {
        return this._dash;
    }

    public set dash(value: Array<number>) {
        if (this._dash === value) {
            return;
        }

        this._dash = value;
        this._markAsDirty();
    }

    /** Gets or sets the control connected with the line end */
    public get connectedControl(): Control {
        return this._connectedControl;
    }

    public set connectedControl(value: Control) {
        if (this._connectedControl === value) {
            return;
        }

        if (this._connectedControlDirtyObserver && this._connectedControl) {
            this._connectedControl.onDirtyObservable.remove(this._connectedControlDirtyObserver);
            this._connectedControlDirtyObserver = null;
        }

        if (value) {
            this._connectedControlDirtyObserver = value.onDirtyObservable.add(() => this._markAsDirty());
        }

        this._connectedControl = value;
        this._markAsDirty();
    }

    /** Gets or sets start coordinates on X axis */
    public get x1(): string | number {
        return this._x1.toString(this._host);
    }

    public set x1(value: string | number) {
        if (this._x1.toString(this._host) === value) {
            return;
        }

        if (this._x1.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets start coordinates on Y axis */
    public get y1(): string | number {
        return this._y1.toString(this._host);
    }

    public set y1(value: string | number) {
        if (this._y1.toString(this._host) === value) {
            return;
        }

        if (this._y1.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets end coordinates on X axis */
    public get x2(): string | number {
        return this._x2.toString(this._host);
    }

    public set x2(value: string | number) {
        if (this._x2.toString(this._host) === value) {
            return;
        }

        if (this._x2.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets end coordinates on Y axis */
    public get y2(): string | number {
        return this._y2.toString(this._host);
    }

    public set y2(value: string | number) {
        if (this._y2.toString(this._host) === value) {
            return;
        }

        if (this._y2.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets line width */
    public get lineWidth(): number {
        return this._lineWidth;
    }

    public set lineWidth(value: number) {
        if (this._lineWidth === value) {
            return;
        }

        this._lineWidth = value;
        this._markAsDirty();
    }

    /** Gets or sets horizontal alignment */
    public set horizontalAlignment(value: number) {
        return;
    }

    /** Gets or sets vertical alignment */
    public set verticalAlignment(value: number) {
        return;
    }

    private get _effectiveX2(): number {
        return (this._connectedControl ? this._connectedControl.centerX : 0) + this._x2.getValue(this._host);
    }

    private get _effectiveY2(): number {
        return (this._connectedControl ? this._connectedControl.centerY : 0) + this._y2.getValue(this._host);
    }

    /**
     * Creates a new Line
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);

        this._automaticSize = true;

        this.isHitTestVisible = false;
        this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    }

    protected _getTypeName(): string {
        return "Line";
    }

    public _draw(context: CanvasRenderingContext2D): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        this._applyStates(context);
        context.strokeStyle = this.color;
        context.lineWidth = this._lineWidth;
        context.setLineDash(this._dash);

        context.beginPath();
        context.moveTo(this._cachedParentMeasure.left + this._x1.getValue(this._host), this._cachedParentMeasure.top + this._y1.getValue(this._host));

        context.lineTo(this._cachedParentMeasure.left + this._effectiveX2, this._cachedParentMeasure.top + this._effectiveY2);
        context.stroke();

        context.restore();
    }

    public _measure(): void {
        // Width / Height
        this._currentMeasure.width = Math.abs(this._x1.getValue(this._host) - this._effectiveX2) + this._lineWidth;
        this._currentMeasure.height = Math.abs(this._y1.getValue(this._host) - this._effectiveY2) + this._lineWidth;
    }

    protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        this._currentMeasure.left = parentMeasure.left + Math.min(this._x1.getValue(this._host), this._effectiveX2) - this._lineWidth / 2;
        this._currentMeasure.top = parentMeasure.top + Math.min(this._y1.getValue(this._host), this._effectiveY2) - this._lineWidth / 2;
    }

    /**
     * Move one end of the line given 3D cartesian coordinates.
     * @param position Targeted world position
     * @param scene Scene
     * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
     */
    public moveToVector3(position: Vector3, scene: Scene, end: boolean = false): void {
        if (!this._host || this.parent !== this._host._rootContainer) {
            Tools.Error("Cannot move a control to a vector3 if the control is not at root level");
            return;
        }

        var globalViewport = this._host._getGlobalViewport(scene);
        var projectedPosition = Vector3.Project(position, Matrix.Identity(), scene.getTransformMatrix(), globalViewport);

        this._moveToProjectedPosition(projectedPosition, end);

        if (projectedPosition.z < 0 || projectedPosition.z > 1) {
            this.notRenderable = true;
            return;
        }
        this.notRenderable = false;
    }

    /**
     * Move one end of the line to a position in screen absolute space.
     * @param projectedPosition Position in screen absolute space (X, Y)
     * @param end (opt) Set to true to assign x2 and y2 coordinates of the line. Default assign to x1 and y1.
     */
    public _moveToProjectedPosition(projectedPosition: Vector3, end: boolean = false): void {
        let x: string = (projectedPosition.x + this._linkOffsetX.getValue(this._host)) + "px";
        let y: string = (projectedPosition.y + this._linkOffsetY.getValue(this._host)) + "px";

        if (end) {
            this.x2 = x;
            this.y2 = y;
            this._x2.ignoreAdaptiveScaling = true;
            this._y2.ignoreAdaptiveScaling = true;
        } else {
            this.x1 = x;
            this.y1 = y;
            this._x1.ignoreAdaptiveScaling = true;
            this._y1.ignoreAdaptiveScaling = true;
        }
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.Line"] = Line;
