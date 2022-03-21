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

/**
 * Class used to create input text control
 */
export class InputTextArea extends InputText {

    private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    private _lines: any[];
    private _lineSpacing: ValueAndUnit = new ValueAndUnit(0);
    private _outlineWidth: number = 0;
    private _outlineColor: string = "white";
    
    private _clipTextTop: number;
    private _clipTextLeft: number;
    
    private _cursorInfo: { globalStartIndex: number, globalEndIndex: number, relativeStartIndex: number, relativeEndIndex: number, currentLineIndex: number };
    private _highlightCursorInfo: { initialStartIndex: number, initialLineIndex: number };

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
    private _availableHeight: number;

    private _scrollTop: Nullable<number>;

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

        this.onLinesReadyObservable.add((inputTextArea)=> this._updateCursorPosition());

        this._scrollTop = 0;
        this._scrollLeft = 0;

        this._highlightCursorInfo = {
            initialStartIndex: -1,
            initialLineIndex: -1,
        };
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
                this._cursorInfo.globalStartIndex--;
                this._textWrapper.removePart(this._cursorInfo.globalStartIndex, this._cursorInfo.globalEndIndex);

                if (evt) {
                    evt.preventDefault();
                }

                this._isTextHighlightOn = false;

                this._markAsDirty();
                break;
            case 46: // DELETE
                this._cursorInfo.globalEndIndex++;
                this._textWrapper.removePart(this._cursorInfo.globalStartIndex, this._cursorInfo.globalEndIndex);
                
                if (evt) {
                    evt.preventDefault();
                }
                
                this._isTextHighlightOn = false;

                this._markAsDirty();
                break;
            case 13: // RETURN
                this._textWrapper.removePart(this._cursorInfo.globalStartIndex, this._cursorInfo.globalEndIndex, "\n");

                this._isTextHighlightOn = false;

                this._markAsDirty();
                return;
            case 35: // END
                this._cursorInfo.globalStartIndex = this.text.length;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 36: // HOME
                this._cursorInfo.globalStartIndex = 0;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 37: // LEFT
                // update the cursor
                this._blinkIsEven = false;
                if (evt && evt.shiftKey) {
                    // shift + ctrl/cmd + <-
                    if (evt.ctrlKey || evt.metaKey) {
                        // Go to line's start by substract the relativeStartIndex to the globalStartIndex
                        this._cursorInfo.globalStartIndex -= this._cursorInfo.relativeStartIndex;
                        this._cursorInfo.globalEndIndex = this._highlightCursorInfo.initialStartIndex;
                    }
                    // store the starting point
                    if (!this._isTextHighlightOn) {
                        this._highlightCursorInfo.initialLineIndex = this._cursorInfo.currentLineIndex;
                        this._highlightCursorInfo.initialStartIndex = this._cursorInfo.globalStartIndex;

                        this._cursorInfo.globalEndIndex = this._cursorInfo.globalStartIndex;
                        this._cursorInfo.globalStartIndex--;
                        this._isTextHighlightOn = true;
                    } else {
                        if(this._cursorInfo.globalStartIndex < this._highlightCursorInfo.initialStartIndex) {
                            this._cursorInfo.globalStartIndex--;
                        } else {
                            this._cursorInfo.globalEndIndex--;
                        }
                    }
                    evt.preventDefault();
                    return;
                }

                if (this._cursorInfo.globalStartIndex > 0) {
                    this._cursorInfo.globalStartIndex--;
                }

