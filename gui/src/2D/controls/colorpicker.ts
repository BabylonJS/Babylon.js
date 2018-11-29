import { Control } from "./control";
import { Color3, Observable, Vector2 } from "babylonjs";
import { Measure } from "../measure";
import { InputText } from "./inputText";
import { Rectangle } from "./rectangle";
import { Button } from "./button";
import { Grid } from "./grid";
import { AdvancedDynamicTexture } from "../advancedDynamicTexture";
import { TextBlock } from ".";

/** Class used to create color pickers */
export class ColorPicker extends Control {
    private _colorWheelCanvas: HTMLCanvasElement;

    private _value: Color3 = Color3.Red();
    private _tmpColor = new Color3();

    private _pointerStartedOnSquare = false;
    private _pointerStartedOnWheel = false;

    private _squareLeft = 0;
    private _squareTop = 0;
    private _squareSize = 0;

    private _h = 360;
    private _s = 1;
    private _v = 1;

    /**
     * Observable raised when the value changes
     */
    public onValueChangedObservable = new Observable<Color3>();

    /** Gets or sets the color of the color picker */
    public get value(): Color3 {
        return this._value;
    }

    public set value(value: Color3) {
        if (this._value.equals(value)) {
            return;
        }

        this._value.copyFrom(value);

        this._RGBtoHSV(this._value, this._tmpColor);

        this._h = this._tmpColor.r;
        this._s = Math.max(this._tmpColor.g, 0.00001);
        this._v = Math.max(this._tmpColor.b, 0.00001);

        this._markAsDirty();

        this.onValueChangedObservable.notifyObservers(this._value);
    }

    /** Gets or sets control width */
    public set width(value: string | number) {
        if (this._width.toString(this._host) === value) {
            return;
        }

        if (this._width.fromString(value)) {
            this._height.fromString(value);
            this._markAsDirty();
        }
    }

    /** Gets or sets control height */
    public set height(value: string | number) {
        if (this._height.toString(this._host) === value) {
            return;
        }

        if (this._height.fromString(value)) {
            this._width.fromString(value);
            this._markAsDirty();
        }
    }

    /** Gets or sets control size */
    public get size(): string | number {
        return this.width;
    }

    public set size(value: string | number) {
        this.width = value;
    }

    /**
     * Creates a new ColorPicker
     * @param name defines the control name
     */
    constructor(public name?: string) {
        super(name);
        this.value = new Color3(.88, .1, .1);
        this.size = "200px";
        this.isPointerBlocker = true;
    }

    protected _getTypeName(): string {
        return "ColorPicker";
    }

    private _updateSquareProps(): void {
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var wheelThickness = radius * .2;
        var innerDiameter = (radius - wheelThickness) * 2;
        var squareSize = innerDiameter / (Math.sqrt(2));
        var offset = radius - squareSize * .5;

        this._squareLeft = this._currentMeasure.left + offset;
        this._squareTop = this._currentMeasure.top + offset;
        this._squareSize = squareSize;
    }

    private _drawGradientSquare(hueValue: number, left: number, top: number, width: number, height: number, context: CanvasRenderingContext2D) {
        var lgh = context.createLinearGradient(left, top, width + left, top);
        lgh.addColorStop(0, '#fff');
        lgh.addColorStop(1, 'hsl(' + hueValue + ', 100%, 50%)');

        context.fillStyle = lgh;
        context.fillRect(left, top, width, height);

        var lgv = context.createLinearGradient(left, top, left, height + top);
        lgv.addColorStop(0, 'rgba(0,0,0,0)');
        lgv.addColorStop(1, '#000');

        context.fillStyle = lgv;
        context.fillRect(left, top, width, height);
    }

    private _drawCircle(centerX: number, centerY: number, radius: number, context: CanvasRenderingContext2D) {
        context.beginPath();
        context.arc(centerX, centerY, radius + 1, 0, 2 * Math.PI, false);
        context.lineWidth = 3;
        context.strokeStyle = '#333333';
        context.stroke();
        context.beginPath();
        context.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
        context.lineWidth = 3;
        context.strokeStyle = '#ffffff';
        context.stroke();
    }

    private _createColorWheelCanvas(radius: number, thickness: number): HTMLCanvasElement {
        var canvas = document.createElement("canvas");
        canvas.width = radius * 2;
        canvas.height = radius * 2;
        var context = <CanvasRenderingContext2D>canvas.getContext("2d");
        var image = context.getImageData(0, 0, radius * 2, radius * 2);
        var data = image.data;

        var color = this._tmpColor;
        var maxDistSq = radius * radius;
        var innerRadius = radius - thickness;
        var minDistSq = innerRadius * innerRadius;

        for (var x = -radius; x < radius; x++) {
            for (var y = -radius; y < radius; y++) {

                var distSq = x * x + y * y;

                if (distSq > maxDistSq || distSq < minDistSq) {
                    continue;
                }

                var dist = Math.sqrt(distSq);
                var ang = Math.atan2(y, x);

                this._HSVtoRGB(ang * 180 / Math.PI + 180, dist / radius, 1, color);

                var index = ((x + radius) + ((y + radius) * 2 * radius)) * 4;

                data[index] = color.r * 255;
                data[index + 1] = color.g * 255;
                data[index + 2] = color.b * 255;
                var alphaRatio = (dist - innerRadius) / (radius - innerRadius);

                //apply less alpha to bigger color pickers
                var alphaAmount = .2;
                var maxAlpha = .2;
                var minAlpha = .04;
                var lowerRadius = 50;
                var upperRadius = 150;

                if (radius < lowerRadius) {
                    alphaAmount = maxAlpha;
                } else if (radius > upperRadius) {
                    alphaAmount = minAlpha;
                } else {
                    alphaAmount = (minAlpha - maxAlpha) * (radius - lowerRadius) / (upperRadius - lowerRadius) + maxAlpha;
                }

                var alphaRatio = (dist - innerRadius) / (radius - innerRadius);

                if (alphaRatio < alphaAmount) {
                    data[index + 3] = 255 * (alphaRatio / alphaAmount);
                } else if (alphaRatio > 1 - alphaAmount) {
                    data[index + 3] = 255 * (1.0 - ((alphaRatio - (1 - alphaAmount)) / alphaAmount));
                } else {
                    data[index + 3] = 255;
                }

            }
        }

        context.putImageData(image, 0, 0);

        return canvas;
    }

