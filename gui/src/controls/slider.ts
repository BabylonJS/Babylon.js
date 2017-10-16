/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Slider extends Control {
        private _thumbWidth = new ValueAndUnit(30, ValueAndUnit.UNITMODE_PIXEL, false);
        private _minimum = 0; 
        private _maximum = 100;
        private _value = 50;
        private _background = "black";   
        private _borderColor = "white";
        private _barOffset = new ValueAndUnit(5, ValueAndUnit.UNITMODE_PIXEL, false);

        public onValueChangedObservable = new Observable<number>();

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

        public get barOffset(): string | number  {
            return this._barOffset.toString(this._host);
        }

        public get barOffsetInPixels(): number  {
            return this._barOffset.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }            

        public set barOffset(value: string | number ) {
            if (this._barOffset.toString(this._host) === value) {
                return;
            }

            if (this._barOffset.fromString(value)) {
                this._markAsDirty();
            }
        }      

        public get thumbWidth(): string | number  {
            return this._thumbWidth.toString(this._host);
        }

        public get thumbWidthInPixels(): number  {
            return this._thumbWidth.getValueInPixel(this._host, this._cachedParentMeasure.width);
        }          

        public set thumbWidth(value: string | number ) {
            if (this._thumbWidth.toString(this._host) === value) {
                return;
            }

            if (this._thumbWidth.fromString(value)) {
                this._markAsDirty();
            }
        }              

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
                var effectiveThumbWidth;
                var effectiveBarOffset;

                if (this._thumbWidth.isPixel) {
                    effectiveThumbWidth = Math.min(this._thumbWidth.getValue(this._host), this._currentMeasure.height);
                } else {
                    effectiveThumbWidth = this._currentMeasure.height * this._thumbWidth.getValue(this._host); 
                }

                if (this._barOffset.isPixel) {
                    effectiveBarOffset = Math.min(this._barOffset.getValue(this._host), this._currentMeasure.height);
                } else {
                    effectiveBarOffset = this._currentMeasure.height * this._barOffset.getValue(this._host); 
                }                


                var left = this._currentMeasure.left + effectiveThumbWidth / 2;
                var width = this._currentMeasure.width - effectiveThumbWidth;
                var thumbPosition = (this._value - this._minimum) / (this._maximum - this._minimum) * width;

                // Bar
                context.fillStyle = this._background;
                context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, width, this._currentMeasure.height - effectiveBarOffset * 2);

                context.fillStyle = this.color;
                context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);

                // Thumb
                context.fillRect(left + thumbPosition - effectiveThumbWidth / 2, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);

                context.strokeStyle = this._borderColor;
                context.strokeRect(left + thumbPosition - effectiveThumbWidth / 2, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
            }
            context.restore();
        }

        // Events
        private _pointerIsDown = false;

        private _updateValueFromPointer(x: number): void {
            this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
        }

        public _onPointerDown(target: Control, coordinates: Vector2, buttonIndex: number): boolean {
            if (!super._onPointerDown(target, coordinates, buttonIndex)) {
                return false;
            }

            this._pointerIsDown = true;

            this._updateValueFromPointer(coordinates.x);
            this._host._capturingControl = this;

            return true;
        }

        public _onPointerMove(target: Control, coordinates: Vector2): void {
            if (this._pointerIsDown) {
                this._updateValueFromPointer(coordinates.x);
            }

            super._onPointerMove(target, coordinates);
        }

        public _onPointerUp (target: Control, coordinates: Vector2, buttonIndex: number): void {
            this._pointerIsDown = false;
            
            this._host._capturingControl = null;
            super._onPointerUp(target, coordinates, buttonIndex);
        }         
    }    
}
