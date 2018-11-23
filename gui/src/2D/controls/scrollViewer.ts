import { Measure } from "../measure";
import { Rectangle } from "./rectangle";
import { Grid } from "./grid";
import { Control } from "./control";
import { Slider } from "./slider";
import { ValueAndUnit } from "../valueAndUnit";
import { Container } from "./container";
import { TextBlock } from "./textBlock";

/**
 * Class used to hold a viewer window and sliders in a grid
*/
export class ScrollViewer extends Rectangle {
    private _grid: Grid;
    private _horizontalBarSpace: Rectangle;
    private _verticalBarSpace: Rectangle;
    private _dragSpace: Rectangle;
    private _horizontalBar: Slider;
    private _verticalBar: Slider;
    private _barColor: string = "grey";
    private _barBorderColor: string = "#444444";
    private _barBackground: string = "white";
    private _scrollGridWidth: number = 30;
    private _scrollGridHeight: number = 30;
    private _widthScale: number;
    private _heightScale: number;
    private _endLeft: number;
    private _endTop: number;
    private _window: Container;
    private _windowContents: Control;

    /**
     * Adds windowContents to the grid view window
     * @param windowContents the contents to add the grid view window
     */
    public addToWindow(windowContents: Control): void {
        this._window.removeControl(this._windowContents);
        this._windowContents.dispose();
        this._windowContents = windowContents;
        if (windowContents.typeName === "TextBlock") {
            this._updateTextBlock(windowContents);
        }
        else {
            this._updateScroller(windowContents);
        }
        this._window.addControl(windowContents);
    }

    /**
     * Gets or sets a value indicating the padding to use on the left of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingLeft(): string | number {
        return this._windowContents.paddingLeft;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the left of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingLeftInPixels(): number {
        return this._windowContents.paddingLeftInPixels;
    }

    public set paddingLeft(value: string | number) {
        this._windowContents.paddingLeft = value;
    }

    /**
     * Gets or sets a value indicating the padding to use on the right of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingRight(): string | number {
        return this._windowContents.paddingRight;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the right of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingRightInPixels(): number {
        return this._windowContents.paddingRightInPixels;
    }

    public set paddingRight(value: string | number) {
        this._windowContents.paddingRight = value;
    }

    /**
     * Gets or sets a value indicating the padding to use on the top of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingTop(): string | number {
        return this._windowContents.paddingTop;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the top of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingTopInPixels(): number {
        return this._windowContents.paddingTopInPixels;
    }

    public set paddingTop(value: string | number) {
        this._windowContents.paddingTop = value;
    }

    /**
     * Gets or sets a value indicating the padding to use on the bottom of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingBottom(): string | number {
        return this._windowContents.paddingBottom;
    }

    /**
     * Gets a value indicating the padding in pixels to use on the bottom of the viewer window
     * @see http://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingBottomInPixels(): number {
        return this._windowContents.paddingBottomInPixels;
    }

    public set paddingBottom(value: string | number) {
        this._windowContents.paddingBottom = value;
    }

    /**
    * Creates a new ScrollViewer
    * @param name of ScrollViewer
    */
    constructor(
        /** name of ScrollViewer */
        public name?: string) {
        super(name);

        this.onDirtyObservable.add(() => {
            this._horizontalBarSpace.color = this.color;
            this._verticalBarSpace.color = this.color;
            this._dragSpace.color = this.color;
            this._updateScroller(this._windowContents);
            if (this._windowContents.typeName === "TextBlock") {
                this._updateTextBlock(this._windowContents);
            }
        });

        this._grid = new Grid();
        this._horizontalBar = new Slider();
        this._verticalBar = new Slider();

        this._window = new Container();
        this._window.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._window.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this._windowContents = new Control();
        this._window.addControl(this._windowContents);

        this._width = new ValueAndUnit(0.25, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        this._height = new ValueAndUnit(0.25, ValueAndUnit.UNITMODE_PERCENTAGE, false);
        this._background = "black";

        this.fontSize = "16px";

        this._grid.addColumnDefinition(1, true);
        this._grid.addColumnDefinition(this._scrollGridWidth, true);
        this._grid.addRowDefinition(1, true);
        this._grid.addRowDefinition(this._scrollGridHeight, true);

        this.addControl(this._grid);
        this._grid.addControl(this._window, 0, 0);

        this._verticalBar.paddingLeft = 0;
        this._verticalBar.width = "25px";
        this._verticalBar.value = 0;
        this._verticalBar.maximum = 100;
        this._verticalBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._verticalBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._verticalBar.left = 0.05;
        this._verticalBar.isThumbClamped = true;
        this._verticalBar.color = "grey";
        this._verticalBar.borderColor = "#444444";
        this._verticalBar.background = "white";
        this._verticalBar.isVertical = true;
        this._verticalBar.rotation = Math.PI;

        this._verticalBarSpace = new Rectangle();
        this._verticalBarSpace.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._verticalBarSpace.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._verticalBarSpace.color = this.color;
        this._verticalBarSpace.thickness = 1;
        this._grid.addControl(this._verticalBarSpace, 0, 1);
        this._verticalBarSpace.addControl(this._verticalBar);

        this._verticalBar.onValueChangedObservable.add((value) => {
            this._window.top = value * this._endTop / 100 + "px";
        });

        this._horizontalBar.paddingLeft = 0;
        this._horizontalBar.height = "25px";
        this._horizontalBar.value = 0;
        this._horizontalBar.maximum = 100;
        this._horizontalBar.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        this._horizontalBar.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        this._horizontalBar.left = 0.05;
        this._horizontalBar.isThumbClamped = true;
        this._horizontalBar.color = "grey";
        this._horizontalBar.borderColor = "#444444";
        this._horizontalBar.background = "white";

        this._horizontalBarSpace = new Rectangle();
        this._horizontalBarSpace.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._horizontalBarSpace.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._horizontalBarSpace.color = this.color;
        this._horizontalBarSpace.thickness = 1;
        this._grid.addControl(this._horizontalBarSpace, 1, 0);
        this._horizontalBarSpace.addControl(this._horizontalBar);

        this._horizontalBar.onValueChangedObservable.add((value) => {
            this._window.left = value * this._endLeft / 100 + "px";
        });

        this._dragSpace = new Rectangle();
        this._dragSpace.color = this.color;
        this._dragSpace.thickness = 2;
        this._dragSpace.background = this._barColor;
        this._grid.addControl(this._dragSpace, 1, 1);
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
        this._horizontalBar.color = color;
        this._verticalBar.color = color;
        this._dragSpace.background = color;
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
        this._horizontalBar.borderColor = color;
        this._verticalBar.borderColor = color;
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
        this._horizontalBar.background = color;
        this._verticalBar.background = color;
    }

    /** @hidden */
    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        let viewerWidth = this._width.getValueInPixel(this._host, parentMeasure.width);
        let viewerHeight = this._height.getValueInPixel(this._host, parentMeasure.height);

        let innerWidth = viewerWidth - this._scrollGridWidth - 2 * this.thickness;
        let innerHeight = viewerHeight  - this._scrollGridHeight - 2 * this.thickness;
        this._horizontalBar.width = (innerWidth * 0.8) + "px";
        this._verticalBar.height = (innerHeight * 0.8) + "px";

        this._grid.setColumnDefinition(0, innerWidth, true);
        this._grid.setRowDefinition(0, innerHeight, true);
    }

