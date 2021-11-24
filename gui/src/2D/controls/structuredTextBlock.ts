import { Observable } from "babylonjs/Misc/observable";
import { Measure } from "../measure";
import { ValueAndUnit } from "../valueAndUnit";
import { Control } from "./control";
import { TextWrapping } from "./textBlock";
import { RegisterClass } from "babylonjs/Misc/typeStore";
import { Nullable } from "babylonjs/types";
import { serialize } from 'babylonjs/Misc/decorators';
import { ICanvasRenderingContext , ICanvasGradient } from 'babylonjs/Engines/ICanvas';
import { IStructuredTextPart } from './iStructuredTextPart';
import { Engine } from 'babylonjs/Engines/engine';

type StructuredText = Array<IStructuredTextPart>;

type StructuredTextLine = {
    parts: StructuredText;

    // Computed line width
    width?: number;
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

    // For instance, font size and family is not updatable, the whole StructuredTextBlock shares the same size and family (not useful and it introduces complexity)
    fontStyle: string;
    fontWeight: string;

    outlineWidth: number;
    outlineColor: string;

    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
};

/**
 * Class used to create structured text block control
 */
//export class StructuredTextBlock extends TextBlock {
export class StructuredTextBlock extends Control {
    private _structuredText: StructuredText = [];
    private _textWrapping = TextWrapping.Clip;
    private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
    private _lines: any[];
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

    // Useful for various optimization (e.g. avoiding parsing lines when it shouldn't)
    private _characterCount: number = 0;
    private _characterLimit: number = Infinity;
    private _lastMeasuredWidth: number = 0;
    private _linesAreDirty: boolean = true;

    /**
     * An event triggered after the text is changed
     */
    public onTextChangedObservable = new Observable<StructuredTextBlock>();

