import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math";
import { Rectangle } from "../rectangle";
import { Grid } from "../grid";
import { Image } from "../image";
import { Control } from "../control";
import { Container } from "../container";
import { Measure } from "../../measure";
import { AdvancedDynamicTexture } from "../../advancedDynamicTexture";
import { _ScrollViewerWindow } from "./scrollViewerWindow";
import { ScrollBar } from "../sliders/scrollBar";
import { ImageScrollBar } from "../sliders/imageScrollBar";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/**
 * Class used to hold a viewer window and sliders in a grid
*/
export class ScrollViewer extends Rectangle {
    private _grid: Grid;
    private _horizontalBarSpace: Rectangle;
    private _verticalBarSpace: Rectangle;
    private _dragSpace: Rectangle;
    private _horizontalBar: ScrollBar | ImageScrollBar;
    private _verticalBar: ScrollBar | ImageScrollBar;
    private _barColor: string;
    private _barBackground: string;
    private _barImage: Image;
    private _horizontalBarImage: Image;
    private _verticalBarImage: Image;
    private _barBackgroundImage: Image;
    private _horizontalBarBackgroundImage: Image;
    private _verticalBarBackgroundImage: Image;
    private _barSize: number = 20;
    private _window: _ScrollViewerWindow;
    private _pointerIsOver: Boolean = false;
    private _wheelPrecision: number = 0.05;
    private _onWheelObserver: Nullable<Observer<Vector2>>;
    private _clientWidth: number;
    private _clientHeight: number;
    private _useImageBar: Boolean;
    private _thumbLength: number = 0.5;
    private _thumbHeight: number = 1;
    private _barImageHeight: number = 1;
    private _horizontalBarImageHeight: number = 1;
    private _verticalBarImageHeight: number = 1;
    private _oldWindowContentsWidth: number = 0;
    private _oldWindowContentsHeight: number = 0;

    /**
     * Gets the horizontal scrollbar
     */
    public get horizontalBar(): ScrollBar | ImageScrollBar {
        return this._horizontalBar;
    }

