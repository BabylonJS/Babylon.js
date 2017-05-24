/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class TextBlock extends Control {
        private _text: string;
        private _textY: number;
        private _textWrapping = false;
        private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        private _lines: any[];
        private _totalHeight: number;

        public get textWrapping(): boolean {
            return this._textWrapping;
        }

        public set textWrapping(value: boolean) {
            if (this._textWrapping === value) {
                return;
            }
            this._textWrapping = value;
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

            this._applyStates(context);
            super._processMeasures(parentMeasure, context);
            
            // Render lines
            this._renderLines(context);

            context.restore();
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            this._lines = [];

            if (this._textWrapping) {
                var words = this.text.split(' ');
                var line = '';

                var width = this._currentMeasure.width;
                var lineWidth = 0;

                for(var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + ' ';
                    var metrics = context.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > width && n > 0) {
                        this._lines.push({text: line, width: lineWidth});
                        line = words[n] + ' ';
                        lineWidth = context.measureText(line).width;
                    }
                    else {
                        lineWidth = testWidth;
                        line = testLine;
                    }
                }
                this._lines.push({text: line, width: lineWidth});
            } else {
                this._lines.push({text: this.text, width: context.measureText(this.text).width});
            }
        }

        protected _renderLines(context: CanvasRenderingContext2D): void {
            var width = this._currentMeasure.width;
            var height = this._currentMeasure.height;
            
            if (!this._fontOffset) {
                this._fontOffset = Control._GetFontOffset(context.font);
            }
            var rootY = 0;
            switch (this._textVerticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_TOP:
                    rootY = this._fontOffset.ascent;
                    break;
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    rootY = height - this._fontOffset.height * (this._lines.length - 1) - this._fontOffset.descent;
                    break;
                case Control.VERTICAL_ALIGNMENT_CENTER:
                    rootY = this._fontOffset.ascent + (height - this._fontOffset.height * this._lines.length) / 2;
                    break;
            }

            rootY += this._currentMeasure.top;

            for (var line of this._lines) {
                this._drawText(line.text, line.width, rootY, context);
                rootY += this._fontOffset.height;
            }       
        }
    }    
}