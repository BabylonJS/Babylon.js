import { Observable } from "core/Misc/observable";
import type { Measure } from "../measure";
import { ValueAndUnit } from "../valueAndUnit";
import { Control } from "./control";
import { RegisterClass } from "core/Misc/typeStore";
import type { Nullable } from "core/types";
import { serialize } from "core/Misc/decorators";
import type { ICanvasRenderingContext, ITextMetrics } from "core/Engines/ICanvas";
import { EngineStore } from "core/Engines/engineStore";

/**
 * Enum that determines the text-wrapping mode to use.
 */
export const enum TextWrapping {
    /**
     * Clip the text when it's larger than Control.width; this is the default mode.
     */
    Clip = 0,

    /**
     * Wrap the text word-wise, i.e. try to add line-breaks at word boundary to fit within Control.width.
     */
    WordWrap = 1,

    /**
     * Ellipsize the text, i.e. shrink with trailing … when text is larger than Control.width.
     */
    Ellipsis = 2,

    /**
     * Wrap the text word-wise and clip the text when the text's height is larger than the Control.height, and shrink the last line with trailing … .
     */
    WordWrapEllipsis = 3,

    /**
     * Use HTML to wrap the text. This is the only mode that supports east-asian languages.
     */
    HTML = 4,
}

/**
 * Class used to create text block control
 */
export class TextBlock extends Control {
    private _text = "";
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
    private _wordDivider: string = " ";
    private _forceResizeWidth: boolean = false;
    private _applyOutlineToUnderline: boolean = false;

    /**
     * An event triggered after the text is changed
     */
    public onTextChangedObservable = new Observable<TextBlock>();

    /**
     * An event triggered after the text was broken up into lines
     */
    public onLinesReadyObservable = new Observable<TextBlock>();

    /**
     * Function used to split a string into words. By default, a string is split at each space character found
     */
    public wordSplittingFunction: Nullable<(line: string) => string[]>;

    /**
     * This function will be called when a new HTML element is generated to be used for word wrapping.
     * This is only used when wrapping mode HTML is selected.
     * Using this function you can adjust word-break, overflow-wrap, hyphens, or any other CSS properties of the HTML element, language-dependent.
     */
    public adjustWordWrappingHTMLElement: Nullable<(element: HTMLElement) => void>;

    /**
     * Gets or sets a boolean indicating if the HTML element generated for word wrapping should be reused or removed after each wrapping.
     */
    public reuseHTMLForWordWrapping: boolean = false;

    /**
     * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
     */
    public get lines(): any[] {
        return this._lines;
    }

    /**
     * Gets or sets a boolean indicating that the TextBlock will be resized to fit its content

     */
    @serialize()
    public get resizeToFit(): boolean {
        return this._resizeToFit;
    }

    /**
     * Gets or sets a boolean indicating that the TextBlock will be resized to fit its content

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

        this._markAsDirty();
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
        this._markAsDirty();
    }

    /**
     * Gets or sets text to display
     */
    @serialize()
    public get text(): string {
        return this._text;
    }

