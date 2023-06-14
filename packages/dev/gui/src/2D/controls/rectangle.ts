import { Container } from "./container";
import type { Measure } from "../measure";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";

/** Class used to create rectangle container */
export class Rectangle extends Container {
    private _thickness = 1;
    private _cornerRadius = [0, 0, 0, 0];
    private _cachedRadius = [0, 0, 0, 0];

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

    /** Gets or sets the corner radius of all angles */
    @serialize()
    public get cornerRadius(): number {
        return this._cornerRadius[0];
    }

    public set cornerRadius(value: number) {
        if (value < 0) {
            value = 0;
        }

        if (this._cornerRadius[0] === value && this._cornerRadius[1] === value && this._cornerRadius[2] === value && this._cornerRadius[3] === value) {
            return;
        }

        this._cornerRadius[0] = this._cornerRadius[1] = this._cornerRadius[2] = this._cornerRadius[3] = value;
        this._markAsDirty();
    }

    /** Gets or sets the corner radius top left angle */
    @serialize()
    public get cornerRadiusX(): number {
        return this._cornerRadius[0];
    }

    public set cornerRadiusX(value: number) {
        if (this._cornerRadius[0] === value) {
            return;
        }
        this._cornerRadius[0] = value;
    }

    /** Gets or sets the corner radius top right angle */
    @serialize()
    public get cornerRadiusY(): number {
        return this._cornerRadius[1];
    }

    public set cornerRadiusY(value: number) {
        if (this._cornerRadius[1] === value) {
            return;
        }
        this._cornerRadius[1] = value;
    }

    /** Gets or sets the corner radius bottom left angle */
    @serialize()
    public get cornerRadiusZ(): number {
        return this._cornerRadius[2];
    }

    public set cornerRadiusZ(value: number) {
        if (this._cornerRadius[2] === value) {
            return;
        }
        this._cornerRadius[2] = value;
    }

    /** Gets or sets the corner radius bottom right angle */
    @serialize()
    public get cornerRadiusW(): number {
        return this._cornerRadius[3];
    }

    public set cornerRadiusW(value: number) {
        if (this._cornerRadius[3] === value) {
            return;
        }
        this._cornerRadius[3] = value;
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
        if (this._cornerRadius[0] !== 0 || this._cornerRadius[1] !== 0 || this._cornerRadius[2] !== 0 || this._cornerRadius[3] !== 0) {
            // Take in account the aliasing
            return 1;
        }
        return 0;
    }

    /** @internal */
    protected _computeAdditionnalOffsetY() {
        if (this._cornerRadius[0] !== 0 || this._cornerRadius[1] !== 0 || this._cornerRadius[2] !== 0 || this._cornerRadius[3] !== 0) {
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

            if (this._cornerRadius[0] !== 0 || this._cornerRadius[1] !== 0 || this._cornerRadius[2] !== 0 || this._cornerRadius[3] !== 0) {
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

            if (this._cornerRadius[0] !== 0 || this._cornerRadius[1] !== 0 || this._cornerRadius[2] !== 0 || this._cornerRadius[3] !== 0) {
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

        for (let index = 0; index < this._cornerRadius.length; index++) {
            this._cachedRadius[index] = Math.abs(Math.min(height / 2, Math.min(width / 2, this._cornerRadius[index])));
        }

        context.beginPath();
        context.moveTo(x + this._cachedRadius[0], y);
        context.lineTo(x + width - this._cachedRadius[1], y);
        context.arc(x + width - this._cachedRadius[1], y + this._cachedRadius[1], this._cachedRadius[1], (3 * Math.PI) / 2, Math.PI * 2);
        context.lineTo(x + width, y + height - this._cachedRadius[2]);
        context.arc(x + width - this._cachedRadius[2], y + height - this._cachedRadius[2], this._cachedRadius[2], 0, Math.PI / 2);
        context.lineTo(x + this._cachedRadius[3], y + height);
        context.arc(x + this._cachedRadius[3], y + height - this._cachedRadius[3], this._cachedRadius[3], Math.PI / 2, Math.PI);
        context.lineTo(x, y + this._cachedRadius[0]);
        context.arc(x + this._cachedRadius[0], y + this._cachedRadius[0], this._cachedRadius[0], Math.PI, (3 * Math.PI) / 2);
        context.closePath();
    }

    protected _clipForChildren(context: ICanvasRenderingContext) {
        if (this._cornerRadius[0] !== 0 || this._cornerRadius[1] !== 0 || this._cornerRadius[2] !== 0 || this._cornerRadius[3] !== 0) {
            this._drawRoundedRect(context, this._thickness);
            context.clip();
        }
    }
}
RegisterClass("BABYLON.GUI.Rectangle", Rectangle);
