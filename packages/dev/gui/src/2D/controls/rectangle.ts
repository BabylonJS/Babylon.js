import { Container } from "./container";
import type { Measure } from "../measure";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";
import { Vector4 } from "core/Maths/math";

/** Class used to create rectangle container */
export class Rectangle extends Container {
    private _thickness = 1;
    private _cornerRadius = 0;
    private _cornerRadiusFree = Vector4.Zero();

    /** Gets or sets border thickness */
    @serialize()
    public get thickness(): number {
        return this._thickness;
    }

    public set thickness(value: number) {
        if (this._thickness === value) {
            return;
        }

        this._thickness = value;
        this._markAsDirty();
    }

    /** Gets or sets the corner radius angle */
    @serialize()
    public get cornerRadius(): number {
        return this._cornerRadius;
    }
    public get cornerRadiusX(): number {
        return this._cornerRadiusFree.x;
    }
    public get cornerRadiusY(): number {
        return this._cornerRadiusFree.y;
    }
    public get cornerRadiusZ(): number {
        return this._cornerRadiusFree.z;
    }
    public get cornerRadiusW(): number {
        return this._cornerRadiusFree.w;
    }

    public set cornerRadius(value: number) {
        if (value < 0) {
            value = 0;
        }

        if (this._cornerRadius === value) {
            return;
        }

        this._cornerRadius = value;
        this._cornerRadiusFree.setAll(value);
        this._markAsDirty();
    }
    public set cornerRadiusX(value: number) {
        if (this._cornerRadiusFree.x === value) {
            return
        }
        this._cornerRadiusFree.x = value
    }
    public set cornerRadiusY(value: number) {
        if (this._cornerRadiusFree.y === value) {
            return
        }
        this._cornerRadiusFree.y = value;
    }
    public set cornerRadiusZ(value: number) {
        if (this._cornerRadiusFree.z === value) {
            return
        }
        this._cornerRadiusFree.z = value;
    }
    public set cornerRadiusW(value: number) {
        if (this._cornerRadiusFree.w === value) {
            return
        }
        this._cornerRadiusFree.w = value;
    }

    /**
     * Creates a new Rectangle
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Rectangle";
    }

    /** @internal */
    protected _computeAdditionnalOffsetX() {
        if (this._cornerRadiusFree) {
            // Take in account the aliasing
            return 1;
        }
        return 0;
    }

    /** @internal */
    protected _computeAdditionnalOffsetY() {
        if (this._cornerRadiusFree) {
            // Take in account the aliasing
            return 1;
        }
        return 0;
    }

    protected _getRectangleFill(context: ICanvasRenderingContext) {
        return this._getBackgroundColor(context);
    }

    protected _localDraw(context: ICanvasRenderingContext): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        if (this._background || this._backgroundGradient) {
            context.fillStyle = this._getRectangleFill(context);

            if (this._cornerRadiusFree) {
                this._drawRoundedRect(context, this._thickness / 2);
                context.fill();
            } else {
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
        }

        if (this._thickness) {
            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }

            if (this.color || this.gradient) {
                context.strokeStyle = this.gradient ? this.gradient.getCanvasGradient(context) : this.color;
            }
            context.lineWidth = this._thickness;

            if (this._cornerRadiusFree) {
                this._drawRoundedRect(context, this._thickness / 2);
                context.stroke();
            } else {
                context.strokeRect(
                    this._currentMeasure.left + this._thickness / 2,
                    this._currentMeasure.top + this._thickness / 2,
                    this._currentMeasure.width - this._thickness,
                    this._currentMeasure.height - this._thickness
                );
            }
        }

        context.restore();
    }

    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.width -= 2 * this._thickness;
        this._measureForChildren.height -= 2 * this._thickness;
        this._measureForChildren.left += this._thickness;
        this._measureForChildren.top += this._thickness;
    }

    private _drawRoundedRect(context: ICanvasRenderingContext, offset: number = 0): void {
        const x = this._currentMeasure.left + offset;
        const y = this._currentMeasure.top + offset;
        const width = this._currentMeasure.width - offset * 2;
        const height = this._currentMeasure.height - offset * 2;

        let radius = {
            x: Math.min(height / 2, Math.min(width / 2, this._cornerRadiusFree.x)),
            y: Math.min(height / 2, Math.min(width / 2, this._cornerRadiusFree.y)),
            z: Math.min(height / 2, Math.min(width / 2, this._cornerRadiusFree.z)),
            w: Math.min(height / 2, Math.min(width / 2, this._cornerRadiusFree.w))
        }
        radius = {
            x: Math.abs(radius.x),
            y: Math.abs(radius.y),
            z: Math.abs(radius.z),
            w: Math.abs(radius.w)
        }

        context.beginPath();
        context.moveTo(x + radius.x, y);
        context.lineTo(x + width - radius.y, y);
        context.arc(x + width - radius.y, y + radius.y, radius.y, (3 * Math.PI) / 2, Math.PI * 2);
        context.lineTo(x + width, y + height - radius.z);
        context.arc(x + width - radius.z, y + height - radius.z, radius.z, 0, Math.PI / 2);
        context.lineTo(x + radius.w, y + height);
        context.arc(x + radius.w, y + height - radius.w, radius.w, Math.PI / 2, Math.PI);
        context.lineTo(x, y + radius.x);
        context.arc(x + radius.x, y + radius.x, radius.x, Math.PI, (3 * Math.PI) / 2);
        context.closePath();
    }

    protected _clipForChildren(context: ICanvasRenderingContext) {
        if (this._cornerRadiusFree) {
            this._drawRoundedRect(context, this._thickness);
            context.clip();
        }
    }
}
RegisterClass("BABYLON.GUI.Rectangle", Rectangle);
