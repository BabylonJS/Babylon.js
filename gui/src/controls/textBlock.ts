/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class TextBlock extends Control {
        private _text: string;
        private _textY: number;
        private _lineHeight: number;
        private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

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

        public get textHorizontalAlignment(): number {
            return this._textHorizontalAlignment;
        }

        public set textHorizontalAlignment(value: number) {
            if (this._textHorizontalAlignment === value) {
                return;
            }

            this._textHorizontalAlignment = value;
            this._markAsDirty();
        } 

        public get textVerticalAlignment(): number {
            return this._textVerticalAlignment;
        }

        public set textVerticalAlignment(value: number) {
            if (this._textVerticalAlignment === value) {
                return;
            }

            this._textVerticalAlignment = value;
            this._markAsDirty();
        } 

        constructor(public name: string, text: string) {
            super(name);

            this.text = text;
        }

        private _drawText(text: string, textWidth: number, y: number, context: CanvasRenderingContext2D): void {

            var width = this._currentMeasure.width;
            var x = 0;
            switch (this._textHorizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = width - textWidth;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (width - textWidth) / 2;
                    break;
            }

            context.fillText(text, this._currentMeasure.left + x, y);
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            super._processMeasures(parentMeasure, context);
            
            this.applyStates(context);

            this._computeTextAlignment(context);

            var words = this.text.split(' ');
            var line = '';

            var width = this._currentMeasure.width;
            var y = this._textY;
            var lineWidth = 0;
            for(var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + ' ';
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > width && n > 0) {
                    this._drawText(line, lineWidth, y, context);
                    line = words[n] + ' ';
                    lineWidth = context.measureText(line).width;
                    y += this._lineHeight;
                }
                else {
                    lineWidth = testWidth;
                    line = testLine;
                }
            }
            this._drawText(line, lineWidth, y, context);

            context.restore();
        }

        protected _computeTextAlignment(context: CanvasRenderingContext2D): void {
            var width = this._currentMeasure.width;
            var height = this._currentMeasure.height;

            
            var y = 0;
            if (!this._fontOffset) {
                this._fontOffset = Control._GetFontOffset(context.font);
            }

            switch (this._textVerticalAlignment) {
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

            this._lineHeight = this._fontOffset.height;            
            this._textY = this._currentMeasure.top + y;
        }
    }    
}