/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { Vector2, Vector3, Matrix } from "core/Maths/math.vector";
import type { PointerInfoBase } from "core/Events/pointerEvents";
import { PointerEventTypes } from "core/Events/pointerEvents";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Scene } from "core/scene";

import type { Container } from "./container";
import type { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import { ValueAndUnit } from "../valueAndUnit";
import { Measure } from "../measure";
import type { Style } from "../style";
import { Matrix2D, Vector2WithInfo } from "../math2D";
import { GetClass, RegisterClass } from "core/Misc/typeStore";
import { SerializationHelper, serialize } from "core/Misc/decorators";
import type { ICanvasGradient, ICanvasRenderingContext } from "core/Engines/ICanvas";
import { EngineStore } from "core/Engines/engineStore";
import type { IAccessibilityTag } from "core/IAccessibilityTag";
import type { IPointerEvent } from "core/Events/deviceInputEvents";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { Animation } from "core/Animations/animation";
import type { BaseGradient } from "./gradient/BaseGradient";

/**
 * Root class used for all 2D controls
 * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#controls
 */
export class Control implements IAnimatable {
    /**
     * Gets or sets a boolean indicating if alpha must be an inherited value (false by default)
     */
    public static AllowAlphaInheritance = false;

    private _alpha = 1;
    private _alphaSet = false;
    private _zIndex = 0;
    /** @internal */
    public _host: AdvancedDynamicTexture;
    /** Gets or sets the control parent */
    public parent: Nullable<Container>;
    /** @internal */
    public _currentMeasure = Measure.Empty();
    /** @internal */
    public _tempPaddingMeasure = Measure.Empty();
    private _fontFamily = "";
    private _fontStyle = "";
    private _fontWeight = "";
    private _fontSize = new ValueAndUnit(18, ValueAndUnit.UNITMODE_PIXEL, false);
    private _font: string;
    /** @internal */
    public _width = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
    /** @internal */
    public _height = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
    /** @internal */
    protected _fontOffset: { ascent: number; height: number; descent: number };
    private _color = "";
    private _style: Nullable<Style> = null;
    private _styleObserver: Nullable<Observer<Style>>;
    /** @internal */
    protected _horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    /** @internal */
    protected _verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    /** @internal */
    protected _isDirty = true;
    /** @internal */
    protected _wasDirty = false;
    /** @internal */
    public _tempParentMeasure = Measure.Empty();
    /** @internal */
    public _prevCurrentMeasureTransformedIntoGlobalSpace = Measure.Empty();
    /** @internal */
    public _cachedParentMeasure = Measure.Empty();
    private _descendantsOnlyPadding = false;
    private _paddingLeft = new ValueAndUnit(0);
    private _paddingRight = new ValueAndUnit(0);
    private _paddingTop = new ValueAndUnit(0);
    private _paddingBottom = new ValueAndUnit(0);
    /** @internal */
    public _left = new ValueAndUnit(0);
    /** @internal */
    public _top = new ValueAndUnit(0);
    private _scaleX = 1.0;
    private _scaleY = 1.0;
    private _rotation = 0;
    private _transformCenterX = 0.5;
    private _transformCenterY = 0.5;
    /** @internal */
    public _transformMatrix = Matrix2D.Identity();
    /** @internal */
    protected _invertTransformMatrix = Matrix2D.Identity();
    /** @internal */
    protected _transformedPosition = Vector2.Zero();
    private _isMatrixDirty = true;
    private _cachedOffsetX: number;
    private _cachedOffsetY: number;
    private _isVisible = true;
    private _isHighlighted = false;
    private _highlightColor = "#4affff";
    protected _highlightLineWidth = 2;
    /** @internal */
    public _linkedMesh: Nullable<TransformNode>;
    private _fontSet = false;
    private _dummyVector2 = Vector2.Zero();
    private _downCount = 0;
    private _enterCount = -1;
    private _doNotRender = false;
    private _downPointerIds: { [id: number]: boolean } = {};
    private _evaluatedMeasure = new Measure(0, 0, 0, 0);
    private _evaluatedParentMeasure = new Measure(0, 0, 0, 0);
    protected _isEnabled = true;
    protected _disabledColor = "#9a9a9a";
    protected _disabledColorItem = "#6a6a6a";
    protected _isReadOnly = false;
    private _gradient: Nullable<BaseGradient> = null;
    /** @internal */
    protected _rebuildLayout = false;

    /**
     * Observable that fires when the control's enabled state changes
     */
    public onEnabledStateChangedObservable = new Observable<boolean>();

    /** @internal */
    public _customData: any = {};

    /** @internal */
    public _isClipped = false;

    /** @internal */
    public _automaticSize = false;

    /** @internal */
    public _tag: any;

    /**
     * Gets or sets the unique id of the node. Please note that this number will be updated when the control is added to a container
     */
    public uniqueId: number;

    /**
     * Gets or sets a boolean indicating if the control is readonly (default: false).
     * A readonly control will still raise pointer events but will not react to them
     */
    public get isReadOnly() {
        return this._isReadOnly;
    }

    public set isReadOnly(value: boolean) {
        this._isReadOnly = value;
    }

    /**
     * Gets the transformed measure, that is the bounding box of the control after applying all transformations
     */
    public get transformedMeasure(): Measure {
        return this._evaluatedMeasure;
    }

    /**
     * Gets or sets an object used to store user defined information for the node
     */
    @serialize()
    public metadata: any = null;

    /** Gets or sets a boolean indicating if the control can be hit with pointer events */
    @serialize()
    public isHitTestVisible = true;
    /** Gets or sets a boolean indicating if the control can block pointer events. False by default except on the following controls:
     * * Button controls (Button, RadioButton, ToggleButton)
     * * Checkbox
     * * ColorPicker
     * * InputText
     * * Slider
     */
    @serialize()
    public isPointerBlocker = false;
    /** Gets or sets a boolean indicating if the control can be focusable */
    @serialize()
    public isFocusInvisible = false;

    protected _clipChildren = true;
    /**
     * Sets/Gets a boolean indicating if the children are clipped to the current control bounds.
     * Please note that not clipping children may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
     */
    public set clipChildren(value: boolean) {
        this._clipChildren = value;
    }

    @serialize()
    public get clipChildren() {
        return this._clipChildren;
    }

    protected _clipContent = true;
    /**
     * Sets/Gets a boolean indicating that control content must be clipped
     * Please note that not clipping content may generate issues with adt.useInvalidateRectOptimization so it is recommended to turn this optimization off if you want to use unclipped children
     */
    public set clipContent(value: boolean) {
        this._clipContent = value;
    }

    @serialize()
    public get clipContent() {
        return this._clipContent;
    }

    /**
     * Gets or sets a boolean indicating that the current control should cache its rendering (useful when the control does not change often)
     */
    @serialize()
    public useBitmapCache = false;

    private _cacheData: Nullable<ImageData>;

    private _shadowOffsetX = 0;
    /** Gets or sets a value indicating the offset to apply on X axis to render the shadow */
    @serialize()
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
    @serialize()
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
    private _previousShadowBlur = 0;
    /** Gets or sets a value indicating the amount of blur to use to render the shadow */
    @serialize()
    public get shadowBlur() {
        return this._shadowBlur;
    }

    public set shadowBlur(value: number) {
        if (this._shadowBlur === value) {
            return;
        }

        this._previousShadowBlur = this._shadowBlur;

        this._shadowBlur = value;
        this._markAsDirty();
    }

    private _shadowColor = "black";
    /** Gets or sets a value indicating the color of the shadow (black by default ie. "#000") */
    @serialize()
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
    @serialize()
    public hoverCursor = "";

    /** @internal */
    protected _linkOffsetX = new ValueAndUnit(0);
    /** @internal */
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
     * Gets or sets the accessibility tag to describe the control for accessibility purpose.
     * By default, GUI controls already indicate accessibility info, but one can override the info using this tag.
     */
    public set accessibilityTag(value: Nullable<IAccessibilityTag>) {
        this._accessibilityTag = value;
        this.onAccessibilityTagChangedObservable.notifyObservers(value);
    }

    public get accessibilityTag() {
        return this._accessibilityTag;
    }

    protected _accessibilityTag: Nullable<IAccessibilityTag> = null;

    /**
     * Observable that fires whenever the accessibility event of the control has changed
     */
    public onAccessibilityTagChangedObservable = new Observable<Nullable<IAccessibilityTag>>();

    /**
     * An event triggered when pointer wheel is scrolled
     */
    public onWheelObservable = new Observable<Vector2>();
    /**
     * An event triggered when the pointer moves over the control.
     */
    public onPointerMoveObservable = new Observable<Vector2>();

    /**
     * An event triggered when the pointer moves out of the control.
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
     * An event triggered when the control isVisible is changed
     */
    public onIsVisibleChangedObservable = new Observable<boolean>();

    /**
     * Get the hosting AdvancedDynamicTexture
     */
    public get host(): AdvancedDynamicTexture {
        return this._host;
    }

    /** Gets or set information about font offsets (used to render and align text) */
    @serialize()
    public get fontOffset(): { ascent: number; height: number; descent: number } {
        return this._fontOffset;
    }

    public set fontOffset(offset: { ascent: number; height: number; descent: number }) {
        this._fontOffset = offset;
    }

    /** Gets or sets alpha value for the control (1 means opaque and 0 means entirely transparent) */
    @serialize()
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
     * Gets or sets a number indicating size of stroke we want to highlight the control with (mostly for debugging purpose)
     */
    public get highlightLineWidth(): number {
        return this._highlightLineWidth;
    }

    public set highlightLineWidth(value: number) {
        if (this._highlightLineWidth === value) {
            return;
        }

        this._highlightLineWidth = value;
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

    /**
     * Indicates if the control should be serialized. Defaults to true.
     */
    @serialize()
    public isSerializable: boolean = true;

    /**
     * Gets or sets a string defining the color to use for highlighting this control
     */
    public get highlightColor(): string {
        return this._highlightColor;
    }

    public set highlightColor(value: string) {
        if (this._highlightColor === value) {
            return;
        }

        this._highlightColor = value;
        this._markAsDirty();
    }

    /** Gets or sets a value indicating the scale factor on X axis (1 by default)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#rotation-and-scaling
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#rotation-and-scaling
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#rotation-and-scaling
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#rotation-and-scaling
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#rotation-and-scaling
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#alignments
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#alignments
     */
    @serialize()
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

    private _fixedRatio = 0;
    public set fixedRatio(value: number) {
        if (this._fixedRatio === value) {
            return;
        }

        this._fixedRatio = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a fixed ratio for this control.
     * When different from 0, the ratio is used to compute the "second" dimension.
     * The first dimension used in the computation is the last one set (by setting width / widthInPixels or height / heightInPixels), and the
     * second dimension is computed as first dimension * fixedRatio
     */
    @serialize()
    public get fixedRatio(): number {
        return this._fixedRatio;
    }

    private _fixedRatioMasterIsWidth = true;
    set fixedRatioMasterIsWidth(value: boolean) {
        if (this._fixedRatioMasterIsWidth === value) {
            return;
        }
        this._fixedRatioMasterIsWidth = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a boolean indicating that the fixed ratio is set on the width instead of the height. True by default.
     * When the height of a control is set, this property is changed to false.
     */
    @serialize()
    get fixedRatioMasterIsWidth(): boolean {
        return this._fixedRatioMasterIsWidth;
    }

    /**
     * Gets or sets control width
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#styles
     */
    @serialize()
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

    /** @internal */
    public get _isFontSizeInPercentage(): boolean {
        return this._fontSize.isPercentage;
    }

    /** Gets or sets font size in pixels */
    public get fontSizeInPixels(): number {
        const fontSizeToUse = this._style ? this._style._fontSize : this._fontSize;

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
    @serialize()
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

    /** Gets or sets gradient. Setting a gradient will override the color */
    @serialize()
    public get gradient(): Nullable<BaseGradient> {
        return this._gradient;
    }

    public set gradient(value: Nullable<BaseGradient>) {
        if (this._gradient === value) {
            return;
        }

        this._gradient = value;
        this._markAsDirty();
    }

    /** Gets or sets z index which is used to reorder controls on the z axis */
    @serialize()
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
    @serialize()
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
    @serialize()
    public get isVisible(): boolean {
        return this._isVisible;
    }

    public set isVisible(value: boolean) {
        if (this._isVisible === value) {
            return;
        }

        this._isVisible = value;
        this._markAsDirty(true);

        this.onIsVisibleChangedObservable.notifyObservers(value);
    }

    /** Gets a boolean indicating that the control needs to update its rendering */
    public get isDirty(): boolean {
        return this._isDirty;
    }

    /**
     * Gets the current linked mesh (or null if none)
     */
    public get linkedMesh(): Nullable<TransformNode> {
        return this._linkedMesh;
    }

    /**
     * Gets or sets a value indicating the padding should work like in CSS.
     * Basically, it will add the padding amount on each side of the parent control for its children.
     */
    @serialize()
    public get descendantsOnlyPadding(): boolean {
        return this._descendantsOnlyPadding;
    }

    public set descendantsOnlyPadding(value: boolean) {
        if (this._descendantsOnlyPadding === value) {
            return;
        }

        this._descendantsOnlyPadding = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a value indicating the padding to use on the left of the control
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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

    /** @internal */
    public get _paddingLeftInPixels(): number {
        if (this._descendantsOnlyPadding) {
            return 0;
        }

        return this.paddingLeftInPixels;
    }

    /**
     * Gets or sets a value indicating the padding to use on the right of the control
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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

    /** @internal */
    public get _paddingRightInPixels(): number {
        if (this._descendantsOnlyPadding) {
            return 0;
        }

        return this.paddingRightInPixels;
    }

    /**
     * Gets or sets a value indicating the padding to use on the top of the control
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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

    /** @internal */
    public get _paddingTopInPixels(): number {
        if (this._descendantsOnlyPadding) {
            return 0;
        }

        return this.paddingTopInPixels;
    }

    /**
     * Gets or sets a value indicating the padding to use on the bottom of the control
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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

    /** @internal */
    public get _paddingBottomInPixels(): number {
        if (this._descendantsOnlyPadding) {
            return 0;
        }

        return this.paddingBottomInPixels;
    }

    /**
     * Gets or sets a value indicating the left coordinate of the control
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#tracking-positions
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#tracking-positions
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#tracking-positions
     */
    @serialize()
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#tracking-positions
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

    /** Gets or sets if control is Enabled */
    @serialize()
    public get isEnabled(): boolean {
        return this._isEnabled;
    }

    public set isEnabled(value: boolean) {
        if (this._isEnabled === value) {
            return;
        }

        this._isEnabled = value;
        this._markAsDirty();
        // if this control or any of it's descendants are under a pointer, we need to fire a pointerOut event
        const recursivelyFirePointerOut = (control: Control) => {
            if (!control.host) {
                return;
            }
            for (const pointer in control.host._lastControlOver) {
                if (control === this.host._lastControlOver[pointer]) {
                    control._onPointerOut(control, null, true);
                    delete control.host._lastControlOver[pointer];
                }
            }
            if ((control as Container).children !== undefined) {
                (control as Container).children.forEach(recursivelyFirePointerOut);
            }
        };
        recursivelyFirePointerOut(this);
        this.onEnabledStateChangedObservable.notifyObservers(value);
    }
    /** Gets or sets background color of control if it's disabled. Only applies to Button class. */
    @serialize()
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
    /** Gets or sets front color of control if it's disabled. Only applies to Checkbox class. */
    @serialize()
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

    /**
     * Gets/sets the overlap group of the control.
     * Controls with overlapGroup set to a number can be deoverlapped.
     * Controls with overlapGroup set to undefined are not deoverlapped.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#deoverlapping
     */
    @serialize()
    public overlapGroup?: number;
    /**
     * Gets/sets the deoverlap movement multiplier
     */
    @serialize()
    public overlapDeltaMultiplier?: number;

    /**
     * Array of animations
     */
    animations: Nullable<Animation[]> = null;

    // Functions

    /**
     * Creates a new control
     * @param name defines the name of the control
     */
    constructor(
        /** defines the name of the control */
        public name?: string
    ) {}

    /** @internal */
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

    /**
     * Mark control element as dirty
     * @param force force non visible elements to be marked too
     */
    public markAsDirty(force = false): void {
        this._markAsDirty(force);
    }

    /**
     * Mark the element and its children as dirty
     */
    public markAllAsDirty(): void {
        this._markAllAsDirty();
    }

    /** @internal */
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
        const result = Vector2.Zero();

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
        const result = Vector2.Zero();

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

        const globalViewport = this._host._getGlobalViewport();
        const projectedPosition = Vector3.Project(position, Matrix.IdentityReadOnly, scene.getTransformMatrix(), globalViewport);

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
     * @returns all child controls
     */
    public getDescendants(directDescendantsOnly?: boolean, predicate?: (control: Control) => boolean): Control[] {
        const results: Control[] = [];

        this.getDescendantsToRef(results, directDescendantsOnly, predicate);

        return results;
    }

    /**
     * Link current control with a target mesh
     * @param mesh defines the mesh to link with
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#tracking-positions
     */
    public linkWithMesh(mesh: Nullable<TransformNode>): void {
        if (!this._host || (this.parent && this.parent !== this._host._rootContainer)) {
            if (mesh) {
                Tools.Error("Cannot link a control to a mesh if the control is not at root level");
            }
            return;
        }

        const index = this._host._linkedControls.indexOf(this);
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

    /**
     * Shorthand function to set the top, right, bottom, and left padding values on the control.
     * @param { string | number} paddingTop - The value of the top padding.
     * @param { string | number} paddingRight - The value of the right padding. If omitted, top is used.
     * @param { string | number} paddingBottom - The value of the bottom padding. If omitted, top is used.
     * @param { string | number} paddingLeft - The value of the left padding. If omitted, right is used.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    public setPadding(paddingTop: string | number, paddingRight?: string | number, paddingBottom?: string | number, paddingLeft?: string | number) {
        const top = paddingTop;
        const right = paddingRight ?? top;
        const bottom = paddingBottom ?? top;
        const left = paddingLeft ?? right;

        this.paddingTop = top;
        this.paddingRight = right;
        this.paddingBottom = bottom;
        this.paddingLeft = left;
    }

    /**
     * Shorthand funtion to set the top, right, bottom, and left padding values in pixels on the control.
     * @param { number} paddingTop - The value in pixels of the top padding.
     * @param { number} paddingRight - The value in pixels of the right padding. If omitted, top is used.
     * @param { number} paddingBottom - The value in pixels of the bottom padding. If omitted, top is used.
     * @param { number} paddingLeft - The value in pixels of the left padding. If omitted, right is used.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/gui/gui#position-and-size
     */
    public setPaddingInPixels(paddingTop: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number) {
        const top = paddingTop;
        const right = paddingRight ?? top;
        const bottom = paddingBottom ?? top;
        const left = paddingLeft ?? right;

        this.paddingTopInPixels = top;
        this.paddingRightInPixels = right;
        this.paddingBottomInPixels = bottom;
        this.paddingLeftInPixels = left;
    }

    /**
     * @internal
     */
    public _moveToProjectedPosition(projectedPosition: Vector3): void {
        const oldLeft = this._left.getValue(this._host);
        const oldTop = this._top.getValue(this._host);

        const parentMeasure = this.parent?._currentMeasure;
        if (parentMeasure) {
            this._processMeasures(parentMeasure, this._host.getContext());
        }

        let newLeft = projectedPosition.x + this._linkOffsetX.getValue(this._host) - this._currentMeasure.width / 2;
        let newTop = projectedPosition.y + this._linkOffsetY.getValue(this._host) - this._currentMeasure.height / 2;

        const leftAndTopIgnoreAdaptiveScaling = this._left.ignoreAdaptiveScaling && this._top.ignoreAdaptiveScaling;
        if (leftAndTopIgnoreAdaptiveScaling) {
            if (Math.abs(newLeft - oldLeft) < 0.5) {
                newLeft = oldLeft;
            }

            if (Math.abs(newTop - oldTop) < 0.5) {
                newTop = oldTop;
            }
        }

        if (!leftAndTopIgnoreAdaptiveScaling && oldLeft === newLeft && oldTop === newTop) {
            return;
        }

        this.left = newLeft + "px";
        this.top = newTop + "px";

        this._left.ignoreAdaptiveScaling = true;
        this._top.ignoreAdaptiveScaling = true;
        this._markAsDirty();
    }

    /**
     * @internal
     */
    public _offsetLeft(offset: number) {
        this._isDirty = true;
        this._currentMeasure.left += offset;
    }

    /**
     * @internal
     */
    public _offsetTop(offset: number) {
        this._isDirty = true;
        this._currentMeasure.top += offset;
    }

    /** @internal */
    public _markMatrixAsDirty(): void {
        this._isMatrixDirty = true;
        this._flagDescendantsAsMatrixDirty();
    }

    /** @internal */
    public _flagDescendantsAsMatrixDirty(): void {
        // No child
    }

    /**
     * @internal
     */
    public _intersectsRect(rect: Measure, context?: ICanvasRenderingContext) {
        // make sure we are transformed correctly before checking intersections. no-op if nothing is dirty.
        this._transform(context);
        if (this._evaluatedMeasure.left >= rect.left + rect.width) {
            return false;
        }

        if (this._evaluatedMeasure.top >= rect.top + rect.height) {
            return false;
        }

        if (this._evaluatedMeasure.left + this._evaluatedMeasure.width <= rect.left) {
            return false;
        }

        if (this._evaluatedMeasure.top + this._evaluatedMeasure.height <= rect.top) {
            return false;
        }

        return true;
    }

    /** @internal */
    protected _computeAdditionalOffsetX() {
        return 0;
    }

    /** @internal */
    protected _computeAdditionalOffsetY() {
        return 0;
    }

    /** @internal */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    public invalidateRect() {
        this._transform();
        if (this.host && this.host.useInvalidateRectOptimization) {
            // Rotate by transform to get the measure transformed to global space
            this._currentMeasure.transformToRef(this._transformMatrix, this._tmpMeasureA);
            // get the boudning box of the current measure and last frames measure in global space and invalidate it
            // the previous measure is used to properly clear a control that is scaled down
            Measure.CombineToRef(this._tmpMeasureA, this._prevCurrentMeasureTransformedIntoGlobalSpace, this._tmpMeasureA);

            // Expand rect based on shadows
            const shadowOffsetX = this.shadowOffsetX;
            const shadowOffsetY = this.shadowOffsetY;
            const shadowBlur = Math.max(this._previousShadowBlur, this.shadowBlur);

            const leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
            const rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
            const topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
            const bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);

            const offsetX = this._computeAdditionalOffsetX();
            const offsetY = this._computeAdditionalOffsetY();

            this.host.invalidateRect(
                Math.floor(this._tmpMeasureA.left + leftShadowOffset - offsetX),
                Math.floor(this._tmpMeasureA.top + topShadowOffset - offsetY),
                Math.ceil(this._tmpMeasureA.left + this._tmpMeasureA.width + rightShadowOffset + offsetX),
                Math.ceil(this._tmpMeasureA.top + this._tmpMeasureA.height + bottomShadowOffset + offsetY)
            );
        }
    }

    /**
     * @internal
     */
    public _markAsDirty(force = false): void {
        if (!this._isVisible && !force) {
            return;
        }

        this._isDirty = true;
        this._markMatrixAsDirty();

        // Redraw only this rectangle
        if (this._host) {
            this._host.markAsDirty();
        }
    }

    /** @internal */
    public _markAllAsDirty(): void {
        this._markAsDirty();

        if (this._font) {
            this._prepareFont();
        }
    }

    /**
     * @internal
     */
    public _link(host: AdvancedDynamicTexture): void {
        this._host = host;
        if (this._host) {
            this.uniqueId = this._host.getScene()!.getUniqueId();
        }
    }

    /**
     * @internal
     */
    protected _transform(context?: ICanvasRenderingContext): void {
        if (!this._isMatrixDirty && this._scaleX === 1 && this._scaleY === 1 && this._rotation === 0) {
            return;
        }

        // postTranslate
        const offsetX = this._currentMeasure.width * this._transformCenterX + this._currentMeasure.left;
        const offsetY = this._currentMeasure.height * this._transformCenterY + this._currentMeasure.top;
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
            this._currentMeasure.transformToRef(this._transformMatrix, this._evaluatedMeasure);
        }
    }

    /**
     * @internal
     */
    public _renderHighlight(context: ICanvasRenderingContext): void {
        if (!this.isHighlighted) {
            return;
        }

        context.save();
        context.strokeStyle = this._highlightColor;
        context.lineWidth = this._highlightLineWidth;

        this._renderHighlightSpecific(context);
        context.restore();
    }

    /**
     * @internal
     */
    public _renderHighlightSpecific(context: ICanvasRenderingContext): void {
        context.strokeRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
    }

    protected _getColor(context: ICanvasRenderingContext): string | ICanvasGradient {
        return this.gradient ? this.gradient.getCanvasGradient(context) : this.color;
    }

    /**
     * @internal
     */
    protected _applyStates(context: ICanvasRenderingContext): void {
        if (this._isFontSizeInPercentage) {
            this._fontSet = true;
        }

        if (this._host && this._host.useSmallestIdeal && !this._font) {
            this._fontSet = true;
        }

        if (this._fontSet) {
            this._prepareFont();
            this._fontSet = false;
        }

        if (this._font) {
            context.font = this._font;
        }

        if (this._color || this.gradient) {
            context.fillStyle = this._getColor(context);
        }

        if (Control.AllowAlphaInheritance) {
            context.globalAlpha *= this._alpha;
        } else if (this._alphaSet) {
            context.globalAlpha = this.parent && !this.parent.renderToIntermediateTexture ? this.parent.alpha * this._alpha : this._alpha;
        }
    }

    /**
     * @internal
     */
    public _layout(parentMeasure: Measure, context: ICanvasRenderingContext): boolean {
        if (!this.isDirty && (!this.isVisible || this.notRenderable)) {
            return false;
        }

        if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
            this.host._numLayoutCalls++;

            this._currentMeasure.addAndTransformToRef(
                this._transformMatrix,
                -this._paddingLeftInPixels | 0,
                -this._paddingTopInPixels | 0,
                this._paddingRightInPixels | 0,
                this._paddingBottomInPixels | 0,
                this._prevCurrentMeasureTransformedIntoGlobalSpace
            );

            context.save();

            this._applyStates(context);

            let rebuildCount = 0;
            do {
                this._rebuildLayout = false;
                this._processMeasures(parentMeasure, context);
                rebuildCount++;
            } while (this._rebuildLayout && rebuildCount < 3);

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

    /**
     * @internal
     */
    protected _processMeasures(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        this._tempPaddingMeasure.copyFrom(parentMeasure);

        // Apply padding if in correct mode
        if (this.parent && this.parent.descendantsOnlyPadding) {
            this._tempPaddingMeasure.left += this.parent.paddingLeftInPixels;
            this._tempPaddingMeasure.top += this.parent.paddingTopInPixels;
            this._tempPaddingMeasure.width -= this.parent.paddingLeftInPixels + this.parent.paddingRightInPixels;
            this._tempPaddingMeasure.height -= this.parent.paddingTopInPixels + this.parent.paddingBottomInPixels;
        }

        this._currentMeasure.copyFrom(this._tempPaddingMeasure);

        // Let children take some pre-measurement actions
        this._preMeasure(this._tempPaddingMeasure, context);

        this._measure();

        // Let children take some post-measurement actions
        this._postMeasure(this._tempPaddingMeasure, context);

        this._computeAlignment(this._tempPaddingMeasure, context);

        // Convert to int values
        this._currentMeasure.left = this._currentMeasure.left | 0;
        this._currentMeasure.top = this._currentMeasure.top | 0;
        this._currentMeasure.width = this._currentMeasure.width | 0;
        this._currentMeasure.height = this._currentMeasure.height | 0;

        // Let children add more features
        this._additionalProcessing(this._tempPaddingMeasure, context);

        this._cachedParentMeasure.copyFrom(this._tempPaddingMeasure);

        this._currentMeasure.transformToRef(this._transformMatrix, this._evaluatedMeasure);
        if (this.onDirtyObservable.hasObservers()) {
            this.onDirtyObservable.notifyObservers(this);
        }
    }

    protected _evaluateClippingState(parentMeasure: Measure) {
        // Since transformMatrix is used here, we need to have it freshly computed
        this._transform();
        this._currentMeasure.transformToRef(this._transformMatrix, this._evaluatedMeasure);
        if (this.parent && this.parent.clipChildren) {
            parentMeasure.transformToRef(this.parent._transformMatrix, this._evaluatedParentMeasure);
            // Early clip
            if (this._evaluatedMeasure.left > this._evaluatedParentMeasure.left + this._evaluatedParentMeasure.width) {
                this._isClipped = true;
                return;
            }

            if (this._evaluatedMeasure.left + this._evaluatedMeasure.width < this._evaluatedParentMeasure.left) {
                this._isClipped = true;
                return;
            }

            if (this._evaluatedMeasure.top > this._evaluatedParentMeasure.top + this._evaluatedParentMeasure.height) {
                this._isClipped = true;
                return;
            }

            if (this._evaluatedMeasure.top + this._evaluatedMeasure.height < this._evaluatedParentMeasure.top) {
                this._isClipped = true;
                return;
            }
        }

        this._isClipped = false;
    }

    /** @internal */
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

        if (this._fixedRatio !== 0) {
            if (this._fixedRatioMasterIsWidth) {
                this._currentMeasure.height = this._currentMeasure.width * this._fixedRatio;
            } else {
                this._currentMeasure.width = this._currentMeasure.height * this._fixedRatio;
            }
        }
    }

    /**
     * @internal
     */
    protected _computeAlignment(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        const width = this._currentMeasure.width;
        const height = this._currentMeasure.height;

        const parentWidth = parentMeasure.width;
        const parentHeight = parentMeasure.height;

        // Left / top
        let x = 0;
        let y = 0;

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

        if (!this.descendantsOnlyPadding) {
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

    /**
     * @internal
     */
    protected _preMeasure(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        // Do nothing
    }

    /**
     * @internal
     */
    protected _postMeasure(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        // Do nothing
    }

    /**
     * @internal
     */
    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        // Do nothing
    }

    /**
     * @internal
     */
    protected _clipForChildren(context: ICanvasRenderingContext): void {
        // DO nothing
    }

    private static _ClipMeasure = new Measure(0, 0, 0, 0);
    private _tmpMeasureA = new Measure(0, 0, 0, 0);
    private _clip(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>) {
        context.beginPath();
        Control._ClipMeasure.copyFrom(this._currentMeasure);
        if (invalidatedRectangle) {
            // Rotate the invalidated rect into the control's space
            invalidatedRectangle.transformToRef(this._invertTransformMatrix, this._tmpMeasureA);

            // Get the intersection of the rect in context space and the current context
            const intersection = new Measure(0, 0, 0, 0);
            intersection.left = Math.max(this._tmpMeasureA.left, this._currentMeasure.left);
            intersection.top = Math.max(this._tmpMeasureA.top, this._currentMeasure.top);
            intersection.width = Math.min(this._tmpMeasureA.left + this._tmpMeasureA.width, this._currentMeasure.left + this._currentMeasure.width) - intersection.left;
            intersection.height = Math.min(this._tmpMeasureA.top + this._tmpMeasureA.height, this._currentMeasure.top + this._currentMeasure.height) - intersection.top;
            Control._ClipMeasure.copyFrom(intersection);
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            const shadowOffsetX = this.shadowOffsetX;
            const shadowOffsetY = this.shadowOffsetY;
            const shadowBlur = this.shadowBlur;

            const leftShadowOffset = Math.min(Math.min(shadowOffsetX, 0) - shadowBlur * 2, 0);
            const rightShadowOffset = Math.max(Math.max(shadowOffsetX, 0) + shadowBlur * 2, 0);
            const topShadowOffset = Math.min(Math.min(shadowOffsetY, 0) - shadowBlur * 2, 0);
            const bottomShadowOffset = Math.max(Math.max(shadowOffsetY, 0) + shadowBlur * 2, 0);

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

    /**
     * @internal
     */
    public _render(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>): boolean {
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

    /**
     * @internal
     */
    public _draw(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>): void {
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

    /**
     * @internal
     */
    public _processPicking(x: number, y: number, pi: Nullable<PointerInfoBase>, type: number, pointerId: number, buttonIndex: number, deltaX?: number, deltaY?: number): boolean {
        if (!this._isEnabled) {
            return false;
        }
        if (!this.isHitTestVisible || !this.isVisible || this._doNotRender) {
            return false;
        }

        if (!this.contains(x, y)) {
            return false;
        }

        this._processObservables(type, x, y, pi, pointerId, buttonIndex, deltaX, deltaY);

        return true;
    }

    /**
     * @internal
     */
    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number, pi: Nullable<PointerInfoBase>): void {
        const canNotify: boolean = this.onPointerMoveObservable.notifyObservers(coordinates, -1, target, this, pi);

        if (canNotify && this.parent != null && !this.isPointerBlocker) {
            this.parent._onPointerMove(target, coordinates, pointerId, pi);
        }
    }

    /**
     * @internal
     */
    public _onPointerEnter(target: Control, pi: Nullable<PointerInfoBase>): boolean {
        if (!this._isEnabled) {
            return false;
        }
        if (this._enterCount > 0) {
            return false;
        }

        if (this._enterCount === -1) {
            // -1 is for touch input, we are now sure we are with a mouse or pencil
            this._enterCount = 0;
        }
        this._enterCount++;

        const canNotify: boolean = this.onPointerEnterObservable.notifyObservers(this, -1, target, this, pi);

        if (canNotify && this.parent != null && !this.isPointerBlocker) {
            this.parent._onPointerEnter(target, pi);
        }

        return true;
    }

    /**
     * @internal
     */
    public _onPointerOut(target: Control, pi: Nullable<PointerInfoBase>, force = false): void {
        if (!force && (!this._isEnabled || target === this)) {
            return;
        }
        this._enterCount = 0;

        let canNotify: boolean = true;

        if (!target.isAscendant(this)) {
            canNotify = this.onPointerOutObservable.notifyObservers(this, -1, target, this, pi);
        }

        if (canNotify && this.parent != null && !this.isPointerBlocker) {
            this.parent._onPointerOut(target, pi, force);
        }
    }

    /**
     * @internal
     */
    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: Nullable<PointerInfoBase>): boolean {
        // Prevent pointerout to lose control context.
        // Event redundancy is checked inside the function.
        this._onPointerEnter(this, pi);

        if (this._downCount !== 0) {
            return false;
        }

        this._downCount++;

        this._downPointerIds[pointerId] = true;

        const canNotify: boolean = this.onPointerDownObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this, pi);

        if (canNotify && this.parent != null && !this.isPointerBlocker) {
            this.parent._onPointerDown(target, coordinates, pointerId, buttonIndex, pi);
        }

        if (pi && this.uniqueId !== this._host.rootContainer.uniqueId) {
            this._host._capturedPointerIds.add((pi.event as IPointerEvent).pointerId);
        }

        return true;
    }

    /**
     * @internal
     */
    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean, pi?: Nullable<PointerInfoBase>): void {
        if (!this._isEnabled) {
            return;
        }
        this._downCount = 0;

        delete this._downPointerIds[pointerId];

        let canNotifyClick: boolean = notifyClick;
        if (notifyClick && (this._enterCount > 0 || this._enterCount === -1)) {
            canNotifyClick = this.onPointerClickObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this, pi);
        }
        const canNotify: boolean = this.onPointerUpObservable.notifyObservers(new Vector2WithInfo(coordinates, buttonIndex), -1, target, this, pi);

        if (canNotify && this.parent != null && !this.isPointerBlocker) {
            this.parent._onPointerUp(target, coordinates, pointerId, buttonIndex, canNotifyClick, pi);
        }

        if (pi && this.uniqueId !== this._host.rootContainer.uniqueId) {
            this._host._capturedPointerIds.delete((pi.event as IPointerEvent).pointerId);
        }
    }

    /**
     * @internal
     */
    public _forcePointerUp(pointerId: Nullable<number> = null) {
        if (pointerId !== null) {
            this._onPointerUp(this, Vector2.Zero(), pointerId, 0, true);
        } else {
            for (const key in this._downPointerIds) {
                this._onPointerUp(this, Vector2.Zero(), +key as number, 0, true);
            }
        }
    }

    /**
     * @internal
     */
    public _onWheelScroll(deltaX?: number, deltaY?: number): void {
        if (!this._isEnabled) {
            return;
        }
        const canNotify: boolean = this.onWheelObservable.notifyObservers(new Vector2(deltaX, deltaY));

        if (canNotify && this.parent != null) {
            this.parent._onWheelScroll(deltaX, deltaY);
        }
    }

    /** @internal */
    public _onCanvasBlur(): void {}

    /**
     * @internal
     */
    public _processObservables(
        type: number,
        x: number,
        y: number,
        pi: Nullable<PointerInfoBase>,
        pointerId: number,
        buttonIndex: number,
        deltaX?: number,
        deltaY?: number
    ): boolean {
        if (!this._isEnabled) {
            return false;
        }
        this._dummyVector2.copyFromFloats(x, y);
        if (type === PointerEventTypes.POINTERMOVE) {
            this._onPointerMove(this, this._dummyVector2, pointerId, pi);

            const previousControlOver = this._host._lastControlOver[pointerId];
            if (previousControlOver && previousControlOver !== this) {
                previousControlOver._onPointerOut(this, pi);
            }

            if (previousControlOver !== this) {
                this._onPointerEnter(this, pi);
            }

            this._host._lastControlOver[pointerId] = this;
            return true;
        }

        if (type === PointerEventTypes.POINTERDOWN) {
            this._onPointerDown(this, this._dummyVector2, pointerId, buttonIndex, pi);
            this._host._registerLastControlDown(this, pointerId);
            this._host._lastPickedControl = this;
            return true;
        }

        if (type === PointerEventTypes.POINTERUP) {
            if (this._host._lastControlDown[pointerId]) {
                this._host._lastControlDown[pointerId]._onPointerUp(this, this._dummyVector2, pointerId, buttonIndex, true, pi);
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

    private _getStyleProperty(propName: "fontStyle" | "fontWeight" | "fontFamily", defaultValue: string): string {
        const prop = (this._style && this._style[propName]) ?? this[propName];
        if (!prop && this.parent) {
            return this.parent._getStyleProperty(propName, defaultValue);
        } else if (!this.parent) {
            return defaultValue;
        } else {
            return prop;
        }
    }

    private _prepareFont() {
        if (!this._font && !this._fontSet) {
            return;
        }

        this._font =
            this._getStyleProperty("fontStyle", "") +
            " " +
            this._getStyleProperty("fontWeight", "") +
            " " +
            this.fontSizeInPixels +
            "px " +
            this._getStyleProperty("fontFamily", "Arial");

        this._fontOffset = Control._GetFontOffset(this._font);

        //children need to be refreshed
        this.getDescendants().forEach((child) => child._markAllAsDirty());
    }

    /**
     * A control has a dimension fully defined if that dimension doesn't depend on the parent's dimension.
     * As an example, a control that has dimensions in pixels is fully defined, while in percentage is not fully defined.
     * @param dim the dimension to check (width or height)
     * @returns if the dimension is fully defined
     */
    public isDimensionFullyDefined(dim: "width" | "height"): boolean {
        return this.getDimension(dim).isPixel;
    }

    /**
     * Gets the dimension of the control along a specified axis
     * @param dim the dimension to retrieve (width or height)
     * @returns the dimension value along the specified axis
     */
    public getDimension(dim: "width" | "height"): ValueAndUnit {
        if (dim === "width") {
            return this._width;
        } else {
            return this._height;
        }
    }

    /**
     * Clones a control and its descendants
     * @param host the texture where the control will be instantiated. Can be empty, in which case the control will be created on the same texture
     * @returns the cloned control
     */
    public clone(host?: AdvancedDynamicTexture): Control {
        const serialization: any = {};
        this.serialize(serialization, true);

        const controlType = Tools.Instantiate("BABYLON.GUI." + serialization.className);
        const cloned = new controlType();
        cloned.parse(serialization, host);

        return cloned;
    }

    /**
     * Parses a serialized object into this control
     * @param serializedObject the object with the serialized properties
     * @param host the texture where the control will be instantiated. Can be empty, in which case the control will be created on the same texture
     * @returns this control
     */
    public parse(serializedObject: any, host?: AdvancedDynamicTexture): Control {
        SerializationHelper.Parse(() => this, serializedObject, null);

        this.name = serializedObject.name;

        this._parseFromContent(serializedObject, host ?? this._host);

        return this;
    }

    /**
     * Serializes the current control
     * @param serializationObject defined the JSON serialized object
     * @param force if the control should be serialized even if the isSerializable flag is set to false (default false)
     */
    public serialize(serializationObject: any, force: boolean = false) {
        if (!this.isSerializable && !force) {
            return;
        }
        SerializationHelper.Serialize(this, serializationObject);
        serializationObject.name = this.name;
        serializationObject.className = this.getClassName();

        // Call prepareFont to guarantee the font is properly set before serializing
        this._prepareFont();
        if (this._font) {
            serializationObject.fontFamily = this._fontFamily;
            serializationObject.fontSize = this.fontSize;
            serializationObject.fontWeight = this.fontWeight;
            serializationObject.fontStyle = this.fontStyle;
        }

        if (this._gradient) {
            serializationObject.gradient = {};
            this._gradient.serialize(serializationObject.gradient);
        }

        // Animations
        SerializationHelper.AppendSerializedAnimations(this, serializationObject);
    }

    /**
     * @internal
     */
    public _parseFromContent(serializedObject: any, host: AdvancedDynamicTexture) {
        if (serializedObject.fontFamily) {
            this.fontFamily = serializedObject.fontFamily;
        }

        if (serializedObject.fontSize) {
            this.fontSize = serializedObject.fontSize;
        }

        if (serializedObject.fontWeight) {
            this.fontWeight = serializedObject.fontWeight;
        }

        if (serializedObject.fontStyle) {
            this.fontStyle = serializedObject.fontStyle;
        }

        // Gradient
        if (serializedObject.gradient) {
            const className = Tools.Instantiate("BABYLON.GUI." + serializedObject.gradient.className);
            this._gradient = new className();
            this._gradient?.parse(serializedObject.gradient);
        }

        // Animations
        if (serializedObject.animations) {
            this.animations = [];
            for (let animationIndex = 0; animationIndex < serializedObject.animations.length; animationIndex++) {
                const parsedAnimation = serializedObject.animations[animationIndex];
                const internalClass = GetClass("BABYLON.Animation");
                if (internalClass) {
                    this.animations.push(internalClass.Parse(parsedAnimation));
                }
            }

            if (serializedObject.autoAnimate && this._host && this._host.getScene()) {
                this._host
                    .getScene()!
                    .beginAnimation(
                        this,
                        serializedObject.autoAnimateFrom,
                        serializedObject.autoAnimateTo,
                        serializedObject.autoAnimateLoop,
                        serializedObject.autoAnimateSpeed || 1.0
                    );
            }
        }

        this.fixedRatioMasterIsWidth = serializedObject.fixedRatioMasterIsWidth ?? this.fixedRatioMasterIsWidth;
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
            const index = this._host._linkedControls.indexOf(this);
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

    private static _FontHeightSizes: { [key: string]: { ascent: number; height: number; descent: number } } = {};

    /**
     * @internal
     */
    public static _GetFontOffset(font: string): { ascent: number; height: number; descent: number } {
        if (Control._FontHeightSizes[font]) {
            return Control._FontHeightSizes[font];
        }

        const engine = EngineStore.LastCreatedEngine;
        if (!engine) {
            throw new Error("Invalid engine. Unable to create a canvas.");
        }

        const result = engine.getFontOffset(font);
        Control._FontHeightSizes[font] = result;

        return result;
    }

    /**
     * Creates a Control from parsed data
     * @param serializedObject defines parsed data
     * @param host defines the hosting AdvancedDynamicTexture
     * @returns a new Control
     */
    public static Parse(serializedObject: any, host: AdvancedDynamicTexture): Control {
        const controlType = Tools.Instantiate("BABYLON.GUI." + serializedObject.className);
        const control = SerializationHelper.Parse(() => new controlType(), serializedObject, null);

        control.name = serializedObject.name;

        control._parseFromContent(serializedObject, host);

        return control;
    }

    public static AddHeader: (control: Control, text: string, size: string | number, options: { isHorizontal: boolean; controlFirst: boolean }) => any = () => {};

    /**
     * @internal
     */
    protected static drawEllipse(x: number, y: number, width: number, height: number, context: ICanvasRenderingContext): void {
        context.translate(x, y);
        context.scale(width, height);

        context.beginPath();
        context.arc(0, 0, 1, 0, 2 * Math.PI);
        context.closePath();

        context.scale(1 / width, 1 / height);
        context.translate(-x, -y);
    }

    /**
     * Returns true if the control is ready to be used
     * @returns
     */
    public isReady(): boolean {
        // Most controls are ready by default, so the default implementation is to return true
        return true;
    }
}
RegisterClass("BABYLON.GUI.Control", Control);
