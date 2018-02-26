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
        private _isThumbCircle = false;
        private _isThumbClamped = false;

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

        public get barOffset(): string | number {
            return this._barOffset.toString(this._host);
        }

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

        public get thumbWidth(): string | number {
            return this._thumbWidth.toString(this._host);
        }

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

                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }

                var left = this._currentMeasure.left;
                var width = this._currentMeasure.width - effectiveThumbWidth;
                var thumbPosition = ((this._value - this._minimum) / (this._maximum - this._minimum)) * width;

                context.fillStyle = this._background;
                if (this.isThumbClamped) {
                    context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, width + effectiveThumbWidth, this._currentMeasure.height - effectiveBarOffset * 2);
                }
                else {
                    context.fillRect(left + (effectiveThumbWidth / 2), this._currentMeasure.top + effectiveBarOffset, width, this._currentMeasure.height - effectiveBarOffset * 2);
                }

                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowBlur = 0;
                    context.shadowOffsetX = 0;
                    context.shadowOffsetY = 0;
                }

                context.fillStyle = this.color;
                if (this.isThumbClamped) {
                    context.fillRect(left, this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);
                }
                else {
                    context.fillRect(left + (effectiveThumbWidth / 2), this._currentMeasure.top + effectiveBarOffset, thumbPosition, this._currentMeasure.height - effectiveBarOffset * 2);
                }

                if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                    context.shadowColor = this.shadowColor;
                    context.shadowBlur = this.shadowBlur;
                    context.shadowOffsetX = this.shadowOffsetX;
                    context.shadowOffsetY = this.shadowOffsetY;
                }

                if (this._isThumbCircle) {
                    context.beginPath();
                    context.arc(left + thumbPosition + (effectiveThumbWidth / 2), this._currentMeasure.top + this._currentMeasure.height / 2, effectiveThumbWidth / 2, 0, 2 * Math.PI);
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
                    context.fillRect(left + thumbPosition, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);

                    if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                        context.shadowBlur = 0;
                        context.shadowOffsetX = 0;
                        context.shadowOffsetY = 0;
                    }

                    context.strokeStyle = this._borderColor;
                    context.strokeRect(left + thumbPosition, this._currentMeasure.top, effectiveThumbWidth, this._currentMeasure.height);
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
            }
            this.value = this._minimum + ((x - this._currentMeasure.left) / this._currentMeasure.width) * (this._maximum - this._minimum);
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
