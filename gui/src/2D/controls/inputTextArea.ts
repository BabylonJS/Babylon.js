import { Nullable } from "babylonjs/types";
import { Observable } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";

import { Control } from "./control";
import { ValueAndUnit } from "../valueAndUnit";
import { VirtualKeyboard } from "./virtualKeyboard";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { Measure } from '../measure';
import { InputText } from "./inputText";

/**
 * Enum that determines the text-wrapping mode to use.
 */
export enum TextWrapping_ {
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
    Ellipsis,
}

/**
 * Class used to create input text control
 */
export class InputTextArea extends InputText {

    //private _textWrapping = TextWrapping_.Clip;
    private _textWrapping = TextWrapping_.WordWrap;
    //private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;


    private _lines: any[];
    private _oldlines: any[] =[];
    private _clicked: boolean;
    private _resizeToFit: boolean = false;
    private _lineSpacing: ValueAndUnit = new ValueAndUnit(0);
    private _outlineWidth: number = 0;
    private _outlineColor: string = "white";

    /**
    * An event triggered after the text was broken up into lines
    */
    public onLinesReadyObservable = new Observable<InputText>();

    private lastClickedCoordinateY = 0;
    private _selectedLineIndex = 0;
    /** @hidden */
    public _connectedVirtualKeyboard: Nullable<VirtualKeyboard>;
    public measure: TextMetrics;
    private _contextForBreakLines: CanvasRenderingContext2D;
    private _clickedCoordinateX: Nullable<number>;
    private _clickedCoordinateY: Nullable<number>;

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
    public processKey(keyCode: number, key?: string, evt?: KeyboardEvent) {

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
            case 32: //SPACE
                key = " "; //ie11 key for space is "Spacebar"
                break;
            case 191: //SLASH
                if (evt) {
                    evt.preventDefault();
                }
                break;
            case 8: // BACKSPACE
                console.log("ADDKEY_BEFORE", this._cursorOffset);
                if (this._text && this._text.length > 0) {
                    //delete the highlighted text
                    //TODO: TEXTHL IS NOT TAKEN CARE OF YET
                    if (this._isTextHighlightOn) {
                        this.text = this._text.slice(0, this._startHighlightIndex) + this._text.slice(this._endHighlightIndex);
                        this._isTextHighlightOn = false;
                        this._cursorOffset = this.text.length - this._startHighlightIndex;
                        this._blinkIsEven = false;
                        if (evt) {
                            evt.preventDefault();
                        }
                        return;
                    }
                    //delete single character
                    this._oldlines = this._lines;
                    let deletePosition = this._lines[this._selectedLineIndex].text.length - this._cursorOffset;
                    if (deletePosition === 0 && this._selectedLineIndex > 0) {
                        this._selectedLineIndex--;
                        this._lines[this._selectedLineIndex].text = this._lines[this._selectedLineIndex].text.substr(0, this._lines[this._selectedLineIndex].text.length - 1);
                        this.lastClickedCoordinateY -= this._fontOffset.height; //maybe render needed? this is mainloop
                        this._text = this._lines.map(e => e.text).join(" ");
                        this._cursorOffset = 0;
                    }

                    if (deletePosition > 0) {
                        this._lines[this._selectedLineIndex].text = this._lines[this._selectedLineIndex].text.slice(0, deletePosition - 1) + this._lines[this._selectedLineIndex].text.slice(deletePosition);
                        this._text = this._lines.map(e => e.text).join(" ");
                        this._lines = this._breakLines(this._currentMeasure.width, this._contextForBreakLines);
                        console.log("ERROR0", this._lines);
                        console.log("ERROR1",this._selectedLineIndex);
                        console.log("ERROR2",this._oldlines[this._selectedLineIndex].text);
                        if(!(typeof this._lines[this._selectedLineIndex] === "undefined")) {
                        console.log("ERROR3",this._lines[this._selectedLineIndex].text);
                        if(this._oldlines[this._selectedLineIndex].text.length <= this._lines[this._selectedLineIndex].text.length){
                            this._cursorOffset += this._lines[this._selectedLineIndex].text.length - this._oldlines[this._selectedLineIndex].text.length;
                            //wordwrap in current linebegin while deleting
                            if(this._selectedLineIndex >= 1){ // check if we have a previous line
                                this._selectedLineIndex--; // TODO: dont increment and decrement later, instead increment idx
                                if(this._oldlines[this._selectedLineIndex].text.length < this._lines[this._selectedLineIndex].text.length){ // check if prev line got bigger
                                    let prevLineDiff = this._lines[this._selectedLineIndex].text.length - this._oldlines[this._selectedLineIndex].text.length;
                                    this.lastClickedCoordinateY -= this._fontOffset.height;
                                    this._cursorOffset -= this._lines[this._selectedLineIndex+1].text.length - this._oldlines[this._selectedLineIndex+1].text.length;
                                    let prevCursorIndex = this._oldlines[this._selectedLineIndex+1].text.length - this._cursorOffset+1;
                                    this._cursorOffset = prevLineDiff - prevCursorIndex;
                                    this._selectedLineIndex--;
                                }
                                this._selectedLineIndex++;
                            }
                        }else{ //Really dirty copy paste
                            console.log("ELSE");
                            this._selectedLineIndex--;
                            console.log("ERROR4",this._lines[this._selectedLineIndex].text);
                            if(this._oldlines[this._selectedLineIndex].text.length < this._lines[this._selectedLineIndex].text.length){ // check if prev line got bigger
                                let prevLineDiff = this._lines[this._selectedLineIndex].text.length - this._oldlines[this._selectedLineIndex].text.length;
                                this.lastClickedCoordinateY -= this._fontOffset.height;
                                //this._cursorOffset -= this._lines[this._selectedLineIndex+1].text.length - this._oldlines[this._selectedLineIndex+1].text.length;
                                let prevCursorIndex = this._oldlines[this._selectedLineIndex+1].text.length - this._cursorOffset+1;
                                this._cursorOffset = prevCursorIndex - prevLineDiff;
                                this._selectedLineIndex--;
                            }
                            this._selectedLineIndex++;
                        }
                    }else{
                        this._selectedLineIndex--;
                    }
                }
                    console.log("ERROR_AFTER",this._cursorOffset);
                }

                if (evt) {
                    evt.preventDefault();
                }
                return;
            case 46: // DELETE
                this._clicked=false;
                if (this._isTextHighlightOn) {
                    this.text = this._text.slice(0, this._startHighlightIndex) + this._text.slice(this._endHighlightIndex);
                    let decrementor = (this._endHighlightIndex - this._startHighlightIndex);
                    while (decrementor > 0 && this._cursorOffset > 0) {
                        this._cursorOffset--;
                    }
                    this._isTextHighlightOn = false;
                    this._cursorOffset = this.text.length - this._startHighlightIndex;
                    if (evt) {
                        evt.preventDefault();
                    }
                    return;
                }
                if (this._text && this._text.length > 0 && this._cursorOffset > 0) {
                    let deletePosition = this._text.length - this._cursorOffset;
                    this.text = this._text.slice(0, deletePosition) + this._text.slice(deletePosition + 1);
                    this._cursorOffset--;
                }
                if (evt) {
                    evt.preventDefault();
                }
                return;
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
                this._cursorOffset = this._text.length;
                this._blinkIsEven = false;
                this._isTextHighlightOn = false;
                this._markAsDirty();
                return;
            case 37: // LEFT
                this._cursorOffset++;
                //if (this._cursorOffset > this._text.length) {
                if (this._cursorOffset > this._lines[this._selectedLineIndex].text.length){
                    this._selectedLineIndex--;
                    if (typeof this._lines[this._selectedLineIndex] === 'undefined'){ //if we are in first line + pos 0
                        this._selectedLineIndex++;
                        this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                    }else{ //if we decrease to upper line
                        this._cursorOffset = 0;
                        this.lastClickedCoordinateY -= this._fontOffset.height;
                    }
                }
                // TODO: HIGHLIGHTING TO IMPLEMENT
                if (evt && evt.shiftKey) {
                    // update the cursor
                    this._blinkIsEven = false;
                    // shift + ctrl/cmd + <-
                    if (evt.ctrlKey || evt.metaKey) {
                        if (!this._isTextHighlightOn) {
                            if (this._text.length === this._cursorOffset) {
                                return;
                            }
                            else {
                                this._endHighlightIndex = this._text.length - this._cursorOffset + 1;
                            }
                        }
                        this._startHighlightIndex = 0;
                        this._cursorIndex = this._text.length - this._endHighlightIndex;
                        this._cursorOffset = this._text.length;
                        this._isTextHighlightOn = true;
                        this._markAsDirty();
                        return;
                    }
                    //store the starting point
                    if (!this._isTextHighlightOn) {
                        this._isTextHighlightOn = true;
                        this._cursorIndex = (this._cursorOffset >= this._text.length) ? this._text.length : this._cursorOffset - 1;
                    }
                    //if text is already highlighted
                    else if (this._cursorIndex === -1) {
                        this._cursorIndex = this._text.length - this._endHighlightIndex;
                        this._cursorOffset = (this._startHighlightIndex === 0) ? this._text.length : this._text.length - this._startHighlightIndex + 1;
                    }
                    //set the highlight indexes
                    if (this._cursorIndex < this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorIndex;
                        this._startHighlightIndex = this._text.length - this._cursorOffset;
                    }
                    else if (this._cursorIndex > this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorOffset;
                        this._startHighlightIndex = this._text.length - this._cursorIndex;
                    }
                    else {
                        this._isTextHighlightOn = false;
                    }
                    this._markAsDirty();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorOffset = this._text.length - this._startHighlightIndex;
                    this._isTextHighlightOn = false;
                }
                if (evt && (evt.ctrlKey || evt.metaKey)) {
                    this._cursorOffset = this.text.length;
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
                        this._cursorOffset = 0;
                        this._selectedLineIndex--;
                    } else { //if we decrease to upper line
                        this._cursorOffset = this._lines[this._selectedLineIndex].text.length;
                        this.lastClickedCoordinateY += this._fontOffset.height;
                    }
                }
                //TODO: Texthighlighting
                if (evt && evt.shiftKey) {
                    //update the cursor
                    this._blinkIsEven = false;
                    //shift + ctrl/cmd + ->
                    if (evt.ctrlKey || evt.metaKey) {
                        if (!this._isTextHighlightOn) {
                            if (this._cursorOffset === 0) {
                                return;
                            }
                            else {
                                this._startHighlightIndex = this._text.length - this._cursorOffset - 1;
                            }
                        }
                        this._endHighlightIndex = this._text.length;
                        this._isTextHighlightOn = true;
                        this._cursorIndex = this._text.length - this._startHighlightIndex;
                        this._cursorOffset = 0;
                        this._markAsDirty();
                        return;
                    }

                    if (!this._isTextHighlightOn) {
                        this._isTextHighlightOn = true;
                        this._cursorIndex = (this._cursorOffset <= 0) ? 0 : this._cursorOffset + 1;
                    }
                    //if text is already highlighted
                    else if (this._cursorIndex === -1) {
                        this._cursorIndex = this._text.length - this._startHighlightIndex;
                        this._cursorOffset = (this._text.length === this._endHighlightIndex) ? 0 : this._text.length - this._endHighlightIndex - 1;
                    }
                    //set the highlight indexes
                    if (this._cursorIndex < this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorIndex;
                        this._startHighlightIndex = this._text.length - this._cursorOffset;
                    }
                    else if (this._cursorIndex > this._cursorOffset) {
                        this._endHighlightIndex = this._text.length - this._cursorOffset;
                        this._startHighlightIndex = this._text.length - this._cursorIndex;
                    }
                    else {
                        this._isTextHighlightOn = false;
                    }
                    this._markAsDirty();
                    return;
                }
                if (this._isTextHighlightOn) {
                    this._cursorOffset = this._text.length - this._endHighlightIndex;
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
                this._selectedLineIndex--;
                if (typeof this._lines[this._selectedLineIndex] === 'undefined'){
                    this._selectedLineIndex++;
                }else{
                    if (this._clicked) {
                        this.lastClickedCoordinateY -= this._fontOffset.height; // this is maybe dirty implementation because it is not rerendering here
                    }else{
                        console.log("UP",this._selectedLineIndex);
                        this.lastClickedCoordinateY = this._selectedLineIndex*this._fontOffset.height+1;
                        console.log("UP",this.lastClickedCoordinateY);
                    }
                    if (this._lines[this._selectedLineIndex].text.length >= this._lines[this._selectedLineIndex+1].text.length){
                        this._cursorOffset += this._lines[this._selectedLineIndex].text.length - this._lines[this._selectedLineIndex+1].text.length;
                    }else{
                        this._cursorOffset -= this._lines[this._selectedLineIndex+1].text.length - this._lines[this._selectedLineIndex].text.length;
                        if(this._cursorOffset<0){
                            this._cursorOffset = 0;
                        }
                    }
                }
                if(evt) {
                    evt.preventDefault();
                }
                this._clicked=false;
                break;
            case 40: // DOWN
                this._selectedLineIndex++;
                if (typeof this._lines[this._selectedLineIndex] === 'undefined'){
                    this._selectedLineIndex--;
                }else{
                    if (this._clicked) {
                        this.lastClickedCoordinateY += this._fontOffset.height;
                    }else{
                        console.log("DOWN",this._selectedLineIndex);
                        this.lastClickedCoordinateY = (this._selectedLineIndex)*this._fontOffset.height+1;
                        console.log("UP",this.lastClickedCoordinateY);
                    }
                    if (this._lines[this._selectedLineIndex].text.length >= this._lines[this._selectedLineIndex-1].text.length){ // if next line is longer
                        this._cursorOffset += this._lines[this._selectedLineIndex].text.length - this._lines[this._selectedLineIndex-1].text.length;
                    }else{ // if next line is shorter
                        this._cursorOffset -= this._lines[this._selectedLineIndex-1].text.length - this._lines[this._selectedLineIndex].text.length;
                        if (this._cursorOffset < 0){
                            this._cursorOffset = 0;
                        }
                    }
                }
                if(evt) {
                    evt.preventDefault();
                }
                this._clicked =false;
                break;
            case 222: // Dead
                if (evt) {
                    evt.preventDefault();
                }
                this._cursorIndex = -1;
                this.deadKey = true;
                break;
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
                this._clicked=false;
                if (this._isTextHighlightOn) {
                    this.text = this._text.slice(0, this._startHighlightIndex) + key + this._text.slice(this._endHighlightIndex);
                    this._cursorOffset = this.text.length - (this._startHighlightIndex + 1);
                    this._isTextHighlightOn = false;
                    this._blinkIsEven = false;
                    this._markAsDirty();
                }
                //else if (this._cursorOffset === 0) {
                    //this.text += key;
                //}
                else {
                    //let insertPosition = this._text.length - this._cursorOffset;
                    this._oldlines = this._lines;
                    let innerPosition = this._lines[this._selectedLineIndex].text.length - this._cursorOffset;
                    //this.text = this._text.slice(0, insertPosition) + key + this._text.slice(insertPosition);
                    this._lines[this._selectedLineIndex].text = this._lines[this._selectedLineIndex].text.slice(0, innerPosition) + key + this._lines[this._selectedLineIndex].text.slice(innerPosition);
                    this.text = this._lines.map(e => e.text).join(" ");
                    let addedLines = this._parseLineWordWrap(this._lines[this._selectedLineIndex].text,this._currentMeasure.width,this._contextForBreakLines)
                    this._lines = this._breakLines(this._currentMeasure.width, this._contextForBreakLines);
                    // if we have more lines than before we have to move the cursor

                    if (addedLines.length > 1) { //lineBreak detected

                        //TODO: the property/key text exists? What's the issue here?
                        // @ts-ignore
                        let breakWord = addedLines[1].text.split(" ");
                        //console.log("ISSUE",breakWord);
                        //console.log("ISSUE2", addedLines);
                        //console.log("ISSUE2.5",addedLines[1])
                        //console.log("ISSUE2.6",addedLines[1].text);
                        //console.log("ISSUE3",typeof addedLines);

                        if(this._cursorOffset < breakWord[0].length){ // cursor is within breakWord
                            this.lastClickedCoordinateY += this._fontOffset.height;

                            this._selectedLineIndex++;

                            this._cursorOffset = this._lines[this._selectedLineIndex].text.length - (breakWord[0].length - this._cursorOffset);

                        }else{ // cursor is before breakWord
                            //console.log("ELSE ADD");
                            this._cursorOffset -= breakWord[0].length + 1;
                        }

                    }
                    //console.log("cursOFF", this._cursorOffset);


                    // if ( this._lines[this._selectedLineIndex].text.length > this._oldlines[this._selectedLineIndex].text.length){
                    //     this._cursorOffset += this._lines[this._selectedLineIndex].text.length - this._oldlines[this._selectedLineIndex].text.length;
                    //     this._oldlines = this._lines;
                    // }
                }
            }
        }
    }

    protected _parseLineEllipsis(line: string = '', width: number,
        context: CanvasRenderingContext2D): object {
        var lineWidth = context.measureText(line).width;

        if (lineWidth > width) {
            line += '…';
        }
        while (line.length > 2 && lineWidth > width) {
            line = line.slice(0, -2) + '…';
            lineWidth = context.measureText(line).width;
        }

        return { text: line, width: lineWidth };
    }

    protected _parseLineWordWrap(line: string = '', width: number,
        context: CanvasRenderingContext2D): object[] {
        var lines = [];
        var words = line.split(' ');
        var lineWidth = 0;

        for (var n = 0; n < words.length; n++) {
            var testLine = n > 0 ? line + " " + words[n] : words[0];
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > width && n > 0) {
                lines.push({ text: line, width: lineWidth });
                line = words[n];
                lineWidth = context.measureText(line).width;
            }
            else {
                lineWidth = testWidth;
                line = testLine;
            }
        }
        lines.push({ text: line, width: lineWidth });

        return lines;
    }

    protected _breakLines(refWidth: number, context: CanvasRenderingContext2D): object[] {
        var lines = [];
        var _lines = this.text.split("\n");

        if (this._textWrapping === TextWrapping_.Ellipsis) {
            for (var _line of _lines) {
                lines.push(this._parseLineEllipsis(_line, refWidth, context));
            }
        } else if (this._textWrapping === TextWrapping_.WordWrap) {
            for (var _line of _lines) {
                lines.push(...this._parseLineWordWrap(_line, refWidth, context));
            }
        } else {
            for (var _line of _lines) {
                lines.push(this._parseLine(_line, context));
            }
        }

        return lines;
    }

    protected _parseLine(line: string = '', context: CanvasRenderingContext2D): object {
        return { text: line, width: context.measureText(line).width };
    }

    protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        if (!this._fontOffset) {
            this._fontOffset = Control._GetFontOffset(context.font);
        }

        super._processMeasures(parentMeasure, context);

        // Prepare lines
        this._lines = this._breakLines(this._currentMeasure.width, context);
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
            if (this._textWrapping === TextWrapping_.Clip) {
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

    private _drawText(text: string, textWidth: number, y: number, context: CanvasRenderingContext2D): void {
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
        context.fillText(text, this._currentMeasure.left + x, y);
        //context.fillText(text, this._scrollLeft, this._currentMeasure.top + rootY);
    }



    public _draw(context: CanvasRenderingContext2D, invalidatedRectangle?: Nullable<Measure>): void {
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
        let clipTextLeft = this._currentMeasure.left;// + this._margin.getValueInPixel(this._host, this._tempParentMeasure.width);
        // sets the color of the rectangle (border if background available)
        if (this.color) {
            context.fillStyle = this.color;
        }
        // before render just returns the same string
        // TODO: why do we need this method?
        let text = this._beforeRenderText(this._text);
        // placeholder conditions and color setting
        if (!this._isFocused && !this._text && this._placeholderText) {
            text = this._placeholderText;

            if (this._placeholderColor) {
                context.fillStyle = this._placeholderColor;
            }
        }
        // measures:
        // width
        // actualBoundingBoxLeft: 1
        // actualBoundingBoxRight: 805.3515625
        // actualBoundingBoxAscent: 15
        // actualBoundingBoxDescent: 5
        this.measure = context.measureText(text);

        // measures the textlength -> this.measure.width
        this._textWidth = context.measureText(text).width;
        // we double up the margin width
        // TODO: WHY?
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
        let availableWidth = this._width.getValueInPixel(this._host, this._tempParentMeasure.width); //- marginWidth;

        context.save();
        context.beginPath();
        context.fillStyle = this.fontStyle;

        // here we define the visible reactangle to clip it in next line
        //context.rect(clipTextLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, availableWidth + 2, this._currentMeasure.height);
        context.rect(clipTextLeft, this._currentMeasure.top , availableWidth + 2, this._currentMeasure.height);
        //context.clip();

        //if (this._isFocused && this._textWidth > availableWidth) {

        // TODO: here we have some trouble if the line doesn't exist anymore
        // TODO: That code needs to go somewhere else when pointer is updated
        // TODO: possible problem again with deleting multilines
        while (typeof this._lines[this._selectedLineIndex] === 'undefined') {
            this._selectedLineIndex--;
            if (this._selectedLineIndex <= 0){
                break;
            }
        }

        if (this._isFocused && this._lines[this._selectedLineIndex].width > availableWidth) {

            // var naming is confusing?: text(WhichIs)Left vs clipTextLeft, but let's deal with it.
            //let textLeft = clipTextLeft - this._textWidth + availableWidth;
            let textLeft = clipTextLeft - this._lines[this._selectedLineIndex].width + availableWidth;
            //let textLeft = clipTextLeft;
            if (!this._scrollLeft) {
                this._scrollLeft = textLeft;
            }
        } else {
            this._scrollLeft = clipTextLeft;
        }

        rootY += this._currentMeasure.top;

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

                this.lastClickedCoordinateY = this._clickedCoordinateY - this._currentMeasure.top;

                //TODO: Don't know how this will work with highlighting
                this._oldlines = this._lines;

                if (this.lastClickedCoordinateY <= this._fontOffset.height){
                    this._selectedLineIndex = 0;
                } else if (this.lastClickedCoordinateY > this._fontOffset.height * (this._lines.length -1)) {
                    this._selectedLineIndex = this._lines.length - 1;
                } else {
                    this._selectedLineIndex = Math.floor(this.lastClickedCoordinateY/this._fontOffset.height);
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

            // Render cursor
            if (!this._blinkIsEven) {


                //Cursoroffset text is counted from left to right increasing
                //let cursorOffsetText = this.text.substr(this._text.length - this._cursorOffset);
                let cursorOffsetText = this._lines[this._selectedLineIndex].text.substr(this._lines[this._selectedLineIndex].text.length - this._cursorOffset);
                let cursorOffsetWidth = context.measureText(cursorOffsetText).width;

                //TODO: this is not anymore the _textWidth
                //let cursorLeft = this._scrollLeft + this._textWidth - cursorOffsetWidth;
                let cursorLeft = this._scrollLeft + this._lines[this._selectedLineIndex].width - cursorOffsetWidth;

                if (cursorLeft < clipTextLeft) {
                    this._scrollLeft += (clipTextLeft - cursorLeft);
                    cursorLeft = clipTextLeft;
                    this._markAsDirty();
                } else if (cursorLeft > clipTextLeft + availableWidth) {
                    this._scrollLeft += (clipTextLeft + availableWidth - cursorLeft);
                    cursorLeft = clipTextLeft + availableWidth;
                    this._markAsDirty();
                }

                if (!this._isTextHighlightOn) {

                    //context.fillRect(cursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, 2, this._fontOffset.height);

                    // lineSpacing = this._lineSpacing.getValue(this._host);

                    let cursorTop; //cursorTop distance from top to cursor start
                    if (this.lastClickedCoordinateY <= this._fontOffset.height){
                        cursorTop = this._currentMeasure.top;
                    } else if (this.lastClickedCoordinateY > this._fontOffset.height * (this._lines.length -1)) {
                        cursorTop = this._currentMeasure.top + (this._fontOffset.height * (this._lines.length - 1));
                    } else {
                        cursorTop = this._currentMeasure.top + (Math.floor(this.lastClickedCoordinateY/this._fontOffset.height))*this._fontOffset.height;
                    }

                    context.fillRect(cursorLeft, cursorTop, 2, this._fontOffset.height);
                }
            }

            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = <any>setTimeout(() => {
                this._blinkIsEven = !this._blinkIsEven;
                this._markAsDirty();
            }, 500);

            // TODO: texthighlighting
            //show the highlighted text
            // if (this._isTextHighlightOn) {
            //     clearTimeout(this._blinkTimeout);
            //     let highlightCursorOffsetWidth = context.measureText(this.text.substring(this._startHighlightIndex)).width;
            //     let highlightCursorLeft = this._scrollLeft + this._textWidth - highlightCursorOffsetWidth;
            //     this._highlightedText = this.text.substring(this._startHighlightIndex, this._endHighlightIndex);
            //     let width = context.measureText(this.text.substring(this._startHighlightIndex, this._endHighlightIndex)).width;
            //     if (highlightCursorLeft < clipTextLeft) {
            //         width = width - (clipTextLeft - highlightCursorLeft);
            //         if (!width) {
            //             // when using left arrow on text.length > availableWidth;
            //             // assigns the width of the first letter after clipTextLeft
            //             width = context.measureText(this.text.charAt(this.text.length - this._cursorOffset)).width;
            //         }
            //         highlightCursorLeft = clipTextLeft;
            //     }
            //     //for transparancy
            //     context.globalAlpha = this._highligherOpacity;
            //     context.fillStyle = this._textHighlightColor;
            //     //context.fillRect(highlightCursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, width, this._fontOffset.height);
            //     context.fillRect(highlightCursorLeft, this._currentMeasure.top +((lastClickedCoordinateY)/this._lines.length)*this._fontOffset.height, 2, this._fontOffset.height);
            //     context.globalAlpha = 1.0;
            // }
        }
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

    protected _renderLines(context: CanvasRenderingContext2D): void {
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

        rootY += this._currentMeasure.top;

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

    protected _applyStates(context: CanvasRenderingContext2D): void {
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
            const context = document.createElement('canvas').getContext('2d');
            if (context) {
                this._applyStates(context);
                if (!this._fontOffset) {
                    this._fontOffset = Control._GetFontOffset(context.font);
                }
                const lines = this._lines ? this._lines : this._breakLines(
                    this.widthInPixels - this.paddingLeftInPixels - this.paddingRightInPixels, context);

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

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        console.log("Coordinates:",coordinates);
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
    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void {
        if (this._host.focusedControl === this && this._isPointerDown) {
            this._clickedCoordinateX = coordinates.x;
            this._clickedCoordinateY = coordinates.y;
            this._markAsDirty();
            console.log("ONPOINTERMOVE_")
            this._updateValueFromCursorIndex(this._cursorOffset);
        }
        super._onPointerMove(target, coordinates, pointerId);
    }

    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {

        this._isPointerDown = false;
        delete this._host._capturingControl[pointerId];
        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
    }
    // this method actually does nothing?
    protected _beforeRenderText(text: string): string {
        return text;
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.InputTextArea"] = InputTextArea;
