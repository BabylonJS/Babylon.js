import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { Vector2, Vector3, Matrix } from "babylonjs/Maths/math.vector";
import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';
import { Logger } from "babylonjs/Misc/logger";
import { Tools } from "babylonjs/Misc/tools";
import { AbstractMesh } from "babylonjs/Meshes/abstractMesh";
import { Scene } from "babylonjs/scene";

import { Container } from "./container";
import { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import { ValueAndUnit } from "../valueAndUnit";
import { Measure } from "../measure";
import { Style } from "../style";
import { Matrix2D, Vector2WithInfo } from "../math2D";
import { _TypeStore } from 'babylonjs/Misc/typeStore';

/**
 * Root class used for all 2D controls
 * @see https://doc.babylonjs.com/how_to/gui#controls
 */
export class Control {
    /**
     * Gets or sets a boolean indicating if alpha must be an inherited value (false by default)
     */
    public static AllowAlphaInheritance = false;

    private _alpha = 1;
    private _alphaSet = false;
    private _zIndex = 0;
    /** @hidden */
    public _host: AdvancedDynamicTexture;
    /** Gets or sets the control parent */
    public parent: Nullable<Container>;
    /** @hidden */
    public _currentMeasure = Measure.Empty();
    private _fontFamily = "Arial";
    private _fontStyle = "";
    private _fontWeight = "";
    private _fontSize = new ValueAndUnit(18, ValueAndUnit.UNITMODE_PIXEL, false);
    private _font: string;
    /** @hidden */
    public _width = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
    /** @hidden */
    public _height = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
    /** @hidden */
    protected _fontOffset: { ascent: number, height: number, descent: number };
    private _color = "";
    private _style: Nullable<Style> = null;
    private _styleObserver: Nullable<Observer<Style>>;
    /** @hidden */
    protected _horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    /** @hidden */
    protected _verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    /** @hidden */
    protected _isDirty = true;
    /** @hidden */
    protected _wasDirty = false;
    /** @hidden */
    public _tempParentMeasure = Measure.Empty();
    /** @hidden */
    public _prevCurrentMeasureTransformedIntoGlobalSpace = Measure.Empty();
    /** @hidden */
    protected _cachedParentMeasure = Measure.Empty();
    private _paddingLeft = new ValueAndUnit(0);
    private _paddingRight = new ValueAndUnit(0);
    private _paddingTop = new ValueAndUnit(0);
    private _paddingBottom = new ValueAndUnit(0);
    /** @hidden */
    public _left = new ValueAndUnit(0);
    /** @hidden */
    public _top = new ValueAndUnit(0);
    private _scaleX = 1.0;
    private _scaleY = 1.0;
    private _rotation = 0;
    private _transformCenterX = 0.5;
    private _transformCenterY = 0.5;
    /** @hidden */
    public _transformMatrix = Matrix2D.Identity();
    /** @hidden */
    protected _invertTransformMatrix = Matrix2D.Identity();
    /** @hidden */
    protected _transformedPosition = Vector2.Zero();
    private _isMatrixDirty = true;
    private _cachedOffsetX: number;
    private _cachedOffsetY: number;
    private _isVisible = true;
    private _isHighlighted = false;
    /** @hidden */
    public _linkedMesh: Nullable<AbstractMesh>;
    private _fontSet = false;
    private _dummyVector2 = Vector2.Zero();
    private _downCount = 0;
    private _enterCount = -1;
    private _doNotRender = false;
    private _downPointerIds: { [id: number]: boolean } = {};
    protected _isEnabled = true;
    protected _disabledColor = "#9a9a9a";
    protected _disabledColorItem = "#6a6a6a";
    /** @hidden */
    protected _rebuildLayout = false;

    /** @hidden */
    public _customData: any = {};

    /** @hidden */
    public _isClipped = false;

    /** @hidden */
    public _automaticSize = false;

    /** @hidden */
    public _tag: any;

    /**
     * Gets or sets the unique id of the node. Please note that this number will be updated when the control is added to a container
     */
    public uniqueId: number;

    /**
     * Gets or sets an object used to store user defined information for the node
     */
    public metadata: any = null;

    /** Gets or sets a boolean indicating if the control can be hit with pointer events */
    public isHitTestVisible = true;
    /** Gets or sets a boolean indicating if the control can block pointer events */
    public isPointerBlocker = false;
    /** Gets or sets a boolean indicating if the control can be focusable */
    public isFocusInvisible = false;

    /**
     * Gets or sets a boolean indicating if the children are clipped to the current control bounds.
     * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
     */
    public clipChildren = true;

    /**
     * Gets or sets a boolean indicating that control content must be clipped
     * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
     */
    public clipContent = true;

    /**
     * Gets or sets a boolean indicating that the current control should cache its rendering (useful when the control does not change often)
     */
    public useBitmapCache = false;

    private _cacheData: Nullable<ImageData>;

    private _shadowOffsetX = 0;
    /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
    public get shadowOffsetX() {
        return this._shadowOffsetX;
    }

    public set shadowOffsetX(value: number) {
        if (this._shadowOffsetX === value) {
            return;
        }

        this._shadowOffsetX = value;
        this._markAsDirty();
    }

    private _shadowOffsetY = 0;
    /** Gets or sets a value indicating the offset to apply on Y axis to render the shadow */
    public get shadowOffsetY() {
        return this._shadowOffsetY;
    }

    public set shadowOffsetY(value: number) {
        if (this._shadowOffsetY === value) {
            return;
        }

        this._shadowOffsetY = value;
        this._markAsDirty();
    }

    private _shadowBlur = 0;
    /** Gets or sets a value indicating the amount of blur to use to render the shadow */
    public get shadowBlur() {
        return this._shadowBlur;
    }

    public set shadowBlur(value: number) {
        if (this._shadowBlur === value) {
            return;
        }

        this._shadowBlur = value;
        this._markAsDirty();
    }

    private _shadowColor = 'black';
    /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
    public get shadowColor() {
        return this._shadowColor;
    }

    public set shadowColor(value: string) {
        if (this._shadowColor === value) {
            return;
        }

        this._shadowColor = value;
        this._markAsDirty();
    }

    /** Gets or sets the cursor to use when the control is hovered */
    public hoverCursor = "";

    /** @hidden */
    protected _linkOffsetX = new ValueAndUnit(0);
    /** @hidden */
    protected _linkOffsetY = new ValueAndUnit(0);

    // Properties

    /** Gets the control type name */
    public get typeName(): string {
        return this._getTypeName();
    }

    /**
     * Get the current class name of the control.
     * @returns current class name
     */
    public getClassName(): string {
        return this._getTypeName();
    }

    /**
    * An event triggered when pointer wheel is scrolled
    */
    public onWheelObservable = new Observable<Vector2>();
    /**
    * An event triggered when the pointer move over the control.
    */
    public onPointerMoveObservable = new Observable<Vector2>();

    /**
    * An event triggered when the pointer move out of the control.
    */
    public onPointerOutObservable = new Observable<Control>();

    /**
    * An event triggered when the pointer taps the control
    */
    public onPointerDownObservable = new Observable<Vector2WithInfo>();

    /**
    * An event triggered when pointer up
    */
    public onPointerUpObservable = new Observable<Vector2WithInfo>();

    /**
    * An event triggered when a control is clicked on
    */
    public onPointerClickObservable = new Observable<Vector2WithInfo>();

    /**
    * An event triggered when pointer enters the control
    */
    public onPointerEnterObservable = new Observable<Control>();

    /**
    * An event triggered when the control is marked as dirty
    */
    public onDirtyObservable = new Observable<Control>();

    /**
     * An event triggered before drawing the control
     */
    public onBeforeDrawObservable = new Observable<Control>();

    /**
     * An event triggered after the control was drawn
     */
    public onAfterDrawObservable = new Observable<Control>();

    /**
    * An event triggered when the control has been disposed
    */
   public onDisposeObservable = new Observable<Control>();

    /**
     * Get the hosting AdvancedDynamicTexture
     */
    public get host(): AdvancedDynamicTexture {
        return this._host;
    }

    /** Gets or set information about font offsets (used to render and align text) */
    public get fontOffset(): { ascent: number, height: number, descent: number } {
        return this._fontOffset;
    }

    public set fontOffset(offset: { ascent: number, height: number, descent: number }) {
        this._fontOffset = offset;
    }

    /** Gets or sets alpha value for the control (1 means opaque and 0 means entirely transparent) */
    public get alpha(): number {
        return this._alpha;
    }

    public set alpha(value: number) {
        if (this._alpha === value) {
            return;
        }
        this._alphaSet = true;
        this._alpha = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a boolean indicating that we want to highlight the control (mostly for debugging purpose)
     */
    public get isHighlighted(): boolean {
        return this._isHighlighted;
    }

    public set isHighlighted(value: boolean) {
        if (this._isHighlighted === value) {
            return;
        }

        this._isHighlighted = value;
        this._markAsDirty();
    }

    /** Gets or sets a value indicating the scale factor on X axis (1 by default)
     * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
    */
    public get scaleX(): number {
        return this._scaleX;
    }

    public set scaleX(value: number) {
        if (this._scaleX === value) {
            return;
        }

        this._scaleX = value;
        this._markAsDirty();
        this._markMatrixAsDirty();
    }

    /** Gets or sets a value indicating the scale factor on Y axis (1 by default)
     * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
    */
    public get scaleY(): number {
        return this._scaleY;
    }

    public set scaleY(value: number) {
        if (this._scaleY === value) {
            return;
        }

        this._scaleY = value;
        this._markAsDirty();
        this._markMatrixAsDirty();
    }

    /** Gets or sets the rotation angle (0 by default)
     * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
    */
    public get rotation(): number {
        return this._rotation;
    }

    public set rotation(value: number) {
        if (this._rotation === value) {
            return;
        }

        this._rotation = value;
        this._markAsDirty();
        this._markMatrixAsDirty();
    }

    /** Gets or sets the transformation center on Y axis (0 by default)
     * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
    */
    public get transformCenterY(): number {
        return this._transformCenterY;
    }

    public set transformCenterY(value: number) {
        if (this._transformCenterY === value) {
            return;
        }

        this._transformCenterY = value;
        this._markAsDirty();
        this._markMatrixAsDirty();
    }

    /** Gets or sets the transformation center on X axis (0 by default)
     * @see https://doc.babylonjs.com/how_to/gui#rotation-and-scaling
    */
    public get transformCenterX(): number {
        return this._transformCenterX;
    }

    public set transformCenterX(value: number) {
        if (this._transformCenterX === value) {
            return;
        }

        this._transformCenterX = value;
        this._markAsDirty();
        this._markMatrixAsDirty();
    }

    /**
     * Gets or sets the horizontal alignment
     * @see https://doc.babylonjs.com/how_to/gui#alignments
     */
    public get horizontalAlignment(): number {
        return this._horizontalAlignment;
    }

    public set horizontalAlignment(value: number) {
        if (this._horizontalAlignment === value) {
            return;
        }

        this._horizontalAlignment = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets the vertical alignment
     * @see https://doc.babylonjs.com/how_to/gui#alignments
     */
    public get verticalAlignment(): number {
        return this._verticalAlignment;
    }

    public set verticalAlignment(value: number) {
        if (this._verticalAlignment === value) {
            return;
        }

        this._verticalAlignment = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a fixed ratio for this control.
     * When different from 0, the ratio is used to compute the "second" dimension.
     * The first dimension used in the computation is the last one set (by setting width / widthInPixels or height / heightInPixels), and the
     * second dimension is computed as first dimension * fixedRatio
     */
    public fixedRatio = 0;

    private _fixedRatioMasterIsWidth = true;

    /**
     * Gets or sets control width
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get width(): string | number {
        return this._width.toString(this._host);
    }

    public set width(value: string | number) {
        this._fixedRatioMasterIsWidth = true;

        if (this._width.toString(this._host) === value) {
            return;
        }

        if (this._width.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets the control width in pixel
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get widthInPixels(): number {
        return this._width.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set widthInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this._fixedRatioMasterIsWidth = true;
        this.width = value + "px";
    }

    /**
     * Gets or sets control height
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get height(): string | number {
        return this._height.toString(this._host);
    }

    public set height(value: string | number) {
        this._fixedRatioMasterIsWidth = false;

        if (this._height.toString(this._host) === value) {
            return;
        }

        if (this._height.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets control height in pixel
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get heightInPixels(): number {
        return this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
    }

    public set heightInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this._fixedRatioMasterIsWidth = false;
        this.height = value + "px";
    }

    /** Gets or set font family */
    public get fontFamily(): string {
        if (!this._fontSet) {
            return "";
        }
        return this._fontFamily;
    }

    public set fontFamily(value: string) {
        if (this._fontFamily === value) {
            return;
        }

        this._fontFamily = value;
        this._resetFontCache();
    }

    /** Gets or sets font style */
    public get fontStyle(): string {
        return this._fontStyle;
    }

    public set fontStyle(value: string) {
        if (this._fontStyle === value) {
            return;
        }

        this._fontStyle = value;
        this._resetFontCache();
    }

    /** Gets or sets font weight */
    public get fontWeight(): string {
        return this._fontWeight;
    }

    public set fontWeight(value: string) {
        if (this._fontWeight === value) {
            return;
        }

        this._fontWeight = value;
        this._resetFontCache();
    }

    /**
     * Gets or sets style
     * @see https://doc.babylonjs.com/how_to/gui#styles
     */
    public get style(): Nullable<Style> {
        return this._style;
    }

    public set style(value: Nullable<Style>) {
        if (this._style) {
            this._style.onChangedObservable.remove(this._styleObserver);
            this._styleObserver = null;
        }

        this._style = value;

        if (this._style) {
            this._styleObserver = this._style.onChangedObservable.add(() => {
                this._markAsDirty();
                this._resetFontCache();
            });
        }

        this._markAsDirty();
        this._resetFontCache();
    }

    /** @hidden */
    public get _isFontSizeInPercentage(): boolean {
        return this._fontSize.isPercentage;
    }

    /** Gets or sets font size in pixels */
    public get fontSizeInPixels(): number {
        let fontSizeToUse = this._style ? this._style._fontSize : this._fontSize;

        if (fontSizeToUse.isPixel) {
            return fontSizeToUse.getValue(this._host);
        }

        return fontSizeToUse.getValueInPixel(this._host, this._tempParentMeasure.height || this._cachedParentMeasure.height);
    }

    public set fontSizeInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.fontSize = value + "px";
    }

    /** Gets or sets font size */
    public get fontSize(): string | number {
        return this._fontSize.toString(this._host);
    }

    public set fontSize(value: string | number) {
        if (this._fontSize.toString(this._host) === value) {
            return;
        }

        if (this._fontSize.fromString(value)) {
            this._markAsDirty();
            this._resetFontCache();
        }
    }

    /** Gets or sets foreground color */
    public get color(): string {
        return this._color;
    }

    public set color(value: string) {
        if (this._color === value) {
            return;
        }

        this._color = value;
        this._markAsDirty();
    }

    /** Gets or sets z index which is used to reorder controls on the z axis */
    public get zIndex(): number {
        return this._zIndex;
    }

    public set zIndex(value: number) {
        if (this.zIndex === value) {
            return;
        }

        this._zIndex = value;

        if (this.parent) {
            this.parent._reOrderControl(this);
        }
    }

    /** Gets or sets a boolean indicating if the control can be rendered */
    public get notRenderable(): boolean {
        return this._doNotRender;
    }

    public set notRenderable(value: boolean) {
        if (this._doNotRender === value) {
            return;
        }

        this._doNotRender = value;
        this._markAsDirty();
    }

    /** Gets or sets a boolean indicating if the control is visible */
    public get isVisible(): boolean {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        if (this._isVisible === value) {
            return;
        }

        this._isVisible = value;
        this._markAsDirty(true);
    }

    /** Gets a boolean indicating that the control needs to update its rendering */
    public get isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * Gets the current linked mesh (or null if none)
     */
    public get linkedMesh(): Nullable<AbstractMesh> {
        return this._linkedMesh;
    }

    /**
     * Gets or sets a value indicating the padding to use on the left of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingLeft(): string | number {
        return this._paddingLeft.toString(this._host);
    }

    public set paddingLeft(value: string | number) {
        if (this._paddingLeft.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the padding in pixels to use on the left of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingLeftInPixels(): number {
        return this._paddingLeft.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set paddingLeftInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.paddingLeft = value + "px";
    }

    /**
     * Gets or sets a value indicating the padding to use on the right of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingRight(): string | number {
        return this._paddingRight.toString(this._host);
    }

    public set paddingRight(value: string | number) {
        if (this._paddingRight.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the padding in pixels to use on the right of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingRightInPixels(): number {
        return this._paddingRight.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set paddingRightInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.paddingRight = value + "px";
    }

    /**
     * Gets or sets a value indicating the padding to use on the top of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingTop(): string | number {
        return this._paddingTop.toString(this._host);
    }

    public set paddingTop(value: string | number) {
        if (this._paddingTop.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the padding in pixels to use on the top of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingTopInPixels(): number {
        return this._paddingTop.getValueInPixel(this._host, this._cachedParentMeasure.height);
    }

    public set paddingTopInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.paddingTop = value + "px";
    }

    /**
     * Gets or sets a value indicating the padding to use on the bottom of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingBottom(): string | number {
        return this._paddingBottom.toString(this._host);
    }

    public set paddingBottom(value: string | number) {
        if (this._paddingBottom.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the padding in pixels to use on the bottom of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get paddingBottomInPixels(): number {
        return this._paddingBottom.getValueInPixel(this._host, this._cachedParentMeasure.height);
    }

    public set paddingBottomInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.paddingBottom = value + "px";
    }

    /**
     * Gets or sets a value indicating the left coordinate of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get left(): string | number {
        return this._left.toString(this._host);
    }

    public set left(value: string | number) {
        if (this._left.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the left coordinate in pixels of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get leftInPixels(): number {
        return this._left.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set leftInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.left = value + "px";
    }

    /**
     * Gets or sets a value indicating the top coordinate of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get top(): string | number {
        return this._top.toString(this._host);
    }

    public set top(value: string | number) {
        if (this._top.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the top coordinate in pixels of the control
     * @see https://doc.babylonjs.com/how_to/gui#position-and-size
     */
    public get topInPixels(): number {
        return this._top.getValueInPixel(this._host, this._cachedParentMeasure.height);
    }

    public set topInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.top = value + "px";
    }

    /**
     * Gets or sets a value indicating the offset on X axis to the linked mesh
     * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    public get linkOffsetX(): string | number {
        return this._linkOffsetX.toString(this._host);
    }

    public set linkOffsetX(value: string | number) {
        if (this._linkOffsetX.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the offset in pixels on X axis to the linked mesh
     * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    public get linkOffsetXInPixels(): number {
        return this._linkOffsetX.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set linkOffsetXInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.linkOffsetX = value + "px";
    }

    /**
     * Gets or sets a value indicating the offset on Y axis to the linked mesh
     * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    public get linkOffsetY(): string | number {
        return this._linkOffsetY.toString(this._host);
    }

    public set linkOffsetY(value: string | number) {
        if (this._linkOffsetY.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets a value indicating the offset in pixels on Y axis to the linked mesh
     * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    public get linkOffsetYInPixels(): number {
        return this._linkOffsetY.getValueInPixel(this._host, this._cachedParentMeasure.height);
    }

    public set linkOffsetYInPixels(value: number) {
        if (isNaN(value)) {
            return;
        }
        this.linkOffsetY = value + "px";
    }

    /** Gets the center coordinate on X axis */
    public get centerX(): number {
        return this._currentMeasure.left + this._currentMeasure.width / 2;
    }

    /** Gets the center coordinate on Y axis */
    public get centerY(): number {
        return this._currentMeasure.top + this._currentMeasure.height / 2;
    }

    /** Gets or sets if control is Enabled*/
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;
        this._markAsDirty();
    }
    /** Gets or sets background color of control if it's disabled*/
    public get disabledColor(): string {
        return this._disabledColor;
    }

    public set disabledColor(value: string) {
        if (this._disabledColor === value) {
            return;
        }

        this._disabledColor = value;
        this._markAsDirty();
    }
    /** Gets or sets front color of control if it's disabled*/
    public get disabledColorItem(): string {
        return this._disabledColorItem;
    }

    public set disabledColorItem(value: string) {
        if (this._disabledColorItem === value) {
            return;
        }

        this._disabledColorItem = value;
        this._markAsDirty();
    }
    // Functions

    /**
     * Creates a new control
     * @param name defines the name of the control
     */
    constructor(
        /** defines the name of the control */
        public name?: string) {
    }

    /** @hidden */
    protected _getTypeName(): string {
        return "Control";
    }

    /**
     * Gets the first ascendant in the hierarchy of the given type
     * @param className defines the required type
     * @returns the ascendant or null if not found
     */
    public getAscendantOfClass(className: string): Nullable<Control> {
        if (!this.parent) {
            return null;
        }

        if (this.parent.getClassName() === className) {
            return this.parent;
        }

        return this.parent.getAscendantOfClass(className);
    }

    /** @hidden */
    public _resetFontCache(): void {
        this._fontSet = true;
        this._markAsDirty();
    }

    /**
     * Determines if a container is an ascendant of the current control
     * @param container defines the container to look for
     * @returns true if the container is one of the ascendant of the control
     */
    public isAscendant(container: Control): boolean {
        if (!this.parent) {
            return false;
        }

        if (this.parent === container) {
            return true;
        }

        return this.parent.isAscendant(container);
    }

    /**
     * Gets coordinates in local control space
     * @param globalCoordinates defines the coordinates to transform
     * @returns the new coordinates in local space
     */
    public getLocalCoordinates(globalCoordinates: Vector2): Vector2 {
        var result = Vector2.Zero();

        this.getLocalCoordinatesToRef(globalCoordinates, result);

        return result;
    }

    /**
     * Gets coordinates in local control space
     * @param globalCoordinates defines the coordinates to transform
     * @param result defines the target vector2 where to store the result
     * @returns the current control
     */
    public getLocalCoordinatesToRef(globalCoordinates: Vector2, result: Vector2): Control {
        result.x = globalCoordinates.x - this._currentMeasure.left;
        result.y = globalCoordinates.y - this._currentMeasure.top;
        return this;
    }

    /**
     * Gets coordinates in parent local control space
     * @param globalCoordinates defines the coordinates to transform
     * @returns the new coordinates in parent local space
     */
    public getParentLocalCoordinates(globalCoordinates: Vector2): Vector2 {
        var result = Vector2.Zero();

        result.x = globalCoordinates.x - this._cachedParentMeasure.left;
        result.y = globalCoordinates.y - this._cachedParentMeasure.top;

        return result;
    }

    /**
     * Move the current control to a vector3 position projected onto the screen.
     * @param position defines the target position
     * @param scene defines the hosting scene
     */
    public moveToVector3(position: Vector3, scene: Scene): void {
        if (!this._host || this.parent !== this._host._rootContainer) {
            Tools.Error("Cannot move a control to a vector3 if the control is not at root level");
            return;
        }

        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

        var globalViewport = this._host._getGlobalViewport(scene);
        var projectedPosition = Vector3.Project(position, Matrix.Identity(), scene.getTransformMatrix(), globalViewport);

        this._moveToProjectedPosition(projectedPosition);

        if (projectedPosition.z < 0 || projectedPosition.z > 1) {
            this.notRenderable = true;
            return;
        }
        this.notRenderable = false;
    }

    /**
     * Will store all controls that have this control as ascendant in a given array
     * @param results defines the array where to store the descendants
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     */
    public getDescendantsToRef(results: Control[], directDescendantsOnly: boolean = false, predicate?: (control: Control) => boolean): void {
        // Do nothing by default
    }

    /**
     * Will return all controls that have this control as ascendant
     * @param directDescendantsOnly defines if true only direct descendants of 'this' will be considered, if false direct and also indirect (children of children, an so on in a recursive manner) descendants of 'this' will be considered
     * @param predicate defines an optional predicate that will be called on every evaluated child, the predicate must return true for a given child to be part of the result, otherwise it will be ignored
     * @return all child controls
     */
    public getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[] {
        var results = new Array<Control>();

        this.getDescendantsToRef(results, directDescendantsOnly, predicate);

        return results;
    }

    /**
     * Link current control with a target mesh
     * @param mesh defines the mesh to link with
     * @see https://doc.babylonjs.com/how_to/gui#tracking-positions
     */
    public linkWithMesh(mesh: Nullable<AbstractMesh>): void {
        if (!this._host || this.parent && this.parent !== this._host._rootContainer) {
            if (mesh) {
                Tools.Error("Cannot link a control to a mesh if the control is not at root level");
            }
            return;
        }

        var index = this._host._linkedControls.indexOf(this);
        if (index !== -1) {
            this._linkedMesh = mesh;
            if (!mesh) {
                this._host._linkedControls.splice(index, 1);
            }
            return;
        } else if (!mesh) {
            return;
        }

        this.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
        this.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
        this._linkedMesh = mesh;
        this._host._linkedControls.push(this);
    }

    /** @hidden */
    public _moveToProjectedPosition(projectedPosition: Vector3): void {
        let oldLeft = this._left.getValue(this._host);
        let oldTop = this._top.getValue(this._host);

        var newLeft = ((projectedPosition.x + this._linkOffsetX.getValue(this._host)) - this._currentMeasure.width / 2);
        var newTop = ((projectedPosition.y + this._linkOffsetY.getValue(this._host)) - this._currentMeasure.height / 2);

        if (this._left.ignoreAdaptiveScaling && this._top.ignoreAdaptiveScaling) {
            if (Math.abs(newLeft - oldLeft) < 0.5) {
                newLeft = oldLeft;
            }

            if (Math.abs(newTop - oldTop) < 0.5) {
                newTop = oldTop;
            }
        }

        this.left = newLeft + "px";
        this.top = newTop + "px";

        this._left.ignoreAdaptiveScaling = true;
        this._top.ignoreAdaptiveScaling = true;
        this._markAsDirty();
    }

    /** @hidden */
    public _offsetLeft(offset: number) {
        this._isDirty = true;
        this._currentMeasure.left += offset;
    }

    /** @hidden */
    public _offsetTop(offset: number) {
        this._isDirty = true;
        this._currentMeasure.top += offset;
    }

    /** @hidden */
    public _markMatrixAsDirty(): void {
        this._isMatrixDirty = true;
        this._flagDescendantsAsMatrixDirty();
    }

    /** @hidden */
    public _flagDescendantsAsMatrixDirty(): void {
        // No child
    }

    /** @hidden */
    public _intersectsRect(rect: Measure) {
        // Rotate the control's current measure into local space and check if it intersects the passed in rectangle
        this._currentMeasure.transformToRef(this._transformMatrix, this._tmpMeasureA);
        if (this._tmpMeasureA.left >= rect.left + rect.width) {
            return false;
        }

        if (this._tmpMeasureA.top >= rect.top + rect.height) {
            return false;
        }

        if (this._tmpMeasureA.left + this._tmpMeasureA.width <= rect.left) {
            return false;
        }

        if (this._tmpMeasureA.top + this._tmpMeasureA.height <= rect.top) {
            return false;
        }

        return true;
    }

    /** @hidden */
    protected invalidateRect() {
        this._transform();
        if (this.host && this.host.useInvalidateRectOptimization) {
            // Rotate by transform to get the measure transformed to global space
            this._currentMeasure.transformToRef(this._transformMatrix, this._tmpMeasureA);
            // get the boudning box of the current measure and last frames measure in global space and invalidate it
            // the previous measure is used to properly clear a control that is scaled down
            Measure.CombineToRef(this._tmpMeasureA, this._prevCurrentMeasureTransformedIntoGlobalSpace, this._tmpMeasureA);

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                // Expand rect based on shadows
                var shadowOffsetX = this.shadowOffsetX;
                var shadowOffsetY = this.shadowOffsetY;
                var shadowBlur = this.shadowBlur;

                var leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
                var rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
                var topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
                var bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);

                this.host.invalidateRect(
                    Math.floor(this._tmpMeasureA.left + leftShadowOffset),
                    Math.floor(this._tmpMeasureA.top + topShadowOffset),
                    Math.ceil(this._tmpMeasureA.left + this._tmpMeasureA.width + rightShadowOffset),
                    Math.ceil(this._tmpMeasureA.top + this._tmpMeasureA.height + bottomShadowOffset),
                );
            } else {
                this.host.invalidateRect(
                    Math.floor(this._tmpMeasureA.left),
                    Math.floor(this._tmpMeasureA.top),
                    Math.ceil(this._tmpMeasureA.left + this._tmpMeasureA.width),
                    Math.ceil(this._tmpMeasureA.top + this._tmpMeasureA.height),
                );
            }

        }
    }

    /** @hidden */
    public _markAsDirty(force = false): void {
        if (!this._isVisible && !force) {
            return;
        }

        this._isDirty = true;

        // Redraw only this rectangle
        if (this._host) {
            this._host.markAsDirty();
        }
    }

    /** @hidden */
    public _markAllAsDirty(): void {
        this._markAsDirty();

        if (this._font) {
            this._prepareFont();
        }
    }

    /** @hidden */
    public _link(host: AdvancedDynamicTexture): void {
        this._host = host;
        if (this._host) {
            this.uniqueId = this._host.getScene()!.getUniqueId();
        }
    }

    /** @hidden */
    protected _transform(context?: CanvasRenderingContext2D): void {
        if (!this._isMatrixDirty && this._scaleX === 1 && this._scaleY === 1 && this._rotation === 0) {
            return;
        }

        // postTranslate
        var offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
        var offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
        if (context) {
            context.translate(offsetX, offsetY);

            // rotate
            context.rotate(this._rotation);

            // scale
            context.scale(this._scaleX, this._scaleY);

            // preTranslate
            context.translate(-offsetX, -offsetY);
        }
        // Need to update matrices?
        if (this._isMatrixDirty || this._cachedOffsetX !== offsetX || this._cachedOffsetY !== offsetY) {
            this._cachedOffsetX = offsetX;
            this._cachedOffsetY = offsetY;
            this._isMatrixDirty = false;
            this._flagDescendantsAsMatrixDirty();

            Matrix2D.ComposeToRef(-offsetX, -offsetY, this._rotation, this._scaleX, this._scaleY, this.parent ? this.parent._transformMatrix : null, this._transformMatrix);

            this._transformMatrix.invertToRef(this._invertTransformMatrix);
        }
    }

    /** @hidden */
    public _renderHighlight(context: CanvasRenderingContext2D): void {
        if (!this.isHighlighted) {
            return;
        }

        context.save();
        context.strokeStyle = "#4affff";
        context.lineWidth = 2;

        this._renderHighlightSpecific(context);
        context.restore();
    }

    /** @hidden */
    public _renderHighlightSpecific(context: CanvasRenderingContext2D): void {
        context.strokeRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
    }

    /** @hidden */
    protected _applyStates(context: CanvasRenderingContext2D): void {
        if (this._isFontSizeInPercentage) {
            this._fontSet = true;
        }

        if (this._fontSet) {
            this._prepareFont();
            this._fontSet = false;
        }

        if (this._font) {
            context.font = this._font;
        }

        if (this._color) {
            context.fillStyle = this._color;
        }

        if (Control.AllowAlphaInheritance) {
            context.globalAlpha *= this._alpha;
        } else if (this._alphaSet) {
            context.globalAlpha = this.parent ? this.parent.alpha * this._alpha : this._alpha;
        }
    }

    /** @hidden */
    public _layout(parentMeasure: Measure, context: CanvasRenderingContext2D): boolean {
        if (!this.isDirty && (!this.isVisible || this.notRenderable)) {
            return false;
        }

        if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
            this.host._numLayoutCalls++;

            this._currentMeasure.addAndTransformToRef(this._transformMatrix, 
                -this.paddingLeftInPixels | 0,
                -this.paddingTopInPixels | 0,
                this.paddingRightInPixels | 0,
                this.paddingBottomInPixels | 0,
                this._prevCurrentMeasureTransformedIntoGlobalSpace);

            context.save();

            this._applyStates(context);

            let rebuildCount = 0;
            do {
                this._rebuildLayout = false;
                this._processMeasures(parentMeasure, context);
                rebuildCount++;
            }
            while (this._rebuildLayout && rebuildCount < 3);

            if (rebuildCount >= 3) {
                Logger.Error(`Layout cycle detected in GUI (Control name=${this.name}, uniqueId=${this.uniqueId})`);
            }

            context.restore();
            this.invalidateRect();
            this._evaluateClippingState(parentMeasure);
        }

        this._wasDirty = this._isDirty;
        this._isDirty = false;

        return true;
    }

    /** @hidden */
    protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        this._currentMeasure.copyFrom(parentMeasure);

        // Let children take some pre-measurement actions
        this._preMeasure(parentMeasure, context);

        this._measure();
        this._computeAlignment(parentMeasure, context);

        // Convert to int values
        this._currentMeasure.left = this._currentMeasure.left | 0;
        this._currentMeasure.top = this._currentMeasure.top | 0;
        this._currentMeasure.width = this._currentMeasure.width | 0;
        this._currentMeasure.height = this._currentMeasure.height | 0;

        // Let children add more features
        this._additionalProcessing(parentMeasure, context);

        this._cachedParentMeasure.copyFrom(parentMeasure);

        if (this.onDirtyObservable.hasObservers()) {
            this.onDirtyObservable.notifyObservers(this);
        }
    }

    protected _evaluateClippingState(parentMeasure: Measure) {
        if (this.parent && this.parent.clipChildren) {
            // Early clip
            if (this._currentMeasure.left > parentMeasure.left + parentMeasure.width) {
                this._isClipped = true;
                return;
            }

            if (this._currentMeasure.left + this._currentMeasure.width < parentMeasure.left) {
                this._isClipped = true;
                return;
            }

            if (this._currentMeasure.top > parentMeasure.top + parentMeasure.height) {
                this._isClipped = true;
                return;
            }

            if (this._currentMeasure.top + this._currentMeasure.height < parentMeasure.top) {
                this._isClipped = true;
                return;
            }
        }

        this._isClipped = false;
    }

    /** @hidden */
    public _measure(): void {
        // Width / Height
        if (this._width.isPixel) {
            this._currentMeasure.width = this._width.getValue(this._host);
        } else {
            this._currentMeasure.width *= this._width.getValue(this._host);
        }

        if (this._height.isPixel) {
            this._currentMeasure.height = this._height.getValue(this._host);
        } else {
            this._currentMeasure.height *= this._height.getValue(this._host);
        }

        if (this.fixedRatio !== 0) {
            if (this._fixedRatioMasterIsWidth) {
                this._currentMeasure.height = this._currentMeasure.width * this.fixedRatio;
            } else {
                this._currentMeasure.width = this._currentMeasure.height * this.fixedRatio;
            }
        }
    }

    /** @hidden */
    protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        var width = this._currentMeasure.width;
        var height = this._currentMeasure.height;

        var parentWidth = parentMeasure.width;
        var parentHeight = parentMeasure.height;

        // Left / top
        var x = 0;
        var y = 0;

        switch (this.horizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = 0;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = parentWidth - width;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x = (parentWidth - width) / 2;
                break;
        }

        switch (this.verticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                y = 0;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                y = parentHeight - height;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                y = (parentHeight - height) / 2;
                break;
        }

        if (this._paddingLeft.isPixel) {
            this._currentMeasure.left += this._paddingLeft.getValue(this._host);
            this._currentMeasure.width -= this._paddingLeft.getValue(this._host);
        } else {
            this._currentMeasure.left += parentWidth * this._paddingLeft.getValue(this._host);
            this._currentMeasure.width -= parentWidth * this._paddingLeft.getValue(this._host);
        }

        if (this._paddingRight.isPixel) {
            this._currentMeasure.width -= this._paddingRight.getValue(this._host);
        } else {
            this._currentMeasure.width -= parentWidth * this._paddingRight.getValue(this._host);
        }

        if (this._paddingTop.isPixel) {
            this._currentMeasure.top += this._paddingTop.getValue(this._host);
            this._currentMeasure.height -= this._paddingTop.getValue(this._host);
        } else {
            this._currentMeasure.top += parentHeight * this._paddingTop.getValue(this._host);
            this._currentMeasure.height -= parentHeight * this._paddingTop.getValue(this._host);
        }

        if (this._paddingBottom.isPixel) {
            this._currentMeasure.height -= this._paddingBottom.getValue(this._host);
        } else {
            this._currentMeasure.height -= parentHeight * this._paddingBottom.getValue(this._host);
        }

        if (this._left.isPixel) {
            this._currentMeasure.left += this._left.getValue(this._host);
        } else {
            this._currentMeasure.left += parentWidth * this._left.getValue(this._host);
        }

        if (this._top.isPixel) {
            this._currentMeasure.top += this._top.getValue(this._host);
        } else {
            this._currentMeasure.top += parentHeight * this._top.getValue(this._host);
        }

        this._currentMeasure.left += x;
        this._currentMeasure.top += y;
    }

    /** @hidden */
    protected _preMeasure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        // Do nothing
    }

    /** @hidden */
    protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        // Do nothing
    }

    /** @hidden */
    protected _clipForChildren(context: CanvasRenderingContext2D): void {
        // DO nothing
    }

    private static _ClipMeasure = new Measure(0, 0, 0, 0);
    private _tmpMeasureA = new Measure(0, 0, 0, 0);
    private _clip(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>) {
        context.beginPath();
        Control._ClipMeasure.copyFrom(this._currentMeasure);
        if (invalidatedRectangle) {
            // Rotate the invalidated rect into the control's space
            invalidatedRectangle.transformToRef(this._invertTransformMatrix, this._tmpMeasureA);

            // Get the intersection of the rect in context space and the current context
            var intersection = new Measure(0, 0, 0, 0);
            intersection.left = Math.max(this._tmpMeasureA.left, this._currentMeasure.left);
            intersection.top = Math.max(this._tmpMeasureA.top, this._currentMeasure.top);
            intersection.width = Math.min(this._tmpMeasureA.left + this._tmpMeasureA.width, this._currentMeasure.left + this._currentMeasure.width) - intersection.left;
            intersection.height = Math.min(this._tmpMeasureA.top + this._tmpMeasureA.height, this._currentMeasure.top + this._currentMeasure.height) - intersection.top;
            Control._ClipMeasure.copyFrom(intersection);
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            var shadowOffsetX = this.shadowOffsetX;
            var shadowOffsetY = this.shadowOffsetY;
            var shadowBlur = this.shadowBlur;

            var leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
            var rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
            var topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
            var bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);

            context.rect(
                Control._ClipMeasure.left + leftShadowOffset,
                Control._ClipMeasure.top + topShadowOffset,
                Control._ClipMeasure.width + rightShadowOffset - leftShadowOffset,
                Control._ClipMeasure.height + bottomShadowOffset - topShadowOffset
            );
        } else {
            context.rect(Control._ClipMeasure.left, Control._ClipMeasure.top, Control._ClipMeasure.width, Control._ClipMeasure.height);
        }

        context.clip();
    }

    /** @hidden */
    public _render(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): boolean {
        if (!this.isVisible || this.notRenderable || this._isClipped) {
            this._isDirty = false;
            return false;
        }

        this.host._numRenderCalls++;

        context.save();

        this._applyStates(context);

        // Transform
        this._transform(context);

        // Clip
        if (this.clipContent) {
            this._clip(context, invalidatedRectangle);
        }

        if (this.onBeforeDrawObservable.hasObservers()) {
            this.onBeforeDrawObservable.notifyObservers(this);
        }

        if (this.useBitmapCache && !this._wasDirty && this._cacheData) {
            context.putImageData(this._cacheData, this._currentMeasure.left, this._currentMeasure.top);
        } else {
            this._draw(context, invalidatedRectangle);
        }

        if (this.useBitmapCache && this._wasDirty) {
            this._cacheData = context.getImageData(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        }

        this._renderHighlight(context);

        if (this.onAfterDrawObservable.hasObservers()) {
            this.onAfterDrawObservable.notifyObservers(this);
        }

        context.restore();

        return true;
    }

    /** @hidden */
    public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void {
        // Do nothing
    }

    /**
     * Tests if a given coordinates belong to the current control
     * @param x defines x coordinate to test
     * @param y defines y coordinate to test
     * @returns true if the coordinates are inside the control
     */
    public contains(x: number, y: number): boolean {
        // Invert transform
        this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);

        x = this._transformedPosition.x;
        y = this._transformedPosition.y;

        // Check
        if (x < this._currentMeasure.left) {
            return false;
        }

        if (x > this._currentMeasure.left + this._currentMeasure.width) {
            return false;
        }

        if (y < this._currentMeasure.top) {
            return false;
        }

        if (y > this._currentMeasure.top + this._currentMeasure.height) {
            return false;
        }

        if (this.isPointerBlocker) {
            this._host._shouldBlockPointer = true;
        }
        return true;
    }

    /** @hidden */
    public _processPicking(x: number, y: number, type: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): boolean {
        if (!this._isEnabled) {
            return false;
        }
        if (!this.isHitTestVisible || !this.isVisible || this._doNotRender) {
            return false;
        }

        if (!this.contains(x, y)) {
            return false;
        }

        this._processObservables(type, x, y, pointerId, buttonIndex, deltaX, deltaY);

        return true;
    }

    /** @hidden */
    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void {
        var canNotify: boolean = this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this);

        if (canNotify && this.parent != null) { this.parent._onPointerMove(target, coordinates, pointerId); }
    }

    /** @hidden */
    public _onPointerEnter(target: Control): boolean {
        if (!this._isEnabled) {
            return false;
        }
        if (this._enterCount > 0) {
            return false;
        }

        if (this._enterCount === -1) { // -1 is for touch input, we are now sure we are with a mouse or pencil
            this._enterCount = 0;
        }
        this._enterCount++;

        var canNotify: boolean = this.onPointerEnterObservable.notifyObservers(this, -1, target, this);

        if (canNotify && this.parent != null) { this.parent._onPointerEnter(target); }

        return true;
    }

    /** @hidden */
    public _onPointerOut(target: Control, force = false): void {
        if (!force && (!this._isEnabled || target === this)) {
            return;
        }
        this._enterCount = 0;

        var canNotify: boolean = true;

        if (!target.isAscendant(this)) {
            canNotify = this.onPointerOutObservable.notifyObservers(this, -1, target, this);
        }

        if (canNotify && this.parent != null) {
            this.parent._onPointerOut(target, force);
        }
    }

    /** @hidden */
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        // Prevent pointerout to lose control context.
        // Event redundancy is checked inside the function.
        this._onPointerEnter(this);

        if (this._downCount !== 0) {
            return false;
        }

        this._downCount++;

        this._downPointerIds[pointerId] = true;

        var canNotify: boolean = this.onPointerDownObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this);

        if (canNotify && this.parent != null) { this.parent._onPointerDown(target, coordinates, pointerId, buttonIndex); }

        return true;
    }

    /** @hidden */
    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        if (!this._isEnabled) {
            return;
        }
        this._downCount = 0;

        delete this._downPointerIds[pointerId];

        var canNotifyClick: boolean = notifyClick;
        if (notifyClick && (this._enterCount > 0 || this._enterCount === -1)) {
            canNotifyClick = this.onPointerClickObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this);
        }
        var canNotify: boolean = this.onPointerUpObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this);

        if (canNotify && this.parent != null) { this.parent._onPointerUp(target, coordinates, pointerId, buttonIndex, canNotifyClick); }
    }

    /** @hidden */
    public _forcePointerUp(pointerId: Nullable<number> = null) {
        if (pointerId !== null) {
            this._onPointerUp(this, Vector2.Zero(), pointerId, 0, true);
        } else {
            for (var key in this._downPointerIds) {
                this._onPointerUp(this, Vector2.Zero(), +key as number, 0, true);
            }
        }
    }

    /** @hidden */
    public _onWheelScroll(deltaX?: number, deltaY?: number): void {
        if (!this._isEnabled) {
            return;
        }
        var canNotify: boolean = this.onWheelObservable.notifyObservers(new Vector2(deltaX, deltaY));

        if (canNotify && this.parent != null) { this.parent._onWheelScroll(deltaX, deltaY); }
    }

    /** @hidden */
    public _onCanvasBlur(): void {}

    /** @hidden */
    public _processObservables(type: number, x: number, y: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): boolean {
        if (!this._isEnabled) {
            return false;
        }
        this._dummyVector2.copyFromFloats(x, y);
        if (type === PointerEventTypes.POINTERMOVE) {
            this._onPointerMove(this, this._dummyVector2, pointerId);

            var previousControlOver = this._host._lastControlOver[pointerId];
            if (previousControlOver && previousControlOver !== this) {
                previousControlOver._onPointerOut(this);
            }

            if (previousControlOver !== this) {
                this._onPointerEnter(this);
            }

            this._host._lastControlOver[pointerId] = this;
            return true;
        }

        if (type === PointerEventTypes.POINTERDOWN) {
            this._onPointerDown(this, this._dummyVector2, pointerId, buttonIndex);
            this._host._registerLastControlDown(this, pointerId);
            this._host._lastPickedControl = this;
            return true;
        }

        if (type === PointerEventTypes.POINTERUP) {
            if (this._host._lastControlDown[pointerId]) {
                this._host._lastControlDown[pointerId]._onPointerUp(this, this._dummyVector2, pointerId, buttonIndex, true);
            }
            delete this._host._lastControlDown[pointerId];
            return true;
        }

        if (type === PointerEventTypes.POINTERWHEEL) {
            if (this._host._lastControlOver[pointerId]) {
                this._host._lastControlOver[pointerId]._onWheelScroll(deltaX, deltaY);
                return true;
            }
        }

        return false;
    }

    private _prepareFont() {
        if (!this._font && !this._fontSet) {
            return;
        }

        if (this._style) {
            this._font = this._style.fontStyle + " " + this._style.fontWeight + " " + this.fontSizeInPixels + "px " + this._style.fontFamily;
        } else {
            this._font = this._fontStyle + " " + this._fontWeight + " " + this.fontSizeInPixels + "px " + this._fontFamily;
        }

        this._fontOffset = Control._GetFontOffset(this._font);
    }

    /** Releases associated resources */
    public dispose() {
        this.onDirtyObservable.clear();
        this.onBeforeDrawObservable.clear();
        this.onAfterDrawObservable.clear();
        this.onPointerDownObservable.clear();
        this.onPointerEnterObservable.clear();
        this.onPointerMoveObservable.clear();
        this.onPointerOutObservable.clear();
        this.onPointerUpObservable.clear();
        this.onPointerClickObservable.clear();
        this.onWheelObservable.clear();

        if (this._styleObserver && this._style) {
            this._style.onChangedObservable.remove(this._styleObserver);
            this._styleObserver = null;
        }

        if (this.parent) {
            this.parent.removeControl(this);
            this.parent = null;
        }

        if (this._host) {
            var index = this._host._linkedControls.indexOf(this);
            if (index > -1) {
                this.linkWithMesh(null);
            }
        }

        // Callback
        this.onDisposeObservable.notifyObservers(this);
        this.onDisposeObservable.clear();
    }

    // Statics
    private static _HORIZONTAL_ALIGNMENT_LEFT = 0;
    private static _HORIZONTAL_ALIGNMENT_RIGHT = 1;
    private static _HORIZONTAL_ALIGNMENT_CENTER = 2;

    private static _VERTICAL_ALIGNMENT_TOP = 0;
    private static _VERTICAL_ALIGNMENT_BOTTOM = 1;
    private static _VERTICAL_ALIGNMENT_CENTER = 2;

    /** HORIZONTAL_ALIGNMENT_LEFT */
    public static get HORIZONTAL_ALIGNMENT_LEFT(): number {
        return Control._HORIZONTAL_ALIGNMENT_LEFT;
    }

    /** HORIZONTAL_ALIGNMENT_RIGHT */
    public static get HORIZONTAL_ALIGNMENT_RIGHT(): number {
        return Control._HORIZONTAL_ALIGNMENT_RIGHT;
    }

    /** HORIZONTAL_ALIGNMENT_CENTER */
    public static get HORIZONTAL_ALIGNMENT_CENTER(): number {
        return Control._HORIZONTAL_ALIGNMENT_CENTER;
    }

    /** VERTICAL_ALIGNMENT_TOP */
    public static get VERTICAL_ALIGNMENT_TOP(): number {
        return Control._VERTICAL_ALIGNMENT_TOP;
    }

    /** VERTICAL_ALIGNMENT_BOTTOM */
    public static get VERTICAL_ALIGNMENT_BOTTOM(): number {
        return Control._VERTICAL_ALIGNMENT_BOTTOM;
    }

    /** VERTICAL_ALIGNMENT_CENTER */
    public static get VERTICAL_ALIGNMENT_CENTER(): number {
        return Control._VERTICAL_ALIGNMENT_CENTER;
    }

    private static _FontHeightSizes: { [key: string]: { ascent: number, height: number, descent: number } } = {};

    /** @hidden */
    public static _GetFontOffset(font: string): { ascent: number, height: number, descent: number } {

        if (Control._FontHeightSizes[font]) {
            return Control._FontHeightSizes[font];
        }

        var text = document.createElement("span");
        text.innerHTML = "Hg";
        text.style.font = font;

        var block = document.createElement("div");
        block.style.display = "inline-block";
        block.style.width = "1px";
        block.style.height = "0px";
        block.style.verticalAlign = "bottom";

        var div = document.createElement("div");
        div.appendChild(text);
        div.appendChild(block);

        document.body.appendChild(div);

        var fontAscent = 0;
        var fontHeight = 0;
        try {
            fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
            block.style.verticalAlign = "baseline";
            fontAscent = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
        } finally {
            document.body.removeChild(div);
        }
        var result = { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
        Control._FontHeightSizes[font] = result;

        return result;
    }

    /**
     * Creates a stack panel that can be used to render headers
     * @param control defines the control to associate with the header
     * @param text defines the text of the header
     * @param size defines the size of the header
     * @param options defines options used to configure the header
     * @returns a new StackPanel
     * @ignore
     * @hidden
     */
    public static AddHeader: (control: Control, text: string, size: string | number, options: { isHorizontal: boolean, controlFirst: boolean }) => any = () => { };

    /** @hidden */
    protected static drawEllipse(x: number, y: number, width: number, height: number, context: CanvasRenderingContext2D): void {
        context.translate(x, y);
        context.scale(width, height);

        context.beginPath();
        context.arc(0, 0, 1, 0, 2 * Math.PI);
        context.closePath();

        context.scale(1 / width, 1 / height);
        context.translate(-x, -y);
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.Control"] = Control;