    /**
     * Gets or sets text to display
     */
    public set text(value: string) {
        if (this._text === value) {
            return;
        }
        this._text = value + ""; // Making sure it is a text
        this._markAsDirty();

        this.onTextChangedObservable.notifyObservers(this);
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
     * If the outline should be applied to the underline/strike-through too. Has different behavior in Edge/Chrome vs Firefox.
     */
    @serialize()
    public get applyOutlineToUnderline(): boolean {
        return this._applyOutlineToUnderline;
    }

    public set applyOutlineToUnderline(value: boolean) {
        if (this._applyOutlineToUnderline === value) {
            return;
        }
        this._applyOutlineToUnderline = value;
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
     * Gets or sets word divider
     */
    @serialize()
    public get wordDivider(): string {
        return this._wordDivider;
    }

    /**
     * Gets or sets word divider
     */
    public set wordDivider(value: string) {
        if (this._wordDivider === value) {
            return;
        }
        this._wordDivider = value;
        this._markAsDirty();
    }

    /**
     * By default, if a text block has text wrapping other than Clip, its width
     * is not resized even if resizeToFit = true. This parameter forces the width
     * to be resized.
     */
    @serialize()
    public get forceResizeWidth(): boolean {
        return this._forceResizeWidth;
    }

    public set forceResizeWidth(value: boolean) {
        if (this._forceResizeWidth === value) {
            return;
        }
        this._forceResizeWidth = value;
        this._markAsDirty();
    }

    /**
     * Creates a new TextBlock object
     * @param name defines the name of the control
     * @param text defines the text to display (empty string by default)
     */
    constructor(
        /**
         * Defines the name of the control
         */
        public override name?: string,
        text: string = ""
    ) {
        super(name);

        this.text = text;
    }

    protected override _getTypeName(): string {
        return "TextBlock";
    }

    protected override _processMeasures(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        super._processMeasures(parentMeasure, context);

        // Apply states so we can use the right font to measure
        context.save();
        this._applyStates(context);

        // Measure the font
        if (!this._fontOffset || this.isDirty) {
            this._fontOffset = Control._GetFontOffset(context.font, this._host.getScene()?.getEngine());
        }

        // Prepare lines
        this._lines = this._breakLines(this._currentMeasure.width, this._currentMeasure.height, context);
        this.onLinesReadyObservable.notifyObservers(this);

        // Restore context now that we're done measuring the font
        context.restore();

        let maxLineWidth: number = 0;

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (line.width > maxLineWidth) {
                maxLineWidth = line.width;
            }
        }

        if (this._resizeToFit) {
            if (this._textWrapping === TextWrapping.Clip || this._forceResizeWidth) {
                const newWidth = Math.ceil(this._paddingLeftInPixels) + Math.ceil(this._paddingRightInPixels) + Math.ceil(maxLineWidth);
                if (newWidth !== this._width.getValueInPixel(this._host, this._tempParentMeasure.width)) {
                    this._width.updateInPlace(newWidth, ValueAndUnit.UNITMODE_PIXEL);
                    this._rebuildLayout = true;
                }
            }
            let newHeight = (this._paddingTopInPixels + this._paddingBottomInPixels + this._fontOffset.height * this._lines.length) | 0;

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

    private _drawText(text: string, textWidth: number, y: number, context: ICanvasRenderingContext): void {
        const width = this._currentMeasure.width;
        let x = 0;
        switch (this._textHorizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x = 0;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x = width - textWidth;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x = (width - textWidth) / 2;
                break;
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            const idealRatio = this.host.idealRatio;
            context.shadowOffsetX = this.shadowOffsetX * idealRatio;
            context.shadowOffsetY = this.shadowOffsetY * idealRatio;
        }

        if (this.outlineWidth) {
            context.strokeText(text, this._currentMeasure.left + x, y);
        }
        context.fillText(text, this._currentMeasure.left + x, y);

        if (this._underline) {
            this._drawLine(this._currentMeasure.left + x, y + 3, this._currentMeasure.left + x + textWidth, y + 3, context);
        }

        if (this._lineThrough) {
            this._drawLine(this._currentMeasure.left + x, y - this.fontSizeInPixels / 3, this._currentMeasure.left + x + textWidth, y - this.fontSizeInPixels / 3, context);
        }
    }

    private _drawLine(xFrom: number, yFrom: number, xTo: number, yTo: number, context: ICanvasRenderingContext): void {
        context.beginPath();
        context.lineWidth = Math.round(this.fontSizeInPixels * 0.05);
        context.moveTo(xFrom, yFrom);
        context.lineTo(xTo, yTo);
        if (this.outlineWidth && this.applyOutlineToUnderline) {
            context.stroke();
            context.fill();
        } else {
            const currentStroke = context.strokeStyle;
            context.strokeStyle = context.fillStyle;
            context.stroke();
            context.strokeStyle = currentStroke;
        }
        context.closePath();
    }

    /**
     * @internal
     */
    public override _draw(context: ICanvasRenderingContext): void {
        context.save();

        this._applyStates(context);

        // Render lines
        this._renderLines(context);

        context.restore();
    }

    protected override _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
            context.lineJoin = "miter";
            context.miterLimit = 2;
        }
    }

    private _linesTemp: object[] = [];

    protected _breakLines(refWidth: number, refHeight: number, context: ICanvasRenderingContext): object[] {
        this._linesTemp.length = 0;
        const _lines = this._textWrapping === TextWrapping.HTML ? this._parseHTMLText(refWidth, refHeight, context) : this.text.split("\n");

        switch (this._textWrapping) {
            case TextWrapping.WordWrap:
                for (const _line of _lines) {
                    this._linesTemp.push(...this._parseLineWordWrap(_line, refWidth, context));
                }
                break;
            case TextWrapping.Ellipsis:
                for (const _line of _lines) {
                    this._linesTemp.push(this._parseLineEllipsis(_line, refWidth, context));
                }
                break;
            case TextWrapping.WordWrapEllipsis:
                for (const _line of _lines) {
                    this._linesTemp.push(...this._parseLineWordWrapEllipsis(_line, refWidth, refHeight, context));
                }
                break;
            case TextWrapping.HTML:
            default:
                for (const _line of _lines) {
                    this._linesTemp.push(this._parseLine(_line, context));
                }
                break;
        }

        return this._linesTemp;
    }

    private _htmlElement: Nullable<HTMLElement> = null;

    protected _parseHTMLText(refWidth: number, refHeight: number, context: ICanvasRenderingContext): string[] {
        const lines = [] as string[];
        if (!this._htmlElement) {
            this._htmlElement = document.createElement("div");
            document.body.appendChild(this._htmlElement);
        }
        const htmlElement = this._htmlElement;
        htmlElement.textContent = this.text;
        htmlElement.style.font = context.font;
        htmlElement.style.position = "absolute";
        htmlElement.style.visibility = "hidden";
        htmlElement.style.top = "-1000px";
        htmlElement.style.left = "-1000px";
        this.adjustWordWrappingHTMLElement?.(htmlElement);
        htmlElement.style.width = refWidth + "px";
        htmlElement.style.height = refHeight + "px";
        const textContent = htmlElement.textContent;
        if (!textContent) {
            return lines;
        }
        // get the text node
        const textNode = htmlElement.childNodes[0];
        const range = document.createRange();
        let idx = 0;
        for (const c of textContent) {
            range.setStart(textNode, 0);
            range.setEnd(textNode, idx + 1);
            // "select" text from beginning to this position to determine the line
            const lineIndex = range.getClientRects().length - 1;
            lines[lineIndex] = (lines[lineIndex] || "") + c;
            idx++;
        }

        if (!this.reuseHTMLForWordWrapping) {
            htmlElement.remove();
            this._htmlElement = null;
        }

        return lines;
    }

    protected _parseLine(line: string = "", context: ICanvasRenderingContext): object {
        return { text: line, width: this._getTextMetricsWidth(context.measureText(line)) };
    }

    //Calculate how many characters approximately we need to remove
    private _getCharsToRemove(lineWidth: number, width: number, lineLength: number) {
        const diff = lineWidth > width ? lineWidth - width : 0;
        // This isn't exact unless the font is monospaced
        const charWidth = lineWidth / lineLength;
        const removeChars = Math.max(Math.floor(diff / charWidth), 1);
        return removeChars;
    }

    protected _parseLineEllipsis(line: string = "", width: number, context: ICanvasRenderingContext): object {
        let lineWidth = this._getTextMetricsWidth(context.measureText(line));

        let removeChars = this._getCharsToRemove(lineWidth, width, line.length);

        // unicode support. split('') does not work with unicode!
        // make sure Array.from is available
        const characters = Array.from && Array.from(line);
        if (!characters) {
            // no array.from, use the old method
            while (line.length > 2 && lineWidth > width) {
                line = line.slice(0, -removeChars);
                lineWidth = this._getTextMetricsWidth(context.measureText(line + "…"));

                removeChars = this._getCharsToRemove(lineWidth, width, line.length);
            }
            // Add on the end
            line += "…";
        } else {
            while (characters.length && lineWidth > width) {
                characters.splice(characters.length - removeChars, removeChars);
                line = `${characters.join("")}…`;
                lineWidth = this._getTextMetricsWidth(context.measureText(line));

                removeChars = this._getCharsToRemove(lineWidth, width, line.length);
            }
        }

        return { text: line, width: lineWidth };
    }

    private _getTextMetricsWidth(textMetrics: ITextMetrics) {
        if (textMetrics.actualBoundingBoxLeft !== undefined) {
            return Math.abs(textMetrics.actualBoundingBoxLeft) + Math.abs(textMetrics.actualBoundingBoxRight);
        }
        return textMetrics.width;
    }

    protected _parseLineWordWrap(line: string = "", width: number, context: ICanvasRenderingContext): object[] {
        const lines = [];
        const words = this.wordSplittingFunction ? this.wordSplittingFunction(line) : line.split(this._wordDivider);
        let lineWidth = this._getTextMetricsWidth(context.measureText(line));

        for (let n = 0; n < words.length; n++) {
            const testLine = n > 0 ? line + this._wordDivider + words[n] : words[0];
            const testWidth = this._getTextMetricsWidth(context.measureText(testLine));
            if (testWidth > width && n > 0) {
                lines.push({ text: line, width: lineWidth });
                line = words[n];
                lineWidth = this._getTextMetricsWidth(context.measureText(line));
            } else {
                lineWidth = testWidth;
                line = testLine;
            }
        }
        lines.push({ text: line, width: lineWidth });

        return lines;
    }

    protected _parseLineWordWrapEllipsis(line: string = "", width: number, height: number, context: ICanvasRenderingContext): object[] {
        const lines = this._parseLineWordWrap(line, width, context);
        for (let n = 1; n <= lines.length; n++) {
            const currentHeight = this._computeHeightForLinesOf(n);
            if (currentHeight > height && n > 1) {
                const lastLine = lines[n - 2] as { text: string; width: number };
                const currentLine = lines[n - 1] as { text: string; width: number };
                lines[n - 2] = this._parseLineEllipsis(lastLine.text + this._wordDivider + currentLine.text, width, context);
                const linesToRemove = lines.length - n + 1;
                for (let i = 0; i < linesToRemove; i++) {
                    lines.pop();
                }
                return lines;
            }
        }

        return lines;
    }

    protected _renderLines(context: ICanvasRenderingContext): void {
        if (!this._fontOffset || !this._lines) {
            return;
        }
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

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (i !== 0 && this._lineSpacing.internalValue !== 0) {
                if (this._lineSpacing.isPixel) {
                    rootY += this._lineSpacing.getValue(this._host);
                } else {
                    rootY = rootY + this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
                }
            }

            this._drawText(line.text, line.width, rootY, context);
            rootY += this._fontOffset.height;
        }
    }

