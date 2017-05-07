/// <reference path="../../../dist/preview release/babylon.d.ts"/>

module BABYLON.GUI {
    export class Control {        
        private _zIndex = 0;
        public _root: Container;
        public _host: AdvancedDynamicTexture;
        public _currentMeasure = Measure.Empty();
        private _fontFamily: string;
        private _fontSize = 18;
        private _font: string;
        private _width = 1;
        private _height = 1;
        private _lastMeasuredFont: string;
        protected _fontOffset: {ascent: number, height: number, descent: number};
        private _color: string;
        private _horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
        private _verticalAlignment = Control.VERTICAL_ALIGNMENT_CENTER;
        private _isDirty = true;
        private _cachedParentMeasure = Measure.Empty();
        private _marginLeft = 0;
        private _marginRight = 0;
        private _marginTop = 0;
        private _marginBottom = 0;        
        private _unitMode = Control.UNITMODE_PERCENTAGE;
        
        // Properties
        public get unitMode(): number {
            return this._unitMode;
        }

        public set unitMode(value: number) {
            if (this._unitMode === value) {
                return;
            }

            this._unitMode = value;
            this._markAsDirty();
        } 

        public get horizontalAlignment(): number {
            return this._horizontalAlignment;
        }

        public set horizontalAlignment(value: number) {
            if (this._horizontalAlignment === value) {
                return;
            }

            this._horizontalAlignment = value;
            this._markAsDirty();
        } 

        public get verticalAlignment(): number {
            return this._verticalAlignment;
        }

        public set verticalAlignment(value: number) {
            if (this._verticalAlignment === value) {
                return;
            }

            this._verticalAlignment = value;
            this._markAsDirty();
        } 

        public get width(): number {
            return this._width;
        }

        public set width(value: number) {
            if (value < 0) {
                value = 0;
            }
            if (this._width === value) {
                return;
            }

            this._width = value;
            this._markAsDirty();
        }

        public get height(): number {
            return this._height;
        }

        public set height(value: number) {
            if (value < 0) {
                value = 0;
            }
            if (this._height === value) {
                return;
            }

            this._height = value;
            this._markAsDirty();
        }   

        public get fontFamily(): string {
            return this._fontFamily;
        }

        public set fontFamily(value: string) {
            if (this._fontFamily === value) {
                return;
            }

            this._fontFamily = value;
            this._prepareFont();
        }

        public get fontSize(): number {
            return this._fontSize;
        }

        public set fontSize(value: number) {
            if (this._fontSize === value) {
                return;
            }

            this._fontSize = value;
            this._prepareFont();
        }

        public get color(): string {
            return this._color;
        }

        public set color(value: string) {
            if (this._color === value) {
                return;
            }

            this._color = value;
            this._markAsDirty();
        }                       

        public get zIndex(): number {
            return this._zIndex;
        }

        public set zIndex(value: number) {
            if (this.zIndex === value) {
                return;
            }

            this._zIndex = value;
            this._root._reOrderControl(this);
        }

        public get isDirty(): boolean {
            return this._isDirty;
        }
        
        public get marginLeft(): number {
            return this._marginLeft;
        }

        public set marginLeft(value: number) {
            if (this._marginLeft === value) {
                return;
            }

            this._marginLeft = value;
            this._markAsDirty();
        }    

        public get marginRight(): number {
            return this._marginRight;
        }

        public set marginRight(value: number) {
            if (this._marginRight === value) {
                return;
            }

            this._marginRight = value;
            this._markAsDirty();
        }

        public get marginTop(): number {
            return this._marginTop;
        }

        public set marginTop(value: number) {
            if (this._marginTop === value) {
                return;
            }

            this._marginTop = value;
            this._markAsDirty();
        }

        public get marginBottom(): number {
            return this._marginBottom;
        }

        public set marginBottom(value: number) {
            if (this._marginBottom === value) {
                return;
            }

            this._marginBottom = value;
            this._markAsDirty();
        }                

        // Functions
        constructor(public name: string) {
            this.fontFamily = "Arial";
        }

        protected _markAsDirty(): void {            
            this._isDirty = true;

            if (!this._root) {
                return; // Not yet connected
            }
            this._root._markAsDirty();
        }

        public _link(root: Container, host: AdvancedDynamicTexture): void {
            this._root = root;
            this._host = host;
        }

        protected applyStates(context: CanvasRenderingContext2D): void {
            if (this._font) {
                context.font = this._font;
            }

            if (this._color) {
                context.fillStyle = this._color;
            }
        }

        protected _processMeasures(parentMeasure: Measure, context: CanvasRenderingContext2D) {     
            if (this._isDirty || !this._cachedParentMeasure.isEqualsTo(parentMeasure)) {
                this._currentMeasure.copyFrom(parentMeasure);

                this._measure(parentMeasure, context);
                this._computeAlignment(parentMeasure, context);
                this._additionalProcessing(parentMeasure, context);
            }      
                        
            // Clip
            context.beginPath();
            context.rect(this._currentMeasure.left ,this._currentMeasure.top, this._currentMeasure.width, this._currentMeasure.height);
            context.clip();

            this._isDirty = false;
            this._cachedParentMeasure.copyFrom(parentMeasure);
        }

