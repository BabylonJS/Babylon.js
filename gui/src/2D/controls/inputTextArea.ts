import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";

import { Control } from "./control";
import { ValueAndUnit } from "../valueAndUnit";
import { VirtualKeyboard } from "./virtualKeyboard";
import { RegisterClass } from 'babylonjs/Misc/typeStore';
import { Measure } from '../measure';
import { InputText } from "./inputText";
import { ICanvasRenderingContext } from "babylonjs/Engines/ICanvas";
import { PointerInfoBase } from "babylonjs/Events/pointerEvents";
import { IKeyboardEvent } from "babylonjs/Events/deviceInputEvents";
import { TextWrapping } from "./textBlock";

/**
 * Class used to create input text control
 */
export class InputTextArea extends InputText {

    private _textWrapping = TextWrapping.WordWrap;
    private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    private _lines: any[];
    private _oldlines: string[] = [];
    private _clicked: boolean;
    private _resizeToFit: boolean = false;
    private _lineSpacing: ValueAndUnit = new ValueAndUnit(0);
    private _outlineWidth: number = 0;
    private _outlineColor: string = "white";

    /**
    * An event triggered after the text was broken up into lines
    */
    public onLinesReadyObservable = new Observable<InputTextArea>();

    private lastClickedCoordinateY = 0;
    private _selectedLineIndex = 0;
    /** @hidden */
    public _connectedVirtualKeyboard: Nullable<VirtualKeyboard>;
    private _contextForBreakLines: ICanvasRenderingContext;
    private _clickedCoordinateX: Nullable<number>;
    private _clickedCoordinateY: Nullable<number>;

    private _lastClickedLineIndex = -1;

    private _availableWidth: number;

    /**
     * Gets or sets outlineWidth of the text to display
     */
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
     * Creates a new InputTextArea
     * @param name defines the control name
     * @param text defines the text of the control
     */
    constructor(public name?: string, text: string = "") {
        super(name);

        this.text = text;

        this.isPointerBlocker = true;
    }

    protected _getTypeName(): string {
        return "InputTextArea";
    }

