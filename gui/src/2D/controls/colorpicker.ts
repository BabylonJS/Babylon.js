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

    private _isPointOnSquare(coordinates: Vector2): boolean {
        this._updateSquareProps();

        var left = this._squareLeft;
        var top = this._squareTop;
        var size = this._squareSize;

        if (coordinates.x >= left && coordinates.x <= left + size &&
            coordinates.y >= top && coordinates.y <= top + size) {
            return true;
        }

        return false;
    }

    private _isPointOnWheel(coordinates: Vector2): boolean {
        var radius = Math.min(this._currentMeasure.width, this._currentMeasure.height) * .5;
        var centerX = radius + this._currentMeasure.left;
        var centerY = radius + this._currentMeasure.top;
        var wheelThickness = radius * .2;
        var innerRadius = radius - wheelThickness;
        var radiusSq = radius * radius;
        var innerRadiusSq = innerRadius * innerRadius;

        var dx = coordinates.x - centerX;
        var dy = coordinates.y - centerY;

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

        if (this._isPointOnSquare(coordinates)) {
            this._pointerStartedOnSquare = true;
        } else if (this._isPointOnWheel(coordinates)) {
            this._pointerStartedOnWheel = true;
        }

        this._updateValueFromPointer(coordinates.x, coordinates.y);
        this._host._capturingControl[pointerId] = this;

        return true;
    }

    public _onPointerMove(target: Control, coordinates: Vector2): void {
        if (this._pointerIsDown) {
            this._updateValueFromPointer(coordinates.x, coordinates.y);
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
            lastColor?: string, 
            swatchLimit?: number, 
            swatchSize?: number, 
            numSwatchesPerLine?: number, 
            savedColors?:Array<string>}
    ): Promise<{
        savedColors?: string[],
        pickedColor: string
    }> {

        return new Promise((resolve, reject) => {
            // Default options
            options.pickerWidth = options.pickerWidth || "640px";
            options.pickerHeight = options.pickerHeight || "400px";
            options.lastColor = options.lastColor || "#000000";
            options.swatchLimit = options.swatchLimit || 20;
            options.swatchSize = options.swatchSize || 40;
            options.numSwatchesPerLine = options.numSwatchesPerLine || 10;  

            // Button Colors
            var buttonBackgroundColor = "#535353";
            var buttonBackgroundHoverColor = "#414141";
            var buttonBackgroundClickColor = "515151";
            var buttonDisabledColor = "#555555";
            var buttonDisabledBackgroundColor = "#454545";
            var buttonFontSize = 16;

            // Stroke Colors
            var darkStrokeColor = "#404040";
            var lightStrokeColor = "#c0c0c0";
            var inputFieldLabels = ["R", "G", "B"];
            var inputTextBackgroundColor = "#454545";
            var inputTextColor = "#f0f0f0";

            // This is the current color as set by either the picker or by entering a value
            var currentColor;

            // This int is used for naming swatches and serves as the index for calling them from the list
            var swatchNumber: number;

            // Menu Panel options. We need to know if the swatchDrawer exists so we can create it if needed.
            var swatchDrawerOpen: boolean = false;
            var swatchDrawer: Grid;
            var editSwatchMode = false;

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
                var rowCount = Math.ceil(options.savedColors.length/options.numSwatchesPerLine);
            }

            /** 
            * Will update all values for InputText and ColorPicker controls based on the BABYLON.Color3 passed to this function.
            * Each InputText control and the ColorPicker control will be tested to see if they are the activeField and if they
            * are will receive no update. This is to prevent the input from the user being overwritten.
            */
            function UpdateValues(value: Color3) {
                var pickedColor = value.toHexString(); 
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
                    var minusPound = pickedColor.split("#");
                    hexVal.text = minusPound[1];  
                }
                if (picker.name != activeField) {
                    picker.value = value;
                }
            }

            // When the user enters an integer for R, G, or B we check to make sure it is a valid number and replace if not. 
            function UpdateInt(field: InputText, channel: string) { 
                var newValue = field.text;
                var checkVal = /[^0-9]/g.test(newValue);
                if (checkVal) {
                    field.text = lastVal;
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
                        if (activeField == field.name) {
                            lastVal = newValue;
                        }
                    }
                }
                if (newValue != "") {
                    newValue = parseInt(newValue).toString();
                    field.text = newValue;
                    var newSwatchRGB = BABYLON.Color3.FromHexString(newSwatch.background);
                    if (activeField == field.name) {
                        if (channel == "r"){
                            UpdateValues(new BABYLON.Color3((parseInt(newValue)) / 255, newSwatchRGB.g, newSwatchRGB.b));    
                        }
                        else if (channel == "g") {
                            UpdateValues(new BABYLON.Color3(newSwatchRGB.r, (parseInt(newValue)) / 255, newSwatchRGB.b));    
                        }
                        else {
                            UpdateValues(new BABYLON.Color3(newSwatchRGB.r, newSwatchRGB.g, (parseInt(newValue)) / 255));    
                        }
                    }
                }
            }

            // When the user enters a float for R, G, or B we check to make sure it is a valid number and replace if not. 
            function UpdateFloat(field: InputText, channel: string) { 
                var newValue = field.text;
                var checkVal = /[^0-9\.]/g.test(newValue);
                if (checkVal) {
                    field.text = lastVal;
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
                        if (activeField == field.name) {
                            lastVal = newValue;
                        }
                    }
                }
                if (newValue != "" && newValue != "." && parseFloat(newValue) != 0) {
                    newValue = parseFloat(newValue).toString();
                    field.text = newValue;    
                    var newSwatchRGB = BABYLON.Color3.FromHexString(newSwatch.background);
                    if (activeField == field.name) {
                        if (channel == "r"){
                            UpdateValues(new BABYLON.Color3(parseFloat(newValue), newSwatchRGB.g, newSwatchRGB.b));    
                        }
                        else if (channel == "g") {
                            UpdateValues(new BABYLON.Color3(newSwatchRGB.r, parseFloat(newValue), newSwatchRGB.b));    
                        }
                        else {
                            UpdateValues(new BABYLON.Color3(newSwatchRGB.r, newSwatchRGB.g, parseFloat(newValue)));    
                        }
                    }
                }
            }

            // Called when the user hits the limit of saved colors in the drawer. 
            function DisableButton(button: Button) {
                button.color = buttonDisabledColor;
                button.background = buttonDisabledBackgroundColor;
            }

            // Removes the current index from the savedColors array. Drawer can then be regenerated. 
            function DeleteSwatch(index: number) {
                if (options.savedColors) {
                    options.savedColors.splice(index, 1);
                }
            }

            // Creates and styles an individual swatch when SaveColor is called. 
            function CreateSwatch() {
                if (options.savedColors) {
                    if (editSwatchMode) {
                        var icon: string = "b";
                    }
                    else {
                        var icon: string = "";
                    }
                    var swatch: Button = Button.CreateSimpleButton("Swatch_" + swatchNumber, icon);
                    swatch.height = swatch.width = (options.swatchSize!).toString() + "px";
                    swatch.background = options.savedColors[swatchNumber];
                    swatch.thickness = 2;
                    swatch.metadata = swatchNumber;
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
                                UpdateValues(BABYLON.Color3.FromHexString(options.savedColors[swatch.metadata]));
                            }
                        }
                        else {
                            DeleteSwatch(swatch.metadata);
                            SaveColor("", butSave);
                        } 
                    });
                    console.log("swatch: " + swatch.name + ": " + options.savedColors[swatch.metadata]);
                    return swatch;
                }
                else {
                    return null;
                }
            }

            /** 
             * When Save Color button is pressed this function will first create a swatch drawer if one is not already 
             * made. Then all controls are removed from the drawer and we step through the savedColors array and 
             * creates one swatch per color. It will also set the height of the drawer control based on how many 
             * saved colors there are and how many can be stored on one row. 
             */
            function SaveColor(color: string, button: Button) {
                if (options.savedColors) {
                    if (!swatchDrawerOpen) {
                        swatchDrawer = new Grid();
                        swatchDrawer.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                        swatchDrawer.background = buttonBackgroundColor;
                        swatchDrawer.width = options.pickerWidth!;
                        swatchDrawer.height = (options.swatchSize! * 1.5).toString() + "px";
                        swatchDrawer.top = Math.floor(options.swatchSize! / 4).toString() + "px";
                        swatchDrawer.addRowDefinition(1.0, false);
                        for (var i = 0; i < options.numSwatchesPerLine!; i++) {
                            swatchDrawer.addColumnDefinition(1 / options.numSwatchesPerLine!, false);            
                        }  
                    }
                    if (color != "") {
                        options.savedColors.push(color);
                    }
                    swatchNumber = 0;
                    swatchDrawer.clearControls();
                    for (var y = 0; y < rowCount; y++) {
                        if (swatchDrawer.rowCount < rowCount) {
                            swatchDrawer.addRowDefinition(1 / rowCount, false);
                        }
                        for (var i = 0; i < rowCount; i++) {
                            swatchDrawer.setRowDefinition(i, 1 / rowCount, false);
                        }

                        // Update diaogue container sizes
                        dialogContainer.height = (parseInt(options.pickerHeight!) + ((options.swatchSize! * 1.5) * (rowCount!))).toString() + "px";
                        var topRow = parseInt(options.pickerHeight!) / parseInt(dialogContainer.height);
                        dialogContainer.setRowDefinition(0, topRow, false);
                        dialogContainer.setRowDefinition(1, 1.0 - topRow, false);

                        swatchDrawer.height = ((options.swatchSize! * 1.5) * rowCount).toString() + "px";
                        
                        // Determine number of buttons to create per row based on the button limit per row and number of saved colors
                        var  adjustedNumberButtons = options.savedColors.length - (y * options.numSwatchesPerLine!);
                        var buttonIterations = Math.min(Math.max(adjustedNumberButtons, 0), options.numSwatchesPerLine!);
                        for (var x = 0; x < buttonIterations; x++) {
                            if (x > options.numSwatchesPerLine!) {
                                continue;
                            }
                            var swatch = CreateSwatch();
                            if (swatch) {
                                swatchDrawer.addControl(swatch, y, x);
                                swatchNumber++;    
                            }
                        }   
                    }
                    if (options.savedColors.length >= options.swatchLimit!) {
                        DisableButton(button);
                    }
                    dialogContainer.addControl(swatchDrawer, 1, 0);
                }

            }

            function AddSwatchControl() {
                // Add Edit button to the picker panel
                var butEdit = Button.CreateSimpleButton("butEdit", "Edit Swatches");
                butEdit.width = "140px";
                butEdit.height = "35px";
                butEdit.top = "-10px";
                butEdit.left = "10px";
                butEdit.verticalAlignment = Control.VERTICAL_ALIGNMENT_BOTTOM;
                butEdit.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
                butEdit.thickness = 2;
                butEdit.color = lightStrokeColor;
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
                        (butEdit.children[0] as TextBlock).text = "Edit Swatches";
                    }
                    else {
                        editSwatchMode = true;
                        (butEdit.children[0] as TextBlock).text = "Done";
                    }
                });
                pickerPanel.addControl(butEdit, 1, 0);               
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
            var dialogContainer = new Grid();
            dialogContainer.name = "Dialog Container";
            dialogContainer.width = options.pickerWidth;
            if (options.savedColors) {
                dialogContainer.height = (parseInt(options.pickerHeight) + ((options.swatchSize * 1.5) * (rowCount!))).toString() + "px";
                var topRow = parseInt(options.pickerHeight) / parseInt(dialogContainer.height);
                dialogContainer.addRowDefinition(topRow, false);
                dialogContainer.addRowDefinition(1.0 - topRow, false);
            }
            else {
                dialogContainer.height = parseInt(options.pickerHeight);
                dialogContainer.addRowDefinition(1.0, false);
            }
            advancedTexture.addControl(dialogContainer);

            // Picker container
            var pickerPanel = new Grid();
            pickerPanel.name = "Picker Panel";
            // pickerPanel.width = pickerWidth;
            pickerPanel.height = options.pickerHeight;
            pickerPanel.addRowDefinition(35, true);
            pickerPanel.addRowDefinition(1.0, false);
            dialogContainer.addControl(pickerPanel, 0, 0);

            // Picker container head
            var header = new Rectangle();
            header.name = "Dialogue Header Bar";
            header.background = "#cccccc";
            header.thickness = 0;
            pickerPanel.addControl(header, 0, 0);

            // Picker container body
            var pickerBody = new Grid();
            pickerBody.name = "Dialogue Body";
            pickerBody.background = buttonBackgroundColor;
            pickerBody.addRowDefinition(1.0, false);
            pickerBody.addColumnDefinition(280, true);
            pickerBody.addColumnDefinition(1.0, false);
            pickerPanel.addControl(pickerBody, 1, 0);

            //  Picker control
            picker = new ColorPicker();
            picker.name = "GUI Color Picker";
            picker.height = "250px";
            picker.width = "250px";
            picker.top = "45px";
            picker.left = "8px";
            picker.value = Color3.FromHexString(options.lastColor);
            picker.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
            picker.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            picker.onPointerDownObservable.add(() => {
                activeField = picker.name!;
            });
            picker.onValueChangedObservable.add(function(value) { // value is a color3
                if (activeField == picker.name) {
                    UpdateValues(value);
                }
            });
            pickerBody.addControl(picker, 0, 0);

            // Picker body right quarant
            var pickerBodyRight = new Grid();
            pickerBodyRight.name = "Dialogue Right Half";
            pickerBodyRight.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            pickerBodyRight.addRowDefinition(185, true);
            pickerBodyRight.addRowDefinition(1.0, false);
            pickerBody.addControl(pickerBodyRight, 1, 1);

            // Picker container swatches and buttons
            var pickerSwatchesButtons = new Grid();
            pickerSwatchesButtons.name = "Swatches and Buttons";
            pickerSwatchesButtons.addRowDefinition(1.0, false);
            pickerSwatchesButtons.addColumnDefinition(150, true);
            pickerSwatchesButtons.addColumnDefinition(1.0, false);
            pickerBodyRight.addControl(pickerSwatchesButtons, 0, 0);

            // Picker Swatches quadrant
            var pickerSwatches = new Grid();
            pickerSwatches.name = "New and Current Swatches";
            pickerSwatches.top = "5px";
            pickerSwatches.addRowDefinition(0.5, false);
            pickerSwatches.addRowDefinition(60, true);
            pickerSwatches.addRowDefinition(60, true);
            pickerSwatches.addRowDefinition(0.5, false);
            pickerSwatchesButtons.addControl(pickerSwatches, 0, 0);

            // Picker color values input
            var pickerColorValues = new Grid();
            pickerColorValues.addRowDefinition(10, true);
            pickerColorValues.addRowDefinition(115, true);
            pickerColorValues.addRowDefinition(35, true);
            pickerBodyRight.addControl(pickerColorValues, 1, 0);

            // New color swatch and old color swatch
            var newText = new TextBlock();
            newText.text = "new";
            newText.color = lightStrokeColor;
            newText.fontSize = 16;
            pickerSwatches.addControl(newText, 0, 0);    

            newSwatch = new Rectangle();
            newSwatch.background = options.lastColor;
            newSwatch.width = "100px";
            newSwatch.height = "60px";
            newSwatch.thickness = 0;
            pickerSwatches.addControl(newSwatch, 1, 0);

            var currentSwatch = Button.CreateSimpleButton("currentSwatch", "");
            currentSwatch.background = options.lastColor;
            currentSwatch.width = "100px";
            currentSwatch.height = "60px";
            currentSwatch.thickness = 0;
            currentSwatch.onPointerClickObservable.add(() => { 
                var revertColor = Color3.FromHexString(currentSwatch.background);
                UpdateValues(revertColor); 
            });
            currentSwatch.pointerDownAnimation = () => {};
            currentSwatch.pointerUpAnimation = () => {};
            currentSwatch.pointerEnterAnimation = () => {};
            currentSwatch.pointerOutAnimation = () => {};
            pickerSwatches.addControl(currentSwatch, 2, 0);

            var swatchOutline = new Rectangle();
            swatchOutline.width = "100px";
            swatchOutline.height = "120px";
            swatchOutline.top = "5px";
            swatchOutline.thickness = 2;
            swatchOutline.color = darkStrokeColor;
            swatchOutline.isHitTestVisible = false;
            pickerSwatchesButtons.addControl(swatchOutline, 0, 0);

            var currentText = new TextBlock();
            currentText.text = "current";
            currentText.color = lightStrokeColor;
            currentText.fontSize = 16;
            pickerSwatches.addControl(currentText, 3, 0);   
            
            // Panel Buttons
            var butOK = Button.CreateSimpleButton("butOK", "OK");
            butOK.width = "140px";
            butOK.height = "35px";
            butOK.top = "29px";
            butOK.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            butOK.thickness = 2;
            butOK.color = lightStrokeColor;
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
                ClosePicker(newSwatch.background); 
            });
            pickerSwatchesButtons.addControl(butOK, 0, 1);     
        
            var butCancel = Button.CreateSimpleButton("butCancel", "Cancel");
            butCancel.width = "140px";
            butCancel.height = "35px";
            butCancel.top = "77px";
            butCancel.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
            butCancel.thickness = 2;
            butCancel.color = lightStrokeColor;
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
                ClosePicker(currentSwatch.background); 
            });
            pickerSwatchesButtons.addControl(butCancel, 0, 1);     
        
