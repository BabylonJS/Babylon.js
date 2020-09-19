import { Container } from "./container";
import { Control } from "./control";
import { Measure } from "../measure";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/** Class used to create 2D ellipse containers */
export class Ellipse extends Container {
    private _thickness = 1;

    /** Gets or sets border thickness */
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

    /**
     * Creates a new Ellipse
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    protected _getTypeName(): string {
        return "Ellipse";
    }

    protected _localDraw(context: CanvasRenderingContext2D): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2,
            this._currentMeasure.width / 2 - this._thickness / 2, this._currentMeasure.height / 2 - this._thickness / 2, context);

        if (this._background) {
            context.fillStyle = this._background;

            context.fill();
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        if (this._thickness) {
            if (this.color) {
                context.strokeStyle = this.color;
            }
            context.lineWidth = this._thickness;

            context.stroke();
        }

        context.restore();
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.width -= 2 * this._thickness;
        this._measureForChildren.height -= 2 * this._thickness;
        this._measureForChildren.left += this._thickness;
        this._measureForChildren.top += this._thickness;
    }

    protected _clipForChildren(context: CanvasRenderingContext2D) {

        Control.drawEllipse(this._currentMeasure.left + this._currentMeasure.width / 2, this._currentMeasure.top + this._currentMeasure.height / 2, this._currentMeasure.width / 2, this._currentMeasure.height / 2, context);

        context.clip();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.Ellipse"] = Ellipse;