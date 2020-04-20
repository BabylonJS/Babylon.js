import { Nullable } from "babylonjs/types";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";

import { Control } from "./control";
import { MultiLinePoint } from "../multiLinePoint";
import { Measure } from "../measure";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/**
 * Class used to create multi line control
 */
export class MultiLine extends Control {

    private _lineWidth: number = 1;
    private _dash: number[];
    private _points: Nullable<MultiLinePoint>[];

    private _minX: Nullable<number>;
    private _minY: Nullable<number>;
    private _maxX: Nullable<number>;
    private _maxY: Nullable<number>;

    /**
     * Creates a new MultiLine
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);

        this._automaticSize = true;
        this.isHitTestVisible = false;
        this._horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this._dash = [];
        this._points = [];
    }

    /** Gets or sets dash pattern */
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

    /**
     * Gets point stored at specified index
     * @param index defines the index to look for
     * @returns the requested point if found
     */
    public getAt(index: number): MultiLinePoint {
        if (!this._points[index]) {
            this._points[index] = new MultiLinePoint(this);
        }

        return this._points[index] as MultiLinePoint;
    }

    /** Function called when a point is updated */
    public onPointUpdate = (): void => {
        this._markAsDirty();
    }

    /**
     * Adds new points to the point collection
     * @param items defines the list of items (mesh, control or 2d coordiantes) to add
     * @returns the list of created MultiLinePoint
     */
    public add(...items: (AbstractMesh | Control | { x: string | number, y: string | number })[]): MultiLinePoint[] {
        return items.map((item) => this.push(item));
    }

    /**
     * Adds a new point to the point collection
     * @param item defines the item (mesh, control or 2d coordiantes) to add
     * @returns the created MultiLinePoint
     */
    public push(item?: (AbstractMesh | Control | { x: string | number, y: string | number })): MultiLinePoint {
        var point: MultiLinePoint = this.getAt(this._points.length);

        if (item == null) { return point; }

        if (item instanceof AbstractMesh) {
            point.mesh = item;
        }
        else if (item instanceof Control) {
            point.control = item;
        }
        else if (item.x != null && item.y != null) {
            point.x = item.x;
            point.y = item.y;
        }

        return point;
    }

    /**
     * Remove a specific value or point from the active point collection
     * @param value defines the value or point to remove
     */
    public remove(value: number | MultiLinePoint): void {
        var index: number;

        if (value instanceof MultiLinePoint) {
            index = this._points.indexOf(value);

            if (index === -1) {
                return;
            }
        }
        else {
            index = value;
        }

        var point: Nullable<MultiLinePoint> = this._points[index];

        if (!point) {
            return;
        }

        point.dispose();

        this._points.splice(index, 1);
    }

    /**
     * Resets this object to initial state (no point)
     */
    public reset(): void {
        while (this._points.length > 0) {
            this.remove(this._points.length - 1);
        }
    }

    /**
     * Resets all links
     */
    public resetLinks(): void {
        this._points.forEach((point) => {
            if (point != null) { point.resetLinks(); }
        });
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

    public set horizontalAlignment(value: number) {
        return;
    }

    public set verticalAlignment(value: number) {
        return;
    }

    protected _getTypeName(): string {
        return "MultiLine";
    }

    public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void {
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

        var first: boolean = true; //first index is not necessarily 0

        this._points.forEach((point) => {
            if (!point) {
                return;
            }

            if (first) {
                context.moveTo(point._point.x, point._point.y);

                first = false;
            }
            else {
                context.lineTo(point._point.x, point._point.y);
            }
        });

        context.stroke();

        context.restore();
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        this._minX = null;
        this._minY = null;
        this._maxX = null;
        this._maxY = null;

        this._points.forEach((point, index) => {
            if (!point) {
                return;
            }

            point.translate();

            if (this._minX == null || point._point.x < this._minX) { this._minX = point._point.x; }
            if (this._minY == null || point._point.y < this._minY) { this._minY = point._point.y; }
            if (this._maxX == null || point._point.x > this._maxX) { this._maxX = point._point.x; }
            if (this._maxY == null || point._point.y > this._maxY) { this._maxY = point._point.y; }
        });

        if (this._minX == null) { this._minX = 0; }
        if (this._minY == null) { this._minY = 0; }
        if (this._maxX == null) { this._maxX = 0; }
        if (this._maxY == null) { this._maxY = 0; }
    }

    public _measure(): void {
        if (this._minX == null || this._maxX == null || this._minY == null || this._maxY == null) {
            return;
        }

        this._currentMeasure.width = Math.abs(this._maxX - this._minX) + this._lineWidth;
        this._currentMeasure.height = Math.abs(this._maxY - this._minY) + this._lineWidth;
    }

    protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        if (this._minX == null || this._minY == null) {
            return;
        }

        this._currentMeasure.left = this._minX - this._lineWidth / 2;
        this._currentMeasure.top = this._minY - this._lineWidth / 2;
    }

    public dispose(): void {
        this.reset();

        super.dispose();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.MultiLine"] = MultiLine;
