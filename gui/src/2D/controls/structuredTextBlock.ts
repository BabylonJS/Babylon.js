import { Observable } from "babylonjs/Misc/observable";
import { Measure } from "../measure";
import { ValueAndUnit } from "../valueAndUnit";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { PointerInfoBase } from 'babylonjs/Events/pointerEvents';
import { Control } from "./control";
import { TextWrapping } from "./textBlock";
import { RegisterClass } from "babylonjs/Misc/typeStore";
import { Nullable } from "babylonjs/types";
import { serialize } from 'babylonjs/Misc/decorators';
import { ICanvasRenderingContext , ICanvasGradient } from 'babylonjs/Engines/ICanvas';
import { IStructuredTextPart } from './iStructuredTextPart';
import { StructuredTextMetrics } from './structuredTextMetrics';
import { Engine } from 'babylonjs/Engines/engine';

type StructuredText = Array<IStructuredTextPart>;

type StructuredTextLine = {
    parts: StructuredText;
    metrics: StructuredTextMetrics;
};

type StructuredTextLines = Array<StructuredTextLine>;

// Mostly the same than IStructuredTextPart, but nothing is optional here,
// this is the attributes about to be sent to the canvas context.
type TextPartAttributes = {
    color: string | ICanvasGradient;

    underline: boolean;
    lineThrough: boolean;

    frame: boolean;
    frameColor: string;
    frameCornerRadius: number;
    frameOutlineWidth: number;
    frameOutlineColor: string;

    fontFamily: string;
    fontSize: string;
    fontStyle: string;
    fontWeight: string;

    outlineWidth: number;
    outlineColor: string;

    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
};

type Size = {
    width: number ,
    height: number ,
    ascent: number ,
    descent: number
};

type HrefObservableData = {
    target: StructuredTextBlock,
    href: any,
    part: IStructuredTextPart
};

/**
 * Class used to create structured text block control
 */
export class StructuredTextBlock extends Control {
    private _structuredText: StructuredText = [];
    private _textWrapping = TextWrapping.Clip;
    private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    //private _lines: any[];
    private _lines: StructuredTextLines;
    private _resizeToFit: boolean = false;

    private _lineSpacing: ValueAndUnit = new ValueAndUnit(0);
    private _outlineWidth: number = 0;
    private _outlineColor: string = "white";
    private _underline: boolean = false;
    private _lineThrough: boolean = false;
    private _frameColor: string = "#a0a0a0";
    private _frameOutlineWidth: number = 2;
    private _frameOutlineColor: string = "#606060";
    private _frameCornerRadius: number = 0;

    private _underlineRelativeY: number = 0.15;
    private _lineThroughRelativeY: number = -0.3;
    private _decorationRelativeThickness: number = 0.08;

    private _xOffset: number = 0;
    private _yOffset: number = 0;
    private _scrollX: number = 0;
    private _scrollY: number = 0;
    private _scrollable: boolean = false;

    // Width and height of the actual content
    private _contentWidth: number = 0;
    private _contentHeight: number = 0;

    // Useful for various optimization (e.g. avoiding parsing lines when it shouldn't)
    private _characterCount: number = 0;
    private _characterLimit: number = Infinity;
    private _lastMeasuredWidth: number = 0;
    private _linesAreDirty: boolean = true;

    private _hasHoverStyle: boolean = false;
    private _hoveringPart: null | IStructuredTextPart = null;
    private _hasHref: boolean = false;

    /**
     * An event triggered after the text is changed
     */
    public onTextChangedObservable = new Observable<StructuredTextBlock>();

    /**
     * An event triggered after the text was broken up into lines and part have metrics computed
     */
    public onLinesReadyObservable = new Observable<StructuredTextBlock>();

    /**
     * An event triggered when there is a part having an href clicked
     */
    public onClickHrefObservable = new Observable<HrefObservableData>();

    /**
     * An event triggered when the mouse enter a part having an href
     */
    public onEnterHrefObservable = new Observable<HrefObservableData>();

    /**
     * An event triggered when the mouse move out of a part having an href
     */
    public onOutHrefObservable = new Observable<HrefObservableData>();

    /**
     * Function used to split a string into words. By default, a string is split at each space character found
     */
    public wordSplittingFunction: Nullable<(line: string) => string[]>;

    /**
    * Gets or sets structured text to display
    */
    @serialize()
    public get structuredText(): StructuredText {
        return this._structuredText;
    }

    /**
     * Gets or sets structured text to display
     */
    public set structuredText(value: StructuredText) {
        if (this._structuredText === value || ! Array.isArray(value)) {
            return;
        }
        this._structuredText = value ;
        this._markLinesAsDirty();
        this._markAsDirty();
        this.onTextChangedObservable.notifyObservers(this);
    }

