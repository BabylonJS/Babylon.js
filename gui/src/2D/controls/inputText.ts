import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { Vector2 } from "babylonjs/Maths/math.vector";
import { ClipboardEventTypes, ClipboardInfo } from "babylonjs/Events/clipboardEvents";
import { PointerInfo, PointerEventTypes } from 'babylonjs/Events/pointerEvents';

import { Control } from "./control";
import { IFocusableControl } from "../advancedDynamicTexture";
import { ValueAndUnit } from "../valueAndUnit";
import { VirtualKeyboard } from "./virtualKeyboard";
import { _TypeStore } from 'babylonjs/Misc/typeStore';
import { Measure } from '../measure';

/**
 * Class used to create input text control
 */
export class InputText extends Control implements IFocusableControl {
    private _text = "";
    private _placeholderText = "";
    private _background = "#222222";
    private _focusedBackground = "#000000";
    private _focusedColor = "white";
    private _placeholderColor = "gray";
    private _thickness = 1;
    private _margin = new ValueAndUnit(10, ValueAndUnit.UNITMODE_PIXEL);
    private _autoStretchWidth = true;
    private _maxWidth = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);
    private _isFocused = false;
    private _blinkTimeout: number;
    private _blinkIsEven = false;
    private _cursorOffset = 0;
    private _scrollLeft: Nullable<number>;
    private _textWidth: number;
    private _clickedCoordinate: Nullable<number>;
    private _deadKey = false;
    private _addKey = true;
    private _currentKey = "";
    private _isTextHighlightOn = false;
    private _textHighlightColor = "#d5e0ff";
    private _highligherOpacity = 0.4;
    private _highlightedText = "";
    private _startHighlightIndex = 0;
    private _endHighlightIndex = 0;
    private _cursorIndex = -1;
    private _onFocusSelectAll = false;
    private _isPointerDown = false;
    private _onClipboardObserver: Nullable<Observer<ClipboardInfo>>;
    private _onPointerDblTapObserver: Nullable<Observer<PointerInfo>>;

    /** @hidden */
    public _connectedVirtualKeyboard: Nullable<VirtualKeyboard>;

    /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
    public promptMessage = "Please enter text:";
    /** Force disable prompt on mobile device */
    public disableMobilePrompt = false;

    /** Observable raised when the text changes */
    public onTextChangedObservable = new Observable<InputText>();
    /** Observable raised just before an entered character is to be added */
    public onBeforeKeyAddObservable = new Observable<InputText>();
    /** Observable raised when the control gets the focus */
    public onFocusObservable = new Observable<InputText>();
    /** Observable raised when the control loses the focus */
    public onBlurObservable = new Observable<InputText>();
    /**Observable raised when the text is highlighted */
    public onTextHighlightObservable = new Observable<InputText>();
    /**Observable raised when copy event is triggered */
    public onTextCopyObservable = new Observable<InputText>();
    /** Observable raised when cut event is triggered */
    public onTextCutObservable = new Observable<InputText>();
    /** Observable raised when paste event is triggered */
    public onTextPasteObservable = new Observable<InputText>();
    /** Observable raised when a key event was processed */
    public onKeyboardEventProcessedObservable = new Observable<KeyboardEvent>();

    /** Gets or sets the maximum width allowed by the control */
    public get maxWidth(): string | number {
        return this._maxWidth.toString(this._host);
    }

    /** Gets the maximum width allowed by the control in pixels */
    public get maxWidthInPixels(): number {
        return this._maxWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set maxWidth(value: string | number) {
        if (this._maxWidth.toString(this._host) === value) {
            return;
        }

        if (this._maxWidth.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets the text highlighter transparency; default: 0.4 */
    public get highligherOpacity(): number {
        return this._highligherOpacity;
    }

    public set highligherOpacity(value: number) {
        if (this._highligherOpacity === value) {
            return;
        }
        this._highligherOpacity = value;
        this._markAsDirty();
    }
    /** Gets or sets a boolean indicating whether to select complete text by default on input focus */
    public get onFocusSelectAll(): boolean {
        return this._onFocusSelectAll;
    }

    public set onFocusSelectAll(value: boolean) {
        if (this._onFocusSelectAll === value) {
            return;
        }

        this._onFocusSelectAll = value;
        this._markAsDirty();
    }

    /** Gets or sets the text hightlight color */
    public get textHighlightColor(): string {
        return this._textHighlightColor;
    }

    public set textHighlightColor(value: string) {
        if (this._textHighlightColor === value) {
            return;
        }
        this._textHighlightColor = value;
        this._markAsDirty();
    }

    /** Gets or sets control margin */
    public get margin(): string {
        return this._margin.toString(this._host);
    }

    /** Gets control margin in pixels */
    public get marginInPixels(): number {
        return this._margin.getValueInPixel(this._host, this._cachedParentMeasure.width);
    }

    public set margin(value: string) {
        if (this._margin.toString(this._host) === value) {
            return;
        }

        if (this._margin.fromString(value)) {
            this._markAsDirty();
        }
    }

    /** Gets or sets a boolean indicating if the control can auto stretch its width to adapt to the text */
    public get autoStretchWidth(): boolean {
        return this._autoStretchWidth;
    }

    public set autoStretchWidth(value: boolean) {
        if (this._autoStretchWidth === value) {
            return;
        }

        this._autoStretchWidth = value;
        this._markAsDirty();
    }

    /** Gets or sets border thickness */
    public get thickness(): number {
        return this._thickness;
    }

    public set thickness(value: number) {
        if (this._thickness === value) {
            return;
        }

        this._thickness = value;
        this._markAsDirty();
    }

    /** Gets or sets the background color when focused */
    public get focusedBackground(): string {
        return this._focusedBackground;
    }

    public set focusedBackground(value: string) {
        if (this._focusedBackground === value) {
            return;
        }

        this._focusedBackground = value;
        this._markAsDirty();
    }

    /** Gets or sets the background color when focused */
    public get focusedColor(): string {
        return this._focusedColor;
    }

    public set focusedColor(value: string) {
        if (this._focusedColor === value) {
            return;
        }

        this._focusedColor = value;
        this._markAsDirty();
    }

    /** Gets or sets the background color */
    public get background(): string {
        return this._background;
    }

    public set background(value: string) {
        if (this._background === value) {
            return;
        }

        this._background = value;
        this._markAsDirty();
    }

    /** Gets or sets the placeholder color */
    public get placeholderColor(): string {
        return this._placeholderColor;
    }

    public set placeholderColor(value: string) {
        if (this._placeholderColor === value) {
            return;
        }

        this._placeholderColor = value;
        this._markAsDirty();
    }

    /** Gets or sets the text displayed when the control is empty */
    public get placeholderText(): string {
        return this._placeholderText;
    }

    public set placeholderText(value: string) {
        if (this._placeholderText === value) {
            return;
        }
        this._placeholderText = value;
        this._markAsDirty();
    }

    /** Gets or sets the dead key flag */
    public get deadKey(): boolean {
        return this._deadKey;
    }

    public set deadKey(flag: boolean) {
        this._deadKey = flag;
    }

    /** Gets or sets the highlight text */
    public get highlightedText(): string {
        return this._highlightedText;
    }
    public set highlightedText(text: string) {
        if (this._highlightedText === text) {
            return;
        }
        this._highlightedText = text;
        this._markAsDirty();
    }

    /** Gets or sets if the current key should be added */
    public get addKey(): boolean {
        return this._addKey;
    }

    public set addKey(flag: boolean) {
        this._addKey = flag;
    }

    /** Gets or sets the value of the current key being entered */
    public get currentKey(): string {
        return this._currentKey;
    }

    public set currentKey(key: string) {
        this._currentKey = key;
    }

    /** Gets or sets the text displayed in the control */
    public get text(): string {
        return this._text;
    }

    public set text(value: string) {
        let valueAsString = value.toString(); // Forcing convertion

        if (this._text === valueAsString) {
            return;
        }
        this._text = valueAsString;
        this._markAsDirty();

        this.onTextChangedObservable.notifyObservers(this);
    }

    /** Gets or sets control width */
    public get width(): string | number {
        return this._width.toString(this._host);
    }

    public set width(value: string | number) {
        if (this._width.toString(this._host) === value) {
            return;
        }

        if (this._width.fromString(value)) {
            this._markAsDirty();
        }

        this.autoStretchWidth = false;
    }

    /**
     * Creates a new InputText
     * @param name defines the control name
     * @param text defines the text of the control
     */
    constructor(public name?: string, text: string = "") {
        super(name);

        this.text = text;
        this.isPointerBlocker = true;
    }

    /** @hidden */
    public onBlur(): void {
        this._isFocused = false;
        this._scrollLeft = null;
        this._cursorOffset = 0;
        clearTimeout(this._blinkTimeout);
        this._markAsDirty();

        this.onBlurObservable.notifyObservers(this);

        this._host.unRegisterClipboardEvents();
        if (this._onClipboardObserver) {
            this._host.onClipboardObservable.remove(this._onClipboardObserver);
        }
        let scene = this._host.getScene();
        if (this._onPointerDblTapObserver && scene) {
            scene.onPointerObservable.remove(this._onPointerDblTapObserver);
        }
    }

    /** @hidden */
    public onFocus(): void {
        if (!this._isEnabled) {
            return;
        }
        this._scrollLeft = null;
        this._isFocused = true;
        this._blinkIsEven = false;
        this._cursorOffset = 0;
        this._markAsDirty();

        this.onFocusObservable.notifyObservers(this);

        if (navigator.userAgent.indexOf("Mobile") !== -1 && !this.disableMobilePrompt) {
            let value = prompt(this.promptMessage);

            if (value !== null) {
                this.text = value;
            }
            this._host.focusedControl = null;
            return;
        }

        this._host.registerClipboardEvents();

        this._onClipboardObserver = this._host.onClipboardObservable.add((clipboardInfo) => {
            // process clipboard event, can be configured.
            switch (clipboardInfo.type) {
                case ClipboardEventTypes.COPY:
                    this._onCopyText(clipboardInfo.event);
                    this.onTextCopyObservable.notifyObservers(this);
                    break;
                case ClipboardEventTypes.CUT:
                    this._onCutText(clipboardInfo.event);
                    this.onTextCutObservable.notifyObservers(this);
                    break;
                case ClipboardEventTypes.PASTE:
                    this._onPasteText(clipboardInfo.event);
                    this.onTextPasteObservable.notifyObservers(this);
                    break;
                default: return;
            }
        });

        let scene = this._host.getScene();
        if (scene) {
            //register the pointer double tap event
            this._onPointerDblTapObserver = scene.onPointerObservable.add((pointerInfo) => {
                if (!this._isFocused) {
                    return;
                }
                if (pointerInfo.type === PointerEventTypes.POINTERDOUBLETAP) {
                    this._processDblClick(pointerInfo);
                }
            });
        }

        if (this._onFocusSelectAll) {
            this._selectAllText();
        }

    }

    protected _getTypeName(): string {
        return "InputText";
    }

    /**
     * Function called to get the list of controls that should not steal the focus from this control
     * @returns an array of controls
     */
    public keepsFocusWith(): Nullable<Control[]> {
        if (!this._connectedVirtualKeyboard) {
            return null;
        }
        return [this._connectedVirtualKeyboard];
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
                if (this._text && this._text.length > 0) {
                    //delete the highlighted text
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
                    if (this._cursorOffset === 0) {
                        this.text = this._text.substr(0, this._text.length - 1);
                    } else {
                        let deletePosition = this._text.length - this._cursorOffset;
                        if (deletePosition > 0) {
                            this.text = this._text.slice(0, deletePosition - 1) + this._text.slice(deletePosition);
                        }
                    }
                }
                if (evt) {
                    evt.preventDefault();
                }
                return;
            case 46: // DELETE
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
                if (this._cursorOffset > this._text.length) {
                    this._cursorOffset = this._text.length;
                }

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
                    this._cursorOffset = 0;
                }
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
                if (this._isTextHighlightOn) {
                    this.text = this._text.slice(0, this._startHighlightIndex) + key + this._text.slice(this._endHighlightIndex);
                    this._cursorOffset = this.text.length - (this._startHighlightIndex + 1);
                    this._isTextHighlightOn = false;
                    this._blinkIsEven = false;
                    this._markAsDirty();
                }
                else if (this._cursorOffset === 0) {
                    this.text += key;
                } else {
                    let insertPosition = this._text.length - this._cursorOffset;
                    this.text = this._text.slice(0, insertPosition) + key + this._text.slice(insertPosition);
                }
            }
        }
    }

    /** @hidden */
    private _updateValueFromCursorIndex(offset: number) {
        //update the cursor
        this._blinkIsEven = false;

        if (this._cursorIndex === -1) {
            this._cursorIndex = offset;
        } else {
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
                this._markAsDirty();
                return;
            }
        }
        this._isTextHighlightOn = true;
        this._markAsDirty();
    }
    /** @hidden */
    private _processDblClick(evt: PointerInfo) {
        //pre-find the start and end index of the word under cursor, speeds up the rendering
        this._startHighlightIndex = this._text.length - this._cursorOffset;
        this._endHighlightIndex = this._startHighlightIndex;
        let rWord = /\w+/g, moveLeft, moveRight;
        do {
            moveRight = this._endHighlightIndex < this._text.length && (this._text[this._endHighlightIndex].search(rWord) !== -1) ? ++this._endHighlightIndex : 0;
            moveLeft = this._startHighlightIndex > 0 && (this._text[this._startHighlightIndex - 1].search(rWord) !== -1) ? --this._startHighlightIndex : 0;
        } while (moveLeft || moveRight);

        this._cursorOffset = this.text.length - this._startHighlightIndex;
        this.onTextHighlightObservable.notifyObservers(this);

        this._isTextHighlightOn = true;
        this._clickedCoordinate = null;
        this._blinkIsEven = true;
        this._cursorIndex = -1;
        this._markAsDirty();
    }
    /** @hidden */
    private _selectAllText() {
        this._blinkIsEven = true;
        this._isTextHighlightOn = true;

        this._startHighlightIndex = 0;
        this._endHighlightIndex = this._text.length;
        this._cursorOffset = this._text.length;
        this._cursorIndex = -1;
        this._markAsDirty();
    }

    /**
     * Handles the keyboard event
     * @param evt Defines the KeyboardEvent
     */
    public processKeyboard(evt: KeyboardEvent): void {
        // process pressed key
        this.processKey(evt.keyCode, evt.key, evt);

        this.onKeyboardEventProcessedObservable.notifyObservers(evt);
    }

    /** @hidden */
    private _onCopyText(ev: ClipboardEvent): void {
        this._isTextHighlightOn = false;
        //when write permission to clipbaord data is denied
        try {
            ev.clipboardData && ev.clipboardData.setData("text/plain", this._highlightedText);
        }
        catch { } //pass
        this._host.clipboardData = this._highlightedText;
    }
    /** @hidden */
    private _onCutText(ev: ClipboardEvent): void {
        if (!this._highlightedText) {
            return;
        }
        this.text = this._text.slice(0, this._startHighlightIndex) + this._text.slice(this._endHighlightIndex);
        this._isTextHighlightOn = false;
        this._cursorOffset = this.text.length - this._startHighlightIndex;
        //when write permission to clipbaord data is denied
        try {
            ev.clipboardData && ev.clipboardData.setData("text/plain", this._highlightedText);
        }
        catch { } //pass

        this._host.clipboardData = this._highlightedText;
        this._highlightedText = "";
    }
    /** @hidden */
    private _onPasteText(ev: ClipboardEvent): void {
        let data: string = "";
        if (ev.clipboardData && ev.clipboardData.types.indexOf("text/plain") !== -1) {
            data = ev.clipboardData.getData("text/plain");
        }
        else {
            //get the cached data; returns blank string by default
            data = this._host.clipboardData;
        }
        let insertPosition = this._text.length - this._cursorOffset;
        this.text = this._text.slice(0, insertPosition) + data + this._text.slice(insertPosition);
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
        let clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, this._tempParentMeasure.width);
        if (this.color) {
            context.fillStyle = this.color;
        }

        let text = this._beforeRenderText(this._text);

        if (!this._isFocused && !this._text && this._placeholderText) {
            text = this._placeholderText;

            if (this._placeholderColor) {
                context.fillStyle = this._placeholderColor;
            }
        }

        this._textWidth = context.measureText(text).width;
        let marginWidth = this._margin.getValueInPixel(this._host, this._tempParentMeasure.width) * 2;
        if (this._autoStretchWidth) {
            this.width = Math.min(this._maxWidth.getValueInPixel(this._host, this._tempParentMeasure.width), this._textWidth + marginWidth) + "px";
        }

        let rootY = this._fontOffset.ascent + (this._currentMeasure.height - this._fontOffset.height) / 2;
        let availableWidth = this._width.getValueInPixel(this._host, this._tempParentMeasure.width) - marginWidth;

        context.save();
        context.beginPath();
        context.rect(clipTextLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, availableWidth + 2, this._currentMeasure.height);
        context.clip();

        if (this._isFocused && this._textWidth > availableWidth) {
            let textLeft = clipTextLeft - this._textWidth + availableWidth;
            if (!this._scrollLeft) {
                this._scrollLeft = textLeft;
            }
        } else {
            this._scrollLeft = clipTextLeft;
        }

        context.fillText(text, this._scrollLeft, this._currentMeasure.top + rootY);

        // Cursor
        if (this._isFocused) {

            // Need to move cursor
            if (this._clickedCoordinate) {
                var rightPosition = this._scrollLeft + this._textWidth;
                var absoluteCursorPosition = rightPosition - this._clickedCoordinate;
                var currentSize = 0;
                this._cursorOffset = 0;
                var previousDist = 0;
                do {
                    if (this._cursorOffset) {
                        previousDist = Math.abs(absoluteCursorPosition - currentSize);
                    }
                    this._cursorOffset++;
                    currentSize = context.measureText(text.substr(text.length - this._cursorOffset, this._cursorOffset)).width;

                } while (currentSize < absoluteCursorPosition && (text.length >= this._cursorOffset));

                // Find closest move
                if (Math.abs(absoluteCursorPosition - currentSize) > previousDist) {
                    this._cursorOffset--;
                }

                this._blinkIsEven = false;
                this._clickedCoordinate = null;
            }

            // Render cursor
            if (!this._blinkIsEven) {
                let cursorOffsetText = this.text.substr(this._text.length - this._cursorOffset);
                let cursorOffsetWidth = context.measureText(cursorOffsetText).width;
                let cursorLeft = this._scrollLeft + this._textWidth - cursorOffsetWidth;

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
                    context.fillRect(cursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, 2, this._fontOffset.height);
                }
            }

            clearTimeout(this._blinkTimeout);
            this._blinkTimeout = <any>setTimeout(() => {
                this._blinkIsEven = !this._blinkIsEven;
                this._markAsDirty();
            }, 500);

            //show the highlighted text
            if (this._isTextHighlightOn) {
                clearTimeout(this._blinkTimeout);
                let highlightCursorOffsetWidth = context.measureText(this.text.substring(this._startHighlightIndex)).width;
                let highlightCursorLeft = this._scrollLeft + this._textWidth - highlightCursorOffsetWidth;
                this._highlightedText = this.text.substring(this._startHighlightIndex, this._endHighlightIndex);
                let width = context.measureText(this.text.substring(this._startHighlightIndex, this._endHighlightIndex)).width;
                if (highlightCursorLeft < clipTextLeft) {
                    width = width - (clipTextLeft - highlightCursorLeft);
                    if (!width) {
                        // when using left arrow on text.length > availableWidth;
                        // assigns the width of the first letter after clipTextLeft
                        width = context.measureText(this.text.charAt(this.text.length - this._cursorOffset)).width;
                    }
                    highlightCursorLeft = clipTextLeft;
                }
                //for transparancy
                context.globalAlpha = this._highligherOpacity;
                context.fillStyle = this._textHighlightColor;
                context.fillRect(highlightCursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, width, this._fontOffset.height);
                context.globalAlpha = 1.0;
            }
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

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        this._clickedCoordinate = coordinates.x;
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
    public _onPointerMove(target: Control, coordinates: Vector2, pointerId: number): void {
        if (this._host.focusedControl === this && this._isPointerDown) {
            this._clickedCoordinate = coordinates.x;
            this._markAsDirty();
            this._updateValueFromCursorIndex(this._cursorOffset);
        }
        super._onPointerMove(target, coordinates, pointerId);
    }

    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {

        this._isPointerDown = false;
        delete this._host._capturingControl[pointerId];
        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
    }

    protected _beforeRenderText(text: string): string {
        return text;
    }

    public dispose() {
        super.dispose();

        this.onBlurObservable.clear();
        this.onFocusObservable.clear();
        this.onTextChangedObservable.clear();
        this.onTextCopyObservable.clear();
        this.onTextCutObservable.clear();
        this.onTextPasteObservable.clear();
        this.onTextHighlightObservable.clear();
        this.onKeyboardEventProcessedObservable.clear();
    }
}
_TypeStore.RegisteredTypes["BABYLON.GUI.InputText"] = InputText;