    private _RGBtoHSV(color: Color3, result: Color3) {
        var r = color.r;
        var g = color.g;
        var b = color.b;

        var max = Math.max(r, g, b);
        var min = Math.min(r, g, b);
        var h = 0;
        var s = 0;
        var v = max;

        var dm = max - min;

        if (max !== 0) {
            s = dm / max;
        }

        if (max != min) {
            if (max == r) {
                h = (g - b) / dm;
                if (g < b) {
                    h += 6;
                }
            } else if (max == g) {
                h = (b - r) / dm + 2;
            } else if (max == b) {
                h = (r - g) / dm + 4;
            }
            h *= 60;
        }

        result.r = h;
        result.g = s;
        result.b = v;
    }

    private _HSVtoRGB(hue: number, saturation: number, value: number, result: Color3) {
        var chroma = value * saturation;
        var h = hue / 60;
        var x = chroma * (1 - Math.abs((h % 2) - 1));
        var r = 0;
        var g = 0;
        var b = 0;

        if (h >= 0 && h <= 1) {
            r = chroma;
            g = x;
        } else if (h >= 1 && h <= 2) {
            r = x;
            g = chroma;
        } else if (h >= 2 && h <= 3) {
            g = chroma;
            b = x;
        } else if (h >= 3 && h <= 4) {
            g = x;
            b = chroma;
        } else if (h >= 4 && h <= 5) {
            r = x;
            b = chroma;
        } else if (h >= 5 && h <= 6) {
            r = chroma;
            b = x;
        }

        var m = value - chroma;
        result.set((r + m), (g + m), (b + m));
    }

    /** @hidden */
    public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
        context.save();

        this._applyStates(context);
        if (this._processMeasures(parentMeasure, context)) {

            var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
            var wheelThickness = radius * .2;
            var left = this._currentMeasure.left;
            var top = this._currentMeasure.top;

            if (!this._colorWheelCanvas || this._colorWheelCanvas.width != radius * 2) {
                this._colorWheelCanvas = this._createColorWheelCanvas(radius, wheelThickness);
            }

            this._updateSquareProps();

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;

                context.fillRect(this._squareLeft, this._squareTop, this._squareSize, this._squareSize);
            }