    /**
     * Gets or sets a boolean indicating if text must be wrapped
     */
    @serialize()
    public get textWrapping(): TextWrapping | boolean {
        return this._textWrapping;
    }

    /**
     * Gets or sets a boolean indicating if text must be wrapped
     */
    public set textWrapping(value: TextWrapping | boolean) {
        if (this._textWrapping === value) {
            return;
        }
        this._textWrapping = +value;
        this._markLinesAsDirty();
        this._markAsDirty();
    }

    /**
     * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
     */
    @serialize()
    public get textHorizontalAlignment(): number {
        return this._textHorizontalAlignment;
    }

    /**
     * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
     */
    public set textHorizontalAlignment(value: number) {
        if (this._textHorizontalAlignment === value) {
            return;
        }

        this._textHorizontalAlignment = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
     */
    @serialize()
    public get textVerticalAlignment(): number {
        return this._textVerticalAlignment;
    }

    /**
     * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
     */
    public set textVerticalAlignment(value: number) {
        if (this._textVerticalAlignment === value) {
            return;
        }

        this._textVerticalAlignment = value;
        this._markAsDirty();
    }

    /**
     * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
     */
    public get lines(): StructuredTextLines {
        return this._lines;
    }

    /**
     * Get the X-scrolling value
     */
    @serialize()
    public get scrollX(): number {
        return this._scrollX;
    }

    /**
     * Set the X-scrolling value
     */
    public set scrollX(value: number) {
        this._scrollX = + value || 0;
        this._scrollX = Math.min(Math.max(- this._contentWidth, this._scrollX), this._contentWidth);
        this._markAsDirty();
    }

    /**
     * Get the Y-scrolling value
     */
    @serialize()
    public get scrollY(): number {
        return this._scrollY;
    }

    /**
     * Set the Y-scrolling value
     */
    public set scrollY(value: number) {
        this._scrollY = + value || 0;

        // Since scrollY is the delta with the base alignment, computing scroll bound also obey to this alignment
        // We allow value that push the text content outside of the bound, but not further
        // (to allow some effect where the content appears at the bottom, scroll, and disappear at the top)
        switch (this._textVerticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                this._scrollY = Math.min(Math.max(- this._contentHeight, this._scrollY), this._currentMeasure.height);
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                this._scrollY = Math.min(Math.max(- this._currentMeasure.height, this._scrollY), this._contentHeight);
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                let delta = (this._currentMeasure.height + this._contentHeight) / 2;
                this._scrollY = Math.min(Math.max(- delta, this._scrollY), delta);
                break;
        }

        this._markAsDirty();
    }

    /**
     * Get the X-scrolling value
     */
    @serialize()
    public get scrollable(): boolean {
        return this._scrollable;
    }

    /**
     * Set the X-scrolling value
     */
    public set scrollable(value: boolean) {
        this._scrollable = !! value;
    }

    /**
     * Return the width of the actual text content
     */
    public get contentWidth(): number {
        return this._contentWidth;
    }

    /**
     * Return the height of the actual text content
     */
    public get contentHeight(): number {
        return this._contentHeight;
    }

    /**
     * Gets or sets an boolean indicating that the StructuredTextBlock will be resized to fit container
     */
    @serialize()
    public get resizeToFit(): boolean {
        return this._resizeToFit;
    }

    /**
     * Gets or sets an boolean indicating that the StructuredTextBlock will be resized to fit container
     */
    public set resizeToFit(value: boolean) {
        if (this._resizeToFit === value) {
            return;
        }
        this._resizeToFit = value;

        if (this._resizeToFit) {
            this._width.ignoreAdaptiveScaling = true;
            this._height.ignoreAdaptiveScaling = true;
        }

        //this._markLinesAsDirty();
        this._markAsDirty();
    }

    protected _markLinesAsDirty() {
        this._linesAreDirty = true;
    }

    /**
     * Gets or sets line spacing value
     */
    @serialize()
    public set lineSpacing(value: string | number) {
        if (this._lineSpacing.fromString(value)) {
            this._markAsDirty();
        }
    }

    /**
     * Gets or sets line spacing value
     */
    public get lineSpacing(): string | number {
        return this._lineSpacing.toString(this._host);
    }

    /**
     * Gets or sets outlineWidth of the text to display
     */
    @serialize()
    public get outlineWidth(): number {
        return this._outlineWidth;
    }

    /**
     * Gets or sets outlineWidth of the text to display
     */
    public set outlineWidth(value: number) {
        if (this._outlineWidth === value) {
            return;
        }
        this._outlineWidth = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets outlineColor of the text to display
     */
    @serialize()
    public get outlineColor(): string {
        return this._outlineColor;
    }

    /**
     * Gets or sets outlineColor of the text to display
     */
    public set outlineColor(value: string) {
        if (this._outlineColor === value) {
            return;
        }
        this._outlineColor = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets a boolean indicating that text must have underline
     */
    @serialize()
    public get underline(): boolean {
        return this._underline;
    }

    /**
     * Gets or sets a boolean indicating that text must have underline
     */
    public set underline(value: boolean) {
        if (this._underline === value) {
            return;
        }
        this._underline = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets an boolean indicating that text must be crossed out
     */
    @serialize()
    public get lineThrough(): boolean {
        return this._lineThrough;
    }

    /**
     * Gets or sets an boolean indicating that text must be crossed out
     */
    public set lineThrough(value: boolean) {
        if (this._lineThrough === value) {
            return;
        }
        this._lineThrough = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets frameColor of the text to display
     */
    @serialize()
    public get frameColor(): string {
        return this._frameColor;
    }

    /**
     * Gets or sets frameColor of the text to display
     */
    public set frameColor(value: string) {
        if (this._frameColor === value) {
            return;
        }
        this._frameColor = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets frameOutlineWidth of the text to display
     */
    @serialize()
    public get frameOutlineWidth(): number {
        return this._frameOutlineWidth;
    }

    /**
     * Gets or sets frameOutlineWidth of the text to display
     */
    public set frameOutlineWidth(value: number) {
        if (this._frameOutlineWidth === value) {
            return;
        }
        this._frameOutlineWidth = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets frameOutlineColor of the text to display
     */
    @serialize()
    public get frameOutlineColor(): string {
        return this._frameOutlineColor;
    }

    /**
     * Gets or sets frameOutlineColor of the text to display
     */
    public set frameOutlineColor(value: string) {
        if (this._frameOutlineColor === value) {
            return;
        }
        this._frameOutlineColor = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets frameCornerRadius of the text to display
     */
    @serialize()
    public get frameCornerRadius(): number {
        return this._frameCornerRadius;
    }

    /**
     * Gets or sets frameCornerRadius of the text to display
     */
    public set frameCornerRadius(value: number) {
        if (this._frameCornerRadius === value) {
            return;
        }
        this._frameCornerRadius = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets underlineRelativeY of the text to display
     */
    @serialize()
    public get underlineRelativeY(): number {
        return this._underlineRelativeY;
    }

    /**
     * Gets or sets underlineRelativeY of the text to display
     */
    public set underlineRelativeY(value: number) {
        if (this._underlineRelativeY === value) {
            return;
        }
        this._underlineRelativeY = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets lineThroughRelativeY of the text to display
     */
    @serialize()
    public get lineThroughRelativeY(): number {
        return this._lineThroughRelativeY;
    }

    /**
     * Gets or sets lineThroughRelativeY of the text to display
     */
    public set lineThroughRelativeY(value: number) {
        if (this._lineThroughRelativeY === value) {
            return;
        }
        this._lineThroughRelativeY = value;
        this._markAsDirty();
    }

    /**
     * Gets or sets decorationRelativeThickness of the text to display, affect both underline and lineThrough thcikness
     */
    @serialize()
    public get decorationRelativeThickness(): number {
        return this._decorationRelativeThickness;
    }

    /**
     * Gets or sets decorationRelativeThickness of the text to display, affect both underline and lineThrough thcikness
     */
    public set decorationRelativeThickness(value: number) {
        if (this._decorationRelativeThickness === value) {
            return;
        }
        this._decorationRelativeThickness = value;
        this._markAsDirty();
    }

    /**
     * Gets the character count of the current structuredText once lines are _parseStructuredTextLine
     * Only works when attached with .addControl() since it needs a Canvas context.
     */
    public get characterCount(): number {
        if (this._linesAreDirty) {
            let context = this._host?.getContext();
            if (! context) { return -1; }
            this._computeLines(context);
        }

        return this._characterCount;
    }

    /**
     * Gets or sets characterLimit of the text to display
     */
    @serialize()
    public get characterLimit(): number {
        return this._characterLimit;
    }

    /**
     * Gets or sets characterLimit of the text to display
     */
    public set characterLimit(value: number) {
        if (this._characterLimit === value) {
            return;
        }
        if (this._characterLimit >= this._characterCount && value >= this._characterCount) {
            // This will have no effect, however since the .structuredText getter may be triggered later,
            // it's is still useful to update the value.
            this._characterLimit = value;
            return;
        }
        this._characterLimit = value;
        this._markAsDirty();
    }

    /**
     * Creates a new StructuredTextBlock object
     * @param name defines the name of the control
     * @param text defines the text to display (emptry string by default)
     */
    constructor(
        /**
         * Defines the name of the control
         */
        public name?: string,
        structuredText: StructuredText = []
    ) {
        super(name);
        this.structuredText = structuredText;
    }

    protected _getTypeName(): string {
        return "StructuredTextBlock";
    }

    protected _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
            context.lineJoin = 'miter';
            context.miterLimit = 2;
        }
    }

    // It's like ._applyStates(), but for each line parts
    protected _setContextAttributes(context: ICanvasRenderingContext, attr: TextPartAttributes) {
        // .fillStyle and .strokeStyle can receive a CSS color string, a CanvasGradient or a CanvasPattern,
        // but here we just care about color string.
        context.fillStyle = attr.color;
        context.font = attr.fontStyle + " " + attr.fontWeight + " " + attr.fontSize + " " + attr.fontFamily;

        if (attr.shadowBlur || attr.shadowOffsetX || attr.shadowOffsetY) {
            if (attr.shadowColor) { context.shadowColor = attr.shadowColor; }
            context.shadowBlur = attr.shadowBlur;
            context.shadowOffsetX = attr.shadowOffsetX;
            context.shadowOffsetY = attr.shadowOffsetY;
        }
        else {
            context.shadowBlur = 0;
        }

        if (attr.outlineWidth) {
            context.lineWidth = attr.outlineWidth;
            context.strokeStyle = attr.outlineColor;
            context.lineJoin = 'miter';
            context.miterLimit = 2;
        }
        else {
            context.lineWidth = 0;
        }
    }

    // Like ._setContextAttributesForMeasure(), but only set up attributes that cares for measuring the text
    protected _setContextAttributesForMeasure(context: ICanvasRenderingContext, attr: TextPartAttributes) {
        context.font = attr.fontStyle + " " + attr.fontWeight + " " + attr.fontSize + " " + attr.fontFamily ;
    }

    // Compute an attribute object from a text's part, inheriting from this
    protected _inheritAttributes(part: IStructuredTextPart): TextPartAttributes {
        const isHovering = this._hoveringPart === part;

        return {
            color: isHovering && part.hover ? part.hover.color ?? part.color ?? this.color :
                part.color ?? this.color ,
            outlineWidth: part.outlineWidth ?? this._outlineWidth ,
            outlineColor: part.outlineColor ?? this._outlineColor ,
            shadowColor: part.shadowColor ?? this.shadowColor ,
            shadowBlur: part.shadowBlur ?? this.shadowBlur ,
            shadowOffsetX: part.shadowOffsetX ?? this.shadowOffsetX ,
            shadowOffsetY: part.shadowOffsetY ?? this.shadowOffsetY ,
            underline: !! (
                isHovering && part.hover ? part.hover.underline ?? part.underline ?? this._underline :
                part.underline ?? this._underline
            ) ,
            lineThrough: part.lineThrough ?? this._lineThrough ,
            frame: !! part.frame ,
            frameColor: part.frameColor ?? this._frameColor,
            frameOutlineWidth: part.frameOutlineWidth ?? this._frameOutlineWidth ,
            frameOutlineColor: part.frameOutlineColor ?? this._frameOutlineColor ,
            frameCornerRadius: part.frameCornerRadius ?? this._frameCornerRadius,

            fontFamily: part.fontFamily ?? this.style?.fontFamily ?? this.fontFamily ,
            fontSize: '' + (part.fontSize ?? this.style?.fontSize ?? this.fontSize) ,
            fontStyle: part.fontStyle ?? this.style?.fontStyle ?? this.fontStyle ,
            fontWeight: part.fontWeight ?? this.style?.fontWeight ?? this.fontWeight
        };
    }

    /**
     * Given a width constraint applied on the text block, find the expected height
     * @returns expected height
     */
    public computeExpectedHeight(): number {
        if (this._structuredText.length && this.widthInPixels) {
            // Should abstract platform instead of using LastCreatedEngine
            const context = Engine.LastCreatedEngine?.createCanvas(0, 0).getContext("2d");
            if (context) {
                this._applyStates(context);
                if (!this._fontOffset) {
                    this._fontOffset = Control._GetFontOffset(context.font);
                }
                if (this._linesAreDirty) {
                    this._computeLines(context, this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels);
                }

                const lines = this._lines;

                let newHeight = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * lines.length;

                if (lines.length > 0 && this._lineSpacing.internalValue !== 0) {
                    let lineSpacing = 0;
                    if (this._lineSpacing.isPixel) {
                        lineSpacing = this._lineSpacing.getValue(this._host);
                    } else {
                        lineSpacing = this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
                    }

                    newHeight += (lines.length - 1) * lineSpacing;
                }

                return newHeight;
            }
        }
        return 0;
    }

    protected _processMeasures(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        if (!this._fontOffset) {
            this._fontOffset = Control._GetFontOffset(context.font);
        }

        super._processMeasures(parentMeasure, context);

        // Prepare lines
        if (this._linesAreDirty || this._lastMeasuredWidth !== this._currentMeasure.width) {
            this._computeLines(context);
            this._lastMeasuredWidth = this._currentMeasure.width;
        }

        let maxLineWidth: number = 0;

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (line.metrics.width > maxLineWidth) {
                maxLineWidth = line.metrics.width;
            }
        }

        if (this._resizeToFit) {
            if (this._textWrapping === TextWrapping.Clip) {
                const newWidth = (this.paddingLeftInPixels + this.paddingRightInPixels + maxLineWidth) | 0;
                if (newWidth !== this._width.internalValue) {
                    this._width.updateInPlace(newWidth, ValueAndUnit.UNITMODE_PIXEL);
                    this._rebuildLayout = true;
                }
            }

            let newHeight = (this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length) | 0;

            if (this._lines.length > 0 && this._lineSpacing.internalValue !== 0) {
                let lineSpacing = 0;
                if (this._lineSpacing.isPixel) {
                    lineSpacing = this._lineSpacing.getValue(this._host);
                } else {
                    lineSpacing = this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
                }

                newHeight += (this._lines.length - 1) * lineSpacing;
            }

            if (newHeight !== this._height.internalValue) {
                this._height.updateInPlace(newHeight, ValueAndUnit.UNITMODE_PIXEL);
                this._rebuildLayout = true;
            }
        }
    }

    protected _computeLines(context: ICanvasRenderingContext, refWidth?: number): void {
        this._lines = this._breakLines(refWidth ?? this._currentMeasure.width, context);

        if (!this._fontOffset) {
            this._fontOffset = Control._GetFontOffset(context.font);
        }

        this._characterCount = 0;
        this._hoveringPart = null;
        this._hasHoverStyle = false;
        this._hasHref = false;
        this._contentWidth = 0;
        this._contentHeight = 0;
        let y = 0;
        const width = this._currentMeasure.width;
        const lineSpacing = this._lineSpacing.isPixel ? this._lineSpacing.getValue(this._host) : this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];
            y += line.metrics.ascent;
            this._contentHeight += line.metrics.height;
            if (line.metrics.width > this._contentWidth) { this._contentWidth = line.metrics.width; }
            let x = 0;

            switch (this._textHorizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = width - line.metrics.width;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (width - line.metrics.width) / 2;
                    break;
            }

            line.metrics.x = x;
            line.metrics.baselineY = y;

            for (let part of line.parts) {
                delete part.dynamicCustomData;  // Always nullify it
                if (part.hover) { this._hasHoverStyle = true; }
                if (part.href) { this._hasHref = true; }

                // Note that it's always defined at that point
                if (part.metrics) {
                    part.metrics.x = x;
                    part.metrics.baselineY = y;
                    x += part.metrics.width;
                }

                this._characterCount += part.text.length;
            }

            y += line.metrics.descent + lineSpacing;
        }

        this._linesAreDirty = false;
        this.onLinesReadyObservable.notifyObservers(this);
    }

    protected _breakLines(refWidth: number, context: ICanvasRenderingContext): StructuredTextLines {
        let _newPart;
        const lines: StructuredTextLines = [];
        let _currentLine: StructuredText = [];
        const _lines: Array<StructuredText> = [ _currentLine ];

        // First split on \n
        for (let _part of this._structuredText) {
            if (_part.text.includes('\n')) {
                for (let _splitted of _part.text.split('\n')) {
                    _newPart = Object.assign({} , _part);
                    _newPart.text = _splitted;
                    _currentLine.push(_newPart);

                    // Create a new line
                    _currentLine = [] ;
                    _lines.push(_currentLine);
                }
            }
            else {
                _currentLine.push(_part);
            }
        }

        // Then split/apply text-wrapping
        if (this._textWrapping === TextWrapping.Ellipsis) {
            for (let _line of _lines) {
                lines.push(this._parseStructuredTextLineEllipsis(_line, refWidth, context));
            }
        }
        else if (this._textWrapping === TextWrapping.WordWrap) {
            for (let _line of _lines) {
                lines.push(...this._parseStructuredTextLineWordWrap(_line, refWidth, context));
            }
        }
        else {
            for (let _line of _lines) {
                lines.push(this._parseStructuredTextLine(_line, context));
            }
        }

        return lines;
    }

    protected _splitIntoCharacters(line: StructuredText, context: ICanvasRenderingContext): StructuredText {
        let splitted = [];
        const reusableSize = { width: 0, height: 0, ascent: 0, descent: 0 };

        for (let i = 0 ; i < line.length ; i ++) {
            let part = line[ i ];
            if (part.splitIntoCharacters && part.text.length > 1) {
                splitted.length = 0;
                const attr = this._inheritAttributes(part);
                this._setContextAttributesForMeasure(context , attr);

                for (let character of part.text) {
                    let newPart = Object.assign({}, part);
                    newPart.text = character;
                    delete newPart.metrics;
                    splitted.push(newPart);
                }

                this._computeAllSizes(splitted, context, reusableSize);
                line.splice(i, 1, ...splitted);
                i += splitted.length - 1;
            }
        }

        return line;
    }

    protected _parseStructuredTextLine(line: StructuredText, context: ICanvasRenderingContext): StructuredTextLine {
        this._splitIntoCharacters(line, context);
        const size = this._computeAllSizes(line , context);
        return { parts: line, metrics: new StructuredTextMetrics(size.width, size.height, size.ascent, size.descent) };
    }

    protected _parseStructuredTextLineEllipsis(line: StructuredText, width: number , context: ICanvasRenderingContext): StructuredTextLine {
        let size = this._computeAllSizes(line , context);

        while (line.length && size.width > width) {
            const _part = line[ line.length - 1 ];
            const characters = Array.from(_part.text);

            while (characters.length && size.width > width) {
                characters.pop() ;
                _part.text = characters.join('') + "…";
                delete _part.metrics;    // delete .metrics, so ._computeAllSizes() will re-compute it instead of using the existing one
                this._computeAllSizes(line , context, size);
            }

            if (size.width > width) {
                line.pop();
            }
        }

        this._splitIntoCharacters(line, context);
        return { parts: line, metrics: new StructuredTextMetrics(size.width, size.height, size.ascent, size.descent) };
    }

    // This splitting function does not exlude the splitter, it keeps it on the right-side of the split.
    protected static _defaultWordSplittingFunction(str: string): Array<string> {
        let match;
        let lastIndex = 0;
        const splitted = [];
        const regexp = / +/g;

        while (match = regexp.exec(str)) {
            if (lastIndex < match.index) {
                splitted.push(str.slice(lastIndex , match.index));
            }

            lastIndex = match.index;
        }

        if (lastIndex < str.length) {
            splitted.push(str.slice(lastIndex));
        }

        return splitted;
    }

    // Join consecutive parts sharing the exact same attributes.
    // It produces better results for underline and line-through, avoiding outline overlaps.
    protected static _fuseStructuredTextParts(structuredText: StructuredText): StructuredText {
        if (structuredText.length <= 1) { return structuredText ; }

        let last: IStructuredTextPart = structuredText[ 0 ];
        let lastInserted: IStructuredTextPart = last;
        const output: StructuredText = [ last ];

        for (let index = 1 ; index < structuredText.length ; index ++) {
            const part = structuredText[ index ];

            if (
                ! last.splitIntoCharacters && ! part.splitIntoCharacters
                && last.color === part.color
                && last.underline === part.underline
                && last.lineThrough === part.lineThrough
                && last.frame === part.frame && (! part.frame || (
                    last.frameColor === part.frameColor
                    && last.frameCornerRadius === part.frameCornerRadius
                    && last.frameOutlineWidth === part.frameOutlineWidth
                    && last.frameOutlineColor === part.frameOutlineColor
                ))
                && last.fontFamily === part.fontFamily
                && last.fontSize === part.fontSize
                && last.fontStyle === part.fontStyle
                && last.fontWeight === part.fontWeight
                && last.outlineWidth === part.outlineWidth && last.outlineColor === part.outlineColor
                && last.shadowColor === part.shadowColor && last.shadowBlur === part.shadowBlur
                && last.shadowOffsetX === part.shadowOffsetX && last.shadowOffsetY === part.shadowOffsetY
                && last.hover?.color === part.hover?.color
                && last.hover?.underline === part.hover?.underline
                && last.href === part.href
                && last.staticCustomData === part.staticCustomData
            ) {
                lastInserted.text += part.text;

                // Note that it's always defined at that point
                if (lastInserted.metrics && part.metrics) {
                    lastInserted.metrics.fuseWithRightPart(part.metrics);
                }
            }
            else {
                output.push(part);
                lastInserted = part;
            }

            last = part;
        }

        return output;
    }

    // Set the width of each parts and return the total width
    protected _computeAllSizes(structuredText: StructuredText, context: ICanvasRenderingContext, size: Size = { width: 0, height: 0, ascent: 0, descent: 0 }): Size {
        let contextSaved = false;
        size.width = 0;
        size.height = 0;
        size.ascent = 0;
        size.descent = 0;

        for ( let part of structuredText) {
            if (! part.metrics) {
                if (! contextSaved) { context.save(); }

                const attr = this._inheritAttributes(part);
                this._setContextAttributesForMeasure(context , attr);

                const textMetrics = context.measureText(part.text);
                // .actualBoundingBox* does not work: sometime it skips spaces, also it's not widely supported
                const width = textMetrics.width;
                const fontOffset = Control._GetFontOffset(context.font);

                part.metrics = new StructuredTextMetrics(width, fontOffset.height, fontOffset.ascent, fontOffset.descent);
            }

            size.width += part.metrics.width;
            if (part.metrics.height > size.height) { size.height = part.metrics.height ; }
            if (part.metrics.ascent > size.ascent) { size.ascent = part.metrics.ascent ; }
            if (part.metrics.descent > size.descent) { size.descent = part.metrics.descent ; }
        }

        if (contextSaved) { context.restore(); }

        return size;
    }

    protected _parseStructuredTextLineWordWrap(line: StructuredText, width: number, context: ICanvasRenderingContext): StructuredTextLines {
        const lines: StructuredTextLines = [];
        const words: StructuredText = [];
        const wordSplittingFunction = this.wordSplittingFunction || StructuredTextBlock._defaultWordSplittingFunction;

        // Split each part of the line
        for (let _part of line) {
            for (let wordText of wordSplittingFunction(_part.text)) {
                let _word: IStructuredTextPart = Object.assign({} , _part);
                _word.text = wordText;
                words.push(_word);
            }
        }

        let lastTestSize = { width: 0, height: 0, ascent: 0, descent: 0 };
        let testSize = { width: 0, height: 0, ascent: 0, descent: 0 };
        let tmp = null;
        let testLine: StructuredText = [];

        for (let _word of words) {
            testLine.push(_word);
            // swap
            tmp = lastTestSize; lastTestSize = testSize; testSize = tmp;
            this._computeAllSizes(testLine , context, testSize);

            if (testSize.width > width && testLine.length > 1) {
                testLine.pop();
                lines.push({
                    parts: this._splitIntoCharacters(StructuredTextBlock._fuseStructuredTextParts(testLine), context),
                    metrics: new StructuredTextMetrics(lastTestSize.width, lastTestSize.height, lastTestSize.ascent, lastTestSize.descent)
                });

                // Create a new line with the current word as the first word.
                // We have to left-trim it because it mays contain a space.
                _word.text = _word.text.trimStart();
                delete _word.metrics;    // delete .metrics, so ._computeAllSizes() will re-compute it instead of using the existing one
                testLine = [ _word ];
                this._computeAllSizes(testLine , context, testSize);
            }
        }

        lines.push({
            parts: this._splitIntoCharacters(StructuredTextBlock._fuseStructuredTextParts(testLine), context),
            metrics: new StructuredTextMetrics(testSize.width, testSize.height, testSize.ascent, testSize.descent)
        });

        return lines;
    }

    protected _computeXYOffset(): void {
        this._xOffset = this._currentMeasure.left + this._scrollX;
        this._yOffset = this._currentMeasure.top + this._scrollY;

        switch (this._textVerticalAlignment) {
            // No offset, so nothing to do for top alignment
            //case Control.VERTICAL_ALIGNMENT_TOP:
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                this._yOffset += this._currentMeasure.height - this._contentHeight;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                this._yOffset += (this._currentMeasure.height - this._contentHeight) / 2;
                break;
        }
    }

    public getTextPartAt(x: number, y: number): undefined | IStructuredTextPart {
        this._computeXYOffset();
        x -= this._xOffset;
        y -= this._yOffset;
        const line = this._lines.find( _line => _line.metrics && y >= _line.metrics.baselineY - _line.metrics.ascent && y <= _line.metrics.baselineY + _line.metrics.descent);
        if (! line) { return; }
        return line.parts.find( part => part.metrics && x >= part.metrics.x && x <= part.metrics.x + part.metrics.width);
    }

    /** @hidden */
    public _draw(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>): void {
        context.save();
        this._applyStates(context);
        // Render lines
        this._renderLines(context);
        context.restore();
    }

    protected _renderLines(context: ICanvasRenderingContext): void {
        this._computeXYOffset();
        let charCount = 0;

        for (let line of this._lines) {
            for (let part of line.parts) {
                if (charCount >= this._characterLimit) { return; }

                // Note that it's always defined at that point
                if (!part.metrics) { continue; }

                const attr = this._inheritAttributes(part);

                if (charCount + part.text.length > this._characterLimit) {
                    this._drawText(part.text.slice(0, this._characterLimit - charCount), attr, this._xOffset + part.metrics.x, this._yOffset + part.metrics.baselineY, -1 , part.metrics.height, context);
                    return;
                }

                this._drawText(part.text, attr, this._xOffset + part.metrics.x, this._yOffset + part.metrics.baselineY, part.metrics.width, part.metrics.height, context);
                charCount += part.text.length;
            }
        }
    }

    protected _drawText(text: string, attr: TextPartAttributes, x: number, y: number, width: number, height: number, context: ICanvasRenderingContext): void {
        const thickness = Math.ceil(this.fontSizeInPixels * this._decorationRelativeThickness);
        const underlineYOffset = Math.ceil(this.fontSizeInPixels * this._underlineRelativeY);
        const lineThroughYOffset = Math.ceil(this.fontSizeInPixels * this._lineThroughRelativeY);
        const decorationOverlap = Math.ceil(this.fontSizeInPixels * 0.04);

        if (width === -1 && (attr.underline || attr.lineThrough || attr.frame)) {
            // Here we have to dynamicly re-compute the width
            this._setContextAttributesForMeasure(context, attr);
            width = context.measureText(text).width;
        }

        if (attr.frame) {
            const frameOffset = Math.round(this.fontSizeInPixels / 3);
            this._drawFrame(attr, x - decorationOverlap, y - height + frameOffset, width + 2 * decorationOverlap, height, context);
        }

        this._setContextAttributes(context, attr);

        if (attr.outlineWidth) {
            if (attr.underline) {
                context.strokeRect(x - decorationOverlap, y + underlineYOffset, width + 2 * decorationOverlap, thickness);
            }

            context.strokeText(text, x, y);

            if (attr.lineThrough) {
                context.strokeRect(x - decorationOverlap, y + lineThroughYOffset, width + 2 * decorationOverlap, thickness);
            }
        }

        if (attr.underline) {
            context.fillRect(x - decorationOverlap, y + underlineYOffset, width + 2 * decorationOverlap, thickness);
        }

        context.fillText(text, x, y);

        if (attr.lineThrough) {
            context.fillRect(x - decorationOverlap, y + lineThroughYOffset, width + 2 * decorationOverlap, thickness);
        }
    }

    protected _drawFrame(attr: TextPartAttributes, x: number, y: number, width: number, height: number, context: ICanvasRenderingContext): void {
        context.fillStyle = attr.frameColor;
        const radius = attr.frameCornerRadius;

        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();

        if (attr.frameOutlineWidth) {
            context.lineWidth = attr.frameOutlineWidth;
            context.strokeStyle = attr.frameOutlineColor;
            context.stroke();
        }

        context.fill();
    }

    /** @hidden */
    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean, pi?: PointerInfoBase): void {
        if (! this._isEnabled && ! this._hasHref) { return; }
        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick, pi);

        const part = this.getTextPartAt(coordinates.x, coordinates.y);
        if (! part || ! part.href) { return; }

        this.onClickHrefObservable.notifyObservers({target: this, href: part.href, part});
    }

    /** @hidden */
    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number, pi: PointerInfoBase): void {
        if (! this._isEnabled) { return; }

        if (! this._hasHoverStyle && ! this._hasHref) {
            this._updateHoveringPart(null);
            return;
        }

        const part = this.getTextPartAt(coordinates.x, coordinates.y);
        if (! part || (! part.hover && ! part.href)) {
            this._updateHoveringPart(null);
            return;
        }

        this._updateHoveringPart(part);
    }

    /** @hidden */
    public _onPointerOut(target: Control, pi: Nullable<PointerInfoBase>, force = false): void {
        this._updateHoveringPart(null);
    }

    /** @hidden */
    private _updateHoveringPart(part: null | IStructuredTextPart) {
        if (! this._isEnabled) { return; }

        if (part !== this._hoveringPart) {
            if (this._hoveringPart?.href) {
                this.onOutHrefObservable.notifyObservers({target: this, href: this._hoveringPart.href, part: this._hoveringPart});
            }
            this._hoveringPart = part;
            if (part?.href) {
                this.onEnterHrefObservable.notifyObservers({target: this, href: part.href, part});
            }
            this._markAsDirty();
        }
    }

    /** @hidden */
    public _onWheelScroll(deltaX?: number, deltaY?: number): void {
        if (! this._isEnabled || ! this._scrollable) { return; }
        if (deltaX) { this.scrollX -= Math.round(Math.sign(deltaX) * 0.125 * this._currentMeasure.width); }
        if (deltaY) { this.scrollY -= Math.round(Math.sign(deltaY) * 0.125 * this._currentMeasure.height); }
    }

    dispose(): void {
        super.dispose();
        this.onTextChangedObservable.clear();
    }
}

RegisterClass("BABYLON.GUI.StructuredTextBlock", StructuredTextBlock);