                if (this._isTextHighlightOn) {
                    this._cursorInfo.globalEndIndex = this._cursorInfo.globalStartIndex;
                }
                // ctr + <-
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._cursorInfo.globalStartIndex -= this._cursorInfo.relativeStartIndex;
                    evt.preventDefault();
                }

                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 39: // RIGHT
                // update the cursor
                this._blinkIsEven = false;
                if (evt && evt.shiftKey) {
                    // shift + ctrl/cmd + ->
                    if (evt.ctrlKey || evt.metaKey) {
                        const rightDelta = this._lines[this._cursorInfo.currentLineIndex].text.length - this._cursorInfo.relativeEndIndex - 1;
                        this._cursorInfo.globalEndIndex += rightDelta;
                        this._cursorInfo.globalStartIndex = this._highlightCursorInfo.initialLineIndex;
                    }
                    // store the starting point
                    if (!this._isTextHighlightOn) {
                        this._highlightCursorInfo.initialLineIndex = this._cursorInfo.currentLineIndex;
                        this._highlightCursorInfo.initialStartIndex = this._cursorInfo.globalStartIndex;

                        this._cursorInfo.globalEndIndex = this._cursorInfo.globalStartIndex;
                        this._cursorInfo.globalEndIndex++;
                        this._isTextHighlightOn = true;
                    } else {
                        if(this._cursorInfo.globalStartIndex < this._highlightCursorInfo.initialStartIndex) {
                            this._cursorInfo.globalStartIndex++;
                        } else {
                            this._cursorInfo.globalEndIndex++;
                        }
                    }
                    evt.preventDefault();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorInfo.globalStartIndex = this._cursorInfo.globalEndIndex;
                }

                if (this._cursorInfo.globalStartIndex < this.text.length) {
                    this._cursorInfo.globalStartIndex++;
                }

                //ctr + ->
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    const rightDelta = this._lines[this._cursorInfo.currentLineIndex].text.length - this._cursorInfo.relativeEndIndex - 1;
                    this._cursorInfo.globalStartIndex += rightDelta;
                }

                this._isTextHighlightOn = false;
                this._cursorIndex = -1;
                this._markAsDirty();
                return;
            case 38: // UP
                // update the cursor
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;

                if (evt) {
                    if (evt.shiftKey) {
                        this._isTextHighlightOn = true;
                        if (!this._isTextHighlightOn) {
                            this._highlightCursorInfo.initialLineIndex = this._cursorInfo.currentLineIndex;
                            this._highlightCursorInfo.initialStartIndex = this._cursorInfo.globalStartIndex;
                        }
                    }
                    evt.preventDefault();
                }

                if (this._cursorInfo.globalStartIndex < this._lines[this._cursorInfo.currentLineIndex].text.length) {
                    // First line
                    this._cursorInfo.globalStartIndex = 0;
                } else {
                    const currentLine = this._lines[this._cursorInfo.currentLineIndex];
                    const upperLine = this._lines[this._cursorInfo.currentLineIndex - 1];

                    const currentText = currentLine.text.substr(0, this._cursorInfo.relativeStartIndex);

                    const currentWidth = this._contextForBreakLines.measureText(currentText).width;
                    let upperWidth = 0;
                    let previousWidth = 0;

                    this._cursorInfo.globalStartIndex -= this._cursorInfo.relativeStartIndex; // Start of current line
                    this._cursorInfo.globalStartIndex -= (upperLine.text.length + upperLine.lineEnding.length); // Start of upper line
                    let upperLineRelativeIndex = 0;

                    while(upperWidth < currentWidth && upperLineRelativeIndex < upperLine.text.length) {
                        this._cursorInfo.globalStartIndex++;
                        upperLineRelativeIndex++;
                        previousWidth = Math.abs(currentWidth - upperWidth);
                        upperWidth = this._contextForBreakLines.measureText(upperLine.text.substr(0, upperLineRelativeIndex)).width;
                    }

                    // Find closest move
                    if (Math.abs(currentWidth - upperWidth) > previousWidth && upperLineRelativeIndex > 0) {
                        this._cursorInfo.globalStartIndex--;
                    }
                }

                this._markAsDirty();
                return;
            case 40: // DOWN
                // update the cursor
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;

                if (evt) {
                    if (evt.shiftKey) {
                        this._isTextHighlightOn = true;
                        if (!this._isTextHighlightOn) {
                            this._highlightCursorInfo.initialLineIndex = this._cursorInfo.currentLineIndex;
                            this._highlightCursorInfo.initialStartIndex = this._cursorInfo.globalStartIndex;
                        }
                    }
                    evt.preventDefault();
                }

                if (this._cursorInfo.globalStartIndex >= this.text.length - this._lines[this._lines.length - 1].text.length
                && this._cursorInfo.globalStartIndex < this.text.length) {
                    // Last line
                    this._cursorInfo.globalStartIndex = this.text.length;
                } else {
                    const currentLine = this._lines[this._cursorInfo.currentLineIndex];
                    const underLine = this._lines[this._cursorInfo.currentLineIndex + 1];

                    const currentText = currentLine.text.substr(0, this._cursorInfo.relativeStartIndex);

                    const currentWidth = this._contextForBreakLines.measureText(currentText).width;
                    let upperWidth = 0;
                    let previousWidth = 0;

                    this._cursorInfo.globalStartIndex += (currentLine.text.length - this._cursorInfo.relativeStartIndex + currentLine.lineEnding.length); // Start of current line
                //  this._cursorInfo.globalStartIndex += (underLine.text.length + underLine.lineEnding.length); // Start of under line
                    let underLineRelativeIndex = 0;

                    while(upperWidth < currentWidth && underLineRelativeIndex < underLine.text.length) {
                        this._cursorInfo.globalStartIndex++;
                        underLineRelativeIndex++;
                        previousWidth = Math.abs(currentWidth - upperWidth);
                        upperWidth = this._contextForBreakLines.measureText(underLine.text.substr(0, underLineRelativeIndex)).width;
                    }

                    // Find closest move
                    if (Math.abs(currentWidth - upperWidth) > previousWidth && underLineRelativeIndex > 0) {
                        this._cursorInfo.globalStartIndex--;
                    }
                }

                this._markAsDirty();
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

                this._isTextHighlightOn = false;

                this._textWrapper.removePart(this._cursorInfo.globalStartIndex, this._cursorInfo.globalEndIndex, key);
                this._cursorInfo.globalStartIndex += key.length;

                this._markAsDirty();
            }
        }
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
                        lines.push({ text: flushedLine, width: context.measureText(flushedLine).width, lineEnding: "\n" });
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

    protected _breakLines(refWidth: number, refHeight: number,  context: ICanvasRenderingContext): object[] {
        var lines: { text: string, width: number, lineEnding: string }[] = [];
        var _lines = this.text.split("\n");

        if (this.clipContent) {
            for (var _line of _lines) {
                lines.push(...this._parseLineWordWrap(_line, refWidth, context));
            }
        } else {
            for (var _line of _lines) {
                lines.push(this._parseLine(_line, context));
            }
        }

        lines[lines.length - 1].lineEnding = "\n";

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
        this._lines = this._breakLines(this._availableWidth, this._currentMeasure.height, context);
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
    }

    /** @hidden */
    protected _additionalProcessing(parentMeasure: Measure, context: ICanvasRenderingContext): void {

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

        this._availableWidth = this._width.getValueInPixel(this._host, this._tempParentMeasure.width) - marginWidth;
        this._availableHeight = this._height.getValueInPixel(this._host, this._tempParentMeasure.height) - marginWidth;

        this._clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, this._tempParentMeasure.width);
        this._clipTextTop = this._currentMeasure.top + this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);

        if (this._isFocused && this._lines[this._selectedLineIndex].width > this._availableWidth) {

            let textLeft = this._clipTextLeft - this._lines[this._selectedLineIndex].width + this._availableWidth;

            if (!this._scrollLeft) {
                this._scrollLeft = textLeft;
            }
        } else {
            this._scrollLeft = this._clipTextLeft;
        }

        let selectedHeight = (this._selectedLineIndex + 1)   * this._fontOffset.height;

        if (this._isFocused) {
            let textTop = this._clipTextTop - selectedHeight + this._availableHeight;

            if (!this._scrollTop) {
                this._scrollTop = textTop;
            }
        } else {
            this._scrollTop = this._clipTextTop;
        }
    }

    private _drawText(text: string, textWidth: number, y: number, context: ICanvasRenderingContext): void {
        var width = this._currentMeasure.width;
        var x = this._scrollLeft as number;
        switch (this._textHorizontalAlignment) {
            case Control.HORIZONTAL_ALIGNMENT_LEFT:
                x += 0;
                break;
            case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                x += width - textWidth;
                break;
            case Control.HORIZONTAL_ALIGNMENT_CENTER:
                x += (width - textWidth) / 2;
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
        context.fillText(text, x, y);
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
        this._lines = this._breakLines(this._availableWidth, this._currentMeasure.height, this._contextForBreakLines);
        this._cursorOffset = this._lines[this._selectedLineIndex].text.length - innerPosition;

        this._textHasChanged();
    }

    public _draw(context: ICanvasRenderingContext, invalidatedRectangle?: Nullable<Measure>): void {
        this._scrollLeft = this._scrollLeft ?? 0;
        this._scrollTop = this._scrollTop ?? 0;

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

        // sets the color of the rectangle (border if background available)
        if (this.color) {
            context.fillStyle = this.color;
        }
        // before render just returns the same string
        // TODO: why do we need this method?

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

        context.save();
        context.beginPath();
        context.fillStyle = this.fontStyle;

        // here we define the visible reactangle to clip it in next line
        context.rect(this._clipTextLeft,this._clipTextTop , this._availableWidth + 2, this._availableHeight + 2);
        context.clip();

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

        // Text
        rootY += this._scrollTop;

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

        // Cursor
        if (this._isFocused) {
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
                let cursorLeft = this._scrollLeft + context.measureText(this._lines[this._cursorInfo.currentLineIndex].text.substr(0, this._cursorInfo.relativeStartIndex)).width;

                if (cursorLeft < this._clipTextLeft) {
                    this._scrollLeft += (this._clipTextLeft - cursorLeft);
                    cursorLeft = this._clipTextLeft;
                    this._markAsDirty();
                } else if (cursorLeft > this._clipTextLeft + this._availableWidth) {
                    this._scrollLeft += (this._clipTextLeft + this._availableWidth - cursorLeft);
                    cursorLeft = this._clipTextLeft + this._availableWidth;
                    this._markAsDirty();
                }

                let cursorTop = this._scrollTop + this._cursorInfo.currentLineIndex * this._fontOffset.height; //cursorTop distance from top to cursor start

                if (cursorTop <this._clipTextTop) {
                    this._scrollTop += (this._clipTextTop - cursorTop);
                    cursorTop = this._clipTextTop;
                    this._markAsDirty();
                } else if (cursorTop + this._fontOffset.height > this._clipTextTop + this._availableHeight) {
                    this._scrollTop += (this._clipTextTop + this._availableHeight - cursorTop - this._fontOffset.height);
                    cursorTop = this._clipTextTop + this._availableHeight - this._fontOffset.height;
                    this._markAsDirty();
                }

                context.fillRect(cursorLeft, cursorTop, 2, this._fontOffset.height);
            }
        }

        context.restore();

        // Caret Blinking
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

    protected _applyStates(context: ICanvasRenderingContext): void {
        super._applyStates(context);
        if (this.outlineWidth) {
            context.lineWidth = this.outlineWidth;
            context.strokeStyle = this.outlineColor;
        }
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
        }
        super._onPointerMove(target, coordinates, pointerId, pi);
    }

    /**
     * Apply the correct position of cursor according to current modification
     */
    private _updateCursorPosition() {
        if (!this._isFocused) {
            return;
        }

        if (this._clickedCoordinateX && this._clickedCoordinateY) {
            this._cursorInfo = {
                globalStartIndex:0,
                globalEndIndex: 0,
                relativeStartIndex: 0,
                relativeEndIndex: 0,
                currentLineIndex : 0
            }

            this.lastClickedCoordinateY = this._clickedCoordinateY - this._currentMeasure.top - this._margin.getValueInPixel(this._host, this._tempParentMeasure.height);
  
            const relativeCoordinateY = Math.floor(this.lastClickedCoordinateY / this._fontOffset.height);
            this._cursorInfo.currentLineIndex = Math.min(Math.max(relativeCoordinateY, 0), this._lines.length - 1);

            var currentSize = 0;

            const relativeXPosition = this._clickedCoordinateX - (this._scrollLeft??0);

            var previousDist = 0;

            for (let index = 0; index < this._cursorInfo.currentLineIndex; index++) {
                const line = this._lines[index];
                this._cursorInfo.globalStartIndex += line.text.length + line.lineEnding.length;
            }

            while(currentSize < relativeXPosition && this._lines[this._cursorInfo.currentLineIndex].text.length > this._cursorInfo.relativeStartIndex) {
                this._cursorInfo.relativeStartIndex++;
                previousDist = Math.abs(relativeXPosition - currentSize);
                currentSize = this._contextForBreakLines.measureText(this._lines[this._cursorInfo.currentLineIndex].text.substr(0, this._cursorInfo.relativeStartIndex)).width;
            }
    
            // Find closest move
            if (Math.abs(relativeXPosition - currentSize) > previousDist && this._cursorInfo.relativeStartIndex > 0) {
                this._cursorInfo.relativeStartIndex--;
            }

            this._cursorInfo.globalStartIndex += this._cursorInfo.relativeStartIndex;

            this._cursorInfo.globalEndIndex = this._cursorInfo.globalStartIndex;
            this._cursorInfo.relativeEndIndex = this._cursorInfo.relativeStartIndex;

            this._blinkIsEven = false;
            this._clickedCoordinateX = null;
            this._clickedCoordinateY = null;
        } else if (this._isTextHighlightOn) {
            const startLine = Math.min(this._lastClickedLineIndex, this._selectedLineIndex);
            const endLine = Math.max(this._lastClickedLineIndex, this._selectedLineIndex);

            for (let index = 0; index < endLine; index++) {
                const line = this._lines[index];

                if (index < startLine) {
                    this._cursorInfo.globalStartIndex += line.text.length + line.lineEnding.length;
                } else if (index === startLine) {
                    this._cursorInfo.globalStartIndex += this._startHighlightIndex;
                }

                this._cursorInfo.globalEndIndex += line.text.length + line.lineEnding.length;
            }
            
            this._cursorInfo.globalEndIndex += this._endHighlightIndex;
        } else {
            this._cursorInfo.relativeStartIndex = 0;
            this._cursorInfo.currentLineIndex = 0;

            let lineLength = this._lines[this._cursorInfo.currentLineIndex].text.length + this._lines[this._cursorInfo.currentLineIndex].lineEnding.length;
            let tmpLength = 0;

            while (tmpLength + lineLength <= this._cursorInfo.globalStartIndex) {
                tmpLength += lineLength;
                
                if (this._cursorInfo.currentLineIndex < this._lines.length - 1) {
                    this._cursorInfo.currentLineIndex++;
                    lineLength = this._lines[this._cursorInfo.currentLineIndex].text.length + this._lines[this._cursorInfo.currentLineIndex].lineEnding.length;
                }
            }

            this._cursorInfo.relativeStartIndex = this._cursorInfo.globalStartIndex - tmpLength;

            this._cursorInfo.relativeEndIndex = this._cursorInfo.relativeStartIndex;
        }
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