    /**
     * An event triggered after the text was broken up into lines
     */
    public onLinesReadyObservable = new Observable<StructuredTextBlock>();

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
        this._characterCount = this._structuredText.reduce((count, part) => count + part.text.length, 0);
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
    public get lines(): any[] {
        return this._lines;
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
    * Gets the character count of the current structuredText
    */
    public get characterCount(): number {
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
    private _setContextAttributes(context: ICanvasRenderingContext, attr: TextPartAttributes) {
        // .fillStyle and .strokeStyle can receive a CSS color string, a CanvasGradient or a CanvasPattern,
        // but here we just care about color string.
        context.fillStyle = attr.color;

        // Disallow changing font size and family? If this would be allowed, line-height computing would need to be upgraded...
        context.font = attr.fontStyle + " " + attr.fontWeight + " " + this.fontSize + " " + this._fontFamily;

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
    private _setContextAttributesForMeasure(context: ICanvasRenderingContext, attr: TextPartAttributes) {
        context.font = attr.fontStyle + " " + attr.fontWeight + " " + this.fontSize + " " + this._fontFamily ;
    }

    // Compute an attribute object from a text's part, inheriting from this
    private _inheritAttributes(part: IStructuredTextPart): TextPartAttributes {
        return {
            color: part.color ?? this.color ,
            outlineWidth: part.outlineWidth ?? this._outlineWidth ,
            outlineColor: part.outlineColor ?? this._outlineColor ,
            shadowColor: part.shadowColor ?? this.shadowColor ,
            shadowBlur: part.shadowBlur ?? this.shadowBlur ,
            shadowOffsetX: part.shadowOffsetX ?? this.shadowOffsetX ,
            shadowOffsetY: part.shadowOffsetY ?? this.shadowOffsetY ,
            underline: part.underline ?? this._underline ,
            lineThrough: part.lineThrough ?? this._lineThrough ,
            frame: !! part.frame ,
            frameColor: part.frameColor ?? this._frameColor,
            frameOutlineWidth: part.frameOutlineWidth ?? this._frameOutlineWidth ,
            frameOutlineColor: part.frameOutlineColor ?? this._frameOutlineColor ,
            frameCornerRadius: part.frameCornerRadius ?? this._frameCornerRadius,

            // For instance, font size and family is not updatable, the whole StructuredTextBlock shares the same size and family (not useful and it introduces complexity)
            fontStyle: part.fontStyle ?? this._style?.fontStyle ?? this._fontStyle ,
            fontWeight: part.fontWeight ?? this._style?.fontWeight ?? this._fontWeight ,
        };
    }

    /**
     * Given a width constraint applied on the text block, find the expected height
     * @returns expected height
     */
    public computeExpectedHeight(): number {
        if (this._structuredText.length && this.widthInPixels) {
            // Shoudl abstract platform instead of using LastCreatedEngine
            const context = Engine.LastCreatedEngine?.createCanvas(0, 0).getContext("2d");
            if (context) {
                this._applyStates(context);
                if (!this._fontOffset) {
                    this._fontOffset = Control._GetFontOffset(context.font);
                }
                const lines = this._lines ? this._lines : this._breakLines(this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels, context);

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
            this._lines = this._breakLines(this._currentMeasure.width, context);
            this.onLinesReadyObservable.notifyObservers(this);
            this._lastMeasuredWidth = this._currentMeasure.width;
            this._linesAreDirty = false;
        }

        let maxLineWidth: number = 0;

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (line.width > maxLineWidth) {
                maxLineWidth = line.width;
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

    protected _breakLines(refWidth: number, context: ICanvasRenderingContext): StructuredTextLines {
        let _newPart;
        const lines: StructuredTextLines = [];
        let _currentLine: StructuredText = [];
        const _lines: Array<StructuredText> = [ _currentLine ];

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

    protected _parseStructuredTextLine(line: StructuredText, context: ICanvasRenderingContext): StructuredTextLine {
        const lineWidth = this._structuredTextWidth(line , context);
        return { parts: line, width: lineWidth };
    }

    protected _parseStructuredTextLineEllipsis(line: StructuredText, width: number , context: ICanvasRenderingContext): StructuredTextLine {
        let lineWidth = this._structuredTextWidth(line , context);

        while (line.length && lineWidth > width) {
            const _part = line[ line.length - 1 ];
            const characters = Array.from(_part.text);

            while (characters.length && lineWidth > width) {
                characters.pop() ;

                _part.text = characters.join('') + "…";
                delete _part.width;    // delete .width, so ._structuredTextWidth() will re-compute it instead of using the existing one
                lineWidth = this._structuredTextWidth(line , context);
            }

            if (lineWidth > width) {
                line.pop();
            }
        }

        return { parts: line, width: lineWidth };
    }

    // This splitting function does not exlude the splitter, it keeps it on the right-side of the split.
    protected static _defaultWordSplittingFunction(str: string): Array<string> {
        let match;
        let lastIndex = 0;
        const splitted = [];
        const regexp = / +/g;

        //str = str.trim() ;

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
                last.color === part.color
                && last.underline === part.underline
                && last.lineThrough === part.lineThrough
                && last.frame === part.frame && (! part.frame || (
                    last.frameColor === part.frameColor
                    && last.frameCornerRadius === part.frameCornerRadius
                    && last.frameOutlineWidth === part.frameOutlineWidth
                    && last.frameOutlineColor === part.frameOutlineColor
                ))
                && last.fontStyle === part.fontStyle
                && last.fontWeight === part.fontWeight
                && last.outlineWidth === part.outlineWidth && last.outlineColor === part.outlineColor
                && last.shadowColor === part.shadowColor && last.shadowBlur === part.shadowBlur
                && last.shadowOffsetX === part.shadowOffsetX && last.shadowOffsetY === part.shadowOffsetY
            ) {
                lastInserted.text += part.text;
                lastInserted.width = (lastInserted.width || 0) + (part.width || 0);   // It's never undefined here, but it's needed to please tsc
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
    protected _structuredTextWidth(structuredText: StructuredText, context: ICanvasRenderingContext): number {
        let contextSaved = false;

        let _width = structuredText.reduce((width , part) => {
            if (part.width === undefined) {
                if (! contextSaved) { context.save() ; }

                const attr = this._inheritAttributes(part);
                this._setContextAttributesForMeasure(context , attr);

                const textMetrics = context.measureText(part.text);

                // .actualBoundingBox* does not work: sometime it skips spaces, also it's not widely supported
                part.width = textMetrics.width;
                //part.width = Math.abs( textMetrics.actualBoundingBoxLeft ) + Math.abs( textMetrics.actualBoundingBoxRight ) ;
                //part.width = Math.abs( textMetrics.actualBoundingBoxRight - textMetrics.actualBoundingBoxLeft ) ;
            }

            return width + part.width;
        } , 0);

        if (contextSaved) { context.restore(); }

        return _width;
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

        let lastTestWidth = 0;
        let testWidth = 0;
        let testLine: StructuredText = [];

        for (let _word of words) {
            testLine.push(_word);
            lastTestWidth = testWidth;
            testWidth = this._structuredTextWidth(testLine , context);

            if (testWidth > width && testLine.length > 1) {
                testLine.pop();
                //lines.push( { parts: testLine , width: lastTestWidth } ) ;
                lines.push({ parts: StructuredTextBlock._fuseStructuredTextParts(testLine) , width: lastTestWidth });

                // Create a new line with the current word as the first word.
                // We have to left-trim it because it mays contain a space.
                _word.text = _word.text.trimStart();
                delete _word.width;    // delete .width, so ._structuredTextWidth() will re-compute it instead of using the existing one
                testLine = [ _word ];
                testWidth = this._structuredTextWidth(testLine , context);
            }
        }

        lines.push({ parts: StructuredTextBlock._fuseStructuredTextParts(testLine) , width: testWidth });

        return lines;
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
        const height = this._currentMeasure.height;
        let rootY = 0;

        switch (this._textVerticalAlignment) {
            case Control.VERTICAL_ALIGNMENT_TOP:
                rootY = this._fontOffset.ascent;
                break;
            case Control.VERTICAL_ALIGNMENT_BOTTOM:
                rootY = height - this._fontOffset.height * (this._lines.length - 1) - this._fontOffset.descent;
                break;
            case Control.VERTICAL_ALIGNMENT_CENTER:
                rootY = this._fontOffset.ascent + (height - this._fontOffset.height * this._lines.length) / 2;
                break;
        }

        rootY += this._currentMeasure.top;
        let charCount = 0;
        const width = this._currentMeasure.width;
        const lineSpacing = this._lineSpacing.isPixel ? this._lineSpacing.getValue(this._host) : this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
        const lineHeight = this._fontOffset.height;

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];
            let x = 0;

            switch (this._textHorizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = width - line.width;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (width - line.width) / 2;
                    break;
            }

            // Add the margin
            x += this._currentMeasure.left;

            for (let part of line.parts) {
                const partWidth = part.width || 0;
                if (charCount >= this._characterLimit) { return; }

                const attr = this._inheritAttributes(part);

                if (charCount + part.text.length <= this._characterLimit) {
                    this._drawText(part.text, attr, x, rootY, partWidth, lineHeight, context);
                }
                else {
                    this._drawText(part.text.slice(0, this._characterLimit - charCount), attr, x, rootY, 0 , lineHeight, context);
                }

                x += partWidth;
                charCount += part.text.length;
            }

            rootY += lineHeight + lineSpacing;
        }
    }

    protected _drawText(text: string, attr: TextPartAttributes, x: number, y: number, width: number, height: number, context: ICanvasRenderingContext): void {
        const thickness = Math.ceil(this.fontSizeInPixels * this._decorationRelativeThickness);
        const underlineYOffset = Math.ceil(this.fontSizeInPixels * this._underlineRelativeY);
        const lineThroughYOffset = Math.ceil(this.fontSizeInPixels * this._lineThroughRelativeY);
        const decorationOverlap = Math.ceil(this.fontSizeInPixels * 0.04);

        if (! width && (attr.underline || attr.lineThrough || attr.frame)) {
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

    private _drawFrame(attr: TextPartAttributes, x: number, y: number, width: number, height: number, context: ICanvasRenderingContext): void {
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

    dispose(): void {
        super.dispose();
        this.onTextChangedObservable.clear();
    }
}
RegisterClass("BABYLON.GUI.StructuredTextBlock", StructuredTextBlock);