    /** @hidden */
    public processKey(keyCode: number, key?: string, evt?: IKeyboardEvent) {

        //return if clipboard event keys (i.e -ctr/cmd + c,v,x)
        if (evt && (evt.ctrlKey || evt.metaKey) && (keyCode === 67 || keyCode === 86 || keyCode === 88)) {
            return;
        }

        //select all
        if (evt && (evt.ctrlKey || evt.metaKey) && keyCode === 65) {
            this._selectAllText();
            evt.preventDefault();
            return;
        }

        this._oldlines = this._lines.map((l) => l.text);

        // Specific cases
        switch (keyCode) {
            case 65: // A - select all
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._selectAllText();
                    evt.preventDefault();
                    return;
                }
                break;
            case 32: //SPACE
                key = " "; //ie11 key for space is "Spacebar"
                break;
            case 191: //SLASH
                if (evt) {
                    evt.preventDefault();
                }
                break;
            case 8: // BACKSPACE
                this._clicked = false;
                let line = this._lines[this._selectedLineIndex];

                if (this._isTextHighlightOn) {
                    this._deleteSelection();
                } else if (line && line.text.length > 0) {
                    if (this._cursorOffset < line.text.length) { // Delete single character in current line
                        this._cursorIndex = line.text.length - this._cursorOffset - 1;
                        line.text = line.text.substring(0, this._cursorIndex) + line.text.substring(this._cursorIndex + 1);

                    } else if (this._selectedLineIndex > 0) { // Delete at the start of the line (concatenation with previous word)
                        // Find the last word to adapt cursor index of current line
                        const prevLine = this._lines[this._selectedLineIndex - 1];
                        const words = prevLine.text.split(" ");
                        this._cursorIndex = words[words.length - 1].length;

                        prevLine.text += line.text;

                        // Empty string to force the line breaking to recompute
                        line.text = "";
                    } else { // Nothing to do at the beginning of the text
                        break;
                    }
                } else { // Beginning of a empty line
                    this._selectedLineIndex--;
                    this.lastClickedCoordinateY -= this._fontOffset.height;

                    line.text = "";
                    this._cursorIndex = this._lines[this._selectedLineIndex].text.length;
                }

                if (evt) {
                    evt.preventDefault();
                }

                this._isTextHighlightOn = false;

                this.text = this._lines.filter((e) => e.text !== "").map((e) => e.text + e.lineEnding).join("");

                this._lines = this._breakLines(this._availableWidth, this._contextForBreakLines);

                if (this._selectedLineIndex > 0) {
                    const lengthDiff = this._oldlines[this._selectedLineIndex - 1].length - this._lines[this._selectedLineIndex - 1].text.length;
                    if (lengthDiff < 0) {
                        // The word was enough tiny to fill in previous line
                        this._cursorIndex += this._oldlines[this._selectedLineIndex - 1].length + 1 ;
                        this.lastClickedCoordinateY -= this._fontOffset.height;
                        this._selectedLineIndex--;
                    }
                }

                this._cursorOffset = this._lines[this._selectedLineIndex].text.length - this._cursorIndex;

                break;
            case 46: // DELETE
                this._clicked = false;
                line = this._lines[this._selectedLineIndex];

                if (this._isTextHighlightOn) {
                    this._deleteSelection();
                } else if (line && line.text.length > 0) {
                    if (this._cursorOffset > 0) { // Delete single character in current line
                        this._cursorIndex = line.text.length - this._cursorOffset;
                        line.text = line.text.substring(0, this._cursorIndex) + line.text.substring(this._cursorIndex + 1);
                    } else if (this._selectedLineIndex < this._lines.length - 1) { // Delete at the end of the line (concatenation with next word)
                        // Find the last word to adapt cursor index of next line
                        const words = line.text.split(" ");
                        this._cursorIndex = words[words.length - 1].length;

                        const nextLine = this._lines[this._selectedLineIndex + 1];
                        line.text += nextLine.text;

                        // Empty string to force the line breaking to recompute
                        nextLine.text = "";

                        this.lastClickedCoordinateY += this._fontOffset.height;
                        this._selectedLineIndex++;
                    } else { // Nothing to do at the end of the text
                        break;
                    }
                }
                if (evt) {
                    evt.preventDefault();
                }

                this._isTextHighlightOn = false;

                this.text = this._lines.filter((e) => e.text !== "").map((e) => e.text + e.lineEnding).join("");

                this._lines = this._breakLines(this._availableWidth, this._contextForBreakLines);

                if (this._selectedLineIndex > 0) {
                    const lengthDiff = this._oldlines[this._selectedLineIndex - 1].length - this._lines[this._selectedLineIndex - 1].text.length;
                    if (lengthDiff < 0) {
                        // The word was enough tiny to fill in previous line
                        this._cursorIndex += this._oldlines[this._selectedLineIndex - 1].length + 1 ;
                        this.lastClickedCoordinateY -= this._fontOffset.height;
                        this._selectedLineIndex--;
                    }
                }

                this._cursorOffset = this._lines[this._selectedLineIndex].text.length - this._cursorIndex;

                break;
            case 13: // RETURN
                this._host.focusedControl = null;
                this._isTextHighlightOn = false;
                return;
            case 35: // END
                this._cursorOffset = 0;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 36: // HOME
                this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 37: // LEFT
                this._cursorOffset++;
                if (this._cursorOffset > this._lines[this._selectedLineIndex].text.length) {
                    this._selectedLineIndex--;
                    if (typeof this._lines[this._selectedLineIndex] === 'undefined') { //if we are in first line + pos 0
                        this._selectedLineIndex++;
                        this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                    }else { // if we decrease to upper line
                        this._cursorOffset = 0;
                        this.lastClickedCoordinateY -= this._fontOffset.height;
                    }
                }
                if (evt && evt.shiftKey) {
                    // update the cursor
                    this._blinkIsEven = false;
                    // shift + ctrl/cmd + <-
                    if (evt.ctrlKey || evt.metaKey) {
                        this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                    }
                    // store the starting point
                    if (!this._isTextHighlightOn) {
                        this._isTextHighlightOn = true;
                        this._cursorIndex = this._lines[this._selectedLineIndex].text.length - this._cursorOffset + 1;
                        this._lastClickedLineIndex = this._selectedLineIndex;
                    }
                    this._updateValueFromCursorIndex(this._cursorOffset);
                    evt.preventDefault();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorOffset = this._lines[this._selectedLineIndex].text.length - this._startHighlightIndex;
                    this._isTextHighlightOn = false;
                }
                // ctr + <-
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                    evt.preventDefault();
                }
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._cursorIndex = -1;
                this._markAsDirty();
                return;
            case 39: // RIGHT
                this._cursorOffset--;
                if (this._cursorOffset < 0) {
                    this._selectedLineIndex++;
                    if (typeof this._lines[this._selectedLineIndex] === 'undefined') { //if we are in first line + pos 0
                        this._selectedLineIndex--;
                        this._cursorOffset = 0;
                    } else { // if we decrease to upper line
                        this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                        this.lastClickedCoordinateY += this._fontOffset.height;
                    }
                }
                if (evt && evt.shiftKey) {
                    // update the cursor
                    this._blinkIsEven = false;
                    // shift + ctrl/cmd + ->
                    if (evt.ctrlKey || evt.metaKey) {
                        this._cursorOffset = 0;
                    }
                    // store the starting point
                    if (!this._isTextHighlightOn) {
                        this._isTextHighlightOn = true;
                        this._cursorIndex = this._lines[this._selectedLineIndex].text.length - this._cursorOffset - 1;
                        this._lastClickedLineIndex = this._selectedLineIndex;
                    }
                    this._updateValueFromCursorIndex(this._cursorOffset);
                    evt.preventDefault();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorOffset = this._lines[this._selectedLineIndex].text.length - this._endHighlightIndex;
                    this._isTextHighlightOn = false;
                }
                //ctr + ->
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._cursorOffset = 0;
                    evt.preventDefault();
                }
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._cursorIndex = -1;
                this._markAsDirty();
                return;
            case 38: // UP
                // update the cursor
                this._blinkIsEven = false;

                let previousLineCursorIndex = this._lines[this._selectedLineIndex].text.length - this._cursorOffset;

                this._selectedLineIndex--;

                if (typeof this._lines[this._selectedLineIndex] === 'undefined') {
                    this._selectedLineIndex++;
                }else {
                    if (this._clicked) {
                        this.lastClickedCoordinateY -= this._fontOffset.height; // this is maybe dirty implementation because it is not rerendering here
                    }else {
                        this.lastClickedCoordinateY = this._margin.getValueInPixel(this._host, this._tempParentMeasure.height) + this._selectedLineIndex * this._fontOffset.height + 1;
                    }

                    this._cursorOffset = this._lines[this._selectedLineIndex].text.length - previousLineCursorIndex;

                    const curLine = this._lines[this._selectedLineIndex].text;
                    const prevLine = this._lines[this._selectedLineIndex + 1].text;
                    const subCurLine = curLine.substring(0, previousLineCursorIndex);
                    const subPrevLine = prevLine.substring(0, previousLineCursorIndex);
                    const currentCursorIndexWidth = this._contextForBreakLines.measureText(subCurLine).width;
                    const prevCursorIndexWidth = this._contextForBreakLines.measureText(subPrevLine).width;
                    const direction = currentCursorIndexWidth - prevCursorIndexWidth < 0 ? -1 : +1;

                    if (this._lines[this._selectedLineIndex].text.length < previousLineCursorIndex) {
                        this._cursorOffset = 0;
                    } else {
                        const averageFontWidth = this._contextForBreakLines.measureText(this._lines[this._selectedLineIndex].text).width / this._lines[this._selectedLineIndex].text.length;
                        const diff = Math.abs(prevCursorIndexWidth - currentCursorIndexWidth);

                        const nbChar = Math.round(diff / averageFontWidth) * direction;

                        this._cursorOffset += nbChar;
                    }
                }

                if (evt) {
                    if (evt.shiftKey) {
                        if (!this._isTextHighlightOn) {
                            this._isTextHighlightOn = true;
                            this._lastClickedLineIndex = this._selectedLineIndex + 1;

                            this._cursorIndex = previousLineCursorIndex;
                        }

                        this._updateValueFromCursorIndex(this._cursorOffset);
                        return;
                    }
                    evt.preventDefault();
                }

                this._cursorIndex = previousLineCursorIndex;
                this._lastClickedLineIndex = this._selectedLineIndex;

                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                this._clicked = false;
                return;
            case 40: // DOWN
                // update the cursor
                this._blinkIsEven = false;

                previousLineCursorIndex = this._lines[this._selectedLineIndex].text.length - this._cursorOffset;

                this._selectedLineIndex++;
                if (typeof this._lines[this._selectedLineIndex] === 'undefined') {
                    this._selectedLineIndex--;
                }else {
                    if (this._clicked) {
                        this.lastClickedCoordinateY += this._fontOffset.height + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);
                    }else {
                        this.lastClickedCoordinateY = this._margin.getValueInPixel(this._host, this._tempParentMeasure.height) + this._selectedLineIndex * this._fontOffset.height + 1;
                    }

                    this._cursorOffset = this._lines[this._selectedLineIndex].text.length - previousLineCursorIndex;

                    const curLine = this._lines[this._selectedLineIndex].text;
                    const prevLine = this._lines[this._selectedLineIndex - 1].text;
                    const subCurLine = curLine.substring(0, previousLineCursorIndex);
                    const subPrevLine = prevLine.substring(0, previousLineCursorIndex);
                    const currentCursorIndexWidth = this._contextForBreakLines.measureText(subCurLine).width;
                    const prevCursorIndexWidth = this._contextForBreakLines.measureText(subPrevLine).width;
                    const direction = currentCursorIndexWidth - prevCursorIndexWidth < 0 ? -1 : +1;

                    if (this._lines[this._selectedLineIndex].text.length < previousLineCursorIndex) {
                        this._cursorOffset = 0;
                    } else {
                        const averageFontWidth = this._contextForBreakLines.measureText(curLine).width / curLine.length;
                        const diff = Math.abs(prevCursorIndexWidth - currentCursorIndexWidth);

                        const nbChar = Math.round(diff / averageFontWidth) * direction;

                        this._cursorOffset += nbChar;
                    }
                }
                if (evt) {
                    if (evt.shiftKey) {
                        if (!this._isTextHighlightOn) {
                            this._isTextHighlightOn = true;
                            this._lastClickedLineIndex = this._selectedLineIndex - 1;
                            this._cursorIndex = previousLineCursorIndex; // this._lines[this._lastClickedLineIndex].text.length - this._cursorOffset - 1;
                        }

                        this._updateValueFromCursorIndex(this._cursorOffset);
                        return;
                    }
                    evt.preventDefault();
                }

                this._cursorIndex = previousLineCursorIndex;
                this._lastClickedLineIndex = this._selectedLineIndex;

                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                this._clicked = false;
                return;
            case 222: // Dead
            if (evt) {
                //add support for single and double quotes
                if (evt.code == "Quote") {
                    if (evt.shiftKey) {
                        keyCode = 34;
                        key = '"';
                    } else {
                        keyCode = 39;
                        key = "'";
                    }
                } else {
                    evt.preventDefault();
                    this._cursorIndex = -1;
                    this.deadKey = true;
                }
            } else {
                this._cursorIndex = -1;
                this.deadKey = true;
            }
        }

        if (key === "Dead") {
            key = undefined;
        }

        // Printable characters
        if (key &&
            ((keyCode === -1) ||                     // Direct access
                (keyCode === 32) ||                     // Space
                (keyCode > 47 && keyCode < 64) ||       // Numbers
                (keyCode > 64 && keyCode < 91) ||       // Letters
                (keyCode > 159 && keyCode < 193) ||     // Special characters
                (keyCode > 218 && keyCode < 223) ||     // Special characters
                (keyCode > 95 && keyCode < 112))) {     // Numpad
            this._currentKey = key;
            this.onBeforeKeyAddObservable.notifyObservers(this);
            key = this._currentKey;
            if (this._addKey) {
                this._clicked = false;

                this._deleteSelection();
                this._cursorIndex = this._lines[this._selectedLineIndex].text.length - this._cursorOffset;

                this._lines[this._selectedLineIndex].text = this._lines[this._selectedLineIndex].text.substring(0, this._cursorIndex) + key + this._lines[this._selectedLineIndex].text.substring(this._cursorIndex);
                this.text = this._lines.filter((e) => e.text !== "").map((e) => e.text + e.lineEnding).join("");

                this._lines = this._breakLines(this._availableWidth, this._contextForBreakLines);

                this._cursorIndex += key.length;

                if (this._selectedLineIndex > 0) {
                    if (this._oldlines[this._selectedLineIndex - 1].length !== this._lines[this._selectedLineIndex - 1].text.length) {
                        // The word was enough tiny to fill in previous line
                        this._cursorIndex = 0;
                    }
                }

                if (this._selectedLineIndex < this._oldlines.length - 1
                    && this._selectedLineIndex < this._lines.length - 1) {
                    const breakWord = this._lines[this._selectedLineIndex + 1].text.split(" ");
                    const oldBreakWord = this._oldlines[this._selectedLineIndex + 1].split(" ");

                    if (breakWord[0] !== oldBreakWord[0]) {
                        if (this._cursorOffset < breakWord[0].length) { // cursor is within breakWord
                            this.lastClickedCoordinateY += this._fontOffset.height;

                            this._selectedLineIndex++;

                            this._cursorIndex = (breakWord[0].length - this._cursorOffset);
                        }
                    }
                }

                if (this._selectedLineIndex === this._oldlines.length - 1
                    && this._lines.length > this._oldlines.length) {
                    this._cursorIndex -= this._lines[this._selectedLineIndex].text.length;

                    this.lastClickedCoordinateY += this._fontOffset.height;

                    this._selectedLineIndex++;
                }

                this._cursorOffset = this._lines[this._selectedLineIndex].text.length - this._cursorIndex;
            }
        }

        this._oldlines = this._lines.map((l) => l.text);
    }

    protected _parseLineEllipsis(line: string = '', width: number,
        context: ICanvasRenderingContext): { text: string, width: number, lineEnding: string } {
        var lineWidth = context.measureText(line).width;

        if (lineWidth > width) {
            line += '…';
        }
        while (line.length > 2 && lineWidth > width) {
            line = line.slice(0, -2) + '…';
            lineWidth = context.measureText(line).width;
        }

        return { text: line, width: lineWidth, lineEnding: " " };
    }

    protected _parseLineWordWrap(line: string = '', width: number,
        context: ICanvasRenderingContext): { text: string, width: number, lineEnding: string }[] {
        const lines = [];
        const words = line.split(' ');
        let lineWidth = 0;

        for (let n = 0; n < words.length; n++) {
            const testLine = n > 0 ? line + " " + words[n] : words[0];
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > width) {

                lineWidth = context.measureText(line).width;
                lines.push({ text: line, width: lineWidth, lineEnding: " "  });

                line = words[n];

                let flushedLine = "";

                line.split('').map((char) => {
                    if (context.measureText(flushedLine + char).width > width) {
                        lines.push({ text: flushedLine, width: context.measureText(flushedLine).width, lineEnding: "" });
                        flushedLine = "";
                    }
                    flushedLine += char;
                });

                line = flushedLine;
                // Measure remaining characters
                lineWidth = context.measureText(line).width;

            } else {
                lineWidth = testWidth;
                line = testLine;
            }
        }
        lines.push({ text: line, width: lineWidth, lineEnding: " " });

        return lines;
    }

    protected _breakLines(refWidth: number, context: ICanvasRenderingContext): object[] {
        var lines: { text: string, width: number, lineEnding: string }[] = [];
        var _lines = this.text.split("\n");

        if (this._textWrapping === TextWrapping.Ellipsis) {
            for (var _line of _lines) {
                lines.push(this._parseLineEllipsis(_line, refWidth, context));
            }
        } else if (this._textWrapping === TextWrapping.WordWrap) {
            for (var _line of _lines) {
                lines.push(...this._parseLineWordWrap(_line, refWidth, context));
            }
        } else {
            for (var _line of _lines) {
                lines.push(this._parseLine(_line, context));
            }
        }

        lines[lines.length - 1].lineEnding = "";

        return lines;
    }

    protected _parseLine(line: string = '', context: ICanvasRenderingContext): { text: string, width: number, lineEnding: string } {
        return { text: line, width: context.measureText(line).width, lineEnding: " " };
    }

    protected _processMeasures(parentMeasure: Measure, context: ICanvasRenderingContext): void {
        if (!this._fontOffset) {
            this._fontOffset = Control._GetFontOffset(context.font);
        }

        super._processMeasures(parentMeasure, context);

        // Prepare lines
        this._lines = this._breakLines(this._availableWidth, context);
        // can we find a cleaner implementation here?
        this._contextForBreakLines = context;

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
                let newWidth = this.paddingLeftInPixels + this.paddingRightInPixels + maxLineWidth;
                if (newWidth !== this._width.internalValue) {
                    this._width.updateInPlace(newWidth, ValueAndUnit.UNITMODE_PIXEL);
                    this._rebuildLayout = true;
                }
            }
            let newHeight = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length;

            if (this._lines.length > 0 && this._lineSpacing.internalValue !== 0) {
                let lineSpacing = 0;
                if (this._lineSpacing.isPixel) {
                    lineSpacing = this._lineSpacing.getValue(this._host);
                } else {
                    lineSpacing = (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
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
        var width = this._currentMeasure.width;
        var x = 0;
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
        context.fillText(text, (this._scrollLeft as number) /* this._currentMeasure.left*/ + x, y);
    }

    /** @hidden */
    protected _onCopyText(ev: ClipboardEvent): void {
        this._isTextHighlightOn = false;
        //when write permission to clipbaord data is denied
        try {
            ev.clipboardData && ev.clipboardData.setData("text/plain", this._highlightedText);
        }
        catch { } //pass
        this._host.clipboardData = this._highlightedText;
    }

    /** @hidden */
    protected _onCutText(ev: ClipboardEvent): void {
        if (!this._highlightedText) {
            return;
        }
        //when write permission to clipbaord data is denied
        try {
            ev.clipboardData && ev.clipboardData.setData("text/plain", this._highlightedText);
        }
        catch { } //pass

        this._host.clipboardData = this._highlightedText;

        this._deleteSelection();
        this._textHasChanged();
    }

    /** @hidden */
    protected _onPasteText(ev: ClipboardEvent): void {
        let data: string = "";
        if (ev.clipboardData && ev.clipboardData.types.indexOf("text/plain") !== -1) {
            data = ev.clipboardData.getData("text/plain");
        }
        else {
            //get the cached data; returns blank string by default
            data = this._host.clipboardData;
        }
        // Delete selection if any
        this._deleteSelection();
        const innerPosition = this._lines[this._selectedLineIndex].text.length - this._cursorOffset;
        const line = this._lines[this._selectedLineIndex];
        line.text = line.text.substring(0, innerPosition) + data + line.text.substring(innerPosition);
        this.text = this._lines.filter((e) => e.text !== "").map((e) => e.text + e.lineEnding).join("");
        this._lines = this._breakLines(this._availableWidth, this._contextForBreakLines);
        this._cursorOffset = this._lines[this._selectedLineIndex].text.length - innerPosition;

        this._textHasChanged();
    }

    public _draw(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>): void {
        context.save();

        this._applyStates(context);
        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowColor = this.shadowColor;
            context.shadowBlur = this.shadowBlur;
            context.shadowOffsetX = this.shadowOffsetX;
            context.shadowOffsetY = this.shadowOffsetY;
        }

        // Background
        if (this._isFocused) {
            if (this._focusedBackground) {
                context.fillStyle = this._isEnabled ? this._focusedBackground : this._disabledColor;

                context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            }
        } else if (this._background) {
            context.fillStyle = this._isEnabled ? this._background : this._disabledColor;

            context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
        }

        if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
            context.shadowBlur = 0;
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
        }

        if (!this._fontOffset) {
            this._fontOffset = Control._GetFontOffset(context.font);
        }

        // Text
        // clipTextLeft is the start of the InputTextPosition + margin
        // _currentMeasure := left, top, width, height
        let clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, this._tempParentMeasure.width);
        // sets the color of the rectangle (border if background available)
        if (this.color) {
            context.fillStyle = this.color;
        }
        // before render just returns the same string
        // TODO: why do we need this method?
        let text = this._beforeRenderText(this._textWrapper).text;

        // placeholder conditions and color setting
        if (!this._isFocused && !this.text && this._placeholderText) {
            text = this._placeholderText;

            if (this._placeholderColor) {
                context.fillStyle = this._placeholderColor;
            }
        }

        // measures the textlength -> this.measure.width
        this._textWidth = context.measureText(text).width;
        // we double up the margin width
        let marginWidth = this._margin.getValueInPixel(this._host, this._tempParentMeasure.width) * 2;

        if (this._autoStretchWidth) {
            this.width = Math.min(this._maxWidth.getValueInPixel(this._host, this._tempParentMeasure.width), this._textWidth + marginWidth) + "px";
        }
        var height = this._currentMeasure.height;
        var rootY = 0;

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
        // OLD let rootY = this._fontOffset.ascent + (this._currentMeasure.height - this._fontOffset.height) / 2;
        // availableWidth is basically the width of our inputField
        this._availableWidth = this._width.getValueInPixel(this._host, this._tempParentMeasure.width) - marginWidth;

        context.save();
        context.beginPath();
        context.fillStyle = this.fontStyle;

        // here we define the visible reactangle to clip it in next line
        //context.rect(clipTextLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, availableWidth + 2, this._currentMeasure.height);
        context.rect(clipTextLeft, this._currentMeasure.top , this._availableWidth + 2, this._currentMeasure.height);
        //context.clip();

        //if (this._isFocused && this._textWidth > availableWidth) {

        // TODO: here we have some trouble if the line doesn't exist anymore
        // TODO: That code needs to go somewhere else when pointer is updated
        // TODO: possible problem again with deleting multilines
        while (typeof this._lines[this._selectedLineIndex] === 'undefined') {
            this._selectedLineIndex--;
            if (this._selectedLineIndex <= 0) {
                break;
            }
        }

        if (this._isFocused && this._lines[this._selectedLineIndex].width > this._availableWidth) {

            // var naming is confusing?: text(WhichIs)Left vs clipTextLeft, but let's deal with it.
            //let textLeft = clipTextLeft - this._textWidth + availableWidth;
            let textLeft = clipTextLeft - this._lines[this._selectedLineIndex].width + this._availableWidth;
            //let textLeft = clipTextLeft;
            if (!this._scrollLeft) {
                this._scrollLeft = textLeft;
            }
        } else {
            this._scrollLeft = clipTextLeft;
        }

        rootY += this._currentMeasure.top + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (i !== 0 && this._lineSpacing.internalValue !== 0) {

                if (this._lineSpacing.isPixel) {
                    rootY += this._lineSpacing.getValue(this._host);
                } else {
                    rootY = rootY + (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
                }
            }

            this._drawText(line.text, line.width, rootY, context);
            rootY += this._fontOffset.height;
        }

        // filltext (<text>, x,y) Startcoordinates;
        //context.fillText(text, this._scrollLeft, this._currentMeasure.top + rootY);

        // Cursor
        if (this._isFocused) {

            // Need to move cursor
            // <- what does this mean? Why is there no method like getCursorPos?
            if (this._clickedCoordinateX && this._clickedCoordinateY) {
                this._clicked = true;

                this.lastClickedCoordinateY = this._clickedCoordinateY - this._currentMeasure.top - this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);

                if (this.lastClickedCoordinateY <= this._fontOffset.height) {
                    this._selectedLineIndex = 0;
                } else if (this.lastClickedCoordinateY > this._fontOffset.height * (this._lines.length - 1)) {
                    this._selectedLineIndex = this._lines.length - 1;
                } else {
                    this._selectedLineIndex = Math.floor(this.lastClickedCoordinateY / this._fontOffset.height);
                }

                // measure line width
                //var selectedLineText = this._lines[this._selectedLineIndex];
                //var clickedLineWidth = context.measureText(selectedLineText).width;
                var clickedLineWidth = this._lines[this._selectedLineIndex].width;

                // scrollLeft is CliptextLeft
                // rightPosition is textlength and AreaBorder left
                var rightPosition = this._scrollLeft + clickedLineWidth;

                // why is this called absolute cursorPosition? It is not absolute?!?!?
                 var absoluteCursorPositionX = rightPosition - this._clickedCoordinateX;
                //var absoluteCursorPositionX = this._clickedCoordinateX;
                var currentSize = 0;

                // cursoroffset decides where the text is updated
                // cursor is 0 if it is at the end of the line
                this._cursorOffset = 0;
                var previousDist = 0;
                do {
                    if (this._cursorOffset) {
                        // Why do we need this condition? cursoroffset is always set to 0 before
                        previousDist = Math.abs(absoluteCursorPositionX - currentSize);
                    }
                    this._cursorOffset++;
                    //currentSize = context.measureText(text.substr(text.length - this._cursorOffset, this._cursorOffset)).width;
                    currentSize = context.measureText(this._lines[this._selectedLineIndex].text.substr(this._lines[this._selectedLineIndex].text.length - this._cursorOffset, this._cursorOffset)).width;

                } while ((currentSize < absoluteCursorPositionX) && (this._lines[this._selectedLineIndex].text.length >= this._cursorOffset));

                // Find closest move
                if (Math.abs(absoluteCursorPositionX - currentSize) > previousDist) {
                    this._cursorOffset--;
                }

                this._blinkIsEven = false;
                this._clickedCoordinateX = null;
                this._clickedCoordinateY = null;
            }

            //show the highlighted text
            if (this._isTextHighlightOn) {
                let highlightCursorLeft = 0;
                let highlightCursorRight = 0;
                this._highlightedText = "";
                let yOffset = this._currentMeasure.top + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);
                const xOffset = this._currentMeasure.left + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);

                this._applyOnSelectedRange((line, currentIndex, startIndex, endIndex) => {
                    highlightCursorLeft = currentIndex === startIndex ? this._startHighlightIndex : 0;
                    highlightCursorRight = currentIndex === endIndex ? this._endHighlightIndex : line.text.length;

                    let width = context.measureText(line.text.substring(highlightCursorLeft, highlightCursorRight)).width;
                    let leftOffsetWidth = context.measureText(line.text.substring(0, highlightCursorLeft)).width + xOffset;

                    this._highlightedText += line.text.substring(highlightCursorLeft, highlightCursorRight);

                    context.globalAlpha = this._highligherOpacity;
                    context.fillStyle = "green"; // this._textHighlightColor;

                    context.fillRect(leftOffsetWidth, yOffset + currentIndex * this._fontOffset.height, width, this._fontOffset.height);
                    context.globalAlpha = 1.0;
                });
            }

            context.restore();

            // Render cursor
            if (!this._blinkIsEven) {
                //Cursoroffset text is counted from left to right increasing
                const cursorOffsetText = this._lines[this._selectedLineIndex].text.substr(this._lines[this._selectedLineIndex].text.length - this._cursorOffset);
                const cursorOffsetWidth = context.measureText(cursorOffsetText).width;

                let cursorLeft = this._scrollLeft + this._lines[this._selectedLineIndex].width - cursorOffsetWidth;

                if (cursorLeft < clipTextLeft) {
                    this._scrollLeft += (clipTextLeft - cursorLeft);
                    cursorLeft = clipTextLeft;
                    this._markAsDirty();
                } else if (cursorLeft > clipTextLeft + this._availableWidth) {
                    this._scrollLeft += (clipTextLeft + this._availableWidth - cursorLeft);
                    cursorLeft = clipTextLeft + this._availableWidth;
                    this._markAsDirty();
                }

                let cursorTop = this._currentMeasure.top + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height); //cursorTop distance from top to cursor start
                if (this.lastClickedCoordinateY <= this._fontOffset.height) {
                    // Nothing to do here
                } else if (this.lastClickedCoordinateY > this._fontOffset.height * (this._lines.length - 1)) {
                    cursorTop += (this._fontOffset.height * (this._lines.length - 1));
                } else {
                    cursorTop += (Math.floor(this.lastClickedCoordinateY / this._fontOffset.height)) * this._fontOffset.height;
                }

                context.fillRect(cursorLeft, cursorTop, 2, this._fontOffset.height);
            }
        }
        context.restore();

        clearTimeout(this._blinkTimeout);
        this._blinkTimeout = <any>setTimeout(() => {
            this._blinkIsEven = !this._blinkIsEven;
            this._markAsDirty();
        }, 500);
        context.restore();

        // Border
        if (this._thickness) {
            if (this._isFocused) {
                if (this.focusedColor) {
                    context.strokeStyle = this.focusedColor;
                }
            } else {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
            }

            context.lineWidth = this._thickness;

            context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2,
                this._currentMeasure.width - this._thickness, this._currentMeasure.height - this._thickness);
        }

        context.restore();
    }

    protected _renderLines(context: ICanvasRenderingContext): void {
        var height = this._currentMeasure.height;
        var rootY = 0;
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

        rootY += this._currentMeasure.top + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);

        for (let i = 0; i < this._lines.length; i++) {
            const line = this._lines[i];

            if (i !== 0 && this._lineSpacing.internalValue !== 0) {

                if (this._lineSpacing.isPixel) {
                    rootY += this._lineSpacing.getValue(this._host);
                } else {
                    rootY = rootY + (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
                }
            }

            this._drawText(line.text, line.width, rootY, context);
            rootY += this._fontOffset.height;
        }
    }

    protected _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
        }
    }

    /**
     * Given a width constraint applied on the text block, find the expected height
     * @returns expected height
     */
    public computeExpectedHeight(): number {
        if (this.text && this.widthInPixels) {
            const context = document.createElement('canvas').getContext('2d') as ICanvasRenderingContext;
            if (context) {
                this._applyStates(context);
                if (!this._fontOffset) {
                    this._fontOffset = Control._GetFontOffset(context.font);
                }
                const lines = this._lines ? this._lines : this._breakLines(this._availableWidth, context);

                let newHeight = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * lines.length;

                if (lines.length > 0 && this._lineSpacing.internalValue !== 0) {
                    let lineSpacing = 0;
                    if (this._lineSpacing.isPixel) {
                        lineSpacing = this._lineSpacing.getValue(this._host);
                    } else {
                        lineSpacing = (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host, this._cachedParentMeasure.height));
                    }

                    newHeight += (lines.length - 1) * lineSpacing;
                }

                return newHeight;
            }
        }
        return 0;
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, pi: PointerInfoBase): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex, pi)) {
            return false;
        }

        this._clickedCoordinateX = coordinates.x;
        this._clickedCoordinateY = coordinates.y;

        this._isTextHighlightOn = false;
        this._highlightedText = "";
        this._cursorIndex = -1;
        this._isPointerDown = true;
        this._host._capturingControl[pointerId] = this;
        if (this._host.focusedControl === this) {
            // Move cursor
            clearTimeout(this._blinkTimeout);
            this._markAsDirty();
            return true;
        }
        if (!this._isEnabled) {
            return false;
        }
        this._host.focusedControl = this;

        return true;
    }

    // for textselection
    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number, pi: PointerInfoBase): void {
        if (this._host.focusedControl === this && this._isPointerDown) {
            this._clickedCoordinateX = coordinates.x;
            this._clickedCoordinateY = coordinates.y;

            this._markAsDirty();

            this._updateValueFromCursorIndex(this._cursorOffset);
        }
        super._onPointerMove(target, coordinates, pointerId, pi);
    }

    /** @hidden */
    protected  _updateValueFromCursorIndex(offset: number) {
        //update the cursor
        this._blinkIsEven = false;

        if (this._cursorIndex === -1) {
            this._cursorIndex = this._lines[this._selectedLineIndex].text.length - offset;
            this._lastClickedLineIndex = this._selectedLineIndex;
        } else {
            const lineLength = this._lines[this._selectedLineIndex].text.length;

            if (this._selectedLineIndex < this._lastClickedLineIndex) {
                this._startHighlightIndex = lineLength - this._cursorOffset;
                this._endHighlightIndex = this._cursorIndex;
            } else if (this._selectedLineIndex > this._lastClickedLineIndex) {
                this._startHighlightIndex = this._cursorIndex;
                this._endHighlightIndex = lineLength - this._cursorOffset;
            } else {
                if (this._cursorIndex < lineLength - this._cursorOffset) {
                    this._startHighlightIndex = this._cursorIndex;
                    this._endHighlightIndex = lineLength - this._cursorOffset;
                }
                else if (this._cursorIndex > lineLength - this._cursorOffset) {
                    this._startHighlightIndex = lineLength - this._cursorOffset;
                    this._endHighlightIndex = this._cursorIndex;
                } else {
                    this._isTextHighlightOn = false;
                    this._markAsDirty();
                    return;
                }
            }
        }
        this._isTextHighlightOn = true;
        this._markAsDirty();
    }

    /**
     * Apply the given callback to the selected range
     * @param callback {function} The callback to apply with these parameters : line object, current index, start index, end index
     */
    private _applyOnSelectedRange(callback: (line: any, currentIndex: number, startIndex: number, endIndex: number) => void) {
        if (!this._isTextHighlightOn) { return; }

        const startLineIndex = Math.min(this._lastClickedLineIndex, this._selectedLineIndex);
        const endLineIndex = Math.max(this._lastClickedLineIndex, this._selectedLineIndex);

        for (let index = startLineIndex; index <= endLineIndex; index++) {
            callback(this._lines[index], index, startLineIndex, endLineIndex);
        }
    }

    /**
     * Delete the current selection if any and move the cursor to the correct place
     */
    private _deleteSelection() {
        if (!this._isTextHighlightOn) { return; }

        const tmpLine = {text: "", index: -1};
        this._applyOnSelectedRange((line, index, startIndex, endIndex) => {
            this._selectedLineIndex = startIndex;
            this.lastClickedCoordinateY = this._margin.getValueInPixel(this._host, this._tempParentMeasure.height) + startIndex * this._fontOffset.height + 1;

            const begin = index === startIndex ? this._startHighlightIndex : 0;
            const end = index === endIndex ? this._endHighlightIndex : line.text.length;

            tmpLine.text += line.text.substring(0, begin) + line.text.substring(end);
            tmpLine.index = startIndex;
            line.text = "";
        });
        this._lines[tmpLine.index].text = tmpLine.text;

        this._lines = this._lines.filter((l) => l.text !== "");

        // In case of complete deletion a blank line is added
        if (this._lines.length === 0) {
            this._lines.push({ text: "", width: 0, lineEnding: "" });
        }

        this._cursorIndex = this._startHighlightIndex;

        this._cursorOffset = this._lines[tmpLine.index].text.length - this._cursorIndex;

        this._isTextHighlightOn = false;

        this._highlightedText = "";
    }

    /** @hidden */
    protected _selectAllText() {
        this._selectedLineIndex = this._lines.length - 1;
        this._lastClickedLineIndex = 0;
        this._cursorOffset = 0;
        this._cursorIndex = 0;
        this._updateValueFromCursorIndex(this._cursorOffset);
    }
}
RegisterClass("BABYLON.GUI.InputTextArea", InputTextArea);