    /** @hidden */
    private _updateScroller(windowContents: Control): void {

        let windowContentsWidth: number  = parseFloat(windowContents.width.toString());
        if (windowContents._width.unit === 0) {
            this._widthScale = windowContentsWidth / 100;
            windowContentsWidth = this._host.getSize().width * this._widthScale;
            windowContents.width = windowContentsWidth + "px";
        }

        let windowContentsHeight: number  = parseFloat(windowContents.height.toString());
        if (windowContents._height.unit === 0) {
            this._heightScale = windowContentsHeight / 100;
            windowContentsHeight = this._host.getSize().height * this._heightScale;
            windowContents.height = this._host.getSize().height * this._heightScale + "px";
        }

        this._window.width = windowContents.width;
        this._window.height = windowContents.height;
        this._windowContents.width = windowContents.width;
        this._windowContents.height = windowContents.height;

        let viewerWidth = this._width.getValueInPixel(this._host, this._host.getSize().width);
        let viewerHeight = this._height.getValueInPixel(this._host, this._host.getSize().height);

        let innerWidth = viewerWidth - this._scrollGridWidth - 2 * this.thickness;
        let innerHeight = viewerHeight  - this._scrollGridHeight - 2 * this.thickness;

        if (windowContentsWidth <= innerWidth) {
            this._grid.setRowDefinition(0, viewerHeight - 2 * this.thickness , true);
            this._grid.setRowDefinition(1, 0, true);
            this._horizontalBar.isVisible = false;
        }
        else {
            this._grid.setRowDefinition(0, innerHeight, true);
            this._grid.setRowDefinition(1, this._scrollGridHeight, true);
            this._horizontalBar.isVisible = true;
        }

        if (windowContentsHeight < innerHeight) {
            this._grid.setColumnDefinition(0, viewerWidth - 2 * this.thickness, true);
            this._grid.setColumnDefinition(1, 0, true);
            this._verticalBar.isVisible = false;
        }
        else {
            this._grid.setColumnDefinition(0, innerWidth, true);
            this._grid.setColumnDefinition(1, this._scrollGridWidth, true);
            this._verticalBar.isVisible = true;
        }

        this._endLeft = innerWidth - windowContentsWidth;
        this._endTop = innerHeight - windowContentsHeight;
    }

    /** @hidden */
    private _updateTextBlock(windowContents: Control): void {
        let viewerWidth = this._width.getValueInPixel(this._host, this._host.getSize().width);
        let innerWidth = viewerWidth - this._scrollGridWidth - 2 * this.thickness;

        windowContents.width = innerWidth + "px";

        this._window.width = windowContents.width;
        this._windowContents.width = windowContents.width;

        (<TextBlock>windowContents).onLinesReadyObservable.add(() => {
            let windowContentsHeight = (this.fontOffset.height) * (<TextBlock>windowContents).lines.length + windowContents.paddingTopInPixels + windowContents.paddingBottomInPixels;
            windowContents.height = windowContentsHeight + "px";
            this._window.height = windowContents.height;
            this._windowContents.height = windowContents.height;
            this._updateScroller(windowContents);
        });
    }
}