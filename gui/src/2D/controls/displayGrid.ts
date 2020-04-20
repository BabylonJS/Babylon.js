import { Control } from "./control";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { Nullable } from 'babylonjs/types';
import { Measure } from '../measure';

/** Class used to render a grid  */
export class DisplayGrid extends Control {
    private _cellWidth = 20;
    private _cellHeight = 20;

    private _minorLineTickness = 1;
    private _minorLineColor = "DarkGray";

    private _majorLineTickness = 2;
    private _majorLineColor = "White";

    private _majorLineFrequency = 5;

    private _background = "Black";

    private _displayMajorLines = true;
    private _displayMinorLines = true;

    /** Gets or sets a boolean indicating if minor lines must be rendered (true by default)) */
    public get displayMinorLines(): boolean {
        return this._displayMinorLines;
    }

    public set displayMinorLines(value: boolean) {
        if (this._displayMinorLines === value) {
            return;
        }

        this._displayMinorLines = value;
        this._markAsDirty();
    }

    /** Gets or sets a boolean indicating if major lines must be rendered (true by default)) */
    public get displayMajorLines(): boolean {
        return this._displayMajorLines;
    }

    public set displayMajorLines(value: boolean) {
        if (this._displayMajorLines === value) {
            return;
        }

        this._displayMajorLines = value;
        this._markAsDirty();
    }

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

    /** Gets or sets the width of each cell (20 by default) */
    public get cellWidth(): number {
        return this._cellWidth;
    }

    public set cellWidth(value: number) {
        this._cellWidth = value;

        this._markAsDirty();
    }

    /** Gets or sets the height of each cell (20 by default) */
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

    /** Gets or sets the tickness of major lines (2 by default) */
    public get majorLineTickness(): number {
        return this._majorLineTickness;
    }

    public set majorLineTickness(value: number) {
        this._majorLineTickness = value;

        this._markAsDirty();
    }

    /** Gets or sets the color of major lines (White by default) */
    public get majorLineColor(): string {
        return this._majorLineColor;
    }

    public set majorLineColor(value: string) {
        this._majorLineColor = value;

        this._markAsDirty();
    }

    /** Gets or sets the frequency of major lines (default is 1 every 5 minor lines)*/
    public get majorLineFrequency(): number {
        return this._majorLineFrequency;
    }

    public set majorLineFrequency(value: number) {
        this._majorLineFrequency = value;

        this._markAsDirty();
    }

    /**
     * Creates a new GridDisplayRectangle
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
    }

    public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void {
        context.save();

        this._applyStates(context);

        if (this._isEnabled) {

            if (this._background) {
                context.fillStyle = this._background;
                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }

            let cellCountX = this._currentMeasure.width / this._cellWidth;
            let cellCountY = this._currentMeasure.height / this._cellHeight;

            // Minor lines
            const left = this._currentMeasure.left + this._currentMeasure.width / 2;
            const top = this._currentMeasure.top + this._currentMeasure.height / 2;

            if (this._displayMinorLines) {
                context.strokeStyle = this._minorLineColor;
                context.lineWidth = this._minorLineTickness;

                for (var x = -cellCountX / 2; x < cellCountX / 2; x++) {
                    const cellX = left + x * this.cellWidth;

                    context.beginPath();
                    context.moveTo(cellX, this._currentMeasure.top);
                    context.lineTo(cellX, this._currentMeasure.top + this._currentMeasure.height);

                    context.stroke();
                }

                for (var y = -cellCountY / 2; y < cellCountY / 2; y++) {
                    const cellY = top + y * this.cellHeight;

                    context.beginPath();
                    context.moveTo(this._currentMeasure.left, cellY);
                    context.lineTo(this._currentMeasure.left + this._currentMeasure.width, cellY);
                    context.stroke();
                }
            }

            // Major lines
            if (this._displayMajorLines) {
                context.strokeStyle = this._majorLineColor;
                context.lineWidth = this._majorLineTickness;

                for (var x = -cellCountX / 2 + this._majorLineFrequency; x < cellCountX / 2; x += this._majorLineFrequency) {
                    let cellX = left + x * this.cellWidth;

                    context.beginPath();
                    context.moveTo(cellX, this._currentMeasure.top);
                    context.lineTo(cellX, this._currentMeasure.top + this._currentMeasure.height);
                    context.stroke();
                }

                for (var y = -cellCountY / 2 + this._majorLineFrequency; y < cellCountY / 2; y += this._majorLineFrequency) {
                    let cellY = top + y * this.cellHeight;
                    context.moveTo(this._currentMeasure.left, cellY);
                    context.lineTo(this._currentMeasure.left + this._currentMeasure.width, cellY);
                    context.closePath();
                    context.stroke();
                }
            }
        }

        context.restore();
    }

    protected _getTypeName(): string {
        return "DisplayGrid";
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.DisplayGrid"] = DisplayGrid;