/// <reference path="../../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    /**
     * Class used to create slider controls
     */
    export class Slider extends Control {
        private _thumbWidth = new ValueAndUnit(20, ValueAndUnit.UNITMODE_PIXEL, false);
        private _thumbHeight = new ValueAndUnit(20, ValueAndUnit.UNITMODE_PIXEL, false);
        private _minimum = 0;
        private _maximum = 100;
        private _value = 50;
        private _isVertical = false;
        private _background = "black";
        private _borderColor = "white";
        private _barOffset = new ValueAndUnit(5, ValueAndUnit.UNITMODE_PIXEL, false);
        private _isThumbCircle = false;
        private _isThumbClamped = false;

        /** Observable raised when the sldier value changes */
        public onValueChangedObservable = new Observable<number>();

        /** Gets or sets border color */
        public get borderColor(): string {
            return this._borderColor;
        }

        public set borderColor(value: string) {
            if (this._borderColor === value) {
                return;
            }

            this._borderColor = value;
            this._markAsDirty();
        }

        /** Gets or sets background color */
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

        /** Gets or sets main bar offset */
        public get barOffset(): string | number {
            return this._barOffset.toString(this._host);
        }

        /** Gets main bar offset in pixels*/
        public get barOffsetInPixels(): number {
            return this._barOffset.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }

        public set barOffset(value: string | number) {
            if (this._barOffset.toString(this._host) === value) {
                return;
            }

            if (this._barOffset.fromString(value)) {
                this._markAsDirty();
            }
        }

        /** Gets or sets thumb width */
        public get thumbWidth(): string | number {
            return this._thumbWidth.toString(this._host);
        }

        /** Gets thumb width in pixels */       
        public get thumbWidthInPixels(): number {
            return this._thumbWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }

        public set thumbWidth(value: string | number) {
            if (this._thumbWidth.toString(this._host) === value) {
                return;
            }

            if (this._thumbWidth.fromString(value)) {
                this._markAsDirty();
            }
        }

        /** Gets or sets minimum value */
        public get minimum(): number {
            return this._minimum;
        }

        public set minimum(value: number) {
            if (this._minimum === value) {
                return;
            }

            this._minimum = value;
            this._markAsDirty();

            this.value = Math.max(Math.min(this.value, this._maximum), this._minimum);
        }

        /** Gets or sets maximum value */        
        public get maximum(): number {
            return this._maximum;
        }

        public set maximum(value: number) {
            if (this._maximum === value) {
                return;
            }

            this._maximum = value;
            this._markAsDirty();

            this.value = Math.max(Math.min(this.value, this._maximum), this._minimum);
        }

        /** Gets or sets current value */
        public get value(): number {
            return this._value;
        }

        public set value(value: number) {
            value = Math.max(Math.min(value, this._maximum), this._minimum);

            if (this._value === value) {
                return;
            }

            this._value = value;
            this._markAsDirty();
            this.onValueChangedObservable.notifyObservers(this._value);
        }

        /**Gets or sets a boolean indicating if the slider should be vertical or horizontal */
        public get isVertical(): boolean {
            return this._isVertical;
        }

        public set isVertical(value: boolean) {
            if(this._isVertical === value){
                return;
            }

            this._isVertical = value;
            this._markAsDirty();
        }

        /** Gets or sets a boolean indicating if the thumb should be round or square */
        public get isThumbCircle(): boolean {
            return this._isThumbCircle;
        }

        public set isThumbCircle(value: boolean) {
            if (this._isThumbCircle === value) {
                return;
            }

            this._isThumbCircle = value;
            this._markAsDirty();
        }

        /** Gets or sets a value indicating if the thumb can go over main bar extends */
        public get isThumbClamped(): boolean {
            return this._isThumbClamped;
        }

        public set isThumbClamped(value: boolean) {
            if (this._isThumbClamped === value) {
                return;
            }

            this._isThumbClamped = value;
            this._markAsDirty();
        }

       /**
        * Creates a new Slider
        * @param name defines the control name
        */
        constructor(public name?: string) {
            super(name);

            this.isPointerBlocker = true;
        }

        protected _getTypeName(): string {
            return "Slider";
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                // Main bar
                var effectiveThumbWidth = 0;//for horizontal slider 
                var effectiveBarOffset = 0; 
                var effectiveThumbHeight = 0; //for vertical slider

                //throw error when height is less than width for vertical slider
                if(this._isVertical && this._currentMeasure.height < this._currentMeasure.width){
                    console.error("Height should be greater than width");
                    return;
                } 
                if(this._isVertical){
                    if (this._thumbWidth.isPixel) {
                        effectiveThumbHeight = Math.min(this._thumbHeight.getValue(this._host), this._currentMeasure.height);
                    }
                    else {
                        effectiveThumbHeight = this._currentMeasure.height * this._thumbHeight.getValue(this._host);
                    } 
                    if (this._barOffset.isPixel) {
                        effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), this._currentMeasure.width);
                    }
                    else {
                        effectiveBarOffset = this._currentMeasure.width * this._barOffset.getValue(this._host);
                    }
                }
                else{
                    if (this._thumbWidth.isPixel) {
                        effectiveThumbWidth = Math.min(this._thumbWidth.getValue(this._host), this._currentMeasure.width);
                    }
                    else {
                        effectiveThumbWidth = this._currentMeasure.width * this._thumbWidth.getValue(this._host);
                    }

                    if (this._barOffset.isPixel) {
                        effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), this._currentMeasure.height);
                    }
                    else {
                        effectiveBarOffset = this._currentMeasure.height * this._barOffset.getValue(this._host);
                    }
                }

                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }

                var left = this._currentMeasure.left;
                var top = this._currentMeasure.top;
                var width = this._currentMeasure.width - effectiveThumbWidth;
                var height = this._currentMeasure.height - effectiveThumbHeight;

                var thumbPosition = (this._isVertical)? ((this._maximum - this._value ) / (this._maximum - this._minimum)) * height:((this._value - this._minimum) / (this._maximum - this._minimum)) * width;

                context.fillStyle = this._background;
                if(this._isVertical){
                    if (this.isThumbClamped) {
                        context.fillRect(left  + effectiveBarOffset, top, width - effectiveBarOffset * 2, height + effectiveThumbHeight);
                    }
                    else {
                        context.fillRect(left + effectiveBarOffset, top + (effectiveThumbHeight / 2), width - effectiveBarOffset * 2, height);
                    }
                }
                else{
                    if (this.isThumbClamped) {
                        context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, width + effectiveThumbWidth, this._currentMeasure.height - effectiveBarOffset * 2);
                    }
                    else {
                        context.fillRect(left + (effectiveThumbWidth / 2), this._currentMeasure.top + effectiveBarOffset, width, this._currentMeasure.height - effectiveBarOffset * 2);
                    }
                }

                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }

                context.fillStyle = this.color;
                if(this._isVertical){
                    if (this.isThumbClamped) {
                        context.fillRect(left + effectiveBarOffset, this._currentMeasure.top, this._currentMeasure.width - effectiveBarOffset * 2, thumbPosition);
                    }
                    else {
                        context.fillRect(left + effectiveBarOffset, this._currentMeasure.top + (effectiveThumbHeight / 2), this._currentMeasure.width - effectiveBarOffset * 2, thumbPosition);
                    }
                }
                else{
                    if (this.isThumbClamped) {
                        context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);
                    }
                    else {
                        context.fillRect(left + (effectiveThumbWidth / 2), this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);
                    }
                }

                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }

                if (this._isThumbCircle) {
                    context.beginPath();

                    if(this._isVertical){
                        context.arc(left + this._currentMeasure.width / 2, top + thumbPosition + (effectiveThumbHeight / 2), width / 2, 0, 2 * Math.PI);
                    }
                    else{
                        context.arc(left + thumbPosition + (effectiveThumbWidth / 2), top + this._currentMeasure.height / 2, height / 2, 0, 2 * Math.PI);
                    } 
                    context.fill();

                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }

                    context.strokeStyle = this._borderColor;
                    context.stroke();
                }
                else {
                    if(this._isVertical){
                        context.fillRect(left, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, effectiveThumbHeight);
                    }
                    else{
                        context.fillRect(left + thumbPosition, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
                    }

                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }

                    context.strokeStyle = this._borderColor;
                    if(this._isVertical){
                        context.strokeRect(left, this._currentMeasure.top + thumbPosition, this._currentMeasure.width, effectiveThumbHeight);
                    }
                    else{
                        context.strokeRect(left + thumbPosition, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
                    }
                }
            }
            context.restore();
        }


        // Events
        private _pointerIsDown = false;

        private _updateValueFromPointer(x: number, y: number): void {
            if (this.rotation != 0) {
                this._invertTransformMatrix.transformCoordinates(x, y, this._transformedPosition);
                x = this._transformedPosition.x;
                y = this._transformedPosition.y;
            }
            
            if(this._isVertical){
                this.value = this._minimum + (1 - ((y - this._currentMeasure.top) / this._currentMeasure.height)) * (this._maximum - this._minimum);
            }
            else{
                this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
            }
        }

        public _onPointerDown(target: Control, coordinates: Vector2, pointerId:number, buttonIndex: number): boolean {
            if (!super._onPointerDown(target, coordinates, pointerId, buttonIndex)) {
                return false;
            }

            this._pointerIsDown = true;

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

        public _onPointerUp(target: Control, coordinates: Vector2, pointerId:number, buttonIndex: number, notifyClick: boolean): void {
            this._pointerIsDown = false;

            delete this._host._capturingControl[pointerId];
            super._onPointerUp(target, coordinates, pointerId, buttonIndex, notifyClick);
        }
    }
}
