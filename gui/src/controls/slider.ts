/// <reference path="../../../dist/preview release/babylon.d.ts"/>

var DOMImage = Image;

module BABYLON.GUI {
    export class Slider extends Control {
        private _barHeight = new ValueAndUnit(0.5, ValueAndUnit.UNITMODE_PERCENTAGE, false);

        constructor(public name?: string) {
            super(name);
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);
            if (this._processMeasures(parentMeasure, context)) {
                // Main bar
                var effectiveBarHeight = 0;

                if (this._barHeight.isPixel) {
                    effectiveBarHeight = Math.min(this._barHeight.getValue(this._host), this._currentMeasure.height);
                } else {
                    effectiveBarHeight = this._currentMeasure.height * this._barHeight.getValue(this._host); 
                }

                context.fillRect(this._currentMeasure.left, this._currentMeasure.top + (this._currentMeasure.height - effectiveBarHeight) / 2, this._currentMeasure.width, effectiveBarHeight);
            }
            context.restore();
        }
    }    
}