    /**
     * Gets the vertical scrollbar
     */
    public get verticalBar(): ScrollBar | ImageScrollBar {
        return this._verticalBar;
    }

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
        for (var child of this._children) {
            child._markMatrixAsDirty();
        }
    }

    /**
     * Freezes or unfreezes the controls in the window.
     * When controls are frozen, the scroll viewer can render a lot more quickly but updates to positions/sizes of controls
     * are not taken into account. If you want to change positions/sizes, unfreeze, perform the changes then freeze again
     */
    public get freezeControls(): boolean {
        return this._window.freezeControls;
    }

    public set freezeControls(value: boolean) {
        this._window.freezeControls = value;
    }

    /** Gets the bucket width */
    public get bucketWidth(): number {
        return this._window.bucketWidth;
    }

    /** Gets the bucket height */
    public get bucketHeight(): number {
        return this._window.bucketHeight;
    }

    /**
     * Sets the bucket sizes.
     * When freezeControls is true, setting a non-zero bucket size will improve performances by updating only
     * controls that are visible. The bucket sizes is used to subdivide (internally) the window area to smaller areas into which
     * controls are dispatched. So, the size should be roughly equals to the mean size of all the controls of
     * the window. To disable the usage of buckets, sets either width or height (or both) to 0.
     * Please note that using this option will raise the memory usage (the higher the bucket sizes, the less memory
     * used), that's why it is not enabled by default.
     * @param width width of the bucket
     * @param height height of the bucket
     */
    public setBucketSizes(width: number, height: number): void {
        this._window.setBucketSizes(width, height);
    }

    private _forceHorizontalBar: boolean = false;
    private _forceVerticalBar: boolean = false;

    /**
     * Forces the horizontal scroll bar to be displayed
     */
    public get forceHorizontalBar(): boolean {
        return this._forceHorizontalBar;
    }

    public set forceHorizontalBar(value: boolean) {
        this._grid.setRowDefinition(1, value ? this._barSize : 0, true);
        this._horizontalBar.isVisible = value;
        this._forceHorizontalBar = value;
    }

    /**
     * Forces the vertical scroll bar to be displayed
     */
    public get forceVerticalBar(): boolean {
        return this._forceVerticalBar;
    }

    public set forceVerticalBar(value: boolean) {
        this._grid.setColumnDefinition(1, value ? this._barSize : 0, true);
        this._verticalBar.isVisible = value;
        this._forceVerticalBar = value;
    }

    /**
    * Creates a new ScrollViewer
    * @param name of ScrollViewer
    */
    constructor(name?: string, isImageBased?: boolean) {
        super(name);

        this._useImageBar = isImageBased ? isImageBased : false;

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
        if (this._useImageBar) {
            this._horizontalBar = new ImageScrollBar();
            this._verticalBar = new ImageScrollBar();
        }
        else {
            this._horizontalBar = new ScrollBar();
            this._verticalBar = new ScrollBar();
        }

        this._window = new _ScrollViewerWindow("scrollViewer_window");
        this._window.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._window.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        this._grid.addColumnDefinition(1);
        this._grid.addColumnDefinition(0, true);
        this._grid.addRowDefinition(1);
        this._grid.addRowDefinition(0, true);

        super.addControl(this._grid);
        this._grid.addControl(this._window, 0, 0);

        this._verticalBarSpace = new Rectangle();
        this._verticalBarSpace.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._verticalBarSpace.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._verticalBarSpace.thickness = 1;
        this._grid.addControl(this._verticalBarSpace, 0, 1);
        this._addBar(this._verticalBar, this._verticalBarSpace, true, Math.PI);

        this._horizontalBarSpace = new Rectangle();
        this._horizontalBarSpace.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this._horizontalBarSpace.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._horizontalBarSpace.thickness = 1;
        this._grid.addControl(this._horizontalBarSpace, 1, 0);
        this._addBar(this._horizontalBar, this._horizontalBarSpace, false, 0);

        this._dragSpace = new Rectangle();
        this._dragSpace.thickness = 1;
        this._grid.addControl(this._dragSpace, 1, 1);

        // Colors
        if (!this._useImageBar) {
            this.barColor = "grey";
            this.barBackground = "transparent";
        }
    }

    /** Reset the scroll viewer window to initial size */
    public resetWindow() {
        this._window.width = "100%";
        this._window.height = "100%";
    }

    protected _getTypeName(): string {
        return "ScrollViewer";
    }

    private _buildClientSizes() {
        let ratio = this.host.idealRatio;

        this._window.parentClientWidth = this._currentMeasure.width - (this._verticalBar.isVisible || this.forceVerticalBar ? this._barSize * ratio : 0) - 2 * this.thickness;
        this._window.parentClientHeight = this._currentMeasure.height - (this._horizontalBar.isVisible || this.forceHorizontalBar ? this._barSize * ratio : 0) - 2 * this.thickness;

        this._clientWidth = this._window.parentClientWidth;
        this._clientHeight = this._window.parentClientHeight;
    }

    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        super._additionalProcessing(parentMeasure, context);

        this._buildClientSizes();
    }

    protected _postMeasure(): void {
        super._postMeasure();

        this._updateScroller();

        this._setWindowPosition(false);
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

    /** Gets or sets the scroll bar container background color */
    public get scrollBackground(): string {
        return this._horizontalBarSpace.background;
    }

    public set scrollBackground(color: string) {
        if (this._horizontalBarSpace.background === color) {
            return;
        }
        this._horizontalBarSpace.background = color;
        this._verticalBarSpace.background = color;
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
    }

    /** Gets or sets the bar image */
    public get thumbImage(): Image {
        return this._barImage;
    }

    public set thumbImage(value: Image) {
        if (this._barImage === value) {
            return;
        }

        this._barImage = value;
        let hb = <ImageScrollBar>this._horizontalBar;
        let vb = <ImageScrollBar>this._verticalBar;
        hb.thumbImage = value;
        vb.thumbImage = value;
    }

    /** Gets or sets the horizontal bar image */
    public get horizontalThumbImage(): Image {
        return this._horizontalBarImage;
    }

    public set horizontalThumbImage(value: Image) {
        if (this._horizontalBarImage === value) {
            return;
        }

        this._horizontalBarImage = value;
        let hb = <ImageScrollBar>this._horizontalBar;
        hb.thumbImage = value;
    }

    /** Gets or sets the vertical bar image */
    public get verticalThumbImage(): Image {
        return this._verticalBarImage;
    }

    public set verticalThumbImage(value: Image) {
        if (this._verticalBarImage === value) {
            return;
        }

        this._verticalBarImage = value;
        let vb = <ImageScrollBar>this._verticalBar;
        vb.thumbImage = value;
    }

    /** Gets or sets the size of the bar */
    public get barSize(): number {
        return this._barSize;
    }

    public set barSize(value: number) {
        if (this._barSize === value) {
            return;
        }

        this._barSize = value;
        this._markAsDirty();

        if (this._horizontalBar.isVisible) {
            this._grid.setRowDefinition(1, this._barSize, true);
        }
        if (this._verticalBar.isVisible) {
            this._grid.setColumnDefinition(1, this._barSize, true);
        }
    }

    /** Gets or sets the length of the thumb */
    public get thumbLength(): number {
        return this._thumbLength;
    }

    public set thumbLength(value: number) {
        if (this._thumbLength === value) {
            return;
        }
        if (value <= 0) {
            value = 0.1;
        }
        if (value > 1) {
            value = 1;
        }
        this._thumbLength = value;
        var hb = <ImageScrollBar>this._horizontalBar;
        var vb = <ImageScrollBar>this._verticalBar;
        hb.thumbLength = value;
        vb.thumbLength = value;
        this._markAsDirty();
    }

    /** Gets or sets the height of the thumb */
    public get thumbHeight(): number {
        return this._thumbHeight;
    }

    public set thumbHeight(value: number) {
        if (this._thumbHeight === value) {
            return;
        }
        if (value <= 0) {
            value = 0.1;
        }
        if (value > 1) {
            value = 1;
        }
        this._thumbHeight = value;
        var hb = <ImageScrollBar>this._horizontalBar;
        var vb = <ImageScrollBar>this._verticalBar;
        hb.thumbHeight = value;
        vb.thumbHeight = value;
        this._markAsDirty();
    }

    /** Gets or sets the height of the bar image */
    public get barImageHeight(): number {
        return this._barImageHeight;
    }

    public set barImageHeight(value: number) {
        if (this._barImageHeight === value) {
            return;
        }
        if (value <= 0) {
            value = 0.1;
        }
        if (value > 1) {
            value = 1;
        }
        this._barImageHeight = value;
        var hb = <ImageScrollBar>this._horizontalBar;
        var vb = <ImageScrollBar>this._verticalBar;
        hb.barImageHeight = value;
        vb.barImageHeight = value;
        this._markAsDirty();
    }

    /** Gets or sets the height of the horizontal bar image */
    public get horizontalBarImageHeight(): number {
        return this._horizontalBarImageHeight;
    }

    public set horizontalBarImageHeight(value: number) {
        if (this._horizontalBarImageHeight === value) {
            return;
        }
        if (value <= 0) {
            value = 0.1;
        }
        if (value > 1) {
            value = 1;
        }
        this._horizontalBarImageHeight = value;
        var hb = <ImageScrollBar>this._horizontalBar;
        hb.barImageHeight = value;
        this._markAsDirty();
    }

    /** Gets or sets the height of the vertical bar image */
    public get verticalBarImageHeight(): number {
        return this._verticalBarImageHeight;
    }

    public set verticalBarImageHeight(value: number) {
        if (this._verticalBarImageHeight === value) {
            return;
        }
        if (value <= 0) {
            value = 0.1;
        }
        if (value > 1) {
            value = 1;
        }
        this._verticalBarImageHeight = value;
        var vb = <ImageScrollBar>this._verticalBar;
        vb.barImageHeight = value;
        this._markAsDirty();
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
        let hb = <ScrollBar>this._horizontalBar;
        let vb = <ScrollBar>this._verticalBar;
        hb.background = color;
        vb.background = color;
        this._dragSpace.background = color;
    }

    /** Gets or sets the bar background image */
    public get barImage(): Image {
        return this._barBackgroundImage;
    }

    public set barImage(value: Image) {
        if (this._barBackgroundImage === value) {
        }

        this._barBackgroundImage = value;
        let hb = <ImageScrollBar>this._horizontalBar;
        let vb = <ImageScrollBar>this._verticalBar;
        hb.backgroundImage = value;
        vb.backgroundImage = value;
    }

    /** Gets or sets the horizontal bar background image */
    public get horizontalBarImage(): Image {
        return this._horizontalBarBackgroundImage;
    }

    public set horizontalBarImage(value: Image) {
        if (this._horizontalBarBackgroundImage === value) {
        }

        this._horizontalBarBackgroundImage = value;
        let hb = <ImageScrollBar>this._horizontalBar;
        hb.backgroundImage = value;
    }

    /** Gets or sets the vertical bar background image */
    public get verticalBarImage(): Image {
        return this._verticalBarBackgroundImage;
    }

    public set verticalBarImage(value: Image) {
        if (this._verticalBarBackgroundImage === value) {
        }

        this._verticalBarBackgroundImage = value;
        let vb = <ImageScrollBar>this._verticalBar;
        vb.backgroundImage = value;
    }

    private _setWindowPosition(force = true): void {
        let ratio = this.host.idealRatio;
        let windowContentsWidth = this._window._currentMeasure.width;
        let windowContentsHeight = this._window._currentMeasure.height;

        if (!force && this._oldWindowContentsWidth === windowContentsWidth && this._oldWindowContentsHeight === windowContentsHeight) {
            return;
        }

        this._oldWindowContentsWidth = windowContentsWidth;
        this._oldWindowContentsHeight = windowContentsHeight;

        const _endLeft = this._clientWidth - windowContentsWidth;
        const _endTop = this._clientHeight - windowContentsHeight;

        const newLeft = (this._horizontalBar.value / ratio) * _endLeft + "px";
        const newTop = (this._verticalBar.value / ratio) * _endTop + "px";

        if (newLeft !== this._window.left) {
            this._window.left = newLeft;
            if (!this.freezeControls) {
                this._rebuildLayout = true;
            }
        }

        if (newTop !== this._window.top) {
            this._window.top = newTop;
            if (!this.freezeControls) {
                this._rebuildLayout = true;
            }
        }
    }

    /** @hidden */
    private _updateScroller(): void {
        let windowContentsWidth = this._window._currentMeasure.width;
        let windowContentsHeight = this._window._currentMeasure.height;

        if (this._horizontalBar.isVisible && windowContentsWidth <= this._clientWidth && !this.forceHorizontalBar) {
            this._grid.setRowDefinition(1, 0, true);
            this._horizontalBar.isVisible = false;
            this._horizontalBar.value = 0;
            this._rebuildLayout = true;
        }
        else if (!this._horizontalBar.isVisible && (windowContentsWidth > this._clientWidth || this.forceHorizontalBar)) {
            this._grid.setRowDefinition(1, this._barSize, true);
            this._horizontalBar.isVisible = true;
            this._rebuildLayout = true;
        }

        if (this._verticalBar.isVisible && windowContentsHeight <= this._clientHeight && !this.forceVerticalBar) {
            this._grid.setColumnDefinition(1, 0, true);
            this._verticalBar.isVisible = false;
            this._verticalBar.value = 0;
            this._rebuildLayout = true;
        }
        else if (!this._verticalBar.isVisible && (windowContentsHeight > this._clientHeight || this.forceVerticalBar)) {
            this._grid.setColumnDefinition(1, this._barSize, true);
            this._verticalBar.isVisible = true;
            this._rebuildLayout = true;
        }

        this._buildClientSizes();

        let ratio = this.host.idealRatio;

        this._horizontalBar.thumbWidth = this._thumbLength * 0.9 * (this._clientWidth / ratio) + "px";
        this._verticalBar.thumbWidth = this._thumbLength *  0.9 * (this._clientHeight / ratio) + "px";
    }

    public _link(host: AdvancedDynamicTexture): void {
        super._link(host);

        this._attachWheel();
    }

    /** @hidden */
    private _addBar(barControl: ScrollBar | ImageScrollBar, barContainer: Rectangle, isVertical: boolean, rotation: number) {
        barControl.paddingLeft = 0;
        barControl.width = "100%";
        barControl.height = "100%";
        barControl.barOffset = 0;
        barControl.value = 0;
        barControl.maximum = 1;
        barControl.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        barControl.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        barControl.isVertical = isVertical;
        barControl.rotation = rotation;
        barControl.isVisible = false;

        barContainer.addControl(barControl);

        barControl.onValueChangedObservable.add((value) => {
            this._setWindowPosition();
        });
    }

    /** @hidden */
    private _attachWheel() {
        if (!this._host || this._onWheelObserver) {
            return;
        }

        this._onWheelObserver = this.onWheelObservable.add((pi) => {
            if (!this._pointerIsOver) {
                return;
            }
            if (this._verticalBar.isVisible == true) {
                if (pi.y < 0 && this._verticalBar.value > 0) {
                    this._verticalBar.value -= this._wheelPrecision;
                } else if (pi.y > 0 && this._verticalBar.value < this._verticalBar.maximum) {
                    this._verticalBar.value += this._wheelPrecision;
                }
            }
            if (this._horizontalBar.isVisible == true) {
                if (pi.x < 0 && this._horizontalBar.value < this._horizontalBar.maximum) {
                    this._horizontalBar.value += this._wheelPrecision;
                } else if (pi.x > 0 && this._horizontalBar.value > 0) {
                    this._horizontalBar.value -= this._wheelPrecision;
                }
            }
        });
    }

    public _renderHighlightSpecific(context: CanvasRenderingContext2D): void {
        if (!this.isHighlighted) {
            return;
        }

        super._renderHighlightSpecific(context);

        this._grid._renderHighlightSpecific(context);

        context.restore();
    }

    /** Releases associated resources */
    public dispose() {
        this.onWheelObservable.remove(this._onWheelObserver);
        this._onWheelObserver = null;
        super.dispose();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.ScrollViewer"] = ScrollViewer;