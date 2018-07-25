
import { Control } from ".";
import { Measure } from "..";

/** Class used to render a grid  */
export class GridDisplay extends Control {
    private _cellWidth = 10;
    private _cellHeight = 10;
    private _minorLineTickness = 1;
    private _minorLineColor = "DarkGray";
    private _background = "Black";

    /** Gets or sets background color (Black by default) */
    public get background(): string {
        return this._background;
    }

    public set background(value: string) {
        if (this._background === value) {
            return;
        }

        this._background = value;
        this._markAsDirty();
    }    

    /** Gets or sets the width of each cell (10 by default) */
    public get cellWidth(): number {
        return this._cellWidth;
    }

    public set cellWidth(value: number) {
        this._cellWidth = value;

        this._markAsDirty();
    }

    /** Gets or sets the height of each cell (10 by default) */
    public get cellHeight(): number {
        return this._cellHeight;
    }

    public set cellHeight(value: number) {
        this._cellHeight = value;

        this._markAsDirty();
    }

    /** Gets or sets the tickness of minor lines (1 by default) */
    public get minorLineTickness(): number {
        return this._minorLineTickness;
    }

    public set minorLineTickness(value: number) {
        this._minorLineTickness = value;

        this._markAsDirty();
    }

    /** Gets or sets the color of minor lines (DarkGray by default) */
    public get minorLineColor(): string {
        return this._minorLineColor;
    }

    public set minorLineColor(value: string) {
        this._minorLineColor = value;

        this._markAsDirty();
    }    

    /**
     * Creates a new GridDisplayRectangle
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        context.save();
        
        this._applyStates(context);

        if (this._processMeasures(parentMeasure, context)) {

            context.fillStyle = this._background;
            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);

            const cellCountX = this._currentMeasure.width / this._cellWidth;
            const cellCountY = this._currentMeasure.height / this._cellHeight;

            context.strokeStyle = this._minorLineColor;
            context.lineWidth = this._minorLineTickness;        

            const left = this._currentMeasure.left + this._currentMeasure.width / 2;

            for (var x = -cellCountX / 2; x < cellCountX / 2; x++) {
                const cellX = left + x * this.cellWidth;
                context.moveTo(cellX, this._currentMeasure.top);
                context.lineTo(cellX, this._currentMeasure.top + this._currentMeasure.height);
                context.stroke();
            }
        }

        context.restore();
    }

    protected _getTypeName(): string {
        return "GridDisplayRectangle";
    }
}    