import { Container } from "./container";
import { Control } from "./control";
import type { Measure } from "../measure";
import { RegisterClass } from "core/Misc/typeStore";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext } from "core/Engines/ICanvas";

/** Class used to create 2D ellipse containers */
export class Ellipse extends Container {
    private _thickness = 1;

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

    private _arc = 1;

    /** Gets or sets arcing of the ellipse (ratio of the circumference between 0 and 1) */
    @serialize()
    public get arc(): number {
        return this._arc;
    }

    public set arc(value: number) {
        if (this._arc === value) {
            return;
        }

        this._arc = value;
        this._markAsDirty();
    }

    /**
     * Creates a new Ellipse
     * @param name defines the control name
     */
    constructor(public override name?: string) {
        super(name);
    }

    protected override _getTypeName(): string {
        return "Ellipse";
    }

    protected override _localDraw(context: ICanvasRenderingContext): void {
        context.save();

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX * this._host.idealRatio;
            context.shadowOffsetY = this.shadowOffsetY * this._host.idealRatio;
        }

        Control.drawEllipse(
            this._currentMeasure.left + this._currentMeasure.width / 2,
            this._currentMeasure.top + this._currentMeasure.height / 2,
            this._currentMeasure.width / 2 - this._thickness / 2,
            this._currentMeasure.height / 2 - this._thickness / 2,
            this._arc,
            context
        );

        if (this._backgroundGradient || this._background) {
            context.fillStyle = this._getBackgroundColor(context);

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

    protected override _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.width -= 2 * this._thickness;
        this._measureForChildren.height -= 2 * this._thickness;
        this._measureForChildren.left += this._thickness;
        this._measureForChildren.top += this._thickness;
    }

    protected override _clipForChildren(context: ICanvasRenderingContext) {
        Control.drawEllipse(
            this._currentMeasure.left + this._currentMeasure.width / 2,
            this._currentMeasure.top + this._currentMeasure.height / 2,
            this._currentMeasure.width / 2,
            this._currentMeasure.height / 2,
            this._arc,
            context
        );

        context.clip();
    }

    public override _renderHighlightSpecific(context: ICanvasRenderingContext): void {
        Control.drawEllipse(
            this._currentMeasure.left + this._currentMeasure.width / 2,
            this._currentMeasure.top + this._currentMeasure.height / 2,
            this._currentMeasure.width / 2 - this._highlightLineWidth / 2,
            this._currentMeasure.height / 2 - this._highlightLineWidth / 2,
            this._arc,
            context
        );
        context.stroke();
    }
}
RegisterClass("BABYLON.GUI.Ellipse", Ellipse);