/************* DELETE NEXT LINE ********************/
console.log(butCancel.name + " button text: " + butCancel.children[0].name);

            if (options.savedColors) {
                var butSave = Button.CreateSimpleButton("butSave", "Save Swatch");
                butSave.width = "140px";
                butSave.height = "35px";
                butSave.top = "127px";
                butSave.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
                butSave.thickness = 2;
                butSave.fontSize = buttonFontSize;
                if (options.savedColors.length < options.swatchLimit) {
                    butSave.color = lightStrokeColor;
                    butSave.background = buttonBackgroundColor;
                }
                else {
                    DisableButton(butSave);
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
                        console.log("savedColors Length: " + options.savedColors.length);
                        if (options.savedColors.length == 0) {
                            AddSwatchControl();
                        }
                        if (options.savedColors.length < options.swatchLimit!) {
                            SaveColor(newSwatch.background, butSave); 
                        }     
                    } 
                });
                if (options.savedColors.length > 0) {
                    AddSwatchControl();
                }
                pickerSwatchesButtons.addControl(butSave, 0, 1);         
            }
        
            // RGB values text boxes
            currentColor = Color3.FromHexString(options.lastColor);
            var rgbValuesQuadrant = new Grid();
            rgbValuesQuadrant.width = "300px";
            rgbValuesQuadrant.verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
            rgbValuesQuadrant.addRowDefinition(1/3, false);
            rgbValuesQuadrant.addRowDefinition(1/3, false);
            rgbValuesQuadrant.addRowDefinition(1/3, false);
            rgbValuesQuadrant.addColumnDefinition(0.1, false);
            rgbValuesQuadrant.addColumnDefinition(0.2, false);
            rgbValuesQuadrant.addColumnDefinition(0.7, false);
            pickerColorValues.addControl(rgbValuesQuadrant, 1, 0);

            for (var i = 0; i < inputFieldLabels.length; i++) {
                var labelText = new TextBlock();
                labelText.text = inputFieldLabels[i];
                labelText.color = lightStrokeColor;
                labelText.fontSize = 16;
                rgbValuesQuadrant.addControl(labelText, i, 0);
            }

            // Input fields for RGB values
            rValInt = new InputText();
            rValInt.width = "50px";
            rValInt.height = "27px";
            rValInt.name = "rIntField"
            rValInt.fontSize = buttonFontSize;
            rValInt.text = (currentColor.r * 255).toString();
            rValInt.color = inputTextColor;
            rValInt.background = inputTextBackgroundColor;
            rValInt.onFocusObservable.add(() => {
                activeField = rValInt.name!;
                lastVal = rValInt.text;
            });
            rValInt.onBlurObservable.add(() => {
                activeField = "";
            });
            rValInt.onTextChangedObservable.add(() => {
                UpdateInt(rValInt, "r");
            });
            rgbValuesQuadrant.addControl(rValInt, 0, 1);

            gValInt = new InputText();
            gValInt.width = "50px";
            gValInt.height = "27px";
            gValInt.name = "gIntField"
            gValInt.fontSize = buttonFontSize;
            gValInt.text = (currentColor.g * 255).toString();
            gValInt.color = inputTextColor;
            gValInt.background = inputTextBackgroundColor;
            gValInt.onFocusObservable.add(() => {
                activeField = gValInt.name!;
                lastVal = gValInt.text;
            });
            gValInt.onBlurObservable.add(() => {
                activeField = "";
            });
            gValInt.onTextChangedObservable.add(() => {
                UpdateInt(gValInt, "g");
            });
            rgbValuesQuadrant.addControl(gValInt, 1, 1);

            bValInt = new InputText();
            bValInt.width = "50px";
            bValInt.height = "27px";
            bValInt.name = "bIntField"
            bValInt.fontSize = buttonFontSize;
            bValInt.text = (currentColor.b * 255).toString();
            bValInt.color = inputTextColor;
            bValInt.background = inputTextBackgroundColor;
            bValInt.onFocusObservable.add(() => {
                activeField = bValInt.name!;
                lastVal = bValInt.text;
            });
            bValInt.onBlurObservable.add(() => {
                activeField = "";
            });
            bValInt.onTextChangedObservable.add(() => {
                UpdateInt(bValInt, "b");
            });
            rgbValuesQuadrant.addControl(bValInt, 2, 1);

            rValDec = new InputText();
            rValDec.width = "200px";
            rValDec.height = "27px";
            rValDec.name = "rDecField"
            rValDec.fontSize = buttonFontSize;
            rValDec.text = currentColor.r.toString();
            rValDec.color = inputTextColor;
            rValDec.background = inputTextBackgroundColor;
            rValDec.onFocusObservable.add(() => {
                activeField = rValDec.name!;
                lastVal = rValDec.text;
            });
            rValDec.onBlurObservable.add(() => {
                if (parseFloat(rValDec.text) == 0) {
                    rValDec.text = "0";
                    UpdateFloat(rValDec, "r");
                }
                activeField = "";
            });
            rValDec.onTextChangedObservable.add(() => {
                UpdateFloat(rValDec, "r");
            });
            rgbValuesQuadrant.addControl(rValDec, 0, 2);

            gValDec = new InputText();
            gValDec.width = "200px";
            gValDec.height = "27px";
            gValDec.name = "gDecField"
            gValDec.fontSize = buttonFontSize;
            gValDec.text = currentColor.g.toString();
            gValDec.color = inputTextColor;
            gValDec.background = inputTextBackgroundColor;
            gValDec.onFocusObservable.add(() => {
                activeField = gValDec.name!;
                lastVal = gValDec.text;
            });
            gValDec.onBlurObservable.add(() => {
                if (parseFloat(gValDec.text) == 0) {
                    gValDec.text = "0";
                    UpdateFloat(gValDec, "g");
                }
                activeField = "";
            });
            gValDec.onTextChangedObservable.add(() => {
                UpdateFloat(gValDec, "g");
            });
            rgbValuesQuadrant.addControl(gValDec, 1, 2);

            bValDec = new InputText();
            bValDec.width = "200px";
            bValDec.height = "27px";
            bValDec.name = "bDecField";
            bValDec.fontSize = buttonFontSize;
            bValDec.text = currentColor.b.toString();
            bValDec.color = inputTextColor;
            bValDec.background = inputTextBackgroundColor;
            bValDec.onFocusObservable.add(() => {
                activeField = bValDec.name!;
                lastVal = bValDec.text;
            });
            bValDec.onBlurObservable.add(() => {
                if (parseFloat(bValDec.text) == 0) {
                    bValDec.text = "0";
                    UpdateFloat(bValDec, "b");
                }
                activeField = "";
            });
            bValDec.onTextChangedObservable.add(() => {
                UpdateFloat(bValDec, "b");
            });
            rgbValuesQuadrant.addControl(bValDec, 2, 2);

            // Hex value input
            var hexValueQuadrant = new Grid();
            hexValueQuadrant.width = "300px";
            hexValueQuadrant.addRowDefinition(1.0, false);
            hexValueQuadrant.addColumnDefinition(0.1, false);
            hexValueQuadrant.addColumnDefinition(0.9, false);
            pickerColorValues.addControl(hexValueQuadrant, 2, 0);

            var labelText = new TextBlock();
            labelText.text = "#";
            labelText.color = lightStrokeColor;
            labelText.fontSize = buttonFontSize;
            hexValueQuadrant.addControl(labelText, 0, 0);

            hexVal = new InputText();
            hexVal.width = "260px";
            hexVal.height = "27px";
            hexVal.name = "hexField"
            hexVal.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
            hexVal.left = "5px";
            hexVal.fontSize = buttonFontSize;
            var minusPound = options.lastColor.split("#");
            hexVal.text = minusPound[1];
            hexVal.color = inputTextColor;
            hexVal.background = inputTextBackgroundColor;
            hexVal.onFocusObservable.add(() => {
                activeField = hexVal.name!;
                lastVal = hexVal.text;
            });
            hexVal.onBlurObservable.add(() => {
                activeField = "";
                if (hexVal.text.length == 3) {
                    var val = hexVal.text.split("");
                    hexVal.text = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
                }
            });
            hexVal.onTextChangedObservable.add(() => {
                var newHexValue = hexVal.text;
                var checkHex = /[^0-9A-F]/i.test(newHexValue);
                if ((hexVal.text.length > 6 || checkHex) && activeField == hexVal.name) {
                    hexVal.text = lastVal;
                }
                else {
                    if (hexVal.text.length < 6) {
                        var leadingZero = 6 - hexVal.text.length;
                        for (var i = 0; i < leadingZero; i++) {
                            newHexValue = "0" + newHexValue;
                        }
                    }
                    if (hexVal.text.length == 3) {
                        var val = hexVal.text.split("");
                        newHexValue = val[0] + val[0] + val[1] + val[1] + val[2] + val[2];
                    }
                    lastVal = hexVal.text;
                    newHexValue = "#" + newHexValue;
                    if (activeField == hexVal.name) {
                        UpdateValues(Color3.FromHexString(newHexValue)); 
                    }
                }
            });
            hexValueQuadrant.addControl(hexVal, 0, 1);

            if (options.savedColors && options.savedColors.length > 0) {
                SaveColor("", butSave!); 
            } 
        });
    }
}