import { Control } from "./control";
import { IFocusableControl } from "../advancedDynamicTexture";
import { ValueAndUnit } from "../valueAndUnit";
import { Nullable, Observable, Vector2 } from "babylonjs";
import { Measure } from "../measure";
import { VirtualKeyboard } from "./virtualKeyboard";

/**
 * Class used to create input text control
 */
export class InputText extends Control implements IFocusableControl {
    private _text = "";
    private _placeholderText = "";
    private _background = "#222222";
    private _focusedBackground = "#000000";
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

    /** @hidden */
    public _connectedVirtualKeyboard: Nullable<VirtualKeyboard>;

    /** Gets or sets a string representing the message displayed on mobile when the control gets the focus */
    public promptMessage = "Please enter text:";

    /** Observable raised when the text changes */
    public onTextChangedObservable = new Observable<InputText>();
    /** Observable raised just before an entered character is to be added */
    public onBeforeKeyAddObservable = new Observable<InputText>();
    /** Observable raised when the control gets the focus */
    public onFocusObservable = new Observable<InputText>();
    /** Observable raised when the control loses the focus */
    public onBlurObservable = new Observable<InputText>();

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
        if (this._text === value) {
            return;
        }
        this._text = value;
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
    }

    /** @hidden */
    public onBlur(): void {
        this._isFocused = false;
        this._scrollLeft = null;
        this._cursorOffset = 0;
        clearTimeout(this._blinkTimeout);
        this._markAsDirty();

        this.onBlurObservable.notifyObservers(this);
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

        if (navigator.userAgent.indexOf("Mobile") !== -1) {
            let value = prompt(this.promptMessage);

            if (value !== null) {
                this.text = value;
            }
            this._host.focusedControl = null;
            return;
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
                if (this._text && this._text.length > 0  && this._cursorOffset > 0) {
                    let deletePosition = this._text.length - this._cursorOffset;
                    this.text = this._text.slice(0, deletePosition) + this._text.slice(deletePosition + 1);
                    this._cursorOffset--;
                }
                return;
            case 13: // RETURN
                this._host.focusedControl = null;
                return;
            case 35: // END
                this._cursorOffset = 0;
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 36: // HOME
                this._cursorOffset = this._text.length;
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 37: // LEFT
                this._cursorOffset++;
                if (this._cursorOffset > this._text.length) {
                    this._cursorOffset = this._text.length;
                }
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 39: // RIGHT
                this._cursorOffset--;
                if (this._cursorOffset < 0) {
                    this._cursorOffset = 0;
                }
                this._blinkIsEven = false;
                this._markAsDirty();
                return;
            case 222: // Dead
                if (evt) {
                    evt.preventDefault();
                }
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
                if (this._cursorOffset === 0) {
                    this.text += key;
                } else {
                    let insertPosition = this._text.length - this._cursorOffset;

                    this.text = this._text.slice(0, insertPosition) + key + this._text.slice(insertPosition);
                }
            }
        }
    }

    /** @hidden */
    public processKeyboard(evt: KeyboardEvent): void {
        this.processKey(evt.keyCode, evt.key, evt);
    }

    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        context.save();

        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            // Background
            if (this._isFocused) {
                if (this._focusedBackground) {
                    context.fillStyle = this._isEnabled ?  this._focusedBackground : this._disabledColor;

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
            let clipTextLeft = this._currentMeasure.left + this._margin.getValueInPixel(this._host, parentMeasure.width);
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
            let marginWidth = this._margin.getValueInPixel(this._host, parentMeasure.width) * 2;
            if (this._autoStretchWidth) {
                this.width = Math.min(this._maxWidth.getValueInPixel(this._host, parentMeasure.width), this._textWidth + marginWidth) + "px";
            }

            let rootY = this._fontOffset.ascent + (this._currentMeasure.height - this._fontOffset.height) / 2;
            let availableWidth = this._width.getValueInPixel(this._host, parentMeasure.width) - marginWidth;
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
                    context.fillRect(cursorLeft, this._currentMeasure.top + (this._currentMeasure.height - this._fontOffset.height) / 2, 2, this._fontOffset.height);
                }

                clearTimeout(this._blinkTimeout);
                this._blinkTimeout = <any>setTimeout(() => {
                    this._blinkIsEven = !this._blinkIsEven;
                    this._markAsDirty();
                }, 500);
            }

            context.restore();

            // Border
            if (this._thickness) {
                if (this.color) {
                    context.strokeStyle = this.color;
                }
                context.lineWidth = this._thickness;

                context.strokeRect(this._currentMeasure.left + this._thickness / 2, this._currentMeasure.top + this._thickness / 2,
                    this._currentMeasure.width - this._thickness, this._currentMeasure.height - this._thickness);
            }
        }
        context.restore();
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        this._clickedCoordinate = coordinates.x;
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

    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
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
    }
}