            context.drawImage(this._colorWheelCanvas, left, top);

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowBlur = 0;
                context.shadowOffsetX = 0;
                context.shadowOffsetY = 0;
            }

            this._drawGradientSquare(this._h,
                this._squareLeft,
                this._squareTop,
                this._squareSize,
                this._squareSize,
                context);

            var cx = this._squareLeft + this._squareSize * this._s;
            var cy = this._squareTop + this._squareSize * (1 - this._v);

            this._drawCircle(cx, cy, radius * .04, context);

            var dist = radius - wheelThickness * .5;
            cx = left + radius + Math.cos((this._h - 180) * Math.PI / 180) * dist;
            cy = top + radius + Math.sin((this._h - 180) * Math.PI / 180) * dist;
            this._drawCircle(cx, cy, wheelThickness * .35, context);

        }
        context.restore();
    }

    // Events
    private _pointerIsDown = false;

    private _updateValueFromPointer(x: number, y: number): void {
        if (this._pointerStartedOnWheel) {
            var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
            var centerX = radius + this._currentMeasure.left;
            var centerY = radius + this._currentMeasure.top;
            this._h = Math.atan2(y - centerY, x - centerX) * 180 / Math.PI + 180;
        }
        else if (this._pointerStartedOnSquare) {
            this._updateSquareProps();
            this._s = (x - this._squareLeft) / this._squareSize;
            this._v = 1 - (y - this._squareTop) / this._squareSize;
            this._s = Math.min(this._s, 1);
            this._s = Math.max(this._s, 0.00001);
            this._v = Math.min(this._v, 1);
            this._v = Math.max(this._v, 0.00001);
        }

        this._HSVtoRGB(this._h, this._s, this._v, this._tmpColor);

        this.value = this._tmpColor;
    }

    private _isPointOnSquare(x: number, y: number): boolean {
        this._updateSquareProps();

        var left = this._squareLeft;
        var top = this._squareTop;
        var size = this._squareSize;

        if (x >= left && x <= left + size &&
            y >= top && y <= top + size) {
            return true;
        }

        return false;
    }

    private _isPointOnWheel(x: number, y: number): boolean {
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var centerX = radius + this._currentMeasure.left;
        var centerY = radius + this._currentMeasure.top;
        var wheelThickness = radius * .2;
        var innerRadius = radius - wheelThickness;
        var radiusSq = radius * radius;
        var innerRadiusSq = innerRadius * innerRadius;

        var dx = x - centerX;
        var dy = y - centerY;

        var distSq = dx * dx + dy * dy;

        if (distSq <= radiusSq && distSq >= innerRadiusSq) {
            return true;
        }

        return false;
    }

    public _onPointerDown(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number): boolean {
        if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
            return false;
        }

        this._pointerIsDown = true;

        this._pointerStartedOnSquare = false;
        this._pointerStartedOnWheel = false;

        // Invert transform
        this._invertTransformMatrix.transformCoordinates(coordinates.x, coordinates.y, this._transformedPosition);

        let x = this._transformedPosition.x;
        let y = this._transformedPosition.y;

        if (this._isPointOnSquare(x, y)) {
            this._pointerStartedOnSquare = true;
        } else if (this._isPointOnWheel(x, y)) {
            this._pointerStartedOnWheel = true;
        }

        this._updateValueFromPointer(x, y);
        this._host._capturingControl[pointerId] = this;

        return true;
    }

    public _onPointerMove(target: Control, coordinates: Vector2): void {
        // Invert transform
        this._invertTransformMatrix.transformCoordinates(coordinates.x, coordinates.y, this._transformedPosition);

        let x = this._transformedPosition.x;
        let y = this._transformedPosition.y;

        if (this._pointerIsDown) {
            this._updateValueFromPointer(x, y);
        }

        super._onPointerMove(target, coordinates);
    }

    public _onPointerUp(target: Control, coordinates: Vector2, pointerId: number, buttonIndex: number, notifyClick: boolean): void {
        this._pointerIsDown = false;

        delete this._host._capturingControl[pointerId];
        super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
    }

    /**
     *
     * @param advancedTexture defines the AdvancedDynamicTexture the dialog is assigned to
     * @param options
     */

    public static ShowPickerDialogAsync(advancedTexture: AdvancedDynamicTexture,
        options: {
            pickerWidth?: string,
            pickerHeight?: string,
            headerHeight?: string,
            lastColor?: string,
            swatchLimit?: number,
            swatchSize?: number,
            numSwatchesPerLine?: number,
            savedColors?: Array<string>}
    ): Promise<{
        savedColors?: string[],
        pickedColor: string
    }> {

        return new Promise((resolve, reject) => {
            // Default options
            options.pickerWidth = options.pickerWidth || "640px";
            options.pickerHeight = options.pickerHeight || "400px";
            options.headerHeight = options.headerHeight || "35px"
            options.lastColor = options.lastColor || "#000000";
            options.swatchLimit = options.swatchLimit || 20;
            options.swatchSize = options.swatchSize || 40;
            options.numSwatchesPerLine = options.numSwatchesPerLine || 10;

            // Window size settings
            var drawerMaxRows: number = options.swatchLimit / options.numSwatchesPerLine;
            var drawerMaxSize: number = ((options.swatchSize * 1.5) * drawerMaxRows) + (options.swatchSize / 4);
            var containerSize: string = (parseInt(options.pickerHeight) + drawerMaxSize).toString() + "px";  

            // Button Colors
            var buttonColor: string = "#c0c0c0";
            var buttonBackgroundColor: string = "#535353";
            var buttonBackgroundHoverColor: string = "#414141";
            var buttonBackgroundClickColor: string = "515151";
            var buttonDisabledColor: string = "#555555";
            var buttonDisabledBackgroundColor: string = "#454545";
            var currentSwatchesOutlineColor: string = "#404040";
            var luminanceLimitColor: Color3 = Color3.FromHexString("#dddddd");
            var luminanceLimit: number = luminanceLimitColor.r + luminanceLimitColor.g + luminanceLimitColor.b;
            var iconColorDark: string = "#aaaaaa";
            var iconColorLight: string = "#ffffff";
            var closeIconColor: Color3;

            // Button settings
            var buttonFontSize = 16;
            var butEdit: Button;

            // Input Text Colors
            var inputFieldLabels: string[] = ["R", "G", "B"];
            var inputTextBackgroundColor: string = "#454545";
            var inputTextColor: string = "#f0f0f0";

            // This is the current color as set by either the picker or by entering a value
            var currentColor: Color3;

            // This int is used for naming swatches and serves as the index for calling them from the list
            var swatchNumber: number;

            // Menu Panel options. We need to know if the swatchDrawer exists so we can create it if needed.
            var swatchDrawer: Grid;
            var editSwatchMode: boolean = false;

            // Color InputText fields that will be updated upon value change
            var picker: ColorPicker;
            var rValInt: InputText;
            var gValInt: InputText;
            var bValInt: InputText;
            var rValDec: InputText;
            var gValDec: InputText;
            var bValDec: InputText;
            var hexVal: InputText;
            var newSwatch: Rectangle;
            var lastVal: string;
            var activeField: string;

            // Drawer height calculations
            if (options.savedColors) {
                var rowCount: number = Math.ceil(options.savedColors.length / options.numSwatchesPerLine);
            }

            /**
            * Will update all values for InputText and ColorPicker controls based on the BABYLON.Color3 passed to this function.
            * Each InputText control and the ColorPicker control will be tested to see if they are the activeField and if they
            * are will receive no update. This is to prevent the input from the user being overwritten.
            */
            function UpdateValues(value: Color3, inputField: string) {
                activeField = inputField;
                var pickedColor: string = value.toHexString();
                newSwatch.background = pickedColor;
                if (rValInt.name != activeField) {
                    rValInt.text = Math.floor(value.r * 255).toString();
                }
                if (gValInt.name != activeField) {
                    gValInt.text = Math.floor(value.g * 255).toString();
                }
                if (bValInt.name != activeField) {
                    bValInt.text = Math.floor(value.b * 255).toString();
                }
                if (rValDec.name != activeField) {
                    rValDec.text = value.r.toString();
                }
                if (gValDec.name != activeField) {
                    gValDec.text = value.g.toString();
                }
                if (bValDec.name != activeField) {
                    bValDec.text = value.b.toString();
                }
                if (hexVal.name != activeField) {
                    var minusPound: string[] = pickedColor.split("#");
                    hexVal.text = minusPound[1];
                }
                if (picker.name != activeField) {
                   picker.value = value;
                }
            }

            // When the user enters an integer for R, G, or B we check to make sure it is a valid number and replace if not.
            function UpdateInt(field: InputText, channel: string) {
                var newValue: string = field.text;
                var checkVal: boolean = /[^0-9]/g.test(newValue);
                if (checkVal) {
                    field.text = lastVal;
                    return;
                }
                else {
                    if (newValue != "") {
                        if (Math.floor(parseInt(newValue)) < 0) {
                            newValue = "0";
                        }
                        else if (Math.floor(parseInt(newValue)) > 255) {
                            newValue = "255";
                        }
                        else if (isNaN(parseInt(newValue))) {
                            newValue = "0";
                        }
                    }
                    if (activeField == field.name) {
                        lastVal = newValue;
                    }
                }
                if (newValue != "") {
                    newValue = parseInt(newValue).toString();
                    field.text = newValue;
                    var newSwatchRGB: Color3 = BABYLON.Color3.FromHexString(newSwatch.background);
                    if (activeField == field.name) {
                        if (channel == "r") {
                            UpdateValues(new BABYLON.Color3((parseInt(newValue)) / 255, newSwatchRGB.g, newSwatchRGB.b), field.name);
                        }
                        else if (channel == "g") {
                            UpdateValues(new BABYLON.Color3(newSwatchRGB.r, (parseInt(newValue)) / 255, newSwatchRGB.b), field.name);
                        }
                        else {
                            UpdateValues(new BABYLON.Color3(newSwatchRGB.r, newSwatchRGB.g, (parseInt(newValue)) / 255), field.name);
                        }
                    }
                }
            }

            // When the user enters a float for R, G, or B we check to make sure it is a valid number and replace if not.
            function UpdateFloat(field: InputText, channel: string) {
                var newValue: string = field.text;
                var checkVal: boolean = /[^0-9\.]/g.test(newValue);
                if (checkVal) {
                    field.text = lastVal;
                    return;
                }
                else {
                    if (newValue != "" && newValue != "." && parseFloat(newValue) != 0) {
                        if (parseFloat(newValue) < 0.0) {
                            newValue = "0.0";
                        }
                        else if (parseFloat(newValue) > 1.0) {
                            newValue = "1.0";
                        }
                        else if (isNaN(parseFloat(newValue))) {
                            newValue = "0.0";
                        }
                    }
                    if (activeField == field.name) {
                        lastVal = newValue;
                    }
            }
                if (newValue != "" && newValue != "." && parseFloat(newValue) != 0) {
                    newValue = parseFloat(newValue).toString();
                    field.text = newValue;
                }          
                else {
                    newValue = "0.0";
                }          
                var newSwatchRGB = BABYLON.Color3.FromHexString(newSwatch.background);
                if (activeField == field.name) {
                    if (channel == "r") {
                        UpdateValues(new BABYLON.Color3(parseFloat(newValue), newSwatchRGB.g, newSwatchRGB.b), field.name);
                    }
                    else if (channel == "g") {
                        UpdateValues(new BABYLON.Color3(newSwatchRGB.r, parseFloat(newValue), newSwatchRGB.b), field.name);
                    }
                    else {
                        UpdateValues(new BABYLON.Color3(newSwatchRGB.r, newSwatchRGB.g, parseFloat(newValue)), field.name);
                    }
                }

            }

            // Removes the current index from the savedColors array. Drawer can then be regenerated.
            function DeleteSwatch(index: number) {
                if (options.savedColors) {
                    options.savedColors.splice(index, 1);
                }
                if (options.savedColors && options.savedColors.length == 0) {
                    setEditButtonVisibility(false);
                    editSwatchMode = false;
                }
            }

            // Creates and styles an individual swatch when UpdateSwatches is called.
            function CreateSwatch() {
                if (options.savedColors) {
                    if (editSwatchMode) {
                        var icon: string = "b";
                    }
                    else {
                        var icon: string = "";
                    }
                    var swatch: Button = Button.CreateSimpleButton("Swatch_" + swatchNumber, icon);
                    swatch.fontFamily = "BabylonJSglyphs";
                    var swatchColor: Color3 = Color3.FromHexString(options.savedColors[swatchNumber]);
                    var swatchLuminence: number =  swatchColor.r + swatchColor.g + swatchColor.b;

                    // Set color of outline and textBlock based on luminance of the color swatch so feedback always visible
                    if (swatchLuminence > luminanceLimit) {
                        swatch.color = iconColorDark;
                    }
                    else {
                        swatch.color = iconColorLight;
                    }
                    swatch.fontSize = Math.floor(options.swatchSize! * 0.7);
                    swatch.textBlock!.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                    swatch.height = swatch.width = (options.swatchSize!).toString() + "px";
                    swatch.background = options.savedColors[swatchNumber];
                    swatch.thickness = 2;
                    let metadata = swatchNumber;
                    swatch.pointerDownAnimation = () => {
                        swatch.thickness = 4;
                    };
                    swatch.pointerUpAnimation = () => {
                        swatch.thickness = 3;
                    };
                    swatch.pointerEnterAnimation = () => {
                        swatch.thickness = 3;
                    };
                    swatch.pointerOutAnimation = () => {
                        swatch.thickness = 2;
                    };
                    swatch.onPointerClickObservable.add(() => {
                        if (!editSwatchMode) {
                            if (options.savedColors) {
                                UpdateValues(BABYLON.Color3.FromHexString(options.savedColors[metadata]), swatch.name!);
                            }
                        }
                        else {
                            DeleteSwatch(metadata);
                            UpdateSwatches("", butSave);
                        }
                    });
                    return swatch;
                }
                else {
                    return null;
                }
            }

            function EditSwatches(mode?: boolean) {
                if (mode !== undefined) {
                    editSwatchMode = mode;
                }
                if (editSwatchMode) {
                    for (var i = 0; i < swatchDrawer.children.length; i++) {
                        var thisButton: Button = swatchDrawer.children[i] as Button;
                        thisButton.textBlock!.text = "b";
                    }
                    if (butEdit !== undefined) {
                        butEdit.textBlock!.text = "Done";
                    }    
                }
                else {
                    for (var i = 0; i < swatchDrawer.children.length; i++) {
                        var thisButton: Button = swatchDrawer.children[i] as Button;
                        thisButton.textBlock!.text = "";
                    }
                    if (butEdit !== undefined) {
                        butEdit.textBlock!.text = "Edit Swatches";
                    }
                }
            }

            /**
             * When Save Color button is pressed this function will first create a swatch drawer if one is not already
             * made. Then all controls are removed from the drawer and we step through the savedColors array and
             * creates one swatch per color. It will also set the height of the drawer control based on how many
             * saved colors there are and how many can be stored on one row.
             */
            function UpdateSwatches(color: string, button: Button) {
                if (options.savedColors) {

                    if (color != "") {
                        options.savedColors.push(color);
                    }
                    swatchNumber = 0;
                    swatchDrawer.clearControls();
                    var rowCount: number = Math.ceil(options.savedColors.length / options.numSwatchesPerLine!);
                    if (swatchDrawer.rowCount != rowCount) {
                        for (var i = 0; i < swatchDrawer.rowCount; i++) {
                            swatchDrawer.setRowDefinition(i, 1 / rowCount, false);
                        }
                        if (swatchDrawer.rowCount < rowCount) {
                            swatchDrawer.addRowDefinition(1 / rowCount, false);
                        }
                        else {
                            swatchDrawer.removeRowDefinition(swatchDrawer.rowCount - 1);
                        }                      
                    }
                    swatchDrawer.height = ((options.swatchSize! * 1.5) * rowCount).toString() + "px";
                    for (var y = 0; y < rowCount; y++) {

                        // Determine number of buttons to create per row based on the button limit per row and number of saved colors
                        var  adjustedNumberButtons: number = options.savedColors.length - (y * options.numSwatchesPerLine!);
                        var buttonIterations: number = Math.min(Math.max(adjustedNumberButtons, 0), options.numSwatchesPerLine!);
                        for (var x = 0; x < buttonIterations; x++) {
                            if (x > options.numSwatchesPerLine!) {
                                continue;
                            }
                            var swatch: Button | null = CreateSwatch();
                            if (swatch) {
                                swatchDrawer.addControl(swatch, y, x);
                                swatchNumber++;
                            }
                        }
                    }
                    if (options.savedColors.length >= options.swatchLimit!) {
                        DisableButton(button, true);
                    }
                    else {
                        DisableButton(button, false);
                    }
                }
            }

            // Shows or hides edit swatches button depending on if there are saved swatches
            function setEditButtonVisibility(enableButton: boolean) {
                if (enableButton) {
                    butEdit = Button.CreateSimpleButton("butEdit", "Edit Swatches");
                    butEdit.width = "140px";
                    butEdit.height = "35px";
                    butEdit.top = "-10px";
                    butEdit.left = "10px";
                    butEdit.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                    butEdit.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                    butEdit.thickness = 2;
                    butEdit.color = buttonColor;
                    butEdit.fontSize = buttonFontSize;
                    butEdit.background = buttonBackgroundColor;
                    butEdit.onPointerEnterObservable.add(() => {
                        butEdit.background = buttonBackgroundHoverColor;
                    });
                    butEdit.onPointerOutObservable.add(() => {
                        butEdit.background = buttonBackgroundColor;
                    });
                    butEdit.pointerDownAnimation = () => {
                        butEdit.background = buttonBackgroundClickColor;
                    };
                    butEdit.pointerUpAnimation = () => {
                        butEdit.background = buttonBackgroundHoverColor;
                    };
                    butEdit.onPointerClickObservable.add(() => {
                        if (editSwatchMode) {
                            editSwatchMode = false;
                        }
                        else {
                            editSwatchMode = true;
                        }
                        EditSwatches();
                    });
                    pickerPanel.addControl(butEdit, 1, 0);
                }
                else {
                    pickerPanel.removeControl(butEdit);
                }
            }

            // Called when the user hits the limit of saved colors in the drawer.
            function DisableButton(button: Button, disabled: boolean) {
                if(disabled) {
                    button.color = buttonDisabledColor;
                    button.background = buttonDisabledBackgroundColor;    
                }
                else {        
                    button.color = buttonColor;
                    button.background = buttonBackgroundColor;    
                }
            }            

            // Passes last chosen color back to scene and kills dialog by removing from AdvancedDynamicTexture
            function ClosePicker(color: string) {
                if (options.savedColors && options.savedColors.length > 0) {
                    resolve({
                        savedColors: options.savedColors,
                        pickedColor: color
                    });
                }
                else {
                    resolve({
                        pickedColor: color
                    });
                }
                advancedTexture.removeControl(dialogContainer);
            }

            // Dialogue menu container which will contain both the main dialogue window and the swatch drawer which opens once a color is saved.
            var dialogContainer: Grid = new Grid();
            dialogContainer.name = "Dialog Container";
            dialogContainer.width = options.pickerWidth;
            if (options.savedColors) {
                dialogContainer.height = containerSize;
                var topRow: number = parseInt(options.pickerHeight) / parseInt(containerSize);
                dialogContainer.addRowDefinition(topRow, false);
                dialogContainer.addRowDefinition(1.0 - topRow, false);
            }
            else {
                dialogContainer.height = options.pickerHeight;
                dialogContainer.addRowDefinition(1.0, false);
            }
            advancedTexture.addControl(dialogContainer);

            // Swatch Drawer
            if (options.savedColors) {
                swatchDrawer = new Grid();
                swatchDrawer.name = "Swatch Drawer";
                swatchDrawer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                swatchDrawer.background = buttonBackgroundColor;
                swatchDrawer.width = options.pickerWidth!;
                swatchDrawer.height = ((options.swatchSize! * 1.5) * rowCount!).toString() + "px";
                swatchDrawer.top = Math.floor(options.swatchSize! / 4).toString() + "px";
                swatchDrawer.addRowDefinition(1.0, false);
                for (var i = 0; i < options.numSwatchesPerLine!; i++) {
                    swatchDrawer.addColumnDefinition(1 / options.numSwatchesPerLine!, false);
                }    
                dialogContainer.addControl(swatchDrawer, 1, 0);
            }

            // Picker container
            var pickerPanel: Grid = new Grid();
            pickerPanel.name = "Picker Panel";
            // pickerPanel.width = pickerWidth;
            pickerPanel.height = options.pickerHeight;
            var panelHead: number = parseInt(options.headerHeight) / parseInt(options.pickerHeight);
            pickerPanel.addRowDefinition(panelHead, false);
            pickerPanel.addRowDefinition(1.0, false);
            dialogContainer.addControl(pickerPanel, 0, 0);

            // Picker container head
            var header: Rectangle = new Rectangle();
            header.name = "Dialogue Header Bar";
            header.background = "#cccccc";
            header.thickness = 0;
            pickerPanel.addControl(header, 0, 0);

            // Header close button
            var closeButton: Button = Button.CreateSimpleButton("closeButton", "a");
            closeButton.fontFamily = "BabylonJSglyphs";
            var headerColor3: Color3 = Color3.FromHexString(header.background);
            closeIconColor = new Color3(1.0 - headerColor3.r, 1.0 - headerColor3.g, 1.0 - headerColor3.b);
            closeButton.color = closeIconColor.toHexString();
            closeButton.fontSize = Math.floor(parseInt(options.headerHeight!) * 0.6);
            closeButton.textBlock!.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            closeButton.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
            closeButton.height = closeButton.width = options.headerHeight;
            closeButton.background = header.background;
            closeButton.thickness = 0;
            closeButton.pointerDownAnimation = () => {
            };
            closeButton.pointerUpAnimation = () => {
                closeButton.background = header.background;
            };
            closeButton.pointerEnterAnimation = () => {
                closeButton.color = header.background;
                closeButton.background = "red";
            };
            closeButton.pointerOutAnimation = () => {
                closeButton.color = closeIconColor.toHexString();
                closeButton.background = header.background;
            };
            closeButton.onPointerClickObservable.add(() => {
                ClosePicker(currentSwatch.background);
            });
            pickerPanel.addControl(closeButton, 0, 0);

            // Picker container body
            var pickerBody: Grid = new Grid();
            pickerBody.name = "Dialogue Body";
            pickerBody.background = buttonBackgroundColor;
            pickerBody.addRowDefinition(1.0, false);
            pickerBody.addColumnDefinition(0.4375, false);
            pickerBody.addColumnDefinition(0.5625, false);
            pickerPanel.addControl(pickerBody, 1, 0);

            //  Picker control
            picker = new ColorPicker();
            picker.name = "GUI Color Picker";
            picker.height = 0.89;
            picker.width = 0.89;
            picker.value = Color3.FromHexString(options.lastColor);
            picker.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            picker.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            picker.onPointerDownObservable.add(() => {
                activeField = picker.name!;
                lastVal = "";
                EditSwatches(false);
            });
            picker.onValueChangedObservable.add(function(value) { // value is a color3
                if (activeField == picker.name) {
                    UpdateValues(value, picker.name);
                }
            });
            pickerBody.addControl(picker, 0, 0);

            // Picker body right quarant
            var pickerBodyRight: Grid = new Grid();
            pickerBodyRight.name = "Dialogue Right Half";
            pickerBodyRight.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            pickerBodyRight.addRowDefinition(0.514, false);
            pickerBodyRight.addRowDefinition(0.486, false);
            pickerBody.addControl(pickerBodyRight, 1, 1);

            // Picker container swatches and buttons
            var pickerSwatchesButtons: Grid = new Grid();
            pickerSwatchesButtons.name = "Swatches and Buttons";
            pickerSwatchesButtons.addRowDefinition(1.0, false);
            pickerSwatchesButtons.addColumnDefinition(0.417, false);
            pickerSwatchesButtons.addColumnDefinition(0.583, false);
            pickerBodyRight.addControl(pickerSwatchesButtons, 0, 0);

            // Picker Swatches quadrant
            var pickerSwatches: Grid = new Grid();
            pickerSwatches.name = "New and Current Swatches";
            pickerSwatches.addRowDefinition(0.04, false);
            pickerSwatches.addRowDefinition(0.16, false);
            pickerSwatches.addRowDefinition(0.64, false);
            pickerSwatches.addRowDefinition(0.16, false);
            pickerSwatchesButtons.addControl(pickerSwatches, 0, 0);

            // Active swatches
            var activeSwatches: Grid = new Grid();
            activeSwatches.name = "Active Swatches";
            activeSwatches.width = 0.67;
            activeSwatches.addRowDefinition(0.5, false);
            activeSwatches.addRowDefinition(0.5, false);
            pickerSwatches.addControl(activeSwatches, 2, 0)

            // New color swatch and old color swatch
            var newText: TextBlock = new TextBlock();
            newText.text = "new";
            newText.name = "New Color Label";
            newText.color = buttonColor;
            newText.fontSize = 16;
            pickerSwatches.addControl(newText, 1, 0);

            newSwatch = new Rectangle();
            newSwatch.name = "New Color Swatch";
            newSwatch.background = options.lastColor;
            newSwatch.thickness = 0;
            activeSwatches.addControl(newSwatch, 0, 0);

            var currentSwatch: Button = Button.CreateSimpleButton("currentSwatch", "");
            currentSwatch.background = options.lastColor;
            currentSwatch.thickness = 0;
            currentSwatch.onPointerClickObservable.add(() => {
                var revertColor = Color3.FromHexString(currentSwatch.background);
                UpdateValues(revertColor, currentSwatch.name!);
                EditSwatches(false);
            });
            currentSwatch.pointerDownAnimation = () => {};
            currentSwatch.pointerUpAnimation = () => {};
            currentSwatch.pointerEnterAnimation = () => {};
            currentSwatch.pointerOutAnimation = () => {};
            activeSwatches.addControl(currentSwatch, 1, 0);

            var swatchOutline: Rectangle = new Rectangle();
            swatchOutline.name = "Swatch Outline";
            swatchOutline.width = 0.67;
            swatchOutline.thickness = 2;
            swatchOutline.color = currentSwatchesOutlineColor;
            swatchOutline.isHitTestVisible = false;
            pickerSwatches.addControl(swatchOutline, 2, 0);

            var currentText: TextBlock = new TextBlock();
            currentText.name = "Current Color Label";
            currentText.text = "current";
            currentText.color = buttonColor;
            currentText.fontSize = 16;
            pickerSwatches.addControl(currentText, 3, 0);

            // Picker color values input
            var pickerColorValues: Grid = new Grid();
            pickerColorValues.name = "Dialog Lower Right";
            pickerColorValues.addRowDefinition(10, true);
            pickerColorValues.addRowDefinition(115, true);
            pickerColorValues.addRowDefinition(35, true);
            pickerBodyRight.addControl(pickerColorValues, 1, 0);

            // Buttons grid
            var buttonGrid: Grid = new Grid();
            buttonGrid.name = "Button Grid";
            buttonGrid.height = 0.8;
            buttonGrid.addRowDefinition(1 / 3, false);
            buttonGrid.addRowDefinition(1 / 3, false);
            buttonGrid.addRowDefinition(1 / 3, false);
            pickerSwatchesButtons.addControl(buttonGrid, 0, 1);
                        
            // Panel Buttons
            var butOK: Button = Button.CreateSimpleButton("butOK", "OK");
            butOK.width = 0.67;
            butOK.height = 0.7;
            butOK.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            butOK.thickness = 2;
            butOK.color = buttonColor;
            butOK.fontSize = buttonFontSize;
            butOK.background = buttonBackgroundColor;
            butOK.onPointerEnterObservable.add(() => { butOK.background = buttonBackgroundHoverColor; });
            butOK.onPointerOutObservable.add(() => { butOK.background = buttonBackgroundColor; });
            butOK.pointerDownAnimation = () => {
                butOK.background = buttonBackgroundClickColor;
            };
            butOK.pointerUpAnimation = () => {
                butOK.background = buttonBackgroundHoverColor;
            };
            butOK.onPointerClickObservable.add(() => {
                EditSwatches(false);
                ClosePicker(newSwatch.background);
            });
            buttonGrid.addControl(butOK, 0, 0);

            var butCancel: Button = Button.CreateSimpleButton("butCancel", "Cancel");
            butCancel.width = 0.67;
            butCancel.height = 0.7;
            butCancel.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            butCancel.thickness = 2;
            butCancel.color = buttonColor;
            butCancel.fontSize = buttonFontSize;
            butCancel.background = buttonBackgroundColor;
            butCancel.onPointerEnterObservable.add(() => { butCancel.background = buttonBackgroundHoverColor; });
            butCancel.onPointerOutObservable.add(() => { butCancel.background = buttonBackgroundColor; });
            butCancel.pointerDownAnimation = () => {
                butCancel.background = buttonBackgroundClickColor;
            };
            butCancel.pointerUpAnimation = () => {
                butCancel.background = buttonBackgroundHoverColor;
            };
            butCancel.onPointerClickObservable.add(() => {
                EditSwatches(false);
                ClosePicker(currentSwatch.background);
            });
            buttonGrid.addControl(butCancel, 1, 0);

            if (options.savedColors) {
                var butSave: Button = Button.CreateSimpleButton("butSave", "Save Swatch");
                butSave.width = 0.67;
                butSave.height = 0.7;
                butSave.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
                butSave.thickness = 2;
                butSave.fontSize = buttonFontSize;
                if (options.savedColors.length < options.swatchLimit!) {
                    butSave.color = buttonColor;
                    butSave.background = buttonBackgroundColor;
                }
                else {
                    DisableButton(butSave, true);
                }
                butSave.onPointerEnterObservable.add(() => {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit!) {
                            butSave.background = buttonBackgroundHoverColor;
                        }
                    }
                });
                butSave.onPointerOutObservable.add(() => {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit!) {
                            butSave.background = buttonBackgroundColor;
                        }
                    }
                });
                butSave.pointerDownAnimation = () => {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit!) {
                            butSave.background = buttonBackgroundClickColor;
                        }
                    }
                };
                butSave.pointerUpAnimation = () => {
                    if (options.savedColors) {
                        if (options.savedColors.length < options.swatchLimit!) {
                            butSave.background = buttonBackgroundHoverColor;
                        }
                    }
                };
                butSave.onPointerClickObservable.add(() => {
                    if (options.savedColors) {
                        if (options.savedColors.length == 0) {
                            setEditButtonVisibility(true);
                        }
                        if (options.savedColors.length < options.swatchLimit!) {
                            UpdateSwatches(newSwatch.background, butSave);
                        }
                        EditSwatches(false);                        
                    }
                });
                if (options.savedColors.length > 0) {
                    setEditButtonVisibility(true);
                }
                buttonGrid.addControl(butSave, 2, 0);
            }

            // RGB values text boxes
            currentColor = Color3.FromHexString(options.lastColor);
            var rgbValuesQuadrant: Grid = new Grid();
            rgbValuesQuadrant.name = "RGB Values";
            rgbValuesQuadrant.width = 0.82;
            rgbValuesQuadrant.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            rgbValuesQuadrant.addRowDefinition(1 / 3, false);
            rgbValuesQuadrant.addRowDefinition(1 / 3, false);
            rgbValuesQuadrant.addRowDefinition(1 / 3, false);
            rgbValuesQuadrant.addColumnDefinition(0.1, false);
            rgbValuesQuadrant.addColumnDefinition(0.2, false);
            rgbValuesQuadrant.addColumnDefinition(0.7, false);
            pickerColorValues.addControl(rgbValuesQuadrant, 1, 0);

            for (var i = 0; i < inputFieldLabels.length; i++) {
                var labelText: TextBlock = new TextBlock();
                labelText.text = inputFieldLabels[i];
                labelText.color = buttonColor;
                labelText.fontSize = 16;
                rgbValuesQuadrant.addControl(labelText, i, 0);
            }

            // Input fields for RGB values
            rValInt = new InputText();
            rValInt.width = 0.83;
            rValInt.height = 0.72;
            rValInt.name = "rIntField";
            rValInt.fontSize = buttonFontSize;
            rValInt.text = (currentColor.r * 255).toString();
            rValInt.color = inputTextColor;
            rValInt.background = inputTextBackgroundColor;
            rValInt.onFocusObservable.add(() => {
                activeField = rValInt.name!;
                lastVal = rValInt.text;
                EditSwatches(false);
            });
            rValInt.onBlurObservable.add(() => {
                if (rValInt.text == "") {
                    rValInt.text = "0";
                }
                UpdateInt(rValInt, "r");
                if (activeField == rValInt.name) {
                    activeField = "";
                }
            });
            rValInt.onTextChangedObservable.add(() => {
                if (activeField == rValInt.name) {
                    UpdateInt(rValInt, "r");
                }
            });
            rgbValuesQuadrant.addControl(rValInt, 0, 1);

            gValInt = new InputText();
            gValInt.width = 0.83;
            gValInt.height = 0.72;
            gValInt.name = "gIntField";
            gValInt.fontSize = buttonFontSize;
            gValInt.text = (currentColor.g * 255).toString();
            gValInt.color = inputTextColor;
            gValInt.background = inputTextBackgroundColor;
            gValInt.onFocusObservable.add(() => {
                activeField = gValInt.name!;
                lastVal = gValInt.text;
                EditSwatches(false);
            });
            gValInt.onBlurObservable.add(() => {
                if (gValInt.text == "") {
                    gValInt.text = "0";
                }
                UpdateInt(gValInt, "g");
                if (activeField == gValInt.name) {
                    activeField = "";
                }
           });
            gValInt.onTextChangedObservable.add(() => {
                if (activeField == gValInt.name) {
                    UpdateInt(gValInt, "g");
                }
            });
            rgbValuesQuadrant.addControl(gValInt, 1, 1);

            bValInt = new InputText();
            bValInt.width = 0.83;
            bValInt.height = 0.72;
            bValInt.name = "bIntField";
            bValInt.fontSize = buttonFontSize;
            bValInt.text = (currentColor.b * 255).toString();
            bValInt.color = inputTextColor;
            bValInt.background = inputTextBackgroundColor;
            bValInt.onFocusObservable.add(() => {
                activeField = bValInt.name!;
                lastVal = bValInt.text;
                EditSwatches(false);
            });
            bValInt.onBlurObservable.add(() => {
                if (bValInt.text == "") {
                    bValInt.text = "0";
                }
                UpdateInt(bValInt, "b");
                if (activeField == bValInt.name) {
                    activeField = "";
                }
            });
            bValInt.onTextChangedObservable.add(() => {
                if (activeField == bValInt.name) {
                    UpdateInt(bValInt, "b");
                }
            });
            rgbValuesQuadrant.addControl(bValInt, 2, 1);

            rValDec = new InputText();
            rValDec.width = 0.95;
            rValDec.height = 0.72;
            rValDec.name = "rDecField";
            rValDec.fontSize = buttonFontSize;
            rValDec.text = currentColor.r.toString();
            rValDec.color = inputTextColor;
            rValDec.background = inputTextBackgroundColor;
            rValDec.onFocusObservable.add(() => {
                activeField = rValDec.name!;
                lastVal = rValDec.text;
                EditSwatches(false);
            });
            rValDec.onBlurObservable.add(() => {
                if (parseFloat(rValDec.text) == 0 || rValDec.text == "") {
                    rValDec.text = "0";
                    UpdateFloat(rValDec, "r");
                }
                if (activeField == rValDec.name) {
                    activeField = "";
                }
            });
            rValDec.onTextChangedObservable.add(() => {
                if (activeField == rValDec.name) {
                    UpdateFloat(rValDec, "r");
                }
            });
            rgbValuesQuadrant.addControl(rValDec, 0, 2);

            gValDec = new InputText();
            gValDec.width = 0.95;
            gValDec.height = 0.72;
            gValDec.name = "gDecField";
            gValDec.fontSize = buttonFontSize;
            gValDec.text = currentColor.g.toString();
            gValDec.color = inputTextColor;
            gValDec.background = inputTextBackgroundColor;
            gValDec.onFocusObservable.add(() => {
                activeField = gValDec.name!;
                lastVal = gValDec.text;
                EditSwatches(false);
            });
            gValDec.onBlurObservable.add(() => {
                if (parseFloat(gValDec.text) == 0 || gValDec.text == "") {
                    gValDec.text = "0";
                    UpdateFloat(gValDec, "g");
                }
                if (activeField == gValDec.name) {
                    activeField = "";
                }
            });
            gValDec.onTextChangedObservable.add(() => {
                if (activeField == gValDec.name) {
                    UpdateFloat(gValDec, "g");
                }
            });
            rgbValuesQuadrant.addControl(gValDec, 1, 2);

            bValDec = new InputText();
            bValDec.width = 0.95;
            bValDec.height = 0.72;
            bValDec.name = "bDecField";
            bValDec.fontSize = buttonFontSize;
            bValDec.text = currentColor.b.toString();
            bValDec.color = inputTextColor;
            bValDec.background = inputTextBackgroundColor;
            bValDec.onFocusObservable.add(() => {
                activeField = bValDec.name!;
                lastVal = bValDec.text;
                EditSwatches(false);
            });
            bValDec.onBlurObservable.add(() => {
                if (parseFloat(bValDec.text) == 0 || bValDec.text == "") {
                    bValDec.text = "0";
                    UpdateFloat(bValDec, "b");
                }
                if (activeField == bValDec.name) {
                    activeField = "";
                }
            });
            bValDec.onTextChangedObservable.add(() => {
                if (activeField == bValDec.name) {
                    UpdateFloat(bValDec, "b");
                }
            });
            rgbValuesQuadrant.addControl(bValDec, 2, 2);

            // Hex value input
            var hexValueQuadrant: Grid = new Grid();
            hexValueQuadrant.name = "Hex Value";
            hexValueQuadrant.width = 0.82;
            hexValueQuadrant.addRowDefinition(1.0, false);
            hexValueQuadrant.addColumnDefinition(0.1, false);
            hexValueQuadrant.addColumnDefinition(0.9, false);
            pickerColorValues.addControl(hexValueQuadrant, 2, 0);

            var labelText: TextBlock = new TextBlock();
            labelText.text = "#";
            labelText.color = buttonColor;
            labelText.fontSize = buttonFontSize;
            hexValueQuadrant.addControl(labelText, 0, 0);

            hexVal = new InputText();
            hexVal.width = 0.96;
            hexVal.height = 0.72;
            hexVal.name = "hexField";
            hexVal.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            hexVal.fontSize = buttonFontSize;
            var minusPound = options.lastColor.split("#");
            hexVal.text = minusPound[1];
            hexVal.color = inputTextColor;
            hexVal.background = inputTextBackgroundColor;
            hexVal.onFocusObservable.add(() => {
                activeField = hexVal.name!;
                lastVal = hexVal.text;
                EditSwatches(false);
            });
            hexVal.onBlurObservable.add(() => {
                if (hexVal.text.length == 3) {
                    var val = hexVal.text.split("");
                    hexVal.text = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
                }
                if (hexVal.text == "") {
                    hexVal.text = "000000";
                    UpdateValues(Color3.FromHexString(hexVal.text), "b");
                }
                if (activeField == hexVal.name) {
                    activeField = "";
                }
            });
            hexVal.onTextChangedObservable.add(() => {
                var newHexValue: string = hexVal.text;
                var checkHex: boolean = /[^0-9A-F]/i.test(newHexValue);
                if ((hexVal.text.length > 6 || checkHex) && activeField == hexVal.name) {
                    hexVal.text = lastVal;
                }
                else {
                    if (hexVal.text.length < 6) {
                        var leadingZero: Number = 6 - hexVal.text.length;
                        for (var i = 0; i < leadingZero; i++) {
                            newHexValue = "0" + newHexValue;
                        }
                    }
                    if (hexVal.text.length == 3) {
                        var val: string[] = hexVal.text.split("");
                        newHexValue = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
                    }
                    newHexValue = "#" + newHexValue;
                    if (activeField == hexVal.name) {
                        lastVal = hexVal.text;
                        UpdateValues(Color3.FromHexString(newHexValue), hexVal.name);
                    }
                }
            });
            hexValueQuadrant.addControl(hexVal, 0, 1);

            if (options.savedColors && options.savedColors.length > 0) {
                UpdateSwatches("", butSave!);
            }
        });
    }
}