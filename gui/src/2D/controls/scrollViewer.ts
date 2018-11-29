import { Measure } from "../measure";
import { Rectangle } from "./rectangle";
import { Grid } from "./grid";
import { Control } from "./control";
import { Slider } from "./slider";
import { Container } from "./container";
import { PointerInfo, Observer, Nullable } from "babylonjs";
import { AdvancedDynamicTexture } from "2D";

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
    private _endLeft: number;
    private _endTop: number;
    private _window: Container;
    private _pointerIsOver: Boolean = false;
    private _wheelPrecision: number = 0.05;
    private _onPointerObserver: Nullable<Observer<PointerInfo>>;

    /**
     * Adds a new control to the current container
     * @param control defines the control to add
     * @returns the current container
     */
    public addControl(control: Nullable<Control>): Container {
        if (!control) {
            return this;
        }
            
        this._window.addControl(control);

        return this;
    }

    /**
     * Removes a control from the current container
     * @param control defines the control to remove
     * @returns the current container
     */
    public removeControl(control: Control): Container {
        this._window.removeControl(control);
        return this;
    }
    
    /** Gets the list of children */
    public get children(): Control[] {
        return this._window.children;
    }

    public _flagDescendantsAsMatrixDirty(): void {
        this._window._flagDescendantsAsMatrixDirty();
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
        });

        this.onPointerEnterObservable.add(() => {
            this._pointerIsOver = true;
        });

        this.onPointerOutObservable.add(() => {
            this._pointerIsOver = false;
        });

        this._grid = new Grid();
        this._horizontalBar = new Slider();
        this._verticalBar = new Slider();

        this._window = new Container();
        this._window.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._window.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this._grid.addColumnDefinition(1, true);
        this._grid.addColumnDefinition(this._scrollGridWidth, true);
        this._grid.addRowDefinition(1, true);
        this._grid.addRowDefinition(this._scrollGridHeight, true);

        super.addControl(this._grid);
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

    protected _getTypeName(): string {
        return "ScrollViewer";
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._measureForChildren.left = 0;
        this._measureForChildren.top = 0;
        
        this._measureForChildren.width = this.widthInPixels - 2 * this.thickness;
        this._measureForChildren.height = this.heightInPixels - 2 * this.thickness;
    }
    
    protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._processMeasures(parentMeasure, context);
        
        let innerWidth = this.widthInPixels - this._scrollGridWidth - 2 * this.thickness;
        let innerHeight = this.heightInPixels  - this._scrollGridHeight - 2 * this.thickness;
        this._horizontalBar.width = (innerWidth * 0.8) + "px";
        this._verticalBar.height = (innerHeight * 0.8) + "px";

        this._grid.setColumnDefinition(0, innerWidth, true);
        this._grid.setRowDefinition(0, innerHeight, true);

        this._updateScroller();
    }

    /**
     * Gets or sets the mouse wheel precision
     * from 0 to 1 with a default value of 0.05
     * */
    public get wheelPrecision(): number {
        return this._wheelPrecision;
    }

    public set wheelPrecision(value: number) {
        if (this._wheelPrecision === value) {
            return;
        }

        if (value < 0) {
            value = 0;
        }

        if (value > 1) {
            value = 1;
        }

        this._wheelPrecision = value;
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
    private _updateScroller(): void {
        let windowContentsWidth = this._window.widthInPixels;
        let windowContentsHeight = this._window.heightInPixels;

        let viewerWidth = this.widthInPixels;
        let viewerHeight = this.heightInPixels;

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

    public _link(host: AdvancedDynamicTexture): void {
        super._link(host);

        this._attachWheel();
    }

    /** @hidden */
    private _attachWheel() {
        if (this._onPointerObserver) {
            return;
        }

        let scene = this._host.getScene();
        this._onPointerObserver = scene!.onPointerObservable.add((pi, state) => {
            if (!this._pointerIsOver || pi.type !== BABYLON.PointerEventTypes.POINTERWHEEL) {
                return;
            }
            if (this._verticalBar.isVisible == true) {
                if ((<MouseWheelEvent>pi.event).deltaY < 0 && this._verticalBar.value > 0) {
                    this._verticalBar.value -= this._wheelPrecision * 100;
                } else if ((<MouseWheelEvent>pi.event).deltaY > 0 && this._verticalBar.value < this._verticalBar.maximum) {
                    this._verticalBar.value += this._wheelPrecision * 100;
                }
            }
            if (this._horizontalBar.isVisible == true) {
                if ((<MouseWheelEvent>pi.event).deltaX < 0 && this._horizontalBar.value < this._horizontalBar.maximum) {
                    this._horizontalBar.value += this._wheelPrecision * 100;
                } else if ((<MouseWheelEvent>pi.event).deltaX > 0 && this._horizontalBar.value > 0) {
                    this._horizontalBar.value -= this._wheelPrecision * 100;
                }
            }
        });
    }

    public _renderHighlightSpecific(context: CanvasRenderingContext2D): void {
        if (!this.isHighlighted) {
            return;
        }

        super._renderHighlightSpecific(context);

        this._window._renderHighlightSpecific(context);

        context.restore();
    }

    /** Releases associated resources */
    public dispose() {
        let scene = this._host.getScene();
        if (scene && this._onPointerObserver) {
            scene.onPointerObservable.remove(this._onPointerObserver);
            this._onPointerObserver  = null;
        }
        super.dispose();
    }
}