    private _computeHeightForLinesOf(lineCount: number): number {
        let newHeight = this._paddingTopInPixels + this._paddingBottomInPixels + this._fontOffset.height * lineCount;

        if (lineCount > 0 && this._lineSpacing.internalValue !== 0) {
            let lineSpacing = 0;
            if (this._lineSpacing.isPixel) {
                lineSpacing = this._lineSpacing.getValue(this._host);
            } else {
                lineSpacing = this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height);
            }

            newHeight += (lineCount - 1) * lineSpacing;
        }

        return newHeight;
    }

    public override isDimensionFullyDefined(dim: "width" | "height"): boolean {
        if (this.resizeToFit) {
            return true;
        }
        return super.isDimensionFullyDefined(dim);
    }

    /**
     * Given a width constraint applied on the text block, find the expected height
     * @returns expected height
     */
    public computeExpectedHeight(): number {
        if (this.text && this.widthInPixels) {
            // Should abstract platform instead of using LastCreatedEngine
            const context = EngineStore.LastCreatedEngine?.createCanvas(0, 0).getContext("2d");
            if (context) {
                // This is a temporary context, no need to save/restore
                // eslint-disable-next-line babylonjs/require-context-save-before-apply-states
                this._applyStates(context);
                if (!this._fontOffset) {
                    this._fontOffset = Control._GetFontOffset(context.font, this._host.getScene()?.getEngine());
                }
                const lines = this._lines
                    ? this._lines
                    : this._breakLines(
                          this.widthInPixels - this._paddingLeftInPixels - this._paddingRightInPixels,
                          this.heightInPixels - this._paddingTopInPixels - this._paddingBottomInPixels,
                          context
                      );
                return this._computeHeightForLinesOf(lines.length);
            }
        }
        return 0;
    }

    override dispose(): void {
        super.dispose();

        this.onTextChangedObservable.clear();
        this._htmlElement?.remove();
        this._htmlElement = null;
    }
}
RegisterClass("BABYLON.GUI.TextBlock", TextBlock);
