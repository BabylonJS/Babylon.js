/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class TextBlock extends Control {
        private _text: string;

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

        constructor(public name: string, text: string) {
            super(name);

            this.text = text;
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();
            
            this.applyStates(context);

            this._prepare(parentMeasure, context)

            context.fillText(this.text, this._currentMeasure.left, this._currentMeasure.top);

            context.restore();
        }

        private _prepare(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var width = parentMeasure.width;
            var height = parentMeasure.height;

            var x = 0;
            var y = 0;

            var textSize = context.measureText(this.text);
            switch (this.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = width - textSize.width;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (width - textSize.width) / 2;
                    break;
            }

            if (!this._fontOffset) {
                this._fontOffset = Control._GetFontOffset(context.font);
            }

            switch (this.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_TOP:
                    y = this._fontOffset.ascent;
                    break;
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    y = height - this._fontOffset.descent;
                    break;
                case Control.VERTICAL_ALIGNMENT_CENTER:
                    y = (height /2) + (this._fontOffset.ascent - this._fontOffset.height / 2);
                    break;
            }
            
            this._currentMeasure = new Measure(parentMeasure.left + x, parentMeasure.top + y, width, height);
        }
    }    
}