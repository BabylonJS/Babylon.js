import { Container } from "./container";
import type { Measure } from "../measure";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";

/** Class used to create rectangle container */
export class Rectangle extends Container {
    private _thickness = 1;
    private _cornerRadius = 0;

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

    public set cornerRadius(value: number) {
        if (value < 0) {
            value = 0;
        }

        if (this._cornerRadius === value) {
            return;
        }

        this._cornerRadius = value;
        this._markAsDirty();
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
        if (this._cornerRadius) {
            // Take in account the aliasing
            return 1;
        }
        return 0;
    }

    /** @internal */
    protected _computeAdditionnalOffsetY() {
        if (this._cornerRadius) {
            // Take in account the aliasing
            return 1;
        }
        return 0;
    }

    protected _localDraw(context: ICanvasRenderingContext): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        if (this._background) {
            context.fillStyle = this.typeName === "Button" ? (this.isEnabled ? this._background : this.disabledColor) : this._background;

            if (this._cornerRadius) {
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

            if (this.color) {
                context.strokeStyle = this.color;
            }
            context.lineWidth = this._thickness;

            if (this._cornerRadius) {
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

        let radius = Math.min(height / 2, Math.min(width / 2, this._cornerRadius));
        radius = Math.abs(radius);

        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.arc(x + width - radius, y + radius, radius, (3 * Math.PI) / 2, Math.PI * 2);
        context.lineTo(x + width, y + height - radius);
        context.arc(x + width - radius, y + height - radius, radius, 0, Math.PI / 2);
        context.lineTo(x + radius, y + height);
        context.arc(x + radius, y + height - radius, radius, Math.PI / 2, Math.PI);
        context.lineTo(x, y + radius);
        context.arc(x + radius, y + radius, radius, Math.PI, (3 * Math.PI) / 2);
        context.closePath();
    }

    protected _clipForChildren(context: ICanvasRenderingContext) {
        if (this._cornerRadius) {
            this._drawRoundedRect(context, this._thickness);
            context.clip();
        }
    }
}
RegisterClass("BABYLON.GUI.Rectangle", Rectangle);
