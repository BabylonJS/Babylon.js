import { Measure } from "../measure";
import { Rectangle } from "./rectangle";
import { Grid } from "./grid";
import { Control } from "./control";
import { TextBlock } from "./textBlock";
import { Slider } from "./slider";
import { ValueAndUnit } from "../valueAndUnit";

/** Class used to hold the textBlock and slider in a grid
*/
export class ScrollText extends Rectangle {
    private _grid: Grid;
    private _textBlock: TextBlock;
    private _text: string = "";
    private _fontColor: string = "white";
    private _bar: Slider;
    private _barColor: string = "grey";
    private _barBorderColor: string = "#444444";
    private _barBackground: string = "white";
    private _endTop: number;
    private _scrollGridWidth: number = 30;

    /**
     * Gets or sets the text to display
     */
    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        if (this._text === value) {
            return;
        }
        this._text = value;
        this._textBlock.text = value;
    }

    /**
     * Gets or sets the fontColor
     */
    public get fontColor(): string {
        return this._fontColor;
    }

    public set fontColor(color: string) {
        if (this._fontColor === color) {
            return;
        }
        this._fontColor = color;
        this._textBlock.color = color;
    }

    /**
     * Sets the width of the scrollText, the left grid column and the textBlock
     */
    public set width(value: string | number) {
        if (this._width.toString(this._host) === value) {
            return;
        }

        if (this._width.fromString(value)) {
            this._markAsDirty();
            this._textBlock.width = (this.widthInPixels - this._scrollGridWidth) + "px";
            this._grid.setColumnDefinition(0, this._textBlock.widthInPixels, true);
        }
    }

    /**
     * Sets the height of the scrollText, the grid and the textBlock
     */

    public set height(value: string | number) {
        if (this._height.toString(this._host) === value) {
            return;
        }

        if (this._height.fromString(value)) {
            this._grid.setRowDefinition(0, this.heightInPixels, true);
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the padding to use on the left of the text
     */
    public get paddingLeft(): string | number {
        return this._textBlock.paddingLeft;
    }

    public set paddingLeft(value: string | number) {
        this._textBlock.paddingLeft = value;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the left of the text
     */
    public get paddingLeftInPixels(): number {
        return this._textBlock.paddingLeftInPixels;
    }

    /**
     * Gets or sets a value indicating the padding to use on the right of the text
     */
    public get paddingRight(): string | number {
        return this._textBlock.paddingRight;
    }

    public set paddingRight(value: string | number) {
        this._textBlock.paddingRight = value;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the right of the text
     */
    public get paddingRightInPixels(): number {
        return this._textBlock.paddingRightInPixels;
    }

    /**
     * Gets or sets a value indicating the padding to use at the top of the text
     */
    public get paddingTop(): string | number {
        return this._textBlock.paddingTop;
    }

    public set paddingTop(value: string | number) {
        this._textBlock.paddingTop = value;
    }

    /**
     * Gets a value indicating the padding in pixels to use at the top of the text
     */
    public get paddingTopInPixels(): number {
        return this._textBlock.paddingTopInPixels;
    }

    /**
     * Gets or sets a value indicating the padding to use on the bottom of the text
     */
    public get paddingBottom(): string | number {
        return this._textBlock.paddingBottom;
    }

    public set paddingBottom(value: string | number) {
        this._textBlock.paddingBottom = value;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the bottom of the text
     */
    public get paddingBottomInPixels(): number {
        return this._textBlock.paddingBottomInPixels;
    }

    /**
    * Creates a new ScrollText
    * @param name of ScrollText
    * @param text of ScrollText
    */
    constructor(
        /** name of ScrollText */
        public name?: string,
        text: string = "") {
        super(name);
        this._text = text;
        this._grid = new Grid();
        this._textBlock = new TextBlock();
        this._bar = new Slider();

        this._width = new ValueAndUnit(0.25, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        this._height = new ValueAndUnit(0.25, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        this._background = "black";

        this.fontSize = "16px";

        this._grid.addColumnDefinition(1, true);
        this._grid.addColumnDefinition(this._scrollGridWidth, true);

        this.addControl(this._grid);

        this._textBlock.textWrapping = true;
        this._textBlock.color = this._fontColor;
        this._textBlock.top = "0px";
        this._textBlock.paddingLeft = "5px";
        this._textBlock.paddingRight = "5px";
        this._textBlock.paddingTop = "5px";
        this._textBlock.paddingBottom = "5px";
        this._textBlock.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._textBlock.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._textBlock.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._textBlock.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this._textBlock.onLinesReadyObservable.add(() => {
            let textPadding = this._textBlock.paddingTopInPixels + this._textBlock.paddingBottomInPixels + 2 * this.thickness;
            let textBlockHeight = (this.fontOffset.height) * this._textBlock.lines.length + textPadding;
            this._textBlock.height = textBlockHeight  + "px";
            this._endTop = this.heightInPixels - textBlockHeight - textPadding;
            this._bar.height = ((this.heightInPixels - textPadding) * 0.85) + "px";
            this._grid.setRowDefinition(0, this.heightInPixels - textPadding, true);
            if (textBlockHeight > this.heightInPixels) {
                this._bar.isVisible = true;
                this._grid.setColumnDefinition(1, this._scrollGridWidth, true);
            }
            else {
                this._bar.isVisible = false;
                this._grid.setColumnDefinition(1, 1, true);
            }
        });

        this._bar.paddingLeft = 0;
        this._bar.width = "25px";
        this._bar.value = 0;
        this._bar.maximum = 100;
        this._bar.horizontalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._bar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._bar.left = 0.05;
        this._bar.isThumbClamped = true;
        this._bar.color = "grey";
        this._bar.borderColor = "#444444";
        this._bar.background = "white";
        this._bar.isVisible = false;
        this._bar.isVertical = true;
        this._bar.rotation = Math.PI;
        this._grid.addControl(this._bar, 0, 1);

        this._bar.onValueChangedObservable.add((value) => {
            this._textBlock.top = (value * this._endTop / this._bar.maximum) + "px";
        });
    }

    /** Gets or sets the bar color */
    public get barColor(): string {
        return this._barColor;
    }

    public set barColor(color: string) {
        if (this._barColor === color) {
            return;
        }

        this._barColor = color;
        this._bar.color = color;

    }

    /** Gets or sets the bar color */
    public get barBorderColor(): string {
        return this._barBorderColor;
    }

    public set barBorderColor(color: string) {
        if (this._barBorderColor === color) {
            return;
        }

        this._barBorderColor = color;
        this._bar.borderColor = color;

    }

    /** Gets or sets the bar background */
    public get barBackground(): string {
        return this._barBackground;
    }

    public set barBackground(color: string) {
        if (this._barBackground === color) {
            return;
        }

        this._barBackground = color;
        this._bar.background = color;
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.width -= 2 * this.thickness;
        this._measureForChildren.height -= 2 * this.thickness;
        this._measureForChildren.left += this.thickness;
        this._measureForChildren.top += this.thickness;

        let innerWidth = this._width.getValueInPixel(this._host, parentMeasure.width)  - this._scrollGridWidth - 4 * this.thickness;

        this._textBlock.width = innerWidth + "px";
        this._grid.setColumnDefinition(0, innerWidth, true);
        this._grid.setRowDefinition(0, this._height.getValueInPixel(this._host, parentMeasure.height));
        this._grid.addControl(this._textBlock, 0, 0);
        this._textBlock.text = this._text;
    }

}