        protected _measure(parentMeasure: Measure, context: CanvasRenderingContext2D): void {  
            // Width / Height
            if (this._unitMode === Control.UNITMODE_PIXEL) {
                this._currentMeasure.width = this._width;
            } else {
                this._currentMeasure.width *= this._width; 
            }

            if (this._unitMode === Control.UNITMODE_PIXEL) {
                this._currentMeasure.height = this._height;
            } else {
                this._currentMeasure.height *= this._height; 
            }
        }

        protected _computeAlignment(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            var width = this._currentMeasure.width;
            var height = this._currentMeasure.height;

            var parentWidth = parentMeasure.width;
            var parentHeight = parentMeasure.height;

            // Left / top
            var x = 0;
            var y = 0;

            switch (this.horizontalAlignment) {
                case Control.HORIZONTAL_ALIGNMENT_LEFT:
                    x = 0
                    break;
                case Control.HORIZONTAL_ALIGNMENT_RIGHT:
                    x = parentWidth - width;
                    break;
                case Control.HORIZONTAL_ALIGNMENT_CENTER:
                    x = (parentWidth - width) / 2;
                    break;
            }

            switch (this.verticalAlignment) {
                case Control.VERTICAL_ALIGNMENT_TOP:
                    y = 0;
                    break;
                case Control.VERTICAL_ALIGNMENT_BOTTOM:
                    y = parentHeight - height;
                    break;
                case Control.VERTICAL_ALIGNMENT_CENTER:
                    y = (parentHeight - height) / 2;
                    break;
            }
            
            if (this._unitMode === Control.UNITMODE_PIXEL) {
                this._currentMeasure.left += this._marginLeft;
                this._currentMeasure.left -= this._marginRight;
                this._currentMeasure.top += this._marginTop;
                this._currentMeasure.top -= this._marginBottom;
            } else {
                this._currentMeasure.left += parentWidth * this._marginLeft;
                this._currentMeasure.left -= parentWidth * this._marginRight;
                this._currentMeasure.top += parentHeight * this._marginTop;
                this._currentMeasure.top -= parentHeight * this._marginBottom;
            }

            this._currentMeasure.left += x;
            this._currentMeasure.top += y;            
        }

        protected _additionalProcessing(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }

        public _draw(parentMeasure: Measure, context: CanvasRenderingContext2D): void {
            // Do nothing
        }

        private _prepareFont() {
            if (!this._fontFamily) {
                return;
            }

            this._font = this._fontSize + "px " + this._fontFamily;
        
            this._fontOffset = Control._GetFontOffset(this._font);
            this._markAsDirty();
        }

        // Statics
        private static _HORIZONTAL_ALIGNMENT_LEFT = 0;
        private static _HORIZONTAL_ALIGNMENT_RIGHT = 1;
        private static _HORIZONTAL_ALIGNMENT_CENTER = 2;
        
        private static _VERTICAL_ALIGNMENT_TOP = 0;
        private static _VERTICAL_ALIGNMENT_BOTTOM = 1;
        private static _VERTICAL_ALIGNMENT_CENTER = 2;

        private static _UNITMODE_PERCENTAGE = 0;
        private static _UNITMODE_PIXEL = 1;

        public static get UNITMODE_PERCENTAGE(): number {
            return Control._UNITMODE_PERCENTAGE;
        }

        public static get UNITMODE_PIXEL(): number {
            return Control._UNITMODE_PIXEL;
        }

        public static get HORIZONTAL_ALIGNMENT_LEFT(): number {
            return Control._HORIZONTAL_ALIGNMENT_LEFT;
        }

        public static get HORIZONTAL_ALIGNMENT_RIGHT(): number {
            return Control._HORIZONTAL_ALIGNMENT_RIGHT;
        }

        public static get HORIZONTAL_ALIGNMENT_CENTER(): number {
            return Control._HORIZONTAL_ALIGNMENT_CENTER;
        }

        public static get VERTICAL_ALIGNMENT_TOP(): number {
            return Control._VERTICAL_ALIGNMENT_TOP;
        }

        public static get VERTICAL_ALIGNMENT_BOTTOM(): number {
            return Control._VERTICAL_ALIGNMENT_BOTTOM;
        }

        public static get VERTICAL_ALIGNMENT_CENTER(): number {
            return Control._VERTICAL_ALIGNMENT_CENTER;
        }

        private static _FontHeightSizes = {};

        public static _GetFontOffset(font: string): {ascent: number, height: number, descent: number} {

            if (Control._FontHeightSizes[font]) {
                return Control._FontHeightSizes[font];
            }

            var text = document.createElement("span");
            text.innerHTML = "Hg";
            text.style.font = font;

            var block = document.createElement("div");
            block.style.display = "inline-block";
            block.style.width = "1px";
            block.style.height = "0px";
            block.style.verticalAlign = "bottom";

            var div = document.createElement("div");
            div.appendChild(text);
            div.appendChild(block);

            document.body.appendChild(div);

            var fontAscent = 0;
            var fontHeight = 0;
            try {
                fontHeight = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
                block.style.verticalAlign = "baseline";
                fontAscent = block.getBoundingClientRect().top - text.getBoundingClientRect().top;
            } finally {
                div.remove();
            }
            var result = { ascent: fontAscent, height: fontHeight, descent: fontHeight - fontAscent };
            Control._FontHeightSizes[font] = result;

            return result;
        };
    }    
}