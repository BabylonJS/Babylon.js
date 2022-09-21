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
export enum TextWrapping {
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
    WordWrapEllipsis,
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
     * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
     */
    public get lines(): any[] {
        return this._lines;
    }

    /**
     * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
     */
    @serialize()
    public get resizeToFit(): boolean {
        return this._resizeToFit;
    }

    /**
     * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
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
     * Creates a new TextBlock object
     * @param name defines the name of the control
     * @param text defines the text to display (empty string by default)
     */
    constructor(
        /**
         * Defines the name of the control
         */
        public name?: string,
        text: string = ""
    ) {
        super(name);

        this.text = text;
    }

    protected _getTypeName(): string {
        return "TextBlock";
    }

    protected _processMeasures(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        if (!this._fontOffset || this.isDirty) {
            this._fontOffset = Control._GetFontOffset(context.font);
        }
        super._processMeasures(parentMeasure, context);

        // Prepare lines
        this._lines = this._breakLines(this._currentMeasure.width, this._currentMeasure.height, context);
        this.onLinesReadyObservable.notifyObservers(this);

        let maxLineWidth: number = 0;

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (line.width > maxLineWidth) {
                maxLineWidth = line.width;
            }
        }

        if (this._resizeToFit) {
            if (this._textWrapping === TextWrapping.Clip) {
                const newWidth = (this._paddingLeftInPixels + this._paddingRightInPixels + maxLineWidth) | 0;
                if (newWidth !== this._width.internalValue) {
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
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        if (this.outlineWidth) {
            context.strokeText(text, this._currentMeasure.left + x, y);
        }
        context.fillText(text, this._currentMeasure.left + x, y);

        if (this._underline) {
            context.beginPath();
            context.lineWidth = Math.round(this.fontSizeInPixels * 0.05);
            context.moveTo(this._currentMeasure.left + x, y + 3);
            context.lineTo(this._currentMeasure.left + x + textWidth, y + 3);
            context.stroke();
            context.closePath();
        }

        if (this._lineThrough) {
            context.beginPath();
            context.lineWidth = Math.round(this.fontSizeInPixels * 0.05);
            context.moveTo(this._currentMeasure.left + x, y - this.fontSizeInPixels / 3);
            context.lineTo(this._currentMeasure.left + x + textWidth, y - this.fontSizeInPixels / 3);
            context.stroke();
            context.closePath();
        }
    }

    /**
     * @internal
     */
    public _draw(context: ICanvasRenderingContext): void {
        context.save();

        this._applyStates(context);

        // Render lines
        this._renderLines(context);

        context.restore();
    }

    protected _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
            context.lineJoin = "miter";
            context.miterLimit = 2;
        }
    }

    protected _breakLines(refWidth: number, refHeight: number, context: ICanvasRenderingContext): object[] {
        const lines = [];
        const _lines = this.text.split("\n");

        if (this._textWrapping === TextWrapping.Ellipsis) {
            for (const _line of _lines) {
                lines.push(this._parseLineEllipsis(_line, refWidth, context));
            }
        } else if (this._textWrapping === TextWrapping.WordWrap) {
            for (const _line of _lines) {
                lines.push(...this._parseLineWordWrap(_line, refWidth, context));
            }
        } else if (this._textWrapping === TextWrapping.WordWrapEllipsis) {
            for (const _line of _lines) {
                lines.push(...this._parseLineWordWrapEllipsis(_line, refWidth, refHeight!, context));
            }
        } else {
            for (const _line of _lines) {
                lines.push(this._parseLine(_line, context));
            }
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
                lines[n - 2] = this._parseLineEllipsis(`${lastLine.text + currentLine.text}`, width, context);
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

    /**
     * Given a width constraint applied on the text block, find the expected height
     * @returns expected height
     */
    public computeExpectedHeight(): number {
        if (this.text && this.widthInPixels) {
            // Should abstract platform instead of using LastCreatedEngine
            const context = EngineStore.LastCreatedEngine?.createCanvas(0, 0).getContext("2d");
            if (context) {
                this._applyStates(context);
                if (!this._fontOffset) {
                    this._fontOffset = Control._GetFontOffset(context.font);
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

    dispose(): void {
        super.dispose();

        this.onTextChangedObservable.clear();
    }
}
RegisterClass("BABYLON.GUI.TextBlock", TextBlock);
