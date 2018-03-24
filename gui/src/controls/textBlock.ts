/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class TextBlock extends Control {
        private _text = "";
        private _textWrapping = false;
        private _textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        private _textVerticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;

        private _lines: any[];
        private _resizeToFit: boolean = false;
        private _lineSpacing: ValueAndUnit = new ValueAndUnit(0);
        private _outlineWidth: number = 0;
        private _outlineColor: string = "white";
        /**
        * An event triggered after the text is changed
        */
        public onTextChangedObservable = new Observable<TextBlock>();

        /**
        * An event triggered after the text was broken up into lines
        */
        public onLinesReadyObservable = new Observable<TextBlock>();

        /**
         * Return the line list (you may need to use the onLinesReadyObservable to make sure the list is ready)
         */
        public get lines(): any[] {
            return this._lines;
        }
        
        /**
         * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
         */
        public get resizeToFit(): boolean {
            return this._resizeToFit;
        }

        /**
         * Gets or sets an boolean indicating that the TextBlock will be resized to fit container
         */        
        public set resizeToFit(value: boolean) {
            this._resizeToFit = value;

            if (this._resizeToFit) {
                this._width.ignoreAdaptiveScaling = true;
                this._height.ignoreAdaptiveScaling = true;
            }
        }

        /**
         * Gets or sets a boolean indicating if text must be wrapped
         */
        public get textWrapping(): boolean {
            return this._textWrapping;
        }

        /**
         * Gets or sets a boolean indicating if text must be wrapped
         */        
        public set textWrapping(value: boolean) {
            if (this._textWrapping === value) {
                return;
            }
            this._textWrapping = value;
            this._markAsDirty();
        }

        /**
         * Gets or sets text to display
         */
        public get text(): string {
            return this._text;
        }

        /**
         * Gets or sets text to display
         */
        public set text(value: string) {
            if (this._text === value) {
                return;
            }
            this._text = value;
            this._markAsDirty();

            this.onTextChangedObservable.notifyObservers(this);
        }

        /**
         * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
         */
        public get textHorizontalAlignment(): number {
            return this._textHorizontalAlignment;
        }

        /**
         * Gets or sets text horizontal alignment (BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER by default)
         */        
        public set textHorizontalAlignment(value: number) {
            if (this._textHorizontalAlignment === value) {
                return;
            }

            this._textHorizontalAlignment = value;
            this._markAsDirty();
        }

        /**
         * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
         */        
        public get textVerticalAlignment(): number {
            return this._textVerticalAlignment;
        }

        /**
         * Gets or sets text vertical alignment (BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER by default)
         */           
        public set textVerticalAlignment(value: number) {
            if (this._textVerticalAlignment === value) {
                return;
            }

            this._textVerticalAlignment = value;
            this._markAsDirty();
        }

        /**
         * Gets or sets line spacing value
         */
        public set lineSpacing(value: string | number) {
            if (this._lineSpacing.fromString(value)) {
                this._markAsDirty();
            }
        }

        /**
         * Gets or sets line spacing value
         */        
        public get lineSpacing(): string | number {
            return this._lineSpacing.toString(this._host);
        }

        /**
         * Gets or sets outlineWidth of the text to display
         */
        public get outlineWidth(): number {
            return this._outlineWidth;
        }

        /**
         * Gets or sets outlineWidth of the text to display
         */
        public set outlineWidth(value: number) {
            if (this._outlineWidth === value) {
                return;
            }
            this._outlineWidth = value;
            this._markAsDirty();
        }

        /**
         * Gets or sets outlineColor of the text to display
         */
        public get outlineColor(): string {
            return this._outlineColor;
        }

        /**
         * Gets or sets outlineColor of the text to display
         */
        public set outlineColor(value: string) {
            if (this._outlineColor === value) {
                return;
            }
            this._outlineColor = value;
            this._markAsDirty();
        }

        /**
         * Creates a new TextBlock object
         * @param name defines the name of the control
         * @param text defines the text to display (emptry string by default)
         */
        constructor(
            /**
             * Defines the name of the control
             */
            public name?: string, 
            text: string = "") {
            super(name);

            this.text = text;
        }

        protected _getTypeName(): string {
            return "TextBlock";
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

            if (this.shadowBlur || this.shadowOffsetX || this.shadowOffsetY) {
                context.shadowColor = this.shadowColor;
                context.shadowBlur = this.shadowBlur;
                context.shadowOffsetX = this.shadowOffsetX;
                context.shadowOffsetY = this.shadowOffsetY;
            }

            if (this.outlineWidth) {
                context.strokeText(text, this._currentMeasure.left + x, y);
            }
            context.fillText(text, this._currentMeasure.left + x, y);
        }

        /** @ignore */
        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            context.save();

            this._applyStates(context);

            if (this._processMeasures(parentMeasure, context)) {
                // Render lines
                this._renderLines(context);
            }
            context.restore();
        }

        protected _applyStates(context: CanvasRenderingContext2D): void {
            super._applyStates(context);
            if (this.outlineWidth) {
                context.lineWidth = this.outlineWidth;
                context.strokeStyle = this.outlineColor;
            }
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            this._lines = [];
            var _lines = this.text.split("\n");

            if (this._textWrapping && !this._resizeToFit) {
                for (var _line of _lines) {
                    this._lines.push(this._parseLineWithTextWrapping(_line, context));
                }
            } else {
                for (var _line of _lines) {
                    this._lines.push(this._parseLine(_line, context));
                }
            }

            this.onLinesReadyObservable.notifyObservers(this);
        }

        protected _parseLine(line: string = '', context: CanvasRenderingContext2D): object {
            return { text: line, width: context.measureText(line).width };
        }

        protected _parseLineWithTextWrapping(line: string = '', context: CanvasRenderingContext2D): object {
            var words = line.split(' ');
            var width = this._currentMeasure.width;
            var lineWidth = 0;

            for (var n = 0; n < words.length; n++) {
                var testLine = n > 0 ? line + " " + words[n] : words[0];
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > width && n > 0) {
                    this._lines.push({ text: line, width: lineWidth });
                    line = words[n];
                    lineWidth = context.measureText(line).width;
                }
                else {
                    lineWidth = testWidth;
                    line = testLine;
                }
            }

            return { text: line, width: lineWidth };
        }

        protected _renderLines(context: CanvasRenderingContext2D): void {
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

            var maxLineWidth: number = 0;

            for (let i = 0; i < this._lines.length; i++) {
                const line = this._lines[i];

                if (i !== 0 && this._lineSpacing.internalValue !== 0) {

                    if (this._lineSpacing.isPixel) {
                        rootY += this._lineSpacing.getValue(this._host);
                    } else {                        
                        rootY = rootY + (this._lineSpacing.getValue(this._host) * this._height.getValueInPixel(this._host,  this._cachedParentMeasure.height));
                    }
                }

                this._drawText(line.text, line.width, rootY, context);
                rootY += this._fontOffset.height;

                if (line.width > maxLineWidth) maxLineWidth = line.width;
            }

            if (this._resizeToFit) {
                this.width = this.paddingLeftInPixels + this.paddingRightInPixels + maxLineWidth + 'px';
                this.height = this.paddingTopInPixels + this.paddingBottomInPixels + this._fontOffset.height * this._lines.length + 'px';
            }
        }

        dispose(): void {
            super.dispose();

            this.onTextChangedObservable.clear();
        }
    }
}