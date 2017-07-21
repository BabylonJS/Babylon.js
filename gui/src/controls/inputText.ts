/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class InputText extends Control {
        private _text = "";
        private _background = "black";   
        private _thickness = 1;
        private _margin = new ValueAndUnit(10, ValueAndUnit.UNITMODE_PIXEL);
        private _autoStretchWidth = true;        
        private _maxWidth = new ValueAndUnit(1, ValueAndUnit.UNITMODE_PERCENTAGE, false);

        public get maxWidth(): string | number {
            return this._maxWidth.toString(this._host);
        }

        public set maxWidth(value: string | number ) {
            if (this._maxWidth.toString(this._host) === value) {
                return;
            }

            if (this._maxWidth.fromString(value)) {
                this._markAsDirty();
            }
        }        

        public get margin(): string {
            return this._margin.toString(this._host);
        }

        public set margin(value: string) {
            if (this._margin.toString(this._host) === value) {
                return;
            }

            if (this._margin.fromString(value)) {
                this._markAsDirty();
            }
        }   
        
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

        public get text(): string {
            return this._text;
        }

        public set text(value: string) {
            if (this._text === value) {
                return;
            }
            this._text = value;
            this._markAsDirty();
        }

        constructor(public name?: string, text: string = "") {
            super(name);

            this.text = text;
        }

        protected _getTypeName(): string {
            return "InputText";
        }

       public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                
                // Background
                if (this._background) {
                    context.fillStyle = this._background;

                    context.fillRect(this._currentMeasure.left, this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
                }

                // Text
                if (this._text) {
                    if (this.color) {
                        context.fillStyle = this.color;
                    }

                    let rootY = this._fontOffset.ascent + (this._currentMeasure.height - this._fontOffset.height) / 2;
                    context.fillText(this._text, this._currentMeasure.left + this._margin.getValueInPixel(this._host, parentMeasure.width), this._currentMeasure.top + rootY);

                    if (this._autoStretchWidth) {
                        this.width = Math.min(this._maxWidth.getValueInPixel(this._host, parentMeasure.width), context.measureText(this._text).width + this._margin.getValueInPixel(this._host, parentMeasure.width) * 2) + "px";
                    }
                }

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
    }
}
